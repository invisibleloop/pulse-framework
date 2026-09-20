/**
 * Companion dashboard — .pulse/ telemetry watcher.
 *
 * Watches a target project's .pulse/ directory (errors.json, reports/,
 * load-reports/) and pushes the aggregated state into the companion app's
 * store on every change, via the standard pushStore() live-broadcast
 * mechanism — every open dashboard tab re-renders automatically.
 *
 * This is intentionally NOT a general-purpose .pulse/ reader library: the
 * error-journal read reuses the real shared logic from
 * @invisibleloop/pulse's own diagnose.js (the same function pulse_diagnose
 * and `pulse diagnose` use) so the dashboard never drifts from what the
 * CLI/agent actually see. Lighthouse/load-report reading is a few lines of
 * plain fs + JSON.parse — small enough not to warrant extracting
 * report-server.js's rendering-coupled internals into a shared module.
 */
import fs   from 'fs'
import path from 'path'
import { readJournal } from '../packages/pulse/src/cli/diagnose.js'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

function readReportsDir(dir) {
  const cutoff = Date.now() - THIRTY_DAYS
  if (!fs.existsSync(dir)) return {}
  const slugs = fs.readdirSync(dir).filter(f => {
    try { return fs.statSync(path.join(dir, f)).isDirectory() } catch { return false }
  })
  const out = {}
  for (const slug of slugs) {
    const slugDir = path.join(dir, slug)
    const reports = fs.readdirSync(slugDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(slugDir, f), 'utf8')) }
        catch { return null }
      })
      .filter(r => r && new Date(r.timestamp).getTime() >= cutoff)
    if (reports.length > 0) out[slug] = reports
  }
  return out
}

/**
 * Read the full current snapshot of a target project's .pulse/ telemetry.
 */
export function readSnapshot(projectRoot) {
  const journal = readJournal(projectRoot, { includeResolved: true })
  return {
    projectRoot,
    errors:      journal.exists ? journal.entries : [],
    lighthouse:  readReportsDir(path.join(projectRoot, '.pulse', 'reports')),
    loadTests:   readReportsDir(path.join(projectRoot, '.pulse', 'load-reports')),
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Watch a target project's .pulse/ directory for changes and call onChange
 * with a fresh snapshot every time something under it is written. Debounced
 * — a Lighthouse run or a burst of dev-server errors can touch several files
 * in quick succession; this coalesces those into one push.
 *
 * Returns a stop() function.
 */
export function watchProject(projectRoot, onChange) {
  const pulseDir = path.join(projectRoot, '.pulse')
  fs.mkdirSync(pulseDir, { recursive: true })

  let timer = null
  const trigger = () => {
    clearTimeout(timer)
    timer = setTimeout(() => onChange(readSnapshot(projectRoot)), 150)
  }

  // fs.watch on the parent dir, recursive: true — covers errors.json plus
  // any file added under reports/<slug>/ or load-reports/<slug>/ without
  // needing to re-watch new subdirectories as they appear.
  const watcher = fs.watch(pulseDir, { recursive: true }, trigger)

  // Push the initial snapshot immediately so a freshly opened dashboard
  // doesn't sit empty until the next file change.
  trigger()

  return () => {
    clearTimeout(timer)
    watcher.close()
  }
}
