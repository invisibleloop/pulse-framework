/**
 * Markdown parser tests — run with: node src/md/md.test.js
 */
import { parseMd } from './index.js'

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${label}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

// ---------------------------------------------------------------------------
// Task lists (GFM checkboxes)
// ---------------------------------------------------------------------------

console.log('\nTask list (checkbox) rendering\n')

test('unchecked item renders disabled checkbox', () => {
  const { html } = parseMd('- [ ] Buy milk')
  assert(html.includes('<input type="checkbox" disabled>'), `Got: ${html}`)
  assert(html.includes('Buy milk'), `Got: ${html}`)
})

test('checked item renders checked disabled checkbox', () => {
  const { html } = parseMd('- [x] Done')
  assert(html.includes('<input type="checkbox" disabled checked>'), `Got: ${html}`)
})

test('uppercase X is also treated as checked', () => {
  const { html } = parseMd('- [X] Done')
  assert(html.includes('<input type="checkbox" disabled checked>'), `Got: ${html}`)
})

test('task list items get task-list-item class', () => {
  const { html } = parseMd('- [ ] Item')
  assert(html.includes('class="task-list-item"'), `Got: ${html}`)
})

test('task list ul gets contains-task-list class', () => {
  const { html } = parseMd('- [ ] Item one\n- [x] Item two')
  assert(html.includes('class="contains-task-list"'), `Got: ${html}`)
})

test('mixed task and regular items — ul gets contains-task-list class', () => {
  const { html } = parseMd('- [ ] Task\n- Regular item')
  assert(html.includes('class="contains-task-list"'), `Got: ${html}`)
})

test('regular list has no task-list classes', () => {
  const { html } = parseMd('- Apple\n- Banana')
  assert(!html.includes('contains-task-list'), `Got: ${html}`)
  assert(!html.includes('task-list-item'), `Got: ${html}`)
  assert(!html.includes('checkbox'), `Got: ${html}`)
})

test('task item label text is rendered as inline markdown', () => {
  const { html } = parseMd('- [ ] Read **important** docs')
  assert(html.includes('<strong>important</strong>'), `Got: ${html}`)
})

test('multiple items preserve checked state independently', () => {
  const { html } = parseMd('- [ ] Unchecked\n- [x] Checked\n- [ ] Also unchecked')
  const checkedCount   = (html.match(/checked>/g) || []).length
  const uncheckedCount = (html.match(/<input type="checkbox" disabled>/g) || []).length
  assert(checkedCount === 1,   `Expected 1 checked, got ${checkedCount}`)
  assert(uncheckedCount === 2, `Expected 2 unchecked, got ${uncheckedCount}`)
})

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

console.log('\nFrontmatter\n')

test('extracts frontmatter key/value pairs', () => {
  const { frontmatter } = parseMd('---\ntitle: Hello World\ndate: 2026-01-01\n---\nBody text')
  assert(frontmatter.title === 'Hello World', `Got: ${JSON.stringify(frontmatter)}`)
  assert(frontmatter.date === '2026-01-01', `Got: ${JSON.stringify(frontmatter)}`)
})

test('body is parsed without frontmatter block', () => {
  const { html } = parseMd('---\ntitle: Test\n---\n# Heading')
  assert(html.includes('<h1'), `Got: ${html}`)
  assert(!html.includes('title:'), `Got: ${html}`)
})

test('no frontmatter — returns empty object', () => {
  const { frontmatter } = parseMd('# Just a heading')
  assert(Object.keys(frontmatter).length === 0, `Got: ${JSON.stringify(frontmatter)}`)
})

// ---------------------------------------------------------------------------
// Core inline / block rendering
// ---------------------------------------------------------------------------

console.log('\nInline and block rendering\n')

test('bold', () => {
  const { html } = parseMd('**bold**')
  assert(html.includes('<strong>bold</strong>'), `Got: ${html}`)
})

test('italic', () => {
  const { html } = parseMd('*italic*')
  assert(html.includes('<em>italic</em>'), `Got: ${html}`)
})

test('strikethrough', () => {
  const { html } = parseMd('~~strike~~')
  assert(html.includes('<del>strike</del>'), `Got: ${html}`)
})

test('inline code', () => {
  const { html } = parseMd('Use `foo()` here')
  assert(html.includes('<code>foo()</code>'), `Got: ${html}`)
})

test('heading levels', () => {
  const { html } = parseMd('# H1\n## H2\n### H3')
  assert(html.includes('<h1'), `Got: ${html}`)
  assert(html.includes('<h2'), `Got: ${html}`)
  assert(html.includes('<h3'), `Got: ${html}`)
})

test('heading gets id from text', () => {
  const { html } = parseMd('## My Section')
  assert(html.includes('id="my-section"'), `Got: ${html}`)
})

test('ordered list', () => {
  const { html } = parseMd('1. First\n2. Second')
  assert(html.includes('<ol>'), `Got: ${html}`)
  assert(html.includes('<li>First</li>'), `Got: ${html}`)
})

test('blockquote', () => {
  const { html } = parseMd('> A quote')
  assert(html.includes('<blockquote>'), `Got: ${html}`)
})

test('horizontal rule', () => {
  const { html } = parseMd('---')
  assert(html.includes('<hr>'), `Got: ${html}`)
})

test('link', () => {
  const { html } = parseMd('[Pulse](https://example.com)')
  assert(html.includes('<a href="https://example.com">Pulse</a>'), `Got: ${html}`)
})

test('HTML is escaped in inline text', () => {
  const { html } = parseMd('A <script>alert(1)</script> here')
  assert(!html.includes('<script>'), `Got: ${html}`)
  assert(html.includes('&lt;script&gt;'), `Got: ${html}`)
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
