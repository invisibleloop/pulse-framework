/**
 * Pulse — Navigate tests
 * run: node src/runtime/navigate.test.js
 */

import { initNavigation } from './navigate.js'
import assert from 'node:assert'

// ── Test runner ───────────────────────────────────────────────────────────────

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

// ── Minimal browser shims ─────────────────────────────────────────────────────

function makeRoot() {
  const root = {
    innerHTML: '',
    dataset:   {},
    querySelector:    () => null,
    querySelectorAll: () => [],
    hasAttribute: (k) => root._attrs.has(k),
    setAttribute: (k) => root._attrs.add(k),
    removeAttribute: (k) => root._attrs.delete(k),
    addEventListener: () => {},
    focus: () => {},
    _attrs: new Set(),
  }
  return root
}

/**
 * Set up fresh browser globals and call initNavigation().
 * Returns helpers to fire the registered click and popstate handlers.
 */
function setup({ mountFn = null } = {}) {
  let clickHandler = null
  let popHandler   = null
  let hashHandler  = null

  global.history  = { replaceState: () => {}, pushState: () => {} }
  global.location = { pathname: '/start', search: '', hash: '', origin: 'http://localhost', href: '' }
  global.window   = {
    scrollTo: () => {},
    addEventListener: (e, fn) => { if (e === 'popstate') popHandler = fn; if (e === 'hashchange') hashHandler = fn },
  }
  global.document = {
    title: 'Test',
    addEventListener: (e, fn) => { if (e === 'click') clickHandler = fn },
    dispatchEvent:    () => {},
    querySelectorAll: () => [],
    createElement:    () => ({
      rel: '', href: '', src: '', textContent: '', type: '',
      setAttribute: () => {},
      getAttribute: () => null,
      onload: null, onerror: null,
    }),
    head: { appendChild: () => {} },
  }
  global.CustomEvent = class { constructor(n) { this.type = n } }

  const root = makeRoot()
  const nav  = initNavigation(root, mountFn)

  return {
    root,
    nav,
    click: (ev) => clickHandler(ev),
    pop:   (ev) => popHandler(ev),
    hashchange: () => hashHandler(),
  }
}

/** Build a synthetic click event targeting an anchor. */
function clickEvent({ href, ctrlKey = false, metaKey = false, shiftKey = false, altKey = false, linkTarget = '', download = false, button = 0, defaultPrevented = false }) {
  const anchor = {
    getAttribute: (k) => k === 'href' ? (href ?? null) : null,
    hasAttribute: (k) => k === 'download' && download,
    target: linkTarget,
  }
  const ev = {
    target:      { closest: (sel) => sel === 'a' ? anchor : null },
    ctrlKey, metaKey, shiftKey, altKey, button, defaultPrevented,
    prevented: false,
    preventDefault() { ev.prevented = true },
  }
  return ev
}

/** Event where target has no ancestor <a>. */
function nonAnchorEvent() {
  return {
    target:      { closest: () => null },
    ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    preventDefault: () => {},
  }
}

// ── Click handler — link filtering ───────────────────────────────────────────

console.log('\nClick handler — link filtering\n')

await test('does not intercept clicks with no ancestor anchor', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(nonAnchorEvent())
  assert(!called)
})

await test('does not intercept anchor with no href', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: null }))
  assert(!called)
})

await test('does not intercept cross-origin links', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: 'https://example.com/page' }))
  assert(!called)
})

await test('does not intercept ctrl+click', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: '/page', ctrlKey: true }))
  assert(!called)
})

await test('does not intercept meta+click', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: '/page', metaKey: true }))
  assert(!called)
})

await test('does not intercept shift+click', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: '/page', shiftKey: true }))
  assert(!called)
})

await test('does not intercept target=_blank links', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: '/page', linkTarget: '_blank' }))
  assert(!called)
})

await test('intercepts same-origin links', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  click(clickEvent({ href: '/same-origin' }))
  assert(called, 'fetch should be called for same-origin link')
})

await test('leaves clicks alone that are already handled, non-primary, or download links', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  for (const opts of [{ defaultPrevented: true }, { button: 1 }, { download: true }]) {
    const ev = clickEvent({ href: '/file', ...opts })
    click(ev)
    assert(!called && !ev.prevented, `should not intercept ${JSON.stringify(opts)}`)
  }
})

// ── Navigation — tearing down the previous page's mount ──────────────────────

console.log('\nNavigation — previous mount is destroyed\n')

const sleep = ms => new Promise(r => setTimeout(r, ms))
const jsonResponse = body => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => body })
const HYDRATED = 'data:text/javascript,export default { route: "/next" }'

