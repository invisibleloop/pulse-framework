/**
 * Pulse — Combined report server
 *
 * Serves a unified dashboard for both Lighthouse audit history and load test
 * results, reading from .pulse/reports/ and .pulse/load-reports/.
 *
 * Usage:
 *   node src/cli/report-server.js [--root /path/to/project] [--port 3001]
 */

import http from 'http'
import fs   from 'fs'
import path from 'path'

const args    = process.argv.slice(2)
const rootArg = args.indexOf('--root')
const portArg = args.indexOf('--port')

const ROOT             = rootArg !== -1 ? path.resolve(args[rootArg + 1]) : process.cwd()
const PORT             = portArg !== -1 ? parseInt(args[portArg + 1], 10) : 3001
const REPORTS_DIR      = path.join(ROOT, '.pulse', 'reports')
const LOAD_REPORTS_DIR = path.join(ROOT, '.pulse', 'load-reports')
const THIRTY_DAYS      = 30 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Data — Lighthouse
// ---------------------------------------------------------------------------

function allSlugs() {
  const perf = fs.existsSync(REPORTS_DIR)
    ? fs.readdirSync(REPORTS_DIR).filter(f => fs.statSync(path.join(REPORTS_DIR, f)).isDirectory())
    : []
  const load = fs.existsSync(LOAD_REPORTS_DIR)
    ? fs.readdirSync(LOAD_REPORTS_DIR).filter(f => fs.statSync(path.join(LOAD_REPORTS_DIR, f)).isDirectory())
    : []
  return [...new Set([...perf, ...load])].sort()
}

function loadReports(slug) {
  const dir    = path.join(REPORTS_DIR, slug)
  const cutoff = Date.now() - THIRTY_DAYS
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch { return null } })
    .filter(r => r && new Date(r.timestamp).getTime() >= cutoff)
}

// ---------------------------------------------------------------------------
// Data — Load tests
// ---------------------------------------------------------------------------

function loadLoadReports(slug) {
  const dir    = path.join(LOAD_REPORTS_DIR, slug)
  const cutoff = Date.now() - THIRTY_DAYS
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch { return null } })
    .filter(r => r && new Date(r.timestamp).getTime() >= cutoff)
}

// ---------------------------------------------------------------------------
// Data — Bundles
// ---------------------------------------------------------------------------

function bundleSizes(slug) {
  const manifestPath = path.join(ROOT, 'public', 'dist', 'manifest.json')
  if (!fs.existsSync(manifestPath)) return null
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const sizes    = {}
    const runtimeEntry = Object.entries(manifest).find(([k]) => k.includes('runtime'))
    if (runtimeEntry) {
      const file = path.join(ROOT, 'public', runtimeEntry[1])
      if (fs.existsSync(file)) sizes.runtime = fs.statSync(file).size
    }
    const pageEntry = Object.entries(manifest).find(([k]) =>
      !k.includes('runtime') && (k.includes(slug) || k.includes(slug.replace(/-/g, '/')))
    )
    if (pageEntry) {
      const file = path.join(ROOT, 'public', pageEntry[1])
      if (fs.existsSync(file)) sizes.page = fs.statSync(file).size
    }
    return Object.keys(sizes).length ? sizes : null
  } catch { return null }
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

function scoreColor(n) {
  if (n === undefined || n === null) return '#444'
  if (n >= 90) return '#4ade80'
  if (n >= 50) return '#fb923c'
  return '#f87171'
}

function metricColor(key, val, prev) {
  if (prev === undefined) return '#9b8dff'
  const loBetter = ['lcp', 'cls', 'fcp', 'tbt', 'ttfb', 'si', 'pageWeight', 'jsBytes', 'cssBytes', 'requests',
                    'latency.mean', 'latency.p50', 'latency.p95', 'latency.p99', 'latency.max', 'errors']
  const improved = loBetter.includes(key) ? val < prev : val > prev
  return improved ? '#4ade80' : val === prev ? '#666' : '#f87171'
}

