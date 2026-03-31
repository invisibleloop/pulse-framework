/**
 * Spec schema tests — run with: node src/spec/schema.test.js
 */
import { validateSpec, assertValidSpec, getStreamOrder, getViewSegments } from './schema.js'

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

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

function assertErrors(spec, ...expectedFragments) {
  const { valid, errors } = validateSpec(spec)
  assert(!valid, 'Expected spec to be invalid but it passed')
  for (const fragment of expectedFragments) {
    const found = errors.some(e => e.includes(fragment))
    assert(found, `Expected error containing "${fragment}" but got:\n    ${errors.join('\n    ')}`)
  }
}

function assertValid(spec) {
  const { valid, errors } = validateSpec(spec)
  assert(valid, `Expected spec to be valid but got errors:\n  ${errors.join('\n  ')}`)
}

// ---------------------------------------------------------------------------

console.log('\nSpec validation\n')

test('rejects non-object', () => {
  assertErrors(null, 'must be a plain object')
  assertErrors('string', 'must be a plain object')
})

test('route is optional (derived server-side by convention)', () => {
  const { valid } = validateSpec({ state: {}, view: () => '' })
  assert(valid, 'spec without route should be valid for client-side use')
})

test('rejects route that does not start with /', () => {
  assertErrors({ route: 'contact', state: {}, view: () => '' }, 'must start with "/"')
})

test('state is optional — omitting it is valid', () => {
  const { valid, errors } = validateSpec({ route: '/contact', view: () => '' })
  if (!valid) throw new Error(`Expected valid but got: ${errors.join(', ')}`)
})

test('state must be a plain object when provided', () => {
  assertErrors({ route: '/contact', state: 'bad', view: () => '' }, 'spec.state must be a plain object')
})

test('requires view', () => {
  assertErrors({ route: '/contact', state: {} }, 'spec.view is required')
})

test('accepts function view', () => {
  assertValid({ route: '/contact', state: {}, view: () => '<div/>' })
})

test('accepts segmented view', () => {
  assertValid({
    route: '/contact',
    state: {},
    view: {
      header: () => '<header/>',
      form:   () => '<form/>'
    }
  })
})

test('rejects view segment that is not a function', () => {
  assertErrors(
    { route: '/contact', state: {}, view: { header: '<header/>' } },
    'spec.view.header must be a function'
  )
})

test('rejects stream referencing undefined segment', () => {
  assertErrors(
    {
      route: '/contact',
      state: {},
      view:  { header: () => '' },
      stream: { shell: ['header', 'missing'] }
    },
    'spec.stream references "missing"'
  )
})

test('rejects stream.shell that is not an array', () => {
  assertErrors(
    { route: '/contact', state: {}, view: () => '', stream: { shell: 'header' } },
    'spec.stream.shell must be an array'
  )
})

test('accepts valid stream.scope', () => {
  const spec = {
    route: '/s',
    state: {},
    server: { user: async () => {}, posts: async () => {} },
    stream: {
      shell:    ['header'],
      deferred: ['feed'],
      scope:    { header: ['user'], feed: ['posts'] },
    },
    view: { header: () => '', feed: () => '' },
  }
  const { valid } = validateSpec(spec)
  assert(valid, 'Expected valid spec with stream.scope')
})

test('rejects stream.scope referencing unknown segment', () => {
  assertErrors(
    {
      route: '/s',
      state: {},
      server: { user: async () => {} },
      stream: { shell: ['header'], scope: { unknown: ['user'] } },
      view: { header: () => '' },
    },
    'spec.stream.scope references unknown segment "unknown"'
  )
})

test('rejects stream.scope referencing unknown server key', () => {
  assertErrors(
    {
      route: '/s',
      state: {},
      server: { user: async () => {} },
      stream: { shell: ['header'], scope: { header: ['missing'] } },
      view: { header: () => '' },
    },
    'spec.stream.scope["header"] references unknown server key "missing"'
  )
})

test('rejects stream.scope with non-array value', () => {
  assertErrors(
    {
      route: '/s',
      state: {},
      server: { user: async () => {} },
      stream: { shell: ['header'], scope: { header: 'user' } },
      view: { header: () => '' },
    },
    'spec.stream.scope["header"] must be an array'
  )
})

test('rejects mutations with non-function values', () => {
  assertErrors(
    { route: '/x', state: {}, view: () => '', mutations: { inc: 'not a function' } },
    'spec.mutations.inc must be a function'
  )
})

test('rejects action missing run', () => {
  assertErrors(
    {
      route: '/x', state: {}, view: () => '',
      actions: { send: { onSuccess: () => {}, onError: () => {} } }
    },
    'spec.actions.send.run must be'
  )
})

test('rejects action missing onSuccess', () => {
  assertErrors(
    {
      route: '/x', state: {}, view: () => '',
      actions: { send: { run: async () => {}, onError: () => {} } }
    },
    'spec.actions.send.onSuccess must be'
  )
})

test('rejects unknown validation rule', () => {
  assertErrors(
    {
      route: '/x', state: {}, view: () => '',
      validation: { 'fields.email': { required: true, unknown: true } }
    },
    'unknown is not a recognised rule'
  )
})

