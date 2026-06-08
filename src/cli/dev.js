/**
 * Pulse — Dev server
 *
 * Auto-discovers pages from src/pages/, serves source files directly
 * (no bundling in dev), starts the HTTP server with hot-ish reloading.
 *
 * Usage:
 *   node src/cli/dev.js [--root /path/to/project] [--port 3000]
 */

import path    from 'path'
import fs      from 'fs'
import { createServer } from '../server/index.js'
import { loadPages }    from './discover.js'
import * as log         from './logger.js'

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args     = process.argv.slice(2)
const rootArg  = args.indexOf('--root')
const portArg  = args.indexOf('--port')

const ROOT = rootArg !== -1
  ? path.resolve(args[rootArg + 1])
  : process.cwd()

// Ensure process.cwd() === ROOT so relative paths in specs (e.g. md('src/content/foo.md'))
// resolve to the project root, not wherever the parent process was launched from.
if (process.cwd() !== ROOT) process.chdir(ROOT)

let _config = {}
const configPath = path.join(ROOT, 'pulse.config.js')
if (fs.existsSync(configPath)) {
  try { _config = (await import(configPath)).default ?? {} } catch { /* ignore */ }
}

async function resolvePort() {
  if (portArg !== -1) return parseInt(args[portArg + 1], 10)
  return _config.port || 3000
}

const PORT = await resolvePort()

const FRAMEWORK_ROOT = new URL('../../', import.meta.url).pathname
const PUBLIC_DIR     = path.join(ROOT, 'public')

// ---------------------------------------------------------------------------
// Sync pulse-ui assets from the installed package → project public/
// Runs on every dev start so the project always has the latest CSS and JS.
// ---------------------------------------------------------------------------

;(function syncAssets() {
  const pkgPublic  = new URL('../../public', import.meta.url).pathname
  const pkgJson    = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'))
  const pkgVersion = pkgJson.version
  const stampPath  = path.join(PUBLIC_DIR, '.pulse-ui-version')
  const stamp      = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : null

  // Compare CSS byte-length so any content change triggers a re-copy, even
  // within the same version (e.g. when iterating locally with npm link).
  const srcCss    = path.join(pkgPublic, 'pulse-ui.css')
  const dstCss    = path.join(PUBLIC_DIR, 'pulse-ui.css')
  const srcSize   = fs.existsSync(srcCss) ? fs.statSync(srcCss).size : -1
  const dstSize   = fs.existsSync(dstCss) ? fs.statSync(dstCss).size : -2
  const cssStale  = srcSize !== dstSize

  if (stamp === pkgVersion && !cssStale) return

  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  for (const asset of ['pulse-ui.css', 'pulse-ui.js']) {
    const src = path.join(pkgPublic, asset)
    const dst = path.join(PUBLIC_DIR, asset)
    if (fs.existsSync(src)) fs.copyFileSync(src, dst)
  }
  fs.writeFileSync(stampPath, pkgVersion, 'utf8')

  // Sync agent files into .claude/
  const agentFiles = [
    ['../agent/checklist.md',      'pulse-checklist.md'],
    ['../agent/coverage-check.js', 'coverage-check.js'],
  ]
  for (const [rel, dst] of agentFiles) {
    const src = new URL(rel, import.meta.url).pathname
    if (fs.existsSync(src)) {
      const dstPath = path.join(ROOT, '.claude', dst)
      fs.mkdirSync(path.dirname(dstPath), { recursive: true })
      fs.copyFileSync(src, dstPath)
    }
  }

  // Sync slash commands into .claude/commands/ so /pulse-dev etc. always exist
  const commandsSrc = new URL('../agent/commands', import.meta.url).pathname
  const commandsDst = path.join(ROOT, '.claude', 'commands')
  if (fs.existsSync(commandsSrc)) {
    fs.mkdirSync(commandsDst, { recursive: true })
    for (const file of fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'))) {
      fs.copyFileSync(path.join(commandsSrc, file), path.join(commandsDst, file))
    }
  }

  console.log(`  ✓ pulse-ui assets synced (v${pkgVersion})\n`)
})()

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const specs = await loadPages(ROOT)

if (specs.length === 0) {
  log.error('No pages found in src/pages/. Create a page to get started.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Hot reload — SSE clients + file watcher
// ---------------------------------------------------------------------------

const reloadClients = new Set()

function notifyReload() {
  for (const res of reloadClients) {
    res.write('event: reload\ndata: {}\n\n')
  }
}

// Close SSE connections on shutdown so the server can drain and exit cleanly.
// Without this, active SSE sockets are never destroyed and the process force-exits
// after the 30s shutdown timeout.
function closeReloadClients() {
  for (const res of [...reloadClients]) {
    try { res.end() } catch {}
  }
}
process.on('SIGTERM', closeReloadClients)
process.on('SIGINT',  closeReloadClients)

let reloadTimer = null
let lastReload = 0

/**
 * Check rendered HTML class names against CSS files in public/ and warn about
 * any classes that are used in templates but not defined in any stylesheet.
 * Only checks project-owned CSS (not pulse-ui.css) to avoid noise.
 */
async function checkUndefinedClasses(specs) {
  try {
    // Collect all class names defined in project CSS files
    const cssDir = path.join(ROOT, 'public')
    const definedClasses = new Set()
    if (fs.existsSync(cssDir)) {
      for (const file of fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && f !== 'pulse-ui.css')) {
        const css = fs.readFileSync(path.join(cssDir, file), 'utf8')
        for (const [, cls] of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)\s*[{,:\[]/g)) {
          definedClasses.add(cls)
        }
      }
    }
    if (definedClasses.size === 0) return

    // Render each spec and collect used class names from the HTML output
    const { renderToString } = await import('../runtime/ssr.js')
    for (const spec of specs) {
      if (!spec.view) continue
      try {
        const { html } = await renderToString(spec, {})
        const usedInSpec = new Set()
        for (const [, classes] of html.matchAll(/class="([^"]+)"/g)) {
          for (const cls of classes.trim().split(/\s+/)) {
            if (cls && !cls.startsWith('ui-')) usedInSpec.add(cls)
          }
        }
        const undefined_ = [...usedInSpec].filter(cls => !definedClasses.has(cls))
        if (undefined_.length > 0) {
          const route = spec.route ?? spec.filePath ?? '(unknown)'
          log.warn(`${route}: class${undefined_.length === 1 ? '' : 'es'} used but not defined in any CSS: ${undefined_.slice(0, 5).map(c => `.${c}`).join(', ')}${undefined_.length > 5 ? ` … +${undefined_.length - 5} more` : ''}`)
        }
      } catch { /* render failures are not our concern here */ }
    }
  } catch { /* never crash the dev server over a lint warning */ }
}

