/**
 * Pulse — SSR renderer tests
 * run: node src/runtime/ssr.test.js
 */

import { renderToString, renderToStream, renderToNavStream, wrapDocument, withTimeout } from './ssr.js'

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
// Helpers
// ---------------------------------------------------------------------------

async function streamToString(stream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value)
  }
  return result
}

// ---------------------------------------------------------------------------
// Specs used across tests
// ---------------------------------------------------------------------------

const helloSpec = {
  route: '/hello',
  state: {},
  view:  () => '<h1>Hello world</h1>'
}

const counterSpec = {
  route: '/counter',
  state: { count: 5 },
  view:  (state) => `<span id="count">${state.count}</span>`
}

const serverDataSpec = {
  route:   '/products',
  hydrate: '/src/pages/products.js',
  state: {},
  server: {
    products: async (ctx) => [
      { id: 1, name: 'Widget' },
      { id: 2, name: 'Gadget' }
    ]
  },
  view: (state, server) =>
    `<ul>${server.products.map(p => `<li>${p.name}</li>`).join('')}</ul>`
}

const streamSpec = {
  route: '/stream',
  stream: {
    shell:    ['header', 'nav'],
    deferred: ['feed']
  },
  server: {
    feed: async () => {
      // Simulate async data
      await new Promise(r => setTimeout(r, 10))
      return [{ title: 'Post 1' }, { title: 'Post 2' }]
    }
  },
  state: {},
  view: {
    header: ()             => '<header>Pulse</header>',
    nav:    ()             => '<nav>Home</nav>',
    feed:   (s, server)    => `<main>${server.feed.map(p => `<h2>${p.title}</h2>`).join('')}</main>`
  }
}

const metaSpec = {
  route: '/about',
  state: {},
  view:  () => '<p>About</p>',
  meta: {
    title:       'About Us',
    description: 'Learn more about us',
    ogTitle:     'About Us — Pulse'
  }
}

// ---------------------------------------------------------------------------

console.log('\nrenderToString\n')

await test('renders simple function view', async () => {
  const { html } = await renderToString(helloSpec)
  assert(html.includes('<h1>Hello world</h1>'), `Got: ${html}`)
})

await test('renders initial client state into view', async () => {
  const { html } = await renderToString(counterSpec)
  assert(html.includes('>5<'), `Expected count 5, got: ${html}`)
})

await test('resolves server data and passes to view', async () => {
  const { html } = await renderToString(serverDataSpec)
  assert(html.includes('<li>Widget</li>'), `Expected Widget, got: ${html}`)
  assert(html.includes('<li>Gadget</li>'), `Expected Gadget, got: ${html}`)
})

await test('passes ctx to server data fetchers', async () => {
  const spec = {
    route: '/user',
    state: {},
    server: {
      greeting: async (ctx) => `Hello ${ctx.user}`
    },
    view: (s, server) => `<p>${server.greeting}</p>`
  }
  const { html } = await renderToString(spec, { user: 'Andy' })
  assert(html.includes('Hello Andy'), `Got: ${html}`)
})

await test('returns serverState from resolved fetchers', async () => {
  const { serverState } = await renderToString(serverDataSpec)
  assert(Array.isArray(serverState.products), 'Expected products array')
  assert(serverState.products.length === 2, `Expected 2 products, got ${serverState.products.length}`)
})

await test('returns timing object', async () => {
  const { timing } = await renderToString(helloSpec)
  assert(typeof timing.data   === 'number', 'timing.data should be a number')
  assert(typeof timing.render === 'number', 'timing.render should be a number')
  assert(typeof timing.total  === 'number', 'timing.total should be a number')
  assert(timing.total >= 0, 'timing.total should be non-negative')
})

await test('resolves multiple server fetchers in parallel', async () => {
  const spec = {
    route: '/multi',
    state: {},
    server: {
      a: async () => { await new Promise(r => setTimeout(r, 20)); return 'A' },
      b: async () => { await new Promise(r => setTimeout(r, 20)); return 'B' }
    },
    view: (s, server) => `${server.a}${server.b}`
  }

  const t0 = Date.now()
  const { html } = await renderToString(spec)
  const elapsed = Date.now() - t0

  assert(html === 'AB', `Got: ${html}`)
  // Parallel: should be ~20ms, not ~40ms
  assert(elapsed < 35, `Expected parallel resolution ~20ms, took ${elapsed}ms`)
})

