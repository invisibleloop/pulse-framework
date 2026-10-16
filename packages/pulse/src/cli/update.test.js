/**
 * Pulse — update.js tests
 * run: node src/cli/update.test.js
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import { isInstalledInProject, installCommand, PACKAGE } from './update.js'

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-update-')) }

test('isInstalledInProject: true for the copy in the project node_modules', () => {
  const root = tmp()
  const pkg  = path.join(root, 'node_modules', PACKAGE)
  fs.mkdirSync(pkg, { recursive: true })
  assert.equal(isInstalledInProject(pkg, root), true)
})

test('isInstalledInProject: false for a linked dev checkout, a global install, or no install', () => {
  const root = tmp()
  const dev  = tmp()
  fs.mkdirSync(path.join(root, 'node_modules', '@invisibleloop'), { recursive: true })
  assert.equal(isInstalledInProject(dev, root), false)               // not installed at all
  fs.symlinkSync(dev, path.join(root, 'node_modules', PACKAGE))       // npm link
  assert.equal(isInstalledInProject(dev, root), false)                // never replace a dev link
  assert.equal(isInstalledInProject(tmp(), root), false)              // a different (global) copy
})

test('isInstalledInProject: true for a pnpm-style symlink into node_modules/.pnpm', () => {
  const root  = tmp()
  const store = path.join(root, 'node_modules', '.pnpm', 'pulse', 'node_modules', PACKAGE)
  fs.mkdirSync(store, { recursive: true })
  fs.mkdirSync(path.join(root, 'node_modules', '@invisibleloop'), { recursive: true })
  fs.symlinkSync(store, path.join(root, 'node_modules', PACKAGE))
  assert.equal(isInstalledInProject(store, root), true)
})

test('installCommand follows the project lockfile', () => {
  const root = tmp()
  assert.deepEqual(installCommand(root), ['npm', ['install', `${PACKAGE}@latest`]])
  fs.writeFileSync(path.join(root, 'yarn.lock'), '')
  assert.deepEqual(installCommand(root), ['yarn', ['add', `${PACKAGE}@latest`]])
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), '')
  assert.deepEqual(installCommand(root), ['pnpm', ['add', `${PACKAGE}@latest`]])
})
