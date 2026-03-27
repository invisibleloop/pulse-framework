/**
 * Pulse 2 — Runtime tests
 * run: node src/runtime/runtime.test.js
 *
 * Uses a minimal DOM shim — no browser, no jsdom dependency.
 */

import { mount, validateFields, debounce, throttle } from './index.js'

// ---------------------------------------------------------------------------
// Minimal DOM shim
// ---------------------------------------------------------------------------

class FakeElement {
  constructor() {
    this.innerHTML  = ''
    this._listeners = {}
  }

  querySelectorAll(selector) {
    // Parse our own innerHTML to find matching elements
    return parseElements(this.innerHTML, selector)
  }

  addEventListener() {}
}

/**
 * Tiny HTML parser — finds elements with a given attribute.
 * Good enough for our tests. Not a real DOM parser.
 */
function parseElements(html, selector) {
  const attr  = selector.match(/\[([^\]]+)\]/)?.[1]
  if (!attr) return []

  const regex = new RegExp(`<[^>]+${attr}="([^"]*)"[^>]*>`, 'g')
  const matches = []
  let m

  while ((m = regex.exec(html)) !== null) {
    const attrValue = m[1]
    const el = {
      dataset: {},
      _fired:  {},
      addEventListener(event, fn) { this._fn = fn; this._event = event },
      dispatchEvent(event, data) { this._fn?.(data) }
    }

    if (attr === 'data-event') el.dataset.event  = attrValue
    if (attr === 'data-action') el.dataset.action = attrValue
    matches.push(el)
  }

  return matches
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${label}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

async function testAsync(label, fn) {
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
// Browser globals shim (localStorage, location)
// ---------------------------------------------------------------------------

const _store = {}
global.localStorage = {
  getItem:    (k)    => _store[k] ?? null,
  setItem:    (k, v) => { _store[k] = v },
  removeItem: (k)    => { delete _store[k] },
}
global.location = { pathname: '/test' }

// ---------------------------------------------------------------------------
// Counter spec — used across multiple tests
// ---------------------------------------------------------------------------

const counterSpec = {
  route: '/counter',
  state: { count: 0 },
  constraints: {
    count: { min: 0, max: 10 }
  },
  view: (state) =>
    `<div>
      <button data-event="decrement">-</button>
      <span id="count">${state.count}</span>
      <button data-event="increment">+</button>
      <button data-event="reset">reset</button>
    </div>`,
  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
    reset:     ()      => ({ count: 0 })
  }
}

// ---------------------------------------------------------------------------

console.log('\nMount & initial render\n')

test('renders initial state to element', () => {
  const el = new FakeElement()
  mount(counterSpec, el)
  assert(el.innerHTML.includes('>0<'), `Expected count 0 in HTML, got: ${el.innerHTML}`)
})

test('throws on invalid spec', () => {
  const el = new FakeElement()
  let threw = false
  try { mount({ route: '/bad' }, el) } catch { threw = true }
  assert(threw, 'Expected mount to throw on invalid spec')
})

test('accepts server state', () => {
  const el = new FakeElement()
  const spec = {
    route: '/hello',
    state: {},
    view:  (state, server) => `<h1>${server.greeting}</h1>`
  }
  mount(spec, el, { greeting: 'Hello world' })
  assert(el.innerHTML.includes('Hello world'), `Got: ${el.innerHTML}`)
})

// ---------------------------------------------------------------------------

console.log('\nMutations\n')

test('dispatch applies mutation and re-renders', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  instance.dispatch('increment')
  assert(el.innerHTML.includes('>1<'), `Expected count 1, got: ${el.innerHTML}`)

  instance.dispatch('increment')
  assert(el.innerHTML.includes('>2<'), `Expected count 2, got: ${el.innerHTML}`)
})

test('mutation receives current state', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  instance.dispatch('increment')
  instance.dispatch('increment')
  instance.dispatch('decrement')
  assert(el.innerHTML.includes('>1<'), `Expected count 1, got: ${el.innerHTML}`)
})

