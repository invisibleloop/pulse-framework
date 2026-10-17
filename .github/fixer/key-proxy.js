#!/usr/bin/env node
// Holds the Anthropic API key so the model's shell commands never can.
//
// The fixer agent runs repo code (`npm test`). If the real key sat in that process's
// environment, a prompt-injected model could write a test that sends it out. Instead:
//   - this proxy runs as a different OS user, with the key read from stdin (never an
//     env var or argv, both of which other processes of the same user can read);
//   - the agent gets a placeholder key and ANTHROPIC_BASE_URL pointing here;
//   - the proxy adds the real key and forwards only the Messages API to Anthropic.
// Code under test can still make requests through it for the length of the job
// (bounded by MAX_REQUESTS), but it has no way to read the key itself.
import http from 'node:http'
import https from 'node:https'

const ALLOWED = new Set(['/v1/messages', '/v1/messages/count_tokens'])

export function createProxy({ key, upstream = 'https://api.anthropic.com', maxRequests = 400 }) {
  const target = new URL(upstream)
  const client = target.protocol === 'https:' ? https : http
  let served = 0

  return http.createServer((req, res) => {
    const path = (req.url || '').split('?')[0]
    const fail = (code, msg) => { res.writeHead(code, { 'content-type': 'text/plain' }); res.end(msg) }

    if (req.method !== 'POST' || !ALLOWED.has(path)) return fail(404, 'not found')
    if (++served > maxRequests) return fail(429, 'request budget for this run is used up')

    const headers = {}
    for (const h of ['content-type', 'content-length', 'accept', 'anthropic-version', 'anthropic-beta', 'user-agent']) {
      if (req.headers[h]) headers[h] = req.headers[h]
    }
    headers['x-api-key'] = key
    headers['anthropic-version'] ??= '2023-06-01'

    const up = client.request({
      protocol: target.protocol, hostname: target.hostname, port: target.port || undefined,
      method: 'POST', path: req.url, headers,
    }, r => {
      res.writeHead(r.statusCode, r.headers)
      r.pipe(res)
    })
    up.on('error', () => { if (!res.headersSent) fail(502, 'upstream error'); else res.destroy() })
    req.pipe(up)
  })
}

async function readStdin() {
  let s = ''
  for await (const c of process.stdin) s += c
  return s.trim()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = await readStdin()
  if (!key) { console.error('key-proxy: no key on stdin'); process.exit(1) }
  const port = Number(process.env.PROXY_PORT) || 8787
  createProxy({ key, upstream: process.env.PROXY_UPSTREAM || undefined })
    .listen(port, '127.0.0.1', () => console.log(`key-proxy listening on 127.0.0.1:${port}`))
}
