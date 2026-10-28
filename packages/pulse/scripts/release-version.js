#!/usr/bin/env node
/**
 * Determine the next version from conventional commits.
 *
 * Reads all commits since the last "chore: release X.Y.Z [skip ci]" commit
 * that touched packages/pulse, applies conventional commit rules to
 * determine the bump level, then prints the new version string to stdout.
 * Prints nothing (and says why on stderr) when no commit touched the package since the last
 * release: there is nothing to release, and the workflow skips the publish.
 *
 * Bump rules (the header's "!" or a "BREAKING CHANGE:" footer marks a breaking change):
 *   breaking, version >= 1.0.0                  →  major
 *   breaking, version 0.x                       →  minor (0.x is pre-1.0: "Major: not used until 1.0",
 *                                                  see the stability page; 1.0.0 is a deliberate step)
 *   feat:                                       →  minor
 *   anything else (fix, perf, chore, docs…)    →  patch
 * Types are matched case-insensitively ("Feat:", "Fix!:").
 *
 * Scoped to this package's directory (root-anchored): this repo is a monorepo where sibling
 * packages could share the same git history — without the path filter, a
 * commit that only touches a sibling package would incorrectly drive a
 * version bump for the @invisibleloop/pulse framework package.
 *
 * Needs the full git history (the release workflow checks out with fetch-depth: 0). In a shallow
 * clone the oldest commit looks like it added every file, so the path filter matches it always.
 *
 * Usage: node scripts/release-version.js (run from packages/pulse/)
 */

import { execFileSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

const PKG_DIR = path.resolve(import.meta.dirname, '..')
const pkg     = JSON.parse(readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)

// Collect commit subjects since the last release commit that touched this
// package. git log outputs newest-first; we stop at the first release commit we
// see.
//
// The path filter is anchored at the repository root (":(top)…"). A plain
// `-- packages/pulse` is resolved relative to the CURRENT DIRECTORY, and the release
// workflow runs this from packages/pulse — so it matched nothing, the log was always
// empty, and every release was a patch: feat: and breaking commits never bumped the
// minor/major version.
let commits = []      // { subject, body }, newest first, back to the last release
let haveHistory = false
try {
  // git's own answer for where this directory sits in the repo ("packages/pulse/", empty at the
  // root). Comparing --show-toplevel with PKG_DIR instead breaks on Windows, where git prints
  // forward slashes and may use a different spelling (8.3 short names) of the same directory.
  const prefix = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: PKG_DIR, encoding: 'utf8' }).trim()
  const rel = prefix.replace(/\/$/, '') || '.'
  // subject, unit separator, body, record separator — bodies are multi-line, so no newline splitting
  const log = execFileSync('git', ['log', '--pretty=format:%s%x1f%b%x1e', '--', `:(top)${rel}`], { cwd: PKG_DIR, encoding: 'utf8' })
  haveHistory = true
  for (const record of log.split('\x1e')) {
    const [subject = '', body = ''] = record.replace(/^\n/, '').split('\x1f')
    if (/^chore: release \d+\.\d+\.\d+/.test(subject)) break
    if (subject) commits.push({ subject, body })
  }
} catch {
  // No git history — default to patch
}

// Nothing under the package changed since the last release: docs-only, CI-only or root-only merges
// must not publish an identical package under a new version.
if (haveHistory && commits.length === 0) {
  process.stderr.write('No commit has touched this package since the last release: nothing to release.\n')
  process.exit(0)
}

// Determine bump level
const BREAKING_HEADER = /^[a-z]+(\([^)]+\))?!:/i
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m
const FEATURE         = /^feat(\([^)]+\))?:/i
let breaking = false
let feature  = false
for (const { subject, body } of commits) {
  if (BREAKING_HEADER.test(subject) || subject.includes('BREAKING CHANGE') || BREAKING_FOOTER.test(body)) breaking = true
  if (FEATURE.test(subject)) feature = true
}
let bump = 'patch'
if (breaking) bump = major === 0 ? 'minor' : 'major'
else if (feature) bump = 'minor'

// Compute new version
let next
if      (bump === 'major') next = `${major + 1}.0.0`
else if (bump === 'minor') next = `${major}.${minor + 1}.0`
else                       next = `${major}.${minor}.${patch + 1}`

process.stdout.write(next + '\n')
