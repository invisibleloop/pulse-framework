/**
 * Pulse — Performance Benchmark
 *
 * Measures server-side performance metrics before/after optimisation work.
 * Starts an isolated test server — no external dependencies.
 *
 * Usage:
 *   node scripts/bench.js              # run all suites, print table
 *   node scripts/bench.js --save       # also write benchmark/results/YYYY-MM-DD-HH-MM.json
 *   node scripts/bench.js --compare    # compare latest two saved results
 *
 * Metrics captured per suite:
 *   ttfb        — Time to first byte (ms): headers received
 *   total       — Full response time (ms): all bytes received
 *   bodyBytes   — Raw response body size (bytes)
 *   serverData  — Server-Timing: data fetcher duration (ms)
 *   serverRender— Server-Timing: view render duration (ms)
 *   serverTotal — Server-Timing: total server processing (ms)
 *
 * Suites:
 *   simple      — Page with no server data (routing + render overhead only)
 *   data-1      — Page with 1 server fetcher (simulated 20ms DB query)
 *   data-3      — Page with 3 parallel server fetchers (20ms, 30ms, 10ms)
 *   nav-simple  — Client navigation (X-Pulse-Navigate) on simple page
 *   nav-data    — Client navigation on data page
 *   cached      — Repeated request to a spec.cache page (in-process cache hit)
 */

import http    from 'http'
import fs      from 'fs'
import path    from 'path'
import { performance } from 'perf_hooks'
import { fileURLToPath } from 'url'
import { createServer }  from '../src/server/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const RESULTS   = path.join(ROOT, 'benchmark', 'results')

const WARMUP     = 10
const ITERATIONS = 100
const PORT       = 19876

// ---------------------------------------------------------------------------
// Benchmark specs — deterministic fake latency simulates real DB queries
// ---------------------------------------------------------------------------

