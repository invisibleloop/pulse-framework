/**
 * Pulse — acceptance.js tests
 * run: node src/cli/acceptance.test.js
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { parseCriteria, namedInTests, acceptanceStatus, acceptanceProblems, specFileForRoute } from './acceptance.js'

function project(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-acceptance-test-'))
  for (const [rel, body] of Object.entries(files)) {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, body)
  }
  return root
}

test('parseCriteria reads "- AC<n>: text" lines with any dash style and ignores the rest', () => {
  const md = '# Contact\n\n- AC1: An invalid email shows an error.\n* AC2 — A valid submit redirects.\n- AC3 - Failure keeps the values.\nnot a criterion\n- AC: no number\n'
  assert.deepEqual(parseCriteria(md), [
    { id: 'AC1', text: 'An invalid email shows an error.' },
    { id: 'AC2', text: 'A valid submit redirects.' },
    { id: 'AC3', text: 'Failure keeps the values.' },
  ])
})

test('namedInTests counts an ID in a test, it or describe title, in any quote style', () => {
  const src = `
    test('AC1 — one', () => {})
    it("AC2: two", () => {})
    describe(\`AC3 three\`, () => {})
    test('AC4 and AC5 together', () => {})
    test.skip('AC6 skipped still names it', () => {})
  `
  assert.deepEqual([...namedInTests(src)].sort(), ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6'])
})

test('an ID in a comment or in a test body does not count as named', () => {
  const src = `
    // AC1 is covered below
    test('renders the heading', () => { assert.ok('AC2'.length) })
  `
  assert.equal(namedInTests(src).size, 0)
})

test('a page with no criteria file has nothing to meet', () => {
  const root = project({ 'src/pages/about.js': 'export default { route: "/about" }' })
  const status = acceptanceStatus(path.join(root, 'src/pages/about.js'))
  assert.equal(status.exists, false)
  assert.deepEqual(acceptanceProblems(status), [])
  fs.rmSync(root, { recursive: true, force: true })
})

test('every criterion named by a test is met', () => {
  const root = project({
    'src/pages/c.js': 'export default {}',
    'src/pages/c.acceptance.md': '- AC1: one\n- AC2: two\n',
    'src/pages/c.test.js': "test('AC1 — one', () => {})\ntest('AC2 — two', () => {})",
  })
  const status = acceptanceStatus(path.join(root, 'src/pages/c.js'))
  assert.equal(status.criteria.length, 2)
  assert.deepEqual(acceptanceProblems(status), [])
  fs.rmSync(root, { recursive: true, force: true })
})

test('a criterion no test names is reported, with how to fix it', () => {
  const root = project({
    'src/pages/c.js': 'export default {}',
    'src/pages/c.acceptance.md': '- AC1: one\n- AC2: two\n',
    'src/pages/c.test.js': "test('AC1 — one', () => {})",
  })
  const problems = acceptanceProblems(acceptanceStatus(path.join(root, 'src/pages/c.js')), 'c.js')
  assert.equal(problems.length, 1)
  assert.match(problems[0], /no test names AC2/)
  assert.match(problems[0], /test\('AC2 — /)
  fs.rmSync(root, { recursive: true, force: true })
})

test('criteria with no test file at all are reported as such', () => {
  const root = project({ 'src/pages/c.js': 'export default {}', 'src/pages/c.acceptance.md': '- AC1: one\n' })
  const problems = acceptanceProblems(acceptanceStatus(path.join(root, 'src/pages/c.js')))
  assert.match(problems[0], /no test names AC1: there is no test file/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('a criteria file with no criterion lines, or a repeated ID, is a problem', () => {
  const empty = project({ 'src/pages/c.js': 'x', 'src/pages/c.acceptance.md': '# nothing here\n' })
  assert.match(acceptanceProblems(acceptanceStatus(path.join(empty, 'src/pages/c.js')))[0], /no line like "- AC1/)
  const dup = project({ 'src/pages/c.js': 'x', 'src/pages/c.acceptance.md': '- AC1: a\n- AC1: b\n', 'src/pages/c.test.js': "test('AC1', () => {})" })
  assert.match(acceptanceProblems(acceptanceStatus(path.join(dup, 'src/pages/c.js')))[0], /AC1 appear more than once/)
  fs.rmSync(empty, { recursive: true, force: true })
  fs.rmSync(dup, { recursive: true, force: true })
})

test('specFileForRoute finds the page by its route, in a folder too, and skips test files', () => {
  const root = project({
    'src/pages/home.js': "export default { route: '/' }",
    'src/pages/blog/post.js': "export default { route: '/blog/:slug' }",
    'src/pages/blog/post.test.js': "const x = { route: '/blog/:slug' }",
  })
  assert.equal(specFileForRoute(root, '/'), path.join(root, 'src/pages/home.js'))
  assert.equal(specFileForRoute(root, '/blog/:slug'), path.join(root, 'src/pages/blog/post.js'))
  assert.equal(specFileForRoute(root, '/nope'), null)
  fs.rmSync(root, { recursive: true, force: true })
})
