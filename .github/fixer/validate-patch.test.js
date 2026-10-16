import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkChanges, parseDiff, LIMITS } from './validate-patch.js'

const m = (path, extra = {}) => ({ status: 'M', srcMode: '100644', dstMode: '100644', path, added: 5, deleted: 2, ...extra })
const goodSet = () => [m('packages/pulse/src/ui/badge.js'), m('packages/pulse/src/ui/ui.test.js', { added: 12, deleted: 0 })]

test('accepts a small source fix with a test in an existing test file', () => {
  assert.deepEqual(checkChanges(goodSet()), { ok: true, errors: [] })
})

test('rejects an empty patch', () => {
  assert.equal(checkChanges([]).ok, false)
})

test('rejects paths outside packages/pulse (workflows, worker, docs, claude config)', () => {
  for (const p of ['.github/workflows/ci.yml', 'worker/feedback/index.js', 'docs/src/pages/x.js', '.claude/settings.json', 'CLAUDE.md']) {
    const r = checkChanges([...goodSet(), m(p)])
    assert.equal(r.ok, false, p)
    assert.match(r.errors.join(), /outside packages\/pulse\//)
  }
})

test('rejects protected files even inside packages/pulse', () => {
  for (const p of ['packages/pulse/package.json', 'packages/pulse/scripts/release-version.js', 'packages/pulse/node_modules/x/index.js']) {
    const r = checkChanges([...goodSet(), m(p)])
    assert.equal(r.ok, false, p)
    assert.match(r.errors.join(), /protected path/)
  }
})

test('rejects path traversal and odd characters', () => {
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/../../.github/x.yml')]).ok, false)
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/src/a"b.js')]).ok, false)
})

test('rejects deletions, renames, mode changes and symlinks', () => {
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/src/a.js', { status: 'D' })]).ok, false)
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/src/a.js', { status: 'R100' })]).ok, false)
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/src/a.js', { dstMode: '100755' })]).ok, false)
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/src/a.js', { status: 'A', srcMode: '000000', dstMode: '120000' })]).ok, false)
})

test('rejects binary changes', () => {
  assert.equal(checkChanges([...goodSet(), m('packages/pulse/public/x.png', { added: null, deleted: null })]).ok, false)
})

test('requires a regression test and a source change', () => {
  assert.match(checkChanges([m('packages/pulse/src/ui/badge.js')]).errors.join(), /no test was added/)
  assert.match(checkChanges([m('packages/pulse/src/ui/ui.test.js')]).errors.join(), /only tests changed/)
})

test('rejects new test files — they are not wired into npm test', () => {
  const r = checkChanges([m('packages/pulse/src/ui/badge.js'),
    m('packages/pulse/src/ui/badge.test.js', { status: 'A', srcMode: '000000', added: 20, deleted: 0 })])
  assert.equal(r.ok, false)
  assert.match(r.errors.join(), /new test files are not allowed/)
})

test('rejects weakening an existing test file (more removed than added)', () => {
  const r = checkChanges([m('packages/pulse/src/ui/badge.js'), m('packages/pulse/src/ui/ui.test.js', { added: 1, deleted: 30 })])
  assert.equal(r.ok, false)
  assert.match(r.errors.join(), /removes more test lines/)
})

test('enforces file-count and size limits', () => {
  const many = Array.from({ length: LIMITS.maxFiles }, (_, i) => m(`packages/pulse/src/f${i}.js`))
  assert.match(checkChanges([...many, m('packages/pulse/src/ui/ui.test.js')]).errors.join(), /too many files/)
  assert.match(checkChanges([m('packages/pulse/src/a.js', { added: 400, deleted: 200 }), m('packages/pulse/src/ui/ui.test.js')]).errors.join(), /too large/)
})

test('parseDiff reads git --raw --numstat output', () => {
  const out = [
    ':100644 100644 aaa bbb M\tpackages/pulse/src/ui/badge.js',
    ':000000 100644 000 ccc A\tpackages/pulse/src/new.js',
    ':100644 100644 ddd eee M\tpackages/pulse/public/x.png',
    '5\t2\tpackages/pulse/src/ui/badge.js',
    '9\t0\tpackages/pulse/src/new.js',
    '-\t-\tpackages/pulse/public/x.png',
  ].join('\n')
  const c = parseDiff(out)
  assert.equal(c.length, 3)
  assert.deepEqual(c[0], { path: 'packages/pulse/src/ui/badge.js', status: 'M', srcMode: '100644', dstMode: '100644', added: 5, deleted: 2 })
  assert.equal(c[1].status, 'A')
  assert.equal(c[2].added, null)
})
