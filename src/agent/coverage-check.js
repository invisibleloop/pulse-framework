#!/usr/bin/env node
/**
 * coverage-check.js
 *
 * Called by the Stop hook in .claude/settings.json to enforce test coverage.
 * Runs `npm run test:coverage` and blocks the agent if any src/pages/ file
 * has uncovered lines — except async action run() and server fetcher functions
 * which cannot be tested without mocking real APIs.
 *
 * Outputs a Claude Code hook JSON decision to stdout.
 */

import { execSync } from 'child_process'
import fs from 'fs'

// No test files → nothing to check
const hasTests = fs.existsSync('src/pages') && (function scan(d) {
  for (const f of fs.readdirSync(d)) {
    const p = `${d}/${f}`
    if (fs.statSync(p).isDirectory()) { if (scan(p)) return true }
    else if (f.endsWith('.test.js')) return true
  }
  return false
})('src/pages')

if (!hasTests) process.exit(0)

let out = ''
try {
  out = execSync('npm run test:coverage 2>&1', { encoding: 'utf8', timeout: 60000 })
} catch (e) {
  out = e.stdout || e.message
}

// Parse the coverage report — look for lines with uncovered line numbers
const lines = out.split('\n')
let inReport = false
const gaps = []

for (const line of lines) {
  if (line.includes('start of coverage report')) { inReport = true; continue }
  if (!inReport) continue

  // Match: #  filename.js | line% | branch% | func% | 30-36 50
  const m = line.match(/^[#ℹ]\s+([\w./[\]-]+\.js)\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*([^|\n]+)$/)
  if (m) {
    const uncov = m[2].trim()
    if (uncov && uncov !== 'uncovered lines') {
      gaps.push(`  ${m[1].trim()} — uncovered lines: ${uncov}`)
    }
  }
}

if (gaps.length) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: [
      'COVERAGE GAPS detected. Add tests for these uncovered lines before finishing:',
      ...gaps,
      '',
      'Run `npm run test:coverage` to see the full report.',
      'Exempt from this rule: async action run() functions and server fetchers that call real APIs.',
      'Everything else — view branches, mutations, onViewError, pure helper functions — must be covered.',
    ].join('\n'),
  }))
}
