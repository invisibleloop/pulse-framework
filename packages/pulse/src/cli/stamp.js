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
 *
 * The report must also hold the evidence verify.md's pass bar asks for, for BOTH devices: the
 * Accessibility, Best Practices and SEO scores at 100, a measured LCP and a CLS of 0.00. A report
 * saved with only `cls` (or with scores missing) used to be enough, so a page whose speed was
 * never measured got the same stamp as one that was.
 */

import fs   from 'fs'
import path from 'path'
import { urlToSlug }       from './report.js'
import { resolveEntries }  from './diagnose.js'

const STAMP_REPORT_WINDOW_MS = 10 * 60 * 1000 // a report older than this wasn't from this /verify run

// verify.md's pass bar. Performance as a score varies with machine load and is not gated, but LCP
// must be measured, and a clearly poor one (Core Web Vitals "poor", over 4 s) is a fail.
const DEVICES        = ['desktop', 'mobile']
const MUST_BE_100    = ['accessibility', 'bestPractices', 'seo']
const LCP_POOR_MS    = 4000
const CLS_MAX        = 0.005 // "CLS 0.00" once rounded to two places

const isNum = v => typeof v === 'number' && Number.isFinite(v)

/**
 * What is wrong with the newest recent report of each device, as sentences an agent can act on.
 * Empty when both devices meet the bar.
 *
 * @param {string} reportDir
 * @returns {string[]}
 */
function reportProblems(reportDir) {
  const newest = {}
  let withoutDevice = 0
  for (const f of fs.readdirSync(reportDir).filter(f => f.endsWith('.json'))) {
    const file = path.join(reportDir, f)
    const mtime = fs.statSync(file).mtimeMs
    if (Date.now() - mtime >= STAMP_REPORT_WINDOW_MS) continue
    let rec
    try { rec = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { continue }
    const device = rec?.device
    if (!device) withoutDevice++
    if (DEVICES.includes(device) && (!newest[device] || mtime > newest[device].mtime)) newest[device] = { mtime, rec }
  }

  const problems = []
  for (const device of DEVICES) {
    const rec = newest[device]?.rec
    if (!rec) {
      problems.push(`no ${device} report (save it with \`npx --no-install pulse save-report --device ${device}\`)`)
      continue
    }
    for (const key of MUST_BE_100) {
      const v = rec.scores?.[key]
      if (!isNum(v)) problems.push(`${device}: scores.${key} is missing`)
      else if (v !== 100) problems.push(`${device}: ${key} is ${v}, the bar is 100`)
    }
    const { lcp, cls } = rec.metrics ?? {}
    if (!isNum(lcp)) problems.push(`${device}: metrics.lcp is missing (measure it; verify.md step 9 says how)`)
    else if (lcp > LCP_POOR_MS) problems.push(`${device}: LCP is ${Math.round(lcp)} ms, over ${LCP_POOR_MS} ms`)
    if (!isNum(cls)) problems.push(`${device}: metrics.cls is missing`)
    else if (cls > CLS_MAX) problems.push(`${device}: CLS is ${cls}, the bar is 0.00`)
  }
  // A `pulse` older than 0.28 ignores --device and prints a plain "Report saved". The usual cause is a
  // global install that comes first on the PATH, so name it: the project's own copy knows the flag.
  if (problems.length > 0 && withoutDevice > 0) {
    problems.push(`${withoutDevice} recent report(s) name no device. An older \`pulse\` ignores --device (a global install ahead of the project's copy on the PATH). Save with \`npx --no-install pulse save-report ...\`, which runs the project's own copy`)
  }
  return problems
}

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
  // A full verification is about a page. Without a route there is no report to look for, and the
  // stamp used to be written anyway, with nothing behind it: the one thing the stamp must not be.
  if (mode === 'full' && !route) {
    return {
      stamped: false,
      refused: true,
      reason: 'Full verification needs the page it verified: pass route (pulse stamp --full --route </path>). ' +
        'Use mode "quick" (or omit mode) for a stamp that does not claim a Lighthouse run.',
      resolvedCount: 0,
      ts: null,
    }
  }
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
          `pulse save-report --url "http://localhost:3001${route}" --device <desktop|mobile> --data '{"scores":{...},"metrics":{...}}' ` +
          `(run from the project root) for BOTH the desktop and mobile Lighthouse runs before stamping.`,
        resolvedCount: 0,
        ts: null,
      }
    }

    const problems = reportProblems(reportDir)
    if (problems.length > 0) {
      return {
        stamped: false,
        refused: true,
        reason: `The saved Lighthouse reports for "${route}" do not meet the /verify bar:\n` +
          problems.map(p => `  - ${p}`).join('\n') +
          `\nFix the page or save the missing numbers, then save the report again. Do not save numbers you did not measure.`,
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
      ? `${prefix}: ${result.reason}\n\nFix that with real numbers from your Lighthouse results and trace, then call pulse_stamp again.`
      : `${prefix}: ${result.reason}`
  }
  const resolvedNote = result.resolvedCount > 0
    ? ` ${result.resolvedCount} error-journal entr${result.resolvedCount === 1 ? 'y' : 'ies'} marked resolved.`
    : ''
  return agentFacing
    ? `✓ .pulse-verified written (${result.ts}). Stop hook cleared — session can end.${resolvedNote}`
    : `✓ .pulse-verified written (${result.ts}).${resolvedNote}`
}