function deltaLabel(key, cur, prv, decimals = 0) {
  if (prv === undefined) return ''
  const d = cur - prv
  if (d === 0) return '<span style="color:#555">—</span>'
  const loBetter = ['lcp', 'cls', 'fcp', 'tbt', 'ttfb', 'si', 'pageWeight', 'jsBytes', 'cssBytes', 'requests',
                    'latency.mean', 'latency.p50', 'latency.p95', 'latency.p99', 'latency.max', 'errors']
  const good  = loBetter.includes(key) ? d < 0 : d > 0
  const color = good ? '#4ade80' : '#f87171'
  const arrow = d < 0 ? '▼' : '▲'
  return `<span style="color:${color}">${arrow}${Math.abs(d).toFixed(decimals)}</span>`
}

function scoreGauge(score, size = 80) {
  const display = score !== undefined && score !== null ? score : '—'
  const pct     = typeof score === 'number' ? score : 0
  const color   = scoreColor(score)
  const r       = 15.9
  const circ    = 2 * Math.PI * r
  const fill    = (pct / 100) * circ
  const gap     = circ - fill
  const s       = size
  return `<svg width="${s}" height="${s}" viewBox="0 0 36 36" role="img">
    <circle cx="18" cy="18" r="${r}" fill="none" stroke="#1e1e2a" stroke-width="3.2"/>
    <circle cx="18" cy="18" r="${r}" fill="none" stroke="${color}" stroke-width="3.2"
      stroke-dasharray="${fill.toFixed(2)} ${gap.toFixed(2)}"
      stroke-linecap="round"
      transform="rotate(-90 18 18)"/>
    <text x="18" y="21" text-anchor="middle" font-size="8.5" font-weight="800" fill="${color}"
      font-family="system-ui,sans-serif">${display}</text>
  </svg>`
}

function sparkline(values, { width = 140, height = 36, yMin, yMax } = {}) {
  const vals = values.filter(v => v !== undefined && v !== null)
  if (!vals.length) return `<svg width="${width}" height="${height}"></svg>`
  const lo    = yMin ?? Math.min(...vals)
  const hi    = yMax ?? Math.max(...vals)
  const range = hi - lo || 1
  const pts   = vals.map((v, i) => {
    const x = vals.length < 2 ? width / 2 : (i / (vals.length - 1)) * (width - 4) + 2
    const y = (height - 4) - ((v - lo) / range) * (height - 8) + 2
    return [+x.toFixed(1), +y.toFixed(1)]
  })
  const last = pts[pts.length - 1]
  if (pts.length === 1) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="#9b8dff"/></svg>`
  }
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `M${pts[0][0]},${height} L${pts.map(([x, y]) => `${x},${y}`).join(' L')} L${last[0]},${height} Z`
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="${area}" fill="#9b8dff18"/>
    <polyline points="${line}" fill="none" stroke="#9b8dff" stroke-width="1.5"
      stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="#9b8dff"/></svg>`
}

const SUSPECT_ZERO_SCORES  = new Set(['performance'])
const SUSPECT_ZERO_METRICS = new Set(['lcp', 'fcp', 'ttfb', 'si', 'pageWeight', 'jsBytes', 'cssBytes', 'requests'])

function validScore(key, val) {
  if (val === undefined || val === null) return undefined
  if (val === 0 && SUSPECT_ZERO_SCORES.has(key)) return undefined
  return val
}

function validMetric(key, val) {
  if (val === undefined || val === null) return undefined
  if (val === 0 && SUSPECT_ZERO_METRICS.has(key)) return undefined
  return val
}

function fmtBytes(b) {
  if (b === undefined || b === null || b === 0) return '—'
  if (b < 1024) return `${b} B`
  return `${(b / 1024).toFixed(1)} kB`
}

// ---------------------------------------------------------------------------
// Lighthouse sections
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'performance',   label: 'Performance'   },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo',           label: 'SEO'           },
]

