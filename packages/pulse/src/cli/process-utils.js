/**
 * Pulse — process management helpers
 *
 * Shared between the MCP server (pulse_restart_server, pulse_build) and the
 * CLI (`pulse stop`) — both need to free a port before starting a server,
 * and both previously did it with a blind `lsof -ti:PORT | xargs kill -9`.
 */

import { execFileSync } from 'child_process'
import path from 'path'

/** Command-line substrings that identify a process as a Pulse server. */
export const PULSE_SERVER_MARKERS = ['cli/dev.js', 'cli/start.js', 'scripts/build.js']

/**
 * Kill only processes on `port` that are actually a Pulse dev/prod server —
 * never an unconditional `lsof -ti:PORT | xargs kill -9`.
 *
 * That blind pattern used to be at every restart/build/stop call site: it
 * kills whatever happens to be listening on the configured port, no
 * ownership check at all. On a machine running other projects, a plain
 * port collision (an unrelated Next.js/Vite/Rails dev server left running
 * on 3000, say) means one Pulse command silently kills someone else's
 * server. Found via a real user report: pulse_fetch_page returned a stale
 * 500 from an unrelated project on port 3000, then the next
 * pulse_restart_server call — which still ran the blind kill — coincided
 * with the MCP connection itself dropping.
 *
 * Only kills a PID whose command line contains one of PULSE_SERVER_MARKERS
 * — anything else on the port is left alone and reported back instead.
 *
 * When `root` is given, a Pulse server that was started for a different project (its command line
 * has `--root <other path>`) is left alone too. Two projects can use the same port number, and
 * restarting one must not kill the other.
 *
 * @param {number} port
 * @param {{ root?: string }} [options]
 * @returns {{ killed: string[], skipped: { pid: string, command: string }[] }}
 */
export function killPulseServerOnPort(port, { root } = {}) {
  return process.platform === 'win32' ? killOnPortWindows(port, root) : killOnPortPosix(port, root)
}

/** True when a command line names a --root other than `root`. A command with no --root is not judged. */
export function startedForOtherProject(command, root) {
  if (!root) return false
  const normalised = command.replace(/\\/g, '/')
  if (!/\s--root\s/.test(normalised)) return false
  const want = path.resolve(root).replace(/\\/g, '/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return !new RegExp(`\\s--root\\s+["']?${want}(?=["']?(\\s|$))`).test(normalised)
}

function classify(result, pid, command, kill, root) {
  // Windows command lines use backslashes; the markers are written with forward slashes
  const normalised = command.replace(/\\/g, '/')
  if (PULSE_SERVER_MARKERS.some(marker => normalised.includes(marker)) && !startedForOtherProject(command, root)) {
    kill(pid)
    result.killed.push(pid)
  } else {
    result.skipped.push({ pid, command })
  }
}

function killOnPortPosix(port, root) {
  const result = { killed: [], skipped: [] }
  let pids
  try {
    pids = execFileSync('sh', ['-c', `lsof -ti:${port} 2>/dev/null`], { encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(Boolean)
  } catch {
    return result // lsof found nothing — nothing to do
  }
  for (const pid of pids) {
    let command = ''
    try {
      command = execFileSync('sh', ['-c', `ps -o command= -p ${pid} 2>/dev/null`], { encoding: 'utf8' }).trim()
    } catch { continue } // process gone between lsof and ps — nothing to kill
    if (!command) continue
    classify(result, pid, command, p => {
      try { execFileSync('sh', ['-c', `kill -9 ${p} 2>/dev/null`]) } catch { /* already gone */ }
    }, root)
  }
  return result
}

function powershell(script) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' })
}

function killOnPortWindows(port, root) {
  const result = { killed: [], skipped: [] }
  const portNum = Number(port)
  if (!Number.isInteger(portNum)) return result
  let pids
  try {
    pids = powershell(`Get-NetTCPConnection -LocalPort ${portNum} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`)
      .split(/\r?\n/).map(s => s.trim()).filter(s => /^\d+$/.test(s))
  } catch {
    return result
  }
  for (const pid of pids) {
    let command = ''
    try {
      command = powershell(`(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`).trim()
    } catch { continue }
    if (!command) continue
    classify(result, pid, command, p => {
      try { execFileSync('taskkill', ['/F', '/PID', p], { stdio: 'ignore' }) } catch { /* already gone */ }
    }, root)
  }
  return result
}
