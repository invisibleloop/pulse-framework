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
import { execFileSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Package root (packages/pulse/) — canonical source for src/agent/*.
const ROOT      = path.resolve(__dirname, '../..')
// Repo root (pulse2/) — where distributed copies live: .claude/, docs/,
// examples/, CLAUDE.md. Package root moved into packages/pulse/ when the
// framework became a workspace member; these distributed-copy targets did
// not move, so they need one extra level up from the package root.
const REPO_ROOT = path.resolve(ROOT, '..', '..')

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
// validateContent's real logic — extracted from server.js into cli/validate.js
// so `pulse validate` (CLI) and pulse_validate (MCP) share one implementation.
const validateSrc = fs.readFileSync(path.join(ROOT, 'src/cli/validate.js'), 'utf8')
// checkBundles' real logic — extracted into cli/check-bundles.js so
// `pulse check-bundles` (CLI) and pulse_check_bundles (MCP) share one implementation.
const checkBundlesSrc = fs.readFileSync(path.join(ROOT, 'src/cli/check-bundles.js'), 'utf8')
// pulse_review's real logic — extracted into cli/review.js so `pulse review`
// (CLI) and pulse_review (MCP) share one implementation.
const reviewSrc = fs.readFileSync(path.join(ROOT, 'src/cli/review.js'), 'utf8')
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
  ['src/agent/commands/verify.md',  'docs/.claude/commands/verify.md'],
  ['src/agent/commands/verify.md',  'examples/.claude/commands/verify.md'],
  ['src/agent/coverage-check.js',   'docs/.claude/coverage-check.js'],
  ['src/agent/coverage-check.js',   'examples/.claude/coverage-check.js'],
]

for (const [a, b] of SYNC_PAIRS) {
  test(`${a} is in sync with ${b}`, () => {
    const fa = path.join(ROOT, a)       // canonical source — package-relative
    const fb = path.join(REPO_ROOT, b)  // distributed copy — repo-root-relative
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

// Each entry is resolved against ROOT (package root) or REPO_ROOT (repo
// root) depending on where it actually lives — see the ROOT/REPO_ROOT
// comment above. Package-relative entries carry their own root so callers
// don't have to guess which base a given path needs.
const agentDocs = [
  ...fs.readdirSync(agentDir).filter(f => f.endsWith('.md')).map(f => ({ root: ROOT, file: path.join('src/agent', f) })),
  ...fs.readdirSync(path.join(agentDir, 'commands')).filter(f => f.endsWith('.md')).map(f => ({ root: ROOT, file: path.join('src/agent/commands', f) })),
  ...fs.readdirSync(path.join(agentDir, 'skills')).flatMap(d => {
    const p = path.join(agentDir, 'skills', d, 'SKILL.md')
    return fs.existsSync(p) ? [{ root: ROOT, file: path.join('src/agent/skills', d, 'SKILL.md') }] : []
  }),
  { root: REPO_ROOT, file: '.claude/commands/build-page.md' },
  { root: REPO_ROOT, file: '.claude/commands/verify.md' },
  { root: REPO_ROOT, file: '.claude/commands/new-doc-page.md' },
  { root: REPO_ROOT, file: 'CLAUDE.md' },
  { root: REPO_ROOT, file: 'README.md' },
]

test('no agent doc states a four-score Lighthouse bar (100/100/100/100)', () => {
  const fourScore = (src) =>
    src.includes('100/100/100/100') ||
    /all four (scores|categories)/i.test(src) ||
    /Accessibility, Best Practices, SEO,? and Performance[^.\n]*must (all )?be 100/i.test(src)
  const offenders = agentDocs.filter(({ root, file }) =>
    fs.existsSync(path.join(root, file)) &&
    fourScore(fs.readFileSync(path.join(root, file), 'utf8'))
  ).map(({ file }) => file)
  if (fourScore(serverSrc)) offenders.push('src/mcp/server.js')
  assert(
    offenders.length === 0,
    `Four-score Lighthouse bar found in: ${offenders.join(', ')}. ` +
    `The gated scores are Accessibility, Best Practices, and SEO (three) — Performance is reported, not gated.`
  )
})

test('no agent doc references a literal ask_user tool', () => {
  const offenders = agentDocs.filter(({ root, file }) =>
    fs.existsSync(path.join(root, file)) &&
    /\bask_user\b/.test(fs.readFileSync(path.join(root, file), 'utf8'))
  ).map(({ file }) => file)
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

test('checklist points cross-spec shared components at src/components/, not src/ui/', () => {
  const checklist = fs.readFileSync(path.join(agentDir, 'checklist.md'), 'utf8')
  assert(
    !/shared component in `src\/ui\/`/.test(checklist),
    'checklist.md tells the agent to create shared components in src/ui/ — that is the ' +
    'framework\'s own library inside the package. Project-level shared code goes in src/components/.'
  )
  assert(
    /shared component in `src\/components\/`/.test(checklist),
    'checklist.md must direct cross-spec shared components to src/components/.'
  )
})

test('guide-spec.md states the one-spec-per-page mental model', () => {
  const guideSpec = fs.readFileSync(path.join(agentDir, 'guide-spec.md'), 'utf8')
  assert(
    /one spec per page/i.test(guideSpec) && /dynamic route is still one spec/i.test(guideSpec),
    'guide-spec.md must state the mental model explicitly: one spec = one route = one file, ' +
    'and a dynamic route is still one spec serving many URLs.'
  )
})

test('approval pause mechanism is wired end to end', () => {
  // The design-approval gate requires the agent to end its turn and wait for the
  // user — but the scaffolded Stop hooks block any turn ending with unverified
  // edits. Without an escape hatch the hooks steamroll the approval gate (the
  // agent gets blocked, reads "Run /verify", and proceeds without an answer).
  const scaffoldSrc = fs.readFileSync(path.join(ROOT, 'src/cli/scaffold.js'), 'utf8')
  const coverageSrc = fs.readFileSync(path.join(agentDir, 'coverage-check.js'), 'utf8')
  const workflow    = fs.readFileSync(path.join(agentDir, 'workflow.md'), 'utf8')

  // 1. The MCP server must expose the tool that writes the marker
  assert(/registerTool\(\s*'pulse_await_approval'/.test(serverSrc),
    'server.js must register pulse_await_approval')

  // 2. Every inline Stop hook in the scaffold must early-exit on the marker
  const stopHookCount   = (scaffoldSrc.match(/decision:'block'/g) || []).length
  const markerCheckCount = (scaffoldSrc.match(/\.pulse-awaiting-approval'\)\)process\.exit\(0\)/g) || []).length
  assert(stopHookCount >= 2 && markerCheckCount >= stopHookCount,
    `scaffold.js has ${stopHookCount} blocking Stop hooks but only ${markerCheckCount} check ` +
    `.pulse-awaiting-approval — every blocking Stop hook must allow the approval pause.`)

  // 3. coverage-check.js (the third Stop hook) must early-exit on the marker
  assert(coverageSrc.includes('.pulse-awaiting-approval'),
    'coverage-check.js must early-exit when .pulse-awaiting-approval exists')

  // 4. The marker must be consumed when the user replies — one turn-end only
  assert(/UserPromptSubmit/.test(scaffoldSrc) && /unlinkSync\('\.pulse-awaiting-approval'\)/.test(scaffoldSrc),
    'scaffold.js must register a UserPromptSubmit hook that deletes .pulse-awaiting-approval')

  // 5. The workflow must teach the mechanism at the design-approval gate
  assert(workflow.includes('pulse_await_approval'),
    'workflow.md Phase 5a must explain how to pause: always pulse_await_approval before asking')

  // 6. No doc may claim a host question tool avoids ending the turn — field
  //    testing showed AskUserQuestion in Claude Code still ends the turn and
  //    fires the Stop hooks. The safe instruction is: always write the marker
  //    first, regardless of how the question is asked.
  const claimDocs = agentDocs.filter(({ root, file }) =>
    fs.existsSync(path.join(root, file)) &&
    /without ending the turn/i.test(fs.readFileSync(path.join(root, file), 'utf8'))
  ).map(({ file }) => file)
  if (/without ending the turn.*Stop hooks never fire/is.test(serverSrc)) claimDocs.push('src/mcp/server.js')
  assert(claimDocs.length === 0,
    `These docs claim a question tool avoids ending the turn (empirically false in Claude Code): ${claimDocs.join(', ')}. ` +
    `Instruct: always call pulse_await_approval before asking, whichever way the question is asked.`)
})

test('pulse_validate prop-alias check excludes attrs blocks (false-positive fix)', () => {
  // Regression: input({ attrs: { autocomplete } }) — the RECOMMENDED pattern —
  // was flagged as a wrong top-level prop because the match crossed into the
  // attrs object. The exclusion regex must be present in the alias loop.
  // Logic lives in cli/validate.js — shared by pulse_validate (MCP) and
  // `pulse validate` (CLI), not duplicated in server.js.
  assert(validateSrc.includes('attrs\\s*:\\s*\\{[^}]*$'),
    'The PROP_ALIASES loop must exclude matches that fall inside an open attrs: { … } block')
})

test('pulse_validate CSP check matches config by host, not full URL', () => {
  // Regression: CSP sources are valid without a scheme (images.unsplash.com),
  // but the config check required https?:// — flagging correctly configured
  // projects on every validate.
  assert(validateSrc.includes('configImgSrc.includes(host)'),
    'External-image CSP check must test the config for the bare host')
  assert(validateSrc.includes(`host:    'images.unsplash.com'`),
    'External image host entries must carry a bare host field')
})

test('validator resolves relative imports from the spec file\'s own directory', () => {
  // Regression: the temp validation file was always written into src/pages/
  // root, so subdirectory pages (src/pages/news/index.js) had their relative
  // imports (../../components/layout.js) resolve from the wrong depth.
  assert(/export async function validateContent\(content, root, tmpDir = null\)/.test(validateSrc),
    'validateContent must accept a tmpDir parameter')
  assert(validateSrc.includes('validateFile(file, root)'),
    'validateFile must exist and take (file, root)')
  assert(serverSrc.includes('validateContent(content, ROOT, path.dirname(fullPath))'),
    'pulse_create_page must validate from the file\'s own directory')
  assert(serverSrc.includes('validateFile(file, ROOT)'),
    'pulse_validate file mode must validate from the file\'s own directory (via validateFile, which uses path.dirname internally)')
})

test('pulse validate CLI command exists and shares validate.js with the MCP tool', () => {
  const cliSrc = fs.readFileSync(path.join(ROOT, 'src/cli/index.js'), 'utf8')
  assert(cliSrc.includes("case 'validate':"), 'pulse validate must be a registered CLI command')
  assert(cliSrc.includes('validateFile(file, root)'), 'the CLI command must call the shared validateFile() logic, not reimplement it')
})

test('pulse diagnose / resolve-error CLI commands exist and share diagnose.js with the MCP tools', () => {
  const cliSrc = fs.readFileSync(path.join(ROOT, 'src/cli/index.js'), 'utf8')
  assert(cliSrc.includes("case 'diagnose':"), 'pulse diagnose must be a registered CLI command')
  assert(cliSrc.includes("case 'resolve-error':"), 'pulse resolve-error must be a registered CLI command')
  assert(cliSrc.includes('readJournal(root'), 'the CLI diagnose command must call the shared readJournal() logic, not reimplement it')
  assert(cliSrc.includes('resolveEntries(root'), 'the CLI resolve-error command must call the shared resolveEntries() logic, not reimplement it')
  assert(serverSrc.includes('readJournal(ROOT'), 'the MCP pulse_diagnose tool must call the shared readJournal() logic')
  assert(serverSrc.includes('resolveEntries(ROOT'), 'the MCP pulse_resolve_error tool must call the shared resolveEntries() logic')
})

test('package-root import is stripped from client bundles in build and dev', () => {
  // Regression: import { pushStore } from '@invisibleloop/pulse' (the documented
  // live-push pattern) pulled the entire server — http, fs, zlib — into the
  // browser bundle and broke `pulse build`.
  const buildSrc = fs.readFileSync(path.join(ROOT, 'scripts/build.js'), 'utf8')
  const devSrc   = fs.readFileSync(path.join(ROOT, 'src/cli/dev.js'), 'utf8')
  assert(buildSrc.includes(`'@invisibleloop/pulse/md', '@invisibleloop/pulse'`),
    'build.js SERVER_ONLY_IMPORTS must include the package root')
  assert(devSrc.includes(`@invisibleloop\\/pulse)['"]`),
    'dev.js serveFile must strip package-root imports before serving specs to the browser')
})

test('pulse_check_contrast extracts variables from [data-theme="light"] blocks', () => {
  // Regression: the light-theme block pattern was an ungrouped alternation
  // (a|b) + '\\s*\\{([^}]+)\\}' — the body matcher bound only to the second
  // alternative, so [data-theme="light"] blocks matched with no body capture
  // and the checker silently reported nothing for the light theme.
  // Recreate extractVars with the exact pattern strings from server.js source.
  const patterns = [...serverSrc.matchAll(/extractVars\(source,\s*'((?:[^'\\]|\\.)*)'\)/g)].map(m =>
    m[1].replace(/\\\\/g, '\\').replace(/\\'/g, "'")
  )
  assert(patterns.length === 2, `Expected 2 extractVars call patterns in server.js, found ${patterns.length}`)
  const lightPattern = patterns.find(p => p.includes('data-theme'))
  assert(lightPattern, 'No data-theme pattern found in extractVars calls')

  const sampleCss = `:root { --accent: #112233; }\n[data-theme="light"] { --accent: #445566; --bg: #ffffff; }`
  const blockRegex = new RegExp(lightPattern + '\\s*\\{([^}]+)\\}', 'gi')
  const m = blockRegex.exec(sampleCss)
  assert(m && m[1] && m[1].includes('--accent'),
    `The light-theme block pattern in pulse_check_contrast fails to capture the block body. ` +
    `Pattern: ${lightPattern} — alternations must be wrapped in (?:...).`)
})

test('dark theme default is declared at every spec-writing entry point', () => {
  // Agents repeatedly assumed the default theme is light, built the page, then
  // discovered dark at the screenshot — costing an edit → restart → re-approval
  // cycle. The dark default must be stated wherever a spec is first written:
  // the spec skeleton, the plan/build brief, and the checklist.
  const guideSpec = fs.readFileSync(path.join(agentDir, 'guide-spec.md'), 'utf8')
  const workflow  = fs.readFileSync(path.join(agentDir, 'workflow.md'), 'utf8')
  const checklist = fs.readFileSync(path.join(agentDir, 'checklist.md'), 'utf8')
  const claudeMd  = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8')

  assert(/theme:/.test(guideSpec) && /DEFAULT IS DARK/i.test(guideSpec),
    'guide-spec.md meta skeleton must include the theme field with the dark-default warning')
  assert(/Theme:\s+light \| dark/.test(workflow),
    'workflow.md build brief template must include a Theme line')
  assert(/default theme is DARK/i.test(checklist),
    'checklist.md Critical section must state the dark default')
  assert(/theme:\s+'light'/.test(claudeMd) && /default is DARK/i.test(claudeMd),
    'CLAUDE.md spec meta block must show theme with the dark-default warning')
})

test('identity.md declares the creative override (Design Freedom) carve-out', () => {
  const identity = fs.readFileSync(path.join(agentDir, 'identity.md'), 'utf8')
  assert(
    /creative override/i.test(identity),
    'identity.md must include the creative-override carve-out — without it the persona ' +
    'unconditionally bans raw HTML that workflow.md Mode B explicitly permits.'
  )
})

test('pulse://start reads design:"freeform" from pulse.config.js and ties it to the Mode B override comment', () => {
  // pulse.config.js's `design: 'freeform'` flag is a project-wide default for
  // Mode B (see identity.md's "Design Freedom" rule / workflow.md 3a) — not a
  // separate, unenforced concept. pulse_review still detects Mode B per-file
  // by regexing the `// component-free — creative override` comment out of
  // each spec's source, so the freeform banner must tell the agent to keep
  // writing that comment into every new file even though the mode itself is
  // set once, project-wide.
  assert(/readPulseConfig/.test(serverSrc),
    'server.js must define/use a readPulseConfig() helper to read pulse.config.js')
  assert(/config\.design === 'freeform'/.test(serverSrc),
    'pulse://start must check config.design === "freeform" from pulse.config.js')
  assert(/component-free — creative override/.test(serverSrc) && /isFreeform/.test(serverSrc),
    'the freeform banner must instruct writing the `// component-free — creative override` ' +
    'comment into each spec file — pulse_review detects Mode B from that comment, not from config')
})

test('scaffolded pulse.config.js documents the design:"freeform" flag', () => {
  const scaffoldSrc = fs.readFileSync(path.join(ROOT, 'src/cli/scaffold.js'), 'utf8')
  assert(/design: 'freeform'/.test(scaffoldSrc),
    'scaffold.js should mention design: "freeform" in the generated pulse.config.js as a commented hint')
})

// ── pulse_review mechanized checks ────────────────────────────────────────────
// These three rules used to live only as prose in checklist.md (unenforced).
// They're now regex-checked in both pulse_review's quick and full modes —
// tested here against fixture strings, not just "the pattern exists somewhere",
// so a future edit that narrows/breaks the regex is actually caught.

test('modal-state check catches state.modalOpen and misses unrelated state', () => {
  const modalRegex = /state\.modalOpen|modalOpen\s*:/
  assert(modalRegex.test(`state: { modalOpen: false }`), 'must catch modalOpen: in state block')
  assert(modalRegex.test(`\${state.modalOpen ? modal() : ''}`), 'must catch state.modalOpen read in view')
  assert(!modalRegex.test(`state: { dialogId: null }`), 'must not flag unrelated state fields')
})

test('CSRF check catches a POST form missing ${server.csrf} on a submit-handling page', () => {
  const hasSubmit  = (src) => /\bsubmit\s*:\s*async/.test(src)
  const hasPostForm = (src) => /<form[^>]*method=["']POST["']/i.test(src)
  const hasCsrf     = (src) => src.includes('server.csrf')

  const missing = `submit: async (ctx) => {}, view: () => \`<form method="POST"><input name="email"></form>\``
  assert(hasSubmit(missing) && hasPostForm(missing) && !hasCsrf(missing),
    'must flag a submit-page POST form with no ${server.csrf}')

  const present = `submit: async (ctx) => {}, view: () => \`<form method="POST">\${server.csrf}<input name="email"></form>\``
  assert(hasSubmit(present) && hasPostForm(present) && hasCsrf(present),
    'must not flag a submit-page POST form that includes ${server.csrf}')

  const noSubmit = `view: () => \`<form method="POST"><input name="email"></form>\``
  assert(!hasSubmit(noSubmit),
    'must not run the CSRF check at all on a page with no spec.submit (client-only action forms don\'t need it)')
})

test('_storeUpdate check catches a primitive and misses a real object literal', () => {
  const badStoreUpdate = /_storeUpdate\s*:\s*(true|false|\d|['"`])/
  assert(badStoreUpdate.test(`onSuccess: (state) => ({ _storeUpdate: true })`), 'must catch a boolean')
  assert(badStoreUpdate.test(`onSuccess: (state) => ({ _storeUpdate: 'theme' })`), 'must catch a string literal')
  assert(!badStoreUpdate.test(`onSuccess: (state, theme) => ({ _storeUpdate: { settings: { theme } } })`),
    'must not flag a correctly-shaped object literal')
})

test('review.js defines all three new auto-checks in both quick and full pulse_review modes', () => {
  // Logic lives in cli/review.js — shared by pulse_review (MCP) and
  // `pulse review` (CLI), not duplicated in server.js.
  const modalCount = (reviewSrc.match(/state\\\.modalOpen\|modalOpen\\s\*:/g) || []).length
  assert(modalCount >= 2, `modal-state check must appear in both quick and full review modes (found ${modalCount})`)
  assert(reviewSrc.split("source.includes('server.csrf')").length - 1 >= 2,
    'CSRF check must appear in both quick and full review modes')
  assert(reviewSrc.split('_storeUpdate\\s*:\\s*(true|false|\\d').length - 1 >= 2,
    '_storeUpdate check must appear in both quick and full review modes')
})

test('pulse review CLI command exists and shares review.js with the MCP tool', () => {
  const cliSrc = fs.readFileSync(path.join(ROOT, 'src/cli/index.js'), 'utf8')
  assert(cliSrc.includes("case 'review':"), 'pulse review must be a registered CLI command')
  assert(cliSrc.includes('runQuickReview(source, file)'), 'the CLI command must call the shared runQuickReview() logic')
  assert(cliSrc.includes('runFullReview(source, file)'), 'the CLI command must call the shared runFullReview() logic')
  assert(serverSrc.includes('runQuickReview(source, file)'), 'the MCP tool must call the shared runQuickReview() logic')
  assert(serverSrc.includes('runFullReview(source, file)'), 'the MCP tool must call the shared runFullReview() logic')
})

test('the CLI-facing review formatter never carries agent-only framing', () => {
  // The MCP tool's report talks directly to an agent ("you are now a senior
  // code reviewer", "continue to the verification workflow"). That framing
  // must not leak into the CLI output a human reads — formatFullReview and
  // formatQuickReview must branch on agentFacing rather than hardcode it.
  assert(reviewSrc.includes('agentFacing'), 'formatters must accept an agentFacing option')
  assert(reviewSrc.includes("you are now a"), 'the agent-facing intro text must exist somewhere in review.js')
  assert(/agentFacing\s*\?[\s\S]{0,200}you are now a/i.test(reviewSrc),
    'the "you are now a reviewer" framing must be conditional on agentFacing, not unconditional')
})

// ── validate-worker.js path handling ────────────────────────────────────────
// Regression: a relative path passed to the worker resolves against the
// worker's own location (src/mcp/), not the caller's cwd, and fails with a
// confusing "Cannot find package 'src'" error that reads as a bug in the
// spec's imports rather than what it actually is — the worker was called
// wrong. Found via a real dogfooding session where an agent shelled out to
// the worker directly (bypassing the MCP tool's own absolute-path
// normalisation) and lost several minutes to the misleading error.

const validateWorkerPath = path.join(ROOT, 'src/mcp/validate-worker.js')

function runValidateWorker(arg) {
  try {
    return { output: execFileSync(process.execPath, [validateWorkerPath, arg], { encoding: 'utf8' }), code: 0 }
  } catch (err) {
    return { output: err.stdout || err.message, code: err.status ?? 1 }
  }
}

test('validate-worker.js gives a precise error for a relative path, not the raw Node resolver error', () => {
  const { output } = runValidateWorker('src/pages/home.js')
  assert(output.includes('requires an absolute path'),
    `Expected a clear absolute-path error, got: ${output}`)
  // The explanatory text is allowed to mention the phrase for context, but the
  // raw Node stack-trace signature ("imported from ...") must not leak through —
  // that's the actual confusing artifact this fix replaces.
  assert(!output.includes('imported from'),
    `Should not leak the raw Node resolver stack trace to the caller: ${output}`)
})

test('validate-worker.js still gives the file-not-found message for a missing absolute path', () => {
  const { output } = runValidateWorker('/tmp/definitely-does-not-exist-pulse-test.js')
  assert(output.includes('file not found'), `Expected a file-not-found message, got: ${output}`)
})

// ── pulse_intent dashboard-aware inspiration question ───────────────────────
// Regression: found via dogfooding — the mandatory design-inspiration question
// ("a site you love, a screenshot, a mood board") has no branch for internal/
// functional tools, where it lands oddly and risks an agent reinterpreting or
// skipping a mandatory step. pulse_intent's dashboard archetype now asks a
// reframed question (visual reference OR clean functional default, plus
// information-density questions) instead of the generic aesthetic one.

test('pulse_intent reframes the inspiration question for the dashboard archetype', () => {
  assert(/if \(key === 'dashboard'\)/.test(serverSrc),
    'pulse_intent must branch on the dashboard archetype for the inspiration question')
  assert(/reframed for a functional\/internal tool/.test(serverSrc),
    'the dashboard branch must explain why the question is reframed')
  assert(/is not skippable/.test(serverSrc),
    'the reframed question must state it remains mandatory, not an excuse to skip a required step')
})

test('workflow.md documents the same internal-tool exception for Step 0', () => {
  const workflow = fs.readFileSync(path.join(agentDir, 'workflow.md'), 'utf8')
  assert(/Internal\/functional tools/.test(workflow),
    'workflow.md must carry the same internal-tool branch as pulse_intent, since an agent following workflow.md directly (without calling pulse_intent) needs the same guidance')
  assert(/the question itself is still mandatory/.test(workflow),
    'must be explicit that the internal-tool branch reframes the question, it does not remove the requirement to ask it')
})

// ── pulse_check_bundles ──────────────────────────────────────────────────────
// Verified live (build a real project, reproduce the exact bug it catches by
// temporarily reverting the build.js fix, confirm the tool flags it, restore
// the fix, confirm clean) during development — not re-run here since that
// needs a full esbuild pass. This locks in the tool's structure so future
// edits can't silently drop a check without a source-level test noticing.

test('pulse_check_bundles checks both bundle-existence and node-builtin-leak', () => {
  assert(/'pulse_check_bundles'/.test(serverSrc), 'pulse_check_bundles must be registered')
  assert(serverSrc.includes("checkBundles(ROOT)"), 'the MCP tool must call the shared checkBundles() logic, not reimplement it')
  assert(/mutations\|actions\|persist/.test(checkBundlesSrc),
    'must check for mutations/actions/persist — same test as discover.js\'s needsHydration()')
  assert(/NODE_BUILTINS/.test(checkBundlesSrc), 'must scan bundles for leaked Node built-in references')
  assert(/node:fs/.test(checkBundlesSrc.slice(checkBundlesSrc.indexOf('NODE_BUILTINS'))),
    'node:fs must be in the leak-detection list — the exact module a real persistence layer uses')
})

test('pulse check-bundles CLI command exists and shares check-bundles.js with the MCP tool', () => {
  const cliSrc = fs.readFileSync(path.join(ROOT, 'src/cli/index.js'), 'utf8')
  assert(cliSrc.includes("case 'check-bundles':"), 'pulse check-bundles must be a registered CLI command')
  assert(cliSrc.includes("checkBundles(root)"), 'the CLI command must call the shared checkBundles() logic, not reimplement it')
})

test('verify.md calls pulse_check_bundles as part of the full Lighthouse pre-flight', () => {
  const verify = fs.readFileSync(path.join(agentDir, 'commands', 'verify.md'), 'utf8')
  assert(/pulse_check_bundles/.test(verify), 'verify.md must call pulse_check_bundles')
  // Must appear in the Lighthouse pre-flight section (after pulse_build, before
  // the actual lighthouse_audit call) — not buried somewhere it won't run.
  const buildIdx = verify.indexOf('pulse_build` to produce a production build')
  const checkIdx = verify.indexOf('pulse_check_bundles')
  const auditIdx = verify.indexOf('lighthouse_audit` with `{ "device": "desktop" }')
  assert(buildIdx !== -1 && checkIdx !== -1 && auditIdx !== -1, 'all three anchors must exist in verify.md')
  assert(buildIdx < checkIdx && checkIdx < auditIdx,
    'pulse_check_bundles must run after pulse_build and before the Lighthouse audit')
})

// ── Result ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