const WEB_VITALS = [
  { key: 'lcp',  label: 'LCP',         unit: 'ms', decimals: 0, desc: 'Largest Contentful Paint'  },
  { key: 'cls',  label: 'CLS',         unit: '',   decimals: 2, desc: 'Cumulative Layout Shift'   },
  { key: 'fcp',  label: 'FCP',         unit: 'ms', decimals: 0, desc: 'First Contentful Paint'    },
  { key: 'tbt',  label: 'TBT',         unit: 'ms', decimals: 0, desc: 'Total Blocking Time'       },
  { key: 'ttfb', label: 'TTFB',        unit: 'ms', decimals: 0, desc: 'Time to First Byte'        },
  { key: 'si',   label: 'Speed Index', unit: 'ms', decimals: 0, desc: 'Speed Index'               },
]

const PAGE_WEIGHT = [
  { key: 'pageWeight', label: 'Page weight', unit: 'kB', decimals: 1, desc: 'Total transfer size'      },
  { key: 'jsBytes',    label: 'JS',          unit: 'kB', decimals: 1, desc: 'JavaScript transfer size' },
  { key: 'cssBytes',   label: 'CSS',         unit: 'kB', decimals: 1, desc: 'CSS transfer size'        },
  { key: 'requests',   label: 'Requests',    unit: '',   decimals: 0, desc: 'Total network requests'   },
]

function renderScoreRow(reports) {
  const latest = reports[reports.length - 1]
  const prev   = reports[reports.length - 2]
  return `<section class="score-row">
    ${CATEGORIES.map(({ key, label }) => {
      const cur  = validScore(key, latest?.scores?.[key])
      const prv  = validScore(key, prev?.scores?.[key])
      const vals = reports.map(r => validScore(key, r.scores?.[key])).filter(n => n !== undefined)
      return `
      <div class="score-card">
        <div class="score-gauge">${scoreGauge(cur, 80)}</div>
        <div class="score-info">
          <div class="score-label">${label}</div>
          <div class="score-delta">${cur !== undefined && prv !== undefined ? deltaLabel(key, cur, prv) : cur === undefined ? '<span style="color:#555">no data</span>' : ''}</div>
          <div class="score-spark">${sparkline(vals, { yMin: 0, yMax: 100, width: 100, height: 28 })}</div>
        </div>
      </div>`
    }).join('')}
  </section>`
}

function renderMetricGroup(title, defs, reports) {
  const latest = reports[reports.length - 1]
  const prev   = reports[reports.length - 2]
  const rows = defs.map(({ key, label, unit, decimals, desc }) => {
    const raw = validMetric(key, latest?.metrics?.[key])
    const prv = validMetric(key, prev?.metrics?.[key])
    if (raw === undefined) return ''
    const cur  = raw
    const fmt  = v => typeof v === 'number' ? (decimals ? v.toFixed(decimals) : v) : v
    const vals = reports.map(r => validMetric(key, r.metrics?.[key])).filter(n => n !== undefined)
    const lo   = Math.min(...vals) * 0.8
    const hi   = Math.max(...vals) * 1.2 || 1
    const col  = metricColor(key, cur, prv)
    return `
    <div class="metric-row">
      <span class="metric-label" title="${desc}">${label}</span>
      <span class="metric-value" style="color:${col}">${fmt(cur)}<span class="metric-unit">${unit}</span></span>
      <span class="metric-delta">${prv !== undefined ? deltaLabel(key, cur, prv, decimals) : ''}</span>
      <span class="metric-spark">${sparkline(vals, { yMin: lo, yMax: hi, width: 120, height: 28 })}</span>
    </div>`
  }).filter(Boolean).join('')
  if (!rows) return ''
  return `
  <section class="panel">
    <h3 class="panel-title">${title}</h3>
    ${rows}
  </section>`
}

