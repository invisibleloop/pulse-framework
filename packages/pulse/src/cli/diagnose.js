/**
 * Pulse — Error journal diagnostics (shared logic)
 *
 * The single source of truth for reading and resolving .pulse/errors.json.
 * Used by both pulse_diagnose/pulse_resolve_error (MCP tools, for an agent)
 * and `pulse diagnose`/`pulse resolve-error` (CLI commands, for a human).
 * Neither wraps the other. Returns plain data — no MCP protocol coupling.
 */

import fs   from 'fs'
import path from 'path'

function journalPathFor(root) {
  return path.join(root, '.pulse', 'errors.json')
}

/**
 * Read and filter the error journal.
 *
 * @param {string} root - project root
 * @param {{ route?: string, includeResolved?: boolean }} [opts]
 * @returns {{ exists: boolean, entries: object[], error: string|null }}
 */
export function readJournal(root, { route, includeResolved = false } = {}) {
  const journalPath = journalPathFor(root)
  if (!fs.existsSync(journalPath)) {
    return { exists: false, entries: [], error: null }
  }

  let entries
  try {
    entries = JSON.parse(fs.readFileSync(journalPath, 'utf8'))
  } catch (err) {
    return { exists: true, entries: [], error: `Error journal exists but could not be parsed: ${err.message}` }
  }

  let filtered = entries
  if (route)            filtered = filtered.filter(e => e.route === route)
  if (!includeResolved) filtered = filtered.filter(e => !e.resolved)

  return { exists: true, entries: filtered, error: null }
}

/**
 * Format a journal read result as human-readable text.
 */
export function formatJournal(result, { route, includeResolved = false } = {}) {
  if (result.error) return result.error
  if (!result.exists) {
    return 'No errors recorded — .pulse/errors.json does not exist. Either nothing has thrown this session, or the dev server has not been started since it was added.'
  }
  if (result.entries.length === 0) {
    return route
      ? `No unresolved errors for route "${route}".${includeResolved ? '' : ' (Pass includeResolved: true to see resolved entries too.)'}`
      : 'No unresolved errors recorded.'
  }

  const entries = result.entries
  const lines = [`## ${entries.length} error${entries.length === 1 ? '' : 's'}${route ? ` on ${route}` : ''}\n`]
  for (const e of entries.slice().reverse()) {
    lines.push(`### ${e.phase} — ${e.route || '(unknown route)'} — ${e.ts}`)
    lines.push(`\`${e.id}\`${e.resolved ? ' (resolved)' : ''}`)
    lines.push(`\n${e.message}\n`)
    if (e.stack) lines.push('```\n' + e.stack + '\n```\n')
  }
  return lines.join('\n')
}

/**
 * Mark journal entries resolved by id or by route.
 *
 * @param {string} root - project root
 * @param {{ id?: string, route?: string }} opts
 * @returns {{ error: string|null, count: number }}
 */
export function resolveEntries(root, { id, route } = {}) {
  if (!id && !route) return { error: 'Error: pass either id or route.', count: 0 }

  const journalPath = journalPathFor(root)
  if (!fs.existsSync(journalPath)) return { error: 'No error journal exists — nothing to resolve.', count: 0 }

  let entries
  try {
    entries = JSON.parse(fs.readFileSync(journalPath, 'utf8'))
  } catch (err) {
    return { error: `Error journal could not be parsed: ${err.message}`, count: 0 }
  }

  let count = 0
  for (const e of entries) {
    if (e.resolved) continue
    if (id && e.id === id) { e.resolved = true; count++ }
    if (route && e.route === route) { e.resolved = true; count++ }
  }

  fs.writeFileSync(journalPath, JSON.stringify(entries, null, 2), 'utf8')
  return { error: null, count }
}

export function formatResolveResult(result) {
  if (result.error) return result.error
  return result.count > 0
    ? `✓ Resolved ${result.count} entr${result.count === 1 ? 'y' : 'ies'}.`
    : 'No matching unresolved entries found.'
}
