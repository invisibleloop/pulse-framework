/**
 * Pulse — update.js tests
 * run: node src/cli/update.test.js
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import { isInstalledInProject, projectCopyDir, linkedToInstalledCopy, installCommand, devInstallCommand, compareVersions, latestPublished, notInProjectNotice, confirm, PACKAGE } from './update.js'

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

test('devInstallCommand adds development dependencies with the project\'s package manager', () => {
  const root = tmp()
  const pkgs = ['@modelcontextprotocol/sdk', 'zod']
  assert.deepEqual(devInstallCommand(root, pkgs), ['npm', ['install', '-D', ...pkgs]])
  fs.writeFileSync(path.join(root, 'yarn.lock'), '')
  assert.deepEqual(devInstallCommand(root, pkgs), ['yarn', ['add', '-D', ...pkgs]])
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), '')
  assert.deepEqual(devInstallCommand(root, pkgs), ['pnpm', ['add', '-D', ...pkgs]])
})

test('compareVersions orders MAJOR.MINOR.PATCH numerically', () => {
  assert.equal(compareVersions('0.22.1', '0.25.0'), -1)
  assert.equal(compareVersions('0.25.0', '0.25.0'), 0)
  assert.equal(compareVersions('0.25.1', '0.25.0'), 1)
  assert.equal(compareVersions('0.9.0', '0.10.0'), -1, 'numeric, not lexical')
  assert.equal(compareVersions('1.0.0', '0.99.99'), 1)
  assert.equal(compareVersions('0.25.0-rc.1', '0.25.0'), 0, 'a prerelease suffix is ignored')
})

test('latestPublished returns the registry version, and null on any failure', async () => {
  assert.equal(await latestPublished(async () => ({ ok: true, json: async () => ({ version: '0.25.0' }) })), '0.25.0')
  let url
  await latestPublished(async u => { url = u; return { ok: false } })
  assert.equal(url, 'https://registry.npmjs.org/%40invisibleloop%2Fpulse/latest', 'the scoped name is fully encoded')
  assert.equal(await latestPublished(async () => ({ ok: false })), null)
  assert.equal(await latestPublished(async () => { throw new Error('offline') }), null)
  assert.equal(await latestPublished(async () => ({ ok: true, json: async () => ({}) })), null)
})

test('the global/linked notice says it did not upgrade, names the latest version when behind, and gives both commands', () => {
  const behind = notInProjectNotice('0.22.1', '0.25.0')
  assert.match(behind, /v0\.22\.1/)
  assert.match(behind, /cannot upgrade Pulse/)
  assert.match(behind, /latest published version is v0\.25\.0/)
  assert.match(behind, /npm install -g @invisibleloop\/pulse@latest/)
  assert.match(behind, /npm install @invisibleloop\/pulse@latest/)
  assert.doesNotMatch(notInProjectNotice('0.25.0', '0.25.0'), /latest published version/, 'no "latest is" line when already current')
  assert.doesNotMatch(notInProjectNotice('0.22.1', null), /latest published version/, 'offline: no claim about the latest')
})

test('projectCopyDir: the project\'s own copy is found whichever CLI is running; a dev link is not one', () => {
  const root = tmp()
  assert.equal(projectCopyDir(root), null, 'no install at all')
  const real = path.join(root, 'node_modules', PACKAGE)
  fs.mkdirSync(real, { recursive: true })
  assert.equal(projectCopyDir(root), fs.realpathSync(real), 'a real install is the project\'s copy')

  const linked = tmp(), dev = tmp()
  fs.mkdirSync(path.join(linked, 'node_modules', '@invisibleloop'), { recursive: true })
  fs.symlinkSync(dev, path.join(linked, 'node_modules', PACKAGE), 'junction')
  assert.equal(projectCopyDir(linked), null, 'an npm link to a dev checkout is never upgraded through the project')

  const pnpm = tmp()
  const store = path.join(pnpm, 'node_modules', '.pnpm', 'pulse', 'node_modules', PACKAGE)
  fs.mkdirSync(store, { recursive: true })
  fs.mkdirSync(path.join(pnpm, 'node_modules', '@invisibleloop'), { recursive: true })
  fs.symlinkSync(store, path.join(pnpm, 'node_modules', PACKAGE), 'junction')
  assert.equal(projectCopyDir(pnpm), fs.realpathSync(store), 'pnpm\'s link into node_modules/.pnpm is a real install')
})

test('confirm: y/n/default answer, and end of input is null, never consent (Ctrl-D used to abandon pulse update)', async () => {
  const { PassThrough } = await import('node:stream')
  const ask = async (feed, opts = {}) => {
    const input = new PassThrough(), output = new PassThrough()
    const p = confirm('ok? ', { input, output, ...opts })
    feed(input)
    return p
  }
  assert.equal(await ask(i => i.write('y\n')), true)
  assert.equal(await ask(i => i.write('YES\n')), true)
  assert.equal(await ask(i => i.write('n\n')), false)
  assert.equal(await ask(i => i.write('\n')), true, 'an empty answer takes the default (Y)')
  assert.equal(await ask(i => i.write('\n'), { defaultYes: false }), false)
  assert.equal(await ask(i => i.end()), null, 'EOF with no answer settles, as null')
})

test('linkedToInstalledCopy: a link to a global install is converted, a link to a dev checkout never is', () => {
  const root = tmp()
  const modulesDir = path.join(root, 'node_modules', '@invisibleloop')
  fs.mkdirSync(modulesDir, { recursive: true })
  assert.equal(linkedToInstalledCopy(root), false, 'nothing installed')

  const globalInstall = path.join(tmp(), 'lib', 'node_modules', '@invisibleloop', 'pulse')   // what `npm install -g` makes
  fs.mkdirSync(globalInstall, { recursive: true })
  fs.symlinkSync(globalInstall, path.join(modulesDir, 'pulse'), 'junction')
  assert.equal(linkedToInstalledCopy(root), true, 'a link into a node_modules directory is a link to an installed copy')

  const other = tmp(), checkout = path.join(tmp(), 'src', 'pulse', 'packages', 'pulse')    // a dev checkout: no node_modules in its path
  fs.mkdirSync(checkout, { recursive: true })
  fs.mkdirSync(path.join(other, 'node_modules', '@invisibleloop'), { recursive: true })
  fs.symlinkSync(checkout, path.join(other, 'node_modules', '@invisibleloop', 'pulse'), 'junction')
  assert.equal(linkedToInstalledCopy(other), false, 'an npm link to a dev checkout must never be replaced')

  const real = tmp()
  fs.mkdirSync(path.join(real, 'node_modules', '@invisibleloop', 'pulse'), { recursive: true })
  assert.equal(linkedToInstalledCopy(real), false, 'a real directory is not a link')
})
