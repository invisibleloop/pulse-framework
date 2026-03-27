#!/usr/bin/env node
/**
 * Determine the next version from conventional commits.
 *
 * Reads all commits since the last "chore: release X.Y.Z [skip ci]" commit,
 * applies conventional commit rules to determine the bump level, then prints
 * the new version string to stdout.
 *
 * Bump rules:
 *   BREAKING CHANGE footer or "type!:" prefix  →  major
 *   feat:                                       →  minor
 *   anything else (fix, perf, chore, docs…)    →  patch
 *
 * Usage: node scripts/release-version.js
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const pkg     = JSON.parse(readFileSync('package.json', 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)

// Collect commit subjects since the last release commit.
// git log outputs newest-first; we stop at the first release commit we see.
let commits = []
try {
  const log = execSync('git log --pretty=format:%s', { encoding: 'utf8' }).trim()
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
