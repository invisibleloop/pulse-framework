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

/** -1, 0 or 1 comparing two MAJOR.MINOR.PATCH versions (a prerelease suffix is ignored). */
export function compareVersions(a, b) {
  const parts = v => String(v).split('-')[0].split('.').map(n => parseInt(n, 10) || 0)
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0) ? -1 : 1
  }
  return 0
}

/** The latest published version of the package, or null when the registry cannot be reached. */
export async function latestPublished(fetchImpl = fetch, timeoutMs = 3000) {
  try {
    const res = await fetchImpl(`https://registry.npmjs.org/${PACKAGE.replace('/', '%2f')}/latest`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const { version } = await res.json()
    return typeof version === 'string' ? version : null
  } catch {
    return null
  }
}

/**
 * What to tell the user when `pulse update` ran from a global or linked install. Such a copy cannot
 * upgrade itself or the project; it only re-copies its own assets, and saying "updated" would be
 * wrong when it is the stale one.
 */
export function notInProjectNotice(cliVersion, latest) {
  const behind = latest && compareVersions(cliVersion, latest) < 0
  return [
    `This \`pulse\` (v${cliVersion}) is a global or linked install, not a copy installed in this project, so \`pulse update\``,
    `only re-copied its own assets. It cannot upgrade Pulse.` + (behind ? ` The latest published version is v${latest}.` : ''),
    ``,
    `To upgrade:`,
    `  npm install -g ${PACKAGE}@latest      # the CLI`,
    `  npm install ${PACKAGE}@latest         # in this project, so it has its own copy`,
    `then run \`pulse update\` again.`,
  ].join('\n')
}
