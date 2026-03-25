/**
 * Pulse — Report persistence helpers
 *
 * Saves Lighthouse audit results to .pulse/reports/[slug]/[timestamp].json
 * Prunes entries older than 30 days on each write.
 *
 * Usage (CLI):
 *   node src/cli/report.js --root /path/to/project --url http://localhost:3000/about --data '{...}'
 *
 * Usage (import):
 *   import { saveReport, urlToSlug } from './report.js'
 */

import fs   from 'fs'
import path from 'path'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a URL (or pathname) to a filesystem slug.
 * '/'            → 'home'
 * '/about'       → 'about'
 * '/blog/my-post' → 'blog-my-post'
 */
export function urlToSlug(url) {
  try {
    const pathname = new URL(url).pathname
    return pathnameToSlug(pathname)
  } catch {
    return pathnameToSlug(url)
  }
}

function pathnameToSlug(pathname) {
  const slug = pathname.replace(/^\//, '').replace(/\//g, '-').replace(/-+$/, '')
  return slug || 'home'
}

/**
 * Save a Lighthouse audit result to disk.
 *
 * @param {string} root    - Project root directory
 * @param {string} url     - Full URL that was audited
 * @param {Object} scores  - { performance, accessibility, bestPractices, seo } (0-100)
 * @param {Object} metrics - { lcp, cls, fcp, tbt } (numbers)
 */
export function saveReport(root, url, scores, metrics = {}) {
  const slug = urlToSlug(url)
  const dir  = path.join(root, '.pulse', 'reports', slug)
  fs.mkdirSync(dir, { recursive: true })

  const record = {
    timestamp: new Date().toISOString(),
    url,
    scores,
    metrics,
  }

  const filename = path.join(dir, `${Date.now()}.json`)
  fs.writeFileSync(filename, JSON.stringify(record, null, 2))

  pruneOldReports(dir)

  return { slug, file: filename }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function pruneOldReports(dir) {
  const cutoff = Date.now() - THIRTY_DAYS
  try {
    fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .forEach(f => {
        const ts = parseInt(path.basename(f, '.json'), 10)
        if (!isNaN(ts) && ts < cutoff) {
          fs.unlinkSync(path.join(dir, f))
        }
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
    console.error('Usage: pulse-report --url <url> --data \'{"scores":{...},"metrics":{...}}\'')
    process.exit(1)
  }

  try {
    const { scores, metrics } = JSON.parse(data)
    const { slug } = saveReport(root, url, scores, metrics)
    console.log(`✓ Report saved for ${url} (slug: ${slug})`)
  } catch (e) {
    console.error('Failed to save report:', e.message)
    process.exit(1)
  }
}
