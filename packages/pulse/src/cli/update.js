/**
 * Pulse — helpers for `pulse update`.
 *
 * `pulse update` first upgrades the package in the project, then re-copies its
 * assets. Only the first step is decided here; the copy lives in index.js.
 */

import fs   from 'fs'
import path from 'path'

export const PACKAGE = '@invisibleloop/pulse'

/**
 * True when the running CLI is the copy installed in `root/node_modules`.
 * A global install or an `npm link` to a dev checkout resolves elsewhere, and
 * must not be "upgraded" through the project's package.json.
 */
export function isInstalledInProject(pkgDir, root) {
  try {
    const installed = fs.realpathSync(path.join(root, 'node_modules', PACKAGE))
    if (fs.realpathSync(pkgDir) !== installed) return false
    // pnpm symlinks into node_modules/.pnpm; an `npm link` points outside it.
    const modules = fs.realpathSync(path.join(root, 'node_modules'))
    return installed.startsWith(modules + path.sep)
  } catch {
    return false
  }
}

/** [command, args] that upgrades the package with the project's package manager. */
export function installCommand(root) {
  const has = f => fs.existsSync(path.join(root, f))
  if (has('pnpm-lock.yaml')) return ['pnpm', ['add', `${PACKAGE}@latest`]]
  if (has('yarn.lock'))      return ['yarn', ['add', `${PACKAGE}@latest`]]
  return ['npm', ['install', `${PACKAGE}@latest`]]
}

/** [command, args] that installs `packages` as development dependencies. */
export function devInstallCommand(root, packages) {
  const has = f => fs.existsSync(path.join(root, f))
  if (has('pnpm-lock.yaml')) return ['pnpm', ['add', '-D', ...packages]]
  if (has('yarn.lock'))      return ['yarn', ['add', '-D', ...packages]]
  return ['npm', ['install', '-D', ...packages]]
}
