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

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args     = process.argv.slice(2)
const rootArg  = args.indexOf('--root')
const portArg  = args.indexOf('--port')

const ROOT = rootArg !== -1
  ? path.resolve(args[rootArg + 1])
  : process.cwd()

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

  if (stamp === pkgVersion) return

  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  for (const asset of ['pulse-ui.css', 'pulse-ui.js']) {
    const src = path.join(pkgPublic, asset)
    const dst = path.join(PUBLIC_DIR, asset)
    if (fs.existsSync(src)) fs.copyFileSync(src, dst)
  }
  fs.writeFileSync(stampPath, pkgVersion, 'utf8')

  // Sync agent checklist into .claude/ so CLAUDE.md can import it
  const checklistSrc = new URL('../agent/checklist.md', import.meta.url).pathname
  const checklistDst = path.join(ROOT, '.claude', 'pulse-checklist.md')
  if (fs.existsSync(checklistSrc)) {
    fs.mkdirSync(path.dirname(checklistDst), { recursive: true })
    fs.copyFileSync(checklistSrc, checklistDst)
  }

  console.log(`  ✓ pulse-ui assets synced (v${pkgVersion})\n`)
})()

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

console.log(`⚡ Pulse dev server starting...\n`)

const specs = await loadPages(ROOT)

if (specs.length === 0) {
  console.error('No pages found in src/pages/. Create a page to get started.')
  process.exit(1)
}

console.log('Pages:\n')
specs.forEach(spec => console.log(`  ${spec.route}`))
console.log()

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
fs.watch(path.join(ROOT, 'src'), { recursive: true }, () => {
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(async () => {
    try {
      const fresh = await loadPages(ROOT, Date.now())
      updateSpecs(fresh)
    } catch { /* spec error — browser will show the old page, not crash */ }
    notifyReload()
  }, 50)
})

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

const { updateSpecs } = createServer(specs, {
  port:      PORT,
  stream:    true,
  staticDir: fs.existsSync(PUBLIC_DIR) ? PUBLIC_DIR : null,
  manifest:  {},        // never use a build manifest in dev — always serve source files
  extraBody: reloadScript,
  dev:       true,
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
      res.writeHead(200, {
        'Content-Type':  'application/javascript',
        'Cache-Control': 'no-store',
      })
      fs.createReadStream(filePath).pipe(res)
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
