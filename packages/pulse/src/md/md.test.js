/**
 * Markdown parser tests — run with: node src/md/md.test.js
 */
import { parseMd } from './index.js'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'url'

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
  assert(html.includes('<input type="checkbox" class="ui-checkbox-input" disabled>'), `Got: ${html}`)
  assert(html.includes('Buy milk'), `Got: ${html}`)
})

test('checked item renders checked disabled checkbox', () => {
  const { html } = parseMd('- [x] Done')
  assert(html.includes('<input type="checkbox" class="ui-checkbox-input" disabled checked>'), `Got: ${html}`)
})

test('uppercase X is also treated as checked', () => {
  const { html } = parseMd('- [X] Done')
  assert(html.includes('<input type="checkbox" class="ui-checkbox-input" disabled checked>'), `Got: ${html}`)
})

test('task list items get task-list-item class', () => {
  const { html } = parseMd('- [ ] Item')
  assert(html.includes('class="task-list-item"'), `Got: ${html}`)
})

test('task item checkbox is wrapped in a label for accessibility', () => {
  const { html } = parseMd('- [ ] Buy milk')
  assert(html.includes('class="ui-checkbox ui-checkbox--disabled"'), `Got: ${html}`)
  assert(html.includes('<input type="checkbox" class="ui-checkbox-input" disabled>'), `Got: ${html}`)
  assert(html.includes('<span class="ui-checkbox-box" aria-hidden="true">'), `Got: ${html}`)
  assert(html.includes('<span class="ui-checkbox-label">Buy milk</span>'), `Got: ${html}`)
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
  const checkedCount   = (html.match(/disabled checked>/g) || []).length
  const uncheckedCount = (html.match(/disabled>/g) || []).length
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

// --- URL scheme sanitisation (XSS) -----------------------------------------

test('link with javascript: scheme is neutralised to #', () => {
  const { html } = parseMd('[x](javascript:alert(1))')
  assert(!html.toLowerCase().includes('javascript:'), `Got: ${html}`)
  assert(html.includes('href="#"'), `Got: ${html}`)
})

test('javascript: scheme neutralised regardless of case', () => {
  const { html } = parseMd('[x](JaVaScRiPt:alert(1))')
  assert(!html.toLowerCase().includes('javascript:'), `Got: ${html}`)
})

test('image with javascript: scheme is neutralised', () => {
  const { html } = parseMd('![i](javascript:alert(1))')
  assert(!html.toLowerCase().includes('javascript:'), `Got: ${html}`)
  assert(html.includes('src="#"'), `Got: ${html}`)
})

test('non-image data: URI in image is neutralised', () => {
  const { html } = parseMd('![i](data:text/html,<script>alert(1)</script>)')
  assert(html.includes('src="#"'), `Got: ${html}`)
})

test('image data: URI is allowed', () => {
  const { html } = parseMd('![i](data:image/png;base64,iVBOR)')
  assert(html.includes('src="data:image/png;base64,iVBOR"'), `Got: ${html}`)
})

test('safe schemes and relative/fragment URLs are preserved', () => {
  for (const url of ['https://ok.com', 'http://ok.com', '/relative', '#frag', 'mailto:a@b.com', 'tel:+15551234']) {
    const { html } = parseMd(`[x](${url})`)
    assert(html.includes(`href="${url}"`), `Expected ${url} preserved, got: ${html}`)
  }
})

// ---------------------------------------------------------------------------

console.log('\nHeading parsing\n')

test('ATX heading closing sequence is stripped', () => {
  assert(parseMd('## Title ##').html.trim() === '<h2 id="title">Title</h2>', 'closing ## not stripped')
  assert(parseMd('### Title ###   ').html.trim() === '<h3 id="title">Title</h3>', 'closing ### with trailing spaces not stripped')
})

test('hashes that are not a closing sequence stay in the heading', () => {
  assert(/>foo #bar</.test(parseMd('# foo #bar').html), '"#bar" must stay')
  assert(/>#</.test(parseMd('# #').html), 'a lone # must stay')
})

test('a heading line with a huge run of spaces parses in linear time', () => {
  const start = Date.now()
  parseMd('# a' + ' '.repeat(200000) + 'x')
  assert(Date.now() - start < 500, 'heading parse took too long')
})

// A heading line the heading branch rejected but the paragraph loop still treated as
// "a heading starts here" consumed no input, so the parser spun forever (CRLF files,
// or any heading containing U+2028/U+2029). Run in a child process with a timeout so
// a regression fails the test instead of hanging the whole run.
function parseFullInChild(input) {
  // The input goes in as an argument, never spliced into the code string.
  const code = `import('./src/md/index.js').then(({ parseMd }) => process.stdout.write(JSON.stringify(parseMd(process.argv[1]))))`
  return JSON.parse(execFileSync(process.execPath, ['-e', code, '--', input], { timeout: 5000, encoding: 'utf8', cwd: fileURLToPath(new URL('../..', import.meta.url)) }))
}
const parseInChild = (input) => parseFullInChild(input).html

test('markdown with CRLF line endings parses (used to hang forever)', () => {
  assert(/<h1[^>]*>Title<\/h1>\s*<p>body<\/p>/.test(parseInChild('# Title\r\n\r\nbody\r\n')), 'CRLF heading + paragraph')
  assert(/<h2[^>]*>T<\/h2>/.test(parseInChild('## T ##\r\n')), 'CRLF closing hashes')
})

test('CRLF frontmatter values have no stray carriage return', () => {
  const { frontmatter } = parseFullInChild('---\r\ntitle: Hi\r\n---\r\n# H\r\n')
  assert(frontmatter.title === 'Hi', `got ${JSON.stringify(frontmatter.title)}`)
})

test('a heading containing U+2028 / U+2029 parses (used to hang forever)', () => {
  assert(/<h1[^>]*>a[\s\S]b<\/h1>\s*<p>text<\/p>/.test(parseInChild('# a\u2028b\n\ntext')), 'U+2028 heading')
  assert(/<h1[^>]*>a[\s\S]b<\/h1>/.test(parseInChild('# a\u2029b')), 'U+2029 heading')
})

// ---------------------------------------------------------------------------

console.log('\nLink parsing stays linear\n')

test('long runs of unclosed link/image openers do not take quadratic time', () => {
  // Before the bounds, each of these took several seconds at this size (20k took 1.5s, and time
  // quadrupled per doubling), so a 200KB line held a request for minutes.
  for (const unit of ['[', '[a', '![', '[a](b']) {
    const input = unit.repeat(Math.ceil(40000 / unit.length))
    const start = performance.now()
    parseMd(input)
    const ms = performance.now() - start
    assert(ms < 1500, `${JSON.stringify(unit)} x ${input.length / unit.length} took ${Math.round(ms)}ms`)
  }
})

test('ordinary links and images still render, including long labels and urls', () => {
  assert(parseMd('[docs](/a/b "T")').html.includes('<a href="/a/b" title="T">docs</a>'), 'link with title')
  assert(parseMd('![alt](/i.png)').html.includes('<img src="/i.png" alt="alt">'), 'image')
  const label = 'x'.repeat(1500)
  assert(parseMd(`[${label}](/u)`).html.includes(`>${label}</a>`), 'a 1500-character label')
  const url = '/' + 'u'.repeat(3000)
  assert(parseMd(`[a](${url})`).html.includes(`href="${url}"`), 'a 3000-character url')
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
