/**
 * Pulse — stamp.js tests
 * run: node src/cli/stamp.test.js
 *
 * Shared logic behind pulse_stamp (MCP tool) and `pulse stamp` (CLI
 * command). Regression coverage: a real Lighthouse run that passed the
 * score bar in a /verify session was found to be silently never saved via
 * `pulse save-report` — prose-only documentation for that step wasn't
 * enough, so full-mode pulse_stamp now refuses to write the stamp unless
 * it finds real evidence a report was saved.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { writeStamp, formatStampResult } from './stamp.js'

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-stamp-test-'))
}

const PASSING = {
  scores:  { accessibility: 100, bestPractices: 100, seo: 100 },
  metrics: { lcp: 480, cls: 0 },
}

let seq = 0
function writeReport(root, slug, { ageMs = 0, device = 'desktop', scores = PASSING.scores, metrics = PASSING.metrics } = {}) {
  const dir = path.join(root, '.pulse', 'reports', slug)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${Date.now()}-${seq++}.json`)
  fs.writeFileSync(file, JSON.stringify({ timestamp: new Date().toISOString(), ...(device ? { device } : {}), scores, metrics }))
  if (ageMs > 0) {
    const past = new Date(Date.now() - ageMs)
    fs.utimesSync(file, past, past)
  }
  return file
}

/** A desktop and a mobile report that meet the bar. */
function writePassingPair(root, slug, overrides = {}) {
  writeReport(root, slug, { device: 'desktop', ...overrides.desktop })
  writeReport(root, slug, { device: 'mobile',  ...overrides.mobile })
}

function refusalFor(overrides) {
  const root = tmpProject()
  writePassingPair(root, 'dashboard', overrides)
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  fs.rmSync(root, { recursive: true, force: true })
  return result
}

// ── Quick mode / no route ───────────────────────────────────────────────

