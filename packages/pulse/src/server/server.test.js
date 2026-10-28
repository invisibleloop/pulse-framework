/**
 * Pulse — HTTP Server tests
 * run: node src/server/server.test.js
 */

import http from 'http'
import net  from 'net'
import fs   from 'fs'
import os   from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { createServer, TtlCache } from './index.js'

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

async function test(label, fn) {
  try {
    await fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${label}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

// Guard against a silent early exit. Production code calls process.exit() (graceful shutdown), and a
// test that lets it through ends the whole run with status 0 — skipping every later test and hiding
// earlier failures. The summary at the bottom sets `finished`; if the process exits without it, fail.
let finished = false
process.on('exit', () => {
  if (finished) return
  console.error(`\n  ✗ test run ended early after ${passed + failed} tests — something called process.exit() before the summary\n`)
  process.exitCode = 1
})

/**
 * Replace process.exit while a test runs so graceful-shutdown code can "exit" without killing the run.
 * Returns { codes, waitForExit(ms), restore() } — always restore() in a finally.
 */
function captureExit() {
  const real  = process.exit
  const codes = []
  let notify
  const called = new Promise(resolve => { notify = resolve })
  process.exit = (code = 0) => { codes.push(code); notify() }
  return {
    codes,
    /** Resolves true once process.exit() has been called, false if it wasn't within `ms`. */
    waitForExit: (ms = 2000) => Promise.race([called.then(() => true), new Promise(r => setTimeout(() => r(false), ms))]),
    restore: () => { process.exit = real },
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function get(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
  })
}

function request(port, method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { method, hostname: 'localhost', port, path, headers },
      (res) => {
        let body = ''
        res.on('data', c => { body += c })
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
      }
    )
    req.on('error', reject)
    req.end()
  })
}

function requestWithBody(port, method, path, body, contentType = 'application/json') {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body)
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: 'localhost',
        port,
        path,
        headers: { 'Content-Type': contentType, 'Content-Length': buf.length }
      },
      (res) => {
        let resBody = ''
        res.on('data', c => { resBody += c })
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: resBody }))
      }
    )
    req.on('error', reject)
    req.write(buf)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Specs used across tests
// ---------------------------------------------------------------------------

const helloSpec = {
  route: '/hello',
  state: {},
  view:  () => '<h1>Hello world</h1>'
}

const productSpec = {
  route: '/products/:id',
  state: {},
  server: {
    product: async (ctx) => ({ id: ctx.params.id, name: 'Widget' })
  },
  view: (_s, server) => `<h1>${server.product.name} (${server.product.id})</h1>`
}

const querySpec = {
  route: '/search',
  state: {},
  server: {
    results: async (ctx) => [`Result for: ${ctx.query.q || 'none'}`]
  },
  view: (_s, server) => `<p>${server.results[0]}</p>`
}

const cookieSpec = {
  route: '/profile',
  state: {},
  server: {
    user: async (ctx) => ctx.cookies.user || 'anonymous'
  },
  view: (_s, server) => `<p>${server.user}</p>`
}

const metaSpec = {
  route: '/about',
  state: {},
  view:  () => '<p>About</p>',
  meta: { title: 'About Us', description: 'Learn more' }
}

// ---------------------------------------------------------------------------
// Server lifecycle helper — unique port per test to avoid TCP TIME_WAIT
// ---------------------------------------------------------------------------

let nextPort = 13337

async function withServer(specs, options, fn) {
  const port = nextPort++
  const { server } = await createServer(specs, { ...options, port })
  await new Promise(resolve => server.once('listening', resolve))
  try {
    await fn(port)
  } finally {
    server.closeAllConnections?.()
    await new Promise(resolve => server.close(resolve))
  }
}

// ---------------------------------------------------------------------------

console.log('\nRoute matching\n')

await test('serves a registered route', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/hello')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('<h1>Hello world</h1>'), `Missing content: ${body}`)
  })
})

await test('returns 404 for unknown route', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/nope')
    assert(status === 404, `Expected 404, got ${status}`)
    assert(body.includes('404'), `Expected 404 page: ${body}`)
  })
})

await test('extracts route params', async () => {
  await withServer([productSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/products/42')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('Widget (42)'), `Expected param in output: ${body}`)
  })
})

await test('serves multiple routes', async () => {
  await withServer([helloSpec, productSpec], { stream: false }, async (port) => {
    const r1 = await get(port, '/hello')
    const r2 = await get(port, '/products/99')
    assert(r1.body.includes('Hello world'), `Route 1 failed: ${r1.body}`)
    assert(r2.body.includes('Widget (99)'), `Route 2 failed: ${r2.body}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nRequest context\n')

await test('passes query string to server fetcher', async () => {
  await withServer([querySpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/search?q=pulse')
    assert(body.includes('Result for: pulse'), `Expected query result: ${body}`)
  })
})

await test('parses cookies from Cookie header', async () => {
  await withServer([cookieSpec], { stream: false }, async (port) => {
    const { body } = await request(port, 'GET', '/profile', { Cookie: 'user=andy' })
    assert(body.includes('andy'), `Expected cookie value in output: ${body}`)
  })
})

await test('returns anonymous when no cookie set', async () => {
  await withServer([cookieSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/profile')
    assert(body.includes('anonymous'), `Expected anonymous: ${body}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nResponse — string mode\n')

await test('wraps content in full HTML document', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/hello')
    assert(body.includes('<!DOCTYPE html>'), `Missing DOCTYPE: ${body}`)
    assert(body.includes('</html>'), `Missing closing tag: ${body}`)
  })
})

await test('sets title from spec.meta', async () => {
  await withServer([metaSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes('<title>About Us</title>'), `Expected title: ${body}`)
  })
})

await test('resolves async meta.title function (string mode)', async () => {
  const spec = {
    route: '/async-meta',
    state: {},
    view:  () => '<p>content</p>',
    meta:  { title: async () => 'Async Title' },
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { body } = await get(port, '/async-meta')
    assert(body.includes('<title>Async Title</title>'), `Expected async title: ${body}`)
  })
})

await test('resolves async meta.title function (streaming mode)', async () => {
  const spec = {
    route: '/async-meta-stream',
    state: {},
    view:  () => '<p>content</p>',
    meta:  { title: async () => 'Stream Async Title' },
  }
  await withServer([spec], { stream: true }, async (port) => {
    const { body } = await get(port, '/async-meta-stream')
    assert(body.includes('<title>Stream Async Title</title>'), `Expected async title in stream: ${body}`)
  })
})

await test('injects JSON-LD script when meta.schema is set (string mode)', async () => {
  const spec = {
    route: '/article',
    state: {},
    view:  () => '<p>Article</p>',
    meta: {
      title: 'An Article',
      schema: { '@context': 'https://schema.org', '@type': 'Article', headline: 'An Article' }
    }
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { body } = await get(port, '/article')
    assert(body.includes('application/ld+json'),   `Expected ld+json script: ${body.slice(0, 300)}`)
    assert(body.includes('schema.org'),             `Expected schema.org context`)
    assert(body.includes('"Article"'),              `Expected @type Article`)
  })
})

await test('injects JSON-LD script when meta.schema is set (stream mode)', async () => {
  const spec = {
    route: '/article-stream',
    state: {},
    view:  () => '<p>Article</p>',
    meta: {
      title: 'An Article',
      schema: { '@context': 'https://schema.org', '@type': 'Article', headline: 'An Article' }
    }
  }
  await withServer([spec], { stream: true }, async (port) => {
    const { body } = await get(port, '/article-stream')
    assert(body.includes('application/ld+json'), `Expected ld+json in stream: ${body.slice(0, 300)}`)
    assert(body.includes('schema.org'),          `Expected schema.org context in stream`)
  })
})

await test('sets Content-Type to text/html', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { headers } = await get(port, '/hello')
    assert(headers['content-type']?.includes('text/html'), `Expected text/html: ${headers['content-type']}`)
  })
})

await test('sets Server-Timing header', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { headers } = await get(port, '/hello')
    assert(headers['server-timing'], `Expected Server-Timing header`)
    assert(headers['server-timing'].includes('total'), `Expected total in Server-Timing: ${headers['server-timing']}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nResponse — stream mode\n')

await test('streams content with Transfer-Encoding: chunked', async () => {
  await withServer([helloSpec], { stream: true }, async (port) => {
    const { headers, body } = await get(port, '/hello')
    assert(headers['transfer-encoding'] === 'chunked', `Expected chunked: ${headers['transfer-encoding']}`)
    assert(body.includes('<h1>Hello world</h1>'), `Missing content: ${body}`)
  })
})

await test('stream response includes pulse-root div', async () => {
  await withServer([helloSpec], { stream: true }, async (port) => {
    const { body } = await get(port, '/hello')
    assert(body.includes('pulse-root'), `Missing pulse-root: ${body}`)
  })
})

await test('stream response includes timing script', async () => {
  await withServer([helloSpec], { stream: true }, async (port) => {
    const { body } = await get(port, '/hello')
    assert(body.includes('__PULSE_TIMING__'), `Missing timing script: ${body}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nMethod handling\n')

await test('rejects non-GET requests with 405', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await request(port, 'POST', '/hello')
    assert(status === 405, `Expected 405, got ${status}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nStartup validation\n')

await test('throws on invalid spec at startup', async () => {
  let threw = false
  try {
    await createServer([{ route: '/bad' }], { port: 19999 })
  } catch (e) {
    threw = true
    assert(e.message.includes('/bad'), `Expected route in error: ${e.message}`)
  }
  assert(threw, 'Expected createServer to throw on invalid spec')
})

await test('onRequest hook can short-circuit routing', async () => {
  await withServer([helloSpec], {
    stream: false,
    onRequest: (_req, res) => {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden')
      return false
    }
  }, async (port) => {
    const { status } = await get(port, '/hello')
    assert(status === 403, `Expected 403, got ${status}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nClient-side navigation\n')

const navSpec = {
  route:   '/nav-page',
  hydrate: '/examples/nav-page.js',
  state:   {},
  meta:    { title: 'Nav Page' },
  server:  { msg: async () => 'hello from server' },
  view:    (_s, server) => `<p>${server.msg}</p>`
}

await test('X-Pulse-Navigate returns JSON', async () => {
  await withServer([navSpec], { stream: false }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/nav-page', { 'X-Pulse-Navigate': 'true' })
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type']?.includes('application/json'), `Expected JSON: ${headers['content-type']}`)
  })
})

await test('navigation response contains html, title, hydrate', async () => {
  await withServer([navSpec], { stream: false }, async (port) => {
    const { body } = await request(port, 'GET', '/nav-page', { 'X-Pulse-Navigate': 'true' })
    const payload = JSON.parse(body)
    assert(typeof payload.html === 'string',    `Expected html string`)
    assert(payload.title === 'Nav Page',        `Expected title: ${payload.title}`)
    assert(payload.hydrate === '/examples/nav-page.js', `Expected hydrate path: ${payload.hydrate}`)
  })
})

await test('navigation response html contains rendered server data', async () => {
  await withServer([navSpec], { stream: false }, async (port) => {
    const { body } = await request(port, 'GET', '/nav-page', { 'X-Pulse-Navigate': 'true' })
    const { html } = JSON.parse(body)
    assert(html.includes('hello from server'), `Expected server data in html: ${html}`)
  })
})

await test('navigation response is not a full HTML document', async () => {
  await withServer([navSpec], { stream: false }, async (port) => {
    const { body } = await request(port, 'GET', '/nav-page', { 'X-Pulse-Navigate': 'true' })
    const { html } = JSON.parse(body)
    assert(!html.includes('<!DOCTYPE'), `Nav response should not be a full document: ${html}`)
  })
})

await test('normal request still returns full HTML document', async () => {
  await withServer([navSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/nav-page')
    assert(body.includes('<!DOCTYPE html>'), `Expected full document: ${body}`)
  })
})

// ---------------------------------------------------------------------------

const streamNavSpec = {
  route:   '/stream-nav',
  hydrate: '/examples/stream-nav.js',
  state:   {},
  meta:    { title: 'Stream Nav', styles: ['/app.css'] },
  server:  { msg: async () => 'streamed hello' },
  view:    (_s, server) => `<main id="main-content">${server.msg}</main>`
}

const deferredNavSpec = {
  route:   '/deferred-nav',
  hydrate: '/examples/deferred-nav.js',
  state:   {},
  meta:    { title: 'Deferred Nav' },
  server:  {
    fast: async () => 'shell-data',
    slow: async () => { await new Promise(r => setTimeout(r, 30)); return 'deferred-data' },
  },
  stream: {
    shell:    ['header'],
    deferred: ['feed'],
    scope:    { header: ['fast'], feed: ['slow'] },
  },
  view: {
    header: (_s, srv) => `<header>${srv.fast}</header>`,
    feed:   (_s, srv) => `<aside>${srv.slow}</aside>`,
  },
}

console.log('\nClient-side navigation — streaming (stream: true)\n')

await test('X-Pulse-Navigate with stream:true returns application/x-ndjson for deferred specs', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type']?.includes('application/x-ndjson'), `Expected NDJSON: ${headers['content-type']}`)
  })
})

await test('X-Pulse-Navigate with stream:true returns application/json for non-deferred specs', async () => {
  await withServer([streamNavSpec], { stream: true }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/stream-nav', { 'X-Pulse-Navigate': 'true' })
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type']?.includes('application/json'), `Expected JSON: ${headers['content-type']}`)
  })
})

await test('streaming nav: first NDJSON line is a meta message with title and hydrate', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { body } = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    const lines    = body.trim().split('\n').filter(Boolean)
    const meta     = JSON.parse(lines[0])
    assert(meta.type === 'meta',                            `First line should be meta, got ${meta.type}`)
    assert(meta.title === 'Deferred Nav',                   `Expected title 'Deferred Nav', got ${meta.title}`)
    assert(meta.hydrate === '/examples/deferred-nav.js',    `Expected hydrate, got ${meta.hydrate}`)
  })
})

