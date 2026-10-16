/**
 * MCP input guard tests — run with: node src/mcp/guards.test.js
 */

import fs     from 'node:fs'
import os     from 'node:os'
import path   from 'node:path'
import assert from 'node:assert/strict'
import { resolveInRoot, isInsideDir, isLoopbackUrl, isPrivateAddress, assertPublicUrl, makePublicLookup, requestPublic } from './guards.js'
import http from 'node:http'

let passed = 0
let failed = 0

async function test(label, fn) {
  try { await fn(); console.log(`  ✓ ${label}`); passed++ }
  catch (e) { console.log(`  ✗ ${label}\n      ${e.message}`); failed++ }
}

const base    = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-guards-'))
const root    = path.join(base, 'project')
const outside = path.join(base, 'outside')
fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
fs.mkdirSync(outside)
fs.writeFileSync(path.join(root, 'src', 'pages', 'a.js'), '')
fs.writeFileSync(path.join(outside, 'secret.js'), '')
fs.symlinkSync(outside, path.join(root, 'link'))

console.log('\nresolveInRoot\n')

await test('accepts absolute and relative paths inside the project', () => {
  assert.equal(resolveInRoot(root, path.join(root, 'src/pages/a.js')), path.join(root, 'src/pages/a.js'))
  assert.equal(resolveInRoot(root, 'src/pages/a.js'), path.join(root, 'src/pages/a.js'))
})
await test('accepts a not-yet-created file inside the project', () => {
  assert.doesNotThrow(() => resolveInRoot(root, 'src/pages/new.js'))
})
await test('rejects absolute paths outside the project', () => {
  assert.throws(() => resolveInRoot(root, path.join(outside, 'secret.js')), /inside the project/)
})
await test('rejects ../ traversal', () => {
  assert.throws(() => resolveInRoot(root, '../outside/secret.js'), /inside the project/)
  assert.throws(() => resolveInRoot(root, 'src/../../outside/secret.js'), /inside the project/)
})
await test('rejects a symlink inside the project that points outside it', () => {
  assert.throws(() => resolveInRoot(root, 'link/secret.js'), /inside the project/)
})
await test('rejects a sibling directory sharing the root name prefix', () => {
  fs.mkdirSync(root + '-evil')
  assert.throws(() => resolveInRoot(root, root + '-evil/x.js'), /inside the project/)
})

console.log('\nisLoopbackUrl\n')

await test('allows localhost, 127.x and ::1', () => {
  for (const u of ['http://localhost:3000/', 'http://127.0.0.1:3000/x', 'http://[::1]:3000/', 'http://app.localhost/'])
    assert.equal(isLoopbackUrl(u), true, u)
})
await test('rejects remote hosts, lookalikes and non-http schemes', () => {
  for (const u of ['http://example.com/', 'http://localhost.evil.com/', 'http://169.254.169.254/', 'file:///etc/passwd', 'ftp://localhost/', 'nonsense'])
    assert.equal(isLoopbackUrl(u), false, u)
})

console.log('\nisPrivateAddress / assertPublicUrl\n')

await test('flags loopback, private, link-local, CGNAT and metadata addresses', () => {
  for (const ip of ['127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', '::', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])
    assert.equal(isPrivateAddress(ip), true, ip)
})
await test('allows public addresses', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111'])
    assert.equal(isPrivateAddress(ip), false, ip)
})
await test('assertPublicUrl rejects internal IP literals and non-http schemes', async () => {
  await assert.rejects(assertPublicUrl('http://169.254.169.254/latest/meta-data/'), /not a public address/)
  await assert.rejects(assertPublicUrl('http://127.0.0.1:3000/'), /not a public address/)
  await assert.rejects(assertPublicUrl('http://[::1]/'), /not a public address/)
  await assert.rejects(assertPublicUrl('file:///etc/passwd'), /only http/)
})
await test('assertPublicUrl rejects hostnames that resolve to loopback', async () => {
  await assert.rejects(assertPublicUrl('http://localhost:3000/'), /non-public/)
})
await test('assertPublicUrl accepts a public IP literal', async () => {
  await assertPublicUrl('https://1.1.1.1/')
})


console.log('\nBypass regressions\n')