test('accepts full valid spec', () => {
  assertValid({
    route: '/contact',
    stream: {
      shell:    ['header', 'form'],
      deferred: ['recent']
    },
    server: {
      recent: async () => []
    },
    state: {
      fields: { name: '', email: '', message: '' },
      status: 'idle'
    },
    validation: {
      'fields.name':    { required: true, minLength: 2 },
      'fields.email':   { required: true, format: 'email' },
      'fields.message': { required: true, minLength: 10, maxLength: 1000 }
    },
    view: {
      header: () => '<header/>',
      form:   (state) => `<form>${state.status}</form>`,
      recent: (state, server) => `<aside>${server.recent.length}</aside>`
    },
    mutations: {
      updateField: (state, e) => ({ fields: { ...state.fields, [e.target.name]: e.target.value } })
    },
    actions: {
      sendMessage: {
        validate:  true,
        run:       async (state) => {},
        onSuccess: () => ({ status: 'success' }),
        onError:   () => ({ status: 'error' })
      }
    },
    meta: { title: 'Contact Us' }
  })
})

// ---------------------------------------------------------------------------

console.log('\nRaw content specs (contentType)\n')

test('accepts a valid raw content spec', () => {
  assertValid({
    route:       '/feed.xml',
    contentType: 'application/rss+xml; charset=utf-8',
    render:      (ctx, server) => `<rss/>`
  })
})

test('raw spec does not require state or view', () => {
  const { valid } = validateSpec({
    route:       '/sitemap.xml',
    contentType: 'application/xml',
    render:      () => `<?xml?>`
  })
  assert(valid, 'raw spec without state/view should be valid')
})

test('raw spec accepts server data', () => {
  assertValid({
    route:       '/feed.json',
    contentType: 'application/json',
    server:      { posts: async () => [] },
    render:      (ctx, server) => JSON.stringify(server.posts)
  })
})

test('rejects raw spec missing render', () => {
  assertErrors(
    { route: '/feed.xml', contentType: 'application/rss+xml' },
    'spec.render is required'
  )
})

test('rejects raw spec with empty contentType', () => {
  assertErrors(
    { route: '/feed.xml', contentType: '', render: () => '' },
    'spec.contentType must be a non-empty string'
  )
})

// ---------------------------------------------------------------------------

console.log('\ngetViewSegments\n')

test('function view returns ["default"]', () => {
  const segments = getViewSegments({ view: () => '' })
  assert(segments.length === 1 && segments[0] === 'default', `Got ${segments}`)
})

test('segmented view returns keys', () => {
  const segments = getViewSegments({ view: { header: () => '', form: () => '' } })
  assert(segments.includes('header') && segments.includes('form'), `Got ${segments}`)
})

// ---------------------------------------------------------------------------

console.log('\ngetStreamOrder\n')

test('no stream config — all segments in shell', () => {
  const order = getStreamOrder({ view: { header: () => '', form: () => '' } })
  assert(order.shell.includes('header'), 'header should be in shell')
  assert(order.deferred.length === 0, 'deferred should be empty')
})

test('stream config is respected', () => {
  const order = getStreamOrder({
    view:   { header: () => '', form: () => '', recent: () => '' },
    stream: { shell: ['header', 'form'], deferred: ['recent'] }
  })
  assert(order.shell.includes('header'), 'header in shell')
  assert(order.shell.includes('form'), 'form in shell')
  assert(order.deferred.includes('recent'), 'recent in deferred')
})

// ---------------------------------------------------------------------------
// guard
// ---------------------------------------------------------------------------

test('accepts a valid guard function', () => {
  const { valid, errors } = validateSpec({
    route: '/admin',
    state: {},
    view:  () => '<main id="main-content">Admin</main>',
    guard: async (ctx) => { if (!ctx.cookies.session) return { redirect: '/login' } },
  })
  assert(valid, `Expected valid spec, got errors: ${errors.join(', ')}`)
})

test('rejects guard that is not a function', () => {
  assertErrors(
    { route: '/admin', state: {}, view: () => '', guard: '/login' },
    'spec.guard must be a function'
  )
})

test('rejects guard that is an object', () => {
  assertErrors(
    { route: '/admin', state: {}, view: () => '', guard: { redirect: '/login' } },
    'spec.guard must be a function'
  )
})

// ---------------------------------------------------------------------------
// assertValidSpec — framework-injected hydrate must not produce a warning
// ---------------------------------------------------------------------------

console.log('\nassertValidSpec\n')

test('does not warn when hydrate is framework-injected', () => {
  // The server injects hydrate onto specs that need it. assertValidSpec is called
  // on every render — it must not print a false-positive warning about hydrate.
  const warnings = []
  const orig = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    assertValidSpec({
      route:    '/entry',
      hydrate:  '/src/pages/entry.js',
      state:    { editing: false },
      view:     () => '<main id="main-content"></main>',
      mutations: { startEdit: () => ({ editing: true }) },
      meta:     { title: 'Entry', description: 'A page' },
    })
  } finally {
    console.warn = orig
  }
  const hydrateWarning = warnings.some(w => w.includes('hydrate'))
  assert(!hydrateWarning, `Unexpected hydrate warning: ${warnings.join('; ')}`)
})

test('validateSpec still warns when hydrate is set manually in source', () => {
  // validateSpec (used by the MCP tool on raw source files) should still warn.
  const { warnings } = validateSpec({
    route:   '/entry',
    hydrate: '/src/pages/entry.js',
    view:    () => '<main id="main-content"></main>',
    meta:    { title: 'Entry', description: 'A page' },
  })
  assert(warnings.some(w => w.includes('hydrate')), 'Expected hydrate warning from validateSpec')
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
