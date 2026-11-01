/**
 * The build's CSS step renders each page once. These tests run the real build on a small project
 * and check what that render does to server fetchers, and that css.renderPages: false skips it.
 * Run with: node scripts/build-render.test.js
 */
import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const BUILD = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build.js')

function project({ config = null } = {}) {
  const root   = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-build-render-'))
  const marker = path.join(root, 'fetcher-ran.json')
  const files = {
    'package.json': '{"name":"p","type":"module"}',
    'public/pulse-ui.css': '',
    'public/app.css': '.keep-page{color:red}.keep-helper{color:blue}.keep-component{color:green}.drop-me{color:black}',
    // The helper holds a class name that the page file does not spell out.
    'src/lib/helper.js': `export const helperClass = 'keep-helper'\n`,
    'src/components/box.js': `export const box = () => '<div class="keep-component"></div>'\n`,
    'src/pages/home.js': [
      `import fs from 'node:fs'`,
      `import { helperClass } from '../lib/helper.js'`,
      `import { box } from '../components/box.js'`,
      `export default {`,
      `  route: '/',`,
      `  meta: { title: 't', description: 'A page for the build test.', theme: 'light', styles: ['/app.css'] },`,
      // The marker path comes from the environment, so no path is built into this source.
      `  server: { probe: async (ctx) => { fs.writeFileSync(process.env.PULSE_TEST_MARKER, JSON.stringify({ build: ctx.build, env: process.env.PULSE_BUILD })); return 1 } },`,
      '  view: () => `<main id="main-content" class="keep-page ${helperClass}">${box()}</main>`,',
      `}`,
      '',
    ].join('\n'),
  }
  if (config) files['pulse.config.js'] = config
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
  }
  return { root, marker }
}

const build = (root, marker) => spawnSync(process.execPath, [BUILD, '--root', root], { encoding: 'utf8', timeout: 90000, env: { ...process.env, PORT: '', PULSE_TEST_MARKER: marker } })
const builtCss = (root) => {
  const dist = path.join(root, 'public', 'dist')
  const file = fs.readdirSync(dist).find(f => /^app-.*\.css$/.test(f))
  return fs.readFileSync(path.join(dist, file), 'utf8')
}

test('by default the build renders each page, so a fetcher runs with ctx.build and PULSE_BUILD set, and the build says so', () => {
  const { root, marker } = project()
  try {
    const r = build(root, marker)
    assert.equal(r.status, 0, `the build should succeed:\n${r.stdout}${r.stderr}`)
    assert.deepEqual(JSON.parse(fs.readFileSync(marker, 'utf8')), { build: true, env: '1' }, 'the fetcher can tell it runs inside the build')
    assert.match(r.stdout, /ran your server fetchers with ctx\.build = true/)
    assert.match(r.stdout, /css: \{ renderPages: false \}/)
    const css = builtCss(root)
    for (const kept of ['keep-page', 'keep-helper', 'keep-component']) assert(css.includes(kept), `${kept} must survive`)
    assert(!css.includes('drop-me'), 'a class nothing uses is still removed')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('css.renderPages: false calls no fetcher during the build, and still keeps classes used in components and helper files', () => {
  const { root, marker } = project({ config: `export default { css: { renderPages: false } }\n` })
  try {
    const r = build(root, marker)
    assert.equal(r.status, 0, `the build should succeed:\n${r.stdout}${r.stderr}`)
    assert.equal(fs.existsSync(marker), false, 'no server fetcher may run during the build')
    assert.doesNotMatch(r.stdout, /ran your server fetchers/, 'there is nothing to warn about')
    const css = builtCss(root)
    for (const kept of ['keep-page', 'keep-helper', 'keep-component']) assert(css.includes(kept), `${kept} must survive without the render (the whole src/ folder is scanned)`)
    assert(!css.includes('drop-me'), 'a class nothing uses is still removed')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
