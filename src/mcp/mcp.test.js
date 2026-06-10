/**
 * MCP integrity tests — run with: node src/mcp/mcp.test.js
 *
 * Guards against guide file drift: every guide-*.md file under src/agent/
 * must be registered as a named MCP resource in server.js, and every
 * readFileSync call in server.js that references a guide-*.md must point
 * to a file that actually exists.
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')

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

// ── Read source files ────────────────────────────────────────────────────────

const serverSrc = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8')
const agentDir  = path.join(ROOT, 'src/agent')

// All guide-*.md files that exist on disk
const guideFiles = fs.readdirSync(agentDir)
  .filter(f => f.startsWith('guide-') && f.endsWith('.md'))
  .sort()

// All guide-*.md files referenced via readFileSync in server.js
// Pattern: new URL('../agent/guide-*.md', import.meta.url)
const referencedFiles = [...serverSrc.matchAll(/new URL\(['"`][^'"`]*?(guide-[^'"`/]+\.md)['"`]/g)]
  .map(m => m[1])

// All guide-*.md filenames registered as MCP resource URIs
const registeredUris = [...serverSrc.matchAll(/uri:\s*['"`](pulse:\/\/guide\/[^'"`]+)['"`]/g)]
  .map(m => m[1])

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nGuide file coverage\n')

test('guide-routing.md exists on disk', () => {
  assert(fs.existsSync(path.join(agentDir, 'guide-routing.md')), 'guide-routing.md not found')
})

test('guide-components.md exists on disk', () => {
  assert(fs.existsSync(path.join(agentDir, 'guide-components.md')), 'guide-components.md not found')
})

for (const file of guideFiles) {
  test(`${file} is referenced by readFileSync in server.js`, () => {
    assert(
      referencedFiles.includes(file),
      `${file} exists in src/agent/ but is not loaded by server.js via readFileSync. ` +
      `Either register it as a guide resource or delete it.`
    )
  })
}

for (const file of referencedFiles) {
  test(`${file} (referenced in server.js) exists on disk`, () => {
    assert(
      fs.existsSync(path.join(agentDir, file)),
      `server.js references ${file} via readFileSync but the file does not exist in src/agent/`
    )
  })
}

test('every guide-*.md on disk has a corresponding pulse://guide/* MCP resource', () => {
  // Map file names to expected URI slugs: guide-design-references.md → pulse://guide/design-references
  const fileToUri = (f) => 'pulse://guide/' + f.replace(/^guide-/, '').replace(/\.md$/, '')
  const missing = guideFiles.filter(f => !registeredUris.includes(fileToUri(f)))
  assert(
    missing.length === 0,
    `These guide files have no registered MCP resource URI:\n    ${missing.join('\n    ')}\n` +
    `Add them to GUIDE_RESOURCES in server.js or delete them.`
  )
})

test('no orphaned guide.md (monolithic legacy file should not exist)', () => {
  assert(
    !fs.existsSync(path.join(agentDir, 'guide.md')),
    'guide.md exists in src/agent/ — this is the old monolithic guide and should be deleted. ' +
    'Content should live in the split guide-*.md files.'
  )
})

// ── Duplicated doc sync ──────────────────────────────────────────────────────
// Several agent docs exist in two places (a canonical source plus a copy that is
// scaffolded into consumer projects or kept in this repo's own .claude/). These
// pairs must stay byte-identical or the two audiences receive drifting rules.

console.log('\nDuplicated doc sync\n')

const SYNC_PAIRS = [
  ['src/agent/checklist.md',        '.claude/pulse-checklist.md'],
  ['src/agent/checklist.md',        'docs/.claude/pulse-checklist.md'],
  ['src/agent/checklist.md',        'examples/.claude/pulse-checklist.md'],
  ['src/agent/commands/verify.md',  '.claude/commands/verify.md'],
]

for (const [a, b] of SYNC_PAIRS) {
  test(`${a} is in sync with ${b}`, () => {
    const fa = path.join(ROOT, a)
    const fb = path.join(ROOT, b)
    assert(fs.existsSync(fa), `${a} does not exist`)
    assert(fs.existsSync(fb), `${b} does not exist`)
    assert(
      fs.readFileSync(fa, 'utf8') === fs.readFileSync(fb, 'utf8'),
      `${a} and ${b} have drifted apart. Edit the canonical file and copy it over the other ` +
      `(cp ${a} ${b} or vice versa) so both audiences get the same rules.`
    )
  })
}

// ── Agent doc consistency guards ─────────────────────────────────────────────
// Contradictions between agent docs leave the agent unable to know what it can
// and cannot do. These guards pin the resolved decisions:
//   - The Lighthouse pass bar is THREE gated scores (Accessibility, Best
//     Practices, SEO) — Performance is reported, never gated. "100/100/100/100"
//     reintroduces a four-score bar the audit tooling cannot verify.
//   - "ask_user" is not a real tool in any host — docs must not name it.
//   - Emoji are banned in UI output — design guides must not suggest them.

console.log('\nAgent doc consistency\n')

const agentDocs = [
  ...fs.readdirSync(agentDir).filter(f => f.endsWith('.md')).map(f => path.join('src/agent', f)),
  ...fs.readdirSync(path.join(agentDir, 'commands')).filter(f => f.endsWith('.md')).map(f => path.join('src/agent/commands', f)),
  ...fs.readdirSync(path.join(agentDir, 'skills')).flatMap(d => {
    const p = path.join(agentDir, 'skills', d, 'SKILL.md')
    return fs.existsSync(p) ? [path.join('src/agent/skills', d, 'SKILL.md')] : []
  }),
  '.claude/commands/build-page.md',
  '.claude/commands/verify.md',
  '.claude/commands/new-doc-page.md',
  'CLAUDE.md',
]

test('no agent doc states a four-score Lighthouse bar (100/100/100/100)', () => {
  const offenders = agentDocs.filter(f =>
    fs.existsSync(path.join(ROOT, f)) &&
    fs.readFileSync(path.join(ROOT, f), 'utf8').includes('100/100/100/100')
  )
  if (serverSrc.includes('100/100/100/100')) offenders.push('src/mcp/server.js')
  assert(
    offenders.length === 0,
    `Four-score Lighthouse bar found in: ${offenders.join(', ')}. ` +
    `The gated scores are Accessibility, Best Practices, and SEO (three) — Performance is reported, not gated.`
  )
})

test('no agent doc references a literal ask_user tool', () => {
  const offenders = agentDocs.filter(f =>
    fs.existsSync(path.join(ROOT, f)) &&
    /\bask_user\b/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
  )
  assert(
    offenders.length === 0,
    `"ask_user" referenced in: ${offenders.join(', ')}. ` +
    `No host exposes a tool by that name — phrase host-agnostically (e.g. "your host's question tool").`
  )
})

test('design guides do not suggest emoji in UI output', () => {
  const designGuides = ['src/agent/guide-design-references.md', 'src/agent/guide-design-gallery.md']
  const offenders = designGuides.filter(f => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8')
    // Allow lines that mention emoji only to ban them; flag lines that suggest using them
    return src.split('\n').some(line =>
      /emoji/i.test(line) && !/never|not |banned|instead of emoji/i.test(line)
    )
  })
  assert(
    offenders.length === 0,
    `Emoji suggested (without a ban qualifier) in: ${offenders.join(', ')}. ` +
    `Emoji are banned in UI output (identity.md) — suggest icon-library glyphs instead.`
  )
})

test('workflow.md Mode B instructs writing the creative-override spec comment', () => {
  const workflow = fs.readFileSync(path.join(agentDir, 'workflow.md'), 'utf8')
  assert(
    /component.free — creative override/.test(workflow),
    'workflow.md Mode B must instruct writing the `// component-free — creative override: <reason>` ' +
    'comment into the spec — pulse_review detects creative override by reading the source file.'
  )
})

test('identity.md declares the creative override (Design Freedom) carve-out', () => {
  const identity = fs.readFileSync(path.join(agentDir, 'identity.md'), 'utf8')
  assert(
    /creative override/i.test(identity),
    'identity.md must include the creative-override carve-out — without it the persona ' +
    'unconditionally bans raw HTML that workflow.md Mode B explicitly permits.'
  )
})

// ── Result ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
