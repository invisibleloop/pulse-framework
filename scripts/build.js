/**
 * Pulse — Build script
 *
 * Auto-discovers pages from src/pages/, generates a self-executing bootstrap
 * module per page, bundles everything with a shared runtime chunk.
 *
 * Usage:
 *   node scripts/build.js [--root /path/to/project]
 *
 * Output:
 *   public/dist/<name>-<hash>.js   — minified self-executing bundle per page
 *   public/dist/runtime-<hash>.js  — shared runtime chunk
 *   public/dist/manifest.json      — maps source hydrate paths → bundle paths
 */

import * as esbuild from 'esbuild'
import fs           from 'fs'
import path         from 'path'
import { createHash } from 'crypto'
import { discoverPages } from '../src/cli/discover.js'
import { renderToString } from '../src/runtime/ssr.js'

// ---------------------------------------------------------------------------
// Server-only property stripping
// ---------------------------------------------------------------------------

/**
 * These spec properties are resolved and used exclusively on the server.
 * Stripping them from the client bundle:
 *   - reduces bundle size
 *   - prevents server-only imports (DB clients, Node built-ins, internal APIs)
 *     from being shipped to and evaluated in the browser
 *   - avoids bundling errors when server imports use Node-only modules
 */
const SERVER_ONLY_KEYS = ['server', 'guard', 'serverTimeout', 'contentType', 'render']

/**
 * Strip all server-only property declarations from a spec source string.
 * Matches properties at the start of a line (after optional whitespace) —
 * the standard formatting for Pulse spec files.
 */
function stripServerOnlyKeys(source) {
  for (const key of SERVER_ONLY_KEYS) {
    source = removeObjectKey(source, key)
  }
  return source
}

/**
 * Remove a single named property (key + value + optional trailing comma/newline)
 * from a JS source string. Uses a character-level scanner to correctly handle
 * nested structures, string literals, template literals, and function expressions.
 */
function removeObjectKey(source, key) {
  const keyRe = new RegExp(`^([ \\t]*)(${key})([ \\t]*:)`, 'gm')
  let match

  while ((match = keyRe.exec(source)) !== null) {
    const removeStart = match.index                    // start of indentation
    const afterColon  = match.index + match[0].length // character after ':'

    // Skip whitespace between ':' and value
    let pos = afterColon
    while (pos < source.length && (source[pos] === ' ' || source[pos] === '\t')) pos++

    // Scan past the full value
    pos = scanJsValue(source, pos)

    // Consume optional trailing comma and newline
    while (pos < source.length && (source[pos] === ' ' || source[pos] === '\t')) pos++
    if (pos < source.length && source[pos] === ',') pos++
    if (pos < source.length && source[pos] === '\n') pos++

    source = source.slice(0, removeStart) + source.slice(pos)
    keyRe.lastIndex = removeStart
  }

  return source
}

/**
 * Scan a JS value starting at `pos`, returning the index just past it.
 *
 * Correctly handles:
 *   - Object / array / group literals:  { }  [ ]  ( )
 *   - Arrow functions:  (params) => expr  or  (params) => { body }
 *   - Function expressions:  function(params) { body }  /  async function ...
 *   - String literals:  '...'  "..."
 *   - Template literals:  `...${expr}...`
 *   - Line and block comments
 *   - Simple values (numbers, booleans, identifiers, null/undefined)
 *
 * Stops when it finds a comma or closing delimiter at depth 0 that is NOT
 * followed by a continuation (arrow `=>`, method call `.`, etc.).
 */
