/**
 * Pulse — Store tests
 * run: node src/store/store.test.js
 */

import { validateStore, resolveStoreState } from './index.js'

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

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`)
}

// ---------------------------------------------------------------------------

console.log('\nvalidateStore\n')

await test('accepts a valid store with state and server', () => {
  const { valid } = validateStore({
    state:  { user: null },
    server: { user: async () => null },
  })
  assert(valid, 'Expected valid store')
})

await test('accepts a store with only state', () => {
  const { valid } = validateStore({ state: { theme: 'dark' } })
  assert(valid)
})

await test('accepts a store with only server', () => {
  const { valid } = validateStore({ server: { user: async () => null } })
  assert(valid)
})

await test('accepts a store with mutations', () => {
  const { valid } = validateStore({
    state:     { count: 0 },
    mutations: { increment: (s) => ({ count: s.count + 1 }) },
  })
  assert(valid)
})

await test('accepts a store with hydrate', () => {
  const { valid } = validateStore({ state: {}, hydrate: '/pulse.store.js' })
  assert(valid)
})

await test('rejects null', () => {
  const { valid, errors } = validateStore(null)
  assert(!valid)
  assert(errors.length > 0)
})

await test('rejects a non-object', () => {
  const { valid } = validateStore('not an object')
  assert(!valid)
})

await test('rejects an array', () => {
  const { valid } = validateStore([])
  assert(!valid)
})

await test('rejects state that is an array', () => {
  const { valid, errors } = validateStore({ state: [] })
  assert(!valid)
  assert(errors.some(e => e.includes('state')), `Expected state error in: ${errors}`)
})

await test('rejects state that is a string', () => {
  const { valid } = validateStore({ state: 'bad' })
  assert(!valid)
})

await test('rejects server that is an array', () => {
  const { valid, errors } = validateStore({ server: ['fn'] })
  assert(!valid)
  assert(errors.some(e => e.includes('server')), `Expected server error in: ${errors}`)
})

await test('rejects a server entry that is not a function', () => {
  const { valid, errors } = validateStore({ server: { user: 42 } })
  assert(!valid)
  assert(errors.some(e => e.includes('store.server.user')), `Expected named error in: ${errors}`)
})

await test('rejects mutations that is an array', () => {
  const { valid, errors } = validateStore({ mutations: [() => {}] })
  assert(!valid)
  assert(errors.some(e => e.includes('mutations')), `Expected mutations error in: ${errors}`)
})

await test('rejects a mutation entry that is not a function', () => {
  const { valid, errors } = validateStore({ mutations: { toggle: 'bad' } })
  assert(!valid)
  assert(errors.some(e => e.includes('store.mutations.toggle')), `Expected named error in: ${errors}`)
})

await test('rejects hydrate that does not start with /', () => {
  const { valid, errors } = validateStore({ hydrate: 'pulse.store.js' })
  assert(!valid)
  assert(errors.some(e => e.includes('hydrate')), `Expected hydrate error in: ${errors}`)
})

await test('rejects hydrate that is not a string', () => {
  const { valid } = validateStore({ hydrate: 42 })
  assert(!valid)
})

await test('returns all errors for multiple violations', () => {
  const { valid, errors } = validateStore({ state: [], server: { x: 'not-a-fn' } })
  assert(!valid)
  assert(errors.length >= 2, `Expected >= 2 errors, got ${errors.length}: ${errors.join(', ')}`)
})

// ---------------------------------------------------------------------------

console.log('\nresolveStoreState\n')

await test('returns state defaults when no server fetchers', async () => {
  const result = await resolveStoreState({ state: { user: null, theme: 'dark' } }, {})
  assertEqual(result.theme, 'dark')
  assert(result.user === null)
})

await test('resolves server fetchers and returns their results', async () => {
  const result = await resolveStoreState({
    state:  { user: null, settings: {} },
    server: {
      user:     async () => ({ id: 1, name: 'Alice' }),
      settings: async () => ({ theme: 'light' }),
    },
  }, {})
  assertEqual(result.user.name, 'Alice')
  assertEqual(result.settings.theme, 'light')
})

await test('server values override state defaults', async () => {
  const result = await resolveStoreState({
    state:  { user: 'default' },
    server: { user: async () => 'from-server' },
  }, {})
  assertEqual(result.user, 'from-server')
})

await test('state defaults are preserved for keys not covered by server', async () => {
  const result = await resolveStoreState({
    state:  { user: null, nav: [1, 2, 3] },
    server: { user: async () => ({ id: 1 }) },
  }, {})
  assertEqual(result.nav.length, 3)
})

await test('passes ctx to server fetchers', async () => {
  let received
  await resolveStoreState({
    server: { data: async (ctx) => { received = ctx; return null } },
  }, { cookies: { session: 'abc' } })
  assertEqual(received.cookies.session, 'abc')
})

await test('returns empty object when store has no state and no server', async () => {
  const result = await resolveStoreState({}, {})
  assert(typeof result === 'object' && result !== null)
  assertEqual(Object.keys(result).length, 0)
})

await test('timeout rejects if a fetcher exceeds fetcherTimeout', async () => {
  let threw = false
  try {
    await resolveStoreState({
      server: { slow: async () => new Promise(r => setTimeout(r, 200)) },
    }, { fetcherTimeout: 20 })
  } catch (e) {
    threw = true
    assert(e.message.includes('slow'), `Expected fetcher name in error: ${e.message}`)
    assert(e.message.toLowerCase().includes('timed out'), `Expected timeout message: ${e.message}`)
  }
  assert(threw, 'Expected timeout to throw')
})

await test('no timeout when fetcherTimeout is not set', async () => {
  const result = await resolveStoreState({
    server: { fast: async () => 'ok' },
  }, {})
  assertEqual(result.fast, 'ok')
})

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
