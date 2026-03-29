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
const rawGaps = []

for (const line of lines) {
  if (line.includes('start of coverage report')) { inReport = true; continue }
  if (!inReport) continue

  // Match: #  filename.js | line% | branch% | func% | 30-36 50
  const m = line.match(/^[#ℹ]\s+([\w./[\]-]+\.js)\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*([^|\n]+)$/)
  if (m) {
    const uncov = m[2].trim()
    if (uncov && uncov !== 'uncovered lines') {
      rawGaps.push({ file: m[1].trim(), uncovered: uncov })
    }
  }
}

/**
 * Returns true if all uncovered line numbers in the given file fall inside
 * a `server:` property block or an action `run:` function — both of which
 * call real external APIs and are explicitly exempt from coverage requirements.
 */
function allLinesExempt(filePath, uncoveredSpec) {
  let src
  try { src = fs.readFileSync(filePath, 'utf8') } catch { return false }
  const srcLines = src.split('\n')

  // Expand "30-36 50" → [30, 31, 32, 33, 34, 35, 36, 50]
  const lineNums = []
  for (const part of uncoveredSpec.split(/\s+/)) {
    const range = part.match(/^(\d+)-(\d+)$/)
    if (range) {
      for (let i = parseInt(range[1]); i <= parseInt(range[2]); i++) lineNums.push(i)
    } else if (/^\d+$/.test(part)) {
      lineNums.push(parseInt(part))
    }
  }

  // Build a set of exempt line numbers: lines inside `server:` blocks or action `run:` functions.
  // Strategy: scan the source tracking brace depth relative to the start of each exempt block.
  const exemptLines = new Set()
  let i = 0
  while (i < srcLines.length) {
    const trimmed = srcLines[i].trimStart()
    // Detect start of `server:` property or action `run:` function
    const isExemptStart = /^server\s*:/.test(trimmed) || /^run\s*:/.test(trimmed) || /^run\s*\(/.test(trimmed)
    if (isExemptStart) {
      // Mark lines from here until the block closes (depth reaches 0 after opening)
      let depth = 0
      let started = false
      const startLine = i
      while (i < srcLines.length) {
        exemptLines.add(i + 1) // 1-based
        for (const ch of srcLines[i]) {
          if (ch === '{' || ch === '(') { depth++; started = true }
          if (ch === '}' || ch === ')') { depth-- }
        }
        if (started && depth <= 0) break
        i++
      }
    }
    i++
  }

  return lineNums.every(n => exemptLines.has(n))
}

const gaps = []
for (const { file, uncovered } of rawGaps) {
  // Try to resolve relative to cwd (coverage reports use relative paths)
  const candidates = [file, `src/pages/${file}`, file.replace(/^.*src\/pages\//, 'src/pages/')]
  const resolved   = candidates.find(p => fs.existsSync(p))

  if (resolved && allLinesExempt(resolved, uncovered)) continue  // auto-exempt

  gaps.push(`  ${file} — uncovered lines: ${uncovered}`)
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
