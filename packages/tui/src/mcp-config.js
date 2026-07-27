/**
 * Pulse TUI — MCP config writer
 *
 * Mirrors the exact pattern the `pulse` CLI itself uses (src/cli/index.js's
 * launchClaudeSession) to give Claude Code access to the Pulse MCP tools
 * (pulse_validate, pulse_review, guide resources, etc.) for a project.
 *
 * @invisibleloop/pulse's package.json exports don't publish a subpath for
 * its own package root (only specific runtime entry points like './server',
 * './ui'), so the install location is derived by resolving a real exported
 * entry point and walking up from it, rather than resolving package.json
 * directly.
 */

import fs   from 'node:fs'
import os   from 'node:os'
import path from 'node:path'

/**
 * @param {string} projectRoot - Absolute path to the Pulse project directory
 * @returns {Promise<string>} Path to a temp MCP config JSON file
 */
export async function writeMcpConfig(projectRoot) {
  const serverEntry = import.meta.resolve('@invisibleloop/pulse')
  const serverEntryPath = new URL(serverEntry).pathname
  // serverEntryPath is .../@invisibleloop/pulse/src/server/index.js — walk up
  // two levels (src/server/ -> package root) then into src/mcp/server.js.
  const packageRoot = path.resolve(path.dirname(serverEntryPath), '..', '..')
  const mcpServerPath = path.join(packageRoot, 'src', 'mcp', 'server.js')

  if (!fs.existsSync(mcpServerPath)) {
    throw new Error(`Could not find Pulse MCP server at ${mcpServerPath} — is @invisibleloop/pulse installed correctly?`)
  }

  const mcpConfig = {
    mcpServers: {
      pulse: {
        command: process.execPath,
        args:    [mcpServerPath, '--root', projectRoot],
      },
    },
  }

  const configPath = path.join(os.tmpdir(), `pulse-tui-mcp-${Date.now()}.json`)
  fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2))
  return configPath
}