await test('renders segmented view in order', async () => {
  const spec = {
    route: '/seg',
    state: {},
    view: {
      header: () => '<header/>',
      body:   () => '<main/>',
      footer: () => '<footer/>'
    }
  }
  const { html } = await renderToString(spec)
  const headerPos = html.indexOf('<header/>')
  const bodyPos   = html.indexOf('<main/>')
  const footerPos = html.indexOf('<footer/>')
  assert(headerPos < bodyPos,   'header should come before body')
  assert(bodyPos   < footerPos, 'body should come before footer')
})

await test('throws on invalid spec', async () => {
  let threw = false
  try { await renderToString({ route: '/bad' }) } catch { threw = true }
  assert(threw, 'Expected renderToString to throw on invalid spec')
})

// ---------------------------------------------------------------------------

console.log('\nrenderToStream\n')

await test('streams shell segments immediately', async () => {
  const html = await streamToString(renderToStream(streamSpec))
  assert(html.includes('<header>Pulse</header>'), `Shell header missing: ${html}`)
  assert(html.includes('<nav>Home</nav>'),         `Shell nav missing: ${html}`)
})

await test('streams deferred content after shell', async () => {
  const html = await streamToString(renderToStream(streamSpec))
  assert(html.includes('Post 1'), `Deferred feed missing Post 1: ${html}`)
  assert(html.includes('Post 2'), `Deferred feed missing Post 2: ${html}`)
})

await test('deferred content comes after shell in stream order', async () => {
  const html = await streamToString(renderToStream(streamSpec))
  const shellPos    = html.indexOf('<header>')
  const deferredPos = html.indexOf('Post 1')
  assert(shellPos < deferredPos, 'Shell should appear before deferred content')
})

await test('includes placeholder for deferred segment', async () => {
  const html = await streamToString(renderToStream(streamSpec))
  assert(html.includes('pulse-deferred'), `Expected pulse-deferred placeholder: ${html}`)
})

await test('includes replacement script for deferred segment', async () => {
  const html = await streamToString(renderToStream(streamSpec))
  assert(html.includes('replaceWith'), `Expected inline replacement script: ${html}`)
})

await test('streams simple function view', async () => {
  const html = await streamToString(renderToStream(helloSpec))
  assert(html.includes('<h1>Hello world</h1>'), `Got: ${html}`)
})

await test('stream injects __PULSE_SERVER__ when spec has server data', async () => {
  const html = await streamToString(renderToStream(serverDataSpec))
  assert(html.includes('__PULSE_SERVER__'), `Expected server state script: ${html}`)
  assert(html.includes('"Widget"'), `Expected serialised server data: ${html}`)
})

await test('stream does not inject __PULSE_SERVER__ when no server data', async () => {
  const html = await streamToString(renderToStream(helloSpec))
  assert(!html.includes('__PULSE_SERVER__'), `Should not include empty server state: ${html}`)
})

await test('each server fetcher runs at most once across all segments', async () => {
  let callCount = 0
  const spec = {
    route: '/dedup',
    stream: {
      shell:    ['header'],
      deferred: ['feed', 'sidebar'],
    },
    server: {
      user: async () => { callCount++; return 'user-data' },
    },
    state: {},
    view: {
      header:  (s, { user }) => `<header>${user}</header>`,
      feed:    (s, { user }) => `<feed>${user}</feed>`,
      sidebar: (s, { user }) => `<aside>${user}</aside>`,
    }
  }

  await streamToString(renderToStream(spec))
  assert(callCount === 1, `Expected fetcher called once, got ${callCount}`)
})

await test('stream.scope: shell does not wait for deferred-only fetchers', async () => {
  const spec = {
    route: '/scoped',
    stream: {
      shell:    ['header'],
      deferred: ['feed'],
      scope: {
        header: ['user'],   // fast (10ms)
        feed:   ['posts'],  // slow (80ms)
      }
    },
    server: {
      user:  async () => { await new Promise(r => setTimeout(r, 10));  return 'user-data' },
      posts: async () => { await new Promise(r => setTimeout(r, 80)); return 'posts-data' },
    },
    state: {},
    view: {
      header: (s, { user })  => `<header>${user}</header>`,
      feed:   (s, { posts }) => `<main>${posts}</main>`,
    }
  }

  const chunks = []
  const stream = renderToStream(spec)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let shellTime = null
  const t0 = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    if (shellTime === null && chunk.includes('<header>')) shellTime = Date.now() - t0
    chunks.push(chunk)
  }

  const fullHtml = chunks.join('')
  assert(fullHtml.includes('user-data'),  'header should contain user-data')
  assert(fullHtml.includes('posts-data'), 'feed should contain posts-data')
  // Shell should arrive ~10ms (user fetcher), not ~80ms (posts fetcher)
  assert(shellTime !== null && shellTime < 40, `Shell arrived too late: ${shellTime}ms (expected ~10ms)`)
})

