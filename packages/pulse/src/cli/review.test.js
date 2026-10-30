/**
 * Pulse — review.js tests
 * run: node src/cli/review.test.js
 *
 * Shared logic behind pulse_review (MCP tool) and `pulse review` (CLI
 * command). The MCP tool's output talks directly to an agent ("you are now
 * a senior code reviewer") — these tests specifically confirm that framing
 * does NOT leak into the CLI's human-facing output, since that was the main
 * risk in this extraction.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { runQuickReview, formatQuickReview, runFullReview, hasCustomNotFound, formatFullReview } from './review.js'

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-review-test-'))
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  return root
}

function writeSpec(root, name, content) {
  const file = path.join(root, 'src', 'pages', name)
  fs.writeFileSync(file, content)
  return file
}

// ── Quick mode ────────────────────────────────────────────────────────────

test('quick review flags a modalOpen state pattern', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'bad.js',
    `export default {\n  route: '/x',\n  state: { modalOpen: false },\n  view: (state) => \`<main id="main-content">\${state.modalOpen ? 'open' : ''}</main>\`,\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runQuickReview(source, file)
  assert.equal(result.issues.some(i => i.includes('modalOpen')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('quick review flags a hex colour in rendered HTML', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'bad.js',
    `export default {\n  route: '/x',\n  state: {},\n  view: () => '<main id="main-content"><h1 style="color:#ff0000">hi</h1></main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runQuickReview(source, file)
  assert.equal(result.warnings.some(w => w.includes('hex')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('quick review reports no issues for a clean spec', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x',\n  state: {},\n  view: () => '<main id="main-content"><h1>hi</h1></main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runQuickReview(source, file)
  assert.equal(result.issues.length, 0)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatQuickReview agentFacing:true tells the agent to run pulse_validate then /verify', () => {
  const output = formatQuickReview({ issues: [], warnings: [], confirms: [] }, { agentFacing: true })
  assert.match(output, /pulse_validate/)
  assert.match(output, /\/verify/)
})

test('formatQuickReview agentFacing:false (CLI default) uses plain human phrasing', () => {
  const output = formatQuickReview({ issues: [], warnings: [], confirms: [] }, { agentFacing: false })
  assert.match(output, /pulse validate/)
  assert.doesNotMatch(output, /pulse_validate/, 'CLI output must not reference the MCP tool name pulse_validate')
  assert.doesNotMatch(output, /\/verify/, 'CLI output must not reference the /verify slash command')
})

// ── Full mode ─────────────────────────────────────────────────────────────

test('full review runs the schema validator and reports auto-checks', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => '<main id="main-content"><h1>hi</h1></main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runFullReview(source, file)
  assert.match(result.validationResult, /Valid ✓/)
  assert.equal(result.autoChecks.length > 0, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('full review auto-checks flag modalOpen and malformed _storeUpdate', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'bad.js',
    `export default {\n  route: '/x',\n  state: { modalOpen: false },\n  actions: {\n    save: {\n      onSuccess: (state) => ({ _storeUpdate: true }),\n      onError: (state, err) => ({ error: err.message }),\n      run: async () => {},\n    },\n  },\n  view: () => '<main id="main-content">x</main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runFullReview(source, file)
  assert.equal(result.autoChecks.some(c => c.includes('modalOpen')), true)
  assert.equal(result.autoChecks.some(c => c.includes('_storeUpdate')), true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatFullReview agentFacing:true opens with "you are now a senior code reviewer"', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => '<main id="main-content">x</main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runFullReview(source, file)
  const output = formatFullReview(result, { source, file, agentFacing: true })
  assert.match(output, /you are now a \*\*senior code reviewer\*\*/i)
  assert.match(output, /Continue to the verification workflow/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatFullReview agentFacing:false (CLI default) never says "you are now a reviewer" or references agent-only workflow', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => '<main id="main-content">x</main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runFullReview(source, file)
  const output = formatFullReview(result, { source, file, agentFacing: false })
  assert.doesNotMatch(output, /you are now a/i,
    'CLI output must not carry the agent-directive "you are now a reviewer" framing')
  assert.doesNotMatch(output, /Continue to the verification workflow/,
    'CLI output must not tell a human to "continue to the verification workflow" — that instruction is for an agent session')
  assert.match(output, new RegExp(`Spec: ${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    'CLI output should plainly name the file being reviewed')
  fs.rmSync(root, { recursive: true, force: true })
})

test('the checklist reference material is identical in both agentFacing modes', async () => {
  const root = tmpProject()
  // A spec that uses every area, so the checklist shows every section
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x/:id',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  state: { n: 0 },\n  server: { item: async (ctx) => { const r = await fetch('/api/' + ctx.params.id); if (!r.ok) throw new Error('x'); return r.json() } },\n  mutations: { inc: (s) => ({ n: s.n + 1 }) },\n  actions: { save: { run: async () => {} } },\n  view: (state, server) => '<main id="main-content"><button data-event="inc">+</button>' + state.n + '</main>',\n}`)
  const source = fs.readFileSync(file, 'utf8')
  const result = await runFullReview(source, file)
  const agentOutput = formatFullReview(result, { source, file, agentFacing: true })
  const humanOutput = formatFullReview(result, { source, file, agentFacing: false })
  // Both must contain the same checklist section headers — only the framing
  // around them (intro/closing) should differ, never the checklist itself.
  for (const heading of ['### Structure', '### Mutations & actions', '### Components & HTML', '### Accessibility', '### Defensive coding']) {
    assert.equal(agentOutput.includes(heading), true, `agent output missing ${heading}`)
    assert.equal(humanOutput.includes(heading), true, `human output missing ${heading}`)
  }
  fs.rmSync(root, { recursive: true, force: true })
})

