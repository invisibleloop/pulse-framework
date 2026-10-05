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
import { runQuickReview, formatQuickReview, runFullReview, formatFullReview } from './review.js'

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
  const file = writeSpec(root, 'good.js',
    `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => '<main id="main-content">x</main>',\n}`)
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
