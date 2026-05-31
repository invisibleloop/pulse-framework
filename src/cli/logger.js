/**
 * Pulse CLI — structured terminal logger
 *
 * Single module that owns all terminal output. In non-TTY mode (CI, piped),
 * produces clean timestamped lines. In TTY mode, emits events to the bus
 * so the Ink TUI can render them instead.
 *
 * Call setTuiMode(true) before the first request to switch to event mode.
 */

import { c, icon, elapsed, visLen } from './fmt.js'
import { bus } from './events.js'

// ---------------------------------------------------------------------------
// Mode
// ---------------------------------------------------------------------------

let tuiMode = false

/** Switch to TUI mode — logger emits events instead of writing to stdout. */
export function setTuiMode(enabled) { tuiMode = enabled }

// ---------------------------------------------------------------------------
// Helpers (plain logger)
// ---------------------------------------------------------------------------

const STATIC_EXT = /\.(js|css|map|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|webp|avif|json)$/i
const STATIC_PATH = /^\/(dist|fonts|images|public)\//

function isStatic(pathname) {
  return STATIC_EXT.test(pathname) || STATIC_PATH.test(pathname)
}

function timestamp() {
  return c.dim(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
}

function statusColor(code) {
  if (code >= 500) return c.red(String(code))
  if (code >= 400) return c.yellow(String(code))
  if (code >= 300) return c.cyan(String(code))
  return c.dim(String(code))
}

function methodColor(method) {
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') return c.yellow(method.padEnd(4))
  if (method === 'DELETE') return c.red(method.padEnd(4))
  return c.dim(method.padEnd(4))
}

// ---------------------------------------------------------------------------
// Banner — printed once at startup (plain mode only)
// ---------------------------------------------------------------------------

/**
 * Print the startup banner (plain logger mode).
 * In TUI mode the banner is rendered by the Ink app directly.
 */
export function banner({ url, version, specs = [], agentMode = false }) {
  if (tuiMode) return

  const agentLabel = agentMode ? `  ${c.cyan('●')} ${c.dim('Agent active')}` : ''

  process.stdout.write('\n')
  process.stdout.write(`  ${icon.bolt()} ${c.bold('Pulse')}  ${c.dim(`v${version}`)}  ${c.dim('→')}  ${c.cyan(url)}${agentLabel}\n`)
  process.stdout.write('\n')

  if (specs.length > 0) {
    const routeW  = Math.max(5, ...specs.map(s => (s.route || '?').length))
    const methodW = 6

    const header  = `  ${c.dim('Route'.padEnd(routeW))}  ${c.dim('Method'.padEnd(methodW))}  ${c.dim('JS')}`
    const divider = `  ${c.dim('─'.repeat(routeW + methodW + 8))}`

    process.stdout.write(header + '\n')
    process.stdout.write(divider + '\n')

    for (const s of specs) {
      const route   = (s.route || '?').padEnd(routeW)
      const method  = (s.method?.toUpperCase() || 'GET').padEnd(methodW)
      const hydrate = s.hydrate ? c.green('✓ hydrated') : c.dim('— static')
      process.stdout.write(`  ${c.cyan(route)}  ${c.dim(method)}  ${hydrate}\n`)
    }
    process.stdout.write('\n')
  }

  process.stdout.write(c.dim('  Ready. Watching for changes…\n'))
  process.stdout.write(c.dim('  ' + '─'.repeat(48) + '\n'))
  process.stdout.write('\n')
}

// ---------------------------------------------------------------------------
// Request log
// ---------------------------------------------------------------------------

export function request({ method, pathname, status, ms }) {
  if (pathname === '/healthz' || pathname === '/_pulse/health' || pathname === '/_pulse/reload') return

  if (tuiMode) {
    bus.emit('request', { method, pathname, status, ms, timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })
    return
  }

  const isAsset = isStatic(pathname)
  const ts      = timestamp()
  const m       = methodColor(method)
  const p       = isAsset ? c.dim(pathname) : pathname
  const s       = statusColor(status)
  const t       = c.dim(elapsed(ms))

  if (isAsset) {
    process.stdout.write(`${ts}  ${c.dim(method.padEnd(4))}  ${p}  ${c.dim(String(status))}  ${t}\n`)
  } else if (status >= 500) {
    process.stdout.write(`${ts}  ${icon.fail()}  ${m}  ${c.red(pathname)}  ${s}  ${t}\n`)
  } else if (status >= 400) {
    process.stdout.write(`${ts}  ${icon.warn()}  ${m}  ${c.yellow(pathname)}  ${s}  ${t}\n`)
  } else {
    process.stdout.write(`${ts}  ${icon.info()}  ${m}  ${p}  ${s}  ${t}\n`)
  }
}

// ---------------------------------------------------------------------------
// Named events
// ---------------------------------------------------------------------------

export function ready(url) {
  if (tuiMode) return
  process.stdout.write(`${timestamp()}  ${icon.ok()}  ${c.dim('Server ready')}  ${c.dim(url)}\n`)
}

export function shutdown(forced = false) {
  if (tuiMode) { bus.emit('shutdown', { forced }); return }
  process.stdout.write('\n')
  if (forced) {
    process.stdout.write(`  ${icon.fail()}  ${c.red('Force-exiting after shutdown timeout')}\n`)
  } else {
    process.stdout.write(`  ${icon.info()}  ${c.dim('Shutting down gracefully…')}\n`)
  }
}

export function error(msg, err) {
  if (tuiMode) { bus.emit('error', { msg }); return }
  process.stdout.write(`${timestamp()}  ${icon.fail()}  ${c.red(msg)}\n`)
  if (err?.stack) process.stdout.write(c.dim(err.stack.split('\n').slice(1, 4).map(l => '    ' + l).join('\n')) + '\n')
}

export function info(msg) {
  if (tuiMode) { bus.emit('info', { msg }); return }
  process.stdout.write(`${timestamp()}  ${icon.info()}  ${c.dim(msg)}\n`)
}

export function warn(msg) {
  if (tuiMode) { bus.emit('warn', { msg }); return }
  process.stdout.write(`${timestamp()}  ${icon.warn()}  ${c.yellow(msg)}\n`)
}
