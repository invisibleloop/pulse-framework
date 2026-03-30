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
import { loadPages }    from './discover.js'

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
let csp          = null

const configPath = path.join(ROOT, 'pulse.config.js')
if (fs.existsSync(configPath)) {
  try {
    const mod    = await import(configPath)
    port         = port || mod.default?.port || null
    defaultCache = mod.default?.defaultCache ?? null
    csp          = mod.default?.csp ?? null
  } catch { /* ignore */ }
}

// Render (and other PaaS platforms) inject PORT — always takes precedence
port = parseInt(process.env.PORT, 10) || port || 3000

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const specs = await loadPages(ROOT)

if (specs.length === 0) {
  console.error('No pages found in src/pages/.')
  process.exit(1)
}

createServer(specs, {
  port,
  stream:       true,
  staticDir:    PUBLIC_DIR,
  defaultCache,
  ...(csp ? { csp } : {}),
})
