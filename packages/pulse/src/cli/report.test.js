/**
 * Pulse — report.js tests
 * run: node src/cli/report.test.js
 *
 * /verify saves one Lighthouse report per device under the same route slug. Before the device was
 * recorded, the desktop and the mobile report could not be told apart, and two saves in the same
 * millisecond wrote one file.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import fs         from 'node:fs'
import os         from 'node:os'
import path       from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { saveReport } from './report.js'

const script = fileURLToPath(new URL('./report.js', import.meta.url))
const tmpRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-report-test-'))
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))

test('saveReport records the device in the report', () => {
  const root = tmpRoot()
  const { file } = saveReport(root, 'http://localhost:3001/about', { seo: 100 }, { cls: 0 }, 'mobile')
  assert.equal(read(file).device, 'mobile')
  fs.rmSync(root, { recursive: true, force: true })
})

test('a desktop and a mobile report saved together are two files, not one', () => {
  const root = tmpRoot()
  const a = saveReport(root, 'http://localhost:3001/about', {}, {}, 'desktop')
  const b = saveReport(root, 'http://localhost:3001/about', {}, {}, 'mobile')
  assert.notEqual(a.file, b.file)
  assert.equal(fs.readdirSync(path.dirname(a.file)).length, 2)
  fs.rmSync(root, { recursive: true, force: true })
})

test('a report saved without a device keeps the old shape', () => {
  const root = tmpRoot()
  const { file } = saveReport(root, 'http://localhost:3001/about', {}, {})
  assert.equal('device' in read(file), false)
  fs.rmSync(root, { recursive: true, force: true })
})

test('the CLI takes --device and refuses a value that is not a device', () => {
  const root = tmpRoot()
  const run = (...extra) => spawnSync(process.execPath, [script, '--root', root, '--url', 'http://localhost:3001/', '--data', '{"scores":{},"metrics":{}}', ...extra], { encoding: 'utf8' })

  const ok = run('--device', 'desktop')
  assert.equal(ok.status, 0)
  assert.match(ok.stdout, /desktop report saved/)

  const bad = run('--device', 'tablet')
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /must be "desktop" or "mobile"/)
  fs.rmSync(root, { recursive: true, force: true })
})