test('writeStamp with no route stamps unconditionally', () => {
  const root = tmpProject()
  const result = writeStamp(root)
  assert.equal(result.stamped, true)
  assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('writeStamp in quick mode stamps even with no saved report', () => {
  const root = tmpProject()
  const result = writeStamp(root, { route: '/dashboard', mode: 'quick' })
  assert.equal(result.stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

// ── Full mode — the actual regression this fixes ────────────────────────

test('writeStamp in full mode refuses when no report was ever saved for the route', () => {
  const root = tmpProject()
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(result.stamped, false)
  assert.equal(result.refused, true)
  assert.match(result.reason, /No Lighthouse report saved/)
  assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), false, 'must not write the stamp file at all')
  fs.rmSync(root, { recursive: true, force: true })
})

test('writeStamp in full mode refuses when the only report is older than the window', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard', { ageMs: 20 * 60 * 1000 }) // 20 min old
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(result.stamped, false)
  assert.equal(result.refused, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('writeStamp in full mode stamps when both devices have a passing report for the route', () => {
  const root = tmpProject()
  writePassingPair(root, 'dashboard')
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(result.stamped, true)
  assert.equal(result.refused, false)
  assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('writeStamp full mode checks the same slug pulse save-report would use for this route', () => {
  const root = tmpProject()
  // Root route '/' slugs to 'home' — same as report.js's urlToSlug.
  writePassingPair(root, 'home')
  const result = writeStamp(root, { route: '/', mode: 'full' })
  assert.equal(result.stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('a report saved for a different route does not satisfy the check', () => {
  const root = tmpProject()
  writeReport(root, 'about') // saved for /about, not /dashboard
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(result.stamped, false)
  fs.rmSync(root, { recursive: true, force: true })
})

// ── Full mode — the reports must show the bar was met, on both devices ──

test('full mode refuses a report with only a CLS: the speed was never measured', () => {
  const r = refusalFor({ desktop: { metrics: { cls: 0 } }, mobile: { metrics: { cls: 0 } } })
  assert.equal(r.stamped, false)
  assert.match(r.reason, /desktop: metrics\.lcp is missing/)
  assert.match(r.reason, /mobile: metrics\.lcp is missing/)
})

test('full mode refuses when the mobile run was never saved', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard', { device: 'desktop' })
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(r.stamped, false)
  assert.match(r.reason, /no mobile report/)
  assert.doesNotMatch(r.reason, /no desktop report/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('full mode refuses reports that name no device', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard', { device: null })
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(r.stamped, false)
  assert.match(r.reason, /no desktop report/)
  assert.match(r.reason, /--device desktop/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('full mode refuses an Accessibility, Best Practices or SEO score below 100', () => {
  const r = refusalFor({ mobile: { scores: { accessibility: 96, bestPractices: 100, seo: 100 } } })
  assert.equal(r.stamped, false)
  assert.match(r.reason, /mobile: accessibility is 96, the bar is 100/)
})

test('full mode refuses a missing score, not only a low one', () => {
  const r = refusalFor({ desktop: { scores: { accessibility: 100, bestPractices: 100 } } })
  assert.match(r.reason, /desktop: scores\.seo is missing/)
})

test('full mode refuses a CLS above 0.00 and a poor LCP', () => {
  const r = refusalFor({ desktop: { metrics: { lcp: 4200, cls: 0.02 } } })
  assert.match(r.reason, /LCP is 4200 ms/)
  assert.match(r.reason, /CLS is 0.02/)
})

test('full mode accepts a Performance score that is absent: it is reported, not gated', () => {
  const r = refusalFor({})
  assert.equal(r.stamped, true)
})

test('the newest report of a device decides, so a fixed page can be saved again', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard', { device: 'desktop', metrics: { lcp: 9000, cls: 0 }, ageMs: 60 * 1000 })
  writePassingPair(root, 'dashboard')
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(r.stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('the refusal text tells an agent to fix the numbers, and not to invent them', () => {
  const r = refusalFor({ desktop: { metrics: { cls: 0 } } })
  const text = formatStampResult(r)
  assert.match(text, /Do not save numbers you did not measure/)
})

test('device-less reports get a refusal that names an older pulse ignoring --device', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard', { device: null })
  writeReport(root, 'dashboard', { device: null })
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.match(r.reason, /2 recent report\(s\) name no device/)
  assert.match(r.reason, /npx --no-install pulse save-report/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('the older-pulse hint is not added when every report names its device', () => {
  const r = refusalFor({ desktop: { metrics: { cls: 0 } } })
  assert.doesNotMatch(r.reason, /name no device/)
})

// ── Acceptance criteria ──────────────────────────────────────────────────

function writePage(root, { criteria, tests, route = '/dashboard' }) {
  const dir = path.join(root, 'src', 'pages')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'dashboard.js'), `export default { route: '${route}' }`)
  if (criteria !== undefined) fs.writeFileSync(path.join(dir, 'dashboard.acceptance.md'), criteria)
  if (tests !== undefined) fs.writeFileSync(path.join(dir, 'dashboard.test.js'), tests)
}

test('full mode stamps a page whose every criterion is named by a test', () => {
  const root = tmpProject()
  writePassingPair(root, 'dashboard')
  writePage(root, { criteria: '- AC1: one\n- AC2: two\n', tests: "test('AC1 — one', () => {})\ntest('AC2 — two', () => {})" })
  assert.equal(writeStamp(root, { route: '/dashboard', mode: 'full' }).stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('full mode refuses a page with a criterion no test names, and says how to fix it', () => {
  const root = tmpProject()
  writePassingPair(root, 'dashboard')
  writePage(root, { criteria: '- AC1: one\n- AC2: two\n', tests: "test('AC1 — one', () => {})" })
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(r.stamped, false)
  assert.match(r.reason, /acceptance criteria for "\/dashboard" are not met/)
  assert.match(r.reason, /no test names AC2/)
  assert.match(r.reason, /ask the user which is right/)
  assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), false)
  fs.rmSync(root, { recursive: true, force: true })
})

test('full mode lists a failing report and an open criterion together, so one pass fixes both', () => {
  const root = tmpProject()
  writePassingPair(root, 'dashboard', { desktop: { metrics: { cls: 0 } } })
  writePage(root, { criteria: '- AC1: one\n', tests: "test('other', () => {})" })
  const r = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.match(r.reason, /desktop: metrics\.lcp is missing/)
  assert.match(r.reason, /no test names AC1/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('a page with no criteria file is stamped as before: the file is asked for by review, not here', () => {
  const root = tmpProject()
  writePassingPair(root, 'dashboard')
  writePage(root, {})
  assert.equal(writeStamp(root, { route: '/dashboard', mode: 'full' }).stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('quick mode never checks acceptance criteria', () => {
  const root = tmpProject()
  writePage(root, { criteria: '- AC1: one\n' })
  assert.equal(writeStamp(root, { route: '/dashboard', mode: 'quick' }).stamped, true)
  fs.rmSync(root, { recursive: true, force: true })
})

// ── Error-journal auto-resolve ───────────────────────────────────────────

test('writeStamp with a route marks unresolved error-journal entries for that route resolved', () => {
  const root = tmpProject()
  fs.mkdirSync(path.join(root, '.pulse'), { recursive: true })
  fs.writeFileSync(path.join(root, '.pulse', 'errors.json'), JSON.stringify([
    { id: '1', ts: '2026-01-01T00:00:00.000Z', route: '/dashboard', phase: 'view', message: 'x', stack: '', resolved: false },
    { id: '2', ts: '2026-01-01T00:00:00.000Z', route: '/other',     phase: 'view', message: 'y', stack: '', resolved: false },
  ]))

  const result = writeStamp(root, { route: '/dashboard' })
  assert.equal(result.stamped, true)
  assert.equal(result.resolvedCount, 1)

  const entries = JSON.parse(fs.readFileSync(path.join(root, '.pulse', 'errors.json'), 'utf8'))
  assert.equal(entries.find(e => e.id === '1').resolved, true)
  assert.equal(entries.find(e => e.id === '2').resolved, false, 'must not resolve entries for a different route')
  fs.rmSync(root, { recursive: true, force: true })
})

// ── formatStampResult ────────────────────────────────────────────────────

test('formatStampResult agentFacing:true on refusal tells the agent to retry pulse_stamp', () => {
  const output = formatStampResult({ stamped: false, refused: true, reason: 'no report', resolvedCount: 0, ts: null }, { agentFacing: true })
  assert.match(output, /Refusing to stamp/)
  assert.match(output, /call pulse_stamp again/)
})

test('formatStampResult agentFacing:false (CLI) omits the pulse_stamp-specific retry phrasing', () => {
  const output = formatStampResult({ stamped: false, refused: true, reason: 'no report', resolvedCount: 0, ts: null }, { agentFacing: false })
  assert.match(output, /Refusing to stamp/)
  assert.doesNotMatch(output, /pulse_stamp/, 'CLI output must not reference the MCP tool name pulse_stamp')
})

test('formatStampResult distinguishes a real write failure from a policy refusal', () => {
  const output = formatStampResult({ stamped: false, refused: false, reason: 'disk full', resolvedCount: 0, ts: null }, { agentFacing: true })
  assert.match(output, /Failed to stamp/)
  assert.doesNotMatch(output, /Refusing to stamp/)
})

test('formatStampResult on success reports resolved count when nonzero', () => {
  const output = formatStampResult({ stamped: true, refused: false, reason: null, resolvedCount: 2, ts: '123' }, { agentFacing: true })
  assert.match(output, /2 error-journal entries marked resolved/)
})

test('formatStampResult on success says nothing about resolving when count is zero', () => {
  const output = formatStampResult({ stamped: true, refused: false, reason: null, resolvedCount: 0, ts: '123' }, { agentFacing: true })
  assert.doesNotMatch(output, /marked resolved/)
})

test('full mode without a route is refused: a full verification is about a page, and the stamp must not claim one it has no evidence for', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-stamp-noroute-'))
  try {
    const result = writeStamp(root, { mode: 'full' })
    assert.equal(result.stamped, false)
    assert.equal(result.refused, true)
    assert.match(result.reason, /needs the page it verified/)
    assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), false, 'no stamp file may be written')
    // quick mode and a bare call (no mode) are unchanged
    assert.equal(writeStamp(root, { mode: 'quick' }).stamped, true)
    fs.rmSync(path.join(root, '.pulse-verified'))
    assert.equal(writeStamp(root, {}).stamped, true)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
