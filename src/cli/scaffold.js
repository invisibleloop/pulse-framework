/**
 * Pulse — Project scaffolding
 *
 * Creates a minimal Pulse project in the target directory.
 * Includes a working home page with a counter to prove the app runs.
 */

import fs   from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PULSE_PKG = '@invisibleloop/pulse'

/**
 * Scaffold a new Pulse project.
 *
 * @param {string} targetDir - Absolute path to the project directory
 * @param {Object} options
 * @param {string} [options.name]  - Project name (defaults to directory name)
 * @param {number} [options.port]  - Dev server port (defaults to 3000)
 */
export async function scaffold(targetDir, options = {}) {
  const name = options.name || path.basename(targetDir)
  const port = options.port || 3000

  fs.mkdirSync(path.join(targetDir, 'src', 'pages'),      { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'src', 'components'), { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'public'),             { recursive: true })

  // package.json
  write(targetDir, 'package.json', JSON.stringify({
    name,
    version: '0.1.0',
    type:    'module',
    scripts: {
      dev:   'pulse dev',
      build: 'pulse build',
      start: 'pulse start',
      test:          'find src -name "*.test.js" | xargs node --test',
      'test:coverage': 'find src -name "*.test.js" | xargs node --test --experimental-test-coverage --test-coverage-include=\'src/pages/!(*.test).js\'',
    },
    engines: {
      node: '>=22',
    },
    dependencies: {
      [PULSE_PKG]: 'latest',
    }
  }, null, 2))

  // pulse.config.js
  write(targetDir, 'pulse.config.js',
`export default {
${port !== 3000 ? `  port: ${port},\n` : ''}}
`)

  // Home page + tests — working counter proves the app runs
  write(targetDir, 'src/pages/home.js',      homePage(name))
  write(targetDir, 'src/pages/home.test.js', homePageTest(name))

  // Minimal stylesheet
  write(targetDir, 'public/app.css', baseCSS())

  // Copy pulse-ui assets from the package into public/ so they're served immediately
  const pkgPublic = new URL('../../public', import.meta.url).pathname
  for (const asset of ['pulse-ui.css', 'pulse-ui.js']) {
    const src = path.join(pkgPublic, asset)
    const dst = path.join(targetDir, 'public', asset)
    if (fs.existsSync(src)) fs.copyFileSync(src, dst)
  }

  // Copy agent support files into .claude/
  const agentFiles = [
    ['../agent/checklist.md',       'pulse-checklist.md'],
    ['../agent/coverage-check.js',  'coverage-check.js'],
  ]
  for (const [src, dst] of agentFiles) {
    const srcPath = new URL(src, import.meta.url).pathname
    const dstPath = path.join(targetDir, '.claude', dst)
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true })
      fs.copyFileSync(srcPath, dstPath)
    }
  }

  // CLAUDE.md — in .claude/ so it's alongside Claude Code's own config, not cluttering the project root
  write(targetDir, '.claude/CLAUDE.md', claudeMd(name))

  // settings.json — hooks that enforce correct agent behaviour
  write(targetDir, '.claude/settings.json', JSON.stringify({
    hooks: {
      SessionStart: [
        {
          hooks: [
            {
              type: 'command',
              command: `node -e "process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:'START OF SESSION: Before doing anything else — (1) run pulse_list_structure to see the current project structure, (2) read pulse://guide from MCP for the complete Pulse reference. Both are mandatory. Do not skip them.'}}))"`,
              statusMessage: 'Loading Pulse session...',
            },
            {
              type: 'command',
              command: `node -e "const{execSync}=require('child_process');let out='';let ok=true;try{out=execSync('npm test 2>&1',{encoding:'utf8',timeout:60000});}catch(e){ok=false;out=e.stdout||e.message;}const lines=out.trim().split('\\n');const summary=lines[lines.length-1]||'';const msg=ok?'TEST BASELINE — all tests passing: '+summary+'. Note this result. If tests fail after your changes, you introduced the regression.':'PRE-EXISTING TEST FAILURES detected before you wrote any code:\\n'+out.slice(-2000)+'\\nDo not treat these as regressions you caused. Fix them first if they are related to your task, otherwise note them and proceed.';process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:msg}}))"`,
              statusMessage: 'Running test baseline...',
            }
          ]
        }
      ],
      PreToolUse: [
        {
          matcher: 'mcp__chrome-devtools__lighthouse_audit',
          hooks: [
            {
              type: 'command',
              command: `node -e "process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',additionalContext:'LIGHTHOUSE PRE-FLIGHT: This tool audits the currently loaded browser page. Before proceeding you MUST: (1) have called pulse_build to start the production server on port ${port + 1}, (2) have called navigate_page with url http://localhost:${port + 1}/ so the current page IS the production server. If either step is not done, stop — do those steps first, then call lighthouse_audit.'}}))"`,
              statusMessage: 'Checking Lighthouse prerequisites...',
            }
          ]
        },
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: `node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const cmd=(i.tool_input||{}).command||'';if(!cmd.match(/\\bnpm\\s+(install|i)\\b|\\byarn\\s+add\\b|\\bpnpm\\s+(install|add)\\b|\\bbun\\s+add\\b/)){return;}const skipWords=new Set(['npm','yarn','pnpm','bun','install','i','add','ci']);const pkgs=cmd.split(/\\s+/).filter(p=>p&&!p.startsWith('-')&&!skipWords.has(p));if(!pkgs.length){return;}const BLOCK=['react','react-dom','react-router','react-router-dom','preact','vue','svelte','solid-js','alpinejs','htmx.org','jquery'];const BLOCK_SCOPE=['@vue/','@angular/','@sveltejs/'];const getName=p=>p.startsWith('@')?p:p.split('@')[0];const blocked=pkgs.filter(p=>{const n=getName(p);return BLOCK.includes(n)||BLOCK_SCOPE.some(s=>p.startsWith(s));});if(blocked.length){process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'BLOCKED: '+blocked.join(', ')+' is a client-side rendering library. Pulse handles all client rendering — do not install client-side UI frameworks. Use Pulse specs and components instead.'}}));}else{process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',additionalContext:'PACKAGE INSTALL: Confirm '+pkgs.join(', ')+' will only be used server-side (in server.data fetchers or server utilities). Do not import it in view functions or client-accessible code.'}}));}});"`,
              statusMessage: 'Checking package install...',
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: 'Write|Edit',
          hooks: [
            {
              type: 'command',
              command: `node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const f=(i.tool_input||{}).file_path||'';if(!f.includes('/src/pages/')||!f.endsWith('.js')){return;}const {execSync}=require('child_process');try{execSync('node --check '+JSON.stringify(f),{stdio:'pipe'});process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:'Syntax OK: '+f}}));}catch(e){process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:'SYNTAX ERROR in '+f+': '+e.stderr.toString().trim()}}));}})"`,
              statusMessage: 'Checking page syntax...',
            },
            {
              type: 'command',
              command: `node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const f=(i.tool_input||{}).file_path||'';if(!f.endsWith('.css')){return;}const fs=require('fs');let c;try{c=fs.readFileSync(f,'utf8');}catch(e){return;}const m=c.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);if(m&&m.length){const u=[...new Set(m)];process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:'HARDCODED HEX in '+f+': '+u.join(', ')+'. Use var(--ui-*) tokens instead — hardcoded colours break theming.'}}));}})"`,
              statusMessage: 'Checking for hardcoded colours...',
            },
            {
              type: 'command',
              command: `node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const f=(i.tool_input||{}).file_path||'';if((!f.includes('/src/pages/')&&!f.includes('/src/components/'))||!f.endsWith('.js')){return;}const fs=require('fs');let c;try{c=fs.readFileSync(f,'utf8');}catch(e){return;}const m=c.match(/[\\u{1F000}-\\u{1FFFF}\\u{2600}-\\u{27BF}\\u{1F300}-\\u{1F9FF}\\u{2300}-\\u{23FF}\\u{2B00}-\\u{2BFF}]/gu);if(m&&m.length){const u=[...new Set(m)];process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:'EMOJI in '+f+': '+u.join(' ')+'. Replace with icons from the icon library — e.g. iconCheck(), iconStar(), iconZap(). Never use emoji in UI output.'}}));}})"`,
              statusMessage: 'Checking for emoji...',
            }
          ]
        }
      ],
      Stop: [
        {
          hooks: [
            {
              type: 'command',
              command: `node -e "const fs=require('fs');const{execSync}=require('child_process');let changed=new Set();let hasGit=false;try{execSync('git rev-parse --is-inside-work-tree',{stdio:'pipe'});hasGit=true;execSync('git status --porcelain',{encoding:'utf8'}).split('\\n').forEach(l=>{const f=l.slice(3).trim().split(' -> ').pop();if(f)changed.add(f);});}catch{}if(!hasGit&&fs.existsSync('src/pages')){for(const f of fs.readdirSync('src/pages')){if(f.endsWith('.js')&&!f.endsWith('.test.js'))changed.add('src/pages/'+f);}}const specs=[...changed].filter(f=>f.match(/^src\\/pages\\/.+\\.js$/)&&!f.endsWith('.test.js'));const missing=specs.filter(f=>{const t=f.replace(/\\.js$/,'.test.js');return!fs.existsSync(t)&&!changed.has(t);});if(missing.length){process.stdout.write(JSON.stringify({decision:'block',reason:'TESTS MISSING: '+missing.join(', ')+' — you must write tests before finishing. Use renderSync/render from @invisibleloop/pulse/testing to test view output, mutations, and any extracted logic functions. Run the tests with node to confirm they pass.'}));}"`,
              statusMessage: 'Checking for missing tests...',
            },
            {
              type: 'command',
              command: `node .claude/coverage-check.js`,
              statusMessage: 'Checking test coverage...',
            }
          ]
        }
      ]
    }
  }, null, 2))

  // .gitignore
  write(targetDir, '.gitignore', [
    'node_modules',
    'public/dist',
    '.pulse-build',
    '.DS_Store',
  ].join('\n') + '\n')

  console.log('  ✓ Project files created')

  // Install dependencies
  console.log('  ✓ Installing dependencies...\n')
  try {
    // Use the globally linked package if available (local dev), otherwise npm install
    execSync(`npm link ${PULSE_PKG}`, { cwd: targetDir, stdio: 'inherit' })
  } catch {
    execSync('npm install', { cwd: targetDir, stdio: 'inherit' })
  }

  // Initialise git so the Stop hook can use `git status` to track only changed files.
  // Without this the hook falls back to listing all src/pages/*.js and flags home.js.
  try {
    execSync('git init && git add -A && git commit -m "init"', { cwd: targetDir, stdio: 'pipe' })
    console.log('  ✓ Git repository initialised')
  } catch {
    // Non-fatal — project still works without git, stop hook falls back gracefully.
  }
}