function renderBundlePanel(slug, reports) {
  const sizes    = bundleSizes(slug)
  const latest   = reports[reports.length - 1]
  const jsBytes  = latest?.metrics?.jsBytes
  const cssBytes = latest?.metrics?.cssBytes
  if (!sizes && jsBytes == null && cssBytes == null) return ''
  const items = []
  if (sizes?.runtime !== undefined) items.push(`
    <div class="bundle-item">
      <span class="bundle-name">Runtime bundle</span>
      <span class="bundle-size">${fmtBytes(sizes.runtime)}</span>
      <span class="bundle-note">shared across all pages</span>
    </div>`)
  if (sizes?.page !== undefined) items.push(`
    <div class="bundle-item">
      <span class="bundle-name">Page bundle</span>
      <span class="bundle-size">${fmtBytes(sizes.page)}</span>
      <span class="bundle-note">this page only</span>
    </div>`)
  if (jsBytes !== undefined) {
    const vals = reports.map(r => r.metrics?.jsBytes).filter(n => n !== undefined)
    items.push(`
    <div class="bundle-item">
      <span class="bundle-name">JS transferred</span>
      <span class="bundle-size">${fmtBytes(jsBytes)}</span>
      <span class="bundle-spark">${sparkline(vals, { width: 80, height: 24 })}</span>
    </div>`)
  }
  if (cssBytes !== undefined) {
    const vals = reports.map(r => r.metrics?.cssBytes).filter(n => n !== undefined)
    items.push(`
    <div class="bundle-item">
      <span class="bundle-name">CSS transferred</span>
      <span class="bundle-size">${fmtBytes(cssBytes)}</span>
      <span class="bundle-spark">${sparkline(vals, { width: 80, height: 24 })}</span>
    </div>`)
  }
  if (!items.length) return ''
  return `
  <section class="panel">
    <h3 class="panel-title">Bundle sizes</h3>
    <div class="bundle-grid">${items.join('')}</div>
  </section>`
}

