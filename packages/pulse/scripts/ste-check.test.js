/**
 * The sentence-length check finds what it should and ignores what is not prose.
 * Run with: node scripts/ste-check.test.js
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import path     from 'node:path'
import { fileURLToPath } from 'node:url'
import { sentences, longSentences, MAX_WORDS } from './ste-check.js'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const words = n => Array.from({ length: n }, (_, i) => (i ? 'word' : 'Word')).join(' ')

test('a sentence at the limit passes and one word over fails', () => {
  assert.equal(longSentences(`${words(MAX_WORDS)}.`).length, 0)
  assert.equal(longSentences(`${words(MAX_WORDS + 1)}.`).length, 1)
})

test('each list item is its own unit', () => {
  const md = `- ${words(15)}.\n- ${words(15)}.\n`
  assert.equal(sentences(md).length, 2)
  assert.equal(longSentences(md).length, 0)
})

test('a paragraph is split into sentences', () => {
  assert.equal(longSentences(`${words(20)}. ${words(20)}.`).length, 0)
})

test('code fences, tables and headings are not prose', () => {
  const md = ['# ' + words(40), '```js', words(40), '```', '| ' + words(40) + ' |', ''].join('\n')
  assert.equal(sentences(md).length, 0)
})

test('inline code counts as one word', () => {
  const md = `Call \`${words(40)}\` now.`
  assert.equal(sentences(md)[0].words, 3)
})

test('e.g. does not end a sentence', () => {
  assert.equal(sentences('Use a tool, e.g. Lighthouse, to check.').length, 1)
})

test('the guides have no more long sentences than the baseline allows', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(PKG, 'scripts', 'ste-baseline.json'), 'utf8'))
  const dir = path.join(PKG, 'src', 'agent')
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const n = longSentences(fs.readFileSync(path.join(dir, f), 'utf8')).length
    assert.ok(n <= (baseline[f] ?? 0), `${f} has ${n} sentences over ${MAX_WORDS} words (baseline ${baseline[f] ?? 0})`)
  }
})