await test('streaming nav: html message contains rendered server data', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { body }  = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    const messages  = body.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    const htmlMsg   = messages.find(m => m.type === 'html')
    assert(htmlMsg,                                    'should have html message')
    assert(htmlMsg.html.includes('shell-data'),        `Expected shell server data in html: ${htmlMsg.html}`)
    assert(!htmlMsg.html.includes('<!DOCTYPE'),        'html should not be a full document')
  })
})

await test('streaming nav: done message contains serverState', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { body }   = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    const messages   = body.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    const done       = messages.find(m => m.type === 'done')
    assert(done,                                              'should have done message')
    assert(done.serverState?.fast === 'shell-data',           `Expected serverState.fast, got ${JSON.stringify(done.serverState)}`)
  })
})

await test('streaming nav: deferred spec sends shell then deferred then done', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { body }   = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    const messages   = body.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    const types      = messages.map(m => m.type)
    assert(types[0] === 'meta',                           `First should be meta, got ${types[0]}`)
    assert(types.includes('html'),                        'should include html')
    assert(types.includes('deferred'),                    'should include deferred')
    assert(types[types.length - 1] === 'done',            'last should be done')

    const deferred = messages.find(m => m.type === 'deferred')
    assert(deferred?.id === 'feed',                       `Expected deferred id 'feed', got ${deferred?.id}`)
    assert(deferred?.html.includes('deferred-data'),      `Expected deferred content, got: ${deferred?.html}`)

    // Shell arrives before deferred: html index should precede deferred index
    const htmlIdx     = types.indexOf('html')
    const deferredIdx = types.indexOf('deferred')
    assert(htmlIdx < deferredIdx, `html (${htmlIdx}) should precede deferred (${deferredIdx})`)
  })
})

await test('streaming nav: html includes <pulse-deferred> placeholder for deferred segments', async () => {
  await withServer([deferredNavSpec], { stream: true }, async (port) => {
    const { body }  = await request(port, 'GET', '/deferred-nav', { 'X-Pulse-Navigate': 'true' })
    const messages  = body.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    const html      = messages.find(m => m.type === 'html')
    assert(html?.html.includes('pd-feed'), `Shell html should include placeholder, got: ${html?.html}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nError pages\n')

const throwingSpec = {
  route: '/boom',
  state: {},
  view:  () => { throw new Error('view exploded') }
}

await test('dev mode returns HTML error page on render error (string mode)', async () => {
  // dev: true writes to the error journal at <root>/.pulse/errors.json — pass an
  // isolated tmp root so this doesn't leave a file behind in the package directory.
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-boom-'))
  await withServer([throwingSpec], { stream: false, dev: true, root: tmpRoot }, async (port) => {
    const { status, headers, body } = await get(port, '/boom')
    assert(status === 500,                            `Expected 500, got ${status}`)
    assert(headers['content-type']?.includes('text/html'), `Expected HTML, got ${headers['content-type']}`)
    assert(body.includes('view exploded'),             `Expected error message in page: ${body.slice(0, 200)}`)
    assert(body.includes('Stack trace'),              `Expected stack trace section in page`)
  })
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})

await test('production mode returns generic error page (no stack trace)', async () => {
  await withServer([throwingSpec], { stream: false, dev: false }, async (port) => {
    const { status, body } = await get(port, '/boom')
    assert(status === 500,                    `Expected 500, got ${status}`)
    assert(!body.includes('view exploded'),   `Should not expose error details in prod: ${body.slice(0, 200)}`)
    assert(body.includes('500'),              `Expected 500 in body`)
  })
})

await test('dev mode injects error into stream when render throws (stream mode)', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-boom-'))
  await withServer([throwingSpec], { stream: true, dev: true, root: tmpRoot }, async (port) => {
    const { status, body } = await get(port, '/boom')
    assert(status === 200,                       `Stream mode commits 200 before error, got ${status}`)
    assert(body.includes('view exploded'),        `Expected error message injected into stream: ${body.slice(0, 400)}`)
    assert(body.includes('pulse-root'),           `Expected pulse-root in partial document`)
  })
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})

await test('production stream mode hides error details', async () => {
  await withServer([throwingSpec], { stream: true, dev: false }, async (port) => {
    const { status, body } = await get(port, '/boom')
    assert(status === 200,                    `Stream mode commits 200 before error, got ${status}`)
    assert(!body.includes('view exploded'),   `Should not expose error details in prod stream`)
    assert(body.includes('Something went wrong'), `Expected generic message in prod stream`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nRaw content responses\n')

const rssSpec = {
  route:       '/feed.xml',
  contentType: 'application/rss+xml; charset=utf-8',
  render:      () => `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title></channel></rss>`
}

const jsonFeedSpec = {
  route:       '/api/posts',
  contentType: 'application/json',
  server:      { posts: async () => [{ id: 1, title: 'Hello' }] },
  render:      (_ctx, server) => JSON.stringify(server.posts)
}

await test('raw spec serves correct Content-Type', async () => {
  await withServer([rssSpec], {}, async (port) => {
    const { status, headers } = await get(port, '/feed.xml')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type'].includes('application/rss+xml'), `Wrong content-type: ${headers['content-type']}`)
  })
})

await test('raw spec serves rendered body', async () => {
  await withServer([rssSpec], {}, async (port) => {
    const { body } = await get(port, '/feed.xml')
    assert(body.includes('<rss'), `Missing RSS content: ${body.slice(0, 100)}`)
    assert(body.includes('<title>Test</title>'), `Missing title: ${body.slice(0, 200)}`)
  })
})

await test('raw spec resolves server data and passes to render', async () => {
  await withServer([jsonFeedSpec], {}, async (port) => {
    const { body, headers } = await get(port, '/api/posts')
    assert(headers['content-type'].includes('application/json'), `Wrong content-type: ${headers['content-type']}`)
    const data = JSON.parse(body)
    assert(Array.isArray(data) && data[0].title === 'Hello', `Unexpected data: ${body}`)
  })
})

await test('raw spec does not return an HTML document', async () => {
  await withServer([rssSpec], {}, async (port) => {
    const { body } = await get(port, '/feed.xml')
    assert(!body.includes('<!DOCTYPE html>'), `Should not wrap in HTML document`)
    assert(!body.includes('<body>'),           `Should not include body tag`)
  })
})

await test('raw spec is not intercepted by X-Pulse-Navigate', async () => {
  await withServer([rssSpec], {}, async (port) => {
    const { headers, body } = await request(port, 'GET', '/feed.xml', { 'X-Pulse-Navigate': 'true' })
    assert(headers['content-type'].includes('application/rss+xml'), `Should still serve raw content on nav request`)
    assert(body.includes('<rss'), `Body should be RSS not JSON`)
  })
})

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

const guardSpec = {
  route: '/protected',
  meta:  { title: 'Protected', styles: [] },
  state: {},
  guard: async (ctx) => {
    if (ctx.headers['x-auth'] !== 'secret') return { redirect: '/login' }
  },
  view: () => `<main id="main-content"><h1>Secret</h1></main>`,
}

await test('guard redirects 302 when condition fails', async () => {
  await withServer([guardSpec], {}, async (port) => {
    const { status, headers } = await request(port, 'GET', '/protected')
    assert(status === 302, `Expected 302, got ${status}`)
    assert(headers.location === '/login', `Expected Location: /login, got ${headers.location}`)
  })
})

await test('guard allows request when condition passes', async () => {
  await withServer([guardSpec], {}, async (port) => {
    const { status, body } = await request(port, 'GET', '/protected', { 'x-auth': 'secret' })
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('Secret'), `Expected page content, got: ${body.slice(0, 200)}`)
  })
})

await test('guard runs before server data fetchers', async () => {
  let fetcherCalled = false
  const spec = {
    route:  '/guarded',
    meta:   { title: 'Guarded', styles: [] },
    state:  {},
    guard:  async () => ({ redirect: '/login' }),
    server: { data: async () => { fetcherCalled = true; return {} } },
    view:   () => `<main id="main-content">Content</main>`,
  }
  await withServer([spec], {}, async (port) => {
    await request(port, 'GET', '/guarded')
    assert(!fetcherCalled, 'Server data fetcher should not run when guard redirects')
  })
})

await test('guard redirect includes security headers', async () => {
  await withServer([guardSpec], {}, async (port) => {
    const { headers } = await request(port, 'GET', '/protected')
    assert(headers['x-frame-options'] === 'DENY', `Missing security header`)
  })
})

// ---------------------------------------------------------------------------
// ctx.setHeader / ctx.setCookie
// ---------------------------------------------------------------------------

const setCtxCookieSpec = {
  route: '/profile',
  meta:  { title: 'Profile', styles: [] },
  state: {},
  guard: async (ctx) => {
    ctx.setCookie('visited', 'true', { httpOnly: true, maxAge: 3600 })
  },
  view: () => `<main id="main-content"><h1>Profile</h1></main>`,
}

await test('ctx.setCookie sets Set-Cookie header on page response', async () => {
  await withServer([setCtxCookieSpec], { stream: false }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/profile')
    assert(status === 200, `Expected 200, got ${status}`)
    const cookies = [headers['set-cookie']].flat().filter(Boolean)
    assert(cookies.some(c => c.includes('visited=true')), `Expected visited cookie, got: ${JSON.stringify(cookies)}`)
    assert(cookies.some(c => c.includes('HttpOnly')), `Expected HttpOnly, got: ${JSON.stringify(cookies)}`)
    assert(cookies.some(c => c.includes('Max-Age=3600')), `Expected Max-Age, got: ${JSON.stringify(cookies)}`)
  })
})

await test('ctx.setCookie works on streaming response', async () => {
  await withServer([setCtxCookieSpec], { stream: true }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/profile')
    assert(status === 200, `Expected 200, got ${status}`)
    const cookies = [headers['set-cookie']].flat().filter(Boolean)
    assert(cookies.some(c => c.includes('visited=true')), `Expected visited cookie in stream response`)
  })
})

await test('ctx.setCookie on guard redirect includes cookie in redirect response', async () => {
  const spec = {
    route: '/logout',
    meta:  { title: 'Logout', styles: [] },
    state: {},
    guard: async (ctx) => {
      ctx.setCookie('session', '', { maxAge: 0 })
      return { redirect: '/login' }
    },
    view: () => `<main id="main-content">Logged out</main>`,
  }
  await withServer([spec], {}, async (port) => {
    const { status, headers } = await request(port, 'GET', '/logout')
    assert(status === 302, `Expected 302, got ${status}`)
    const cookies = [headers['set-cookie']].flat().filter(Boolean)
    assert(cookies.some(c => c.includes('Max-Age=0')), `Expected expired cookie on redirect`)
  })
})

await test('raw response render can return { redirect } for auth callbacks', async () => {
  const callbackSpec = {
    route:       '/auth/callback',
    contentType: 'text/html',
    server: {
      token: async (ctx) => {
        ctx.setCookie('session', 'tok123', { httpOnly: true })
        return 'tok123'
      },
    },
    render: () => ({ redirect: '/dashboard' }),
  }
  await withServer([callbackSpec], {}, async (port) => {
    const { status, headers } = await request(port, 'GET', '/auth/callback')
    assert(status === 302, `Expected 302, got ${status}`)
    assert(headers.location === '/dashboard', `Expected /dashboard, got ${headers.location}`)
    const cookies = [headers['set-cookie']].flat().filter(Boolean)
    assert(cookies.some(c => c.includes('session=tok123')), `Expected session cookie on redirect`)
  })
})

// ---------------------------------------------------------------------------
// Canonical URLs + trailing slash redirects
// ---------------------------------------------------------------------------

const canonicalSpec = {
  route: '/about',
  meta: { title: 'About', styles: [] },
  state: {},
  view: () => `<main id="main-content"><h1>About</h1></main>`,
}

const canonicalOverrideSpec = {
  route: '/about',
  meta: { title: 'About', styles: [], canonical: 'https://example.com/about' },
  state: {},
  view: () => `<main id="main-content"><h1>About</h1></main>`,
}

await test('trailing slash redirects 301 to path without slash', async () => {
  await withServer([canonicalSpec], {}, async (port) => {
    const { status, headers } = await request(port, 'GET', '/about/')
    assert(status === 301, `Expected 301, got ${status}`)
    assert(headers.location === '/about', `Expected Location: /about, got ${headers.location}`)
  })
})

await test('trailing slash redirect preserves query string', async () => {
  await withServer([canonicalSpec], {}, async (port) => {
    const { status, headers } = await request(port, 'GET', '/about/?foo=bar')
    assert(status === 301, `Expected 301, got ${status}`)
    assert(headers.location === '/about?foo=bar', `Expected query preserved, got ${headers.location}`)
  })
})

await test('root path does not redirect', async () => {
  const homeSpec = { route: '/', meta: { title: 'Home', styles: [] }, state: {}, view: () => `<main id="main-content">Home</main>` }
  await withServer([homeSpec], {}, async (port) => {
    const { status } = await request(port, 'GET', '/')
    assert(status === 200, `Root / should not redirect, got ${status}`)
  })
})

await test('canonical tag injected with request host and path', async () => {
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes(`<link rel="canonical" href="http://localhost:${port}/about">`),
      `Missing canonical tag in: ${body.slice(0, 500)}`)
  })
})

await test('meta.canonical overrides auto-generated canonical URL', async () => {
  await withServer([canonicalOverrideSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes(`<link rel="canonical" href="https://example.com/about">`),
      `Expected override canonical, got: ${body.slice(0, 500)}`)
  })
})

await test('meta.canonical as a function receives ctx (string path)', async () => {
  const spec = {
    route: '/about',
    meta: { title: 'About', styles: [], canonical: (ctx) => `https://example.com${ctx.params.slug ?? '/about'}` },
    state: {},
    view: () => `<main id="main-content"><h1>About</h1></main>`,
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes(`<link rel="canonical" href="https://example.com/about">`),
      `Expected function canonical, got: ${body.slice(0, 500)}`)
  })
})