const simpleSpec = {
  route:   '/bench/simple',
  hydrate: '/bench/simple.js',
  meta:    { title: 'Bench — Simple', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  view:    () => `
    <main id="main-content">
      <h1>Simple page</h1>
      <p>No server data — pure routing and render overhead.</p>
    </main>`,
}

const data1Spec = {
  route:   '/bench/data-1',
  hydrate: '/bench/data-1.js',
  meta:    { title: 'Bench — 1 Fetcher', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  server: {
    items: async () => {
      await sleep(20)
      return Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}`, value: i * 3.14 }))
    },
  },
  view: (state, { items }) => `
    <main id="main-content">
      <h1>Data page — 1 fetcher</h1>
      <ul>${items.map(it => `<li>${it.name}: ${it.value.toFixed(2)}</li>`).join('')}</ul>
    </main>`,
}

const data3Spec = {
  route:   '/bench/data-3',
  hydrate: '/bench/data-3.js',
  meta:    { title: 'Bench — 3 Fetchers', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  server: {
    fast:   async () => { await sleep(10); return { label: 'fast',   value: 42 } },
    medium: async () => { await sleep(30); return { label: 'medium', value: 99 } },
    slow:   async () => { await sleep(20); return { label: 'slow',   value: 7  } },
  },
  view: (state, { fast, medium, slow }) => `
    <main id="main-content">
      <h1>Data page — 3 parallel fetchers</h1>
      <p>Fast: ${fast.value} · Medium: ${medium.value} · Slow: ${slow.value}</p>
    </main>`,
}

// ---------------------------------------------------------------------------
// Streaming scope specs — demonstrate segment-level data scoping
//
// Both specs have the same two fetchers:
//   user  — 20ms  (needed by the shell 'header' segment)
//   posts — 100ms (needed by the deferred 'feed' segment)
//
// scoped:   shell only awaits 'user' → shell arrives at ~20ms
// unscoped: shell awaits ALL fetchers → shell blocked until ~100ms
//
// "shell time" = when the shell content chunk appears in the response stream.
// "total time" = when all bytes (including deferred) have arrived.
// ---------------------------------------------------------------------------

const streamScopedSpec = {
  route:   '/bench/stream-scoped',
  hydrate: '/bench/stream-scoped.js',
  meta:    { title: 'Bench — Stream Scoped', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  server: {
    user:  async () => { await sleep(20);  return { name: 'Alice' } },
    posts: async () => { await sleep(100); return [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }] },
  },
  stream: {
    shell:    ['header'],
    deferred: ['feed'],
    scope:    { header: ['user'], feed: ['posts'] },  // ← key: shell doesn't wait for posts
  },
  view: {
    header: (s, { user })  => `<header data-bench="shell">Hello ${user.name}</header>`,
    feed:   (s, { posts }) => `<main>${posts.map(p => `<h2>${p.title}</h2>`).join('')}</main>`,
  },
}

const streamUnscopedSpec = {
  route:   '/bench/stream-unscoped',
  hydrate: '/bench/stream-unscoped.js',
  meta:    { title: 'Bench — Stream Unscoped', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  server: {
    user:  async () => { await sleep(20);  return { name: 'Alice' } },
    posts: async () => { await sleep(100); return [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }] },
  },
  stream: {
    shell:    ['header'],
    deferred: ['feed'],
    // no scope — shell awaits ALL fetchers before writing (baseline behaviour)
  },
  view: {
    header: (s, { user })  => `<header data-bench="shell">Hello ${user.name}</header>`,
    feed:   (s, { posts }) => `<main>${posts.map(p => `<h2>${p.title}</h2>`).join('')}</main>`,
  },
}

// Cached spec — no server data so in-process page cache applies
const cachedSpec = {
  route:   '/bench/cached',
  hydrate: '/bench/cached.js',
  meta:    { title: 'Bench — Cached', description: 'Benchmark page', styles: ['/pulse.css'] },
  state:   {},
  cache:   { public: true, maxAge: 60 },
  view:    () => `
    <main id="main-content">
      <h1>Cached page</h1>
      <p>This response is served from the in-process page cache after the first request.</p>
    </main>`,
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now()
    let ttfb = null

    const req = http.get({ hostname: 'localhost', port: PORT, path, headers }, res => {
      ttfb = performance.now() - t0
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const total    = performance.now() - t0
        const body     = Buffer.concat(chunks)
        const timing   = parseServerTiming(res.headers['server-timing'])
        resolve({ ttfb, total, bodyBytes: body.length, status: res.statusCode, timing, headers: res.headers })
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(new Error('timeout')) })
  })
}

/**
 * Make a streaming HTTP request and track when a shell content marker
 * first appears in the response body. Used for the stream-scope suites.
 *
 * shellTime — elapsed ms when the marker string appears in any chunk
 * total     — elapsed ms when all bytes have arrived (connection closed)
 */
function streamRequest(path, shellMarker) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now()
    let shellTime = null
    let buffer    = ''

    const req = http.get({ hostname: 'localhost', port: PORT, path }, res => {
      res.on('data', chunk => {
        buffer += chunk.toString()
        if (shellTime === null && buffer.includes(shellMarker)) {
          shellTime = performance.now() - t0
        }
      })
      res.on('end', () => {
        resolve({ shellTime, total: performance.now() - t0, bodyBytes: buffer.length })
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => req.destroy(new Error('timeout')))
  })
}

function parseServerTiming(header) {
  if (!header) return {}
  const result = {}
  for (const part of header.split(',')) {
    const [name, ...attrs] = part.trim().split(';')
    const dur = attrs.find(a => a.trim().startsWith('dur='))
    if (dur) result[name.trim()] = parseFloat(dur.split('=')[1])
  }
  return result
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const n      = sorted.length
  return {
    mean: values.reduce((s, v) => s + v, 0) / n,
    p50:  sorted[Math.floor(n * 0.50)],
    p95:  sorted[Math.floor(n * 0.95)],
    p99:  sorted[Math.floor(n * 0.99)],
    min:  sorted[0],
    max:  sorted[n - 1],
  }
}

// ---------------------------------------------------------------------------
// Run a suite
// ---------------------------------------------------------------------------

async function runSuite(label, path, headers = {}) {
  process.stdout.write(`  ${label.padEnd(20)}`)

  // Warm up — prime any caches, JIT, keep-alive connections
  for (let i = 0; i < WARMUP; i++) await request(path, headers)

  const results = []
  for (let i = 0; i < ITERATIONS; i++) {
    results.push(await request(path, headers))
  }

  const ttfbs      = results.map(r => r.ttfb)
  const totals     = results.map(r => r.total)
  const serverData = results.map(r => r.timing.data   ?? 0).filter(v => v > 0)
  const serverRend = results.map(r => r.timing.render  ?? 0).filter(v => v > 0)
  const bodyBytes  = results[0].bodyBytes

  const out = {
    label,
    path,
    iterations: ITERATIONS,
    ttfb:        stats(ttfbs),
    total:       stats(totals),
    bodyBytes,
    serverData:  serverData.length  ? stats(serverData)  : null,
    serverRender: serverRend.length ? stats(serverRend)  : null,
  }

  // Quick inline summary
  const t = n => n.toFixed(1).padStart(6)
  process.stdout.write(
    `ttfb p50${t(out.ttfb.p50)}ms  p95${t(out.ttfb.p95)}ms  p99${t(out.ttfb.p99)}ms` +
    (out.serverData   ? `  data p50${t(out.serverData.p50)}ms`   : '') +
    (out.serverRender ? `  render p50${t(out.serverRender.p50)}ms` : '') +
    `  body ${(bodyBytes / 1024).toFixed(1)}kB\n`
  )

  return out
}

// ---------------------------------------------------------------------------
// Run a streaming scope suite
// Reports shell arrival time (when shell content first appears in the stream)
// vs total time (all bytes received). The gap shows how much sooner the
// browser can start rendering when deferred-only fetchers don't block the shell.
// ---------------------------------------------------------------------------

async function runStreamSuite(label, path) {
  const SHELL_MARKER = 'data-bench="shell"'
  process.stdout.write(`  ${label.padEnd(22)}`)

  for (let i = 0; i < WARMUP; i++) await streamRequest(path, SHELL_MARKER)

  const results = []
  for (let i = 0; i < ITERATIONS; i++) {
    results.push(await streamRequest(path, SHELL_MARKER))
  }

  const shellStats = stats(results.map(r => r.shellTime))
  const totalStats = stats(results.map(r => r.total))
  const bodyBytes  = results[0].bodyBytes

  const t = n => n.toFixed(1).padStart(6)
  process.stdout.write(
    `shell p50${t(shellStats.p50)}ms  p95${t(shellStats.p95)}ms` +
    `  total p50${t(totalStats.p50)}ms  p95${t(totalStats.p95)}ms` +
    `  body ${(bodyBytes / 1024).toFixed(1)}kB\n`
  )

  return { label, path, iterations: ITERATIONS, shellTime: shellStats, total: totalStats, bodyBytes }
}

// ---------------------------------------------------------------------------
// Bundle sizes
// ---------------------------------------------------------------------------

function measureBundles() {
  const distDir = path.join(ROOT, 'public', 'dist')
  if (!fs.existsSync(distDir)) return null

  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'))
  const result = {}
  for (const f of files) {
    const bytes = fs.statSync(path.join(distDir, f)).size
    const key   = f.includes('runtime') ? 'runtime' : f.replace(/\.[^.]+$/, '').replace(/-[A-Z0-9]+$/, '')
    result[key] = { file: f, bytes }
  }
  return result
}

// ---------------------------------------------------------------------------
// Compare two result files
// ---------------------------------------------------------------------------

function compare() {
  const files = fs.readdirSync(RESULTS)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-2)

  if (files.length < 2) {
    console.log('Need at least 2 saved results to compare. Run with --save first.')
    return
  }

  const [before, after] = files.map(f => JSON.parse(fs.readFileSync(path.join(RESULTS, f), 'utf8')))

  console.log(`\nComparing: ${files[0]} → ${files[1]}\n`)
  console.log('Suite'.padEnd(22) + 'Metric'.padEnd(16) + 'Before'.padStart(10) + 'After'.padStart(10) + 'Delta'.padStart(10) + '  Change')
  console.log('─'.repeat(78))

  const fmt  = n  => n?.toFixed(2).padStart(10) ?? '         —'
  const diff = (a, b) => {
    if (a == null || b == null) return '         —'
    const d = b - a
    const pct = ((d / a) * 100).toFixed(1)
    const sign = d > 0 ? '+' : ''
    return `${(sign + d.toFixed(2)).padStart(10)}  ${sign}${pct}%`
  }

  for (const suite of before.suites) {
    const afterSuite = after.suites.find(s => s.label === suite.label)
    if (!afterSuite) continue

    // Streaming scope suites use shellTime instead of ttfb
    const rows = suite.shellTime ? [
      ['shell p50',  suite.shellTime.p50,      afterSuite.shellTime?.p50],
      ['shell p95',  suite.shellTime.p95,      afterSuite.shellTime?.p95],
      ['total p50',  suite.total.p50,          afterSuite.total.p50],
      ['body kB',    suite.bodyBytes / 1024,   afterSuite.bodyBytes / 1024],
    ] : [
      ['ttfb p50',    suite.ttfb.p50,          afterSuite.ttfb.p50],
      ['ttfb p95',    suite.ttfb.p95,          afterSuite.ttfb.p95],
      ['total p50',   suite.total.p50,         afterSuite.total.p50],
      ['body kB',     suite.bodyBytes / 1024,  afterSuite.bodyBytes / 1024],
    ]
    if (suite.serverData) rows.push(['server data p50', suite.serverData.p50, afterSuite.serverData?.p50])
    if (suite.serverRender) rows.push(['server render p50', suite.serverRender.p50, afterSuite.serverRender?.p50])

    rows.forEach(([metric, b, a], i) => {
      const label = i === 0 ? suite.label : ''
      console.log(label.padEnd(22) + metric.padEnd(16) + fmt(b) + fmt(a) + diff(b, a))
    })
    console.log()
  }

  if (before.bundles && after.bundles) {
    console.log('Bundle sizes:')
    for (const [key, b] of Object.entries(before.bundles)) {
      const a = after.bundles[key]
      if (!a) continue
      const d = a.bytes - b.bytes
      console.log(`  ${key.padEnd(20)} ${(b.bytes/1024).toFixed(2)}kB → ${(a.bytes/1024).toFixed(2)}kB  (${d > 0 ? '+' : ''}${d}B)`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args    = process.argv.slice(2)
  const doSave  = args.includes('--save')
  const doComp  = args.includes('--compare')

  if (doComp) { compare(); return }

  console.log(`\nPulse Performance Benchmark`)
  console.log(`Warmup: ${WARMUP} req · Iterations: ${ITERATIONS} req per suite\n`)

  // Start benchmark server
  const { server } = createServer(
    [simpleSpec, data1Spec, data3Spec, cachedSpec, streamScopedSpec, streamUnscopedSpec],
    { port: PORT, stream: true, dev: false }
  )
  await sleep(100)  // let server start

  const suites = []

  console.log('Server-side suites (streaming SSR):')
  suites.push(await runSuite('simple',      '/bench/simple'))
  suites.push(await runSuite('data-1',      '/bench/data-1'))
  suites.push(await runSuite('data-3',      '/bench/data-3'))
  suites.push(await runSuite('cached',      '/bench/cached'))

  console.log('\nClient navigation suites (X-Pulse-Navigate):')
  suites.push(await runSuite('nav/simple',  '/bench/simple', { 'x-pulse-navigate': 'true' }))
  suites.push(await runSuite('nav/data-1',  '/bench/data-1', { 'x-pulse-navigate': 'true' }))
  suites.push(await runSuite('nav/data-3',  '/bench/data-3', { 'x-pulse-navigate': 'true' }))

  console.log('\nStreaming scope suites (shell arrival time vs total):')
  console.log('  (shell = when first view content appears in stream; total = all bytes received)')
  suites.push(await runStreamSuite('stream/scoped',   '/bench/stream-scoped'))
  suites.push(await runStreamSuite('stream/unscoped', '/bench/stream-unscoped'))

  // Bundle sizes
  const bundles = measureBundles()
  if (bundles) {
    console.log('\nBundle sizes (uncompressed):')
    for (const [key, { file, bytes }] of Object.entries(bundles)) {
      console.log(`  ${key.padEnd(20)} ${(bytes / 1024).toFixed(2)}kB  (${file})`)
    }
  }

  // Shut down
  server.close()

  // Save results
  if (doSave) {
    fs.mkdirSync(RESULTS, { recursive: true })
    const now  = new Date()
    const pad  = n => String(n).padStart(2, '0')
    const name = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.json`
    const out  = {
      timestamp: now.toISOString(),
      node:      process.version,
      suites,
      bundles,
    }
    fs.writeFileSync(path.join(RESULTS, name), JSON.stringify(out, null, 2))
    console.log(`\nSaved → benchmark/results/${name}`)
    console.log('Run again with --save after changes, then --compare to see the diff.')
  } else {
    console.log('\nRun with --save to record this baseline.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
