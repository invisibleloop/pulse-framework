/**
 * Release version tests — run with: node scripts/release-version.test.js
 *
 * Builds a throwaway git repo shaped like this monorepo (packages/pulse + a sibling
 * dir), runs the real script from packages/pulse exactly as the release workflow
 * does, and checks the version it computes from conventional commits.
 *
 * Regression: the script's path filter was resolved relative to the working
 * directory, matched nothing, and so every release was a patch — feat: and breaking
 * commits never bumped minor/major.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs   from 'node:fs'
import os   from 'node:os'
import path from 'node:path'

const SCRIPT = fs.readFileSync(new URL('./release-version.js', import.meta.url), 'utf8')

function repo(startVersion = '0.20.5') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-relver-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' })
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  fs.mkdirSync(path.join(dir, 'packages/pulse/scripts'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'packages/pulse/scripts/release-version.js'), SCRIPT)
  fs.writeFileSync(path.join(dir, 'packages/pulse/package.json'), JSON.stringify({ name: 'x', version: startVersion }))
  let n = 0
  const commit = (subject, where = 'packages/pulse', body = '') => {
    fs.writeFileSync(path.join(dir, where, `f${n++}.txt`), String(n))
    git('add', '-A'); git('commit', '-q', '-m', body ? `${subject}\n\n${body}` : subject)
  }
  const next = (cwd = 'packages/pulse') =>
    execFileSync(process.execPath, [path.join(dir, 'packages/pulse/scripts/release-version.js')], { cwd: path.join(dir, cwd), encoding: 'utf8' }).trim()
  commit(`chore: release ${startVersion} [skip ci]`)
  return { dir, commit, next, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

test('a fix: since the last release is a patch bump', () => {
  const r = repo(); try { r.commit('fix: a thing'); assert.equal(r.next(), '0.20.6') } finally { r.cleanup() }
})

test('a feat: since the last release is a MINOR bump (this was always a patch before)', () => {
  const r = repo(); try { r.commit('fix: a'); r.commit('feat(server): new option (#1)'); assert.equal(r.next(), '0.21.0') } finally { r.cleanup() }
})

test('before 1.0 a breaking commit is a MINOR bump (1.0.0 is a deliberate step, per the stability page)', () => {
  for (const subject of ['feat!: drop a thing', 'refactor(api)!: rename', 'fix: x BREAKING CHANGE removes y', 'Fix!: capitalised type']) {
    const r = repo(); try { r.commit(subject); assert.equal(r.next(), '0.21.0', subject) } finally { r.cleanup() }
  }
})

test('from 1.0 a breaking commit is a MAJOR bump, by "!", by the subject, or by a BREAKING CHANGE footer in the body', () => {
  for (const [subject, body] of [['feat!: drop a thing', ''], ['refactor(api)!: rename', ''], ['fix: x BREAKING CHANGE removes y', ''],
                                 ['feat: new thing', 'Some detail.\n\nBREAKING CHANGE: the old option is gone'], ['fix: y', 'BREAKING-CHANGE: also a footer']]) {
    const r = repo('1.4.2'); try { r.commit(subject, 'packages/pulse', body); assert.equal(r.next(), '2.0.0', `${subject} / ${body}`) } finally { r.cleanup() }
  }
})

test('a BREAKING CHANGE footer is read from the commit body, before 1.0 as a minor bump', () => {
  const r = repo(); try { r.commit('fix: tidy', 'packages/pulse', 'Detail line.\n\nBREAKING CHANGE: setCookie now throws'); assert.equal(r.next(), '0.21.0') } finally { r.cleanup() }
})

test('types are matched case-insensitively: "Feat:" is a minor bump', () => {
  const r = repo(); try { r.commit('Feat(server): new option'); assert.equal(r.next(), '0.21.0') } finally { r.cleanup() }
})

test('a multi-line body does not leak into the next commit (a "feat:" inside a body is not a feature)', () => {
  const r = repo(); try { r.commit('fix: a', 'packages/pulse', 'the old text said\nfeat: this is only prose'); assert.equal(r.next(), '0.20.6') } finally { r.cleanup() }
})

test('with no commit touching the package since the last release there is nothing to release: no version, exit 0', () => {
  const r = repo(); try {
    r.commit('docs: only docs', 'docs')
    r.commit('chore: only root', '.')
    assert.equal(r.next(), '', 'no output means skip')
  } finally { r.cleanup() }
})

test('it gives the same answer run from the repo root or from the package directory', () => {
  const r = repo(); try { r.commit('feat: x'); assert.equal(r.next('.'), '0.21.0'); assert.equal(r.next('packages/pulse'), '0.21.0') } finally { r.cleanup() }
})

test('only commits that touched the package count: a feat: elsewhere does not bump', () => {
  // the feat: touched only docs/, so it must not make this release a minor one
  const r = repo(); try { r.commit('feat: docs-only thing', 'docs'); r.commit('fix: a package fix'); assert.equal(r.next(), '0.20.6') } finally { r.cleanup() }
})

test('commits before the last release do not count', () => {
  const r = repo(); try {
    r.commit('feat: shipped already')
    r.commit('chore: release 0.21.0 [skip ci]')   // the release that included it
    r.commit('fix: after')
    assert.equal(r.next(), '0.20.6')               // package.json still says 0.20.5 here; only the bump LEVEL is under test
  } finally { r.cleanup() }
})