await test('stream.scope: __PULSE_SERVER__ includes state from all scoped fetchers', async () => {
  const spec = {
    route:   '/scoped-state',
    hydrate: '/src/pages/scoped-state.js',
    stream: {
      shell:    ['header'],
      deferred: ['feed'],
      scope: { header: ['user'], feed: ['posts'] }
    },
    server: {
      user:  async () => ({ name: 'Andy' }),
      posts: async () => [{ title: 'Hello' }],
    },
    state: {},
    view: {
      header: (s, { user })  => `<header>${user.name}</header>`,
      feed:   (s, { posts }) => `<main>${posts[0].title}</main>`,
    }
  }

  const html = await streamToString(renderToStream(spec))
  assert(html.includes('"name":"Andy"'),   `Expected user state serialised: ${html}`)
  assert(html.includes('"title":"Hello"'), `Expected posts state serialised: ${html}`)
})

// ---------------------------------------------------------------------------

console.log('\nwrapDocument\n')

await test('wraps content in full HTML document', async () => {
  const { html } = wrapDocument({ content: '<p>Hello</p>' })
  assert(html.includes('<!DOCTYPE html>'), 'Missing DOCTYPE')
  assert(html.includes('<p>Hello</p>'), 'Missing content')
  assert(html.includes('</html>'), 'Missing closing tag')
})

await test('sets title from spec.meta', async () => {
  const { html } = wrapDocument({ content: '', spec: metaSpec })
  assert(html.includes('<title>About Us</title>'), `Got: ${html}`)
})

await test('sets description meta tag', async () => {
  const { html } = wrapDocument({ content: '', spec: metaSpec })
  assert(html.includes('name="description"'), `Got: ${html}`)
  assert(html.includes('Learn more about us'), `Got: ${html}`)
})

await test('sets og:title meta tag', async () => {
  const { html } = wrapDocument({ content: '', spec: metaSpec })
  assert(html.includes('og:title'), `Got: ${html}`)
})

await test('serialises server state into page', async () => {
  const { html } = wrapDocument({
    content:     '',
    spec:        { hydrate: '/src/pages/products.js' },
    serverState: { products: [{ id: 1 }] }
  })
  assert(html.includes('__PULSE_SERVER__'), `Expected server state script: ${html}`)
  assert(html.includes('"id":1'), `Expected serialised data: ${html}`)
})

await test('omits server state script when empty', async () => {
  const { html } = wrapDocument({ content: '' })
  assert(!html.includes('__PULSE_SERVER__'), 'Should not include empty server state script')
})

await test('returns serverTimingValue when timing provided', async () => {
  const { serverTimingValue } = wrapDocument({
    content: '',
    timing: { data: 5.2, render: 1.1, total: 6.3 }
  })
  assert(serverTimingValue !== null, 'Expected timing value')
  assert(serverTimingValue.includes('total'), `Got: ${serverTimingValue}`)
})

await test('escapes special characters in title', async () => {
  const { html } = wrapDocument({
    content: '',
    spec: { meta: { title: '<script>bad</script>' } }
  })
  assert(!html.includes('<script>bad'), `Title should be escaped: ${html}`)
  assert(html.includes('&lt;script&gt;'), `Expected escaped title: ${html}`)
})

await test('includes hydration script when spec.hydrate is set', async () => {
  const { html } = wrapDocument({
    content: '',
    spec: { hydrate: '/examples/counter.js' }
  })
  assert(html.includes('type="module"'),       `Expected module script: ${html}`)
  assert(html.includes('/examples/counter.js'), `Expected spec path: ${html}`)
  assert(html.includes('/@pulse/runtime/index.js'), `Expected runtime path: ${html}`)
  assert(html.includes('mount('),              `Expected mount() call: ${html}`)
})

await test('uses external script tag for bundle hydrate paths', async () => {
  const { html } = wrapDocument({
    content: '',
    spec: { hydrate: '/dist/counter.boot-ABC123.js' }
  })
  assert(html.includes('type="module" src="/dist/counter.boot-ABC123.js"'), `Expected external script: ${html}`)
  assert(!html.includes('import spec from'), `Should not include inline import: ${html}`)
})

