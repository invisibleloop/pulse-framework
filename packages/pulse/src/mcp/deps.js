/**
 * Pulse — the MCP server's optional dependencies.
 *
 * The agent tools need @modelcontextprotocol/sdk and zod, but only while developing: a served
 * app never loads them. They are optional peer dependencies of this package, and new projects
 * list them under devDependencies, so a production install carries none of their ~90 packages.
 *
 * This file imports neither of them, so it is safe to load when they are absent.
 *
 * Where they are looked up matters. A global `pulse` install leaves the project's own copy of this
 * package as a symlink into the global install, and Node resolves imports from a symlink's real
 * location, which would never see the project's node_modules. So the CLI starts the MCP server from
 * the project's copy with --preserve-symlinks, which makes it resolve from the project instead.
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export const MCP_PACKAGES = ['@modelcontextprotocol/sdk', 'zod']

/**
 * `name@range` for each package, using the ranges this package declares as peers, so an install
 * never picks a version outside them (a future SDK major would otherwise fail npm's peer check).
 */
export function mcpInstallSpecs() {
  const { peerDependencies = {} } = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  return MCP_PACKAGES.map(name => peerDependencies[name] ? `${name}@${peerDependencies[name]}` : name)
}

/** Quote an argument for display in a shell command line (only when it needs it). */
export function shellQuote(arg) {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`
}

// Resolved from this file, which is where the real imports in server.js resolve from too.
const PROBES = { '@modelcontextprotocol/sdk': '@modelcontextprotocol/sdk/server/mcp.js', zod: 'zod' }

/**
 * How to start the MCP server for a project: the project's own installed copy when there is one
 * (resolving the SDK from the project, see above), otherwise the copy this CLI is running from.
 */
export function mcpServerLaunch(root) {
  const local = path.join(root, 'node_modules', '@invisibleloop', 'pulse', 'src', 'mcp', 'server.js')
  if (fs.existsSync(local)) return { serverPath: local, nodeArgs: ['--preserve-symlinks', '--preserve-symlinks-main'], viaProject: true }
  return { serverPath: fileURLToPath(new URL('./server.js', import.meta.url)), nodeArgs: [], viaProject: false }
}

/** True when `pkg` is installed in `root`'s node_modules or any parent directory's. */
export function installedFrom(root, pkg) {
  for (let dir = path.resolve(root); ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules', pkg, 'package.json'))) return true
    if (path.dirname(dir) === dir) return false
  }
}

/**
 * The MCP_PACKAGES the server would not find if started for `root` (see mcpServerLaunch): looked up
 * in the project when its own copy is used, from this file's location otherwise.
 */
export function mcpDepsMissingFor(root) {
  return mcpServerLaunch(root).viaProject
    ? MCP_PACKAGES.filter(pkg => !installedFrom(root, pkg))
    : mcpDepsMissing()
}

/** The MCP_PACKAGES that cannot be resolved from here. */
export function mcpDepsMissing(resolve = spec => import.meta.resolve(spec)) {
  return MCP_PACKAGES.filter(pkg => {
    try { resolve(PROBES[pkg]); return false } catch { return true }
  })
}

/**
 * The message shown when the agent tools cannot start. `withPulse` is for a project that has no
 * copy of Pulse of its own: the tools would still run from the global install, which cannot see
 * the project's node_modules, so Pulse itself has to be installed there too.
 */
export function mcpMissingMessage(missing, { withPulse = false } = {}) {
  const pkgs = [...(withPulse ? ['@invisibleloop/pulse'] : []), ...mcpInstallSpecs()].map(shellQuote)
  return [
    `Pulse's agent tools need ${missing.join(' and ')}, which are development dependencies and are not installed here.`,
    `Install them in your project:`,
    ``,
    `  npm install -D ${pkgs.join(' ')}`,
    ``,
    `(or \`pnpm add -D\` / \`yarn add -D\`). \`pulse update\` offers to do this for you.`,
  ].join('\n')
}

/**
 * Load the SDK and zod, or print how to install them and exit. Written to stderr: when this runs
 * inside the MCP server, stdout is the protocol channel.
 */
export async function loadMcpDeps() {
  const missing = mcpDepsMissing()
  if (missing.length) {
    console.error('\n' + mcpMissingMessage(missing) + '\n')
    process.exit(1)
  }
  const [{ McpServer }, { StdioServerTransport }, { z }] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/mcp.js'),
    import('@modelcontextprotocol/sdk/server/stdio.js'),
    import('zod'),
  ])
  return { McpServer, StdioServerTransport, z }
}
