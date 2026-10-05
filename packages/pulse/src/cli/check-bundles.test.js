/**
 * Pulse — check-bundles.js tests
 * run: node src/cli/check-bundles.test.js
 *
 * Shared logic behind pulse_check_bundles (MCP tool) and `pulse check-bundles`
 * (CLI command). These tests build against a real manifest.json + real boot
 * file content (not a mocked build) since the whole point of this check is
 * reading what a real build actually produced.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { checkBundles, formatBundleCheck } from './check-bundles.js'

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-check-bundles-test-'))
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  fs.mkdirSync(path.join(root, 'public', 'dist'), { recursive: true })
  return root
}

function writeManifest(root, entries) {
  fs.writeFileSync(path.join(root, 'public', 'dist', 'manifest.json'), JSON.stringify(entries, null, 2))
}

function writeBootFile(root, name, content = 'var x = 1;') {
  fs.writeFileSync(path.join(root, 'public', 'dist', name), content)
}

test('reports an error when no manifest.json exists', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-check-bundles-test-'))
  const result = checkBundles(root)
  assert.match(result.error, /No public\/dist\/manifest\.json found/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('clean pass: a page with mutations correctly has a bundle', () => {
  const root = tmpProject()
  fs.writeFileSync(path.join(root, 'src', 'pages', 'counter.js'),
    `export default {\n  route: '/counter',\n  state: { count: 0 },\n  mutations: { inc: (s) => ({ count: s.count + 1 }) },\n  view: (state) => \`<button>\${state.count}</button>\`,\n}`)
  writeManifest(root, { '/src/pages/counter.js': '/dist/counter.boot-ABC123.js' })
  writeBootFile(root, 'counter.boot-ABC123.js')

  const result = checkBundles(root)
  assert.equal(result.error, null)
  assert.equal(result.issues.length, 0, `Expected no issues, got: ${JSON.stringify(result.issues)}`)
  assert.equal(result.confirms.length, 1)
  fs.rmSync(root, { recursive: true, force: true })
})

test('flags a boot bundle for a page with no mutations/actions/persist', () => {
  const root = tmpProject()
  fs.writeFileSync(path.join(root, 'src', 'pages', 'redirect.js'),
    `export default {\n  route: '/:code',\n  guard: async (ctx) => { if (!ctx.params.code) return { status: 404 } },\n  view: () => '<main id="main-content">redirecting</main>',\n}`)
  // Simulate the exact historical bug: a bundle exists for a page that needs none.
  writeManifest(root, { '/src/pages/redirect.js': '/dist/redirect.boot-XYZ789.js' })
  writeBootFile(root, 'redirect.boot-XYZ789.js')

  const result = checkBundles(root)
  assert.equal(result.issues.length, 1)
  assert.match(result.issues[0], /\/:code/)
  assert.match(result.issues[0], /no mutations\/actions\/persist/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('issue message uses the spec\'s real declared route, not the filename-derived fallback', () => {
  // Regression: discoverPages' derivedRoute is filename-based only (it doesn't
  // parse spec.route) — a file named redirect.js with route: '/:code' was
  // reported as route "/redirect" instead of the route actually registered.
  const root = tmpProject()
  fs.writeFileSync(path.join(root, 'src', 'pages', 'redirect.js'),
    `export default {\n  route: '/:code',\n  guard: async (ctx) => { if (!ctx.params.code) return { status: 404 } },\n  view: () => '<main id="main-content">redirecting</main>',\n}`)
  writeManifest(root, { '/src/pages/redirect.js': '/dist/redirect.boot-XYZ789.js' })
  writeBootFile(root, 'redirect.boot-XYZ789.js')

  const result = checkBundles(root)
  assert.equal(result.issues.length, 1)
  assert.match(result.issues[0], /Route "\/:code"/,
    `Expected the real declared route /:code, not the filename-derived /redirect — got: ${result.issues[0]}`)
  fs.rmSync(root, { recursive: true, force: true })
})

test('does not flag a page with no mutations/actions/persist that correctly has no bundle', () => {
  const root = tmpProject()
  fs.writeFileSync(path.join(root, 'src', 'pages', 'redirect.js'),
    `export default {\n  route: '/:code',\n  guard: async (ctx) => { if (!ctx.params.code) return { status: 404 } },\n  view: () => '<main id="main-content">redirecting</main>',\n}`)
  // No manifest entry for this page — correct behaviour, nothing to flag.
  writeManifest(root, {})

  const result = checkBundles(root)
  assert.equal(result.issues.length, 0)
  fs.rmSync(root, { recursive: true, force: true })
})

test('flags a boot bundle containing a literal Node built-in reference', () => {
  const root = tmpProject()
  writeManifest(root, {})
  writeBootFile(root, 'leaky.boot-DEF456.js', `var x=require("node:fs");x.readFileSync("/tmp/y")`)

  const result = checkBundles(root)
  assert.equal(result.issues.length, 1)
  assert.match(result.issues[0], /leaky\.boot-DEF456\.js/)
  assert.match(result.issues[0], /node:fs/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('a clean boot file with no Node built-ins is confirmed, not flagged', () => {
  const root = tmpProject()
  writeManifest(root, {})
  writeBootFile(root, 'clean.boot-GHI999.js', `var mount=function(){};mount()`)

  const result = checkBundles(root)
  assert.equal(result.issues.length, 0)
  assert.equal(result.confirms.some(c => c.includes('clean.boot-GHI999.js')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatBundleCheck reports all-clear when there are no issues', () => {
  const root = tmpProject()
  writeManifest(root, {})
  const output = formatBundleCheck(checkBundles(root))
  assert.match(output, /All clear/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatBundleCheck lists issues under their own heading', () => {
  const root = tmpProject()
  writeManifest(root, {})
  writeBootFile(root, 'leaky.boot-JKL111.js', `require("node:crypto")`)
  const output = formatBundleCheck(checkBundles(root))
  assert.match(output, /### Issues found/)
  assert.match(output, /node:crypto/)
  fs.rmSync(root, { recursive: true, force: true })
})