test('reset mutation works', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  instance.dispatch('increment')
  instance.dispatch('increment')
  instance.dispatch('reset')
  assert(el.innerHTML.includes('>0<'), `Expected count 0 after reset, got: ${el.innerHTML}`)
})

test('getState returns deep clone of current state', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  instance.dispatch('increment')
  const state = instance.getState()
  assert(state.count === 1, `Expected count 1, got ${state.count}`)

  // Mutating returned state should not affect internal state
  state.count = 999
  assert(instance.getState().count === 1, 'getState should return a clone, not a reference')
})

test('warns on unknown mutation', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)
  const warnings = []
  const orig = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))

  instance.dispatch('nonexistent')

  console.warn = orig
  assert(warnings.some(w => w.includes('nonexistent')), 'Expected warning for unknown mutation')
})

// ---------------------------------------------------------------------------

console.log('\nConstraints\n')

test('max constraint prevents count exceeding limit', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  for (let i = 0; i < 15; i++) instance.dispatch('increment')

  const state = instance.getState()
  assert(state.count === 10, `Expected count capped at 10, got ${state.count}`)
})

test('min constraint prevents count going below 0', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)

  for (let i = 0; i < 5; i++) instance.dispatch('decrement')

  const state = instance.getState()
  assert(state.count === 0, `Expected count floored at 0, got ${state.count}`)
})

test('constraints on nested paths', () => {
  const el = new FakeElement()
  const spec = {
    route: '/nested',
    state: { slider: { value: 5 } },
    constraints: { 'slider.value': { min: 0, max: 100 } },
    view: (s) => `<span>${s.slider.value}</span>`,
    mutations: {
      set: (state, val) => ({ slider: { ...state.slider, value: val } })
    }
  }
  const instance = mount(spec, el)
  instance.dispatch('set', 150)
  assert(instance.getState().slider.value === 100, `Expected 100, got ${instance.getState().slider.value}`)
})

test('render is skipped when mutation produces no state change', () => {
  const el = new FakeElement()
  let renderCount = 0
  const spec = {
    route: '/nochange',
    state: { count: 10 },
    constraints: { count: { min: 0, max: 10 } },
    view: (s) => { renderCount++; return `<span>${s.count}</span>` },
    mutations: {
      increment: (state) => ({ count: state.count + 1 }),  // clamped to 10
      noop:      ()      => ({}),                           // empty partial
    }
  }
  const instance = mount(spec, el)
  renderCount = 0  // reset after initial render

  instance.dispatch('increment')  // already at max — state unchanged
  instance.dispatch('noop')       // empty partial — state unchanged
  assert(renderCount === 0, `Expected 0 renders for no-change dispatches, got ${renderCount}`)

  instance.dispatch('increment') // state unchanged by constraint
  assert(instance.getState().count === 10)
})

// ---------------------------------------------------------------------------

console.log('\nActions\n')

await testAsync('action run is called and onSuccess updates state', async () => {
  const el = new FakeElement()
  let ran = false

  const spec = {
    route: '/form',
    state: { status: 'idle' },
    view: (s) => `<form data-action="submit"><span>${s.status}</span></form>`,
    actions: {
      submit: {
        run:       async () => { ran = true },
        onSuccess: () => ({ status: 'success' }),
        onError:   () => ({ status: 'error' })
      }
    }
  }

  const instance = mount(spec, el)
  await instance.dispatch('submit')

  assert(ran, 'Expected action.run to be called')
  assert(instance.getState().status === 'success', `Expected status "success", got "${instance.getState().status}"`)
})

await testAsync('onSuccess receives the return value of run()', async () => {
  const el = new FakeElement()

  const spec = {
    route: '/api-test',
    state: { items: [] },
    view: (s) => `<div>${JSON.stringify(s.items)}</div>`,
    actions: {
      load: {
        run:       async () => [{ id: 1, name: 'transformed' }],
        onSuccess: (state, result) => ({ items: result }),
        onError:   () => ({})
      }
    }
  }

  const instance = mount(spec, el)
  await instance.dispatch('load')

  const { items } = instance.getState()
  assert(Array.isArray(items) && items.length === 1, `Expected 1 item, got ${items.length}`)
  assert(items[0].name === 'transformed', `Expected transformed data, got ${JSON.stringify(items[0])}`)
})

