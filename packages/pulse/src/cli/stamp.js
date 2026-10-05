/**
 * Pulse — verification stamp (shared logic)
 *
 * Writes .pulse-verified to clear the stop-hook verification gate. Used by
 * both pulse_stamp (MCP tool, for an agent) and `pulse stamp` (CLI command,
 * for a human). Neither wraps the other — both call writeStamp().
 *
 * In full mode (route + mode: 'full'), refuses to stamp unless a Lighthouse
 * report was actually saved via `pulse save-report` in the last 10 minutes
 * — a real Lighthouse run that passed the score bar but was never saved
 * leaves nothing for `pulse report-server` or a dashboard to show. This is
 * a mechanized version of a check that used to be prose-only in verify.md
 * and was found (via a real user report) to be silently skipped: /verify
 * completed and reported scores in the conversation, but nothing ever
 * landed in .pulse/reports/.
 */

import fs   from 'fs'
import path from 'path'
import { urlToSlug }       from './report.js'
import { resolveEntries }  from './diagnose.js'

const STAMP_REPORT_WINDOW_MS = 10 * 60 * 1000 // a report older than this wasn't from this /verify run

/**
 * @param {string} root
 * @param {{ route?: string, mode?: 'full'|'quick' }} [opts]
 * @returns {{ stamped: boolean, refused: boolean, reason: string|null, resolvedCount: number, ts: string|null }}
 *   stamped: whether .pulse-verified was actually written
 *   refused: true if this was a policy refusal (missing report) — false if a real write error
 *   reason: why it didn't stamp, when stamped is false (null otherwise)
 *   resolvedCount: error-journal entries auto-resolved for `route` (0 if no route passed)
 *   ts: the stamp's unix-seconds timestamp, when stamped is true (null otherwise)
 */
export function writeStamp(root, { route, mode } = {}) {
  if (route && mode === 'full') {
    const slug = urlToSlug(route)
    const reportDir = path.join(root, '.pulse', 'reports', slug)
    let recentReport = false
    try {
      const files = fs.readdirSync(reportDir).filter(f => f.endsWith('.json'))
      recentReport = files.some(f => {
        const stat = fs.statSync(path.join(reportDir, f))
        return Date.now() - stat.mtimeMs < STAMP_REPORT_WINDOW_MS
      })
    } catch { /* reportDir doesn't exist — recentReport stays false */ }

    if (!recentReport) {
      return {
        stamped: false,
        refused: true,
        reason: `No Lighthouse report saved for "${route}" in the last 10 minutes. Full /verify requires ` +
          `pulse save-report --url "http://localhost:3001${route}" --data '{"scores":{...},"metrics":{...}}' ` +
          `(run from the project root) for BOTH the desktop and mobile Lighthouse runs before stamping.`,
        resolvedCount: 0,
        ts: null,
      }
    }
  }

  const stampPath = path.join(root, '.pulse-verified')
  const ts = String(Math.floor(Date.now() / 1000))
  try {
    fs.writeFileSync(stampPath, ts, 'utf8')
  } catch (err) {
    return {
      stamped: false,
      refused: false,
      reason: `Error writing .pulse-verified: ${err.message}. Fallback: run \`date +%s > .pulse-verified\` in Bash.`,
      resolvedCount: 0,
      ts: null,
    }
  }

  let resolvedCount = 0
  if (route) {
    const { count } = resolveEntries(root, { route })
    resolvedCount = count
  }

  return { stamped: true, refused: false, reason: null, resolvedCount, ts }
}

/**
 * Format a writeStamp() result as human-readable text.
 * @param {ReturnType<typeof writeStamp>} result
 * @param {{ agentFacing?: boolean }} [opts]
 */
export function formatStampResult(result, { agentFacing = true } = {}) {
  if (!result.stamped) {
    const prefix = result.refused ? 'Refusing to stamp' : 'Failed to stamp'
    return agentFacing && result.refused
      ? `${prefix}: ${result.reason}\n\nRun it now with the real numbers from your Lighthouse results, then call pulse_stamp again.`
      : `${prefix}: ${result.reason}`
  }
  const resolvedNote = result.resolvedCount > 0
    ? ` ${result.resolvedCount} error-journal entr${result.resolvedCount === 1 ? 'y' : 'ies'} marked resolved.`
    : ''
  return agentFacing
    ? `✓ .pulse-verified written (${result.ts}). Stop hook cleared — session can end.${resolvedNote}`
    : `✓ .pulse-verified written (${result.ts}).${resolvedNote}`
}
