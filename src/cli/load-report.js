/**
 * Pulse — Load test report persistence
 *
 * Saves load test results to .pulse/load-reports/[slug]/[timestamp].json
 * Prunes entries older than 30 days on each write.
 *
 * Usage (CLI):
 *   node src/cli/load-report.js --root /path/to/project --url http://localhost:3000/about --data '{...}'
 *
 * Usage (import):
 *   import { saveLoadReport } from './load-report.js'
 */

import fs   from 'fs'
import path from 'path'
import { urlToSlug } from './report.js'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a load test result to disk.
 *
 * @param {string} root   - Project root directory
 * @param {string} url    - URL that was tested
 * @param {Object} data   - { config, rps, latency, requests, duration } from load-runner
 */
export function saveLoadReport(root, url, data) {
  const slug = urlToSlug(url)
  const dir  = path.join(root, '.pulse', 'load-reports', slug)
  fs.mkdirSync(dir, { recursive: true })

  const record = {
    timestamp: new Date().toISOString(),
    url,
    ...data,
  }

  const filename = path.join(dir, `${Date.now()}.json`)
  fs.writeFileSync(filename, JSON.stringify(record, null, 2))
  pruneOld(dir)
  return { slug, file: filename }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function pruneOld(dir) {
  const cutoff = Date.now() - THIRTY_DAYS
  try {
    fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .forEach(f => {
        const ts = parseInt(path.basename(f, '.json'), 10)
        if (!isNaN(ts) && ts < cutoff) fs.unlinkSync(path.join(dir, f))
      })
  } catch { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args    = process.argv.slice(2)
  const rootArg = args.indexOf('--root')
  const urlArg  = args.indexOf('--url')
  const dataArg = args.indexOf('--data')

  const root = rootArg !== -1 ? path.resolve(args[rootArg + 1]) : process.cwd()
  const url  = urlArg  !== -1 ? args[urlArg  + 1] : null
  const data = dataArg !== -1 ? args[dataArg + 1] : null

  if (!url || !data) {
    console.error('Usage: pulse save-load-report --url <url> --data \'{"rps":...,"latency":{...},...}\'')
    process.exit(1)
  }

  try {
    const parsed   = JSON.parse(data)
    const { slug } = saveLoadReport(root, url, parsed)
    console.log(`✓ Load report saved for ${url} (slug: ${slug})`)
  } catch (e) {
    console.error('Failed to save load report:', e.message)
    process.exit(1)
  }
}