// ---------------------------------------------------------------------------
// File templates
// ---------------------------------------------------------------------------

function homePage(appName) {
  return `\
import { button, heading, iconMinus, iconPlus } from '@invisibleloop/pulse/ui'

export default {
  route: '/',

  hydrate: '/src/pages/home.js',

  meta: {
    title:       '${appName}',
    description: '${appName} — built with Pulse.',
    styles:      ['/pulse-ui.css', '/app.css'],
  },

  state: {
    count: 0,
  },

  constraints: {
    count: { min: 0, max: 10 },
  },

  view: (state) => \`
    <main id="main-content" class="page">
      \${heading({ level: 1, text: '${appName}' })}
      <p class="u-text-muted u-mt-2 u-mb-8">Your Pulse app is running.</p>

      <div class="u-flex u-items-center u-gap-4">
        \${button({
          icon:     iconMinus({ size: 16 }),
          variant:  'secondary',
          disabled: state.count <= 0,
          attrs:    { 'data-event': 'decrement', 'aria-label': 'Decrease count' },
        })}
        <span class="u-text-2xl u-font-bold u-tabular-nums" aria-live="polite">\${state.count}</span>
        \${button({
          icon:     iconPlus({ size: 16 }),
          variant:  'secondary',
          disabled: state.count >= 10,
          attrs:    { 'data-event': 'increment', 'aria-label': 'Increase count' },
        })}
      </div>
    </main>
  \`,

  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
}
`
}

