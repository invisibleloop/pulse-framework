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

function writeReport(root, slug, { ageMs = 0 } = {}) {
  const dir = path.join(root, '.pulse', 'reports', slug)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${Date.now()}.json`)
  fs.writeFileSync(file, JSON.stringify({ timestamp: new Date().toISOString(), scores: {} }))
  if (ageMs > 0) {
    const past = new Date(Date.now() - ageMs)
    fs.utimesSync(file, past, past)
  }
  return file
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

test('writeStamp in full mode stamps when a recent report exists for the route', () => {
  const root = tmpProject()
  writeReport(root, 'dashboard')
  const result = writeStamp(root, { route: '/dashboard', mode: 'full' })
  assert.equal(result.stamped, true)
  assert.equal(result.refused, false)
  assert.equal(fs.existsSync(path.join(root, '.pulse-verified')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('writeStamp full mode checks the same slug pulse save-report would use for this route', () => {
  const root = tmpProject()
  // Root route '/' slugs to 'home' — same as report.js's urlToSlug.
  writeReport(root, 'home')
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
