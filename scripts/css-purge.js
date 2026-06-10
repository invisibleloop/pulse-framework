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

  // Extract from class="..." in both rendered HTML and JS template literals
  for (const content of [...htmlContents, ...jsContents]) {
    const re = /class(?:Name)?=["']([^"'\n]+)["']/g
    let m
    while ((m = re.exec(content)) !== null) {
      for (const cls of m[1].trim().split(/\s+/)) {
        if (cls) used.add(cls)
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
