/**
 * Pulse TUI — dev server orchestrator
 *
 * Spawns `pulse dev --port <n>` for a project and exposes its lifecycle
 * (starting, ready, output lines, errors) as an EventEmitter, same shape as
 * claude-session.js so both drive the UI the same way.
 *
 * Port selection: unlike Forge (which discovered — the hard way, see
 * pulse-framework's fix/pulse-dev-port-flag — that `pulse dev` ignores a
 * PORT env var and only honours an explicit --port flag), this passes
 * --port directly as a CLI arg to `pulse dev`.
 */

import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import readline from 'node:readline'
import net from 'node:net'

const READY_LINE = /Ready\. Watching for changes/
const URL_LINE    = /(https?:\/\/localhost:\d+)/

/**
 * Probe a single (host, port) pair for availability.
 */
function probePort(port, host) {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => srv.close(() => resolve(true)))
    if (host) srv.listen(port, host)
    else srv.listen(port)
  })
}

/**
 * Find a free TCP port starting from `preferred`, trying the next port up
 * on collision. Lets multiple Pulse TUI sessions run different projects
 * side by side without manual port bookkeeping.
 *
 * Probes BOTH the unspecified host (binds '::' — IPv6/all-interfaces) and
 * 127.0.0.1 (IPv4) explicitly. These are independent binding surfaces on
 * this platform: confirmed via a real EADDRINUSE crash where an unrelated
 * process from a different project held 127.0.0.1:3000 while ::3000 was
 * free — probing only the unspecified host reported the port "free", a new
 * `pulse dev` bound '::' successfully, then immediately crashed trying to
 * also bind 127.0.0.1. Checking a single family is not sufficient on either
 * side — must confirm both are actually free before considering the port usable.
 */
export async function findFreePort(preferred = 3000) {
  let port = preferred
  for (let attempts = 0; attempts < 20; attempts++) {
    const [freeAll, freeV4] = await Promise.all([
      probePort(port, undefined),
      probePort(port, '127.0.0.1'),
    ])
    if (freeAll && freeV4) return port
    port++
  }
  throw new Error(`No free port found starting from ${preferred}`)
}

export class DevServer extends EventEmitter {
  /**
   * @param {object} opts
   * @param {string} opts.cwd - Project directory
   * @param {number} opts.port
   */
  constructor({ cwd, port }) {
    super()
    this.cwd = cwd
    this.port = port
    this.url = `http://localhost:${port}`
    this.ready = false

    // detached: true puts this process in its own process group. `pulse dev`
    // itself spawns a further child (dev.js, via stdio: 'inherit') — a plain
    // SIGTERM to just this top-level process does not reliably reach that
    // grandchild through the shell/CLI wrapper layers, so a previous
    // session's server could survive a destroy() call as an orphan still
    // holding its port (confirmed as the real cause of a reported
    // "still get EADDRINUSE on 3000" bug — findFreePort's own check was
    // correct, but the previous session's server was never actually killed).
    // Killing the negative PID in destroy() below signals the whole group.
    this.proc = spawn('pulse', ['dev', '--port', String(port)], {
      cwd,
      shell: true,
      detached: true,
    })

    const stdout = readline.createInterface({ input: this.proc.stdout })
    stdout.on('line', (line) => this._handleLine(line, 'info'))

    const stderr = readline.createInterface({ input: this.proc.stderr })
    stderr.on('line', (line) => this._handleLine(line, 'error'))

    this.proc.on('exit', (code, signal) => {
      this.ready = false
      this.emit('exit', { code, signal })
    })

    this.proc.on('error', (err) => {
      this.emit('error', err)
    })
  }

  _handleLine(text, level) {
    this.emit('output', { level, text })

    const urlMatch = text.match(URL_LINE)
    if (urlMatch) {
      this.url = urlMatch[1]
      const actualPort = Number(urlMatch[1].match(/:(\d+)$/)?.[1])
      // Some globally-installed `pulse` versions silently ignore --port and
      // fall back to pulse.config.js / 3000 (fixed upstream, but a user's
      // installed CLI may predate that fix) — trust what the server actually
      // reports over what we requested, and tell the UI so it's not a silent
      // surprise if this project's URL doesn't match the port that was asked for.
      if (actualPort && actualPort !== this.port) {
        this.emit('port-mismatch', { requested: this.port, actual: actualPort })
        this.port = actualPort
      }
    }

    if (READY_LINE.test(text)) {
      this.ready = true
      this.emit('ready', { url: this.url })
    }
  }

  destroy() {
    // Negative PID signals the whole process group (see the `detached: true`
    // comment above) — this is what actually reaches `pulse dev`'s own child
    // process, not just the immediate shell wrapper.
    try { process.kill(-this.proc.pid, 'SIGTERM') } catch { /* already dead, or pid unavailable */ }
    // Belt and suspenders: also signal the direct child in case detached
    // process groups behave differently on the host platform.
    try { this.proc.kill('SIGTERM') } catch { /* already dead */ }
  }
}

/**
 * Start a dev server for `cwd`, auto-picking a free port near `preferred`.
 * @param {object} opts
 * @param {string} opts.cwd
 * @param {number} [opts.preferred]
 * @returns {Promise<DevServer>}
 */
export async function startDevServer({ cwd, preferred = 3000 }) {
  const port = await findFreePort(preferred)
  return new DevServer({ cwd, port })
}
