/**
 * Pulse CLI — structured terminal logger
 *
 * Single module that owns all terminal output. Produces clean, scannable
 * output: one-time startup banner, then a timestamped scrolling log.
 *
 * Rules:
 *  - Static asset requests (JS, CSS, images, fonts) are dimmed and collapsed
 *  - Errors always stand out (red ✗ prefix)
 *  - Agent activity gets a distinct indicator
 *  - Respects NO_COLOR and CI env vars
 */

import { c, icon, elapsed, visLen } from './fmt.js'

// ---------------------------------------------------------------------------
// Helpers
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
// Banner — printed once at startup
// ---------------------------------------------------------------------------

/**
 * Print the startup banner.
 * @param {{ url: string, version: string, specs: Array<{route:string, method?:string, hydrate?:string}>, agentMode?: boolean }} opts
 */
export function banner({ url, version, specs = [], agentMode = false }) {
  const agentLabel = agentMode ? `  ${c.cyan('●')} ${c.dim('Agent active')}` : ''

  process.stdout.write('\n')
  process.stdout.write(`  ${icon.bolt()} ${c.bold('Pulse')}  ${c.dim(`v${version}`)}  ${c.dim('→')}  ${c.cyan(url)}${agentLabel}\n`)
  process.stdout.write('\n')

  if (specs.length > 0) {
    // Column widths
    const routeW  = Math.max(5, ...specs.map(s => (s.route || '?').length))
    const methodW = 6

    const header = `  ${c.dim('Route'.padEnd(routeW))}  ${c.dim('Method'.padEnd(methodW))}  ${c.dim('JS')}`
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
// Request log — one line per request
// ---------------------------------------------------------------------------

/**
 * Log a completed HTTP request.
 * @param {{ method: string, pathname: string, status: number, ms: number }} opts
 */
export function request({ method, pathname, status, ms }) {
  const isAsset = isStatic(pathname)

  // Skip health check noise
  if (pathname === '/healthz' || pathname === '/_pulse/health') return

  const ts     = timestamp()
  const m      = methodColor(method)
  const p      = isAsset ? c.dim(pathname) : pathname
  const s      = statusColor(status)
  const t      = c.dim(elapsed(ms))

  if (isAsset) {
    // Static assets — dim the whole line, no leading symbol
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
// Named events — server lifecycle
// ---------------------------------------------------------------------------

export function ready(url) {
  process.stdout.write(`${timestamp()}  ${icon.ok()}  ${c.dim('Server ready')}  ${c.dim(url)}\n`)
}

export function shutdown(forced = false) {
  process.stdout.write('\n')
  if (forced) {
    process.stdout.write(`  ${icon.fail()}  ${c.red('Force-exiting after shutdown timeout')}\n`)
  } else {
    process.stdout.write(`  ${icon.info()}  ${c.dim('Shutting down gracefully…')}\n`)
  }
}

export function error(msg, err) {
  process.stdout.write(`${timestamp()}  ${icon.fail()}  ${c.red(msg)}\n`)
  if (err?.stack) process.stdout.write(c.dim(err.stack.split('\n').slice(1, 4).map(l => '    ' + l).join('\n')) + '\n')
}

export function info(msg) {
  process.stdout.write(`${timestamp()}  ${icon.info()}  ${c.dim(msg)}\n`)
}

export function warn(msg) {
  process.stdout.write(`${timestamp()}  ${icon.warn()}  ${c.yellow(msg)}\n`)
}
