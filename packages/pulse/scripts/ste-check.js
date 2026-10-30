#!/usr/bin/env node
/**
 * Sentence-length check for the agent guides (a subset of ASD-STE100).
 *
 * An agent follows the guides in src/agent/ literally. A sentence that holds several
 * instructions is the one an agent half-follows. This script finds sentences longer than
 * MAX_WORDS so they can be split. It does not check vocabulary, tense or voice.
 *
 * Code fences, tables, headings and inline code are not prose. A fence and a table row are
 * skipped, a heading is skipped and inline code counts as one word.
 *
 * The check is a ratchet. scripts/ste-baseline.json holds the number of long sentences each
 * file has today. A file fails when it has more than its baseline, so new text must meet the
 * limit and old text can be fixed over time. Fix a file, then lower its baseline.
 *
 * Usage (run from packages/pulse/):
 *   node scripts/ste-check.js                   report, exit 1 if any file is over its baseline
 *   node scripts/ste-check.js --list            also print every long sentence
 *   node scripts/ste-check.js --update-baseline write the current counts to the baseline
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const MAX_WORDS = 25

const PKG      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AGENT    = path.join(PKG, 'src', 'agent')
const BASELINE = path.join(PKG, 'scripts', 'ste-baseline.json')

/**
 * Split markdown into prose sentences. Each list item and each paragraph starts a new unit.
 *
 * @param {string} md
 * @returns {{ text: string, words: number, line: number }[]}
 */
export function sentences(md) {
  const out = []
  let inFence = false
  let unit = ''
  let unitLine = 0

  const flush = () => {
    const text = unit.trim()
    unit = ''
    if (!text) return
    const clean = text
      .replace(/\b(e\.g|i\.e|etc|vs)\./gi, '$1')
      .replace(/`[^`]*`/g, 'X')
      .replace(/\*\*|__|\*|_/g, '')
    for (const s of clean.split(/(?<=[.!?:])\s+(?=[A-Z"'(“])/)) {
      const words = s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length
      if (words) out.push({ text: s.trim(), words, line: unitLine })
    }
  }

  md.split('\n').forEach((raw, i) => {
    if (/^\s*(```|~~~)/.test(raw)) { flush(); inFence = !inFence; return }
    if (inFence) return
    if (/^\s*#{1,6}\s/.test(raw) || /^\s*\|/.test(raw) || /^\s*(---|\*\*\*)\s*$/.test(raw)) { flush(); return }
    if (!raw.trim()) { flush(); return }
    const item = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/)
    if (item) { flush(); unitLine = i + 1; unit = item[1]; return }
    if (!unit) unitLine = i + 1
    unit += ' ' + raw.replace(/^\s*>\s?/, '')
  })
  flush()
  return out
}

/** @param {string} md @returns {{ text: string, words: number, line: number }[]} */
export function longSentences(md, max = MAX_WORDS) {
  return sentences(md).filter(s => s.words > max)
}

function guideFiles() {
  return fs.readdirSync(AGENT).filter(f => f.endsWith('.md')).sort()
}

function main() {
  const args     = process.argv.slice(2)
  const list     = args.includes('--list')
  const update   = args.includes('--update-baseline')
  const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {}
  const counts   = {}
  let failed = false

  for (const f of guideFiles()) {
    const long = longSentences(fs.readFileSync(path.join(AGENT, f), 'utf8'))
    counts[f] = long.length
    const allowed = baseline[f] ?? 0
    const over    = long.length > allowed
    if (over) failed = true
    console.log(`${over ? 'FAIL' : 'ok  '} ${f.padEnd(28)} ${String(long.length).padStart(3)} long (baseline ${allowed})`)
    if (list || over) for (const s of long) console.log(`       ${f}:${s.line}  ${s.words} words  ${s.text.slice(0, 90)}…`)
  }

  if (update) {
    fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + '\n')
    console.log(`\nBaseline written to ${path.relative(PKG, BASELINE)}`)
    return
  }
  if (failed) {
    console.error(`\nA guide has more sentences over ${MAX_WORDS} words than its baseline. Split the sentences.`)
    process.exit(1)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