await test('meta.canonical as a function receives serverState (string path)', async () => {
  const spec = {
    route: '/product',
    meta: {
      title:     'Product',
      styles:    [],
      canonical: (ctx, serverState) => `https://example.com/products/${serverState?.data?.slug ?? 'fallback'}`,
    },
    state: {},
    server: { data: async () => ({ slug: 'my-product-slug' }) },
    view: (state, server) => `<main id="main-content"><h1>${server.data.slug}</h1></main>`,
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { body } = await get(port, '/product')
    assert(body.includes(`<link rel="canonical" href="https://example.com/products/my-product-slug">`),
      `Expected serverState-derived canonical, got: ${body.slice(0, 500)}`)
  })
})

await test('meta.canonical as a function receives ctx in streaming mode', async () => {
  const spec = {
    route: '/about',
    meta: { title: 'About', styles: [], canonical: (ctx) => `https://example.com/about` },
    state: {},
    view: () => `<main id="main-content"><h1>About</h1></main>`,
  }
  await withServer([spec], { stream: true }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes(`<link rel="canonical" href="https://example.com/about">`),
      `Expected function canonical in stream, got: ${body.slice(0, 500)}`)
  })
})

await test('canonical tag injected in streaming response', async () => {
  await withServer([canonicalSpec], { stream: true }, async (port) => {
    const { body } = await get(port, '/about')
    assert(body.includes(`<link rel="canonical" href="http://localhost:${port}/about">`),
      `Missing canonical tag in stream response: ${body.slice(0, 500)}`)
  })
})

// trailingSlash: 'add'
await test("trailingSlash:'add' redirects /about to /about/", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'add' }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/about')
    assert(status === 301, `Expected 301, got ${status}`)
    assert(headers.location === '/about/', `Expected Location: /about/, got ${headers.location}`)
  })
})

await test("trailingSlash:'add' does not redirect /about/", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'add' }, async (port) => {
    const { status } = await request(port, 'GET', '/about/')
    assert(status === 200, `Expected 200, got ${status}`)
  })
})

await test("trailingSlash:'add' redirect preserves query string", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'add' }, async (port) => {
    const { status, headers } = await request(port, 'GET', '/about?foo=bar')
    assert(status === 301, `Expected 301, got ${status}`)
    assert(headers.location === '/about/?foo=bar', `Expected query preserved, got ${headers.location}`)
  })
})

await test("trailingSlash:'add' root does not redirect", async () => {
  const homeSpec = { route: '/', meta: { title: 'Home', styles: [] }, state: {}, view: () => `<main id="main-content">Home</main>` }
  await withServer([homeSpec], { trailingSlash: 'add' }, async (port) => {
    const { status } = await request(port, 'GET', '/')
    assert(status === 200, `Root / should not redirect, got ${status}`)
  })
})

await test("trailingSlash:'add' canonical tag uses slash form", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'add', stream: false }, async (port) => {
    const { body } = await get(port, '/about/')
    assert(body.includes(`<link rel="canonical" href="http://localhost:${port}/about/">`),
      `Expected slash canonical, got: ${body.slice(0, 500)}`)
  })
})

// trailingSlash: 'allow'
await test("trailingSlash:'allow' serves /about/ without redirect", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'allow' }, async (port) => {
    const { status } = await request(port, 'GET', '/about/')
    assert(status === 200, `Expected 200, got ${status}`)
  })
})

await test("trailingSlash:'allow' serves /about without redirect", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'allow' }, async (port) => {
    const { status } = await request(port, 'GET', '/about')
    assert(status === 200, `Expected 200, got ${status}`)
  })
})

await test("trailingSlash:'allow' canonical uses no-slash form for both paths", async () => {
  await withServer([canonicalSpec], { trailingSlash: 'allow', stream: false }, async (port) => {
    const { body: bodySlash }    = await get(port, '/about/')
    const { body: bodyNoSlash }  = await get(port, '/about')
    const tag = `<link rel="canonical" href="http://localhost:${port}/about">`
    assert(bodySlash.includes(tag),   `Expected no-slash canonical for /about/, got: ${bodySlash.slice(0, 500)}`)
    assert(bodyNoSlash.includes(tag), `Expected no-slash canonical for /about, got: ${bodyNoSlash.slice(0, 500)}`)
  })
})

// ---------------------------------------------------------------------------
// Security — CSP, HSTS, SameSite, POST support
// ---------------------------------------------------------------------------

// CSP
await test('CSP header present on page response', async () => {
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(headers['content-security-policy'],
      'Missing Content-Security-Policy header')
    assert(headers['content-security-policy'].includes("object-src 'none'"),
      `Expected object-src 'none' in CSP: ${headers['content-security-policy']}`)
  })
})

await test('CSP nonce is present in page response body', async () => {
  const hydrateSpec = {
    route:   '/about',
    meta:    { title: 'About', styles: [] },
    state:   {},
    hydrate: '/examples/about.js',
    view:    () => `<main id="main-content"><h1>About</h1></main>`,
  }
  await withServer([hydrateSpec], { stream: false }, async (port) => {
    const { headers, body } = await request(port, 'GET', '/about')
    const csp   = headers['content-security-policy']
    const match = csp && csp.match(/nonce-([A-Za-z0-9_\-]+)/)
    assert(match, `Expected nonce in CSP header: ${csp}`)
    const nonce = match[1]
    assert(body.includes(`nonce="${nonce}"`),
      `Expected nonce="${nonce}" in HTML body`)
  })
})

await test('CSP nonce differs between requests', async () => {
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const r1 = await request(port, 'GET', '/about')
    const r2 = await request(port, 'GET', '/about')
    const n1 = r1.headers['content-security-policy']?.match(/nonce-([A-Za-z0-9_\-]+)/)?.[1]
    const n2 = r2.headers['content-security-policy']?.match(/nonce-([A-Za-z0-9_\-]+)/)?.[1]
    assert(n1 && n2 && n1 !== n2, `Expected different nonces per request, got: ${n1} and ${n2}`)
  })
})

await test('csp option extends trusted-types, merging with the base pulse policy', async () => {
  // Regression: an agent assumed trusted-types/require-trusted-types-for
  // weren't extendable via createServer's csp option (unlike other
  // directives like img-src/style-src) because no guide demonstrated it —
  // buildCsp's merge loop is actually fully generic across all directive
  // keys, this was a documentation gap, not a real framework limitation.
  // Pin the real behavior so it can't silently regress.
  await withServer([canonicalSpec], { stream: false, csp: { 'trusted-types': ['google'] } }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    const csp = headers['content-security-policy']
    assert(csp.includes('trusted-types pulse google'),
      `Expected trusted-types to merge with the base 'pulse' policy, got: ${csp}`)
  })
})

await test('CSP header present on streaming page response', async () => {
  await withServer([canonicalSpec], { stream: true }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(headers['content-security-policy'],
      'Missing Content-Security-Policy header on streaming response')
  })
})

// Cache-Control
await test('HTML with no spec.cache/defaultCache gets no-cache, not no-store', async () => {
  // Regression: a real Lighthouse audit failed "Page prevented back/forward
  // cache restoration" with reason "cache-control:no-store" on a page that
  // had no cache config at all — the framework's old default was no-store,
  // which unconditionally blocks the browser's bfcache. no-cache still
  // forces revalidation on every direct load (no risk of serving stale
  // content) but does not block bfcache, since bfcache restoration never
  // touches the network.
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(headers['cache-control'] === 'no-cache',
      `Expected no-cache, got: ${headers['cache-control']}`)
  })
})

await test('HTML respects spec.cache / defaultCache when configured', async () => {
  await withServer([helloSpec], { stream: false, defaultCache: 60 }, async (port) => {
    const { headers } = await request(port, 'GET', '/hello')
    assert(headers['cache-control']?.includes('max-age=60'),
      `Expected max-age=60, got: ${headers['cache-control']}`)
  })
})

await test('dev mode always returns no-store regardless of cache config', async () => {
  await withServer([canonicalSpec], { stream: false, dev: true, defaultCache: 3600 }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(headers['cache-control'] === 'no-store',
      `Expected no-store in dev mode, got: ${headers['cache-control']}`)
  })
})

// Dev import map: every public subpath that view/spec code may import must resolve in the
// browser, or the page module fails to load and hydration silently never happens.
await test('dev import map covers @invisibleloop/pulse/html and every target exists', async () => {
  await withServer([canonicalSpec], { stream: false, dev: true }, async (port) => {
    const { body } = await request(port, 'GET', '/about')
    const json = body.match(/<script type="importmap"[^>]*>([\s\S]*?)<\/script>/)?.[1]
    assert(json, 'dev HTML has an import map')
    const imports = JSON.parse(json).imports
    for (const spec of ['image', 'html', 'ui', 'md']) {
      assert(imports[`@invisibleloop/pulse/${spec}`], `import map is missing @invisibleloop/pulse/${spec}`)
    }
    const srcDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
    for (const [name, url] of Object.entries(imports)) {
      assert(url.startsWith('/@pulse/'), `${name} maps outside /@pulse/: ${url}`)
      assert(fs.existsSync(path.join(srcDir, url.slice('/@pulse/'.length))), `${name} -> ${url} does not exist`)
    }
  })
})

// HSTS
await test('HSTS header absent on plain HTTP', async () => {
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(!headers['strict-transport-security'],
      `HSTS should not be present on plain HTTP, got: ${headers['strict-transport-security']}`)
  })
})

await test('HSTS header present when x-forwarded-proto is https', async () => {
  await withServer([canonicalSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/about', { 'x-forwarded-proto': 'https' })
    assert(headers['strict-transport-security'],
      'Expected Strict-Transport-Security header when x-forwarded-proto: https')
    assert(headers['strict-transport-security'].includes('max-age=31536000'),
      `Expected max-age=31536000 in HSTS: ${headers['strict-transport-security']}`)
  })
})

// SameSite default
await test('setCookie defaults to SameSite=Lax', async () => {
  const cookieSpec = {
    route: '/cookie-test',
    state: {},
    guard: async (ctx) => {
      ctx.setCookie('test', 'value', { httpOnly: true })
    },
    view: () => `<main id="main-content">ok</main>`,
  }
  await withServer([cookieSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/cookie-test')
    const cookie = Array.isArray(headers['set-cookie'])
      ? headers['set-cookie'].join('; ')
      : headers['set-cookie'] || ''
    assert(cookie.includes('SameSite=Lax'),
      `Expected SameSite=Lax default, got: ${cookie}`)
  })
})

await test('setCookie SameSite can be overridden to Strict', async () => {
  const cookieSpec2 = {
    route: '/cookie-strict',
    state: {},
    guard: async (ctx) => {
      ctx.setCookie('test', 'value', { sameSite: 'Strict' })
    },
    view: () => `<main id="main-content">ok</main>`,
  }
  await withServer([cookieSpec2], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/cookie-strict')
    const cookie = Array.isArray(headers['set-cookie'])
      ? headers['set-cookie'].join('; ')
      : headers['set-cookie'] || ''
    assert(cookie.includes('SameSite=Strict'),
      `Expected SameSite=Strict override, got: ${cookie}`)
  })
})

// POST support for raw response specs
await test('POST request to raw response spec returns 200', async () => {
  const postSpec = {
    route:       '/webhook',
    contentType: 'application/json',
    render:      () => JSON.stringify({ received: true }),
  }
  await withServer([postSpec], {}, async (port) => {
    const { status } = await request(port, 'POST', '/webhook')
    assert(status === 200, `Expected 200 for POST to raw spec, got ${status}`)
  })
})

await test('POST request to page spec returns 405', async () => {
  await withServer([canonicalSpec], {}, async (port) => {
    const { status } = await request(port, 'POST', '/about')
    assert(status === 405, `Expected 405 for POST to page spec, got ${status}`)
  })
})

// Body parsing

await test('ctx.json() parses JSON POST body', async () => {
  const spec = {
    route:   '/api/items',
    methods: ['GET', 'POST'],
    state:   {},
    guard:   async (ctx) => {
      if (ctx.method === 'POST') {
        const data = await ctx.json()
        return { status: 201, json: { created: data.name } }
      }
    },
    view: () => '<p>items</p>',
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { status, body } = await requestWithBody(port, 'POST', '/api/items', '{"name":"widget"}', 'application/json')
    assert(status === 201, `Expected 201, got ${status}`)
    assert(JSON.parse(body).created === 'widget', `Expected created:widget, got ${body}`)
  })
})

await test('ctx.formData() parses URL-encoded POST body', async () => {
  const spec = {
    route:   '/contact',
    methods: ['GET', 'POST'],
    state:   {},
    guard:   async (ctx) => {
      if (ctx.method === 'POST') {
        const data = await ctx.formData()
        return { redirect: `/thanks?name=${encodeURIComponent(data.name)}` }
      }
    },
    view: () => '<form method="POST"><input name="name"><button>Send</button></form>',
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { status, headers } = await requestWithBody(port, 'POST', '/contact', 'name=Alice', 'application/x-www-form-urlencoded')
    assert(status === 302, `Expected 302, got ${status}`)
    assert(headers.location?.includes('Alice'), `Expected redirect with Alice, got ${headers.location}`)
  })
})

await test('ctx.text() returns raw POST body string', async () => {
  const spec = {
    route:       '/webhook',
    contentType: 'application/json',
    render:      async (ctx) => {
      const raw = await ctx.text()
      return JSON.stringify({ received: raw })
    },
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { status, body } = await requestWithBody(port, 'POST', '/webhook', 'hello world', 'text/plain')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(JSON.parse(body).received === 'hello world', `Expected received body, got ${body}`)
  })
})

await test('POST to page spec without methods returns 405', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await request(port, 'POST', '/hello')
    assert(status === 405, `Expected 405, got ${status}`)
  })
})

await test('spec.methods allows POST on page spec', async () => {
  const spec = {
    route:   '/form',
    methods: ['GET', 'POST'],
    state:   {},
    guard:   async (ctx) => {
      if (ctx.method === 'POST') return { redirect: '/done' }
    },
    view: () => '<form method="POST"><button>Go</button></form>',
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { status } = await request(port, 'POST', '/form')
    assert(status === 302, `Expected 302, got ${status}`)
  })
})