await test('omits hydration script when spec.hydrate is not set', async () => {
  const { html } = wrapDocument({ content: '' })
  assert(!html.includes("import spec from"), `Should not include import: ${html}`)
})

// ---------------------------------------------------------------------------

console.log('\nError boundaries (SSR)\n')

await test('renderToString: rethrows when view throws and no onViewError — server handles it', async () => {
  const spec = {
    route: '/err',
    state: {},
    view: () => { throw new Error('ssr boom') }
  }
  let threw = false
  try { await renderToString(spec) } catch (e) {
    threw = true
    assert(e.message === 'ssr boom', `Expected original error, got: ${e.message}`)
  }
  assert(threw, 'Expected renderToString to rethrow when no onViewError is defined')
})

await test('renderToString: calls spec.onViewError and returns fallback when view throws', async () => {
  const spec = {
    route: '/err',
    state: { val: 99 },
    view: () => { throw new Error('ssr oops') },
    onViewError: (err, state) => `<p data-testid="fallback">${err.message}:${state.val}</p>`
  }
  const { html } = await renderToString(spec)
  assert(html.includes('data-testid="fallback"'), `Expected custom fallback, got: ${html}`)
  assert(html.includes('ssr oops:99'), `Expected err + state in fallback, got: ${html}`)
})

// ---------------------------------------------------------------------------

console.log('\nRequest timeouts\n')

await test('withTimeout: resolves normally when promise completes in time', async () => {
  const result = await withTimeout(Promise.resolve('ok'), 100, 'test')
  assert(result === 'ok', `Expected "ok", got "${result}"`)
})

await test('withTimeout: rejects with timeout error when promise is too slow', async () => {
  const slow = new Promise(r => setTimeout(r, 200))
  let err
  try { await withTimeout(slow, 30, 'myFetcher') } catch (e) { err = e }
  assert(err?.message?.includes('myFetcher'), `Expected fetcher name in error: ${err?.message}`)
  assert(err?.message?.includes('30ms'),      `Expected timeout duration in error: ${err?.message}`)
})

await test('withTimeout: no-op when ms is null', async () => {
  const result = await withTimeout(Promise.resolve(42), null, 'test')
  assert(result === 42, `Expected 42, got ${result}`)
})

await test('withTimeout: no-op when ms is 0', async () => {
  const result = await withTimeout(Promise.resolve(42), 0, 'test')
  assert(result === 42, `Expected 42, got ${result}`)
})

await test('renderToString: ctx.fetcherTimeout is applied to server fetchers', async () => {
  const spec = {
    route: '/slow',
    state: {},
    server: {
      data: () => new Promise(r => setTimeout(() => r('done'), 200))
    },
    view: (state, server) => `<p>${server.data}</p>`
  }
  let err
  try {
    await renderToString(spec, { fetcherTimeout: 30 })
  } catch (e) { err = e }
  assert(err?.message?.includes('timed out'), `Expected timeout error, got: ${err?.message}`)
})

await test('renderToString: resolves normally when fetcher completes within timeout', async () => {
  const spec = {
    route: '/fast',
    state: {},
    server: {
      data: () => Promise.resolve('quick')
    },
    view: (state, server) => `<p>${server.data}</p>`
  }
  const { html } = await renderToString(spec, { fetcherTimeout: 500 })
  assert(html.includes('quick'), `Expected rendered data, got: ${html}`)
})

// ---------------------------------------------------------------------------
// renderToNavStream
// ---------------------------------------------------------------------------

/**
 * Collect all NDJSON messages from a renderToNavStream response.
 * Returns them as an array of parsed objects in arrival order.
 */
async function collectNavMessages(stream) {
  const reader  = stream.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  const messages = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()
    for (const line of lines) {
      if (line.trim()) messages.push(JSON.parse(line))
    }
  }
  if (buf.trim()) messages.push(JSON.parse(buf))
  return messages
}

console.log('\nrenderToNavStream\n')

await test('sends meta as the first message with no data fetching', async () => {
  const spec = {
    route:   '/nav',
    state:   {},
    view:    () => '<main id="main-content">hello</main>',
    hydrate: '/nav.js',
  }
  const stream   = renderToNavStream(spec, {}, { title: 'Nav Page', styles: ['/app.css'] })
  const messages = await collectNavMessages(stream)
  const meta     = messages[0]
  assert(meta.type === 'meta',       `First message should be meta, got ${meta.type}`)
  assert(meta.title === 'Nav Page',  `Expected title 'Nav Page', got ${meta.title}`)
  assert(meta.hydrate === '/nav.js', `Expected hydrate '/nav.js', got ${meta.hydrate}`)
  assert(meta.styles[0] === '/app.css', 'styles should be forwarded')
})

