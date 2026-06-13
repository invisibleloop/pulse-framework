#!/usr/bin/env node
/**
 * coverage-check.js
 *
 * Called by the Stop hook in .claude/settings.json to enforce test coverage.
 * Runs `npm run test:coverage` and blocks the agent if any src/pages/ file
 * has uncovered lines — except code that cannot be unit-tested without mocking
 * real APIs:
 *
 *   - server fetchers (`server:` blocks) and store fetchers
 *   - action `run:` functions
 *   - `guard:`, `submit:`, and `sitemap:` handlers
 *   - `meta:` blocks (async meta functions hit real data sources)
 *
 * Also honours c8-style ignore comments, which Node's built-in coverage
 * (--experimental-test-coverage) does NOT support natively. In a block or line
 * comment, write:
 *
 *   "c8 ignore next"      — exempts the following line
 *   "c8 ignore next 3"    — exempts the following 3 lines
 *   "c8 ignore start" ... "c8 ignore stop"  — exempts the range
 *   ("coverage-ignore" works as a synonym for "c8 ignore")
 *
 * Outputs a Claude Code hook JSON decision to stdout.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import { pathToFileURL } from 'url'

// Property blocks that are exempt — all server-side-only code paths that call
// real external APIs and cannot run in unit tests.
const EXEMPT_BLOCK_STARTS = [
  /^server\s*:/,
  /^run\s*:/, /^run\s*\(/,
  /^guard\s*:/,
  /^submit\s*:/,
  /^sitemap\s*:/,
  /^meta\s*:/,
]

/**
 * Build the set of exempt (1-based) line numbers for a source string:
 * lines inside exempt property blocks, plus c8-ignore-annotated lines.
 *
 * @param {string} src
 * @returns {Set<number>}
 */
export function computeExemptLines(src) {
  const srcLines = src.split('\n')
  const exemptLines = new Set()

  // 1. Exempt property blocks — scan tracking brace/paren depth from block start
  let i = 0
  while (i < srcLines.length) {
    const trimmed = srcLines[i].trimStart()
    if (EXEMPT_BLOCK_STARTS.some(re => re.test(trimmed))) {
      let depth = 0
      let started = false
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

  // 2. c8-style ignore comments (Node's built-in coverage ignores these, so we
  //    honour them here — the marker line itself is always exempt too)
  const IGNORE = /(?:c8 ignore|coverage-ignore)(?:\s+(next|start|stop))?(?:\s+(\d+))?/
  let rangeOpen = false
  for (let n = 0; n < srcLines.length; n++) {
    if (rangeOpen) exemptLines.add(n + 1)
    const m = srcLines[n].match(IGNORE)
    if (!m) continue
    exemptLines.add(n + 1)
    const keyword = m[1]
    if (keyword === 'start') { rangeOpen = true; continue }
    if (keyword === 'stop')  { rangeOpen = false; continue }
    // 'next' (or bare marker) — exempt the following N lines (default 1)
    const count = m[2] ? parseInt(m[2], 10) : 1
    for (let k = 1; k <= count; k++) exemptLines.add(n + 1 + k)
  }

  return exemptLines
}

/**
 * Returns true if all uncovered line numbers fall on exempt lines.
 *
 * @param {string} filePath
 * @param {string} uncoveredSpec - e.g. "30-36 50"
 * @returns {boolean}
 */
export function allLinesExempt(filePath, uncoveredSpec) {
  let src
  try { src = fs.readFileSync(filePath, 'utf8') } catch { return false }

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

  const exemptLines = computeExemptLines(src)
  return lineNums.every(n => exemptLines.has(n))
}

// ---------------------------------------------------------------------------
// Main — only when executed directly (the exports above are unit-tested)
// ---------------------------------------------------------------------------

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

function main() {
  // Agent is ending its turn to wait for the user's answer (approval gate or a
  // mid-flow pause) — let the turn end. The marker is consumed on the user's
  // next prompt, so the gates return in full force afterwards.
  if (fs.existsSync('.pulse-awaiting-approval')) process.exit(0)

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
        'Auto-exempt: server fetchers, action run(), guard, submit, sitemap, and meta blocks — these call real APIs and need no tests.',
        'For anything else that genuinely cannot be tested, annotate it: /* c8 ignore next */ (or next N, or start/stop for a range) — this hook honours those comments even though Node\'s built-in coverage does not.',
        'Everything else — view branches, mutations, onViewError, pure helper functions — must be covered.',
      ].join('\n'),
    }))
  }
}