await test('guard can return { status, json } for custom error responses', async () => {
  const spec = {
    route:   '/api/secure',
    methods: ['GET', 'POST'],
    state:   {},
    guard:   async (ctx) => {
      if (ctx.method === 'POST') {
        const data = await ctx.json()
        if (!data?.token) return { status: 401, json: { error: 'Unauthorized' } }
      }
    },
    view: () => '<p>secure</p>',
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { status, body } = await requestWithBody(port, 'POST', '/api/secure', '{}', 'application/json')
    assert(status === 401, `Expected 401, got ${status}`)
    assert(JSON.parse(body).error === 'Unauthorized', `Expected error message, got ${body}`)
  })
})

await test('body exceeding maxBody returns 413', async () => {
  const spec = {
    route:       '/upload',
    contentType: 'application/json',
    render:      async (ctx) => { await ctx.text(); return '{}' },
  }
  await withServer([spec], { stream: false, maxBody: 10 }, async (port) => {
    const { status } = await requestWithBody(port, 'POST', '/upload', 'x'.repeat(100), 'text/plain')
    assert(status === 413, `Expected 413, got ${status}`)
  })
})

await test('spec.maxBody overrides the global limit for that route only', async () => {
  const big = {
    route: '/big', maxBody: 1000, contentType: 'application/json',
    render: async (ctx) => JSON.stringify({ n: (await ctx.text()).length }),
  }
  const small = {
    route: '/small', contentType: 'application/json',
    render: async (ctx) => JSON.stringify({ n: (await ctx.text()).length }),
  }
  await withServer([big, small], { stream: false, maxBody: 10 }, async (port) => {
    const ok = await requestWithBody(port, 'POST', '/big', 'x'.repeat(500), 'text/plain')
    assert(ok.status === 200 && JSON.parse(ok.body).n === 500, `route override should allow 500 bytes, got ${ok.status}`)
    const tooBig = await requestWithBody(port, 'POST', '/big', 'x'.repeat(2000), 'text/plain')
    assert(tooBig.status === 413, `over the route limit should be 413, got ${tooBig.status}`)
    const global = await requestWithBody(port, 'POST', '/small', 'x'.repeat(500), 'text/plain')
    assert(global.status === 413, `other routes keep the global limit, got ${global.status}`)
  })
})

await test('an oversized Content-Length is refused before the body is read', async () => {
  const spec = {
    route: '/cl', contentType: 'application/json',
    render: async (ctx) => { await ctx.text(); return '{}' },
  }
  await withServer([spec], { stream: false, maxBody: 10 }, async (port) => {
    const status = await new Promise((resolve) => {
      // A read-first server would wait for the declared 5000 bytes; fail instead of hanging.
      const timer = setTimeout(() => { req.destroy(); resolve('timeout') }, 3000)
      const req = http.request({ host: '127.0.0.1', port, path: '/cl', method: 'POST', headers: { 'Content-Type': 'text/plain', 'Content-Length': '5000' } }, (res) => {
        clearTimeout(timer); res.resume(); resolve(res.statusCode); req.destroy()
      })
      req.on('error', (e) => { clearTimeout(timer); resolve(e.code) })
      req.write('x') // far less than declared, and the request is never ended
    })
    assert(status === 413, `declared-oversize body should be 413 without waiting for it, got ${status}`)
  })
})

await test('spec.maxBody applies to a CSRF submit route', async () => {
  const form = {
    route: '/form', maxBody: 1000,
    submit: async (ctx) => { const d = await ctx.formData(); return { redirect: `/form?n=${d.note.length}` } },
    view: (state, server) => `<main id="main-content"><form method="POST">${server.csrf ?? ''}</form></main>`,
  }
  await withServer([form], { stream: false, maxBody: 10 }, async (port) => {
    const { cookie, token } = await getCsrfPair(port, '/form')
    const ok = await postForm(port, '/form', { note: 'x'.repeat(400), _csrf: token }, cookie)
    assert(ok.status === 303, `submit within the route limit should succeed, got ${ok.status}`)
    const big = await postForm(port, '/form', { note: 'x'.repeat(2000), _csrf: token }, cookie)
    assert(big.status === 413, `submit over the route limit should be 413, got ${big.status}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nHealth check\n')

await test('GET /healthz returns 200 with JSON status by default', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status, headers, body } = await get(port, '/healthz')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type']?.includes('application/json'), `Expected JSON content-type, got ${headers['content-type']}`)
    const json = JSON.parse(body)
    assert(json.status === 'ok', `Expected status ok, got ${JSON.stringify(json)}`)
    assert(typeof json.uptime === 'number', `Expected uptime number, got ${JSON.stringify(json)}`)
  })
})

await test('HEAD /healthz returns 200 with no body', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status, body } = await request(port, 'HEAD', '/healthz')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body === '', `Expected empty body for HEAD, got: ${body}`)
  })
})

await test('health check uses a custom path when set', async () => {
  await withServer([helloSpec], { stream: false, healthCheck: '/ping' }, async (port) => {
    const { status } = await get(port, '/ping')
    assert(status === 200, `Expected 200 at /ping, got ${status}`)
    const { status: defaultStatus } = await get(port, '/healthz')
    assert(defaultStatus === 404, `Expected 404 at /healthz when overridden, got ${defaultStatus}`)
  })
})

await test('health check can be disabled with healthCheck: false', async () => {
  await withServer([helloSpec], { stream: false, healthCheck: false }, async (port) => {
    const { status } = await get(port, '/healthz')
    assert(status === 404, `Expected 404 when healthCheck disabled, got ${status}`)
  })
})

await test('health check bypasses onRequest hook', async () => {
  let hookCalled = false
  await withServer([helloSpec], {
    stream: false,
    onRequest: () => { hookCalled = true }
  }, async (port) => {
    await get(port, '/healthz')
    assert(!hookCalled, 'Expected onRequest to NOT be called for health check')
  })
})

await test('health check fires before route matching — shadows a user spec at the same path', async () => {
  // Built-in handler is checked before route matching, so a spec at /healthz never runs
  const customSpec = { route: '/healthz', state: {}, view: () => '<p>custom</p>' }
  await withServer([customSpec], { stream: false }, async (port) => {
    const { body } = await get(port, '/healthz')
    assert(body.includes('"status"'), `Expected health JSON, got: ${body}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nCustom 404 page (route: "*")\n')

const notFoundPageSpec = {
  route: '*',
  meta:  { title: 'Lost?' },
  view:  () => '<main id="main-content"><h1>Custom not found</h1><a href="/">Home</a></main>',
}

await test('unknown route renders the "*" spec with status 404', async () => {
  await withServer([helloSpec, notFoundPageSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/nope')
    assert(status === 404, `Expected 404, got ${status}`)
    assert(body.includes('Custom not found'), `Expected custom 404 content, got: ${body.slice(0, 200)}`)
    assert(body.includes('<title>Lost?</title>'), `Expected custom 404 title, got: ${body.slice(0, 300)}`)
  })
})

await test('custom 404 renders in streaming mode too (forced string path)', async () => {
  await withServer([helloSpec, notFoundPageSpec], { stream: true }, async (port) => {
    const { status, body } = await get(port, '/still-nope')
    assert(status === 404, `Expected 404, got ${status}`)
    assert(body.includes('Custom not found'), `Expected custom 404 content`)
  })
})

await test('known routes are unaffected by the "*" spec', async () => {
  await withServer([helloSpec, notFoundPageSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/hello')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('Hello world'), 'Expected normal page content')
  })
})

await test('custom 404 responses are not cached as 200s', async () => {
  await withServer([helloSpec, notFoundPageSpec], { stream: false, defaultCache: 3600, dev: false }, async (port) => {
    const a = await get(port, '/missing')
    const b = await get(port, '/missing')
    assert(a.status === 404 && b.status === 404, `Expected both 404, got ${a.status}/${b.status}`)
  })
})

await test('without a "*" spec the default 404 still works', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status, body } = await get(port, '/nope')
    assert(status === 404 && body.includes('404'), 'Expected default 404 page')
  })
})

await test('custom 404 works in production mode (manifest with runtime bundle present)', async () => {
  // Regression: in production the manifest sets runtimeBundle, which made
  // wrapDocument call isBundle(spec.hydrate) — undefined for non-hydrated pages
  // like a typical 404 spec → TypeError → 500 instead of the custom 404.
  // Dev never hit it because runtimeBundle is '' there.
  const prodManifest = { _runtime: '/dist/runtime-abcd1234.js' }
  await withServer([helloSpec, notFoundPageSpec], { stream: true, manifest: prodManifest }, async (port) => {
    const { status, body } = await get(port, '/nope')
    assert(status === 404, `Expected 404 in production mode, got ${status}`)
    assert(body.includes('Custom not found'), `Expected custom 404 content: ${body.slice(0, 200)}`)
  })
})

await test('non-hydrated pages render on the buffered path in production mode', async () => {
  // Same root cause, different surface: stream: false + production manifest
  // crashed EVERY zero-JS page, not just the 404.
  const prodManifest = { _runtime: '/dist/runtime-abcd1234.js' }
  await withServer([helloSpec], { stream: false, manifest: prodManifest }, async (port) => {
    const { status, body } = await get(port, '/hello')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('Hello world'), 'Expected page content')
  })
})

// ---------------------------------------------------------------------------

console.log('\nServer-side forms (spec.submit) + CSRF\n')

function requestFull(port, method, path, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ method, hostname: 'localhost', port, path, headers }, (res) => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function postForm(port, path, fields, cookie = '') {
  const body = new URLSearchParams(fields).toString()
  return requestFull(port, 'POST', path, {
    headers: {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
  })
}

/** GET the form page and extract the CSRF cookie + token for a valid POST. */
async function getCsrfPair(port, path) {
  const res    = await get(port, path)
  const setCookie = [].concat(res.headers['set-cookie'] || []).find(c => c.startsWith('pulse_csrf='))
  const cookie = setCookie ? setCookie.split(';')[0] : ''
  const token  = res.body.match(/name="_csrf" value="([^"]+)"/)?.[1] || ''
  return { cookie, token, body: res.body }
}

const formSpec = {
  route: '/signup',
  meta:  { title: 'Sign up' },
  submit: async (ctx) => {
    const data = await ctx.formData()
    if (!data?.email) return { errors: { email: 'Email is required' }, values: data ?? {} }
    if (data.email === 'taken@example.com') return { status: 422, errors: { email: 'Already registered' }, values: data }
    return { redirect: '/signup?done=1' }
  },
  view: (state, server) => `
    <main id="main-content">
      <h1>Sign up</h1>
      ${server.form?.errors?.email ? `<p class="error">${server.form.errors.email}</p>` : ''}
      <form method="POST">
        ${server.csrf ?? ''}
        <label for="email">Email</label>
        <input id="email" name="email" value="${server.form?.values?.email ?? ''}">
        <button type="submit">Go</button>
      </form>
    </main>`,
}

await test('GET on a submit page sets the CSRF cookie and embeds the hidden field', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { cookie, token, body } = await getCsrfPair(port, '/signup')
    assert(cookie.startsWith('pulse_csrf='), `Expected pulse_csrf cookie, got: ${cookie}`)
    assert(token.length > 20, `Expected a CSRF token in the form, got: ${token}`)
    assert(body.includes('name="_csrf"'), 'Expected hidden _csrf input in the form')
  })
})

await test('CSRF field is present in streaming mode too', async () => {
  await withServer([formSpec], { stream: true }, async (port) => {
    const { token } = await getCsrfPair(port, '/signup')
    assert(token.length > 20, 'Expected CSRF token in streamed HTML')
  })
})

await test('POST without a CSRF token is rejected with 403', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { status } = await postForm(port, '/signup', { email: 'a@b.com' })
    assert(status === 403, `Expected 403, got ${status}`)
  })
})

await test('POST with a forged token is rejected with 403', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { cookie } = await getCsrfPair(port, '/signup')
    const { status } = await postForm(port, '/signup', { email: 'a@b.com', _csrf: 'forged-token-value' }, cookie)
    assert(status === 403, `Expected 403, got ${status}`)
  })
})

await test('valid POST follows POST-redirect-GET with 303', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { cookie, token } = await getCsrfPair(port, '/signup')
    const { status, headers } = await postForm(port, '/signup', { email: 'a@b.com', _csrf: token }, cookie)
    assert(status === 303, `Expected 303, got ${status}`)
    assert(headers.location === '/signup?done=1', `Expected PRG redirect, got ${headers.location}`)
  })
})

await test('validation failure re-renders the page with server.form (errors + values)', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { cookie, token } = await getCsrfPair(port, '/signup')
    const { status, body } = await postForm(port, '/signup', { email: '', _csrf: token }, cookie)
    assert(status === 200, `Expected 200 re-render, got ${status}`)
    assert(body.includes('Email is required'), `Expected error message in re-render, got: ${body.slice(0, 400)}`)
  })
})

await test('submit can set a custom response status (422) and values are echoed back', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const { cookie, token } = await getCsrfPair(port, '/signup')
    const { status, body } = await postForm(port, '/signup', { email: 'taken@example.com', _csrf: token }, cookie)
    assert(status === 422, `Expected 422, got ${status}`)
    assert(body.includes('Already registered'), 'Expected error in re-render')
    assert(body.includes('value="taken@example.com"'), 'Expected submitted value echoed into the input')
  })
})

await test('csrf: false opts a submit route out of CSRF protection', async () => {
  const webhookish = {
    route:  '/hook',
    csrf:   false,
    submit: async () => ({ redirect: '/hook?ok=1' }),
    view:   () => '<main id="main-content">hook</main>',
  }
  await withServer([webhookish], { stream: false }, async (port) => {
    const { status, headers } = await postForm(port, '/hook', { x: '1' })
    assert(status === 303 && headers.location === '/hook?ok=1', `Expected 303 without CSRF, got ${status}`)
  })
})

await test('POST to a page without submit is still 405', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await postForm(port, '/hello', { x: '1' })
    assert(status === 405, `Expected 405, got ${status}`)
  })
})

await test('submit pages are excluded from the in-process page cache', async () => {
  // Two different clients must get different CSRF tokens — a cached page would
  // serve client A's token (and cookie pairing) to client B.
  await withServer([formSpec], { stream: false, defaultCache: 3600 }, async (port) => {
    const a = await getCsrfPair(port, '/signup')
    const b = await getCsrfPair(port, '/signup')
    assert(a.token && b.token && a.token !== b.token,
      `Expected per-visitor CSRF tokens, got identical values (page was cached)`)
  })
})