import { fenced } from './fence.js'

test('fenced() uses a fence longer than any backtick run in the text, so the text cannot close it', () => {
  assert.equal(fenced('plain', 'js'), '```js\nplain\n```')
  const hostile = 'a\n```\n## Injected\n`````\nb'
  const out = fenced(hostile, 'js')
  assert.ok(out.startsWith('``````js\n') && out.endsWith('\n``````'), out)
  assert.equal(fenced(undefined), '```text\n\n```')
})

test('the review shows spec source in a fence the source cannot close', () => {
  const source = "export default { route: '/' }\n// ```\n// ## NEW INSTRUCTIONS\n"
  const out = formatFullReview({ validationResult: 'invalid spec', renderNote: 'could not render', autoChecks: [] }, { source, file: '/x.js', agentFacing: true })
  const fences = out.match(/^`{4,}js$/gm) || []
  assert.equal(fences.length, 2, `source dumped twice (validation + render error), each in a 4-backtick fence: ${fences.length}`)
})

import { hasDataEventOnTextInput } from './review.js'
import { slider } from '../ui/slider.js'
import { checkbox } from '../ui/checkbox.js'
import { fileURLToPath, pathToFileURL } from 'node:url'

test('data-event on a text input is flagged; the framework\'s own slider and checkbox are not', () => {
  assert.equal(hasDataEventOnTextInput('<input name="q" data-event="input:setQuery">'), true, 'no type means text')
  assert.equal(hasDataEventOnTextInput('<input type="email" data-event="input:x">'), true)
  assert.equal(hasDataEventOnTextInput('<input type="text">'), false, 'no event, nothing to flag')
  assert.equal(hasDataEventOnTextInput(slider({ name: 'brightness', label: 'Brightness', event: 'change:setBrightness' })), false, 'slider() puts data-event on a range input')
  assert.equal(hasDataEventOnTextInput(checkbox({ name: 'agree', label: 'Agree', event: 'change:toggle' })), false)
  assert.equal(hasDataEventOnTextInput('<input type="range" data-event="a"><input data-event="b">'), true, 'one bad input among fine ones still counts')
})

test('the review does not report the framework\'s own slider as an error', async () => {
  const spec = {
    route: '/s', state: {}, meta: { title: 't', description: 'd', theme: 'light' },
    view: () => `<main id="main-content">${slider({ name: 'brightness', label: 'Brightness', event: 'change:setBrightness' })}</main>`,
  }
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-slider-')), 'slider.js')
  fs.writeFileSync(file, `import { slider } from ${JSON.stringify(pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../ui/slider.js')).href)}
export default { route: '/s', state: {}, meta: { title: 't', description: 'd', theme: 'light' }, view: () => '<main id="main-content">' + slider({ name: 'brightness', label: 'Brightness', event: 'change:setBrightness' }) + '</main>' }\n`)
  const result = await runFullReview(fs.readFileSync(file, 'utf8'), file)
  const out = formatFullReview(result, { source: fs.readFileSync(file, 'utf8'), file, agentFacing: true })
  assert.ok(!out.includes('data-event on <input>'), 'the slider must not trigger the focus-loss error')
  fs.rmSync(path.dirname(file), { recursive: true, force: true })
})

// ── Mechanical checks added from a real /verify run ───────────────────────

const STATIC_PAGE = (extra = '') => `export default {
  route: '/about',
  meta: { title: 'About', description: 'A real sentence about what this page is and who it is for.' },
  ${extra}
  view: () => '<main id="main-content"><h1>About</h1></main>',
}`

async function checksFor(source, { withTest = '' } = {}) {
  const root = tmpProject()
  const file = writeSpec(root, 'page.js', source)
  if (withTest) fs.writeFileSync(file.replace(/\.js$/, '.test.js'), withTest)
  const { autoChecks } = await runFullReview(source, file).catch(() => ({ autoChecks: [] }))
  fs.rmSync(root, { recursive: true, force: true })
  return autoChecks
}

test('a static page whose view takes no input is not asked for an XSS test', async () => {
  const checks = await checksFor(STATIC_PAGE(), { withTest: "import test from 'node:test'" })
  assert.equal(checks.some(c => c.includes('No XSS test found')), false)
  assert.equal(checks.some(c => c.includes('XSS test not applicable')), true)
})

test('a page with server data is still asked for an XSS test', async () => {
  const src = STATIC_PAGE("server: { items: async () => [] },")
  const checks = await checksFor(src, { withTest: "import test from 'node:test'" })
  assert.equal(checks.some(c => c.includes('No XSS test found')), true)
})

test('a view that takes state is still asked for an XSS test', async () => {
  const src = `export default {\n  route: '/x',\n  state: { n: 1 },\n  view: (state) => '<main id="main-content">' + state.n + '</main>',\n}`
  const checks = await checksFor(src, { withTest: "import test from 'node:test'" })
  assert.equal(checks.some(c => c.includes('No XSS test found')), true)
})

test('review flags hydrate set by hand', async () => {
  const checks = await checksFor(STATIC_PAGE("hydrate: '/x.js',"))
  assert.equal(checks.some(c => c.startsWith('✗') && c.includes('`hydrate` set')), true)
})

test('review flags a placeholder or very short meta.description', async () => {
  const checks = await checksFor(STATIC_PAGE().replace(/description: '[^']*'/, "description: 'Built with Pulse'"))
  assert.equal(checks.some(c => c.includes('placeholder or very short')), true)
})

test('review flags raw response text thrown into an error, and .json() without .ok', async () => {
  const src = `export default {\n  route: '/x',\n  state: {},\n  actions: { go: { run: async () => { const res = await fetch('/api'); if (!res) throw new Error(await res.text()); return res.json() } } },\n  view: () => '<main id="main-content"></main>',\n}`
  const checks = await checksFor(src)
  assert.equal(checks.some(c => c.includes('res.text()')), true)
  assert.equal(checks.some(c => c.includes('`.ok` is never checked')), true)
})

test('review flags generic link text', async () => {
  const src = STATIC_PAGE().replace('<h1>About</h1>', '<a href="/x">click here</a>')
  const checks = await checksFor(src)
  assert.equal(checks.some(c => c.includes('Generic link text')), true)
})

// ── The checklist shows only what can apply ───────────────────────────────

import { relevantChecklist } from './review.js'

const STATIC = `export default {\n  route: '/about',\n  meta: { title: 'About', description: 'A real sentence about this page.' },\n  view: () => '<main id="main-content"><h1>About</h1><p>text</p></main>',\n}`

const FULL = `export default {
  route: '/items/:id',
  state: { n: 0 },
  server: { item: async (ctx) => { const r = await fetch('/api/' + ctx.params.id); if (!r.ok) throw new Error('x'); return r.json() } },
  mutations: { inc: (s) => ({ n: s.n + 1 }) },
  actions: { save: { onStart: () => ({}), run: async () => {} } },
  view: (state, server) => '<main id="main-content"><button data-event="inc" disabled>+</button><input name="q"><a href="/x">Items</a></main>',
}`

test('a static page is not shown the mutation, action, fetch or ARIA-state items', () => {
  const { md } = relevantChecklist(STATIC, '<main id="main-content"><h1>About</h1><p>text</p></main>')
  for (const gone of ['Every mutation returns', 'Actions read user input', 'Any `fetch`', '**State**', '**Tab order**', '`onViewError` defined']) {
    assert.equal(md.includes(gone), false, `should not show: ${gone}`)
  }
  assert.equal(md.includes('### Mutations & actions'), false, 'an empty section is dropped with its heading')
  assert.equal(md.includes('### Defensive coding'), false)
  for (const kept of ['### Structure', '`meta.description` is a real description', 'Heading hierarchy is correct', '`<main id="main-content">` is present']) {
    assert.equal(md.includes(kept), true, `must keep: ${kept}`)
  }
})

test('a page that uses every area keeps every item', () => {
  const { md, skipped } = relevantChecklist(FULL, '<main><button data-event="inc" disabled>+</button><input name="q"><a href="/x">Items</a></main>')
  for (const shown of ['Every mutation returns', 'Actions read user input', 'Any `fetch`', '**State**', '**Tab order**', 'Optional chaining used', 'URL params validated', '`onViewError` defined', 'No `data-event` on text inputs', '**Keyboard focusability**']) {
    assert.equal(md.includes(shown), true, `should show: ${shown}`)
  }
  assert.deepEqual(skipped.map(s => s.skip), ['no CTA', 'no `aria-live`'].filter(r => skipped.some(s => s.skip === r)))
})

test('the skipped items are named with the reason, so an agent can overrule a wrong one', async () => {
  const root = tmpProject()
  const file = writeSpec(root, 'static.js', STATIC)
  const result = await runFullReview(STATIC, file)
  const out = formatFullReview(result, { source: STATIC, file, agentFacing: true })
  assert.match(out, /Not shown, because they cannot apply to this spec/)
  assert.match(out, /- no `mutations`: mutation purity, constraints, disabled vs bounds/)
  assert.match(out, /If one of those reasons is wrong for this spec, work through the item anyway/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('every applicability rule matches a real checklist item, so a reworded item or a typo is caught', () => {
  // A rule only skips an item it matched. If every rule skips on a static page, each one found its item.
  // If a spec that has everything skips nothing, each rule's "applies" test can be satisfied.
  const { skipped } = relevantChecklist(STATIC, '')
  const labels = skipped.flatMap(s => s.labels)
  assert.equal(labels.length, 20, `20 rules skip on a static page, got ${labels.length}: ${labels.join(', ')}`)

  const kitchenSink = `export default {
    route: '/items/:id',
    server: { item: async (ctx) => { const r = await fetch('/api/' + ctx.params.id); if (!r.ok) throw new Error('x'); return r.json() } },
    mutations: { inc: (s) => s },
    actions: { save: { onStart: () => ({}), run: async () => {} } },
    view: (state, server) => '<main id="main-content"></main>',
  }`
  const html = '<main><button data-event="inc" disabled>+</button><input name="q"><a href="/x">Items</a><div class="ui-cta" aria-live="polite"></div></main>'
  const all = relevantChecklist(kitchenSink, html)
  assert.deepEqual(all.skipped, [], `a spec with everything skips nothing, but skipped: ${JSON.stringify(all.skipped)}`)
})

test('the static page checklist is far shorter than the full one', () => {
  const short = relevantChecklist(STATIC, '').md.split(/\s+/).length
  const long  = relevantChecklist(FULL, '<button data-event="x" disabled></button><input><a href="/"></a>').md.split(/\s+/).length
  assert.ok(short < long * 0.5, `static ${short} words, full ${long} words`)
})

test('generic link text is found inside a wrapping tag, and a longer text is not flagged', async () => {
  const wrapped = await checksFor(STATIC_PAGE().replace('<h1>About</h1>', '<a href="/x"><span>Read more</span></a>'))
  assert.equal(wrapped.some(c => c.includes('Generic link text "read more"')), true)
  const fine = await checksFor(STATIC_PAGE().replace('<h1>About</h1>', '<a href="/x">Read more about our pricing</a>'))
  assert.equal(fine.some(c => c.includes('Generic link text')), false)
})

// ── Acceptance criteria in the review ─────────────────────────────────────

async function acceptanceCheck({ spec, criteria, tests }) {
  const root = tmpProject()
  const file = writeSpec(root, 'page.js', spec)
  if (criteria !== undefined) fs.writeFileSync(file.replace(/\.js$/, '.acceptance.md'), criteria)
  if (tests !== undefined) fs.writeFileSync(file.replace(/\.js$/, '.test.js'), tests)
  const { autoChecks } = await runFullReview(spec, file)
  fs.rmSync(root, { recursive: true, force: true })
  return autoChecks.find(c => /cceptance criteria/.test(c))
}

const WITH_ACTIONS = `export default {\n  route: '/x',\n  state: {},\n  actions: { go: { run: async () => {} } },\n  view: (state) => '<main id="main-content">' + state + '</main>',\n}`

test('review warns that a page with behaviour has no acceptance criteria', async () => {
  const c = await acceptanceCheck({ spec: WITH_ACTIONS })
  assert.match(c, /^⚠ \*\*No acceptance criteria\*\*/)
  assert.match(c, /page\.acceptance\.md/)
})

test('review does not ask a static page for acceptance criteria', async () => {
  const c = await acceptanceCheck({ spec: STATIC_PAGE() })
  assert.match(c, /^○ No acceptance criteria file \(optional for a static page\)/)
})

test('review fails a criterion no test names, and passes when every one is named', async () => {
  const open = await acceptanceCheck({ spec: WITH_ACTIONS, criteria: '- AC1: a\n- AC2: b\n', tests: "test('AC1 — a', () => {})" })
  assert.match(open, /^✗ \*\*Acceptance criteria not met\*\*.*no test names AC2/)
  const met = await acceptanceCheck({ spec: WITH_ACTIONS, criteria: '- AC1: a\n- AC2: b\n', tests: "test('AC1 — a', () => {})\ntest('AC2 — b', () => {})" })
  assert.match(met, /^✓ Acceptance criteria: 2, each named by a test/)
})

test('review fails a criterion that restates Lighthouse, LCP or CLS', async () => {
  const c = await acceptanceCheck({ spec: WITH_ACTIONS, criteria: '- AC1: a\n- AC2: CLS is 0.00 on mobile.\n', tests: "test('AC1 — a', () => {})" })
  assert.match(c, /^✗ \*\*Acceptance criteria not met\*\*.*AC2 restates a check that \/verify already makes/)
  assert.doesNotMatch(c, /no test names/)
})

// ── alert({ content }) is not escaped ─────────────────────────────────────

async function alertCheck(viewBody) {
  const root = tmpProject()
  const spec = `import { alert } from '@invisibleloop/pulse/ui'\nexport default {\n  route: '/x',\n  state: {},\n  view: (state, server) => \`<main id="main-content">${viewBody}</main>\`,\n}`
  const file = writeSpec(root, 'page.js', spec)
  const { autoChecks } = await runFullReview(spec, file)
  fs.rmSync(root, { recursive: true, force: true })
  return autoChecks.find(c => /alert\(\{ content \}\)/.test(c))
}

test('review warns when alert() puts a variable or an interpolated string in content', async () => {
  const c1 = await alertCheck("${alert({ variant: 'error', content: server.error })}")
  assert.match(c1, /^⚠ \*\*`alert\(\{ content \}\)` is not escaped\*\*/)
  assert.match(c1, /use `message`/)
  assert.ok(await alertCheck("${alert({ variant: 'error', content: `Failed: ${server.error}` })}"))
})

test('review does not warn for alert() with message, or a fixed string in content', async () => {
  assert.equal(await alertCheck("${alert({ variant: 'error', message: server.error })}"), undefined)
  assert.equal(await alertCheck("${alert({ variant: 'info', content: 'Your changes have been saved.' })}"), undefined)
  assert.equal(await alertCheck("${alert({ variant: 'info', content: '<a href=\"/help\">Help</a>' })}"), undefined)
})


// ── custom 404 page ────────────────────────────────────────────────────────

async function notFoundCheck(otherPages) {
  const root = tmpProject()
  const spec = `export default {\n  route: '/x',\n  view: () => '<main id="main-content"><h1>X</h1></main>',\n}`
  const file = writeSpec(root, 'page.js', spec)
  for (const [name, body] of Object.entries(otherPages)) writeSpec(root, name, body)
  const { autoChecks } = await runFullReview(spec, file)
  fs.rmSync(root, { recursive: true, force: true })
  return autoChecks.find(c => /custom 404/.test(c))
}

test('review warns when no spec in the pages folder has route: "*"', async () => {
  const c = await notFoundCheck({ 'home.js': "export default { route: '/', view: () => '<main id=\"main-content\"></main>' }" })
  assert.match(c, /^⚠ \*\*No custom 404 page\*\*/)
  assert.match(c, /route: '\*'/)
})

test('review is silent when a sibling spec is the 404 page, or the page under review is', async () => {
  assert.equal(await notFoundCheck({ 'not-found.js': "export default { route: '*', view: () => '<main id=\"main-content\"></main>' }" }), undefined)
  assert.equal(hasCustomNotFound("export default { route: \"*\", view: () => '' }", null), true)
  assert.equal(hasCustomNotFound("export default { route: '/' }", null), null, 'no file: cannot tell')
})
