/**
 * Pulse — Built-in load test runner
 *
 * Sends N concurrent HTTP request chains for D seconds, collects latencies,
 * calculates percentiles, and prints a JSON result.
 *
 * Usage:
 *   node src/cli/load-runner.js --url http://localhost:3000/about [--duration 10] [--connections 10]
 */

import http  from 'http'
import https from 'https'

const args         = process.argv.slice(2)
const urlArg       = args.indexOf('--url')
const durArg       = args.indexOf('--duration')
const connArg      = args.indexOf('--connections')

const url         = urlArg  !== -1 ? args[urlArg  + 1] : null
const duration    = durArg  !== -1 ? parseInt(args[durArg  + 1], 10) : 10
const connections = connArg !== -1 ? parseInt(args[connArg + 1], 10) : 10

// --header "Key: Value" (repeatable)
const headers = {}
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--header' && args[i + 1]) {
    const colon = args[i + 1].indexOf(':')
    if (colon > 0) {
      headers[args[i + 1].slice(0, colon).trim()] = args[i + 1].slice(colon + 1).trim()
    }
    i++
  }
}

if (!url) {
  console.error('Usage: node load-runner.js --url <url> [--duration 10] [--connections 10] [--header "Key: Value"]')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run(url, { duration, connections, headers = {} }) {
  const parsed  = new URL(url)
  const client  = parsed.protocol === 'https:' ? https : http
  const opts    = { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }
  const latencies = []
  let errors    = 0
  let inflight  = 0
  const deadline = Date.now() + duration * 1000
  const start   = Date.now()

  function request() {
    if (Date.now() >= deadline) return
    inflight++
    const t0  = Date.now()
    const req = client.get(opts, res => {
      res.resume()
      res.on('end', () => {
        if (res.statusCode < 500) {
          latencies.push(Date.now() - t0)
        } else {
          errors++
        }
        inflight--
        request()
      })
    })
    req.on('error', () => {
      errors++
      inflight--
      request()
    })
    req.setTimeout(10000, () => {
      req.destroy()
      errors++
      inflight--
      request()
    })
  }

  // Start N concurrent request chains
  for (let i = 0; i < connections; i++) request()

  // Wait for deadline then drain in-flight requests
  await new Promise(resolve => setTimeout(resolve, duration * 1000 + 500))
  await new Promise(resolve => {
    const drain = () => inflight === 0 ? resolve() : setTimeout(drain, 20)
    drain()
  })

  const elapsed = (Date.now() - start) / 1000
  latencies.sort((a, b) => a - b)
  const n = latencies.length

  function pct(p) {
    if (!n) return 0
    return latencies[Math.min(n - 1, Math.ceil((p / 100) * n) - 1)]
  }

  const mean = n ? +(latencies.reduce((s, v) => s + v, 0) / n).toFixed(1) : 0

  return {
    url,
    config:   { duration, connections },
    rps:      +(n / elapsed).toFixed(1),
    latency:  { mean, p50: pct(50), p95: pct(95), p99: pct(99), max: latencies[n - 1] ?? 0 },
    requests: { total: n + errors, success: n, errors },
    duration: +elapsed.toFixed(1),
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

process.stderr.write(`⚡ Load testing ${url} — ${connections} connections × ${duration}s\n`)

const result = await run(url, { duration, connections, headers })
console.log(JSON.stringify(result, null, 2))