// Regression: the client router fetches pages with X-Pulse-Navigate and the JSON / NDJSON
// responses used to be written without ctx's queued cookies and headers. A first-time visitor
// who reached a form via a link got a CSRF token but never the pulse_csrf cookie it is bound
// to, so every submit failed with "Invalid or missing CSRF token".
console.log('\nClient-side navigation — cookies and headers set during the request\n')

await test('JSON navigation response sets the CSRF cookie for a submit page', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const res = await request(port, 'GET', '/signup', { 'X-Pulse-Navigate': 'true' })
    assert(res.headers['content-type'].includes('application/json'), `Expected JSON, got ${res.headers['content-type']}`)
    const setCookie = [].concat(res.headers['set-cookie'] || []).find(c => c.startsWith('pulse_csrf='))
    assert(setCookie, `Expected a pulse_csrf Set-Cookie on the navigation response, got: ${JSON.stringify(res.headers['set-cookie'])}`)
    assert(/HttpOnly/i.test(setCookie), 'CSRF cookie must stay HttpOnly')
  })
})

await test('a form reached via client navigation can be submitted (cookie and token pair up)', async () => {
  await withServer([formSpec], { stream: false }, async (port) => {
    const res    = await request(port, 'GET', '/signup', { 'X-Pulse-Navigate': 'true' })
    const cookie = [].concat(res.headers['set-cookie'] || []).find(c => c.startsWith('pulse_csrf='))?.split(';')[0] || ''
    const token  = JSON.parse(res.body).html.match(/name="_csrf" value="([^"]+)"/)?.[1] || ''
    assert(cookie && token, `Expected both a cookie and a token, got cookie="${cookie}" token="${token}"`)
    const { status, headers } = await postForm(port, '/signup', { email: 'a@b.com', _csrf: token }, cookie)
    assert(status === 303 && headers.location === '/signup?done=1', `Expected 303 for a valid POST, got ${status}`)
  })
})

await test('JSON navigation response carries cookies and headers set by a server fetcher', async () => {
  const spec = {
    route:  '/nav-ctx',
    meta:   { title: 'Nav ctx' },
    server: {
      flag: async (ctx) => {
        ctx.setCookie('seen', '1', { httpOnly: true })
        ctx.setHeader('X-Custom', 'yes')
        return 'ok'
      },
    },
    view: (_s, srv) => `<main id="main-content">${srv.flag}</main>`,
  }
  await withServer([spec], { stream: false }, async (port) => {
    const res = await request(port, 'GET', '/nav-ctx', { 'X-Pulse-Navigate': 'true' })
    assert([].concat(res.headers['set-cookie'] || []).some(c => c.startsWith('seen=1')),
      `Expected seen=1 cookie, got: ${JSON.stringify(res.headers['set-cookie'])}`)
    assert(res.headers['x-custom'] === 'yes', `Expected X-Custom header, got: ${res.headers['x-custom']}`)
    assert(res.headers['x-content-type-options'] === 'nosniff', 'Security headers must still be present')
  })
})

await test('NDJSON (streaming) navigation response carries cookies and headers set in a guard', async () => {
  const spec = {
    ...deferredNavSpec,
    route: '/deferred-nav-ctx',
    guard: async (ctx) => {
      ctx.setCookie('seen', '1', { httpOnly: true })
      ctx.setHeader('X-Custom', 'yes')
    },
  }
  await withServer([spec], { stream: true }, async (port) => {
    const res = await request(port, 'GET', '/deferred-nav-ctx', { 'X-Pulse-Navigate': 'true' })
    assert(res.headers['content-type'].includes('application/x-ndjson'), `Expected NDJSON, got ${res.headers['content-type']}`)
    assert([].concat(res.headers['set-cookie'] || []).some(c => c.startsWith('seen=1')),
      `Expected seen=1 cookie, got: ${JSON.stringify(res.headers['set-cookie'])}`)
    assert(res.headers['x-custom'] === 'yes', `Expected X-Custom header, got: ${res.headers['x-custom']}`)
    assert(res.headers['x-accel-buffering'] === 'no', 'Streaming headers must be preserved')
  })
})

await test('navigation responses without queued cookies/headers are unchanged', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const res = await request(port, 'GET', '/hello', { 'X-Pulse-Navigate': 'true' })
    assert(res.status === 200 && res.headers['set-cookie'] === undefined, `Unexpected Set-Cookie: ${res.headers['set-cookie']}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nDeclarative redirects\n')

await test('plain redirect responds 301 with Location', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/old-hello': '/hello' } }, async (port) => {
    const { status, headers } = await get(port, '/old-hello')
    assert(status === 301, `Expected 301, got ${status}`)
    assert(headers.location === '/hello', `Expected /hello, got ${headers.location}`)
  })
})

await test(':params are substituted into the target', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/old-blog/:slug': '/blog/:slug' } }, async (port) => {
    const { status, headers } = await get(port, '/old-blog/my-post')
    assert(status === 301)
    assert(headers.location === '/blog/my-post', `Expected /blog/my-post, got ${headers.location}`)
  })
})

await test('percent-encoded params keep their encoding through substitution', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/old/:slug': '/new/:slug' } }, async (port) => {
    const { headers } = await get(port, '/old/caf%C3%A9')
    assert(headers.location === '/new/caf%C3%A9', `Encoding mangled: ${headers.location}`)
  })
})

await test('query string is preserved on redirect', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/old-hello': '/hello' } }, async (port) => {
    const { headers } = await get(port, '/old-hello?utm=x&page=2')
    assert(headers.location === '/hello?utm=x&page=2', `Query lost: ${headers.location}`)
  })
})

await test('custom status via { to, status }', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/promo': { to: '/hello', status: 302 } } }, async (port) => {
    const { status, headers } = await get(port, '/promo')
    assert(status === 302, `Expected 302, got ${status}`)
    assert(headers.location === '/hello')
  })
})

await test('absolute URL targets work (domain moves)', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/moved/:slug': 'https://newsite.com/blog/:slug' } }, async (port) => {
    const { headers } = await get(port, '/moved/post-1')
    assert(headers.location === 'https://newsite.com/blog/post-1', `Got ${headers.location}`)
  })
})

await test('redirect wins over a registered route at the same path', async () => {
  await withServer([helloSpec], { stream: false, quiet: true, redirects: { '/hello': '/elsewhere' } }, async (port) => {
    const { status, headers } = await get(port, '/hello')
    assert(status === 301 && headers.location === '/elsewhere', `Expected redirect to win, got ${status}`)
  })
})

await test('POST is not redirected', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/old-api': '/hello' } }, async (port) => {
    const { status } = await requestFull(port, 'POST', '/old-api', {})
    assert(status === 404, `Expected POST to skip redirects (404), got ${status}`)
  })
})

await test('self-redirects fall through to normal routing instead of looping', async () => {
  await withServer([helloSpec], { stream: false, redirects: { '/hello/:x': '/hello/:x' } }, async (port) => {
    const { status } = await get(port, '/hello/abc')
    assert(status === 404, `Expected fall-through to routing (404 here), got ${status}`)
    const ok = await get(port, '/hello')
    assert(ok.status === 200, 'Unrelated routes unaffected')
  })
})

await test('invalid redirect config throws at startup', async () => {
  const cases = [
    { redirects: { 'no-slash': '/x' } },
    { redirects: { '/x': 'no-slash-target' } },
    { redirects: { '/x': { to: '/y', status: 418 } } },
    { redirects: { '/x': '/y/:missing' } },
  ]
  for (const opts of cases) {
    let threw = false
    try { await createServer([helloSpec], { ...opts, port: nextPort++, quiet: true }) } catch { threw = true }
    assert(threw, `Expected startup throw for ${JSON.stringify(opts.redirects)}`)
  }
})

// ---------------------------------------------------------------------------

console.log('\nSitemap + robots.txt\n')

const aboutSpec   = { route: '/about', view: () => '<main id="main-content">About</main>' }
const blogSpec    = {
  route:   '/blog/:slug',
  sitemap: async () => ['/blog/first-post', { path: '/blog/second-post', lastmod: '2026-01-15' }],
  server:  { post: async (ctx) => ({ slug: ctx.params.slug }) },
  view:    (_s, server) => `<main id="main-content">${server.post.slug}</main>`,
}
const secretSpec  = { route: '/admin', guard: async () => {}, view: () => '<main id="main-content">admin</main>' }
const hiddenSpec  = { route: '/internal', sitemap: false, view: () => '<main id="main-content">internal</main>' }

await test('sitemap: true serves /sitemap.xml with static routes', async () => {
  await withServer([helloSpec, aboutSpec], { stream: false, sitemap: true }, async (port) => {
    const { status, headers, body } = await get(port, '/sitemap.xml')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(headers['content-type'].includes('application/xml'), `Expected XML, got ${headers['content-type']}`)
    assert(body.includes(`<loc>http://localhost:${port}/hello</loc>`), `Missing /hello: ${body}`)
    assert(body.includes(`<loc>http://localhost:${port}/about</loc>`), `Missing /about: ${body}`)
  })
})

await test('dynamic routes contribute via spec.sitemap enumerator (with lastmod)', async () => {
  await withServer([blogSpec], { stream: false, sitemap: true, quiet: true }, async (port) => {
    const { body } = await get(port, '/sitemap.xml')
    assert(body.includes('/blog/first-post</loc>'), `Missing enumerated path: ${body}`)
    assert(body.includes('/blog/second-post</loc>'), 'Missing second enumerated path')
    assert(body.includes('<lastmod>2026-01-15</lastmod>'), 'Missing lastmod')
  })
})

await test('dynamic routes without an enumerator are skipped, not broken', async () => {
  const bare = { route: '/items/:id', server: { i: async (ctx) => ctx.params.id }, view: (_s, s) => `<main id="main-content">${s.i}</main>` }
  await withServer([helloSpec, bare], { stream: false, sitemap: true, quiet: true }, async (port) => {
    const { status, body } = await get(port, '/sitemap.xml')
    assert(status === 200)
    assert(!body.includes(':id'), `Raw :param leaked into sitemap: ${body}`)
    assert(body.includes('/hello</loc>'), 'Static route should still be present')
  })
})

await test('guarded pages, route "*", and sitemap:false are excluded', async () => {
  const nf = { route: '*', view: () => '<main id="main-content">404</main>' }
  await withServer([helloSpec, secretSpec, hiddenSpec, nf], { stream: false, sitemap: true }, async (port) => {
    const { body } = await get(port, '/sitemap.xml')
    assert(!body.includes('/admin'), 'Guarded page must be excluded by default')
    assert(!body.includes('/internal'), 'sitemap:false page must be excluded')
    assert(!body.includes('<loc>http://localhost:' + port + '/*'), 'route * must be excluded')
    assert(body.includes('/hello</loc>'))
  })
})

await test('a guarded page opts in with sitemap: true', async () => {
  const publicGuarded = { route: '/landing', guard: async () => {}, sitemap: true, view: () => '<main id="main-content">x</main>' }
  await withServer([publicGuarded], { stream: false, sitemap: true }, async (port) => {
    const { body } = await get(port, '/sitemap.xml')
    assert(body.includes('/landing</loc>'), `Expected opted-in guarded page: ${body}`)
  })
})

await test('robots.txt is generated and points at the sitemap', async () => {
  await withServer([helloSpec], { stream: false, sitemap: true }, async (port) => {
    const { status, body } = await get(port, '/robots.txt')
    assert(status === 200)
    assert(body.includes('User-agent: *'), `Missing user-agent: ${body}`)
    assert(body.includes(`Sitemap: http://localhost:${port}/sitemap.xml`), `Missing sitemap line: ${body}`)
  })
})

await test('robots: false disables robots.txt; custom string is served verbatim', async () => {
  await withServer([helloSpec], { stream: false, sitemap: true, robots: false }, async (port) => {
    const { status } = await get(port, '/robots.txt')
    assert(status === 404, `Expected 404 with robots:false, got ${status}`)
  })
  await withServer([helloSpec], { stream: false, sitemap: true, robots: 'User-agent: *\nDisallow: /private\n' }, async (port) => {
    const { body } = await get(port, '/robots.txt')
    assert(body.includes('Disallow: /private'), 'Expected custom robots content')
  })
})

await test('sitemap origin can be pinned via { origin }', async () => {
  await withServer([helloSpec], { stream: false, sitemap: { origin: 'https://mysite.com' } }, async (port) => {
    const { body } = await get(port, '/sitemap.xml')
    assert(body.includes('<loc>https://mysite.com/hello</loc>'), `Expected pinned origin: ${body}`)
    const robotsRes = await get(port, '/robots.txt')
    assert(robotsRes.body.includes('Sitemap: https://mysite.com/sitemap.xml'), 'robots should use pinned origin')
  })
})

await test('trailingSlash "add" is reflected in sitemap URLs', async () => {
  await withServer([helloSpec, aboutSpec], { stream: false, sitemap: true, trailingSlash: 'add' }, async (port) => {
    const { body } = await get(port, '/sitemap.xml')
    assert(body.includes('/about/</loc>'), `Expected trailing slash on URLs: ${body}`)
  })
})

await test('sitemap disabled by default — /sitemap.xml is 404', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await get(port, '/sitemap.xml')
    assert(status === 404, `Expected 404 when sitemap not enabled, got ${status}`)
  })
})

await test('a failing enumerator does not take down the sitemap', async () => {
  const broken = { route: '/x/:id', sitemap: async () => { throw new Error('db down') }, server: { i: async () => 1 }, view: (_s, s) => `<main id="main-content">${s.i}</main>` }
  await withServer([helloSpec, broken], { stream: false, sitemap: true, quiet: true }, async (port) => {
    const { status, body } = await get(port, '/sitemap.xml')
    assert(status === 200, `Expected 200 despite enumerator failure, got ${status}`)
    assert(body.includes('/hello</loc>'), 'Other routes should still be listed')
  })
})

// ---------------------------------------------------------------------------

console.log('\nLive store push (SSE)\n')