function renderHistory(reports) {
  const rows = [...reports].reverse().slice(0, 20).map(r => {
    const time   = new Date(r.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    const scores = CATEGORIES.map(({ key }) => {
      const v = validScore(key, r.scores?.[key])
      return `<td style="color:${scoreColor(v)};font-weight:700">${v ?? '—'}</td>`
    }).join('')
    return `<tr><td class="time-col">${time}</td>${scores}</tr>`
  }).join('')
  return `
  <section class="panel">
    <h3 class="panel-title">Audit history <span class="panel-sub">· last 30 days</span></h3>
    <table class="history-table">
      <thead><tr><th>Time</th>${CATEGORIES.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`
}

function renderPerfTab(slug, reports) {
  if (!reports.length) return '<p class="empty-state">No Lighthouse audits yet. Run <code>/pulse-report</code> to capture one.</p>'
  const latest = reports[reports.length - 1]
  const count  = reports.length
  const when   = new Date(latest.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const scores     = latest.scores || {}
  const present    = CATEGORIES.filter(({ key }) => validScore(key, scores[key]) !== undefined)
  const allGood    = present.length === 4 && present.every(({ key }) => validScore(key, scores[key]) >= 90)
  const anyBad     = present.some(({ key }) => validScore(key, scores[key]) < 50)
  const incomplete = present.length < 4
  const health = incomplete
    ? ['Incomplete — re-run audit', '#fb923c']
    : allGood ? ['All scores 90+', '#4ade80']
    : anyBad  ? ['Needs attention', '#f87171']
    : ['Room to improve', '#fb923c']
  const missingScores = CATEGORIES.filter(({ key }) => validScore(key, scores[key]) === undefined).map(c => c.label)
  const staleBanner = missingScores.length
    ? `<div class="stale-banner">Missing scores: <strong>${missingScores.join(', ')}</strong> — run <code>/pulse-report</code> to capture a full audit.</div>`
    : ''
  return `
  ${staleBanner}
  <div class="page-header">
    <div>
      <h2 class="page-heading">${latest.url || '/' + slug}</h2>
      <p class="page-meta">${count} audit${count !== 1 ? 's' : ''} · last run ${when}</p>
    </div>
    <div class="health-badge" style="color:${health[1]};border-color:${health[1]}20;background:${health[1]}10">${health[0]}</div>
  </div>
  ${renderScoreRow(reports)}
  ${renderMetricGroup('Core Web Vitals', WEB_VITALS, reports)}
  ${renderMetricGroup('Page weight', PAGE_WEIGHT, reports)}
  ${renderBundlePanel(slug, reports)}
  ${renderHistory(reports)}`
}

// ---------------------------------------------------------------------------
// Load test sections
// ---------------------------------------------------------------------------

const LOAD_LATENCY = [
  { key: 'mean', label: 'Mean',  unit: 'ms', decimals: 1, desc: 'Average response time'  },
  { key: 'p50',  label: 'P50',   unit: 'ms', decimals: 0, desc: '50th percentile latency' },
  { key: 'p95',  label: 'P95',   unit: 'ms', decimals: 0, desc: '95th percentile latency' },
  { key: 'p99',  label: 'P99',   unit: 'ms', decimals: 0, desc: '99th percentile latency' },
  { key: 'max',  label: 'Max',   unit: 'ms', decimals: 0, desc: 'Worst-case latency'      },
]

function fmtRps(v) {
  if (v === undefined || v === null) return '—'
  if (v >= 100) return Math.round(v).toLocaleString()
  if (v >= 10)  return v.toFixed(1)
  return v.toFixed(2)
}

function renderLoadTab(slug, reports) {
  if (!reports.length) return '<p class="empty-state">No load tests yet. Run <code>/pulse-load</code> to capture one.</p>'

  const latest = reports[reports.length - 1]
  const prev   = reports[reports.length - 2]
  const count  = reports.length
  const when   = new Date(latest.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const isLocalhost = latest.url?.includes('localhost') || latest.url?.includes('127.0.0.1')

  // Summary row
  const summaryItems = [
    { label: 'Req / sec',    value: fmtRps(latest.rps) },
    { label: 'Connections',  value: latest.config?.connections ?? '—' },
    { label: 'Duration',     value: latest.config?.duration ? `${latest.config.duration}s` : '—' },
    { label: 'Total req',    value: latest.requests?.total ?? '—' },
    { label: 'Errors',       value: latest.requests?.errors ?? 0, color: (latest.requests?.errors || 0) > 0 ? '#f87171' : '#4ade80' },
  ]

  const summary = `
  <section class="load-summary">
    ${summaryItems.map(({ label, value, color }) => `
    <div class="load-stat">
      <div class="load-stat-value" style="${color ? `color:${color}` : ''}">${value}</div>
      <div class="load-stat-label">${label}</div>
    </div>`).join('')}
  </section>`

  // Latency panel
  const latencyRows = LOAD_LATENCY.map(({ key, label, unit, decimals, desc }) => {
    const cur  = latest.latency?.[key]
    const prv  = prev?.latency?.[key]
    if (cur === undefined) return ''
    const vals = reports.map(r => r.latency?.[key]).filter(n => n !== undefined)
    const lo   = Math.min(...vals) * 0.8
    const hi   = Math.max(...vals) * 1.2 || 1
    const col  = metricColor('latency.' + key, cur, prv)
    const fmt  = v => decimals ? v.toFixed(decimals) : Math.round(v)
    return `
    <div class="metric-row">
      <span class="metric-label" title="${desc}">${label}</span>
      <span class="metric-value" style="color:${col}">${fmt(cur)}<span class="metric-unit">${unit}</span></span>
      <span class="metric-delta">${prv !== undefined ? deltaLabel('latency.' + key, cur, prv, decimals) : ''}</span>
      <span class="metric-spark">${sparkline(vals, { yMin: lo, yMax: hi, width: 120, height: 28 })}</span>
    </div>`
  }).filter(Boolean).join('')

  const rpsVals  = reports.map(r => r.rps).filter(n => n !== undefined)
  const rpsPanel = `
  <section class="panel">
    <h3 class="panel-title">Throughput</h3>
    <div class="metric-row">
      <span class="metric-label">Req / sec</span>
      <span class="metric-value" style="color:${metricColor('rps', latest.rps, prev?.rps)}">${fmtRps(latest.rps)}</span>
      <span class="metric-delta">${prev?.rps !== undefined ? deltaLabel('rps', latest.rps, prev.rps, 1) : ''}</span>
      <span class="metric-spark">${sparkline(rpsVals, { width: 120, height: 28 })}</span>
    </div>
  </section>`

  const latencyPanel = latencyRows ? `
  <section class="panel">
    <h3 class="panel-title">Latency percentiles</h3>
    ${latencyRows}
  </section>` : ''

  // History table
  const histRows = [...reports].reverse().slice(0, 20).map(r => {
    const time    = new Date(r.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    const errCol  = (r.requests?.errors || 0) > 0 ? '#f87171' : '#4ade80'
    return `<tr>
      <td class="time-col">${time}</td>
      <td>${r.config?.duration ?? '—'}s</td>
      <td>${r.config?.connections ?? '—'}</td>
      <td style="font-weight:700;color:#9b8dff">${fmtRps(r.rps)}</td>
      <td>${r.latency?.p50 ?? '—'}</td>
      <td>${r.latency?.p95 ?? '—'}</td>
      <td>${r.latency?.p99 ?? '—'}</td>
      <td style="color:${errCol};font-weight:700">${r.requests?.errors ?? 0}</td>
    </tr>`
  }).join('')

  const histPanel = `
  <section class="panel">
    <h3 class="panel-title">Test history <span class="panel-sub">· last 30 days</span></h3>
    <table class="history-table">
      <thead><tr>
        <th>Time</th><th>Duration</th><th>Connections</th>
        <th>Req/s</th><th>P50</th><th>P95</th><th>P99</th><th>Errors</th>
      </tr></thead>
      <tbody>${histRows}</tbody>
    </table>
  </section>`

  const localhostBanner = isLocalhost
    ? `<div class="stale-banner">These results are from <strong>localhost</strong> — no network latency, OS scheduling, or real-world conditions. Run against a staging environment for production-representative numbers.</div>`
    : ''

  return `
  ${localhostBanner}
  <div class="page-header">
    <div>
      <h2 class="page-heading">${latest.url || '/' + slug}</h2>
      <p class="page-meta">${count} test${count !== 1 ? 's' : ''} · last run ${when}</p>
    </div>
  </div>
  ${summary}
  ${rpsPanel}
  ${latencyPanel}
  ${histPanel}`
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

function renderIndex(slugs) {
  if (!slugs.length) return `
  <div class="empty-state">
    <p>No reports yet.</p>
    <p>Run <code>/pulse-report</code> to audit a page or <code>/pulse-load</code> to run a load test.</p>
  </div>`

  const cards = slugs.map(slug => {
    const reports  = loadReports(slug)
    const loadRpts = loadLoadReports(slug)
    const latest   = reports[reports.length - 1]
    const latestLd = loadRpts[loadRpts.length - 1]
    const scores   = latest?.scores

    const gauges = CATEGORIES.map(({ key, label }) =>
      `<span title="${label}">${scoreGauge(validScore(key, scores?.[key]), 44)}</span>`
    ).join('')

    const loadBadge = latestLd
      ? `<span class="load-badge" title="Latest load test">${latestLd.rps?.toFixed(0) ?? '—'} req/s</span>`
      : ''

    return `
    <a href="/${slug}" class="index-card">
      <span class="index-url">${latest?.url || latestLd?.url || '/' + slug}</span>
      <span class="index-gauges">${gauges}</span>
      ${loadBadge}
    </a>`
  }).join('')

  return `<h2 class="page-heading" style="margin-bottom:1.25rem">Pages</h2><div class="index-list">${cards}</div>`
}

// ---------------------------------------------------------------------------
// Layout + CSS
// ---------------------------------------------------------------------------

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0c11;--surface:#14141c;--surface2:#1a1a25;
  --border:#22222f;--text:#dddde8;--muted:#666678;
  --accent:#9b8dff;--radius:10px;
}
html{font-size:14px}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;min-height:100vh}
a{color:var(--accent);text-decoration:none}
code{font-family:ui-monospace,monospace;font-size:.85em;background:var(--surface2);padding:2px 6px;border-radius:4px}

.layout{display:flex;min-height:100vh}

/* Sidebar */
.sidebar{width:210px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);padding:1.25rem 0}
.sidebar-logo{display:flex;align-items:center;gap:.5rem;font-weight:700;font-size:.95rem;padding:.2rem 1.1rem 1.25rem;color:var(--text)}
.sidebar-logo svg{color:var(--accent)}
.sidebar-section{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:.75rem 1.1rem .25rem}
.sidebar-link{display:block;padding:.35rem 1.1rem;font-size:.8rem;color:var(--muted);border-left:2px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sidebar-link:hover{color:var(--text);background:var(--surface2)}
.sidebar-link.active{color:var(--text);border-left-color:var(--accent)}

/* Main */
.main{flex:1;padding:2rem 2.25rem;max-width:960px;overflow:auto}

/* Tabs */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:1.75rem}
.tab{padding:.5rem 1.1rem;font-size:.8rem;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .1s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Page header */
.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.75rem}
.page-heading{font-size:1.2rem;font-weight:700;margin-bottom:.2rem}
.page-meta{color:var(--muted);font-size:.78rem}
.health-badge{font-size:.72rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border:1px solid;border-radius:20px;padding:.25rem .75rem;white-space:nowrap}

/* Score row */
.score-row{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.25rem}
.score-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;display:flex;align-items:center;gap:.875rem}
.score-gauge svg{display:block;flex-shrink:0}
.score-info{flex:1;min-width:0}
.score-label{font-size:.65rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:.15rem}
.score-delta{font-size:.8rem;min-height:1.1rem;margin-bottom:.35rem}
.score-spark svg{display:block}

/* Load summary */
.load-summary{display:flex;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap}
.load-stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:.875rem 1.25rem;min-width:110px;text-align:center}
.load-stat-value{font-size:1.5rem;font-weight:800;color:var(--accent);line-height:1;margin-bottom:.3rem}
.load-stat-label{font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

/* Panels */
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.1rem;margin-bottom:1.1rem}
.panel-title{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:.875rem}
.panel-sub{font-weight:400;text-transform:none;letter-spacing:0;font-size:.7rem}

