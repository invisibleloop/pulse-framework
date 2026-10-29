/**
 * What the guides, the project instructions and the docs say exists, does exist.
 * Run with: node scripts/docs-drift.test.js
 *
 * An agent follows these files literally. A guide that documents `segmented()` or `phoneFrame()`
 * after they were removed sends it into an error it then has to debug, and no other check reads
 * prose. So: every name imported from a `@invisibleloop/pulse/...` entry point in any guide, in
 * CLAUDE.md, the README or a docs page must be a real export of that entry point, the components
 * once removed must not come back in as calls or table rows, and the token names must be the
 * real ones.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import path     from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PKG  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(PKG, '..', '..')
const pkg  = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'))

function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, filter, out) }
    else if (filter(p)) out.push(p)
  }
  return out
}

/** Files an agent or a reader takes as the truth about the API. */
function sources() {
  const files = [
    ...walk(path.join(PKG, 'src', 'agent'), p => p.endsWith('.md')),
    path.join(REPO, 'CLAUDE.md'),
    path.join(PKG, 'README.md'),
    path.join(REPO, 'README.md'),
    ...walk(path.join(REPO, 'docs', 'src', 'pages'), p => p.endsWith('.js')),
  ]
  return files.filter(f => fs.existsSync(f)).map(f => ({ file: path.relative(REPO, f), text: fs.readFileSync(f, 'utf8') }))
}

async function exportsOf(specifier) {
  const sub = specifier === '@invisibleloop/pulse' ? '.' : './' + specifier.slice('@invisibleloop/pulse/'.length)
  const entry = pkg.exports[sub]
  if (!entry) return null
  const target = typeof entry === 'string' ? entry : entry.default
  return new Set(Object.keys(await import(pathToFileURL(path.join(PKG, target)).href)))
}

test('every name imported from a @invisibleloop/pulse entry point in the guides, CLAUDE.md and docs is a real export', async () => {
  const cache = new Map()
  const problems = []
  const importRe = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"](@invisibleloop\/pulse(?:\/[\w-]+)?)['"]/g
  for (const { file, text } of sources()) {
    for (const m of text.matchAll(importRe)) {
      const specifier = m[2]
      if (!cache.has(specifier)) cache.set(specifier, await exportsOf(specifier))
      const real = cache.get(specifier)
      if (!real) { problems.push(`${file}: imports from ${specifier}, which package.json does not export`); continue }
      for (const raw of m[1].split(',')) {
        const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
        if (name && !real.has(name)) problems.push(`${file}: \`${name}\` is not exported by ${specifier}`)
      }
    }
  }
  assert.deepEqual(problems, [], '\n' + problems.join('\n'))
})

test('components that were removed do not come back in the guides as calls or table rows', () => {
  // Removed in 33938bf ("remove low-utility components"). `fieldset` and `search` are also ordinary
  // HTML words, so only calls and component-table rows count for those.
  const REMOVED = ['segmented', 'search', 'fieldset', 'phoneFrame', 'tooltip']
  const callRe = new RegExp(`(?:\\$\\{|\\b)(${REMOVED.join('|')})\\(\\{?`)
  const rowRe  = new RegExp('^\\|\\s*`(' + REMOVED.join('|') + ')`\\s*\\|', 'm')
  const problems = []
  for (const { file, text } of sources().filter(s => s.file.includes('agent') || s.file === 'CLAUDE.md')) {
    if (callRe.test(text)) problems.push(`${file}: calls a removed component (${text.match(callRe)[1]})`)
    if (rowRe.test(text))  problems.push(`${file}: documents a removed component in a table row (${text.match(rowRe)[1]})`)
    for (const line of text.split('\n')) {
      if (/`(phoneFrame|segmented)`/.test(line) && !/no `phoneFrame` component/.test(line)) problems.push(`${file}: mentions a removed component: ${line.trim().slice(0, 90)}`)
    }
  }
  assert.deepEqual(problems, [], '\n' + problems.join('\n'))
})

test('--color-accent and --color-bg are not presented as tokens to set (the input tokens are --accent and --bg; components read --ui-*)', () => {
  const problems = []
  const files = [...sources().filter(s => s.file.includes('agent') || s.file === 'CLAUDE.md'),
                 { file: 'packages/pulse/src/cli/scaffold.js', text: fs.readFileSync(path.join(PKG, 'src', 'cli', 'scaffold.js'), 'utf8') }]
  for (const { file, text } of files) {
    for (const line of text.split('\n')) {
      if (/--color-(accent|bg)\b/.test(line) && !/mistake|do NOT exist|never|not\b/i.test(line)) problems.push(`${file}: ${line.trim().slice(0, 100)}`)
    }
  }
  assert.deepEqual(problems, [], '\n' + problems.join('\n'))
})

test('pulse-ui.css has no styles for components that no longer exist', () => {
  // Every .ui-<family> in the stylesheet must be used by a component or by pulse-ui.js. It shipped
  // rules for five removed components (and a long-gone code window) in every project's public/.
  // Utilities that are meant to be used directly, with no component, are listed here on purpose.
  const UTILITY_FAMILIES = new Set(['sr'])   // .ui-sr-only: visually hidden text, documented in the stylesheet
  const css = fs.readFileSync(path.join(PKG, 'public', 'pulse-ui.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const families = [...new Set([...css.matchAll(/\.ui-([a-z0-9]+)/g)].map(m => m[1]))]
  const code = [
    ...walk(path.join(PKG, 'src'), p => p.endsWith('.js') && !p.endsWith('.test.js')),
    path.join(PKG, 'public', 'pulse-ui.js'),
  ].map(f => fs.readFileSync(f, 'utf8')).join('\n')
  const dead = families.filter(f => !UTILITY_FAMILIES.has(f) && !new RegExp(`ui-${f}(?![a-z0-9])`).test(code))
  assert.deepEqual(dead, [], `no component or script uses .ui-${dead.join(', .ui-')}: remove the styles, or list a deliberate utility in UTILITY_FAMILIES`)
})

test('every copy of pulse-ui.css in the repository is the package\'s', () => {
  const canonical = fs.readFileSync(path.join(PKG, 'public', 'pulse-ui.css'), 'utf8')
  for (const dir of ['', 'docs', 'examples', 'companion']) {
    const copy = path.join(REPO, dir, 'public', 'pulse-ui.css')
    if (!fs.existsSync(copy)) continue
    assert.equal(fs.readFileSync(copy, 'utf8'), canonical, `${path.relative(REPO, copy)} differs from packages/pulse/public/pulse-ui.css (copy it over)`)
  }
})