/** Open an SSE connection and return a handle that accumulates received text. */
function openSse(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port, path, headers: { Accept: 'text/event-stream' } }, (res) => {
      let buf = ''
      res.on('data', c => { buf += c.toString() })
      resolve({ status: res.statusCode, headers: res.headers, read: () => buf, destroy: () => req.destroy() })
    })
    req.on('error', reject)
  })
}

const wait = (ms) => new Promise(r => setTimeout(r, ms))

await test('live: true serves the SSE endpoint', async () => {
  const port = nextPort++
  const { server } = await createServer([helloSpec], { port, quiet: true, live: true })
  try {
    const sse = await openSse(port, '/__pulse/live')
    assert(sse.status === 200, `Expected 200, got ${sse.status}`)
    assert(sse.headers['content-type'].includes('text/event-stream'), `Got ${sse.headers['content-type']}`)
    await wait(50)
    assert(sse.read().includes(':connected'), 'Expected connection comment')
    sse.destroy()
  } finally {
    server.closeAllConnections?.()
    await new Promise(r => server.close(r))
  }
})

await test('pushStore broadcasts a patch to all connected clients', async () => {
  const port = nextPort++
  const { server, pushStore } = await createServer([helloSpec], { port, quiet: true, live: true })
  try {
    const a = await openSse(port, '/__pulse/live')
    const b = await openSse(port, '/__pulse/live')
    await wait(50)
    const sent = pushStore({ stock: 5, banner: 'Sale on now' })
    assert(sent === 2, `Expected 2 clients, got ${sent}`)
    await wait(50)
    for (const sse of [a, b]) {
      assert(sse.read().includes('event: store'), 'Missing event name')
      assert(sse.read().includes('"stock":5'), `Missing payload: ${sse.read()}`)
    }
    a.destroy(); b.destroy()
  } finally {
    server.closeAllConnections?.()
    await new Promise(r => server.close(r))
  }
})

await test('pushStore requires live: true and a plain-object patch', async () => {
  const port = nextPort++
  const off = await createServer([helloSpec], { port, quiet: true })
  try {
    let threw = false
    try { off.pushStore({ x: 1 }) } catch { threw = true }
    assert(threw, 'Expected throw without live: true')
  } finally {
    off.server.closeAllConnections?.()
    await new Promise(r => off.server.close(r))
  }
  const port2 = nextPort++
  const on = await createServer([helloSpec], { port: port2, quiet: true, live: true })
  try {
    let threw = false
    try { on.pushStore('not-an-object') } catch { threw = true }
    assert(threw, 'Expected throw for non-object patch')
  } finally {
    on.server.closeAllConnections?.()
    await new Promise(r => on.server.close(r))
  }
})

await test('module-level pushStore export reaches the live server (spec-file usage)', async () => {
  const { pushStore: globalPush } = await import('./index.js')
  const port = nextPort++
  const { server } = await createServer([helloSpec], { port, quiet: true, live: true })
  try {
    const sse = await openSse(port, '/__pulse/live')
    await wait(50)
    const sent = globalPush({ score: 99 })
    assert(sent === 1, `Expected module-level pushStore to reach 1 client, got ${sent}`)
    await wait(50)
    assert(sse.read().includes('"score":99'), `Missing payload via module export: ${sse.read()}`)
    sse.destroy()
  } finally {
    server.closeAllConnections?.()
    await new Promise(r => server.close(r))
  }
})

await test('endpoint is 404 when live is not enabled', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await get(port, '/__pulse/live')
    assert(status === 404, `Expected 404, got ${status}`)
  })
})

await test('custom endpoint path via { path }', async () => {
  const port = nextPort++
  const { server } = await createServer([helloSpec], { port, quiet: true, live: { path: '/_realtime' } })
  try {
    const sse = await openSse(port, '/_realtime')
    assert(sse.status === 200, `Expected 200 on custom path, got ${sse.status}`)
    sse.destroy()
  } finally {
    server.closeAllConnections?.()
    await new Promise(r => server.close(r))
  }
})

await test('hydrated pages receive the __PULSE_LIVE__ flag; disabled servers do not', async () => {
  const hydrated = {
    route: '/live-page', hydrate: '/src/pages/live-page.js', store: ['stock'],
    state: { n: 0 }, mutations: { inc: (s) => ({ n: s.n + 1 }) },
    view: (state, server) => `<main id="main-content">${server.stock ?? '—'}</main>`,
  }
  await withServer([hydrated], { stream: false, live: true }, async (port) => {
    const { body } = await get(port, '/live-page')
    assert(body.includes(`window.__PULSE_LIVE__='/__pulse/live'`), `Flag missing: ${body.slice(0, 600)}`)
  })
  await withServer([hydrated], { stream: false }, async (port) => {
    const { body } = await get(port, '/live-page')
    assert(!body.includes('__PULSE_LIVE__'), 'Flag must be absent when live is disabled')
  })
})

await test('a store-only URL-entry spec (no local mutations/actions/persist, no explicit hydrate) still auto-derives a hydrate URL — regression: mount() is what wires up data-store-event dispatch AND the live SSE store-push subscription; without this a store-only page silently ships zero JS and never receives pushStore() broadcasts', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-needshydration-store-test-'))
  const specPath = path.join(dir, 'storey.js')
  fs.writeFileSync(
    specPath,
    `export default {\n  route: '/storey',\n  store: ['count'],\n  state: {},\n  view: (state, server) => \`\${server.count ?? 0}\`,\n}\n`
  )
  try {
    const port = nextPort++
    const { server } = await createServer([new URL('file://' + specPath)], { stream: false, live: true, port, root: new URL('file://' + dir + '/') })
    await new Promise(resolve => server.once('listening', resolve))
    try {
      const { body } = await get(port, '/storey')
      // A store-only page with no auto-derived hydrate would render with no
      // module script and no __PULSE_LIVE__ flag at all — both must be present.
      assert(body.includes('<script type="module"'), `Expected a hydration script tag, got: ${body.slice(0, 800)}`)
      assert(body.includes('__PULSE_LIVE__'), `Expected the live-store flag (only emitted for hydrated pages), got: ${body.slice(0, 800)}`)
    } finally {
      server.closeAllConnections?.()
      await new Promise(resolve => server.close(resolve))
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------

console.log('\nMalformed request handling\n')

await test('malformed percent-encoding in path returns 404, not 500', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { status } = await get(port, '/%ZZ')
    assert(status === 404, `Expected 404 for malformed encoding, got ${status}`)
  })
})

