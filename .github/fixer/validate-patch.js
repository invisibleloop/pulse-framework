#!/usr/bin/env node
/**
 * Validate the staged changes an agent produced for an agent-report issue.
 *
 * The fixer's model output is influenced by untrusted issue text, so the patch
 * is treated as untrusted too. This gate runs twice (after the model, and again
 * before the PR is opened) and is deliberately strict: a framework fix is a
 * small change to packages/pulse source plus a test in an EXISTING test file.
 *
 * Usage (repo root, changes staged):  node .github/fixer/validate-patch.js
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LIMITS = { maxFiles: 15, maxChangedLines: 500 }

const ALLOWED_PREFIX = 'packages/pulse/'

// Even inside the allowed prefix — release plumbing and anything that executes
// with elevated trust must never be touched by an automated fix.
const DENIED = [
  /(^|\/)package\.json$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)node_modules\//,
  /^packages\/pulse\/scripts\/release-version\.js$/,
  /^packages\/pulse\/\.fixer\//,
]

const isTest = p => /\.test\.js$/.test(p)

/**
 * @param {{status:string, srcMode:string, dstMode:string, path:string, added:number|null, deleted:number|null}[]} changes
 *        `added`/`deleted` are null for binary files.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkChanges(changes) {
  const errors = []
  if (changes.length === 0) errors.push('no changes were produced')
  if (changes.length > LIMITS.maxFiles) errors.push(`too many files changed (${changes.length} > ${LIMITS.maxFiles})`)

  let total = 0
  let touchedTest = false
  let touchedSource = false

  for (const c of changes) {
    const where = c.path
    if (!c.path.startsWith(ALLOWED_PREFIX)) errors.push(`${where}: outside ${ALLOWED_PREFIX}`)
    if (c.path.includes('..') || /["\\\n]/.test(c.path)) errors.push(`${where}: unsafe path`)
    if (DENIED.some(re => re.test(c.path))) errors.push(`${where}: protected path`)
    if (c.added === null || c.deleted === null) { errors.push(`${where}: binary change`); continue }

    if (c.status !== 'M' && c.status !== 'A') errors.push(`${where}: only added or modified files are allowed (status ${c.status})`)
    if (c.dstMode !== '100644' && !(c.status === 'M' && c.srcMode === c.dstMode && c.dstMode === '100755')) {
      errors.push(`${where}: unexpected file mode ${c.dstMode}`)
    }
    if (c.status === 'M' && c.srcMode !== c.dstMode) errors.push(`${where}: file mode changed`)

    total += c.added + c.deleted

    if (isTest(c.path)) {
      touchedTest = true
      if (c.status === 'A') errors.push(`${where}: new test files are not allowed — add the test to the existing test file (new files are not wired into npm test)`)
      if (c.status === 'M' && c.deleted > c.added) errors.push(`${where}: removes more test lines (${c.deleted}) than it adds (${c.added})`)
    } else {
      touchedSource = true
    }
  }

  if (total > LIMITS.maxChangedLines) errors.push(`change is too large (${total} lines > ${LIMITS.maxChangedLines})`)
  if (changes.length && !touchedTest)   errors.push('no test was added — a fix must include a regression test')
  if (changes.length && !touchedSource) errors.push('only tests changed — there is no fix')

  return { ok: errors.length === 0, errors }
}

/** Parse `git diff --cached --raw --numstat` output into change records. */
export function parseDiff(output) {
  const raw = new Map()
  const stats = new Map()
  for (const line of output.split('\n')) {
    if (!line) continue
    if (line.startsWith(':')) {
      const [meta, file] = line.slice(1).split('\t')
      const [srcMode, dstMode, , , status] = meta.split(' ')
      raw.set(file, { status, srcMode, dstMode })
    } else {
      const [a, d, file] = line.split('\t')
      stats.set(file, { added: a === '-' ? null : Number(a), deleted: d === '-' ? null : Number(d) })
    }
  }
  return [...raw].map(([file, r]) => ({ path: file, ...r, ...(stats.get(file) ?? { added: null, deleted: null }) }))
}

function main() {
  const out = execFileSync('git', ['diff', '--cached', '--raw', '--numstat'], { encoding: 'utf8' })
  const result = checkChanges(parseDiff(out))
  if (result.ok) {
    console.log('patch OK')
    return
  }
  console.error('Patch rejected:\n' + result.errors.map(e => `  - ${e}`).join('\n'))
  process.exit(1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
