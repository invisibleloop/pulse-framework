/**
 * Pulse — HTTP Server tests
 * run: node src/server/server.test.js
 */

import http from 'http'
import { createServer } from './index.js'

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
  const { server } = createServer(specs, { ...options, port })
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
    createServer([{ route: '/bad' }], { port: 19999 })
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

console.log('\nError pages\n')

const throwingSpec = {
  route: '/boom',
  state: {},
  view:  () => { throw new Error('view exploded') }
}

await test('dev mode returns HTML error page on render error (string mode)', async () => {
  await withServer([throwingSpec], { stream: false, dev: true }, async (port) => {
    const { status, headers, body } = await get(port, '/boom')
    assert(status === 500,                            `Expected 500, got ${status}`)
    assert(headers['content-type']?.includes('text/html'), `Expected HTML, got ${headers['content-type']}`)
    assert(body.includes('view exploded'),             `Expected error message in page: ${body.slice(0, 200)}`)
    assert(body.includes('Stack trace'),              `Expected stack trace section in page`)
  })
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
  await withServer([throwingSpec], { stream: true, dev: true }, async (port) => {
    const { status, body } = await get(port, '/boom')
    assert(status === 200,                       `Stream mode commits 200 before error, got ${status}`)
    assert(body.includes('view exploded'),        `Expected error message injected into stream: ${body.slice(0, 400)}`)
    assert(body.includes('pulse-root'),           `Expected pulse-root in partial document`)
  })
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

await test('CSP header present on streaming page response', async () => {
  await withServer([canonicalSpec], { stream: true }, async (port) => {
    const { headers } = await request(port, 'GET', '/about')
    assert(headers['content-security-policy'],
      'Missing Content-Security-Policy header on streaming response')
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

console.log('\nGraceful shutdown\n')

await test('shutdown() is returned from createServer', async () => {
  const port = nextPort++
  const result = createServer([helloSpec], { port, stream: false })
  assert(typeof result.shutdown === 'function', 'Expected shutdown to be a function')
  result.server.closeAllConnections?.()
  await new Promise(resolve => result.server.close(resolve))
})

await test('shutdown() stops the server from accepting new connections', async () => {
  const port = nextPort++
  const { server, shutdown } = createServer([helloSpec], { port, stream: false })
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
})

await test('shutdown() is idempotent — calling twice does not throw', async () => {
  const port = nextPort++
  const { server, shutdown } = createServer([helloSpec], { port, stream: false })
  await new Promise(resolve => server.once('listening', resolve))
  shutdown()
  shutdown() // second call is a no-op
  await new Promise(resolve => setTimeout(resolve, 20))
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

  const { server, shutdown } = createServer([slowSpec], { port, stream: false })
  await new Promise(resolve => server.once('listening', resolve))

  // Start a request but don't resolve its server fetch yet
  const pending = get(port, '/slow')

  // Small delay to ensure the request is in flight before shutdown
  await new Promise(resolve => setTimeout(resolve, 20))

  shutdown()

  // Now resolve the slow fetch — the response should still complete
  resolveSlowFetch()
  const { status, body } = await pending
  assert(status === 200, `Expected 200, got ${status}`)
  assert(body.includes('<p>done</p>'), `Expected response body, got: ${body}`)
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

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