await test('malformed percent-encoding in param route returns 404', async () => {
  await withServer([productSpec], { stream: false }, async (port) => {
    const { status } = await get(port, '/products/%E0%A4%A')
    assert(status === 404, `Expected 404 for malformed param, got ${status}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nPage cache — query-string DoS guard\n')

await test('query string is NOT part of the cache key by default', async () => {
  // A cacheable page should serve identical cached HTML regardless of arbitrary
  // query params — they must not mint new cache entries.
  let renders = 0
  const spec = {
    route: '/cached',
    cache: { public: true, maxAge: 60 },
    view:  () => `<h1>render-${++renders}</h1>`,
  }
  await withServer([spec], { stream: false }, async (port) => {
    const a = await get(port, '/cached?n=1')
    const b = await get(port, '/cached?n=2')
    const c = await get(port, '/cached?n=3')
    assert(a.body === b.body && b.body === c.body, 'Cached body should be identical across query strings')
    assert(a.body.includes('render-1'), `Expected first render cached, got: ${a.body}`)
  })
})

await test('cacheVary keys DO produce distinct cache entries', async () => {
  let renders = 0
  const spec = {
    route:     '/varied',
    cache:     { public: true, maxAge: 60 },
    cacheVary: ['q'],
    server:    { n: async () => ++renders },
    view:      (_s, server) => `<h1>v-${server.n}</h1>`,
  }
  // server fetcher makes this non-cacheable for HTML, so vary only affects
  // the in-process key; assert distinct outputs per q value.
  await withServer([spec], { stream: false }, async (port) => {
    const a = await get(port, '/varied?q=apple')
    const b = await get(port, '/varied?q=banana')
    assert(a.body !== b.body, `Expected distinct outputs per cacheVary value, got identical: ${a.body}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nTtlCache — bounded LRU\n')

await test('evicts least-recently-used entry when over capacity', () => {
  const c = new TtlCache(2)
  c.set('a', 1, 60)
  c.set('b', 2, 60)
  c.set('c', 3, 60)  // exceeds cap → evicts 'a' (LRU)
  assert(c.get('a') === undefined, 'Expected a to be evicted')
  assert(c.get('b') === 2, 'Expected b to remain')
  assert(c.get('c') === 3, 'Expected c to remain')
})

await test('get() refreshes recency so the touched entry survives eviction', () => {
  const c = new TtlCache(2)
  c.set('a', 1, 60)
  c.set('b', 2, 60)
  c.get('a')         // 'a' now most-recently-used
  c.set('c', 3, 60)  // evicts 'b', not 'a'
  assert(c.get('a') === 1, 'Expected a to survive (recently used)')
  assert(c.get('b') === undefined, 'Expected b to be evicted')
})

await test('many distinct keys never exceed the cap', () => {
  const c = new TtlCache(100)
  for (let i = 0; i < 10_000; i++) c.set(`k${i}`, i, 60)
  assert(c._store.size === 100, `Expected size capped at 100, got ${c._store.size}`)
})

await test('expired entries are not returned', () => {
  const c = new TtlCache(10)
  c.set('x', 1, -1)  // already expired
  assert(c.get('x') === undefined, 'Expected expired entry to be absent')
})

// ---------------------------------------------------------------------------

console.log('\nCompression\n')

await test('serves brotli-compressed HTML when br is accepted', async () => {
  await withServer([helloSpec], { stream: false }, async (port) => {
    const { headers } = await request(port, 'GET', '/hello', { 'Accept-Encoding': 'br' })
    assert(headers['content-encoding'] === 'br', `Expected br encoding, got ${headers['content-encoding']}`)
  })
})

// ---------------------------------------------------------------------------
// Route shadowing warning
// ---------------------------------------------------------------------------
// Regression: found via dogfooding. Route matching is first-match-wins in
// registration order with no specificity ranking (see matchRoute) — a dynamic
// route registered before a same-depth static route silently swallows every
// request to that static route, with no error and no warning. discoverPages'
// file-order is not guaranteed alphabetical across platforms, so this is a
// real, easy-to-hit trap for any project mixing a catch-all-ish :param route
// with static pages at the same path depth.

console.log('\nRoute shadowing\n')

const dynamicFirstSpec   = { route: '/:code', state: {}, view: () => '' }
const staticShadowedSpec = { route: '/settings', state: {}, view: () => '' }
const unrelatedSpec      = { route: '/about', state: {}, view: () => '' }

// The warning fires synchronously inside createServer, before it starts
// listening — capture around the whole createServer call, then tear the
// server down immediately (nothing needs to actually run against it).
async function warningsFromCreateServer(specs) {
  const original = console.warn
  const messages = []
  console.warn = (msg) => messages.push(msg)
  const port = nextPort++
  let server
  try {
    ;({ server } = await createServer(specs, { port, stream: false, quiet: true }))
    await new Promise(resolve => server.once('listening', resolve))
  } finally {
    console.warn = original
    if (server) {
      server.closeAllConnections?.()
      await new Promise(resolve => server.close(resolve))
    }
  }
  return messages
}

await test('warns when a dynamic route is registered before a static route it shadows', async () => {
  const warnings = await warningsFromCreateServer([dynamicFirstSpec, staticShadowedSpec])
  assert(warnings.some(w => w.includes('/:code') && w.includes('/settings') && w.includes('never be reached')),
    `Expected a shadowing warning naming both routes, got: ${JSON.stringify(warnings)}`)
})

await test('no warning when the static route is registered first (correct order)', async () => {
  const warnings = await warningsFromCreateServer([staticShadowedSpec, dynamicFirstSpec])
  assert(warnings.length === 0, `Expected no warnings, got: ${JSON.stringify(warnings)}`)
})

await test('no warning between two unrelated static routes', async () => {
  const warnings = await warningsFromCreateServer([staticShadowedSpec, unrelatedSpec])
  assert(warnings.length === 0, `Expected no warnings, got: ${JSON.stringify(warnings)}`)
})

// ---------------------------------------------------------------------------

console.log('\nError journal\n')

function makeTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-error-journal-'))
}

function readJournal(root) {
  const p = path.join(root, '.pulse', 'errors.json')
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null
}

const journalThrowingSpec = {
  route: '/boom-journal',
  state: {},
  view: () => { throw new Error('deliberate view failure') },
}

await test('server error in dev mode writes an entry to the journal', async () => {
  const root = makeTmpRoot()
  await withServer([journalThrowingSpec], { stream: false, dev: true, root }, async (port) => {
    await get(port, '/boom-journal')
    const entries = readJournal(root)
    assert(entries && entries.length === 1, `Expected 1 journal entry, got ${JSON.stringify(entries)}`)
    assert(entries[0].phase === 'server', `Expected phase "server", got ${entries[0].phase}`)
    assert(entries[0].message.includes('deliberate view failure'), `Message missing detail: ${entries[0].message}`)
    assert(entries[0].resolved === false, 'New entry should be unresolved')
  })
  fs.rmSync(root, { recursive: true, force: true })
})

await test('server error NOT in dev mode does not write a journal entry', async () => {
  const root = makeTmpRoot()
  await withServer([journalThrowingSpec], { stream: false, dev: false, root }, async (port) => {
    await get(port, '/boom-journal')
    const entries = readJournal(root)
    assert(entries === null, `Expected no journal file in prod mode, got ${JSON.stringify(entries)}`)
  })
  fs.rmSync(root, { recursive: true, force: true })
})

await test('POST /__pulse/error in dev mode writes a client-reported entry', async () => {
  const root = makeTmpRoot()
  await withServer([helloSpec], { stream: false, dev: true, root }, async (port) => {
    const { status } = await requestWithBody(
      port, 'POST', '/__pulse/error',
      JSON.stringify({ route: '/dashboard', phase: 'action', message: 'action "save" failed: boom', stack: 'Error: boom\n  at save' }),
      'application/json'
    )
    assert(status === 204, `Expected 204, got ${status}`)
    const entries = readJournal(root)
    assert(entries && entries.length === 1, `Expected 1 journal entry, got ${JSON.stringify(entries)}`)
    assert(entries[0].route === '/dashboard', `Expected route /dashboard, got ${entries[0].route}`)
    assert(entries[0].phase === 'action', `Expected phase action, got ${entries[0].phase}`)
  })
  fs.rmSync(root, { recursive: true, force: true })
})

await test('POST /__pulse/error in production returns 404 — no dev-only endpoint exposed', async () => {
  const root = makeTmpRoot()
  await withServer([helloSpec], { stream: false, dev: false, root }, async (port) => {
    const { status } = await requestWithBody(port, 'POST', '/__pulse/error', JSON.stringify({}), 'application/json')
    assert(status === 404, `Expected 404 in production, got ${status}`)
    assert(readJournal(root) === null, 'No journal file should exist in production')
  })
  fs.rmSync(root, { recursive: true, force: true })
})

await test('error journal is capped at 50 entries (ring buffer)', async () => {
  const root = makeTmpRoot()
  await withServer([helloSpec], { stream: false, dev: true, root }, async (port) => {
    for (let i = 0; i < 55; i++) {
      await requestWithBody(
        port, 'POST', '/__pulse/error',
        JSON.stringify({ route: '/x', phase: 'view', message: `error ${i}`, stack: '' }),
        'application/json'
      )
    }
    const entries = readJournal(root)
    assert(entries.length === 50, `Expected 50 entries (capped), got ${entries.length}`)
    // Oldest entries should have been dropped — the most recent should remain
    assert(entries[entries.length - 1].message === 'error 54', `Expected newest entry to survive, got ${entries[entries.length - 1].message}`)
    assert(entries[0].message === 'error 5', `Expected oldest surviving entry to be "error 5", got ${entries[0].message}`)
  })
  fs.rmSync(root, { recursive: true, force: true })
})

console.log('\nGraceful shutdown\n')

await test('shutdown() is returned from createServer', async () => {
  const port = nextPort++
  const result = await createServer([helloSpec], { port, stream: false })
  assert(typeof result.shutdown === 'function', 'Expected shutdown to be a function')
  result.server.closeAllConnections?.()
  await new Promise(resolve => result.server.close(resolve))
})

// shutdown() ends with server.close(() => process.exit(0)). That is right for production, but in a
// test it would terminate the whole run, so each of these tests stubs process.exit (captureExit) and
// waits for the stub to be hit before restoring it.
await test('shutdown() stops the server from accepting new connections', async () => {
  const exit = captureExit()
  try {
    const port = nextPort++
    const { server, shutdown } = await createServer([helloSpec], { port, stream: false })
    await new Promise(resolve => server.once('listening', resolve))

    // Confirm server is up
    const before = await get(port, '/hello')
    assert(before.status === 200, `Expected 200 before shutdown, got ${before.status}`)

    shutdown()

    // Server should no longer accept connections
    await new Promise(resolve => setTimeout(resolve, 20))
    let refused = false
    try { await get(port, '/hello') } catch { refused = true }
    assert(refused, 'Expected connection to be refused after shutdown()')

    assert(await exit.waitForExit(), 'Expected process.exit() once all connections closed')
    assert(exit.codes.length === 1 && exit.codes[0] === 0, `Expected a single clean exit(0), got ${JSON.stringify(exit.codes)}`)
  } finally {
    exit.restore()
  }
})

await test('shutdown() is idempotent — calling twice does not throw', async () => {
  const exit = captureExit()
  try {
    const port = nextPort++
    const { server, shutdown } = await createServer([helloSpec], { port, stream: false })
    await new Promise(resolve => server.once('listening', resolve))
    shutdown()
    shutdown() // second call is a no-op
    assert(await exit.waitForExit(), 'Expected process.exit() once the server closed')
    await new Promise(resolve => setTimeout(resolve, 20))
    assert(exit.codes.length === 1, `Expected exactly one exit from two shutdown() calls, got ${JSON.stringify(exit.codes)}`)
  } finally {
    exit.restore()
  }
})

await test('in-flight request completes after shutdown() is called', async () => {
  const port = nextPort++
  let resolveSlowFetch
  const slowSpec = {
    route: '/slow',
    state: {},
    server: {
      data: () => new Promise(resolve => { resolveSlowFetch = () => resolve('done') })
    },
    view: (_s, server) => `<p>${server.data}</p>`
  }

  const exit = captureExit()
  try {
    const { server, shutdown } = await createServer([slowSpec], { port, stream: false })
    await new Promise(resolve => server.once('listening', resolve))

    // Start a request but don't resolve its server fetch yet
    const pending = get(port, '/slow')

    // Small delay to ensure the request is in flight before shutdown
    await new Promise(resolve => setTimeout(resolve, 20))

    shutdown()

    // The process must wait for the in-flight request before exiting
    assert(exit.codes.length === 0, 'Must not exit while a request is still in flight')

    // Now resolve the slow fetch — the response should still complete
    resolveSlowFetch()
    const { status, body } = await pending
    assert(status === 200, `Expected 200, got ${status}`)
    assert(body.includes('<p>done</p>'), `Expected response body, got: ${body}`)

    assert(await exit.waitForExit(), 'Expected process.exit() once the in-flight request finished')
    assert(exit.codes[0] === 0, `Expected exit(0), got ${JSON.stringify(exit.codes)}`)
  } finally {
    exit.restore()
  }
})

// ---------------------------------------------------------------------------
// Multipart form data — ctx.formData()
// ---------------------------------------------------------------------------

/**
 * Build a multipart/form-data body Buffer from a fields map.
 * Each field can be a string (text field) or
 * { filename, type, content: string|Buffer } (file field).
 */
function buildMultipart(fields, boundary = 'TestBoundary123') {
  const chunks = []
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\n`))
    if (value !== null && typeof value === 'object' && 'filename' in value) {
      const ct = value.type || 'application/octet-stream'
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${value.filename}"\r\nContent-Type: ${ct}\r\n\r\n`))
      chunks.push(Buffer.isBuffer(value.content) ? value.content : Buffer.from(String(value.content)))
    } else {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`))
      chunks.push(Buffer.from(String(value)))
    }
    chunks.push(Buffer.from('\r\n'))
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  return Buffer.concat(chunks)
}

console.log('\nMultipart form data (ctx.formData)\n')

const multipartBaseSpec = {
  route:       '/upload',
  contentType: 'application/json',
  render:      async (ctx) => {
    const data = await ctx.formData()
    return JSON.stringify(data ?? null)
  },
}

await test('ctx.formData() parses multipart text fields', async () => {
  const body = buildMultipart({ name: 'Alice', email: 'alice@example.com' })
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', body, 'multipart/form-data; boundary=TestBoundary123')
    assert(status === 200, `Expected 200, got ${status}`)
    const data = JSON.parse(resBody)
    assert(data.name === 'Alice', `Expected name Alice, got ${JSON.stringify(data)}`)
    assert(data.email === 'alice@example.com', `Expected email, got ${JSON.stringify(data)}`)
  })
})

await test('ctx.formData() parses multipart file field', async () => {
  const body = buildMultipart({
    avatar: { filename: 'photo.png', type: 'image/png', content: 'PNG_BYTES_HERE' },
  })
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', body, 'multipart/form-data; boundary=TestBoundary123')
    assert(status === 200, `Expected 200, got ${status}`)
    const data = JSON.parse(resBody)
    assert(data.avatar?.filename === 'photo.png', `Expected filename photo.png, got ${JSON.stringify(data.avatar)}`)
    assert(data.avatar?.type === 'image/png', `Expected type image/png, got ${JSON.stringify(data.avatar)}`)
    assert(typeof data.avatar?.size === 'number', `Expected numeric size, got ${JSON.stringify(data.avatar)}`)
  })
})

await test('ctx.formData() handles mixed text and file fields', async () => {
  const body = buildMultipart({
    title: 'My Upload',
    file:  { filename: 'doc.txt', type: 'text/plain', content: 'Hello world' },
  })
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', body, 'multipart/form-data; boundary=TestBoundary123')
    assert(status === 200, `Expected 200, got ${status}`)
    const data = JSON.parse(resBody)
    assert(data.title === 'My Upload', `Expected title, got ${JSON.stringify(data)}`)
    assert(data.file?.filename === 'doc.txt', `Expected filename doc.txt, got ${JSON.stringify(data.file)}`)
    assert(data.file?.size === 11, `Expected size 11, got ${JSON.stringify(data.file)}`)
  })
})

await test('ctx.formData() handles repeated field name as array', async () => {
  // Build raw multipart with two fields sharing the same name
  const boundary = 'MultiRepeat'
  const raw = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="tag"\r\n\r\none\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="tag"\r\n\r\ntwo\r\n`),
    Buffer.from(`--${boundary}--\r\n`),
  ])
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', raw, `multipart/form-data; boundary=${boundary}`)
    assert(status === 200, `Expected 200, got ${status}`)
    const data = JSON.parse(resBody)
    assert(Array.isArray(data.tag), `Expected array for repeated name, got ${JSON.stringify(data.tag)}`)
    assert(data.tag.includes('one') && data.tag.includes('two'), `Expected both values, got ${JSON.stringify(data.tag)}`)
  })
})

await test('ctx.formData() returns null for empty body', async () => {
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', '', 'multipart/form-data; boundary=TestBoundary123')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(resBody === 'null', `Expected null for empty body, got ${resBody}`)
  })
})

await test('ctx.formData() still handles URL-encoded body correctly', async () => {
  await withServer([multipartBaseSpec], {}, async (port) => {
    const { status, body: resBody } = await requestWithBody(port, 'POST', '/upload', 'name=Bob&role=admin', 'application/x-www-form-urlencoded')
    assert(status === 200, `Expected 200, got ${status}`)
    const data = JSON.parse(resBody)
    assert(data.name === 'Bob', `Expected name Bob, got ${JSON.stringify(data)}`)
    assert(data.role === 'admin', `Expected role admin, got ${JSON.stringify(data)}`)
  })
})

// ---------------------------------------------------------------------------

console.log('\nAnalytics (opt-in)\n')

const TRACKER = 'https://example-analytics.test/tracker.js'

for (const stream of [false, true]) {
  await test(`no third-party script is injected by default (stream: ${stream})`, async () => {
    await withServer([helloSpec], { stream }, async (port) => {
      const { body } = await get(port, '/hello')
      assert(!body.includes('<script defer'), 'default pages must not carry an analytics script')
    })
  })

  await test(`analytics option injects the script and widens CSP (stream: ${stream})`, async () => {
    await withServer([helloSpec], { stream, analytics: TRACKER }, async (port) => {
      const res = await get(port, '/hello')
      assert(res.body.includes(`<script defer src="${TRACKER}"></script>`), 'script tag missing from head')
      const csp = String(res.headers['content-security-policy'])
      assert(/script-src[^;]*https:\/\/example-analytics\.test/.test(csp), 'script-src should allow the origin')
      assert(/connect-src[^;]*https:\/\/example-analytics\.test/.test(csp), 'connect-src should allow the origin')
    })
  })
}

// ---------------------------------------------------------------------------

console.log('\nRoute pattern escaping\n')

await test('a "." in a route is literal, not a wildcard', async () => {
  await withServer([rssSpec], {}, async (port) => {
    assert((await get(port, '/feed.xml')).status === 200, 'exact route should match')
    assert((await get(port, '/feedXxml')).status === 404, '"." must not match any character')
  })
})

// ---------------------------------------------------------------------------

console.log('\nSecurity hardening\n')

/** GET with arbitrary headers (the shared get() helper sends none). */
function getWith(port, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: urlPath, headers }, (res) => {
      let body = ''
      res.on('data', c => { body += c })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    }).on('error', reject)
  })
}

/** Send a hand-written request line, so malformed targets reach the server untouched. */
function rawRequest(port, requestLine, extraHeaders = '') {
  return new Promise((resolve) => {
    const sock = net.connect(port, '127.0.0.1', () => sock.write(`${requestLine}\r\nHost: x\r\n${extraHeaders}Connection: close\r\n\r\n`))
    let data = ''
    sock.on('data', c => { data += c })
    sock.on('close', () => resolve(data))
    sock.on('error', () => resolve(data))
  })
}

const hardenPage = {
  route: '/x',
  meta:  { title: 'X', description: 'x', theme: 'dark' },
  view:  () => '<main id="main-content">x</main>',
}

await test('a malformed request target gets a 400 and does not crash the server (logging on)', async () => {
  await withServer([hardenPage], {}, async (port) => {   // quiet is off by default
    const res = await rawRequest(port, 'GET http://[bad HTTP/1.1')
    assert(res.startsWith('HTTP/1.1 400'), `Expected 400, got: ${res.split('\r\n')[0]}`)
    await new Promise(r => setTimeout(r, 100))
    assert((await get(port, '/x')).status === 200, 'server should still be serving')
  })
})

await test('trailing-slash redirect never produces a protocol-relative Location (open redirect)', async () => {
  for (const mode of ['remove', 'add']) {
    await withServer([hardenPage], { trailingSlash: mode, quiet: true }, async (port) => {
      for (const target of ['/.//evil.com/', '/.//evil.com/a', '/a/..//evil.com/b/']) {
        const res = await rawRequest(port, `GET ${target} HTTP/1.1`)
        const loc = (res.match(/^Location: (.*)$/mi) || [])[1] || ''
        assert(!loc.startsWith('//'), `${mode} ${target} redirected to protocol-relative ${loc}`)
      }
    })
  }
})