function scanJsValue(src, pos) {
  let i     = pos
  let depth = 0

  while (i < src.length) {
    const c = src[i]

    // ---- Line comment -------------------------------------------------------
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }

    // ---- Block comment ------------------------------------------------------
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      i = end < 0 ? src.length : end + 2
      continue
    }

    // ---- String literals ----------------------------------------------------
    if (c === '"' || c === "'") {
      i++
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === c)    { i++; break }
        i++
      }
      if (depth === 0) return i
      continue
    }

    // ---- Template literals --------------------------------------------------
    if (c === '`') {
      i = scanTemplateLiteral(src, i + 1)
      if (depth === 0) return i
      continue
    }

    // ---- Open delimiters ----------------------------------------------------
    if (c === '{' || c === '[' || c === '(') {
      depth++
      i++
      continue
    }

    // ---- Close delimiters ---------------------------------------------------
    if (c === '}' || c === ']' || c === ')') {
      if (depth === 0) {
        // Hit the parent structure's closing delimiter — stop, don't consume
        return i
      }
      depth--
      i++
      if (depth === 0) {
        // Just closed a top-level nested block — peek ahead to see if this is
        // the end of the value or if the expression continues.
        let j = i
        while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++
        const next = src[j]
        // Terminator characters — value is complete
        if (!next || next === ',' || next === '}' || next === ']' || next === ')' || next === '\n') {
          return i
        }
        // Arrow function body follows:  (params) => ...
        if (next === '=' && src[j + 1] === '>') continue
        // Anything else (method chain, ternary, etc.) — keep scanning
        continue
      }
      continue
    }

    // ---- Terminators at top level -------------------------------------------
    if (depth === 0) {
      if (c === ',')  return i
      if (c === '\n') return i
    }

    i++
  }

  return i
}

/**
 * Scan a template literal body (starting just after the opening backtick).
 * Returns the index just past the closing backtick.
 * Handles `${...}` expression blocks including nested strings and templates.
 */
function scanTemplateLiteral(src, pos) {
  let i = pos
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue }
    if (src[i] === '`')  { return i + 1 }
    if (src[i] === '$' && src[i + 1] === '{') {
      i += 2
      let depth = 1
      while (i < src.length && depth > 0) {
        const c = src[i]
        if (c === '{') { depth++; i++; continue }
        if (c === '}') { depth--; i++; continue }
        if (c === '"' || c === "'") {
          const q = c; i++
          while (i < src.length) {
            if (src[i] === '\\') { i += 2; continue }
            if (src[i] === q)    { i++; break }
            i++
          }
          continue
        }
        if (c === '`') { i = scanTemplateLiteral(src, i + 1); continue }
        i++
      }
      continue
    }
    i++
  }
  return i
}

/**
 * esbuild plugin — strips server-only spec properties before bundling.
 * Only transforms files under src/pages/ to avoid touching runtime/server code.
 *
 * @param {string} pagesDir  Absolute path to src/pages/
 */
