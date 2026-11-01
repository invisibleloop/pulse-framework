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
import { buildBootstrapSource } from './bootstrap.js'
import { fileURLToPath, pathToFileURL } from 'url'
import { toPosix } from '../src/cli/paths.js'
import { loadConfigOrExit } from '../src/cli/config.js'
import { stripServerCode, analyseSpec, needsClientBundle, StripError } from './strip-server.js'

// ---------------------------------------------------------------------------
// Server-only code stripping (see strip-server.js: a real parser, and it fails closed)
// ---------------------------------------------------------------------------

/**
 * esbuild plugin: strips server-only code from the page specs that get a browser bundle, and from
 * the global store file (pulse.store.js carries server fetchers that must never reach the browser).
 * It touches exactly those files, never runtime or server code, and never a helper module.
 *
 * @param {Set<string>} specFiles   Absolute paths of the page specs being bundled
 * @param {string|null} storePath   Absolute path to pulse.store.js, if it exists
 */
function createStripServerPlugin(specFiles, storePath = null) {
  return {
    name: 'pulse-strip-server',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, (args) => {
        if (!specFiles.has(args.path) && args.path !== storePath) return undefined
        const source = fs.readFileSync(args.path, 'utf8')
        const { code } = stripServerCode(source, { file: toPosix(path.relative(ROOT, args.path)) })
        return { contents: code, loader: 'js' }
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Project root — can be overridden via --root flag for CLI usage
const rootArg = process.argv.indexOf('--root')
const ROOT    = fs.realpathSync(rootArg !== -1
  ? path.resolve(process.argv[rootArg + 1])
  : path.resolve(import.meta.dirname, '..'))
// (the real path: the import specifiers in the generated boot files are relative paths, which are
// computed lexically and go wrong when the project sits behind a symlink such as macOS /tmp or /var)

const OUT_DIR = path.join(ROOT, 'public', 'dist')
const TMP_DIR = path.join(ROOT, '.pulse-build')

// ---------------------------------------------------------------------------
// Load pulse.config.js (optional)
// ---------------------------------------------------------------------------

const _projectConfig = await loadConfigOrExit(ROOT)

// css.safelist — array of class name strings or RegExp patterns to always keep
// even if the purger would otherwise remove them.
// Example in pulse.config.js:
//   export default { css: { safelist: ['my-class', /^js-/] } }
const CSS_SAFELIST = (_projectConfig.css?.safelist ?? [])
  .map(entry => typeof entry === 'string' ? entry : entry)

// css.renderPages — whether the CSS step renders each page once to find the classes it uses.
// Default false: the build reads class names from the source files alone and calls no data source.
// Set it to true to render the pages as well. That runs the page's `server` fetchers
// (ctx.build is true and process.env.PULSE_BUILD is '1') and also finds classes that exist only
// in the data a fetcher returns. Before 0.38.0 the default was true.
// Example in pulse.config.js:
//   export default { css: { renderPages: true } }
const CSS_RENDER_PAGES = _projectConfig.css?.renderPages === true

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

const RUNTIME_PATH = fileURLToPath(new URL('../src/runtime/index.js', import.meta.url))
const NAVIGATE_PATH = fileURLToPath(new URL('../src/runtime/navigate.js', import.meta.url))

const PAGES_DIR = path.join(ROOT, 'src', 'pages')

// Global store — bundled into boot files (server fetchers stripped) when present
const STORE_PATH = fs.existsSync(path.join(ROOT, 'pulse.store.js'))
  ? path.join(ROOT, 'pulse.store.js')
  : null

// A page needs a browser bundle when it has a view and client-side behaviour (mutations, actions,
// persist or store). A view alone does not: a purely server-rendered page (a redirect handler, a
// custom 404, a spec.submit-only form) gets none, which also keeps it from failing the build when it
// imports a server-only helper (a persistence layer using node:fs) that esbuild would try to bundle.
// Specs with no view are API routes or raw responses (render:) with no client code at all.
const bootstrapFiles = []
try {
  for (const { filePath } of pages) {
    const rel      = toPosix(path.relative(ROOT, filePath))
    const analysis = analyseSpec(fs.readFileSync(filePath, 'utf8'), { file: rel })
    if (analysis.none) continue
    if (analysis.analysable) {
      if (!needsClientBundle(analysis)) continue
    } else {
      // The parser cannot see this spec's keys (a spread, an imported or built object). Ask the
      // evaluated spec whether it needs a bundle; if it does, stripping cannot be proven and the
      // build must stop, because server code might ship. If it does not, there is nothing to ship.
      const spec = (await import(pathToFileURL(filePath).href)).default
      const hasView = typeof spec?.view === 'function' || (spec?.view && typeof spec.view === 'object')
      if (!hasView || !(spec.mutations || spec.actions || spec.persist || spec.store?.length)) continue
      stripServerCode(fs.readFileSync(filePath, 'utf8'), { file: rel })      // throws StripError with the reason and the line
    }
    // Strip now, not only inside esbuild, so a problem is reported here, naming the file.
    stripServerCode(fs.readFileSync(filePath, 'utf8'), { file: rel })

    // Use the path relative to src/pages/ so nested pages get unique names.
    // e.g. src/pages/api/products.js → 'api--products' (not 'products')
    const relToPages    = path.relative(PAGES_DIR, filePath)
    const name          = relToPages.replace(/\.js$/, '').replace(/[\\/]/g, '--')
    const bootstrapPath = path.join(TMP_DIR, `${name}.boot.js`)
    // Forward slashes: these go inside string literals in generated JS (see paths.js)
    const relSpec       = toPosix(path.relative(TMP_DIR, filePath))
    const relRuntime    = toPosix(path.relative(TMP_DIR, RUNTIME_PATH))
    const relNavigate   = toPosix(path.relative(TMP_DIR, NAVIGATE_PATH))

    // Global store — when pulse.store.js exists, every boot bundle imports it and
    // passes it to mount() so client store mutations register in production.
    // The strip plugin removes its server fetchers from the browser bundle;
    // esbuild's shared-chunk splitting keeps it from being duplicated per page.
    const storeImport = STORE_PATH ? `\nimport store from '${toPosix(path.relative(TMP_DIR, STORE_PATH))}'` : ''
    const mountOpts   = STORE_PATH ? `{ ssr: true, store }` : `{ ssr: true }`

    fs.writeFileSync(bootstrapPath, buildBootstrapSource({ relSpec, relRuntime, relNavigate, storeImport, mountOpts }))
    bootstrapFiles.push({ filePath, bootstrapPath, name })
  }
  if (STORE_PATH) stripServerCode(fs.readFileSync(STORE_PATH, 'utf8'), { file: toPosix(path.relative(ROOT, STORE_PATH)) })
} catch (err) {
  if (!(err instanceof StripError)) throw err
  console.error(`\n  ✗ ${err.message}\n`)
  process.exit(1)
}

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
  chunkNames:  'chunk-[hash]',
  splitting:   true,
  minify:      true,
  metafile:    true,
  sourcemap:   false,
  treeShaking: true,
  plugins:     [createStripServerPlugin(new Set(bootstrapFiles.map(b => b.filePath)), STORE_PATH)],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})

// ---------------------------------------------------------------------------
// Build manifest — maps source hydrate paths → bundle paths
// ---------------------------------------------------------------------------

const manifest = {}

// Identify the real Pulse framework runtime chunk (the one containing mount())
// by which auto-split chunks actually import RUNTIME_PATH — not by filename
// prefix, since chunkNames now applies to every generic shared chunk esbuild
// splits out (app-level shared code included), not just the framework runtime.
const RUNTIME_ABS = path.resolve(RUNTIME_PATH)
const realRuntimeChunk = Object.entries(result.metafile.outputs).find(([outFile, meta]) => {
  if (meta.entryPoint) return false
  // meta.inputs keys are relative to process.cwd() — resolve to compare reliably
  return Object.keys(meta.inputs).some(input => path.resolve(input) === RUNTIME_ABS)
})?.[0]

for (const [outFile, meta] of Object.entries(result.metafile.outputs)) {
  // outFile is relative to process.cwd(), not ROOT — use path.resolve to get the
  // true absolute path before computing the URL-relative bundle path.
  const bundlePath = '/' + toPosix(path.relative(path.join(ROOT, 'public'), path.resolve(outFile)))

  // Shared runtime chunk — esbuild generates this via splitting, no entryPoint.
  // Identified by containing the actual runtime/index.js source, not by name.
  if (!meta.entryPoint && outFile === realRuntimeChunk) {
    manifest['_runtime'] = bundlePath
    continue
  }

  if (!meta.entryPoint) continue

  const bootstrapName = path.basename(meta.entryPoint, '.boot.js')
  const entry         = bootstrapFiles.find(b => b.name === bootstrapName)
  if (!entry) continue

  // Hydrate key is the path the browser uses to import the spec
  const sourceKey  = '/' + toPosix(path.relative(ROOT, entry.filePath))
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

  // Fetchers that the render below will run get ctx.build === true and this variable, so they can
  // return early instead of calling a database or an API.
  process.env.PULSE_BUILD = '1'
  let fetchersRun = false
  let pagesWithFetchers = false

  const failedPages = []
  for (const { filePath } of pages) {
    try {
      const mod  = await import(pathToFileURL(filePath).href)
      const spec = mod.default
      if (!spec || typeof spec !== 'object') continue

      // Collect CSS files referenced by this page
      if (Array.isArray(spec.meta?.styles)) {
        for (const href of spec.meta.styles) cssFiles.add(href)
      }

      // SSR render to extract class names from the actual HTML output
      if (spec.server && Object.keys(spec.server).length) pagesWithFetchers = true
      if (CSS_RENDER_PAGES) {
        if (spec.server && Object.keys(spec.server).length) fetchersRun = true
        try {
          const { html } = await renderToString(spec, { build: true })
          htmlContents.push(html)
        } catch {
          // Server data might fail in build context — fall back to direct view call
          try {
            const html = spec.view(spec.state || {}, {})
            if (typeof html === 'string') htmlContents.push(html)
          } catch {}
        }
      }

      // Also scan source JS for conditionally-applied class names
      jsContents.push(fs.readFileSync(filePath, 'utf8'))
    } catch (err) {
      // A page that cannot be loaded cannot be served either (pulse start and pulse dev would die on
      // it), so this is a failed build, not a page to skip: a removed component import used to
      // print "Build complete" and leave a project that crashed on start.
      failedPages.push({ file: toPosix(path.relative(ROOT, filePath)), message: err?.message ?? String(err) })
    }
  }
  if (fetchersRun) {
    console.log(info('The CSS step rendered each page once, which ran your server fetchers with ctx.build = true. ' +
      'To keep the build from calling a data source, return early when ctx.build is set, or remove css: { renderPages: true } from pulse.config.js.'))
  } else if (!CSS_RENDER_PAGES && pagesWithFetchers) {
    console.log(info('The CSS step did not render your pages, so no server fetcher ran. A class that exists only in fetched data ' +
      'is removed from the CSS: add it to css: { safelist }, or set css: { renderPages: true } in pulse.config.js to render the pages at build time.'))
  }
  if (failedPages.length) {
    console.error('')
    for (const f of failedPages) console.error(`  ✗ ${f.file} could not be loaded: ${f.message}`)
    console.error('\n  Fix the import above (for example a component that was removed or moved) and build again.\n')
    process.exit(1)
  }

  // Scan every source file under src/ for class names (components, lib helpers, nested folders),
  // so a class used only in a helper survives even when the pages are not rendered. Tests are skipped.
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full) }
      else if (/\.[cm]?js$/.test(entry.name) && !/\.(test|spec)\.[cm]?js$/.test(entry.name)) {
        try { jsContents.push(fs.readFileSync(full, 'utf8')) } catch {}
      }
    }
  }
  const srcDir = path.join(root, 'src')
  if (fs.existsSync(srcDir)) walk(srcDir)

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
  // The markdown highlighter (src/md) writes class names too (tok-kw, tok-str, ...) into the HTML it returns.
  const scanUiDirs = [
    path.join(root, 'src', 'ui'),          // project's own source
    path.join(root, '..', 'src', 'ui'),    // parent project source (e.g. pulse2/src/ui when root=docs)
    path.join(root, 'node_modules', '@invisibleloop', 'pulse', 'src', 'ui'),        // installed package
    path.join(root, '..', 'node_modules', '@invisibleloop', 'pulse', 'src', 'ui'), // parent node_modules
    path.join(root, 'node_modules', '@invisibleloop', 'pulse', 'src', 'md'),
    path.join(root, '..', 'node_modules', '@invisibleloop', 'pulse', 'src', 'md'),
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