/** An NDJSON streaming navigation response made of the given messages. */
function streamResponse(messages) {
  const bytes = new TextEncoder().encode(messages.map(m => JSON.stringify(m)).join('\n') + '\n')
  let sent = false
  return {
    ok: true,
    headers: { get: () => 'application/x-ndjson' },
    body: { getReader: () => ({ read: async () => (sent ? { done: true } : (sent = true, { done: false, value: bytes })), cancel: () => {} }) },
  }
}
const staticStream = () => streamResponse([
  { type: 'meta', hydrate: null, title: 'Static', styles: [], scripts: [] },
  { type: 'html', html: '<p>static</p>', deferred: [] },
  { type: 'done', serverState: {} },
])

await test("the first page's mount, registered with setMount, is destroyed before the next page mounts (#168)", async () => {
  const events = []
  const first  = { destroy: () => events.push('destroy first') }
  const { click, nav } = setup({ mountFn: () => { events.push('mount next'); return { destroy: () => events.push('destroy next') } } })
  nav.setMount(first)
  global.fetch = async () => jsonResponse({ html: '<p>next</p>', title: 'Next', hydrate: HYDRATED, serverState: {} })
  click(clickEvent({ href: '/next' }))
  await sleep(60)
  assert.deepEqual(events, ['destroy first', 'mount next'])
})

await test('later navigations destroy the previous navigated page too', async () => {
  const events = []
  let n = 0
  const { click, nav } = setup({ mountFn: () => { const id = ++n; events.push(`mount ${id}`); return { destroy: () => events.push(`destroy ${id}`) } } })
  nav.setMount({ destroy: () => events.push('destroy first') })
  global.fetch = async () => jsonResponse({ html: '<p>x</p>', hydrate: HYDRATED, serverState: {} })
  click(clickEvent({ href: '/one' })); await sleep(60)
  click(clickEvent({ href: '/two' })); await sleep(60)
  assert.deepEqual(events, ['destroy first', 'mount 1', 'destroy 1', 'mount 2'])
})