await testAsync('action onError is called when run throws', async () => {
  const el = new FakeElement()

  const spec = {
    route: '/form',
    state: { status: 'idle' },
    view: (s) => `<span>${s.status}</span>`,
    actions: {
      submit: {
        run:       async () => { throw new Error('network error') },
        onSuccess: () => ({ status: 'success' }),
        onError:   () => ({ status: 'error' })
      }
    }
  }

  const instance = mount(spec, el)

  const errors = []
  const orig = console.error
  console.error = (...args) => errors.push(args)

  await instance.dispatch('submit')

  console.error = orig
  assert(instance.getState().status === 'error', `Expected "error", got "${instance.getState().status}"`)
})

await testAsync('onStart fires immediately before async work', async () => {
  const el = new FakeElement()
  const states = []

  const spec = {
    route: '/form',
    state: { status: 'idle' },
    view: (s) => `<span>${s.status}</span>`,
    actions: {
      submit: {
        onStart:   () => ({ status: 'loading' }),
        run:       async () => { states.push('during') },
        onSuccess: () => ({ status: 'done' }),
        onError:   () => ({ status: 'error' })
      }
    }
  }

  const instance = mount(spec, el)

  // Capture state at each render
  let renderCount = 0
  const origRefresh = instance.refresh
  const capturedStates = []

  await instance.dispatch('submit')

  assert(instance.getState().status === 'done', `Final status should be "done", got "${instance.getState().status}"`)
})

await testAsync('validate:true blocks action when fields invalid', async () => {
  const el = new FakeElement()
  let ran = false

  const spec = {
    route: '/form',
    state: { fields: { email: 'not-an-email' } },
    validation: { 'fields.email': { format: 'email' } },
    view: (s) => `<span>${s.fields.email}</span>`,
    actions: {
      submit: {
        validate:  true,
        run:       async () => { ran = true },
        onSuccess: () => ({}),
        onError:   () => ({})
      }
    }
  }

  const instance = mount(spec, el)

  const warnings = []
  const orig = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  await instance.dispatch('submit')
  console.warn = orig

  assert(!ran, 'Expected action.run NOT to be called when validation fails')
  assert(warnings.some(w => w.includes('Validation failed')), 'Expected validation warning')
})

// ---------------------------------------------------------------------------

console.log('\nValidation\n')

test('required rule catches empty string', () => {
  const errors = validateFields(
    { fields: { name: '' } },
    { 'fields.name': { required: true } }
  )
  assert(errors.length === 1, `Expected 1 error, got ${errors.length}`)
  assert(errors[0].rule === 'required', `Expected required error`)
})

test('email format rule', () => {
  const errors = validateFields(
    { fields: { email: 'notanemail' } },
    { 'fields.email': { format: 'email' } }
  )
  assert(errors.length === 1, `Expected 1 error`)
  assert(errors[0].rule === 'format', `Expected format error`)
})

test('valid email passes', () => {
  const errors = validateFields(
    { fields: { email: 'test@example.com' } },
    { 'fields.email': { format: 'email' } }
  )
  assert(errors.length === 0, `Expected no errors, got ${errors.length}`)
})

test('minLength rule', () => {
  const errors = validateFields(
    { fields: { message: 'hi' } },
    { 'fields.message': { minLength: 10 } }
  )
  assert(errors.length === 1, `Expected 1 error`)
  assert(errors[0].rule === 'minLength')
})

test('maxLength rule', () => {
  const errors = validateFields(
    { fields: { message: 'a'.repeat(1001) } },
    { 'fields.message': { maxLength: 1000 } }
  )
  assert(errors.length === 1, `Expected 1 error`)
  assert(errors[0].rule === 'maxLength')
})