/* Metric rows */
.metric-row{display:grid;grid-template-columns:100px 110px 70px 1fr;align-items:center;gap:1rem;padding:.45rem 0;border-bottom:1px solid var(--border)}
.metric-row:last-child{border-bottom:none}
.metric-label{font-size:.72rem;font-weight:600;color:var(--muted);cursor:default}
.metric-value{font-size:1.05rem;font-weight:800}
.metric-unit{font-size:.65rem;color:var(--muted);margin-left:1px;font-weight:400}
.metric-delta{font-size:.78rem}
.metric-spark svg{display:block}

/* Bundle */
.bundle-grid{display:flex;flex-direction:column;gap:.6rem}
.bundle-item{display:flex;align-items:center;gap:1rem;padding:.35rem 0;border-bottom:1px solid var(--border)}
.bundle-item:last-child{border-bottom:none}
.bundle-name{font-size:.78rem;font-weight:600;color:var(--muted);width:140px;flex-shrink:0}
.bundle-size{font-size:.95rem;font-weight:800;width:80px}
.bundle-note{font-size:.72rem;color:var(--muted)}
.bundle-spark svg{display:block}

/* History */
.history-table{width:100%;border-collapse:collapse;font-size:.8rem}
.history-table th{text-align:left;font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:.4rem .7rem;border-bottom:1px solid var(--border)}
.history-table td{padding:.42rem .7rem;border-bottom:1px solid var(--border)}
.history-table tr:last-child td{border-bottom:none}
.time-col{color:var(--muted)!important;font-size:.74rem!important;font-weight:400!important}

