/**
 * CSS purge + minify — used by scripts/build.js.
 *
 * Extracted into its own module so the parser can be unit-tested
 * (build.js runs the build at import time and cannot be imported by tests).
 */

// ---------------------------------------------------------------------------
// CSS class extractor
// ---------------------------------------------------------------------------

export function extractUsedClasses(htmlContents, jsContents, safelist = []) {
  const used = new Set()

  // Extract from class="..." in rendered HTML (no template expressions to worry about)
  for (const content of htmlContents) {
    const re = /class=["']([^"'\n]+)["']/g
    let m
    while ((m = re.exec(content)) !== null) {
      for (const cls of m[1].trim().split(/\s+/)) {
        if (cls) used.add(cls)
      }
    }
  }

  // Extract from class= attributes in JS source. Template literal class attributes
  // like class="foo${expr ? ' bar' : ''}" have their expressions interrupted by
  // single quotes inside the ternary, so [^"'\n]+ stops mid-expression and misses
  // the base class. Instead: scan for class= followed by a double-quoted string
  // OR a backtick-delimited segment, extract everything up to the first ${ or the
  // closing delimiter, and tokenise only the static prefix.
  for (const js of jsContents) {
    // Match class="...anything up to closing quote or ${..."
    // Using a two-pass approach: find class= then manually scan to get the static part
    let i = 0
    while (i < js.length) {
      const idx = js.indexOf('class=', i)
      if (idx === -1) break
      i = idx + 6 // past 'class='

      // Skip optional whitespace (shouldn't be any but be safe)
      while (i < js.length && (js[i] === ' ' || js[i] === '\t')) i++

      const quote = js[i]
      if (quote !== '"' && quote !== "'" && quote !== '`') continue
      i++ // past opening quote

      // Collect characters until we hit the closing quote, a ${, or end of string
      let staticPart = ''
      while (i < js.length && js[i] !== quote && !(js[i] === '$' && js[i + 1] === '{')) {
        staticPart += js[i++]
      }

      // Tokenise the static prefix
      for (const cls of staticPart.trim().split(/\s+/)) {
        if (cls && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) used.add(cls)
      }
    }
  }

  // Scan JS source for quoted strings that look like CSS class names (contain hyphens)
  // Catches conditionally-applied classes like 'ui-btn--disabled' in ternaries
  for (const js of jsContents) {
    const re = /['"`]((?:[a-zA-Z][a-zA-Z0-9]*-[a-zA-Z0-9-]*)(?:\s+[a-zA-Z][a-zA-Z0-9-]*)*)['"`]/g
    let m
    while ((m = re.exec(js)) !== null) {
      for (const cls of m[1].trim().split(/\s+/)) {
        if (cls && cls.includes('-')) used.add(cls)
      }
    }
  }

  // classList method arguments are class names BY DEFINITION — collect them even
  // without a hyphen. The generic string scan above requires a hyphen to avoid
  // swallowing every English word, which silently missed runtime state classes
  // (classList.add('open'), .toggle('active')) and purged their compound rules
  // (`.docs-sidebar.open`) from production CSS while dev looked fine.
  for (const js of jsContents) {
    const re = /classList\s*\.\s*(?:add|remove|toggle|replace)\s*\(\s*((?:['"][^'"]+['"]\s*,?\s*)+)/g
    let m
    while ((m = re.exec(js)) !== null) {
      for (const [, cls] of m[1].matchAll(/['"]([^'"]+)['"]/g)) {
        if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) used.add(cls)
      }
    }
  }

  // Pulse re-renders via innerHTML — classes added after mutations appear as
  // template literal expressions inside class= attributes, not classList calls.
  // Pattern: class="${state.x ? 'foo' : 'bar'}" or class="base ${state.x ? 'active' : ''}"
  // The hyphen-only scan above misses single-word classes like 'active', 'open',
  // 'visible', 'selected', 'hidden' that are common state-driven class names.
  // Extract every quoted string that appears inside a class= template expression.
  for (const js of jsContents) {
    // Match: class=`...` or class="${...}" template attribute values
    const attrRe = /class(?:Name)?=`([^`]*)`/g
    let m
    while ((m = attrRe.exec(js)) !== null) {
      const attrContent = m[1]
      // Collect static class tokens (outside ${...} expressions)
      for (const cls of attrContent.replace(/\$\{[^}]*\}/g, ' ').trim().split(/\s+/)) {
        if (cls && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) used.add(cls)
      }
      // Collect quoted strings inside ${...} expressions — these are the
      // conditional class names: ${state.open ? 'open' : ''} → 'open'
      for (const [, inner] of attrContent.matchAll(/\$\{([^}]*)\}/g)) {
        for (const [, cls] of inner.matchAll(/['"]([a-zA-Z][a-zA-Z0-9_-]*)['"]|`([a-zA-Z][a-zA-Z0-9_-]*)`/g)) {
          const name = cls
          if (name && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) used.add(name)
        }
      }
    }
  }

  // Apply safelist from pulse.config.js — css.safelist accepts strings or RegExp.
  // String entries are added directly; RegExp entries are matched against all
  // class names defined in the CSS (resolved later in purgeCss via selectorUsed
  // because we don't have the CSS text here). To handle RegExp, we mark them as
  // a sentinel that selectorUsed checks separately.
  for (const entry of safelist) {
    if (typeof entry === 'string') {
      used.add(entry)
    }
    // RegExp entries are stored on the Set as a symbol property for selectorUsed to check
  }
  if (safelist.some(e => e instanceof RegExp)) {
    used._safelistPatterns = safelist.filter(e => e instanceof RegExp)
  }

  return used
}

// ---------------------------------------------------------------------------
// CSS purger — strips unused rules, preserves @media / :root / element rules
// ---------------------------------------------------------------------------

/**
 * Parse CSS text into top-level blocks using a bracket-depth counter.
 * Quote-aware: `;` and braces inside '...' or "..." strings are content, not
 * structure — an @import URL like url('...?family=Inter:wght@400;600&display=swap')
 * must not be split at the `;` inside the quotes.
 * Returns [{ type, selector?, prelude?, inner?, raw }]
 */
export function parseCssBlocks(css) {
  const blocks = []
  let i = 0
  const len = css.length

  // Advance past a quoted string starting at css[i] (which is ' or ").
  // Handles backslash escapes. Returns the index just past the closing quote.
  const skipString = (idx) => {
    const quote = css[idx]
    idx++
    while (idx < len && css[idx] !== quote) {
      if (css[idx] === '\\') idx++
      idx++
    }
    return idx + 1 // past closing quote (or len)
  }

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(css[i])) i++
    if (i >= len) break

    // Skip block comments
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? len : end + 2
      continue
    }

    const start = i
    let depth = 0

    while (i < len) {
      // Skip inline comments
      if (css[i] === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2)
        i = end === -1 ? len : end + 2
        continue
      }
      // Skip quoted strings — ; { } inside them are content, not structure
      if (css[i] === '"' || css[i] === "'") { i = skipString(i); continue }
      if (css[i] === '{') { depth++; i++; continue }
      if (css[i] === '}') { depth--; i++; if (depth === 0) break; continue }
      if (css[i] === ';' && depth === 0) { i++; break }
      i++
    }

    const raw = css.slice(start, i).trim()
    if (!raw) continue

    if (raw.startsWith('@')) {
      const braceIdx = raw.indexOf('{')
      if (braceIdx === -1) {
        blocks.push({ type: 'at-simple', raw })
      } else {
        const prelude = raw.slice(0, braceIdx).trim()
        const inner   = raw.slice(braceIdx + 1, raw.lastIndexOf('}')).trim()
        blocks.push({ type: 'at-block', prelude, inner, raw })
      }
    } else {
      const braceIdx = raw.indexOf('{')
      if (braceIdx !== -1) {
        blocks.push({ type: 'rule', selector: raw.slice(0, braceIdx).trim(), raw })
      }
    }
  }

  return blocks
}

/**
 * Return true if any selector in the rule should be kept.
 *
 * Matching strategy: check the *rightmost* class token in the selector (the
 * subject of the rule). A rule like `.parent .child` should survive only when
 * `.child` is used — keeping it whenever `.parent` is used would retain dead
 * rules whose actual target class was never referenced.
 *
 * Pseudo-classes/elements and attribute selectors are stripped before checking
 * so `.btn:hover` is treated as `.btn`, `.btn--active::before` as `.btn--active`.
 *
 * Element-only selectors (`a`, `*`, `:root`) and rules that contain no class
 * tokens at all are always kept.
 */
export function selectorUsed(selector, usedClasses) {
  const selectors = selector.split(',').map(s => s.trim())

  for (const sel of selectors) {
    // Strip pseudo-classes/elements and attribute selectors to find the base
    const base = sel
      .replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .trim()

    // Keep element-only selectors — no class tokens present
    if (!base.includes('.')) return true

    // Extract all class tokens and check the rightmost one (the rule subject).
    // Using the rightmost class correctly handles descendant selectors:
    //   .nav .link  → subject is .link
    //   .btn--active → subject is .btn--active
    const classes = [...base.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(m => m[1])
    if (classes.length === 0) return true
    const subject = classes[classes.length - 1]
    if (usedClasses.has(subject)) return true

    // Check RegExp safelist patterns if any were provided
    const patterns = usedClasses._safelistPatterns
    if (patterns && patterns.some(re => re.test(subject))) return true
  }

  return false
}

/**
 * Minify a CSS string. String-aware: content inside '...' or "..." is left
 * untouched so quoted URLs (e.g. Google Fonts @import with ; and : in the
 * query string) survive intact.
 */
export function minifyCss(css) {
  // Protect quoted strings from the whitespace/punctuation passes
  const strings = []
  const protectedCss = css.replace(/(['"])(?:\\.|(?!\1).)*\1/g, (m) => {
    strings.push(m)
    return `\x00S${strings.length - 1}\x00`
  })

  const minified = protectedCss
    .replace(/\/\*[\s\S]*?\*\//g, '')   // strip comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    // Remove spaces around safe punctuation — NOT + or - (would break calc() expressions)
    .replace(/\s*([{}:;,>~])\s*/g, '$1')
    .replace(/;}/g, '}')                // remove trailing semicolons
    .trim()

  return minified.replace(/\x00S(\d+)\x00/g, (_, i) => strings[+i])
}

/**
 * Purge unused CSS rules from a CSS string.
 * Recursively processes @media and @supports blocks.
 */
export function purgeCss(cssText, usedClasses) {
  const blocks = parseCssBlocks(cssText)
  const kept   = []

  for (const block of blocks) {
    if (block.type === 'at-simple') {
      kept.push(block.raw)
    } else if (block.type === 'at-block') {
      const p = block.prelude.toLowerCase()
      if (/^@(?:keyframes|font-face|charset)/.test(p)) {
        kept.push(block.raw)
      } else if (/^@(?:media|supports)/.test(p)) {
        const innerPurged = purgeCss(block.inner, usedClasses)
        if (innerPurged.trim()) kept.push(`${block.prelude} {\n${innerPurged}\n}`)
      } else if (/^@layer/.test(p)) {
        // Always preserve empty @layer declarations — they establish cascade order
        // and removing them silently changes specificity even when no rules remain.
        const innerPurged = purgeCss(block.inner, usedClasses)
        if (innerPurged.trim()) {
          kept.push(`${block.prelude} {\n${innerPurged}\n}`)
        } else {
          kept.push(`${block.prelude} {}`)
        }
      } else {
        kept.push(block.raw) // unknown at-blocks — keep to be safe
      }
    } else if (block.type === 'rule') {
      if (selectorUsed(block.selector, usedClasses)) kept.push(block.raw)
    }
  }

  return kept.join('\n\n')
}
