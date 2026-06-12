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
import { c, header, table, ok, fail, info, warn, elapsed, icon } from '../src/cli/fmt.js'
import { extractUsedClasses, purgeCss, minifyCss } from './css-purge.js'

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
// NOTE: spec.submit is also server-only but must NOT be listed here — the key
// scanner is line-anchored at any nesting depth, and `submit:` is the most
// common ACTION name (actions: { submit: {…} }), which would get stripped too.
const SERVER_ONLY_KEYS = ['server', 'meta', 'guard', 'serverTimeout', 'contentType', 'render', 'sitemap']

/**
 * Pulse subpath exports that are server-only (use Node built-ins).
 * Imports from these paths are removed from client bundles along with any
 * top-level variable declarations whose right-hand side calls the imported names.
 * All `node:*` built-ins are also stripped automatically via the import regex.
 */
const SERVER_ONLY_IMPORTS = ['@invisibleloop/pulse/md']

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
 * Strip import statements for server-only modules and any top-level
 * variable declarations whose right-hand side calls the imported names.
 *
 * Strips:
 *   - All `node:*` built-in imports (fs, path, url, crypto, …)
 *   - Named entries in SERVER_ONLY_IMPORTS (@invisibleloop/pulse/md, …)
 *
 * Also removes associated top-level declarations, e.g.:
 *   import fs   from 'node:fs'          → removed
 *   import { md } from '@invisibleloop/pulse/md'  → removed
 *   const fetchPost = md('src/content/blog.md')   → removed
 */
function stripServerOnlyImports(source) {
  // Match any import whose specifier starts with `node:` OR is in SERVER_ONLY_IMPORTS.
  // Covers: default imports, named imports, namespace imports.
  const importRe =
    /^[ \t]*import\s+(?:\{[^}]*\}|[\w*]+(?:\s+as\s+\w+)?)\s+from\s+['"](?:node:[^'"]+|__SERVER_ONLY__)['"]\s*;?[ \t]*\n?/gm

  // Build a combined pattern for SERVER_ONLY_IMPORTS entries
  const extraPattern = SERVER_ONLY_IMPORTS
    .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  // Single regex covering node:* and every listed server-only module
  const combinedRe = new RegExp(
    importRe.source.replace('__SERVER_ONLY__', extraPattern),
    'gm'
  )

  // Collect all imported binding names before stripping
  const importedNames = new Set()
  for (const m of source.matchAll(combinedRe)) {
    const named = m[0].match(/\{\s*([^}]*)\s*\}/)
    if (named) {
      for (const part of named[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim()
        if (name) importedNames.add(name)
      }
    }
    const def = m[0].match(/import\s+([\w]+)\s+from/)
    if (def) importedNames.add(def[1])
  }

  source = source.replace(combinedRe, '')

  // Remove top-level: const/let/var X = importedName... (call, method call, or property)
  for (const name of importedNames) {
    const declRe = new RegExp(
      `^[ \\t]*(?:const|let|var)\\s+\\w+\\s*=\\s*${name}\\b[^\\n]*;?[ \\t]*\\n?`,
      'gm'
    )
    source = source.replace(declRe, '')
  }

  return source
}

/**
 * Remove a single named property (key + value + optional trailing comma/newline)
 * from a JS source string. Uses a character-level scanner to correctly handle
 * nested structures, string literals, template literals, and function expressions.
 */
/**
 * Returns true if `pos` in `source` falls inside a string or template literal.
 * Used to avoid stripping keys that appear inside code-example strings in docs pages.
 */
