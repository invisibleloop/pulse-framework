/**
 * Pulse — process-utils.js tests
 * run: node src/cli/process-utils.test.js
 *
 * killPulseServerOnPort must never kill a process it didn't spawn as a
 * Pulse dev/prod server — see its doc comment for the real user report
 * (an unrelated Next.js dev server on port 3000 was at risk of being
 * killed by a blind lsof|kill) this fixes.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import { spawn }  from 'node:child_process'
import net        from 'node:net'
import path       from 'node:path'
import { killPulseServerOnPort, startedForOtherProject } from './process-utils.js'

/** Find a free TCP port by binding to port 0 and reading it back. */
async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

/** Spawn a plain (non-Pulse) process holding a port open, for negative tests. */
function spawnPlainListener(port) {
  const proc = spawn(process.execPath, ['-e', `
    const net = require('net')
    net.createServer().listen(${port})
    setInterval(() => {}, 1000) // keep the process alive
  `])
  return proc
}

async function waitUntilListening(port, maxMs = 3000) {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const alive = await new Promise(resolve => {
      const sock = net.createConnection(port, '127.0.0.1')
      sock.on('connect', () => { sock.destroy(); resolve(true) })
      sock.on('error',   () => resolve(false))
    })
    if (alive) return true
    await new Promise(r => setTimeout(r, 50))
  }
  return false
}

async function waitUntilFree(port, maxMs = 3000) {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const alive = await new Promise(resolve => {
      const sock = net.createConnection(port, '127.0.0.1')
      sock.on('connect', () => { sock.destroy(); resolve(true) })
      sock.on('error',   () => resolve(false))
    })
    if (!alive) return true
    await new Promise(r => setTimeout(r, 50))
  }
  return false
}

test('killPulseServerOnPort does not kill a process whose command line has no Pulse marker', async () => {
  const port = await freePort()
  const proc = spawnPlainListener(port)
  try {
    assert.equal(await waitUntilListening(port), true, 'test listener never came up')

    const result = killPulseServerOnPort(port)

    assert.equal(result.killed.length, 0, 'must not report the unrelated process as killed')
    assert.equal(result.skipped.length, 1, 'must report exactly one skipped process')
    assert.equal(result.skipped[0].pid, String(proc.pid))
    // The process must actually still be alive — not just unreported as killed.
    assert.equal(await waitUntilFree(port, 300), false, 'the unrelated process must still be listening')
  } finally {
    proc.kill('SIGKILL')
  }
})

test('killPulseServerOnPort kills a process whose command line matches a Pulse marker', async () => {
  const port = await freePort()
  // Simulate a Pulse dev server by giving the child process's argv a marker
  // substring (cli/dev.js) without actually running the real dev server —
  // exercises the same ps-based matching path a real `node .../cli/dev.js`
  // invocation would hit.
  const proc = spawn(process.execPath, ['-e', `
    const net = require('net')
    net.createServer().listen(${port})
    setInterval(() => {}, 1000)
  `, '--', 'cli/dev.js'])
  try {
    assert.equal(await waitUntilListening(port), true, 'test listener never came up')

    const result = killPulseServerOnPort(port)

    assert.equal(result.skipped.length, 0, 'must not skip a process matching a Pulse marker')
    assert.equal(result.killed.length, 1)
    assert.equal(result.killed[0], String(proc.pid))
    assert.equal(await waitUntilFree(port), true, 'the matched process must actually be killed')
  } finally {
    try { proc.kill('SIGKILL') } catch { /* already dead */ }
  }
})

test('killPulseServerOnPort on a free port returns empty killed and skipped', async () => {
  const port = await freePort()
  const result = killPulseServerOnPort(port)
  assert.deepEqual(result, { killed: [], skipped: [] })
})

test('startedForOtherProject: only a --root naming a different project counts', () => {
  // Built with path.resolve so the paths are absolute on this platform (D:\\work\\shop on Windows)
  const root  = path.resolve('/work/shop')
  const other = path.resolve('/work/blog')
  const dev   = (args) => `node ${path.resolve('/pkg/cli/dev.js')} ${args}`
  assert.equal(startedForOtherProject(dev(`--root ${root}`), root), false)
  assert.equal(startedForOtherProject(dev(`--root ${root} --port 3010`), root), false)
  assert.equal(startedForOtherProject(dev(`--root "${root}"`), root), false)
  assert.equal(startedForOtherProject(dev(`--root ${other}`), root), true)
  assert.equal(startedForOtherProject(dev(`--root ${root}-two`), root), true, 'a longer path sharing the prefix is another project')
  assert.equal(startedForOtherProject(dev(''), root), false, 'no --root: not judged')
  assert.equal(startedForOtherProject(dev(`--root ${other}`), undefined), false, 'no root given: not judged')
})

test('killPulseServerOnPort leaves a Pulse server started for another project, and kills one started for this project', async () => {
  const mine  = path.resolve('/tmp/pulse-test-mine')
  const other = path.resolve('/tmp/pulse-test-other')
  for (const [rootArg, expectKilled] of [[other, false], [mine, true]]) {
    const port = await freePort()
    const proc = spawn(process.execPath, ['-e', `
      const net = require('net')
      net.createServer().listen(${port})
      setInterval(() => {}, 1000)
    `, '--', 'cli/dev.js', '--root', rootArg])
    try {
      assert.equal(await waitUntilListening(port), true, 'test listener never came up')
      const result = killPulseServerOnPort(port, { root: mine })
      assert.equal(result.killed.length, expectKilled ? 1 : 0, `killed for --root ${rootArg}`)
      assert.equal(result.skipped.length, expectKilled ? 0 : 1, `skipped for --root ${rootArg}`)
      assert.equal(await waitUntilFree(port, expectKilled ? 3000 : 300), expectKilled, expectKilled ? 'must be killed' : 'the other project\'s server must keep running')
    } finally {
      try { proc.kill('SIGKILL') } catch { /* already dead */ }
    }
  }
})
