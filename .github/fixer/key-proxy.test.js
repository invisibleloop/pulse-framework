import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createProxy } from './key-proxy.js'

const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)))

async function withProxy(opts, fn) {
  const seen = []
  const up = http.createServer((req, res) => {
    seen.push({ method: req.method, url: req.url, headers: req.headers })
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.write('data: one\n\n')
    setTimeout(() => res.end('data: two\n\n'), 20)
  })
  const upPort = await listen(up)
  const proxy = createProxy({ key: 'sk-REAL', upstream: `http://127.0.0.1:${upPort}`, ...opts })
  const port = await listen(proxy)
  try { await fn(port, seen) } finally { proxy.close(); up.close(); proxy.closeAllConnections?.(); up.closeAllConnections?.() }
}

const call = (port, { method = 'POST', path = '/v1/messages', headers = {}, body = '{}' } = {}) =>
  fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: method === 'POST' ? body : undefined })

test('adds the real key, drops whatever credentials the client sent, and streams the reply', async () => {
  await withProxy({}, async (port, seen) => {
    const res = await call(port, { headers: { 'x-api-key': 'placeholder', authorization: 'Bearer nope', cookie: 'a=b' } })
    assert.equal(res.status, 200)
    assert.equal(await res.text(), 'data: one\n\ndata: two\n\n')
    assert.equal(seen[0].headers['x-api-key'], 'sk-REAL')
    assert.equal(seen[0].headers.authorization, undefined)
    assert.equal(seen[0].headers.cookie, undefined)
  })
})

test('forwards only the Messages API: other paths and methods are refused without reaching upstream', async () => {
  await withProxy({}, async (port, seen) => {
    for (const p of ['/v1/models', '/v1/organizations', '/', '/v1/messages/../models', '/v1/messages/batches'])
      assert.equal((await call(port, { path: p })).status, 404, p)
    assert.equal((await call(port, { method: 'GET' })).status, 404)
    assert.equal(seen.length, 0)
  })
})

test('stops serving after the request budget', async () => {
  await withProxy({ maxRequests: 2 }, async port => {
    assert.equal((await call(port)).status, 200)
    assert.equal((await call(port)).status, 200)
    assert.equal((await call(port)).status, 429)
  })
})

test('the CLI reads the key from stdin only and refuses to start without one', async () => {
  const file = fileURLToPath(new URL('./key-proxy.js', import.meta.url))
  const child = spawn(process.execPath, [file], { stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH } })
  child.stdin.end('')
  const code = await new Promise(r => child.on('exit', r))
  assert.equal(code, 1)
})
