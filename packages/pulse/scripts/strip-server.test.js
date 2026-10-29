/**
 * Server-only code stripping — run with: node scripts/strip-server.test.js
 *
 * Tests the real module (scripts/strip-server.js), and the real build end to end: what must
 * never reach the public /dist bundles, and the cases where the build must refuse.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { stripServerCode, analyseSpec, needsClientBundle, StripError, SERVER_ONLY_KEYS } from './strip-server.js'

const strip = (src) => stripServerCode(src, { file: 'page.js' })
const SECRETS = ['SECRET_A', 'SECRET_B', 'SECRET_C']
const clean = (code) => { for (const s of SECRETS) assert.ok(!code.includes(s), `${s} must not survive:\n${code}`) }

// ── the keys, in every layout ───────────────────────────────────────────────

test('server-only keys are removed from the layout the old scanner knew, and the client keys stay', () => {
  const { code } = strip(`export default {
  route: '/a',
  meta: { title: 'SECRET_A' },
  server: {
    data: async () => 'SECRET_B',
  },
  state: { n: 0 },
  mutations: { inc: s => ({ n: s.n + 1 }) },
  view: s => '<main>' + s.n + '</main>',
}`)
  clean(code)
  assert.ok(code.includes('mutations') && code.includes('view') && code.includes("route: '/a'") && code.includes('state: { n: 0 }'))
})

test('...and in the layouts it missed: one line, quoted keys, shorthand, methods, getters, submit', () => {
  for (const [label, src] of [
    ['one line',   `export default { route: '/a', mutations: { m: s => s }, server: { k: () => 'SECRET_A' }, view: () => '', guard: () => 'SECRET_B' }`],
    ['quoted',     `export default { 'route': '/a', mutations: { m: s => s }, 'server': { k: () => 'SECRET_A' }, "guard": () => 'SECRET_B', view: () => '' }`],
    ['shorthand',  `const server = { k: () => 'SECRET_A' }\nconst guard = () => 'SECRET_B'\nexport default { route: '/a', mutations: { m: s => s }, server, guard, view: () => '' }`],
    ['method',     `export default { route: '/a', mutations: { m: s => s }, server() { return 'SECRET_A' }, async guard() { return 'SECRET_B' }, view() { return '' } }`],
    ['getter',     `export default { route: '/a', mutations: { m: s => s }, get server() { return 'SECRET_A' }, view: () => '', guard: async () => 'SECRET_B' }`],
    ['computed literal', `export default { route: '/a', mutations: { m: s => s }, ['server']: { k: () => 'SECRET_A' }, ['guard']: () => 'SECRET_B', view: () => '' }`],
    ['submit',     `export default { route: '/a', mutations: { m: s => s }, submit: async (ctx) => { await send('SECRET_A') }, guard: () => 'SECRET_B', view: () => '' }`],
    ['trailing key', `export default { route: '/a', mutations: { m: s => s }, view: () => '', server: { k: () => 'SECRET_A' }, guard: () => 'SECRET_B' }`],
  ]) {
    const { code } = strip(src)
    clean(code); assert.ok(code.includes('mutations'), `${label}: client keys stay`)
    assert.ok(analyseSpec(code).analysable, `${label}: the output still parses`)
  }
})

test('an ACTION named submit (or guard, server) is not a spec key and is left alone; only the top level counts', () => {
  const { code } = strip(`export default {
  route: '/a', state: { server: 1, guard: 2 },
  actions: { submit: { run: async () => 'KEEP_ME' }, server: { run: async () => 1 } },
  mutations: { guard: s => s },
  submit: async () => 'SECRET_A',
  view: () => '',
}`)
  assert.ok(code.includes('KEEP_ME') && code.includes('state: { server: 1, guard: 2 }') && code.includes('mutations: { guard: s => s }'))
  assert.ok(!code.includes('SECRET_A'))
})

test('text that merely looks like code does not confuse it: strings, templates, comments, regexes, division', () => {
  const { code } = strip(`// server: { fake: 1 }
/* guard: nope */
export default {
  route: '/a',
  mutations: { m: s => s },
  view: () => \`
    server: { in a template }
    \${ 10 / 2 } and a regex /server: {/g and "guard: x"
  \`,
  server: { k: async () => /"/.test('SECRET_A') ? 4 / 2 : 'SECRET_B' },
  meta: { description: 'a string with server: { } inside, and a } brace' },
}`)
  clean(code)
  assert.ok(code.includes('and a regex /server: {/g') && code.includes('// server: { fake: 1 }'), 'the lookalikes are untouched')
  assert.ok(!/^\s*meta:/m.test(code))
})

