/**
 * Pulse — diagnose.js tests
 * run: node src/cli/diagnose.test.js
 *
 * Shared logic behind pulse_diagnose/pulse_resolve_error (MCP tools) and
 * `pulse diagnose`/`pulse resolve-error` (CLI commands) — a human running
 * the CLI must see the exact same journal an agent sees.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { readJournal, formatJournal, resolveEntries, formatResolveResult } from './diagnose.js'

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-diagnose-test-'))
}

function writeJournal(root, entries) {
  fs.mkdirSync(path.join(root, '.pulse'), { recursive: true })
  fs.writeFileSync(path.join(root, '.pulse', 'errors.json'), JSON.stringify(entries, null, 2))
}

function sampleEntry(overrides = {}) {
  return {
    id: 'abc-123', ts: '2026-01-01T00:00:00.000Z', route: '/dashboard',
    phase: 'view', message: 'boom', stack: 'Error: boom', resolved: false,
    ...overrides,
  }
}

test('readJournal reports exists:false when no journal file exists', () => {
  const root = tmpProject()
  const result = readJournal(root)
  assert.equal(result.exists, false)
  assert.deepEqual(result.entries, [])
  fs.rmSync(root, { recursive: true, force: true })
})

test('readJournal returns unresolved entries by default', () => {
  const root = tmpProject()
  writeJournal(root, [sampleEntry({ id: 'a', resolved: false }), sampleEntry({ id: 'b', resolved: true })])
  const result = readJournal(root)
  assert.equal(result.entries.length, 1)
  assert.equal(result.entries[0].id, 'a')
  fs.rmSync(root, { recursive: true, force: true })
})

test('readJournal with includeResolved:true returns both', () => {
  const root = tmpProject()
  writeJournal(root, [sampleEntry({ id: 'a', resolved: false }), sampleEntry({ id: 'b', resolved: true })])
  const result = readJournal(root, { includeResolved: true })
  assert.equal(result.entries.length, 2)
  fs.rmSync(root, { recursive: true, force: true })
})

test('readJournal filters by route', () => {
  const root = tmpProject()
  writeJournal(root, [
    sampleEntry({ id: 'a', route: '/dashboard' }),
    sampleEntry({ id: 'b', route: '/other' }),
  ])
  const result = readJournal(root, { route: '/dashboard' })
  assert.equal(result.entries.length, 1)
  assert.equal(result.entries[0].id, 'a')
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatJournal reports a clean message when nothing is recorded', () => {
  const root = tmpProject()
  const result = readJournal(root)
  assert.match(formatJournal(result), /does not exist/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatJournal includes the route, phase, message, and stack for each entry', () => {
  const root = tmpProject()
  writeJournal(root, [sampleEntry()])
  const result = readJournal(root)
  const output = formatJournal(result)
  assert.match(output, /\/dashboard/)
  assert.match(output, /view/)
  assert.match(output, /boom/)
  assert.match(output, /Error: boom/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('resolveEntries by id marks only the matching entry', () => {
  const root = tmpProject()
  writeJournal(root, [sampleEntry({ id: 'a' }), sampleEntry({ id: 'b' })])
  const result = resolveEntries(root, { id: 'a' })
  assert.equal(result.count, 1)
  const after = JSON.parse(fs.readFileSync(path.join(root, '.pulse', 'errors.json'), 'utf8'))
  assert.equal(after.find(e => e.id === 'a').resolved, true)
  assert.equal(after.find(e => e.id === 'b').resolved, false)
  fs.rmSync(root, { recursive: true, force: true })
})

test('resolveEntries by route marks every unresolved entry on that route', () => {
  const root = tmpProject()
  writeJournal(root, [
    sampleEntry({ id: 'a', route: '/x' }),
    sampleEntry({ id: 'b', route: '/x' }),
    sampleEntry({ id: 'c', route: '/y' }),
  ])
  const result = resolveEntries(root, { route: '/x' })
  assert.equal(result.count, 2)
  fs.rmSync(root, { recursive: true, force: true })
})

test('resolveEntries with neither id nor route returns an error', () => {
  const root = tmpProject()
  const result = resolveEntries(root, {})
  assert.match(result.error, /pass either id or route/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatResolveResult reports the count or "no matching entries"', () => {
  assert.match(formatResolveResult({ count: 2, error: null }), /Resolved 2 entries/)
  assert.match(formatResolveResult({ count: 1, error: null }), /Resolved 1 entry\./)
  assert.match(formatResolveResult({ count: 0, error: null }), /No matching unresolved entries/)
})