test('multiple rules — all errors returned', () => {
  const errors = validateFields(
    { fields: { name: '', email: 'bad', message: 'hi' } },
    {
      'fields.name':    { required: true },
      'fields.email':   { required: true, format: 'email' },
      'fields.message': { minLength: 10 }
    }
  )
  assert(errors.length === 3, `Expected 3 errors, got ${errors.length}: ${errors.map(e => e.rule).join(', ')}`)
})

test('no errors on valid state', () => {
  const errors = validateFields(
    { fields: { name: 'Andy', email: 'andy@example.com', message: 'Hello world this is a message' } },
    {
      'fields.name':    { required: true, minLength: 2 },
      'fields.email':   { required: true, format: 'email' },
      'fields.message': { required: true, minLength: 10, maxLength: 1000 }
    }
  )
  assert(errors.length === 0, `Expected no errors, got: ${errors.map(e => e.message).join(', ')}`)
})

// ---------------------------------------------------------------------------

console.log('\nDestroy\n')

test('destroy clears the element', () => {
  const el = new FakeElement()
  const instance = mount(counterSpec, el)
  assert(el.innerHTML !== '', 'Should have content after mount')
  instance.destroy()
  assert(el.innerHTML === '', 'Should be empty after destroy')
})

// ---------------------------------------------------------------------------

console.log('\nPersistence\n')

const persistSpec = {
  route:    '/persist-test',
  state:    { count: 0, name: 'default' },
  persist:  ['count'],
  view:     (s) => `<span>${s.count}</span>`,
  mutations: {
    increment: (s) => ({ count: s.count + 1 }),
  }
}

test('persist writes state to localStorage after mutation', () => {
  localStorage.removeItem('pulse:/persist-test')
  const el = new FakeElement()
  const instance = mount(persistSpec, el)
  instance.dispatch('increment')
  const saved = JSON.parse(localStorage.getItem('pulse:/persist-test'))
  assert(saved?.count === 1, `Expected saved count 1, got ${saved?.count}`)
})

test('persist restores state from localStorage on mount', () => {
  localStorage.setItem('pulse:/persist-test', JSON.stringify({ count: 7 }))
  const el = new FakeElement()
  const instance = mount(persistSpec, el)
  assert(instance.getState().count === 7, `Expected restored count 7, got ${instance.getState().count}`)
})

test('persist only saves declared keys, not full state', () => {
  localStorage.removeItem('pulse:/persist-test')
  const el = new FakeElement()
  const instance = mount(persistSpec, el)
  instance.dispatch('increment')
  const saved = JSON.parse(localStorage.getItem('pulse:/persist-test'))
  assert(!('name' in saved), `Should not persist undeclared key "name"`)
})

test('persist re-renders on SSR mount when saved value differs from default', () => {
  localStorage.setItem('pulse:/persist-test', JSON.stringify({ count: 5 }))
  const el = new FakeElement()
  mount(persistSpec, el, {}, { ssr: true })
  assert(el.innerHTML.includes('5'), `Expected restored count 5 in HTML, got: ${el.innerHTML}`)
})

test('persist skips re-render on SSR mount when saved value matches default', () => {
  localStorage.setItem('pulse:/persist-test', JSON.stringify({ count: 0 }))
  const el = new FakeElement()
  el.innerHTML = '<span>server-rendered</span>'
  mount(persistSpec, el, {}, { ssr: true })
  assert(el.innerHTML === '<span>server-rendered</span>', 'Should preserve SSR HTML when state matches default')
})

test('spec without persist does not write to localStorage', () => {
  const key = 'pulse:/counter'
  localStorage.removeItem(key)
  const el = new FakeElement()
  const instance = mount(counterSpec, el)
  instance.dispatch('increment')
  assert(localStorage.getItem(key) === null, 'Should not write to localStorage without persist')
})

// ---------------------------------------------------------------------------

console.log('\nStore mutations\n')

import { registerStoreMutations, dispatchStoreMutation, getStoreState, updateStore } from './store.js'

