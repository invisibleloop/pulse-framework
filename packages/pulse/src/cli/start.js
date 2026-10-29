/**
 * Pulse — Production server
 *
 * Loads pages from src/pages/, serves public/dist/ bundles via manifest.
 * No source file serving. No AI session. For production use.
 *
 * Usage:
 *   node src/cli/start.js [--root /path/to/project] [--port 3000]
 */

import path from 'path'
import fs   from 'fs'
import { createServer } from '../server/index.js'
import { loadPages, loadStore } from './discover.js'
import { pathToFileURL } from 'url'
import { loadConfigOrExit, failStartup } from './config.js'

const args    = process.argv.slice(2)
const rootArg = args.indexOf('--root')
const portArg = args.indexOf('--port')

const ROOT = rootArg !== -1 ? path.resolve(args[rootArg + 1]) : process.cwd()
if (process.cwd() !== ROOT) process.chdir(ROOT)
const PUBLIC_DIR = path.join(ROOT, 'public')
const DIST_DIR   = path.join(PUBLIC_DIR, 'dist')

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

if (!fs.existsSync(DIST_DIR)) {
  console.error('\n⚠  No build found. Run "pulse build" first.\n')
  process.exit(1)
}

const manifestPath = path.join(DIST_DIR, 'manifest.json')
if (!fs.existsSync(manifestPath)) {
  console.error('\n⚠  No manifest found in public/dist/. Run "pulse build" first.\n')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Read port — CLI flag > pulse.config.js > default 3000
// ---------------------------------------------------------------------------

let port         = portArg !== -1 ? parseInt(args[portArg + 1], 10) : null
let defaultCache = null
let staticCache  = null
let csp          = null
let passthrough  = {}

// Server options forwarded verbatim from pulse.config.js — keep in sync with dev.js
const PASSTHROUGH_OPTIONS = ['redirects', 'sitemap', 'robots', 'secret', 'live', 'trailingSlash', 'fetcherTimeout', 'maxBody', 'origin', 'host', 'hsts']

{
  const config = await loadConfigOrExit(ROOT)
  port         = port || config.port || null
  defaultCache = config.defaultCache ?? null
  staticCache  = config.staticCache ?? null
  csp          = config.csp ?? null
  for (const key of PASSTHROUGH_OPTIONS) {
    if (config[key] !== undefined) passthrough[key] = config[key]
  }
}

// Render (and other PaaS platforms) inject PORT — always takes precedence, even
// over an explicit --port flag. This is correct for real deployment, but it also
// means a PORT env var set on a local dev machine for unrelated reasons (common
// in sandboxes, CI runners, some shell profiles) silently overrides the local
// convention of `pulse start --port 3001` documented for /verify — with no error,
// just a server on a port nobody asked for. Surface it instead of staying silent.
const requestedPort = port
const envPort       = parseInt(process.env.PORT, 10) || null
port = envPort || port || 3000
if (envPort && requestedPort && envPort !== requestedPort) {
  console.error(`⚠  PORT=${envPort} in the environment overrides --port ${requestedPort} — starting on ${envPort} instead.\n   Unset PORT, or don't rely on --port locally while it's set.\n`)
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const specs = await loadPages(ROOT)

// Auto-discover the global store — pulse.store.js in the project root
const store = await loadStore(ROOT)

if (specs.length === 0) {
  console.error('No pages found in src/pages/.')
  process.exit(1)
}

// A request must not be able to take the server down. The framework handles the cases it knows
// of (a failing fetcher that nothing awaits), but any other promise that rejects without a
// handler would end the process on Node 15+. Log it and keep serving.
process.on('unhandledRejection', (reason) => {
  console.error('[Pulse] Unhandled promise rejection (the server keeps running):', reason)
})

createServer(specs, {
  port,
  stream:       true,
  staticDir:    PUBLIC_DIR,
  defaultCache,
  staticCache,
  ...(store ? { store } : {}),
  ...(csp ? { csp } : {}),
  ...passthrough,
}).catch(failStartup)
