/**
 * Pulse — feedback.js tests
 * run: node src/cli/feedback.test.js
 *
 * Shared logic behind pulse_report_issue. The contract that matters: nothing
 * leaves the machine unredacted, and nothing is sent unless it is exactly the
 * payload that was previewed.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import {
  redact, buildReport, previewId, formatPreview, sendViaProxy, sendViaGh, formatResult, REPO,
} from './feedback.js'

const ROOT = '/Users/jane/Repos/my-site'
const good = { title: 'dropCap misaligned in card', description: 'Overlaps second line.', repro: '<p>x</p>' }

// ── redact ──────────────────────────────────────────────────────────────────

test('redact replaces the project root and home directories', () => {
  const out = redact(`Error at ${ROOT}/src/pages/home.js and /Users/jane/.npmrc and /home/bob/x`, { root: ROOT, home: '/Users/jane' })
  assert.equal(out, 'Error at <project>/src/pages/home.js and ~/.npmrc and ~/x')
})

test('redact handles Windows user paths', () => {
  assert.equal(redact('C:\\Users\\Jane\\site\\a.js', {}), '~\\site\\a.js')
})

test('redact collapses system-rooted paths to <path>/file but leaves app routes alone', () => {
  const cases = {
    '/tmp/pulse-1/a.js':           '<path>/a.js',
    '/private/tmp/x/y.js':         '<path>/y.js',
    '/var/folders/ab/cd/T/x':      '<path>/x',
    '/Volumes/Data/site/a.js':     '<path>/a.js',
    '/opt/app/a.js':               '<path>/a.js',
    '/root/.ssh/config':           '<path>/config',
    '/mnt/c/Users/Jane/a.js':      '<path>/a.js',
    '/etc/hosts':                  '<path>/hosts',
  }
  for (const [input, want] of Object.entries(cases)) assert.equal(redact(input, {}), want, input)
  assert.equal(redact('failed at /tmp/x/a.js:12 then', {}), 'failed at <path>/a.js:12 then')
  assert.equal(redact('(see /var/log/app.log)', {}), '(see <path>/app.log)')
  for (const route of ['/about', '/blog/:slug', '/api/users', '/contact']) assert.equal(redact(route, {}), route)
})

test('redact strips tokens, bearer headers, keys and emails', () => {
  const txt = [
    'ghp_' + 'a'.repeat(36),
    'github_pat_' + 'B'.repeat(30),
    'sk-' + 'c'.repeat(30),
    'AKIA' + 'D'.repeat(16),
    'Authorization: Bearer ' + 'e'.repeat(30),
    'API_KEY=hunter2hunter2',
    'password: "swordfish"',
    'mail me at jane@example.com',
    '-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----',
  ].join('\n')
  const out = redact(txt, {})
  for (const leak of ['ghp_aaaa', 'github_pat_BBBB', 'sk-cccc', 'AKIADDDD', 'eeeeeeee', 'hunter2', 'swordfish', 'jane@example.com', 'abc\n']) {
    assert.ok(!out.includes(leak), `leaked: ${leak}`)
  }
  assert.match(out, /API_KEY=<redacted>/)
})

test('redact leaves ordinary spec code alone', () => {
  const code = "view: (state) => `<main id=\"main-content\">${state.count}</main>`"
  assert.equal(redact(code, { root: ROOT, home: '/Users/jane' }), code)
})

// ── buildReport ─────────────────────────────────────────────────────────────

test('buildReport redacts every field and attaches version', () => {
  const r = buildReport({ ...good, actual: `failed in ${ROOT}/a.js` }, { version: '0.20.39', root: ROOT })
  assert.equal(r.ok, true)
  assert.equal(r.payload.actual, 'failed in <project>/a.js')
  assert.equal(r.payload.version, '0.20.39')
})

test('buildReport rejects missing, short, oversize and non-string fields', () => {
  const o = { version: '0.20.39', root: ROOT }
  assert.equal(buildReport({ description: 'x' }, o).ok, false)
  assert.equal(buildReport({ title: 'short', description: 'x' }, o).ok, false)
  assert.equal(buildReport({ title: good.title }, o).ok, false)
  assert.equal(buildReport({ ...good, description: 'x'.repeat(4001) }, o).ok, false)
  assert.equal(buildReport({ ...good, repro: 5 }, o).ok, false)
  assert.equal(buildReport(good, { version: 'unknown', root: ROOT }).ok, false)
})

test('buildReport ignores unknown fields — confirmed/previewId never reach the payload', () => {
  const r = buildReport({ ...good, confirmed: true, previewId: 'x', extra: 'y' }, { version: '0.20.39', root: ROOT })
  assert.deepEqual(Object.keys(r.payload).sort(), ['description', 'repro', 'title', 'version'])
})

// ── preview / previewId ─────────────────────────────────────────────────────

test('previewId changes when any field changes', () => {
  const a = buildReport(good, { version: '0.20.39' }).payload
  const b = buildReport({ ...good, description: 'different' }, { version: '0.20.39' }).payload
  assert.notEqual(previewId(a), previewId(b))
  assert.equal(previewId(a), previewId({ ...a }))
})

test('formatPreview says nothing was sent, names the destination and carries the id', () => {
  const p = buildReport(good, { version: '0.20.39' }).payload
  const out = formatPreview(p)
  assert.match(out, /has NOT been sent/)
  assert.match(out, /pulse-feedback/)
  assert.ok(out.includes(previewId(p)))
  assert.match(formatPreview(p, { transport: 'gh' }), /your own `gh` login/)
})

// ── proxy transport ─────────────────────────────────────────────────────────

const payload = buildReport(good, { version: '0.20.39' }).payload
const ghUrl = `https://github.com/${REPO}/issues/9`
const reply = (status, body) => async () => new Response(JSON.stringify(body), { status })

test('sendViaProxy posts the payload as JSON and returns the issue', async () => {
  let seen
  const f = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ url: ghUrl, number: 9, duplicate: false }), { status: 201 }) }
  const r = await sendViaProxy(payload, { endpoint: 'https://e/report', fetchImpl: f })
  assert.deepEqual(r, { ok: true, url: ghUrl, number: 9, duplicate: false })
  assert.equal(seen.init.method, 'POST')
  assert.deepEqual(JSON.parse(seen.init.body), payload)
})

test('sendViaProxy reports service rejection, network failure and bogus responses', async () => {
  assert.equal((await sendViaProxy(payload, { fetchImpl: reply(429, { error: 'Rate limit exceeded' }) })).ok, false)
  assert.match((await sendViaProxy(payload, { fetchImpl: reply(429, { error: 'Rate limit exceeded' }) })).error, /429.*Rate limit/)
  assert.match((await sendViaProxy(payload, { fetchImpl: async () => { throw new Error('boom') } })).error, /Could not reach/)
  assert.match((await sendViaProxy(payload, { fetchImpl: reply(200, { url: 'https://evil.example/x' }) })).error, /unexpected/)
})

// ── gh transport ────────────────────────────────────────────────────────────

test('sendViaGh passes the body on stdin and targets the framework repo', () => {
  let seen
  const spawn = (cmd, args, opts) => { seen = { cmd, args, opts }; return { status: 0, stdout: `${ghUrl}\n` } }
  const r = sendViaGh(payload, { spawn })
  assert.equal(r.ok, true)
  assert.equal(r.url, ghUrl)
  assert.equal(seen.cmd, 'gh')
  assert.ok(seen.args.includes(REPO))
  assert.match(seen.opts.input, /untrusted input/)
})

test('sendViaGh surfaces failures', () => {
  const r = sendViaGh(payload, { spawn: () => ({ status: 1, stderr: 'not logged in' }) })
  assert.equal(r.ok, false)
  assert.match(r.error, /not logged in/)
})

// ── formatResult ────────────────────────────────────────────────────────────

test('formatResult distinguishes new, duplicate and failed', () => {
  assert.match(formatResult({ ok: true, url: ghUrl, duplicate: false }), /Report filed/)
  assert.match(formatResult({ ok: true, url: ghUrl, duplicate: true }), /Already reported/)
  assert.match(formatResult({ ok: false, error: 'x' }), /not sent.*issues\/new/s)
})
