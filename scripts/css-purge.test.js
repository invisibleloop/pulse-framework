/**
 * CSS purge/minify tests — run with: node scripts/css-purge.test.js
 *
 * Regression focus: @import URLs containing `;` and `&` in their query string
 * (Google Fonts) were truncated by the production build — the block parser
 * split the statement at the `;` inside the quoted URL, silently breaking the
 * theme in production while dev (which serves CSS unprocessed) looked fine.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { parseCssBlocks, purgeCss, minifyCss, extractUsedClasses, selectorUsed } from './css-purge.js'

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');`

// ---------------------------------------------------------------------------
// The @import regression
// ---------------------------------------------------------------------------

test('parseCssBlocks: does not split @import at a ; inside a quoted URL', () => {
  const css = `${FONT_IMPORT}\n:root { --accent: #e25; }`
  const blocks = parseCssBlocks(css)
  assert.equal(blocks.length, 2, `Expected 2 blocks, got ${blocks.length}: ${JSON.stringify(blocks.map(b => b.raw))}`)
  assert.equal(blocks[0].type, 'at-simple')
  assert.equal(blocks[0].raw, FONT_IMPORT)
})

test('parseCssBlocks: handles double-quoted URLs and escapes', () => {
  const css = `@import url("https://example.com/a;b&c=d");\n.x { color: red; }`
  const blocks = parseCssBlocks(css)
  assert.equal(blocks[0].raw, `@import url("https://example.com/a;b&c=d");`)
})

test('purgeCss + minifyCss: Google Fonts @import survives the full pipeline intact', () => {
  const css = `${FONT_IMPORT}\n:root { --font: 'Inter', sans-serif; }\n.unused { color: red; }`
  const out = minifyCss(purgeCss(css, new Set([])))
  assert.ok(
    out.includes(`url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap')`),
    `@import URL was mangled by the build pipeline. Output: ${out}`
  )
})

test('minifyCss: quoted strings are untouched by punctuation collapsing', () => {
  const css = `.x { content: "a ; b : c , d" ; }`
  const out = minifyCss(css)
  assert.ok(out.includes(`"a ; b : c , d"`), `Quoted string was altered: ${out}`)
})

// ---------------------------------------------------------------------------
// Behaviour preserved through the extraction refactor
// ---------------------------------------------------------------------------

test('purgeCss: drops unused class rules, keeps used ones', () => {
  const css = `.used { color: red; }\n.unused { color: blue; }`
  const out = purgeCss(css, new Set(['used']))
  assert.ok(out.includes('.used'))
  assert.ok(!out.includes('.unused'))
})

test('purgeCss: element and :root rules are always kept', () => {
  const css = `:root { --x: 1; }\nbody { margin: 0; }`
  const out = purgeCss(css, new Set([]))
  assert.ok(out.includes(':root'))
  assert.ok(out.includes('body'))
})

test('purgeCss: recurses into @media and keeps @font-face', () => {
  const css = `@media (min-width: 600px) { .used { color: red; } .unused { color: blue; } }\n@font-face { font-family: X; src: url('/x.woff2'); }`
  const out = purgeCss(css, new Set(['used']))
  assert.ok(out.includes('.used'))
  assert.ok(!out.includes('.unused'))
  assert.ok(out.includes('@font-face'))
})

test('selectorUsed: rightmost class is the subject', () => {
  assert.equal(selectorUsed('.nav .link', new Set(['link'])), true)
  assert.equal(selectorUsed('.nav .link', new Set(['nav'])), false)
  assert.equal(selectorUsed('.btn:hover', new Set(['btn'])), true)
})

test('extractUsedClasses: finds class attributes and hyphenated JS strings', () => {
  const used = extractUsedClasses(
    ['<div class="hero card">'],
    [`el.classList.add('ui-btn--active')`]
  )
  assert.ok(used.has('hero'))
  assert.ok(used.has('card'))
  assert.ok(used.has('ui-btn--active'))
})

test('minifyCss: calc() expressions keep their operator spacing', () => {
  const out = minifyCss(`.x { width: calc(100% - 2rem); }`)
  assert.ok(out.includes('calc(100% - 2rem)'), `calc broken: ${out}`)
})