function homePageTest(_appName) {
  return `\
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderSync } from '@invisibleloop/pulse/testing'
import spec from './home.js'

test('home page renders app name', () => {
  const r = renderSync(spec)
  assert(r.has('main#main-content'))
  assert(r.has('h1'))
})

test('home page renders counter at 0', () => {
  const r = renderSync(spec)
  assert(r.has('span[aria-live]'))
  assert.equal(r.get('span[aria-live]').text, '0')
})

test('home page decrement disabled at min', () => {
  const r = renderSync(spec, { state: { count: 0 } })
  const buttons = r.findAll('button')
  const dec = buttons.find(b => b.attr('aria-label') === 'Decrease count')
  assert(dec, 'decrement button not found')
  assert(dec.attrs.disabled !== undefined, 'decrement should be disabled at 0')
})

test('home page increment disabled at max', () => {
  const r = renderSync(spec, { state: { count: 10 } })
  const buttons = r.findAll('button')
  const inc = buttons.find(b => b.attr('aria-label') === 'Increase count')
  assert(inc, 'increment button not found')
  assert(inc.attrs.disabled !== undefined, 'increment should be disabled at 10')
})

test('increment mutation adds 1', () => {
  assert.deepEqual(spec.mutations.increment({ count: 4 }), { count: 5 })
})

test('decrement mutation subtracts 1', () => {
  assert.deepEqual(spec.mutations.decrement({ count: 4 }), { count: 3 })
})
`
}