function isInsideString(source, pos) {
  let i = 0
  const stack = []  // stack of open delimiters: '"' | "'" | '`' | '{'  ('{' = template expression)
  while (i < pos) {
    const c = source[i]
    const top = stack[stack.length - 1]
    if (top === '"' || top === "'") {
      if (c === '\\') { i += 2; continue }
      if (c === top)  { stack.pop() }
      i++; continue
    }
    if (top === '`') {
      if (c === '\\') { i += 2; continue }
      if (c === '`')  { stack.pop(); i++; continue }
      if (c === '$' && source[i + 1] === '{') { stack.push('{'); i += 2; continue }
      i++; continue
    }
    if (top === '{') {
      // inside a template expression — track nested braces
      if (c === '{') { stack.push('{'); i++; continue }
      if (c === '}') { stack.pop(); i++; continue }
      if (c === '"' || c === "'" || c === '`') { stack.push(c); i++; continue }
      i++; continue
    }
    // Top level — handle comments and regex literals before string delimiters.
    // Without this, a `"` inside a regex literal (e.g. /"/g) or a comment would
    // be mistaken for an opening string delimiter, causing all subsequent keys to
    // be treated as "inside a string" and never stripped.
    if (c === '/') {
      if (source[i + 1] === '/') {          // line comment — skip to end of line
        while (i < pos && source[i] !== '\n') i++
        continue
      }
      if (source[i + 1] === '*') {           // block comment — skip to */
        const end = source.indexOf('*/', i + 2)
        i = end < 0 ? pos : end + 2
        continue
      }
      // Regex literal heuristic: / is a regex when not preceded by ) ] or alnum.
      // Division (a / b) always follows one of those; regex follows operators, keywords, etc.
      let prev = ''
      for (let k = i - 1; k >= 0; k--) {
        if (source[k] !== ' ' && source[k] !== '\t') { prev = source[k]; break }
      }
      if (!/[a-zA-Z0-9_$)\]]/.test(prev)) {
        i++  // skip opening /
        while (i < pos) {
          if (source[i] === '\\') { i += 2; continue }
          if (source[i] === '/') { i++; break }   // closing /
          if (source[i] === '\n') break            // regex can't span lines
          i++
        }
        while (i < pos && /[gimsuy]/.test(source[i])) i++  // skip flags
        continue
      }
    }
    if (c === '"' || c === "'" || c === '`') { stack.push(c) }
    i++
  }
  return stack.length > 0
}

