import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { writeDevPort, removeDevPort, readDevPort, resolveDevPort, DEV_PORT_FILE } from './dev-port.js'

function project() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-devport-'))
}

/** A pid that is certainly not running: a child that has already exited. */
function deadPid() {
  return spawnSync(process.execPath, ['-e', '']).pid
}

test('writeDevPort records the port and pid, and readDevPort returns the port while the process lives', () => {
  const root = project()
  try {
    writeDevPort(root, 3010)
    assert.equal(readDevPort(root), 3010)
    const record = JSON.parse(fs.readFileSync(path.join(root, DEV_PORT_FILE), 'utf8'))
    assert.equal(record.pid, process.pid)
    assert.equal(record.root, path.resolve(root))
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('readDevPort ignores a record whose process has gone, a missing file and a damaged file', () => {
  const root = project()
  try {
    assert.equal(readDevPort(root), null, 'no file')
    writeDevPort(root, 3010, deadPid())
    assert.equal(readDevPort(root), null, 'the process has exited')
    fs.writeFileSync(path.join(root, DEV_PORT_FILE), 'not json')
    assert.equal(readDevPort(root), null, 'damaged file')
    fs.writeFileSync(path.join(root, DEV_PORT_FILE), JSON.stringify({ port: 'abc', pid: process.pid, root: path.resolve(root) }))
    assert.equal(readDevPort(root), null, 'port is not a number')
    fs.writeFileSync(path.join(root, DEV_PORT_FILE), JSON.stringify({ port: 70000, pid: process.pid, root: path.resolve(root) }))
    assert.equal(readDevPort(root), null, 'port out of range')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('readDevPort ignores a record copied in from another project', () => {
  const root = project()
  try {
    fs.mkdirSync(path.join(root, '.pulse'), { recursive: true })
    fs.writeFileSync(path.join(root, DEV_PORT_FILE), JSON.stringify({ port: 3010, pid: process.pid, root: '/somewhere/else' }))
    assert.equal(readDevPort(root), null)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('removeDevPort removes only a record this process wrote', () => {
  const root = project()
  try {
    writeDevPort(root, 3010)
    removeDevPort(root, process.pid + 1)
    assert.equal(readDevPort(root), 3010, 'another process must not remove it')
    removeDevPort(root)
    assert.equal(fs.existsSync(path.join(root, DEV_PORT_FILE)), false)
    removeDevPort(root)   // no file: no error
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('resolveDevPort prefers the running server, then the config, then 3000', () => {
  const root = project()
  try {
    assert.equal(resolveDevPort(root, 4000), 4000)
    assert.equal(resolveDevPort(root, undefined), 3000)
    writeDevPort(root, 3010)
    assert.equal(resolveDevPort(root, 4000), 3010)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('pulse dev records the port it really listens on and removes the record when it exits', async () => {
  const root = project()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}')
    fs.writeFileSync(path.join(root, 'pulse.config.js'), 'export default {}\n')
    fs.writeFileSync(path.join(root, 'src/pages/home.js'), "export default { route: '/', view: () => '<main id=\"main-content\"><h1>Hi</h1></main>' }\n")
    const dev = fileURLToPath(new URL('./dev.js', import.meta.url))
    const { spawn } = await import('node:child_process')
    const proc = spawn(process.execPath, [dev, '--root', root, '--port', '0'], { stdio: 'ignore' })
    try {
      const deadline = Date.now() + 15000
      let port = null
      while (Date.now() < deadline && !(port = readDevPort(root))) await new Promise(r => setTimeout(r, 100))
      assert(port && port > 0, 'dev.js never recorded a port')
      const res = await fetch(`http://127.0.0.1:${port}/`)
      assert.equal(res.status, 200, 'the recorded port must serve the project')
    } finally {
      proc.kill('SIGTERM')
      await new Promise(r => proc.once('exit', r))
    }
    assert.equal(readDevPort(root), null, 'a stopped server is no longer reported')
    // Windows ends the process on SIGTERM without running exit handlers, so only there the stale
    // file may remain; readDevPort ignores it because its process is gone
    if (process.platform !== 'win32') assert.equal(fs.existsSync(path.join(root, DEV_PORT_FILE)), false, 'the record goes when the server stops')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