await test('an unreadable static file returns 404 instead of crashing the server', async () => {
  if (process.getuid?.() === 0) return   // root can read mode-000 files
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-static-'))
  fs.writeFileSync(path.join(dir, 'ok.txt'), 'ok')
  fs.writeFileSync(path.join(dir, 'locked.txt'), 'secret')
  fs.chmodSync(path.join(dir, 'locked.txt'), 0o000)
  try {
    await withServer([hardenPage], { staticDir: dir, quiet: true }, async (port) => {
      assert((await get(port, '/locked.txt')).status === 404, 'unreadable file should be 404')
      assert((await get(port, '/ok.txt')).body === 'ok', 'server should still serve other files')
    })
  } finally {
    fs.chmodSync(path.join(dir, 'locked.txt'), 0o644)
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

await test('a client that disconnects before the static file opens does not crash the server', async () => {
  // On Node 24+, pipeline() throws ERR_STREAM_UNABLE_TO_PIPE for a destroyed response,
  // from inside an event listener, so it surfaced as an uncaught exception.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-static-'))
  fs.writeFileSync(path.join(dir, 'app.css'), 'body{color:red}')
  const uncaught = []
  const onUncaught = (e) => uncaught.push(e)
  process.on('uncaughtException', onUncaught)
  try {
    await withServer([hardenPage], { staticDir: dir, quiet: true }, async (port) => {
      const abort = () => new Promise((done) => {
        const sock = net.connect(port, '127.0.0.1', () => {
          sock.write('GET /app.css HTTP/1.1\r\nHost: localhost\r\nAccept-Encoding: gzip\r\nConnection: close\r\n\r\n')
          sock.destroy()
          done()
        })
        sock.on('error', done)
      })
      for (let i = 0; i < 300; i++) await abort()
      await new Promise(r => setTimeout(r, 200))
      assert(uncaught.length === 0, `server threw ${uncaught[0]?.code ?? uncaught[0]}`)
      assert((await get(port, '/app.css')).body === 'body{color:red}', 'server should still serve the file')
    })
  } finally {
    process.off('uncaughtException', onUncaught)
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

await test('a repeated urlencoded field becomes an array (checkbox groups), like multipart', async () => {
  const spec = {
    route: '/f', contentType: 'application/json',
    render: async (ctx) => JSON.stringify(await ctx.formData()),
  }
  await withServer([spec], { stream: false }, async (port) => {
    const { body } = await requestWithBody(port, 'POST', '/f', 'tag=a&tag=b&tag=c&one=x&__proto__=p&toString=t', 'application/x-www-form-urlencoded')
    const got = JSON.parse(body)
    assert(JSON.stringify(got.tag) === '["a","b","c"]', `repeated field should keep every value, got ${JSON.stringify(got.tag)}`)
    assert(got.one === 'x', 'a single field stays a string')
    assert(Object.getPrototypeOf(got) === Object.prototype && got.toString === 't', 'attacker-named fields stay own data properties')
  })
})

await test('ctx.setCookie refuses values that would add cookie attributes', async () => {
  const spec = {
    route: '/c', contentType: 'application/json',
    render: async (ctx) => {
      const out = {}
      for (const [k, opts] of Object.entries({
        path:     { path: '/; Domain=evil.example' },
        domain:   { domain: 'a.example; Secure' },
        maxAge:   { maxAge: '60; Path=/x' },
        sameSite: { sameSite: 'Lax; Secure' },
      })) {
        try { ctx.setCookie('s', 'v', opts); out[k] = 'accepted' } catch (e) { out[k] = e.name }
      }
      ctx.setCookie('ok', 'v', { path: '/app', domain: '.example.com', maxAge: 60, sameSite: 'strict', httpOnly: true })
      return JSON.stringify(out)
    },
  }
  await withServer([spec], { stream: false }, async (port) => {
    const res = await requestFull(port, 'GET', '/c')
    const out = JSON.parse(res.body)
    for (const k of ['path', 'domain', 'maxAge', 'sameSite']) assert(out[k] === 'TypeError', `${k} injection should be refused, got ${out[k]}`)
    const cookies = [].concat(res.headers['set-cookie'] || [])
    assert(cookies.length === 1 && cookies[0] === 'ok=v; Path=/app; Max-Age=60; Domain=.example.com; SameSite=Strict; HttpOnly', `valid options are written as before: ${cookies}`)
  })
})

await test('starting on a port that is in use exits with a clear message, not a stack trace', async () => {
  const blocker = net.createServer()
  await new Promise(r => blocker.listen(0, r))
  const port = blocker.address().port
  try {
    const script = `import { createServer } from ${JSON.stringify(new URL('./index.js', import.meta.url).href)}
      await createServer([{ route: '/', view: () => '<main id="main-content">x</main>' }], { port: ${port}, quiet: true })`
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 15000 })
    assert(r.status === 1, `expected exit code 1, got ${r.status}`)
    assert(r.stderr.includes(`Port ${port} is already in use`), `expected the friendly message, got: ${r.stderr.slice(0, 300)}`)
    assert(!r.stderr.includes('at Server') && !r.stderr.includes('node:events'), 'no raw stack trace')
  } finally {
    blocker.close()
  }
})

await test('with resolveBrand, the page cache is per host (no cross-brand leak)', async () => {
  const spec = {
    route: '/', state: {},
    meta:  { title: (ctx) => `Hello ${ctx.brand.name}` },
    view:  () => '<main id="main-content">brand page</main>',
  }
  const resolveBrand = async (host) => ({ name: host.split(':')[0] })
  await withServer([spec], { stream: false, defaultCache: 60, resolveBrand, quiet: true }, async (port) => {
    const title = async (host) => (await requestFull(port, 'GET', '/', { headers: { Host: host } })).body.match(/<title>([^<]*)<\/title>/)?.[1]
    assert(await title('a.test') === 'Hello a.test', 'first host renders its own brand')
    assert(await title('b.test') === 'Hello b.test', 'a second host must not be served the first host\'s cached page')
    assert(await title('a.test') === 'Hello a.test', 'and the first host still gets its own')
  })
})

await test('a forged X-Forwarded-Host cannot poison the cached canonical URL for other visitors', async () => {
  await withServer([hardenPage], { defaultCache: 3600, quiet: true }, async (port) => {
    const canon = b => (b.match(/<link rel="canonical" href="([^"]*)"/) || [])[1]
    const attacker = await getWith(port, '/x', { Host: 'www.mysite.com', 'X-Forwarded-Host': 'evil.example', 'X-Forwarded-Proto': 'https' })
    assert(canon(attacker.body) === 'https://evil.example/x', 'the requester still sees their own headers')
    const visitor = await getWith(port, '/x', { Host: 'www.mysite.com' })
    assert(canon(visitor.body) === 'http://www.mysite.com/x', `cached canonical was poisoned: ${canon(visitor.body)}`)
    assert(!visitor.body.includes('pulse-canonical'), 'placeholder must never reach the client')
    const again = await getWith(port, '/x', { Host: 'other.example' })   // served from cache
    assert(canon(again.body) === 'http://other.example/x', 'cache hit should fill in this request\'s canonical')
  })
})

await test('multipart field names cannot replace the prototype or spoof inherited fields', async () => {
  let seen
  const spec = { route: '/mp', csrf: false, meta: { title: 'm', description: 'm', theme: 'dark' },
    submit: async (ctx) => { const f = await ctx.formData(); seen = { proto: Object.getPrototypeOf(f) === Object.prototype, spoofed: f.type ?? f.size ?? f.filename, own: Object.keys(f) }; return {} },
    view: () => '<main id="main-content">m</main>' }
  await withServer([spec], { quiet: true }, async (port) => {
    const b = 'BND'
    const part = (name, file, val) => `--${b}\r\nContent-Disposition: form-data; name="${name}"${file ? '; filename="a.txt"' : ''}\r\n${file ? 'Content-Type: text/evil\r\n' : ''}\r\n${val}\r\n`
    const body = part('__proto__', true, 'PWN') + part('toString', false, 'x') + part('ok', false, 'fine') + `--${b}--\r\n`
    await requestWithBody(port, 'POST', '/mp', body, `multipart/form-data; boundary=${b}`)
    assert(seen.proto, 'prototype must be untouched')
    assert(seen.spoofed === undefined, `a __proto__ part leaked inherited fields: ${seen.spoofed}`)
    // Like the urlencoded parser, every field is just an own property.
    assert(['__proto__', 'toString', 'ok'].every(k => seen.own.includes(k)), `own fields missing: ${seen.own}`)
  })
})

await test('a malformed percent-escape in a cookie does not break the request', async () => {
  await withServer([formSpec], { quiet: true }, async (port) => {
    const res = await getWith(port, '/signup', { Cookie: 'junk=%; pulse_csrf=%E0%A4%A' })
    assert(res.status === 200, `expected 200, got ${res.status}`)
  })
})

await test('a CSRF cookie the server did not issue is ignored, so a planted id cannot be used', async () => {
  await withServer([formSpec], { quiet: true }, async (port) => {
    const planted = await getWith(port, '/signup', { Cookie: 'pulse_csrf=attacker-chosen-id' })
    const issued  = [].concat(planted.headers['set-cookie'] || []).find(c => c.startsWith('pulse_csrf='))
    assert(issued, 'server must issue its own cookie instead of trusting the planted one')
    assert(!issued.startsWith('pulse_csrf=attacker-chosen-id'), 'planted id must not be reused')
    // And a fresh, server-issued pair still works end to end.
    const { cookie, token } = await getCsrfPair(port, '/signup')
    const ok = await postForm(port, '/signup', { email: 'a@b.com', _csrf: token }, cookie)
    assert(ok.status === 303 || ok.status === 200, `valid pair should be accepted, got ${ok.status}`)
  })
})

await test('dev error endpoint rejects cross-site posts and oversized bodies, accepts same-origin', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-dev-'))
  const postErr = (port, headers, body) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/__pulse/error', method: 'POST', headers }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)) })
    req.on('error', (e) => resolve(e.code))
    req.end(body)
  })
  try {
    await withServer([hardenPage], { dev: true, root, quiet: true }, async (port) => {
      const body = JSON.stringify({ route: '/x', phase: 'view', message: 'boom', stack: '' })
      assert(await postErr(port, { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' }, body) === 403, 'cross-site must be 403')
      assert(await postErr(port, { Origin: 'https://evil.example' }, body) === 403, 'foreign Origin without Fetch-Metadata must be 403')
      assert(await postErr(port, { 'Sec-Fetch-Site': 'same-origin' }, body) === 204, 'same-origin must be accepted')
      const big = await postErr(port, { 'Sec-Fetch-Site': 'same-origin' }, 'x'.repeat(64 * 1024))
      assert(big === 413 || big === 'ECONNRESET', `oversized body should be refused, got ${big}`)
      const journal = JSON.parse(fs.readFileSync(path.join(root, '.pulse', 'errors.json'), 'utf8'))
      assert(journal.length === 1 && journal[0].message === 'boom', 'only the same-origin entry should be recorded')
    })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------

console.log('\nPinned origin and listen host\n')

const originPage = { route: '/x', meta: { title: 'X', description: 'x', theme: 'dark' }, view: () => '<main id="main-content">x</main>' }
const canonOf = b => (b.match(/<link rel="canonical" href="([^"]*)"/) || [])[1]
// Compare parsed values, not substrings: a substring match cannot tell "https://b.example/x" from "https://evil/?u=https://b.example/x".
const locsOf   = xml => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1])
const linesOf  = txt => txt.split('\n').map(l => l.trim()).filter(Boolean)

await test('origin pins canonical, sitemap and robots.txt, ignoring Host and X-Forwarded-*', async () => {
  await withServer([originPage], { origin: 'https://www.example.com/ignored/path', sitemap: true, defaultCache: 3600, quiet: true }, async (port) => {
    const forged = { Host: 'evil.example', 'X-Forwarded-Host': 'evil.example', 'X-Forwarded-Proto': 'http' }
    const page = await getWith(port, '/x', forged)
    assert(canonOf(page.body) === 'https://www.example.com/x', `canonical was ${canonOf(page.body)}`)
    const again = await getWith(port, '/x', { Host: 'other.example' })   // cached
    assert(canonOf(again.body) === 'https://www.example.com/x', 'cached response must also use the pinned origin')
    const sitemap = await getWith(port, '/sitemap.xml', forged)
    assert(JSON.stringify(locsOf(sitemap.body)) === JSON.stringify(['https://www.example.com/x']), `sitemap: ${sitemap.body.slice(0, 200)}`)
    const robots = await getWith(port, '/robots.txt', forged)
    assert(linesOf(robots.body).includes('Sitemap: https://www.example.com/sitemap.xml'), `robots: ${robots.body}`)
    assert(linesOf(robots.body).every(l => !/evil\.example/.test(l)), 'robots must not mention the forged host')
  })
})

await test('an explicit sitemap.origin still wins over origin', async () => {
  await withServer([originPage], { origin: 'https://a.example', sitemap: { origin: 'https://b.example' }, quiet: true }, async (port) => {
    const sitemap = await getWith(port, '/sitemap.xml')
    assert(JSON.stringify(locsOf(sitemap.body)) === JSON.stringify(['https://b.example/x']), sitemap.body.slice(0, 200))
  })
})

await test('without origin, behaviour is unchanged (headers are used)', async () => {
  await withServer([originPage], { quiet: true }, async (port) => {
    const page = await getWith(port, '/x', { Host: 'www.mysite.com' })
    assert(canonOf(page.body) === 'http://www.mysite.com/x', canonOf(page.body))
  })
})

await test('an invalid origin is rejected at startup, not at request time', async () => {
  for (const bad of ['example.com', 'ftp://example.com', 'javascript:alert(1)', '']) {
    let threw = null
    try { const { server } = await createServer([originPage], { port: nextPort++, origin: bad, quiet: true }); server.close() } catch (e) { threw = e }
    // '' is "not set" semantics only for null/undefined — an empty string is invalid
    assert(threw && /origin must be an absolute http\(s\) URL/.test(threw.message), `"${bad}" should be rejected`)
  }
})

await test('host: "127.0.0.1" listens on loopback only', async () => {
  await withServer([originPage], { host: '127.0.0.1', quiet: true }, async (port) => {
    assert((await get(port, '/x')).status === 200)
  })
  const port = nextPort++
  const { server } = await createServer([originPage], { port, host: '127.0.0.1', quiet: true })
  await new Promise(r => server.once('listening', r))
  try { assert(server.address().address === '127.0.0.1', `bound to ${server.address().address}`) }
  finally { server.closeAllConnections?.(); await new Promise(r => server.close(r)) }
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
finished = true
if (failed > 0) process.exit(1)