async function triggerReload(label = 'File changed') {
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(async () => {
    const now = Date.now()
    if (now - lastReload < 100) return
    lastReload = now

    try {
      const fresh = await loadPages(ROOT, now)
      updateSpecs(fresh)
      log.info(`${label} — specs reloaded`)
      checkUndefinedClasses(fresh)
    } catch (err) {
      log.error(`Spec reload failed: ${err.message}`)
    }
    notifyReload()
  }, 200)
}

// Watch src/ for changes to existing files (spec edits, component edits)
fs.watch(path.join(ROOT, 'src'), { recursive: true }, () => triggerReload('File changed'))

// Also watch the pages directory explicitly so macOS reliably fires on new file creation.
// On macOS, fs.watch with recursive=true watches subdirectory contents but may not fire
// for the parent dir entry when a brand-new file is created. Watching the dir non-recursively
// catches the "new entry added to this directory" event.
const pagesDir = path.join(ROOT, 'src', 'pages')
if (fs.existsSync(pagesDir)) {
  fs.watch(pagesDir, { recursive: false }, () => triggerReload('New page detected'))
}

// Tiny script injected into every page — connects to SSE and reloads on change
// Passed as a function so the server can inject the per-request CSP nonce
const reloadScript = (nonce) => `<script nonce="${nonce}">
  (function() {
    var open = false;
    var es = new EventSource('/_pulse/reload');
    es.addEventListener('open', function() {
      if (open) { location.reload(); return; }
      open = true;
    });
    es.addEventListener('reload', function() { location.reload(); });
  })();
</script>`

const { updateSpecs } = await createServer(specs, {
  port:      PORT,
  stream:    true,
  staticDir: fs.existsSync(PUBLIC_DIR) ? PUBLIC_DIR : null,
  manifest:  {},        // never use a build manifest in dev — always serve source files
  extraBody: reloadScript,
  dev:       true,
  agentMode: !!process.env.PULSE_AGENT_MODE,
  ...(_config.csp ? { csp: _config.csp } : {}),

  onRequest(req, res) {
    const url = req.url.split('?')[0]

    // SSE endpoint — browser connects here to receive reload events
    if (url === '/_pulse/reload') {
      res.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      })
      res.write('retry: 1000\n\n')
      reloadClients.add(res)
      req.on('close', () => reloadClients.delete(res))
      return false
    }

    const serveFile = (filePath) => {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false
      // Strip server-only imports that can't resolve in the browser:
      //   - node:* built-ins (fs, path, etc.)
      //   - JSON files imported with `with { type: 'json' }` (e.g. package.json for version)
      // These are only used inside spec.server functions or module-level server init;
      // the client runtime never calls those code paths.
      let content = fs.readFileSync(filePath, 'utf-8')
      content = content.replace(
        /^[ \t]*import\s+(?:\{[^}]*\}|[\w*]+(?:\s+as\s+\w+)?)\s+from\s+['"](?:node:[^'"]+|[^'"]*\.json)['"]\s*(?:with\s*\{[^}]*\})?\s*;?[ \t]*\n?/gm,
        ''
      )
      res.writeHead(200, {
        'Content-Type':  'application/javascript',
        'Cache-Control': 'no-store',
      })
      res.end(content)
      return true
    }

    const serveDir = (urlPrefix, dir) => {
      if (!url.startsWith(urlPrefix)) return false
      const rel      = url.slice(urlPrefix.length)
      const filePath = path.resolve(dir, rel)
      if (!filePath.startsWith(path.resolve(dir))) return false  // traversal guard
      return serveFile(filePath)
    }

    // Project source — /src/pages/, /src/components/, /src/lib/, etc.
    // Falls back to framework source for imports like /src/ui/ that sub-projects
    // resolve from relative paths (e.g. docs component pages → ../../../../src/ui/).
    if (serveDir('/src/', path.join(ROOT, 'src'))) return false
    if (serveDir('/src/', path.join(FRAMEWORK_ROOT, 'src'))) return false

    // Framework runtime — /@pulse/runtime/index.js → FRAMEWORK_ROOT/src/runtime/index.js
    if (serveDir('/@pulse/', path.join(FRAMEWORK_ROOT, 'src'))) return false
  }
})