await test('isInsideDir needs a path separator, so sibling dirs sharing a prefix are outside', () => {
  assert.equal(isInsideDir('/proj/src/pages', '/proj/src/pages/a.js'), true)
  assert.equal(isInsideDir('/proj/src/pages', '/proj/src/pages-old/a.js'), false)
  assert.equal(isInsideDir('/proj/src/pages', '/proj/src/pages'), false)
  assert.equal(isInsideDir('/proj/src/components', '/proj/src/components.bak/a.js'), false)
})

await test('isLoopbackUrl: a hostname that merely starts with "127." is not loopback', () => {
  for (const u of ['http://127.evil.com/', 'http://127.0.0.1.nip.io/', 'http://127.example.org:3000/'])
    assert.equal(isLoopbackUrl(u), false, u)
  for (const u of ['http://127.0.0.1:3000/', 'http://127.1.2.3/', 'http://localhost:3000/', 'http://[::1]:3000/', 'http://app.localhost/'])
    assert.equal(isLoopbackUrl(u), true, u)
})

await test('isPrivateAddress: IPv4-embedding IPv6 forms and reserved ranges are non-public', () => {
  for (const ip of ['::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '::7f00:1', '64:ff9b::7f00:1', '2002:7f00:1::', '192.0.0.1', '198.18.0.1', '240.0.0.1'])
    assert.equal(isPrivateAddress(ip), true, ip)
})

await test('isPrivateAddress: real public addresses (v4, v6, v4-mapped) are still allowed', () => {
  for (const ip of ['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111', '::ffff:8.8.8.8'])
    assert.equal(isPrivateAddress(ip), false, ip)
})

await test('assertPublicUrl rejects bracketed IPv4-mapped and 6to4 hosts (the forms URL parsing produces)', async () => {
  for (const u of ['http://[::ffff:127.0.0.1]/', 'http://[::ffff:169.254.169.254]/latest/meta-data/', 'http://[::127.0.0.1]/', 'http://[2002:7f00:1::]/'])
    await assert.rejects(assertPublicUrl(u), /not a public address/, u)
})

await test('resolveInRoot refuses a path through a dangling symlink that points outside', () => {
  const target = path.join(outside, 'will-be-created.js')            // does not exist yet
  fs.symlinkSync(target, path.join(root, 'dangling.js'))
  assert.throws(() => resolveInRoot(root, 'dangling.js'), /broken symlink|inside the project/)
})

await test('makePublicLookup validates the address actually resolved (DNS rebinding)', async () => {
  const resolverReturning = (...ips) => (host, opts, cb) => cb(null, ips.map(address => ({ address, family: address.includes(':') ? 6 : 4 })))
  const run = (lookup) => new Promise((resolve) => lookup('rebind.example', {}, (err, addr) => resolve({ err, addr })))
  assert.equal((await run(makePublicLookup(resolverReturning('93.184.216.34')))).addr, '93.184.216.34')
  assert.match((await run(makePublicLookup(resolverReturning('127.0.0.1')))).err.message, /non-public/)
  assert.match((await run(makePublicLookup(resolverReturning('93.184.216.34', '10.0.0.5')))).err.message, /non-public/, 'any private answer poisons the set')
  assert.match((await run(makePublicLookup(resolverReturning('::ffff:7f00:1')))).err.message, /non-public/)
})

await test('requestPublic never connects to a hostname that resolves to loopback', async () => {
  let hits = 0
  const srv = http.createServer((req, res) => { hits++; res.end('internal') })
  await new Promise(r => srv.listen(0, '127.0.0.1', r))
  try {
    // "localhost" resolves to loopback; the connect-time lookup must refuse it.
    await assert.rejects(requestPublic(`http://localhost:${srv.address().port}/`), /non-public/)
    await assert.rejects(requestPublic(`http://127.0.0.1:${srv.address().port}/`), /not a public address/)
    await assert.rejects(requestPublic(`http://[::ffff:127.0.0.1]:${srv.address().port}/`), /not a public address/)
    assert.equal(hits, 0, 'the internal server must never be contacted')
  } finally { srv.close() }
})

fs.rmSync(base, { recursive: true, force: true })
fs.rmSync(root + '-evil', { recursive: true, force: true })

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