await test('navigating to a page with no hydrate bundle destroys the previous mount, keeping the new HTML (#171)', async () => {
  const calls = []
  const { click, nav, root } = setup({ mountFn: () => ({ destroy: () => {} }) })
  nav.setMount({ destroy: (opts) => calls.push(opts) })
  global.fetch = async () => jsonResponse({ html: '<p>static</p>', title: 'Static', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/static' }))
  await sleep(60)
  assert.equal(calls.length, 1, 'the previous instance must be destroyed once')
  assert.deepEqual(calls[0], { keepDom: true }, 'destroy must not wipe the new page that is already in the root')
  assert.equal(root.innerHTML, '<p>static</p>')
})

await test('the same, for a streamed navigation response', async () => {
  const calls = []
  const { click, nav, root } = setup({ mountFn: () => ({ destroy: () => {} }) })
  nav.setMount({ destroy: (opts) => calls.push(opts) })
  global.fetch = async () => staticStream()
  click(clickEvent({ href: '/static' }))
  await sleep(60)
  assert.deepEqual(calls, [{ keepDom: true }])
  assert.equal(root.innerHTML, '<p>static</p>')
})

await test('a streamed response cut off after the metadata leaves the old page working (nothing destroyed before the HTML arrives)', async () => {
  const calls = []
  const { click, nav, root } = setup({ mountFn: () => ({ destroy: () => {} }) })
  root.innerHTML = '<p>old page</p>'
  nav.setMount({ destroy: (opts) => calls.push(opts) })
  global.fetch = async () => streamResponse([{ type: 'meta', hydrate: null, title: 'Static', styles: [], scripts: [] }])
  click(clickEvent({ href: '/static' }))
  await sleep(60)
  assert.deepEqual(calls, [], 'the old instance must survive a response that never delivers a page')
  assert.equal(root.innerHTML, '<p>old page</p>')
})

await test('the previous mount is destroyed immediately before the new HTML is swapped in, while the old DOM is still there', async () => {
  let seenDuringDestroy = null
  const { click, nav, root } = setup({ mountFn: () => ({ destroy: () => {} }) })
  root.innerHTML = '<p>old page</p>'
  nav.setMount({ destroy: () => { seenDuringDestroy = root.innerHTML } })
  global.fetch = async () => staticStream()
  click(clickEvent({ href: '/static' }))
  await sleep(60)
  assert.equal(seenDuringDestroy, '<p>old page</p>')
  assert.equal(root.innerHTML, '<p>static</p>')
})

await test('a destroy() that throws still clears the stale reference, so it is not called twice', async () => {
  let calls = 0
  const { click, nav } = setup({ mountFn: () => ({ destroy: () => {} }) })
  nav.setMount({ destroy: () => { calls++; throw new Error('boom') } })
  const prevLocation = global.location
  global.fetch = async () => jsonResponse({ html: '<p>static</p>', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/one' })); await sleep(60)   // throws inside navigate -> falls back to a full load
  global.fetch = async () => jsonResponse({ html: '<p>static 2</p>', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/two' })); await sleep(60)
  assert.equal(calls, 1, 'the failed destroy must not be retried on the next navigation')
  global.location = prevLocation
})

await test('after a static page nothing is left to destroy, and the next hydrated page mounts normally', async () => {
  const events = []
  const { click, nav } = setup({ mountFn: () => { events.push('mount'); return { destroy: () => events.push('destroy next') } } })
  nav.setMount({ destroy: () => events.push('destroy first') })
  global.fetch = async () => jsonResponse({ html: '<p>static</p>', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/static' })); await sleep(60)
  click(clickEvent({ href: '/static-2' })); await sleep(60)   // a second static page: still nothing to destroy
  global.fetch = async () => jsonResponse({ html: '<p>app</p>', hydrate: HYDRATED, serverState: {} })
  click(clickEvent({ href: '/app' })); await sleep(60)
  assert.deepEqual(events, ['destroy first', 'mount'])
})

// ── Navigation — fetch abort and cancellation ────────────────────────────────

console.log('\nNavigation — fetch abort and cancellation\n')

await test('aborts in-flight fetch when a new navigation starts', async () => {
  const { click } = setup()
  const signals = []
  global.fetch = async (_url, opts) => {
    signals.push(opts.signal)
    return new Promise(() => {}) // never resolves
  }

  click(clickEvent({ href: '/page-a' }))
  click(clickEvent({ href: '/page-b' }))

  assert.equal(signals.length, 2, 'two fetches made')
  assert(signals[0].aborted,  'first navigation signal should be aborted')
  assert(!signals[1].aborted, 'second navigation signal should not be aborted')
})

await test('swallows AbortError — does not fall back to location.href', async () => {
  const { click } = setup()
  global.fetch = async () => {
    const err = new Error('aborted')
    err.name = 'AbortError'
    throw err
  }
  let fallbackSet = false
  Object.defineProperty(global.location, 'href', {
    set: () => { fallbackSet = true },
    get: () => '',
    configurable: true,
  })
  click(clickEvent({ href: '/page' }))
  await new Promise(r => setTimeout(r, 10))
  assert(!fallbackSet, 'AbortError must not trigger location.href fallback')
})

await test('falls back to location.href on network error', async () => {
  const { click } = setup()
  global.fetch = async () => { throw new Error('network failure') }
  let fallback = null
  Object.defineProperty(global.location, 'href', {
    set: (v) => { fallback = v },
    get: () => '',
    configurable: true,
  })
  click(clickEvent({ href: '/broken' }))
  await new Promise(r => setTimeout(r, 10))
  assert.equal(fallback, '/broken')
})

await test('falls back to location.href on non-ok response', async () => {
  const { click } = setup()
  global.fetch = async () => ({ ok: false })
  let fallback = null
  Object.defineProperty(global.location, 'href', {
    set: (v) => { fallback = v },
    get: () => '',
    configurable: true,
  })
  click(clickEvent({ href: '/missing' }))
  await new Promise(r => setTimeout(r, 10))
  assert.equal(fallback, '/missing')
})

// ── Navigation — JSON response ───────────────────────────────────────────────

console.log('\nNavigation — JSON response\n')

function jsonFetch(payload) {
  return async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  })
}

await test('sets root.innerHTML from JSON html field', async () => {
  const { click, root } = setup()
  global.fetch = jsonFetch({ html: '<p>Hello</p>', title: 'T', styles: [], scripts: [], hydrate: null, serverState: {}, storeState: null })
  click(clickEvent({ href: '/new' }))
  await new Promise(r => setTimeout(r, 10))
  assert.equal(root.innerHTML, '<p>Hello</p>')
})

await test('updates document.title from JSON title field', async () => {
  const { click } = setup()
  global.fetch = jsonFetch({ html: '', title: 'New Title', styles: [], scripts: [], hydrate: null, serverState: {}, storeState: null })
  click(clickEvent({ href: '/titled' }))
  await new Promise(r => setTimeout(r, 10))
  assert.equal(global.document.title, 'New Title')
})

await test('updates store state when storeState is present', async () => {
  const { click } = setup()
  global.fetch = jsonFetch({ html: '', title: '', styles: [], scripts: [], hydrate: null, serverState: {}, storeState: { theme: 'dark' } })
  let stored = null
  global.window.__updatePulseStore__ = (s) => { stored = s }
  click(clickEvent({ href: '/store-page' }))
  await new Promise(r => setTimeout(r, 10))
  assert.deepEqual(stored, { theme: 'dark' })
})

// ── Fragment links ───────────────────────────────────────────────────────────

console.log('\nFragment links\n')

await test('a fragment link to the current page is left to the browser (skip links keep working)', async () => {
  const { click } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  for (const href of ['#main-content', '#', '/start#details']) {
    const ev = clickEvent({ href })
    click(ev)
    assert(!called && !ev.prevented, `${href} should not be intercepted`)
  }
})

await test('a fragment link to another page navigates and keeps the fragment', async () => {
  const { click } = setup()
  let fetched = null
  global.fetch = async (p) => { fetched = p; return new Promise(() => {}) }
  const ev = clickEvent({ href: '/other#section-2' })
  click(ev)
  assert(ev.prevented, 'cross-page links are still intercepted')
  assert.equal(fetched, '/other#section-2')
})

await test('after navigating to /page#id, the element with that id is scrolled to and focused', async () => {
  const { click } = setup()
  const log = []
  const target = {
    hasAttribute: () => false, setAttribute: () => {}, addEventListener: () => {}, removeAttribute: () => {},
    scrollIntoView: () => log.push('scrollIntoView'), focus: () => log.push('focus target'),
  }
  global.document.getElementById = (id) => (id === 'section-2' ? target : null)
  global.window.scrollTo = () => log.push('scrollTo top')
  global.fetch = async () => jsonResponse({ html: '<h2 id="section-2">x</h2>', title: 'Other', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/other#section-2' }))
  await sleep(60)
  assert.deepEqual(log, ['scrollIntoView', 'focus target'])
})

await test('a navigation without a fragment still scrolls to the top', async () => {
  const { click } = setup()
  const log = []
  global.window.scrollTo = () => log.push('scrollTo top')
  global.fetch = async () => jsonResponse({ html: '<p>x</p>', title: 'Other', hydrate: null, serverState: {} })
  click(clickEvent({ href: '/other' }))
  await sleep(60)
  assert.deepEqual(log, ['scrollTo top'])
})

await test('the first history entry keeps the query string and fragment of the landing URL', async () => {
  const calls = []
  setup()   // resets globals; re-run init with a richer landing URL
  global.history  = { replaceState: (...a) => calls.push(a), pushState: () => {} }
  global.location = { pathname: '/search', search: '?q=pulse', hash: '#results', origin: 'http://localhost', href: '' }
  initNavigation({ addEventListener: () => {} }, null)
  assert.equal(calls[0][2], '/search?q=pulse#results')
})

// ── Navigation — popstate ────────────────────────────────────────────────────

console.log('\nNavigation — popstate\n')

await test('navigates on pulse popstate', async () => {
  const { pop } = setup()
  let fetchedPath = null
  global.fetch = async (path) => { fetchedPath = path; return new Promise(() => {}) }
  global.location.pathname = '/history-page'
  global.location.search   = ''
  pop({ state: { pulse: true } })
  await new Promise(r => setTimeout(r, 0))
  assert.equal(fetchedPath, '/history-page')
})

await test('a history step that only changes the fragment does not refetch the page', async () => {
  const { pop } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  global.location.pathname = '/start'   // the page already shown
  global.location.hash     = '#part-2'
  pop({ state: { pulse: true } })
  await sleep(10)
  assert(!called, 'same path, different fragment: leave it to the browser')
})

await test('a fragment entry the browser created is marked as ours, so going back onto it from another page navigates', async () => {
  const { hashchange } = setup()
  const replaced = []
  global.history = { state: null, replaceState: (...a) => replaced.push(a), pushState: () => {} }
  global.location.pathname = '/start'
  global.location.hash     = '#part-2'
  hashchange()
  assert.deepEqual(replaced[0][0], { pulse: true, path: '/start#part-2' })
  replaced.length = 0
  global.history.state = { pulse: true }
  hashchange()
  assert.equal(replaced.length, 0, 'entries that already carry Pulse state are left alone')
})

await test('ignores popstate without pulse state', async () => {
  const { pop } = setup()
  let called = false
  global.fetch = async () => { called = true; return new Promise(() => {}) }
  pop({ state: null })
  pop({ state: { pulse: false } })
  assert(!called, 'fetch should not be called for non-pulse popstate')
})

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