// ── imports and what only server code used ─────────────────────────────────

test('imports and declarations used only by the removed code go with it; what client code uses stays', () => {
  const { code, removed } = strip(`import { sendMail } from '../lib/mailer.js'
import fs from 'node:fs'
import { md } from '@invisibleloop/pulse/md'
import { fmt } from './client-helper.js'
import './side-effect.js'
const post = md('content/x.md')
const API = 'SECRET_A'
const TABLE = { rows: ['SECRET_B'] }
const clientOnly = 42
function lookup() { return fs.readFileSync(API) }
function shared() { return clientOnly }
const server = { post: async () => post, find: lookup, rows: () => TABLE }
export default {
  route: '/a', mutations: { m: s => ({ n: fmt(shared()) }) },
  submit: async () => sendMail(API), server, view: () => '',
}`)
  clean(code)
  assert.deepEqual(removed.imports.sort(), ['../lib/mailer.js', '@invisibleloop/pulse/md', 'node:fs'])
  assert.ok(code.includes("import { fmt } from './client-helper.js'"), 'an import the client still uses stays')
  assert.ok(code.includes("import './side-effect.js'"), 'a side-effect import has no bindings and stays')
  assert.ok(code.includes('function shared') && code.includes('const clientOnly = 42'), 'client-used declarations stay')
  assert.ok(!code.includes('function lookup') && !code.includes('const post') && !code.includes('const API') && !code.includes('const server'), 'server-only declarations go')
})

test('the package root and node: built-ins imported for server code only (pushStore in a webhook, fs in a fetcher) are removed, as the old special-casing did', () => {
  const { code, removed } = strip(`import { pushStore } from '@invisibleloop/pulse'
import { md } from '@invisibleloop/pulse/md'
import crypto from 'node:crypto'
const hash = (x) => crypto.createHash('sha256').update(x).digest('hex')
const post = md('content/post.md')
export default {
  route: '/hooks', state: {}, mutations: { m: s => s }, view: () => '',
  submit: async (ctx) => { pushStore({ k: hash('SECRET_A') }) },
  server: { post },
}`)
  clean(code)
  assert.deepEqual(removed.imports.sort(), ['@invisibleloop/pulse', '@invisibleloop/pulse/md', 'node:crypto'])
  assert.ok(!/pushStore|crypto|\bmd\b/.test(code), `nothing of them is left:\n${code}`)
})

test('a variable with a side-effecting initialiser that nothing ever read is not deleted on a guess', () => {
  const { code } = strip(`import { register } from './plugin.js'
const _ = register()
export default { route: '/a', mutations: { m: s => s }, view: () => '', server: { k: () => 1 } }`)
  assert.ok(code.includes('register()') && code.includes("from './plugin.js'"))
})

// ── what it will not guess ──────────────────────────────────────────────────

