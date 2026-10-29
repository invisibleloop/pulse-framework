/**
 * The generated UI types — run with: node scripts/gen-ui-types.test.js
 *
 * types/ui.d.ts and types/charts.d.ts are generated from the components. These tests keep it so,
 * and check the generator against the runtime on the cases that had drifted.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import path     from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generate } from './gen-ui-types.js'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('types/ui.d.ts and types/charts.d.ts are exactly what the generator produces from the components (run `npm run gen:types`)', () => {
  for (const [rel, text] of Object.entries(generate())) {
    assert.equal(fs.readFileSync(path.join(PKG, rel), 'utf8'), text, `${rel} is out of date: run npm run gen:types`)
  }
})

test('every function exported by the UI index has a declaration, and every declaration is exported at runtime', async () => {
  const runtime = await import(pathToFileURL(path.join(PKG, 'src/ui/index.js')).href)
  const declared = new Set([...fs.readFileSync(path.join(PKG, 'types/ui.d.ts'), 'utf8').matchAll(/^export function (\w+)\(/gm)].map(m => m[1]))
  const exported = new Set(Object.keys(runtime).filter(k => typeof runtime[k] === 'function'))
  assert.deepEqual([...exported].filter(n => !declared.has(n)), [], 'exported at runtime but not declared')
  assert.deepEqual([...declared].filter(n => !exported.has(n)), [], 'declared but not exported at runtime')
})

test('the declared props are the props the component reads: hero, media, grid, cta, checkbox (the ones the old hand-written types got wrong)', () => {
  const dts = fs.readFileSync(path.join(PKG, 'types/ui.d.ts'), 'utf8')
  const props = (name) => {
    const block = dts.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
    return [...block.matchAll(/^\s{2}(\w+)\?:/gm)].map(m => m[1])
  }
  for (const p of ['eyebrow', 'title', 'subtitle', 'actions', 'image', 'layout']) assert.ok(props('HeroProps').includes(p), `hero.${p}`)
  for (const wrong of ['heading', 'subheading', 'media']) assert.ok(!props('HeroProps').includes(wrong), `hero must not declare ${wrong}`)
  assert.ok(props('GridProps').includes('content') && !props('GridProps').includes('items'))
  assert.ok(props('MediaProps').includes('image') && !props('MediaProps').includes('src'))
  assert.ok(props('AlertProps').includes('message') && props('AlertProps').includes('content'))
  assert.ok(props('CheckboxProps').length > 0, 'checkbox is declared')
})