function removeObjectKey(source, key) {
  const keyRe = new RegExp(`^([ \\t]*)(${key})([ \\t]*:)`, 'gm')
  let match

  while ((match = keyRe.exec(source)) !== null) {
    if (isInsideString(source, match.index)) { continue }

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
 * Transforms files under src/pages/ plus the global store file (pulse.store.js
 * carries server fetchers that must never reach the browser) — never touches
 * runtime/server code.
 *
 * @param {string} pagesDir         Absolute path to src/pages/
 * @param {string|null} storePath   Absolute path to pulse.store.js, if it exists
 */
function createStripServerPlugin(pagesDir, storePath = null) {
  return {
    name: 'pulse-strip-server',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, (args) => {
        const isPage  = args.path.startsWith(pagesDir + path.sep) ||
                        args.path === pagesDir.replace(/\/$/, '') + '.js'
        const isStore = storePath && args.path === storePath
        if (!isPage && !isStore) return undefined

        const source   = fs.readFileSync(args.path, 'utf8')
        const stripped = stripServerOnlyImports(stripServerOnlyKeys(source))
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
// Load pulse.config.js (optional)
// ---------------------------------------------------------------------------

let _projectConfig = {}
const _configPath = path.join(ROOT, 'pulse.config.js')
if (fs.existsSync(_configPath)) {
  try { _projectConfig = (await import(_configPath)).default ?? {} } catch { /* ignore */ }
}

// css.safelist — array of class name strings or RegExp patterns to always keep
// even if the purger would otherwise remove them.
// Example in pulse.config.js:
//   export default { css: { safelist: ['my-class', /^js-/] } }
const CSS_SAFELIST = (_projectConfig.css?.safelist ?? [])
  .map(entry => typeof entry === 'string' ? entry : entry)

// ---------------------------------------------------------------------------
// Discover pages
// ---------------------------------------------------------------------------

const pages = discoverPages(ROOT)

if (pages.length === 0) {
  console.error(fail('No pages found in src/pages/ — nothing to build.'))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const BUILD_START = Date.now()

// ---------------------------------------------------------------------------
// Clean output directories
// ---------------------------------------------------------------------------

for (const dir of [OUT_DIR, TMP_DIR]) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  fs.mkdirSync(dir, { recursive: true })
}

console.log(header(`Building ${pages.length} page${pages.length === 1 ? '' : 's'}`))

// ---------------------------------------------------------------------------
// Generate bootstrap entry points
// ---------------------------------------------------------------------------

const RUNTIME_PATH = new URL('../src/runtime/index.js', import.meta.url).pathname
const NAVIGATE_PATH = new URL('../src/runtime/navigate.js', import.meta.url).pathname

const PAGES_DIR = path.join(ROOT, 'src', 'pages')

// Global store — bundled into boot files (server fetchers stripped) when present
const STORE_PATH = fs.existsSync(path.join(ROOT, 'pulse.store.js'))
  ? path.join(ROOT, 'pulse.store.js')
  : null

const bootstrapFiles = pages.flatMap(({ filePath }) => {
  // Strip server-only keys/imports to check what's left for the client.
  // Skip specs with no view — these are API routes or raw content specs
  // (using render: instead of view:) that have no client-side code. Including
  // them in the bundle fragments the shared runtime chunk unnecessarily.
  const source   = fs.readFileSync(filePath, 'utf8')
  const stripped = stripServerOnlyImports(stripServerOnlyKeys(source))
  if (!/\bview\s*:/.test(stripped)) return []

  // Use the path relative to src/pages/ so nested pages get unique names.
  // e.g. src/pages/api/products.js → 'api--products' (not 'products')
  const relToPages    = path.relative(PAGES_DIR, filePath)
  const name          = relToPages.replace(/\.js$/, '').replace(/[\\/]/g, '--')
  const bootstrapPath = path.join(TMP_DIR, `${name}.boot.js`)
  const relSpec       = path.relative(TMP_DIR, filePath)
  const relRuntime    = path.relative(TMP_DIR, RUNTIME_PATH)
  const relNavigate   = path.relative(TMP_DIR, NAVIGATE_PATH)

  // Global store — when pulse.store.js exists, every boot bundle imports it and
  // passes it to mount() so client store mutations register in production.
  // The strip plugin removes its server fetchers from the browser bundle;
  // esbuild's shared-chunk splitting keeps it from being duplicated per page.
  const storeImport = STORE_PATH ? `\nimport store from '${path.relative(TMP_DIR, STORE_PATH)}'` : ''
  const mountOpts   = STORE_PATH ? `{ ssr: true, store }` : `{ ssr: true }`

  fs.writeFileSync(bootstrapPath, `\
import spec from '${relSpec}'
import { mount } from '${relRuntime}'
import { initNavigation } from '${relNavigate}'${storeImport}

const root = document.getElementById('pulse-root')
if (root && !root.dataset.pulseMounted) {
  root.dataset.pulseMounted = '1'
  mount(spec, root, window.__PULSE_SERVER__ || {}, ${mountOpts})
  initNavigation(root, mount)
}

export default spec
`)

  return [{ filePath, bootstrapPath, name }]
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
  plugins:     [createStripServerPlugin(PAGES_DIR, STORE_PATH)],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})

// ---------------------------------------------------------------------------
// Build manifest — maps source hydrate paths → bundle paths
// ---------------------------------------------------------------------------

const manifest = {}

for (const [outFile, meta] of Object.entries(result.metafile.outputs)) {
  // outFile is relative to process.cwd(), not ROOT — use path.resolve to get the
  // true absolute path before computing the URL-relative bundle path.
  const bundlePath = '/' + path.relative(path.join(ROOT, 'public'), path.resolve(outFile))

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

const cssPurgeStats = await purgeCssStep(pages, manifest, ROOT, OUT_DIR)

// ---------------------------------------------------------------------------
// JS static assets — minify + hash any .js files directly in public/
// ---------------------------------------------------------------------------

await jsAssetsStep(ROOT, OUT_DIR, manifest)

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

{
  const rows = []

  for (const [src, bundle] of Object.entries(manifest)) {
    // Skip runtime chunk and static assets — only show per-page bundles + CSS
    if (!bundle.startsWith('/dist/')) continue
    const filePath = path.join(ROOT, 'public', bundle)
    if (!fs.existsSync(filePath)) continue

    const sizeBytes = fs.statSync(filePath).size
    const sizeKb    = (sizeBytes / 1024).toFixed(1)
    const ext       = path.extname(bundle)

    if (ext === '.js' && src.startsWith('/src/pages/')) {
      // Per-page JS bundle — find if it's hydrated
      const srcPath = path.join(ROOT, src.replace(/^\//, ''))
      let route = src.replace('/src/pages', '').replace(/\.js$/, '')
      // Try to extract route from the spec
      try {
        const specSrc = fs.readFileSync(srcPath, 'utf8')
        const m = specSrc.match(/route\s*:\s*['"`]([^'"`]+)['"`]/)
        if (m) route = m[1]
      } catch { /* use filename-derived route */ }
      rows.push([
        c.cyan(route),
        c.dim(bundle.replace('/dist/', '')),
        `${sizeKb} kB`,
        c.dim('js'),
        '',
      ])
    } else if (ext === '.css') {
      const pct = cssPurgeStats?.[src]
      const pctLabel = pct != null ? c.dim(`−${pct}%`) : ''
      rows.push([
        c.dim(src),
        c.dim(bundle.replace('/dist/', '')),
        `${sizeKb} kB`,
        c.dim('css'),
        pctLabel,
      ])
    }
  }

  // Sort: pages first, then CSS, then other
  rows.sort((a, b) => {
    const aIsPage = a[3].includes('js')
    const bIsPage = b[3].includes('js')
    if (aIsPage && !bIsPage) return -1
    if (!aIsPage && bIsPage) return 1
    return 0
  })

  console.log('\n' + table(
    ['Route / Asset', 'Bundle', 'Size', 'Type', 'Purged'],
    rows,
    { align: ['left', 'left', 'right', 'left', 'right'] }
  ))

  const totalMs = Date.now() - BUILD_START
  console.log(`\n${ok(`Build complete`)}  ${c.dim(elapsed(totalMs))}  ${c.dim('→')}  ${c.dim('public/dist/')}\n`)
}

// ---------------------------------------------------------------------------
// JS static assets implementation
// ---------------------------------------------------------------------------

async function jsAssetsStep(root, outDir, manifest) {
  const publicDir = path.join(root, 'public')
  if (!fs.existsSync(publicDir)) return

  const jsFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.js'))
  if (jsFiles.length === 0) return

  console.log(info('Hashing static JS assets…'))

  // Collect fetch/XHR origins used in static JS for CSP connect-src checking
  const cspConnectSrc = new Set([
    ...(_projectConfig.csp?.['connect-src'] ?? []),
    'self',
  ])

  for (const file of jsFiles) {
    const srcPath = path.join(publicDir, file)
    const source  = fs.readFileSync(srcPath, 'utf8')

    // Warn if the file contains fetch/XMLHttpRequest calls to origins not in
    // the project's CSP connect-src — these will silently fail in production.
    const fetchUrls = [...source.matchAll(/fetch\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/g)].map(m => m[1])
    for (const url of fetchUrls) {
      try {
        const origin = new URL(url).origin
        if (!cspConnectSrc.has(origin) && !cspConnectSrc.has('*')) {
          console.log(warn(`${file}: fetch to ${origin} may be blocked — add to csp.connect-src in pulse.config.js`))
        }
      } catch { /* ignore malformed URLs */ }
    }

    const { code } = await esbuild.transform(source, { minify: true, target: 'es2018' })
    const hash    = createHash('sha256').update(code).digest('hex').slice(0, 8)
    const name    = path.basename(file, '.js')
    const outName = `${name}-${hash}.js`

    fs.writeFileSync(path.join(outDir, outName), code)
    manifest[`/${file}`] = `/dist/${outName}`

    // silent — summary table covers this
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  // silent — summary table covers this
}

// ---------------------------------------------------------------------------
// CSS Purge implementation
// ---------------------------------------------------------------------------

async function purgeCssStep(pages, manifest, root, outDir) {
  console.log(info('Purging CSS…'))

  const htmlContents = []
  const jsContents   = []
  const cssFiles     = new Set()
  const cssStats     = {}

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

  // Scan public/*.js static assets — these often contain classList.toggle() or
  // classList.add() calls that reference CSS classes not present in any page spec,
  // which would otherwise be incorrectly purged from the built CSS.
  const publicDir = path.join(root, 'public')
  if (fs.existsSync(publicDir)) {
    for (const f of fs.readdirSync(publicDir).filter(f => f.endsWith('.js'))) {
      try { jsContents.push(fs.readFileSync(path.join(publicDir, f), 'utf8')) } catch {}
    }
  }

  // Scan pulse UI package source — class names generated by UI components
  // (breadcrumbs, avatar, container, etc.) only appear in the package source,
  // not in the project's own pages, so they'd otherwise be purged.
  // Also scan the parent src/ui in case root is a subdirectory (e.g. docs/) that
  // imports UI components via relative paths from the parent project.
  const scanUiDirs = [
    path.join(root, 'src', 'ui'),          // project's own source
    path.join(root, '..', 'src', 'ui'),    // parent project source (e.g. pulse2/src/ui when root=docs)
    path.join(root, 'node_modules', '@invisibleloop', 'pulse', 'src', 'ui'),        // installed package
    path.join(root, '..', 'node_modules', '@invisibleloop', 'pulse', 'src', 'ui'), // parent node_modules
  ]
  for (const dir of scanUiDirs) {
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
      try { jsContents.push(fs.readFileSync(path.join(dir, f), 'utf8')) } catch {}
    }
  }

  if (cssFiles.size === 0) {
    console.log(info('No CSS files referenced — skipping.'))
    return cssStats
  }

  const usedClasses = extractUsedClasses(htmlContents, jsContents, CSS_SAFELIST)

  for (const cssHref of cssFiles) {
    // CSS path is relative to public/ (e.g. '/pulse-ui.css' → public/pulse-ui.css)
    const cssPath = path.join(root, 'public', cssHref.replace(/^\//, ''))
    if (!fs.existsSync(cssPath)) continue

    const original = fs.readFileSync(cssPath, 'utf8')

    // Warn about classes defined in this CSS file that weren't found in any
    // scanned source — these will be purged and may indicate a missing scan source
    // (e.g. a JS file that toggles classes via classList but wasn't picked up).
    // Only warn for project-owned CSS files (not pulse-ui.css framework styles).
    if (!cssHref.includes('pulse-ui')) {
      const definedClasses = [...original.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)\s*[{,:\[]/g)]
        .map(m => m[1])
        .filter((cls, i, arr) => arr.indexOf(cls) === i) // dedupe
      const purgedClasses = definedClasses.filter(cls => !usedClasses.has(cls))
      if (purgedClasses.length > 0) {
        console.log(warn(`${cssHref}: ${purgedClasses.length} class${purgedClasses.length === 1 ? '' : 'es'} purged (not found in any scanned source): ${purgedClasses.slice(0, 5).map(c => `.${c}`).join(', ')}${purgedClasses.length > 5 ? ` … +${purgedClasses.length - 5} more` : ''}`))
      }
    }

    const purged   = minifyCss(purgeCss(original, usedClasses))

    const hash    = createHash('sha256').update(purged).digest('hex').slice(0, 8)
    const name    = path.basename(cssHref, '.css')
    const outName = `${name}-${hash}.css`
    const outPath = path.join(outDir, outName)

    fs.writeFileSync(outPath, purged)

    const origBytes = Buffer.byteLength(original)
    const purgBytes = Buffer.byteLength(purged)
    const pct       = Math.round((1 - purgBytes / origBytes) * 100)
    cssStats[cssHref] = pct

    manifest[cssHref] = `/dist/${outName}`
  }

  // Re-write manifest with CSS entries added
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return cssStats
}