test('it refuses, naming the file and line, when it cannot see the spec: spread, computed key, built or imported object', () => {
  const cases = [
    ['a spread',          `import base from './base.js'\nexport default {\n  ...base,\n  route: '/a', mutations: {}, view: () => '' }`, /spreads another object[\s\S]*`\.\.\.base`/, 3],
    ['a computed key',    `const k = 'server'\nexport default { [k]: () => 1, route: '/a', mutations: {}, view: () => '' }`, /computed property key/, 2],
    ['a call',            `export default defineSpec({ route: '/a', mutations: {}, view: () => '' })`, /not an object literal/, 1],
    ['an imported name',  `import spec from './spec.js'\nexport default spec`, /not declared in this file as a plain object/, 2],
    ['a non-object binding', `const spec = makeSpec()\nexport default spec`, /not bound to an object literal/, 2],
  ]
  for (const [label, src, message, line] of cases) {
    assert.throws(() => stripServerCode(src, { file: 'src/pages/x.js' }), (err) => {
      assert.ok(err instanceof StripError, `${label}: a StripError`)
      assert.match(err.message, /^src\/pages\/x\.js:\d+: /, `${label}: names the file and a line`)
      assert.match(err.message, message, label)
      assert.ok(err.message.startsWith(`src/pages/x.js:${line}:`), `${label}: line ${line}, got ${err.message.slice(0, 30)}`)
      return true
    })
  }
  assert.throws(() => stripServerCode('export default { route: "/a", view: () => {', { file: 'x.js' }), /could not parse this file/)
})

test('export forms it understands: a bound const, `export { spec as default }`; and a helper module with no default export is returned unchanged', () => {
  const a = strip(`const spec = { route: '/a', mutations: {}, server: { k: () => 'SECRET_A' }, view: () => '' }\nexport default spec`)
  clean(a.code); assert.ok(a.code.includes('const spec ='), 'the spec binding itself stays')
  const b = strip(`const spec = { route: '/a', mutations: {}, guard: () => 'SECRET_A', view: () => '' }\nexport { spec as default }`)
  clean(b.code)
  const helper = `export const x = 1\nexport function y() { return 'SECRET_A' }\n`
  assert.equal(strip(helper).code, helper, 'not a spec: untouched')
})

test('analyseSpec and needsClientBundle: a view plus client behaviour', () => {
  const need = (src) => needsClientBundle(analyseSpec(src))
  assert.equal(need(`export default { view: () => '', mutations: {} }`), true)
  assert.equal(need(`export default { view: () => '', actions: {} }`), true)
  assert.equal(need(`export default { view: () => '', persist: ['a'] }`), true)
  assert.equal(need(`export default { view: () => '', store: ['user'] }`), true)
  assert.equal(need(`export default { view: () => '', server: {} }`), false, 'a server-rendered page needs no bundle')
  assert.equal(need(`export default { view: () => '', submit: async () => 1 }`), false, 'a submit-only form needs no bundle')
  assert.equal(need(`export default { render: () => '', mutations: {} }`), false, 'no view: a raw response')
  assert.equal(need(`export default { ...x, view: () => '', mutations: {} }`), false, 'unanalysable is not "needs": the build decides separately')
  assert.deepEqual(SERVER_ONLY_KEYS.includes('submit') && SERVER_ONLY_KEYS.includes('server') && SERVER_ONLY_KEYS.includes('guard'), true)
})

// ── the real build ──────────────────────────────────────────────────────────

const BUILD = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build.js')

function project(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-strip-build-'))
  fs.mkdirSync(path.join(root, 'public'), { recursive: true })
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module"}')
  fs.writeFileSync(path.join(root, 'public', 'pulse-ui.css'), '')
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
  }
  return root
}
const build = (root) => spawnSync(process.execPath, [BUILD, '--root', root], { encoding: 'utf8', timeout: 60000, env: { ...process.env, PORT: '' } })
const distText = (root) => fs.readdirSync(path.join(root, 'public', 'dist')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(root, 'public', 'dist', f), 'utf8')).join('\n')
const META = `meta: { title: 't', description: 'd', theme: 'light' }`
const VIEW = `view: s => \`<main id="main-content"><button data-event="inc">\${s.n}</button></main>\``

