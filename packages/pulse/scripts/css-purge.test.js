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
import fs from 'node:fs'

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

// ---------------------------------------------------------------------------
// Runtime state classes — classList arguments
// ---------------------------------------------------------------------------
// Regression: the JS string scan only keeps hyphenated names (to avoid keeping
// every English word), so runtime state classes like classList.add('open') were
// never collected — and selectorUsed checks the rightmost class token, so
// `.docs-sidebar.open { … }` was purged from production CSS. The mobile docs
// hamburger toggled the class, but the rule that slides the sidebar in was gone.

test('classList method arguments are collected regardless of hyphens', () => {
  const used = extractUsedClasses([], [
    `sidebar.classList.add('open')`,
    `overlay.classList.remove("visible")`,
    `el.classList.toggle('active', isOn)`,
    `el.classList.replace('open', 'closed')`,
  ])
  for (const cls of ['open', 'visible', 'active', 'closed']) {
    assert.ok(used.has(cls), `Expected classList arg "${cls}" to be collected`)
  }
})

test('multiple classList arguments in one call are all collected', () => {
  const used = extractUsedClasses([], [`el.classList.add('one', 'two-x', 'three')`])
  for (const cls of ['one', 'two-x', 'three']) assert.ok(used.has(cls), cls)
})

// Regression: class name immediately followed by ${ (no space before the expression)
// was not extracted — "saved-palette${...}" yielded "saved-palette${expanded" as a
// single token, so the rule was silently purged in prod while dev (no purging) looked fine.
test('class name immediately before ${ is extracted correctly', () => {
  const js = [
    // No space before ${ — the broken pattern
    `const v = \`<div class="saved-palette\${expanded ? ' saved-palette--expanded' : ''}"></div>\``,
    // Multiple static classes, last one butts into ${
    `const v = \`<button class="btn btn--primary\${loading ? ' btn--loading' : ''}"></button>\``,
  ]
  const used = extractUsedClasses([], js)
  for (const cls of ['saved-palette', 'btn', 'btn--primary']) {
    assert.ok(used.has(cls), `Expected "${cls}" to be extracted but it was missing`)
  }
})

test('runtime-toggled compound rule survives the purge', () => {
  const css = `.docs-sidebar { transform: translateX(-100%); }\n.docs-sidebar.open { transform: translateX(0); }\n.unused { color: red; }`
  const used = extractUsedClasses(
    [`<aside class="docs-sidebar">`],
    [`document.querySelector('.docs-sidebar').classList.add('open')`]
  )
  const out = purgeCss(css, used)
  assert.ok(out.includes('.docs-sidebar.open'), `Compound state rule was purged: ${out}`)
  assert.ok(!out.includes('.unused'), 'Unused rule should still be purged')
})

test('classes the framework injects outside any view survive the purge (skip link, #161)', () => {
  const css = fs.readFileSync(new URL('../public/pulse-ui.css', import.meta.url), 'utf8')
  // Nothing the build scans mentions pulse-skip-link: it is written by ssr.js wrapDocument.
  const out = minifyCss(purgeCss(css, extractUsedClasses(['<main class="ui-hero">x</main>'], [], [])))
  assert.match(out, /\.pulse-skip-link\{[^}]*left:-9999px/, 'hidden state purged')
  assert.match(out, /\.pulse-skip-link:focus\{[^}]*position:fixed/, 'focus state purged')
})

// ── class names built at run time ───────────────────────────────────────────

// Source text that contains a template expression, built without escapes.
const EXPR = '$' + '{variant}'

test('a class built as a template literal or a concatenation keeps every rule that starts like it', () => {
  const js = [
    'const a = `ui-btn--' + EXPR + '`',
    'const b = `u-text-' + EXPR + '`',
    "const c = 'tok-' + kind",
    'const d = `<i class="card item-' + EXPR + '">`',
  ].join('\n')
  const used = extractUsedClasses([], [js], [])
  assert.deepEqual([...used._dynamicPrefixes].sort(), ['item-', 'tok-', 'u-text-', 'ui-btn--'])
  for (const kept of ['.ui-btn--primary', '.ui-btn--sm', '.u-text-4xl', '.tok-kw', '.item-3', '.ui-btn--primary:hover', '.nav .tok-str']) {
    assert(selectorUsed(kept, used), `${kept} starts like a name the source builds`)
  }
})

test('the prefix rule does not keep unrelated classes, the bare prefix, or prefixes that are too short', () => {
  const js = 'const x = `ui-' + EXPR + '`; const y = `u-' + EXPR + '`; const z = `type-' + EXPR + '`'
  const used = extractUsedClasses([], [js], [])
  assert.deepEqual(used._dynamicPrefixes, ['type-'], "'ui-' and 'u-' are too broad to trust")
  assert(selectorUsed('.type-fire', used))
  assert(!selectorUsed('.type-', used), 'the bare prefix is not a class')
  for (const dropped of ['.ui-card', '.u-mt-4', '.typeface', '.other-fire']) assert(!selectorUsed(dropped, used), `${dropped} is not covered`)
})

test('without a template or concatenation there are no prefixes, and nothing extra is kept', () => {
  const used = extractUsedClasses([], ["const a = 'ui-btn--disabled'"], [])
  assert.equal(used._dynamicPrefixes, undefined)
  assert(selectorUsed('.ui-btn--disabled', used))
  assert(!selectorUsed('.ui-btn--primary', used))
})