function createStripServerPlugin(pagesDir) {
  return {
    name: 'pulse-strip-server',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, (args) => {
        if (!args.path.startsWith(pagesDir + path.sep) &&
            args.path !== pagesDir.replace(/\/$/, '') + '.js') return undefined

        const source   = fs.readFileSync(args.path, 'utf8')
        const stripped = stripServerOnlyKeys(source)
        return { contents: stripped, loader: 'js' }
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Project root — can be overridden via --root flag for CLI usage
const rootArg = process.argv.indexOf('--root')
const ROOT    = rootArg !== -1
  ? path.resolve(process.argv[rootArg + 1])
  : path.resolve(import.meta.dirname, '..')

const OUT_DIR = path.join(ROOT, 'public', 'dist')
const TMP_DIR = path.join(ROOT, '.pulse-build')

// ---------------------------------------------------------------------------
// Discover pages
// ---------------------------------------------------------------------------

const pages = discoverPages(ROOT)

if (pages.length === 0) {
  console.error('No pages found in src/pages/. Nothing to build.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Clean output directories
// ---------------------------------------------------------------------------

for (const dir of [OUT_DIR, TMP_DIR]) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  fs.mkdirSync(dir, { recursive: true })
}

console.log('⚡ Building Pulse client bundles...\n')

// ---------------------------------------------------------------------------
// Generate bootstrap entry points
// ---------------------------------------------------------------------------

const RUNTIME_PATH = new URL('../src/runtime/index.js', import.meta.url).pathname
const NAVIGATE_PATH = new URL('../src/runtime/navigate.js', import.meta.url).pathname

const PAGES_DIR = path.join(ROOT, 'src', 'pages')

const bootstrapFiles = pages.map(({ filePath }) => {
  // Use the path relative to src/pages/ so nested pages get unique names.
  // e.g. src/pages/api/products.js → 'api--products' (not 'products')
  const relToPages    = path.relative(PAGES_DIR, filePath)
  const name          = relToPages.replace(/\.js$/, '').replace(/[\\/]/g, '--')
  const bootstrapPath = path.join(TMP_DIR, `${name}.boot.js`)
  const relSpec       = path.relative(TMP_DIR, filePath)
  const relRuntime    = path.relative(TMP_DIR, RUNTIME_PATH)
  const relNavigate   = path.relative(TMP_DIR, NAVIGATE_PATH)

  fs.writeFileSync(bootstrapPath, `\
import spec from '${relSpec}'
import { mount } from '${relRuntime}'
import { initNavigation } from '${relNavigate}'

const root = document.getElementById('pulse-root')
if (root && !root.dataset.pulseMounted) {
  root.dataset.pulseMounted = '1'
  mount(spec, root, window.__PULSE_SERVER__ || {}, { ssr: true })
  initNavigation(root, mount)
}

export default spec
`)

  return { filePath, bootstrapPath, name }
})

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

const result = await esbuild.build({
  entryPoints: bootstrapFiles.map(b => b.bootstrapPath),
  bundle:      true,
  format:      'esm',
  platform:    'browser',
  outdir:      OUT_DIR,
  entryNames:  '[name]-[hash]',
  chunkNames:  'runtime-[hash]',
  splitting:   true,
  minify:      true,
  metafile:    true,
  sourcemap:   false,
  treeShaking: true,
  plugins:     [createStripServerPlugin(PAGES_DIR)],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})

// ---------------------------------------------------------------------------
// Build manifest — maps source hydrate paths → bundle paths
// ---------------------------------------------------------------------------

const manifest = {}

for (const [outFile, meta] of Object.entries(result.metafile.outputs)) {
  const bundlePath = '/' + path.relative(path.join(ROOT, 'public'), path.join(ROOT, outFile))

  // Shared runtime chunk — esbuild generates this via splitting, no entryPoint
  if (!meta.entryPoint && path.basename(outFile).startsWith('runtime-')) {
    manifest['_runtime'] = bundlePath
    continue
  }

  if (!meta.entryPoint) continue

  const bootstrapName = path.basename(meta.entryPoint, '.boot.js')
  const entry         = bootstrapFiles.find(b => b.name === bootstrapName)
  if (!entry) continue

  // Hydrate key is the path the browser uses to import the spec
  const sourceKey  = '/' + path.relative(ROOT, entry.filePath)
  manifest[sourceKey] = bundlePath
}

fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

// ---------------------------------------------------------------------------
// Cleanup temp dir
// ---------------------------------------------------------------------------

fs.rmSync(TMP_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// CSS Purge — strip unused styles, write content-hashed CSS bundles
// ---------------------------------------------------------------------------

await purgeCssStep(pages, manifest, ROOT, OUT_DIR)

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('Bundles:\n')
for (const [src, bundle] of Object.entries(manifest)) {
  if (bundle.startsWith('/dist/')) {
    const filePath = path.join(ROOT, 'public', bundle)
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size
      console.log(`  ${src.padEnd(36)} → ${bundle}  (${(size / 1024).toFixed(1)} kB)`)
    }
  }
}
console.log('\n✓ manifest written to public/dist/manifest.json\n')

// ---------------------------------------------------------------------------
// CSS Purge implementation
// ---------------------------------------------------------------------------

async function purgeCssStep(pages, manifest, root, outDir) {
  console.log('⚡ Purging CSS...\n')

  const htmlContents = []
  const jsContents   = []
  const cssFiles     = new Set()

  for (const { filePath } of pages) {
    try {
      const mod  = await import(filePath)
      const spec = mod.default
      if (!spec || typeof spec !== 'object') continue

      // Collect CSS files referenced by this page
      if (Array.isArray(spec.meta?.styles)) {
        for (const href of spec.meta.styles) cssFiles.add(href)
      }

      // SSR render to extract class names from the actual HTML output
      try {
        const { html } = await renderToString(spec, {})
        htmlContents.push(html)
      } catch {
        // Server data might fail in build context — fall back to direct view call
        try {
          const html = spec.view(spec.state || {}, {})
          if (typeof html === 'string') htmlContents.push(html)
        } catch {}
      }

      // Also scan source JS for conditionally-applied class names
      jsContents.push(fs.readFileSync(filePath, 'utf8'))
    } catch {}
  }

  // Scan project components directory for conditional class names
  const componentsDir = path.join(root, 'src', 'components')
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'))
    for (const f of componentFiles) {
      try { jsContents.push(fs.readFileSync(path.join(componentsDir, f), 'utf8')) } catch {}
    }
  }

  if (cssFiles.size === 0) {
    console.log('  No CSS files referenced — skipping.\n')
    return
  }

  const usedClasses = extractUsedClasses(htmlContents, jsContents)

  for (const cssHref of cssFiles) {
    // CSS path is relative to public/ (e.g. '/pulse-ui.css' → public/pulse-ui.css)
    const cssPath = path.join(root, 'public', cssHref.replace(/^\//, ''))
    if (!fs.existsSync(cssPath)) continue

    const original = fs.readFileSync(cssPath, 'utf8')
    const purged   = minifyCss(purgeCss(original, usedClasses))

    const hash    = createHash('sha256').update(purged).digest('hex').slice(0, 8)
    const name    = path.basename(cssHref, '.css')
    const outName = `${name}-${hash}.css`
    const outPath = path.join(outDir, outName)

    fs.writeFileSync(outPath, purged)

    const origKb  = (Buffer.byteLength(original) / 1024).toFixed(1)
    const purgKb  = (Buffer.byteLength(purged)   / 1024).toFixed(1)
    const pct     = Math.round((1 - Buffer.byteLength(purged) / Buffer.byteLength(original)) * 100)

    console.log(`  ${cssHref.padEnd(28)} → /dist/${outName}  (${purgKb} kB, ${pct}% removed from ${origKb} kB)`)

    manifest[cssHref] = `/dist/${outName}`
  }

  // Re-write manifest with CSS entries added
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('\n✓ CSS entries added to manifest\n')
}

// ---------------------------------------------------------------------------
// CSS class extractor
// ---------------------------------------------------------------------------

function extractUsedClasses(htmlContents, jsContents) {
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

  return used
}

// ---------------------------------------------------------------------------
// CSS purger — strips unused rules, preserves @media / :root / element rules
// ---------------------------------------------------------------------------

/**
 * Parse CSS text into top-level blocks using a bracket-depth counter.
 * Returns [{ type, selector?, prelude?, inner?, raw }]
 */
function parseCssBlocks(css) {
  const blocks = []
  let i = 0
  const len = css.length

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
 * Keeps: element selectors, *, :root, and any rule where a used class appears.
 */
function selectorUsed(selector, usedClasses) {
  const selectors = selector.split(',').map(s => s.trim())

  for (const sel of selectors) {
    // Strip pseudo-classes/elements and attribute selectors to find the base
    const base = sel
      .replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .trim()

    // Keep element selectors, *, :root — no class tokens
    if (!base.includes('.')) return true

    // Keep if any class in the selector is in the used set
    const classes = [...sel.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(m => m[1])
    if (classes.some(cls => usedClasses.has(cls))) return true
  }

  return false
}

/**
 * Purge unused CSS rules from a CSS string.
 * Recursively processes @media and @supports blocks.
 */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // strip comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // remove spaces around punctuation
    .replace(/;}/g, '}')                // remove trailing semicolons
    .trim()
}

function purgeCss(cssText, usedClasses) {
  const blocks = parseCssBlocks(cssText)
  const kept   = []

  for (const block of blocks) {
    if (block.type === 'at-simple') {
      kept.push(block.raw)
    } else if (block.type === 'at-block') {
      const p = block.prelude.toLowerCase()
      if (/^@(?:keyframes|font-face|charset)/.test(p)) {
        kept.push(block.raw)
      } else if (/^@(?:media|supports|layer)/.test(p)) {
        const innerPurged = purgeCss(block.inner, usedClasses)
        if (innerPurged.trim()) kept.push(`${block.prelude} {\n${innerPurged}\n}`)
      } else {
        kept.push(block.raw) // unknown at-blocks — keep to be safe
      }
    } else if (block.type === 'rule') {
      if (selectorUsed(block.selector, usedClasses)) kept.push(block.raw)
    }
  }

  return kept.join('\n\n')
}