/* Index */
.index-list{display:flex;flex-direction:column;gap:.5rem}
.index-card{display:flex;align-items:center;gap:1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem 1.1rem;transition:border-color .15s}
.index-card:hover{border-color:var(--accent)}
.index-url{flex:1;font-size:.875rem;color:var(--text)}
.index-gauges{display:flex;gap:.5rem;align-items:center}
.index-gauges svg{display:block}
.load-badge{font-size:.7rem;font-weight:700;color:#9b8dff;background:#9b8dff18;border:1px solid #9b8dff30;border-radius:20px;padding:.2rem .6rem;white-space:nowrap}

.stale-banner{background:#fb923c12;border:1px solid #fb923c40;border-radius:var(--radius);padding:.6rem 1rem;font-size:.78rem;color:#fb923c;margin-bottom:1.25rem}
.stale-banner strong{font-weight:700}
.stale-banner code{background:#fb923c18;color:#fb923c}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;padding:5rem 2rem;color:var(--muted);text-align:center}
`

function renderHTML({ title, content, slugs, activeSlug, activeTab, hasBoth }) {
  const links = slugs.map(slug => {
    const reports  = loadReports(slug)
    const url      = reports[reports.length - 1]?.url
    const loadRpts = loadLoadReports(slug)
    const ldUrl    = loadRpts[loadRpts.length - 1]?.url
    const display  = url || ldUrl || '/' + slug
    return `<a href="/${slug}" class="sidebar-link${slug === activeSlug ? ' active' : ''}">${display}</a>`
  }).join('')

  const tabs = activeSlug && hasBoth ? `
  <div class="tabs">
    <a href="/${activeSlug}" class="tab${activeTab === 'perf' ? ' active' : ''}">Performance</a>
    <a href="/${activeSlug}/load" class="tab${activeTab === 'load' ? ' active' : ''}">Load Tests</a>
  </div>` : activeSlug ? `
  <div class="tabs">
    ${hasBoth === false && activeTab === 'perf'
      ? `<a href="/${activeSlug}" class="tab active">Performance</a><a href="/${activeSlug}/load" class="tab" style="opacity:.4">Load Tests</a>`
      : `<a href="/${activeSlug}" class="tab" style="opacity:.4">Performance</a><a href="/${activeSlug}/load" class="tab active">Load Tests</a>`
    }
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Pulse Reports</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <a href="/" class="sidebar-logo">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
        </svg>
        Pulse Reports
      </a>
      ${slugs.length ? `<div class="sidebar-section">Pages</div>${links}` : ''}
    </aside>
    <main id="main-content" class="main">
      ${tabs}
      ${content}
    </main>
  </div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]
  const parts   = urlPath.slice(1).split('/')
  const slug    = parts[0] || ''
  const tab     = parts[1] || 'perf'   // 'perf' | 'load'
  const slugs   = allSlugs()

  let title, content, activeTab = tab, hasBoth = false

  if (!slug) {
    title   = 'Overview'
    content = renderIndex(slugs)
  } else if (slugs.includes(slug)) {
    const perfReports = loadReports(slug)
    const loadReports_ = loadLoadReports(slug)
    hasBoth = perfReports.length > 0 && loadReports_.length > 0

    if (tab === 'load') {
      title      = (loadReports_[loadReports_.length - 1]?.url || '/' + slug) + ' — Load'
      content    = renderLoadTab(slug, loadReports_)
      activeTab  = 'load'
    } else {
      title      = perfReports[perfReports.length - 1]?.url || '/' + slug
      content    = renderPerfTab(slug, perfReports)
      activeTab  = 'perf'
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(renderHTML({ title, content, slugs, activeSlug: slug, activeTab, hasBoth }))

}).listen(PORT, () => {
  console.log(`\n⚡ Pulse report server running at http://localhost:${PORT}\n`)
})