test('the real build: no server-side secret reaches the public bundles, in any of the layouts the audit found', () => {
  const root = project({
    'src/lib/mailer.js': `const HELPER_SECRET = 'SECRET_HELPER'\nexport async function sendMail(x) { return [HELPER_SECRET, x] }\n`,
    'src/pages/submit.js':    `import { sendMail } from '../lib/mailer.js'\nexport default { route: '/submit', ${META}, state: { n: 0 }, mutations: { inc: s => ({ n: s.n + 1 }) },\n  submit: async () => { await sendMail('SECRET_SUBMIT') },\n  ${VIEW} }\n`,
    'src/pages/oneline.js':    `export default { route: '/oneline', ${META}, state: { n: 0 }, mutations: { inc: s => ({ n: s.n + 1 }) }, server: { k: async () => 'SECRET_ONELINE' }, ${VIEW} }\n`,
    'src/pages/quoted.js':    `export default { 'route': '/quoted', ${META}, state: { n: 0 }, mutations: { inc: s => ({ n: s.n + 1 }) }, 'server': { k: async () => 'SECRET_QUOTED' }, ${VIEW} }\n`,
    'src/pages/shorthand.js': `const server = { k: async () => 'SECRET_SHORTHAND' }\nconst guard = async () => 'SECRET_GUARD'\nexport default { route: '/shorthand', ${META}, state: { n: 0 }, mutations: { inc: s => ({ n: s.n + 1 }) }, server, guard, ${VIEW} }\n`,
    'src/pages/normal.js':    `export default {\n  route: '/normal', ${META}, state: { n: 0 },\n  mutations: { inc: s => ({ n: s.n + 1 }) },\n  server: {\n    k: async () => 'SECRET_NORMAL',\n  },\n  ${VIEW},\n}\n`,
  })
  try {
    const r = build(root)
    assert.equal(r.status, 0, `the build should succeed:\n${r.stdout}${r.stderr}`)
    const dist = distText(root)
    for (const secret of ['SECRET_HELPER', 'SECRET_SUBMIT', 'SECRET_ONELINE', 'SECRET_QUOTED', 'SECRET_SHORTHAND', 'SECRET_GUARD', 'SECRET_NORMAL']) {
      assert.ok(!dist.includes(secret), `${secret} reached the public bundle`)
    }
    assert.ok(dist.includes('mutations') || dist.includes('inc'), 'the client code is still there')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('the real build refuses (exit 1, the file and the reason, no stack trace) a page it cannot prove is stripped', () => {
  const root = project({
    'src/lib/base.js': `export default { server: { k: async () => 'SECRET_SPREAD' } }\n`,
    'src/pages/spread.js': `import base from '../lib/base.js'\nexport default {\n  ...base, route: '/spread', ${META}, state: { n: 0 }, mutations: { inc: s => ({ n: s.n + 1 }) }, ${VIEW} }\n`,
  })
  try {
    const r = build(root)
    assert.equal(r.status, 1, `exit code ${r.status}:\n${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /src\/pages\/spread\.js:3: this page spreads another object/)
    assert.ok(!/\n\s+at /.test(r.stderr), 'no stack trace')
    assert.ok(!fs.existsSync(path.join(root, 'public', 'dist', 'manifest.json')), 'and nothing was published')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('the real build leaves a spread page alone when it needs no browser bundle (nothing would ship)', () => {
  const root = project({
    'src/lib/base.js': `export default { server: { k: async () => 'SECRET_X' } }\n`,
    'src/pages/ssr.js': `import base from '../lib/base.js'\nexport default { ...base, route: '/ssr', ${META}, view: () => '<main id="main-content">hi</main>' }\n`,
  })
  try {
    const r = build(root)
    assert.equal(r.status, 0, `a server-rendered page with a spread is fine:\n${r.stdout}${r.stderr}`)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('the real build fails (exit 1, file and reason) when a page cannot be loaded, instead of printing "Build complete"', () => {
  const root = project({
    'src/pages/good.js': `export default { route: '/good', ${META}, view: () => '<main id="main-content">ok</main>' }\n`,
    'src/lib/ui.js': `export const stillHere = () => ''\n`,
    'src/pages/broken.js': `import { removedComponent } from '../lib/ui.js'\nexport default { route: '/broken', ${META}, view: () => removedComponent() }\n`,
  })
  try {
    const r = build(root)
    assert.equal(r.status, 1, `exit code ${r.status}:\n${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /src\/pages\/broken\.js could not be loaded: .*removedComponent/)
    assert.ok(!/Build complete/.test(r.stdout), 'must not claim success')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
