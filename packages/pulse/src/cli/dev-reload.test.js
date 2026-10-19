/**
 * Pulse — `pulse dev` hot reload of modules a page imports
 * run: node src/cli/dev-reload.test.js
 *
 * Only the page file used to be re-imported on a change; Node's ESM cache kept the old
 * copy of everything the page imports, so editing src/lib or src/components appeared to
 * do nothing until the server was restarted (reported by an agent, #159). This starts the
 * real dev script and edits real files.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs   from 'node:fs'
import net  from 'node:net'
import os   from 'node:os'
import path from 'node:path'

const DEV = new URL('./dev.js', import.meta.url).pathname

const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)) })
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

function write(dir, rel, text) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel), text)
}

function project(...below) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-dev-reload-'))
  const dir  = path.join(base, ...below)
  fs.mkdirSync(dir, { recursive: true })
  write(dir, 'src/lib/word.js', "import { suffix } from './deep.js'\nexport const word = 'one' + suffix\n")
  write(dir, 'src/lib/deep.js', "export const suffix = '-a'\n")
  write(dir, 'src/components/tag.js', "export const tag = () => 'tag-1'\n")
  // A "package" under node_modules: must be evaluated once, not once per reload.
  write(dir, 'node_modules/counted/package.json', '{"name":"counted","type":"module","main":"index.js"}')
  write(dir, 'node_modules/counted/index.js', "globalThis.__counted = (globalThis.__counted || 0) + 1\nexport const loads = () => globalThis.__counted\n")
  write(dir, 'src/pages/index.js', [
    "import { word } from '../lib/word.js'",
    "import { tag } from '../components/tag.js'",
    "import { loads } from 'counted'",
    "export default { route: '/', meta: { title: 'T', description: 'd', theme: 'dark' },",
    "  view: () => `<main id=\"main-content\"><h1>${word}</h1><p id=\"tag\">${tag()}</p><i id=\"loads\">${loads()}</i></main>` }",
  ].join('\n'))
  return { dir, base }
}

async function get(port) {
  const html = await (await fetch(`http://127.0.0.1:${port}/`)).text()
  const pick = id => html.match(new RegExp(`<(?:h1|p|i)[^>]*${id === 'h1' ? '' : `id="${id}"`}[^>]*>([^<]*)<`))?.[1]
  return { h1: html.match(/<h1>([^<]*)<\/h1>/)?.[1], tag: pick('tag'), loads: Number(pick('loads')) }
}

async function until(fn, what) {
  let last
  for (let i = 0; i < 60; i++) { last = await fn().catch(() => null); if (last?.ok) return last.value; await sleep(150) }
  assert.fail(`timed out waiting for ${what}; last: ${JSON.stringify(last?.value)}`)
}

async function scenario(...below) {
  const { dir, base } = project(...below)
  const port = await freePort()
  const proc = spawn(process.execPath, [DEV, '--root', dir, '--port', String(port)], { stdio: 'ignore' })
  try {
    const first = await until(async () => { const v = await get(port); return { ok: v.h1 === 'one-a', value: v } }, 'first render')
    assert.equal(first.tag, 'tag-1')

    write(dir, 'src/lib/word.js', "import { suffix } from './deep.js'\nexport const word = 'two' + suffix\n")
    const afterDirect = await until(async () => { const v = await get(port); return { ok: v.h1 === 'two-a', value: v } }, 'edit to a directly imported module')

    write(dir, 'src/lib/deep.js', "export const suffix = '-b'\n")
    await until(async () => { const v = await get(port); return { ok: v.h1 === 'two-b', value: v } }, 'edit to a module imported by a module')

    write(dir, 'src/components/tag.js', "export const tag = () => 'tag-2'\n")
    const afterComponent = await until(async () => { const v = await get(port); return { ok: v.tag === 'tag-2', value: v } }, 'edit to a component')

    // Reloading must not re-evaluate packages: only the project's own modules are refreshed.
    assert.equal(afterDirect.loads, first.loads, 'a node_modules package was re-evaluated on reload')
    assert.equal(afterComponent.loads, first.loads, 'a node_modules package was re-evaluated on reload')
  } finally {
    proc.kill('SIGKILL')
    fs.rmSync(base, { recursive: true, force: true })
  }
}

test('editing a module a page imports (direct, nested, component) shows up without a restart', () => scenario())

// A path with a space (URLs are percent-encoded) and one under a node_modules folder.
test('hot reload also works when the project path has a space or sits under node_modules', () => scenario('my app', 'node_modules', 'site'))
