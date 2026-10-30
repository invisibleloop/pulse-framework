/**
 * Pulse — the port a project's dev server is really using.
 *
 * `pulse dev` can end up on a port that pulse.config.js does not name: `--port 3010` because 3000
 * was busy, say. The agent tools (pulse_status, pulse_restart_server, pulse_build) read the port from
 * the config, so they looked at 3000 and talked to another project's server. The dev server now
 * records its port in .pulse/dev.json, and the tools read it first.
 */

import fs   from 'fs'
import net  from 'net'
import path from 'path'

export const DEV_PORT_FILE = path.join('.pulse', 'dev.json')

/** Record this process as the project's dev server. */
export function writeDevPort(root, port, pid = process.pid) {
  const file = path.join(root, DEV_PORT_FILE)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ port, pid, root: path.resolve(root) }) + '\n')
}

/** Remove the record, but only if this process wrote it (a newer server may have replaced it). */
export function removeDevPort(root, pid = process.pid) {
  const file = path.join(root, DEV_PORT_FILE)
  try {
    if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === pid) fs.rmSync(file)
  } catch { /* no file, or not ours */ }
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true } catch (err) { return err.code === 'EPERM' }
}

/** The port of this project's running dev server, or null when there is no live record. */
export function readDevPort(root) {
  let record
  try { record = JSON.parse(fs.readFileSync(path.join(root, DEV_PORT_FILE), 'utf8')) } catch { return null }
  if (!Number.isInteger(record?.port) || record.port < 1 || record.port > 65535) return null
  if (!Number.isInteger(record.pid) || !isAlive(record.pid)) return null
  if (record.root !== path.resolve(root)) return null
  return record.port
}

/** The dev port the tools should use: the running server's, else the configured one, else 3000. */
export function resolveDevPort(root, configPort) {
  return readDevPort(root) ?? configPort ?? 3000
}

/** Whether something accepts connections on `port` at `address`. */
function accepts(port, address) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: address })
    const done = (answer) => { socket.destroy(); resolve(answer) }
    socket.setTimeout(500, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
}

/** Whether a server can bind `port` at `host` (no host = all addresses) right now. */
function canBind(port, host) {
  return new Promise(resolve => {
    const probe = net.createServer()
    probe.once('error', () => resolve(false))
    const listening = () => probe.close(() => resolve(true))
    if (host) probe.listen(port, host, listening)
    else      probe.listen(port, listening)
  })
}

/**
 * Whether `port` is free for a server on `host`. Binding `host` alone is not a test: macOS and
 * Windows let a server on 127.0.0.1 bind a port that another project already holds on all
 * addresses, and then `localhost` may reach the other project. Binding all addresses as well fails
 * when anyone holds the port. macOS also lets that wildcard bind sit beside a server on one address,
 * so there a port counts as busy too when something answers on it at either loopback address. The
 * connect probe stays off Windows, where it reported every port busy.
 */
async function isFree(port, host) {
  if (!(await canBind(port, host)) || !(await canBind(port))) return false
  if (process.platform !== 'darwin') return true
  return !(await accepts(port, '127.0.0.1')) && !(await accepts(port, '::1'))
}

/**
 * The first free port from `start` up, trying `tries` ports. Returns `start` when none is free,
 * so the server's own "port is in use" message is what the user sees.
 */
export async function findFreePort(start, host = '127.0.0.1', tries = 20) {
  for (let port = start; port < start + tries && port <= 65535; port++) {
    if (await isFree(port, host)) return port
  }
  return start
}