await test('sends html message with shell content', async () => {
  const spec = {
    route: '/nav',
    state: {},
    view:  () => '<main id="main-content">shell</main>',
  }
  const messages = await collectNavMessages(renderToNavStream(spec))
  const html     = messages.find(m => m.type === 'html')
  assert(html, 'should have html message')
  assert(html.html.includes('shell'), 'html should contain view output')
})

await test('sends done message with serverState', async () => {
  const spec = {
    route:  '/nav',
    state:  {},
    server: { items: async () => [1, 2, 3] },
    view:   (s, srv) => `<main id="main-content">${srv.items.length}</main>`,
  }
  const messages  = await collectNavMessages(renderToNavStream(spec))
  const done      = messages.find(m => m.type === 'done')
  assert(done, 'should have done message')
  assert(Array.isArray(done.serverState?.items), 'serverState.items should be present')
  assert(done.serverState.items.length === 3, 'serverState.items should have 3 entries')
})

await test('sends deferred messages for each deferred segment', async () => {
  const spec = {
    route:  '/nav',
    state:  {},
    server: { user: async () => ({ name: 'Alice' }), posts: async () => ['a', 'b'] },
    stream: {
      shell:    ['header'],
      deferred: ['feed'],
    },
    view: {
      header: ()         => '<header>nav</header>',
      feed:   (s, srv)   => `<aside>${srv.posts.length} posts</aside>`,
    },
  }
  const messages  = await collectNavMessages(renderToNavStream(spec))
  const types     = messages.map(m => m.type)
  assert(types[0] === 'meta',     `First should be meta, got ${types[0]}`)
  assert(types.includes('html'),      'should include html')
  assert(types.includes('deferred'),  'should include deferred')
  assert(types[types.length - 1] === 'done', 'last should be done')

  const deferred = messages.find(m => m.type === 'deferred')
  assert(deferred.id === 'feed',           `Expected deferred id 'feed', got ${deferred.id}`)
  assert(deferred.html.includes('2 posts'), `Expected feed content, got: ${deferred.html}`)
})

await test('shell html includes <pulse-deferred> placeholders for deferred segments', async () => {
  const spec = {
    route:  '/nav',
    state:  {},
    server: { posts: async () => [] },
    stream: { shell: ['header'], deferred: ['feed'] },
    view: {
      header: () => '<header>top</header>',
      feed:   () => '<aside>feed</aside>',
    },
  }
  const messages = await collectNavMessages(renderToNavStream(spec))
  const html     = messages.find(m => m.type === 'html')
  assert(html.html.includes('pd-feed'), 'shell html should include <pulse-deferred id="pd-feed"> placeholder')
  assert(Array.isArray(html.deferred),  'html message should list deferred key names')
  assert(html.deferred[0] === 'feed',   `Expected deferred[0]='feed', got ${html.deferred[0]}`)
})

await test('stream.scope: meta arrives before slow deferred fetcher resolves', async () => {
  const spec = {
    route:  '/nav',
    state:  {},
    server: {
      fast: async () => 'quick',
      slow: async () => { await new Promise(r => setTimeout(r, 80)); return 'late' },
    },
    stream: {
      shell:    ['header'],
      deferred: ['feed'],
      scope:    { header: ['fast'], feed: ['slow'] },
    },
    view: {
      header: (s, srv) => `<header>${srv.fast}</header>`,
      feed:   (s, srv) => `<aside>${srv.slow}</aside>`,
    },
  }
  const t0       = Date.now()
  const stream   = renderToNavStream(spec)
  const reader   = stream.getReader()
  const decoder  = new TextDecoder()
  let buf = ''
  let metaTime = null
  let shellTime = null

  outer: while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      const msg = JSON.parse(line)
      if (msg.type === 'meta')  metaTime  = Date.now() - t0
      if (msg.type === 'html')  { shellTime = Date.now() - t0; break outer }
    }
  }
  reader.cancel()

  assert(metaTime  !== null,  'meta should have arrived')
  assert(shellTime !== null,  'shell should have arrived')
  assert(metaTime  < 20,  `meta should arrive <20ms (fast), got ${metaTime}ms`)
  assert(shellTime < 40,  `shell should arrive <40ms (only awaits 'fast'), got ${shellTime}ms`)
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
