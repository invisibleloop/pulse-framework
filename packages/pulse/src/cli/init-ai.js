/**
 * Pulse — `pulse init-ai <client>`: the MCP configuration for an AI client that `pulse` does not
 * launch itself.
 *
 * `pulse` starts Claude Code and Copilot with the config written for them. Cursor, Windsurf and
 * Claude Desktop read their own config files, so a person edited JSON by hand. This prints the
 * entry and the file it belongs in. With --write it merges the entry into the file, except for
 * Windsurf, whose docs name two files and do not say which one applies.
 *
 * Formats are from each client's own docs: Cursor (cursor.com/docs/context/mcp), Claude Desktop
 * (modelcontextprotocol.io/quickstart/user) and Windsurf (docs.windsurf.com/plugins/cascade/mcp).
 */

import fs   from 'fs'
import path from 'path'

export const CLIENTS = ['cursor', 'windsurf', 'claude-desktop']

/** The `pulse` server entry for a client. Paths are absolute: the client starts it from anywhere. */
export function serverEntry(client, { root, serverPath, nodeArgs = [], execPath = process.execPath }) {
  const entry = { command: execPath, args: [...nodeArgs, serverPath, '--root', root] }
  // Cursor's docs list `type` as required for a stdio server, though their examples omit it.
  return client === 'cursor' ? { type: 'stdio', ...entry } : entry
}

/**
 * Where a client keeps its MCP config.
 *
 * @returns {{ writable: boolean, files: { label: string, file: string }[], after: string, note?: string }}
 */
export function configTargets(client, { root, home, platform = process.platform, appData = process.env.APPDATA, xdg = process.env.XDG_CONFIG_HOME }) {
  if (client === 'cursor') {
    return {
      writable: true,
      files: [
        { label: 'project', file: path.join(root, '.cursor', 'mcp.json') },
        { label: 'global',  file: path.join(home, '.cursor', 'mcp.json') },
      ],
      after: 'Cursor lists the server under Customize in the sidebar. Turn it on there. If it does not appear, restart Cursor.',
    }
  }
  if (client === 'claude-desktop') {
    const file = platform === 'darwin'
      ? path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : platform === 'win32'
        ? path.join(appData || path.join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
        : path.join(home, '.config', 'Claude', 'claude_desktop_config.json')
    return {
      writable: true,
      files: [{ label: 'global', file }],
      after: 'Quit Claude Desktop completely and start it again. It reads the file only at start.',
    }
  }
  if (client === 'windsurf') {
    const devin = platform === 'win32'
      ? path.join(appData || path.join(home, 'AppData', 'Roaming'), 'devin', 'mcp_config.json')
      : path.join(xdg || path.join(home, '.config'), 'devin', 'mcp_config.json')
    return {
      writable: false,
      files: [
        { label: 'Cascade',   file: devin },
        { label: 'discovery', file: path.join(home, '.codeium', 'windsurf', 'mcp_config.json') },
      ],
      after: 'Press the refresh button in Cascade\'s MCP panel after you save the file.',
      note: 'The Windsurf docs name two files and do not say which one your install reads. ' +
        'Use the file that Cascade\'s "Open MCP config file" action opens, and add the entry to it. ' +
        'Pulse does not write either file for you.',
    }
  }
  throw new Error(`Unknown client "${client}"`)
}

/**
 * Add or replace the `pulse` entry in a client's config text, and keep everything else in it.
 *
 * @param {string|null} existing the file's text, or null when there is no file
 * @returns {{ ok: true, text: string, replaced: boolean } | { ok: false, reason: string }}
 */
export function mergeEntry(existing, entry) {
  let config = {}
  if (existing !== null && existing.trim() !== '') {
    try { config = JSON.parse(existing) } catch { return { ok: false, reason: 'is not valid JSON, so Pulse will not change it' } }
    if (config === null || typeof config !== 'object' || Array.isArray(config)) return { ok: false, reason: 'does not hold a JSON object, so Pulse will not change it' }
  }
  if (config.mcpServers === undefined) config.mcpServers = {}
  if (config.mcpServers === null || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) {
    return { ok: false, reason: 'has an "mcpServers" value that is not an object, so Pulse will not change it' }
  }
  const replaced = 'pulse' in config.mcpServers
  config.mcpServers.pulse = entry
  return { ok: true, text: JSON.stringify(config, null, 2) + '\n', replaced }
}

/** The snippet to show: a whole config file holding only the pulse entry. */
export function snippet(entry) {
  return JSON.stringify({ mcpServers: { pulse: entry } }, null, 2)
}

/**
 * Write the merged config. The old file is copied to `<file>.pulse-backup` first. Returns what
 * happened, for the caller to print.
 */
export function writeConfig(file, entry) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  const merged = mergeEntry(existing, entry)
  if (!merged.ok) return { wrote: false, reason: `${file} ${merged.reason}` }
  let backup = null
  if (existing !== null) {
    backup = `${file}.pulse-backup`
    fs.writeFileSync(backup, existing)
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, merged.text)
  return { wrote: true, replaced: merged.replaced, backup }
}

/** Add `line` to the project's .gitignore when the project has one and does not list it. */
export function ignoreInGit(root, line) {
  const file = path.join(root, '.gitignore')
  if (!fs.existsSync(file)) return false
  const text = fs.readFileSync(file, 'utf8')
  if (text.split('\n').some(l => l.trim() === line)) return false
  fs.writeFileSync(file, text.replace(/\n*$/, '\n') + line + '\n')
  return true
}
