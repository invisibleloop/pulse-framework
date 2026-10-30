/**
 * Pulse — acceptance criteria
 *
 * A page can carry its acceptance criteria in a file next to it: src/pages/contact.js has
 * src/pages/contact.acceptance.md, one line per criterion:
 *
 *   - AC1: Submitting an invalid email shows an error next to the field.
 *   - AC2: A successful submit redirects to /thanks.
 *
 * A test proves a criterion by naming it: test('AC1 — an invalid email shows an error', ...).
 * pulse_review reports a criterion no test names, and pulse_stamp refuses a full verification
 * while one is open. This makes coverage of the user's intent traceable. It does not make the tests
 * independent: the agent that builds the page still writes them.
 */

import fs   from 'fs'
import path from 'path'

const CRITERION = /^\s*[-*]\s*(AC\d+)\s*[:—–-]\s*(\S.*)$/

// /verify and pulse_stamp already check these, from saved reports. No test can name them, so a
// criterion about one only invites an empty test.
const STAMP_CHECKED = /\b(lighthouse|core web vitals|cls|lcp|layout shift|largest contentful paint)\b/i

/** @param {string} specFile @returns {string} */
export function acceptancePathFor(specFile) {
  return specFile.replace(/\.js$/, '.acceptance.md')
}

/**
 * @param {string} md
 * @returns {{ id: string, text: string }[]}
 */
export function parseCriteria(md) {
  const out = []
  for (const line of md.split('\n')) {
    const m = line.match(CRITERION)
    if (m) out.push({ id: m[1], text: m[2].trim() })
  }
  return out
}

/**
 * The criterion IDs named in test titles: test('AC1 — ...'), it("AC2: ..."), describe(`AC3 ...`).
 * An ID in a comment or in a test body does not count: the title is what the test runner reports.
 *
 * @param {string} testSource
 * @returns {Set<string>}
 */
export function namedInTests(testSource) {
  const ids = new Set()
  const title = /\b(?:test|it|describe)(?:\.\w+)?\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  for (const m of testSource.matchAll(title)) {
    for (const id of m[2].match(/\bAC\d+\b/g) ?? []) ids.add(id)
  }
  return ids
}

/**
 * What is wrong with a page's acceptance criteria. `exists` is false when the page has no criteria
 * file, which is not a problem by itself.
 *
 * @param {string} specFile
 * @returns {{ exists: boolean, criteria: { id: string, text: string }[], uncovered: string[], stampChecked: string[], duplicates: string[], empty: boolean, noTestFile: boolean }}
 */
export function acceptanceStatus(specFile) {
  const file = acceptancePathFor(specFile)
  if (!fs.existsSync(file)) return { exists: false, criteria: [], uncovered: [], stampChecked: [], duplicates: [], empty: false, noTestFile: false }

  const criteria = parseCriteria(fs.readFileSync(file, 'utf8'))
  const seen = new Set()
  const duplicates = []
  for (const { id } of criteria) {
    if (seen.has(id) && !duplicates.includes(id)) duplicates.push(id)
    seen.add(id)
  }

  const testFile = specFile.replace(/\.js$/, '.test.js')
  const noTestFile = !fs.existsSync(testFile)
  const named = noTestFile ? new Set() : namedInTests(fs.readFileSync(testFile, 'utf8'))
  const stampChecked = criteria.filter(c => STAMP_CHECKED.test(c.text)).map(c => c.id)
  const uncovered = [...seen].filter(id => !named.has(id) && !stampChecked.includes(id))

  return { exists: true, criteria, uncovered, stampChecked, duplicates, empty: criteria.length === 0, noTestFile }
}

/** Sentences an agent can act on, empty when the criteria are met. */
export function acceptanceProblems(status, specName = 'the page') {
  if (!status.exists) return []
  const out = []
  if (status.empty) {
    out.push(`the criteria file for ${specName} has no line like "- AC1: <sentence>"`)
    return out
  }
  if (status.duplicates.length) out.push(`${status.duplicates.join(', ')} appear more than once in the criteria file`)
  if (status.stampChecked.length) out.push(`${status.stampChecked.join(', ')} restate${status.stampChecked.length === 1 ? 's' : ''} a check that /verify already makes (Lighthouse, LCP or CLS). Remove ${status.stampChecked.length === 1 ? 'it' : 'them'} from the criteria file, because no test can name ${status.stampChecked.length === 1 ? 'it' : 'them'}`)
  if (status.uncovered.length) {
    const how = status.noTestFile ? 'there is no test file' : `name a test for each, for example test('${status.uncovered[0]} — <what it proves>', ...)`
    out.push(`no test names ${status.uncovered.join(', ')}: ${how}`)
  }
  return out
}

/**
 * The spec file whose `route` is this route, or null. Reads src/pages (and its folders) as text, so a
 * spec that cannot be imported still resolves.
 *
 * @param {string} root
 * @param {string} route
 * @returns {string|null}
 */
export function specFileForRoute(root, route) {
  const walk = dir => {
    let entries = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return null }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { const hit = walk(p); if (hit) return hit; continue }
      if (!e.name.endsWith('.js') || e.name.endsWith('.test.js')) continue
      const m = fs.readFileSync(p, 'utf8').match(/\broute\s*:\s*(['"`])([^'"`]*)\1/)
      if (m && m[2] === route) return p
    }
    return null
  }
  return walk(path.join(root, 'src', 'pages'))
}
