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

  global.history  = { replaceState: () => {}, pushState: () => {} }
  global.location = { pathname: '/start', search: '', origin: 'http://localhost', href: '' }
  global.window   = {
    scrollTo: () => {},
    addEventListener: (e, fn) => { if (e === 'popstate') popHandler = fn },
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
  initNavigation(root, mountFn)

  return {
    root,
    click: (ev) => clickHandler(ev),
    pop:   (ev) => popHandler(ev),
  }
}

/** Build a synthetic click event targeting an anchor. */
function clickEvent({ href, ctrlKey = false, metaKey = false, shiftKey = false, altKey = false, linkTarget = '' }) {
  const anchor = {
    getAttribute: (k) => k === 'href' ? (href ?? null) : null,
    target: linkTarget,
  }
  return {
    target:      { closest: (sel) => sel === 'a' ? anchor : null },
    ctrlKey, metaKey, shiftKey, altKey,
    preventDefault: () => {},
  }
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
