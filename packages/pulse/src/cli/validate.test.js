/**
 * Pulse — validate.js tests
 * run: node src/cli/validate.test.js
 *
 * This is the shared logic behind both pulse_validate (MCP tool) and
 * `pulse validate` (CLI command) — a real end-to-end test here is the
 * guarantee that a human running the CLI gets the exact same check an
 * agent gets, since both call into this same module.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { validateContent, validateFile, formatValidationResult } from './validate.js'

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-validate-test-'))
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  return root
}

test('a valid spec with no meta.theme passes with a warning', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd' },\n  view: () => '<main id="main-content">x</main>',\n}`
  const result = await validateContent(content, root)
  assert.equal(result.valid, true)
  fs.rmSync(root, { recursive: true, force: true })
})

test('an invalid route (no leading slash) fails validation', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: 'no-slash',\n  view: () => '',\n}`
  const result = await validateContent(content, root)
  assert.equal(result.valid, false)
  assert.match(result.schemaOutput, /must start with "\/"/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('prop-alias check flags nav({ brand }) and suggests logo', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  view: () => nav({ brand: 'Site', links: [] }),\n}`
  const result = await validateContent(content, root)
  assert.equal(result.sourceWarnings.length, 1)
  assert.match(result.sourceWarnings[0], /"brand" is not a recognised prop for nav\(\)/)
  assert.match(result.sourceWarnings[0], /did you mean "logo"/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('prop-alias check does NOT flag autocomplete correctly placed inside attrs', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  view: () => input({ attrs: { autocomplete: 'email' } }),\n}`
  const result = await validateContent(content, root)
  assert.equal(result.sourceWarnings.length, 0,
    `Expected no warnings for the recommended attrs pattern, got: ${JSON.stringify(result.sourceWarnings)}`)
  fs.rmSync(root, { recursive: true, force: true })
})

test('external image host warning fires when unlisted in pulse.config.js CSP', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  view: () => \`<img src="https://images.unsplash.com/photo-1">\`,\n}`
  const result = await validateContent(content, root)
  assert.equal(result.sourceWarnings.length, 1)
  assert.match(result.sourceWarnings[0], /External image host detected \(Unsplash\)/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('external image host warning is suppressed when the bare host is in pulse.config.js', async () => {
  const root = tmpProject()
  fs.writeFileSync(path.join(root, 'pulse.config.js'),
    `export default { csp: { 'img-src': ['images.unsplash.com'] } }`)
  const content = `export default {\n  route: '/x',\n  view: () => \`<img src="https://images.unsplash.com/photo-1">\`,\n}`
  const result = await validateContent(content, root)
  assert.equal(result.sourceWarnings.length, 0,
    `Expected no warning when the bare host is already configured, got: ${JSON.stringify(result.sourceWarnings)}`)
  fs.rmSync(root, { recursive: true, force: true })
})

test('inline <script> warning does NOT fire for external scripts with a src', async () => {
  const root = tmpProject()
  const view = [
    '<script src="/menu.js" defer></script>',
    '<script defer src="/a.js"></script>',
    '<script type="module" src=\'/b.js\'></script>',
  ].join('')
  const content = `export default {\n  route: '/x',\n  view: () => \`<main id="main-content">${view}</main>\`,\n}`
  const result = await validateContent(content, root)
  assert.equal(result.valid, true)
  assert.doesNotMatch(result.schemaOutput, /Inline <script>/,
    `Expected no inline-script warning for external scripts, got: ${result.schemaOutput}`)
  fs.rmSync(root, { recursive: true, force: true })
})

test('inline <script> warning still fires for real inline scripts', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  view: () => \`<main id="main-content"><script>alert(1)</script></main>\`,\n}`
  const result = await validateContent(content, root)
  assert.match(result.schemaOutput, /Inline <script> block detected/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('inline <script> warning still fires when only data-src is present', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  view: () => \`<main id="main-content"><script data-src="/a.js">alert(1)</script></main>\`,\n}`
  const result = await validateContent(content, root)
  assert.match(result.schemaOutput, /Inline <script> block detected/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('validateFile resolves relative imports from the spec\'s own directory', async () => {
  const root = tmpProject()
  fs.mkdirSync(path.join(root, 'src', 'components'), { recursive: true })
  fs.mkdirSync(path.join(root, 'src', 'pages', 'news'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'components', 'layout.js'),
    `export const layout = ({ content }) => content`)
  const specPath = path.join(root, 'src', 'pages', 'news', 'index.js')
  fs.writeFileSync(specPath,
    `import { layout } from '../../components/layout.js'\nexport default {\n  route: '/news',\n  meta: { title: 't', description: 'd' },\n  view: () => layout({ content: '<main id="main-content">news</main>' }),\n}`)
  const result = await validateFile(specPath, root)
  assert.equal(result.valid, true,
    `Expected relative import to resolve from the spec's own directory, got: ${JSON.stringify(result)}`)
  fs.rmSync(root, { recursive: true, force: true })
})

test('validateFile returns an error object for a missing file', async () => {
  const root = tmpProject()
  const result = await validateFile(path.join(root, 'does-not-exist.js'), root)
  assert.match(result.error, /File not found/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatValidationResult with nextSteps: true appends the agent browser-check reminder', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => '<main id="main-content">x</main>',\n}`
  const result = await validateContent(content, root)
  const withNextSteps = formatValidationResult(result, { nextSteps: true })
  const without = formatValidationResult(result, { nextSteps: false })
  assert.match(withNextSteps, /browser check sequence/)
  assert.doesNotMatch(without, /browser check sequence/,
    'CLI output (nextSteps: false, the default) must not carry agent-only framing like "ask the user for design approval"')
  fs.rmSync(root, { recursive: true, force: true })
})

test('formatValidationResult merges source warnings into a clean schema pass', async () => {
  const root = tmpProject()
  const content = `export default {\n  route: '/x',\n  meta: { title: 't', description: 'd', theme: 'dark' },\n  view: () => nav({ brand: 'x', links: [] }),\n}`
  const result = await validateContent(content, root)
  const output = formatValidationResult(result)
  assert.match(output, /Valid ✓ — but fix these issues:/)
  assert.match(output, /did you mean "logo"/)
  fs.rmSync(root, { recursive: true, force: true })
})