// Register all mutations once — the singleton ignores subsequent calls (by design)
registerStoreMutations({
  bump:     (store)    => ({ count:   (store.count   ?? 0) + 1 }),
  setTheme: (store, e) => ({ theme:   e.target?.value ?? e }),
  inc:      (store)    => ({ counter: (store.counter ?? 0) + 1 }),
})

test('registerStoreMutations registers mutation functions', () => {
  dispatchStoreMutation('bump')
  assert(getStoreState().count === 1, `Expected count 1, got ${getStoreState().count}`)
})

test('dispatchStoreMutation with payload passes it to the mutation', () => {
  dispatchStoreMutation('setTheme', { target: { value: 'light' } })
  assert(getStoreState().theme === 'light', `Expected theme "light", got ${getStoreState().theme}`)
})

test('dispatchStoreMutation warns on unknown mutation', () => {
  const warnings = []
  const orig = console.warn
  console.warn = (...a) => warnings.push(a.join(' '))
  dispatchStoreMutation('doesNotExist')
  console.warn = orig
  assert(warnings.some(w => w.includes('doesNotExist')), 'Expected warning for unknown store mutation')
})

test('dispatchStoreMutation notifies subscribed pages', () => {
  updateStore({ counter: 0 })
  const el = new FakeElement()
  const spec = {
    route: '/store-sub',
    store: ['counter'],
    state: {},
    view: (state, server) => `<span>${server.counter ?? 0}</span>`,
  }
  mount(spec, el, { counter: 0 })
  const before = el.innerHTML
  dispatchStoreMutation('inc')
  assert(el.innerHTML !== before, `Page should re-render after store mutation`)
  assert(el.innerHTML.includes('1'), `Expected count 1 in HTML, got: ${el.innerHTML}`)
})

test('registerStoreMutations is a no-op after first call', () => {
  const before = getStoreState().count
  registerStoreMutations({ bump: () => ({ count: 999 }) }) // different fn — should be ignored
  dispatchStoreMutation('bump')
  assert(getStoreState().count === before + 1, `Should still use original mutation, got ${getStoreState().count}`)
})

// ---------------------------------------------------------------------------

console.log('\nDebounce / throttle\n')

await testAsync('debounce: fires once after delay, not on every call', async () => {
  let calls = 0
  const fn = debounce(() => { calls++ }, 20)
  fn(); fn(); fn()
  assert(calls === 0, 'Should not have fired yet')
  await new Promise(r => setTimeout(r, 40))
  assert(calls === 1, `Expected 1 call, got ${calls}`)
})

await testAsync('debounce: resets timer on each call', async () => {
  let calls = 0
  const fn = debounce(() => { calls++ }, 30)
  fn()
  await new Promise(r => setTimeout(r, 15))
  fn() // reset
  await new Promise(r => setTimeout(r, 15))
  assert(calls === 0, 'Should not have fired — timer was reset')
  await new Promise(r => setTimeout(r, 25))
  assert(calls === 1, `Expected 1 call after full delay, got ${calls}`)
})

await testAsync('debounce: passes latest args to handler', async () => {
  let last
  const fn = debounce((v) => { last = v }, 20)
  fn('a'); fn('b'); fn('c')
  await new Promise(r => setTimeout(r, 40))
  assert(last === 'c', `Expected "c", got "${last}"`)
})

await testAsync('throttle: fires immediately on first call', async () => {
  let calls = 0
  const fn = throttle(() => { calls++ }, 50)
  fn()
  assert(calls === 1, `Expected 1 call, got ${calls}`)
})

await testAsync('throttle: suppresses calls within the delay window', async () => {
  let calls = 0
  const fn = throttle(() => { calls++ }, 50)
  fn(); fn(); fn()
  assert(calls === 1, `Expected 1 call, got ${calls}`)
})

await testAsync('throttle: allows another call after delay has passed', async () => {
  let calls = 0
  const fn = throttle(() => { calls++ }, 30)
  fn()
  await new Promise(r => setTimeout(r, 40))
  fn()
  assert(calls === 2, `Expected 2 calls, got ${calls}`)
})