function baseCSS() {
  return `\
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--ui-font, system-ui, sans-serif);
  line-height: 1.6;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}
`
}

function claudeMd(appName) {
  return `\
# ${appName} — Pulse App

## Project

\`\`\`
src/pages/       ← one .js file per page, auto-discovered
src/components/  ← shared view fragments (JS functions returning HTML strings)
public/app.css   ← global stylesheet
\`\`\`

## Start of every session

1. Run \`pulse_list_structure\` to see what already exists
2. Read \`pulse://guide\` from MCP — the complete reference for spec format, components, verification workflow, CSS rules, and patterns

The MCP guide is the single source of truth. Follow it for all technical decisions, component usage, and the mandatory verification workflow.

## Before writing any code

**Always present a plan and wait for the user to confirm before writing a single line of code.**

The plan must include: route, page sections, components used, state shape, and whether hydration is needed. End the plan with an explicit question — "Shall I go ahead?" — and stop. Do not proceed until the user says yes (or equivalent). This applies to every new page or significant change, no matter how clear the task seems.

## After completing any feature

Run these steps in order — do not declare work done without them:

1. \`pulse_validate\` — fix all errors and warnings
2. \`pulse_review\` — switch into reviewer mode, read the source and rendered HTML critically, fix every issue before continuing
3. Write tests for every page you created or changed, run \`npm test\` (all pass), then \`npm run test:coverage\` — fix any untested branches
4. Navigate to the page in the browser and take a screenshot
5. Run Lighthouse (desktop then mobile) — all four scores must be 100

## Writing tests

Test files live next to the page they test: \`src/pages/foo.test.js\` for \`src/pages/foo.js\`.

\`\`\`
npm test               # run all tests
npm run test:coverage  # run tests + show branch/line coverage for src/pages/
\`\`\`

Coverage target: **100% branch coverage on every view function**. The coverage report shows uncovered lines — add tests until every branch is exercised. Server fetcher functions (which hit real APIs) are exempt.

What to test for every page:
- View with real/populated server data (success path)
- View with \`null\` server data per fetcher (each fetcher can fail independently)
- View with empty arrays/collections (empty state vs populated state)
- \`onViewError\` fallback — call it directly: \`spec.onViewError(new Error('x'), {}, {})\`
- Every mutation — pure functions, test directly
- Every exported pure function (formatters, validators, etc.)
- XSS: pass \`'<script>alert(1)</script>'\` as user-controlled strings, assert \`!r.has('script')\`

\`\`\`js
import assert from 'node:assert/strict'
import { renderSync } from '@invisibleloop/pulse/testing'
import spec from './my-page.js'

// View — pass mock state and server data
const r = renderSync(spec, { state: { count: 5 }, server: { items: [] } })
assert(r.has('main#main-content'))          // element exists
assert.equal(r.get('h1').text, 'Title')    // text content (throws if not found)
assert(r.has('button[disabled]'))           // attribute present
assert(!r.has('.ui-badge'))                 // element absent
assert.equal(r.count('li'), 3)             // count elements

// Mutations — pure functions, test directly
assert.deepEqual(spec.mutations.increment({ count: 0 }), { count: 1 })

// onViewError
const fallback = spec.onViewError(new Error('boom'), {}, {})
assert(fallback.includes('main-content'))
\`\`\`

**Selector support:** \`tag\`, \`.class\`, \`#id\`, \`[attr]\`, \`[attr="value"]\`, and combinations (\`button.primary[disabled]\`).
Descendant selectors (\`tbody tr\`, \`ul li\`) are NOT supported — use \`r.count('tr')\` not \`r.count('tbody tr')\`.

@.claude/pulse-checklist.md
`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function write(dir, relPath, content) {
  const filePath = path.join(dir, relPath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}
