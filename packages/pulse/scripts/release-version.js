#!/usr/bin/env node
/**
 * Determine the next version from conventional commits.
 *
 * Reads all commits since the last "chore: release X.Y.Z [skip ci]" commit
 * that touched packages/pulse, applies conventional commit rules to
 * determine the bump level, then prints the new version string to stdout.
 *
 * Bump rules:
 *   BREAKING CHANGE footer or "type!:" prefix  →  major
 *   feat:                                       →  minor
 *   anything else (fix, perf, chore, docs…)    →  patch
 *
 * Scoped to `-- packages/pulse`: this repo is a monorepo where sibling
 * packages could share the same git history — without the path filter, a
 * commit that only touches a sibling package would incorrectly drive a
 * version bump for the @invisibleloop/pulse framework package.
 *
 * Usage: node scripts/release-version.js (run from packages/pulse/)
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

const PKG_DIR = path.resolve(import.meta.dirname, '..')
const pkg     = JSON.parse(readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)

// Collect commit subjects since the last release commit that touched this
// package. git log outputs newest-first; we stop at the first release
// commit we see. Must be run with cwd inside the repo (any subdirectory) —
// `-- packages/pulse` is resolved relative to the repo root by git itself.
let commits = []
try {
  const log = execSync('git log --pretty=format:%s -- packages/pulse', { encoding: 'utf8' }).trim()
  for (const line of log.split('\n')) {
    if (/^chore: release \d+\.\d+\.\d+/.test(line)) break
    if (line) commits.push(line)
  }
} catch {
  // No git history — default to patch
}

// Determine bump level
let bump = 'patch'
for (const msg of commits) {
  // Breaking change: "type!:" or "BREAKING CHANGE" anywhere in the subject
  if (/^[a-z]+(\([^)]+\))?!:/.test(msg) || msg.includes('BREAKING CHANGE')) {
    bump = 'major'
    break
  }
  // New feature: "feat:" or "feat(scope):"
  if (/^feat(\([^)]+\))?:/.test(msg) && bump !== 'major') {
    bump = 'minor'
  }
}

// Compute new version
let next
if      (bump === 'major') next = `${major + 1}.0.0`
else if (bump === 'minor') next = `${major}.${minor + 1}.0`
else                       next = `${major}.${minor}.${patch + 1}`

process.stdout.write(next + '\n')