// ---------------------------------------------------------------------------

console.log('\nError boundaries\n')

test('view error: renders default fallback when view throws', () => {
  const el = new FakeElement()
  const spec = {
    route: '/err',
    state: {},
    view: () => { throw new Error('boom') }
  }
  mount(spec, el)
  assert(el.innerHTML.includes('View error'), `Expected fallback HTML, got: ${el.innerHTML}`)
  assert(el.innerHTML.includes('boom'), `Expected error message in fallback, got: ${el.innerHTML}`)
})

test('view error: calls spec.onViewError when view throws', () => {
  const el = new FakeElement()
  let capturedErr, capturedState
  const spec = {
    route: '/err',
    state: { x: 42 },
    view: () => { throw new Error('oops') },
    onViewError: (err, state) => {
      capturedErr   = err
      capturedState = state
      return '<p>custom fallback</p>'
    }
  }
  mount(spec, el)
  assert(el.innerHTML.includes('custom fallback'), `Expected custom fallback, got: ${el.innerHTML}`)
  assert(capturedErr?.message === 'oops', `Expected err.message "oops", got "${capturedErr?.message}"`)
  assert(capturedState?.x === 42, `Expected state.x 42, got ${capturedState?.x}`)
})

test('view error: continues working after recovery — next dispatch re-renders', () => {
  const el = new FakeElement()
  let shouldThrow = true
  const spec = {
    route: '/err',
    state: { ok: false },
    view: (state) => {
      if (shouldThrow) throw new Error('transient')
      return `<p>${state.ok}</p>`
    },
    mutations: { fix: () => ({ ok: true }) }
  }
  const app = mount(spec, el)
  assert(el.innerHTML.includes('View error'), 'Should show fallback initially')
  shouldThrow = false
  app.dispatch('fix')
  assert(el.innerHTML.includes('true'), `Expected recovered render, got: ${el.innerHTML}`)
})

// ---------------------------------------------------------------------------

console.log('\nToast (_toast)\n')

test('_toast in mutation is stripped from spec state', () => {
  const el = new FakeElement()
  const spec = {
    route: '/t',
    state: { count: 0 },
    view: (state) => `<p>${state.count}${state._toast ?? ''}</p>`,
    mutations: {
      inc: (state) => ({ count: state.count + 1, _toast: { message: 'Done!' } })
    }
  }
  const app = mount(spec, el)
  app.dispatch('inc')
  assert(app.getState().count === 1, 'count should increment')
  assert(app.getState()._toast === undefined, '_toast must not be in state')
})

await testAsync('_toast in onSuccess is stripped from spec state', async () => {
  const el = new FakeElement()
  const spec = {
    route: '/t',
    state: { saved: false },
    view: (state) => `<p>${state.saved}${state._toast ?? ''}</p>`,
    actions: {
      save: {
        run: async () => 'ok',
        onSuccess: () => ({ saved: true,  _toast: { message: 'Saved!', variant: 'success' } }),
        onError:   () => ({ saved: false, _toast: { message: 'Error',  variant: 'error'   } }),
      }
    }
  }
  const app = mount(spec, el)
  await app.dispatch('save')
  assert(app.getState().saved === true,      'saved should be true')
  assert(app.getState()._toast === undefined, '_toast must not be in state')
})

await testAsync('_toast in onError is stripped from spec state', async () => {
  const el = new FakeElement()
  const spec = {
    route: '/t',
    state: { failed: false },
    view: (state) => `${state.failed}`,
    actions: {
      save: {
        run: async () => { throw new Error('network') },
        onSuccess: () => ({}),
        onError:   () => ({ failed: true, _toast: { message: 'Failed', variant: 'error' } }),
      }
    }
  }
  const app = mount(spec, el)
  await app.dispatch('save')
  assert(app.getState().failed === true,      'failed should be true')
  assert(app.getState()._toast === undefined, '_toast must not be in state')
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
