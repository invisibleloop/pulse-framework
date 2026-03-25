/**
 * Pulse — Examples dev server
 *
 * Serves all six standalone example apps.
 * Handles /src/, /examples/, and /public/ as static JS so dev hydration works.
 *
 * Run: node examples/dev.server.js
 *
 *   http://localhost:3001/counter   — mutations + constraints
 *   http://localhost:3001/todos     — CRUD + persist + filter
 *   http://localhost:3001/contact   — server data + validation + action
 *   http://localhost:3001/quiz      — multi-step state machine
 *   http://localhost:3001/products  — server data + search/filter/sort
 *   http://localhost:3001/pricing   — landing page components + billing toggle
 */

import fs   from 'fs'
import path from 'path'
import { createServer } from '../src/server/index.js'
import { themeScript }  from './shared.js'
import counter  from './counter.js'
import todos    from './todos.js'
import contact  from './contact.js'
import quiz     from './quiz.js'
import products from './products.js'
import pricing  from './pricing.js'

const ROOT = path.resolve(import.meta.dirname, '..')

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
}

// /@pulse/runtime/* → src/runtime/*
// /@pulse/ui/*      → src/ui/*
// Maps bare-specifier aliases used by the dev-mode bootstrap.
const PULSE_PREFIX_MAP = {
  '/@pulse/runtime/': path.join(ROOT, 'src/runtime/'),
  '/@pulse/ui/':      path.join(ROOT, 'src/ui/'),
}

// Serve /src/, /examples/, and /@pulse/ alias paths so the browser can import
// spec and runtime files during dev hydration.
function staticHandler(req, res) {
  const url      = new URL(req.url, 'http://localhost')
  const pathname = url.pathname

  // /@pulse/* prefix aliases → src/
  for (const [prefix, dir] of Object.entries(PULSE_PREFIX_MAP)) {
    if (pathname.startsWith(prefix)) {
      const filePath = path.join(dir, pathname.slice(prefix.length))
      if (!filePath.startsWith(dir)) return
      let stat
      try { stat = fs.statSync(filePath) } catch { return }
      if (!stat.isFile()) return
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      fs.createReadStream(filePath).pipe(res)
      return false
    }
  }

  if (!pathname.startsWith('/examples/') && !pathname.startsWith('/src/')) return

  const filePath = path.join(ROOT, pathname)
  if (!filePath.startsWith(ROOT + path.sep)) return

  let stat
  try { stat = fs.statSync(filePath) } catch { return }
  if (!stat.isFile()) return

  const ext  = path.extname(filePath)
  const mime = MIME[ext] || 'text/plain'

  res.writeHead(200, { 'Content-Type': mime })
  fs.createReadStream(filePath).pipe(res)
  return false
}

createServer(
  [counter, todos, contact, quiz, products, pricing],
  {
    port:       3001,
    stream:     true,
    staticDir:  path.join(ROOT, 'public'),
    onRequest:  staticHandler,
    extraBody:  themeScript,
  }
)
