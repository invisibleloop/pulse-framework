/**
 * MCP input guard tests — run with: node src/mcp/guards.test.js
 */

import fs     from 'node:fs'
import os     from 'node:os'
import path   from 'node:path'
import assert from 'node:assert/strict'
import { resolveInRoot, isLoopbackUrl, isPrivateAddress, assertPublicUrl } from './guards.js'

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

fs.rmSync(base, { recursive: true, force: true })
fs.rmSync(root + '-evil', { recursive: true, force: true })

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
