/**
 * Pulse — `pulse dev` listen address
 * run: node src/cli/dev-host.test.js
 *
 * The dev server has dev-only endpoints and stack-trace error pages, so by default it
 * must not be reachable from other machines. This starts the real dev script as a child
 * process and checks the network behaviour, not just a config value.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs   from 'node:fs'
import net  from 'node:net'
import os   from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'url'

const DEV = fileURLToPath(new URL('./dev.js', import.meta.url))

function freePort() {
  return new Promise(resolve => {
    const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)) })
  })
}

/** Can a TCP connection to host:port be made? */
const canConnect = (host, port) => new Promise(resolve => {
  const sock = net.connect({ host, port, timeout: 1500 })
  sock.once('connect', () => { sock.destroy(); resolve(true) })
  sock.once('timeout', () => { sock.destroy(); resolve(false) })
  sock.once('error', () => resolve(false))
})

/** A non-loopback IPv4 address of this machine, if it has one. */
const lanAddress = Object.values(os.networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal)?.address

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-dev-host-'))
  fs.mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'src', 'pages', 'index.js'),
    "export default { route: '/', meta: { title: 'T', description: 'd', theme: 'dark' }, view: () => '<main id=\"main-content\">hi</main>' }\n")
  return dir
}

async function withDev(extraArgs, fn) {
  const dir  = project()
  const port = await freePort()
  const proc = spawn(process.execPath, [DEV, '--root', dir, '--port', String(port), ...extraArgs], { stdio: 'ignore' })
  try {
    for (let i = 0; i < 100 && !(await canConnect('127.0.0.1', port)); i++) await new Promise(r => setTimeout(r, 150))
    assert(await canConnect('127.0.0.1', port), 'dev server did not start')
    await fn(port)
  } finally {
    proc.kill('SIGKILL')
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test('pulse dev listens on loopback only by default', { skip: !lanAddress && 'no LAN interface on this machine' }, async () => {
  await withDev([], async (port) => {
    assert.equal(await canConnect('127.0.0.1', port), true, 'loopback should work')
    // Browsers and the MCP tools use the name "localhost", which may resolve to ::1 first.
    const viaName = await fetch(`http://localhost:${port}/`).then(r => r.status).catch(e => `error: ${e.cause?.code || e.message}`)
    assert.equal(viaName, 200, `http://localhost:${port}/ must still work (got ${viaName})`)
    assert.equal(await canConnect(lanAddress, port), false, `dev server must not answer on ${lanAddress}`)
  })
})

test('pulse dev --host 0.0.0.0 opts in to other interfaces', { skip: !lanAddress && 'no LAN interface on this machine' }, async () => {
  await withDev(['--host', '0.0.0.0'], async (port) => {
    assert.equal(await canConnect(lanAddress, port), true, `--host 0.0.0.0 should answer on ${lanAddress}`)
  })
})
