/**
 * Pulse — Testing helpers tests
 * run: node src/testing/testing.test.js
 */

import { render, renderSync } from './index.js'

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

function assertEqual(a, b) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

// ---------------------------------------------------------------------------
// Specs used across tests
// ---------------------------------------------------------------------------

const counterSpec = {
  route: '/counter',
  state: { count: 0 },
  view:  (state) => `<div class="counter"><span id="count">${state.count}</span></div>`,
}

const productSpec = {
  route: '/products/:id',
  state: {},
  server: {
    product: async (ctx) => ({ id: ctx.params?.id ?? '1', name: 'Widget', price: 9.99 })
  },
  view: (_s, server) => `
    <main>
      <h1 class="title">${server.product.name}</h1>
      <p class="price">$${server.product.price}</p>
      <button type="button" data-event="buy" disabled>Buy</button>
    </main>
  `,
}

const formSpec = {
  route: '/contact',
  state: { name: '', email: '' },
  view:  (state) => `
    <form data-action="submit">
      <input name="name" type="text" value="${state.name}" required>
      <input name="email" type="email" value="${state.email}">
      <button type="submit">Send</button>
    </form>
  `,
}

const segmentedSpec = {
  route: '/page',
  state: {},
  view: {
    header: () => '<header><h1>Title</h1></header>',
    body:   () => '<main><p>Content</p></main>',
  },
}

const listSpec = {
  route: '/items',
  state: {},
  server: {
    items: async () => ['Alpha', 'Beta', 'Gamma']
  },
  view: (_s, server) => `<ul>${server.items.map(i => `<li>${i}</li>`).join('')}</ul>`,
}

// ---------------------------------------------------------------------------

console.log('\nrenderSync — basic rendering\n')

await test('renders view with default state', async () => {
  const result = renderSync(counterSpec)
  assert(result.html.includes('0'), `Expected 0, got: ${result.html}`)
})

await test('renders view with state overrides', async () => {
  const result = renderSync(counterSpec, { state: { count: 42 } })
  assert(result.html.includes('42'), `Expected 42, got: ${result.html}`)
})

await test('result.state reflects overrides merged with spec defaults', async () => {
  const result = renderSync(counterSpec, { state: { count: 7 } })
  assertEqual(result.state.count, 7)
})

await test('renders segmented view by concatenating all segments', async () => {
  const result = renderSync(segmentedSpec)
  assert(result.html.includes('<header>'), `Missing header: ${result.html}`)
  assert(result.html.includes('<main>'),   `Missing main: ${result.html}`)
})

await test('renders view with mock server state', async () => {
  const result = renderSync(productSpec, { server: { product: { name: 'Gadget', price: 19.99 } } })
  assert(result.html.includes('Gadget'), `Expected Gadget, got: ${result.html}`)
})

await test('result.server reflects the server state provided', async () => {
  const server = { product: { name: 'Gadget', price: 19.99 } }
  const result = renderSync(productSpec, { server })
  assertEqual(result.server.product.name, 'Gadget')
})

// ---------------------------------------------------------------------------

console.log('\nrender — async rendering\n')

await test('resolves spec.server fetchers and passes to view', async () => {
  const result = await render(productSpec)
  assert(result.html.includes('Widget'), `Expected Widget, got: ${result.html}`)
})

await test('passes ctx to server fetchers', async () => {
  const result = await render(productSpec, { ctx: { params: { id: '99' } } })
  assert(result.html.includes('Widget'), 'Expected Widget in output')
  assertEqual(result.server.product.id, '99')
})

await test('bypasses fetchers when server is provided', async () => {
  let fetcherCalled = false
  const spec = {
    route: '/mock',
    state: {},
    server: { data: async () => { fetcherCalled = true; return 'real' } },
    view:  (_s, server) => `<p>${server.data}</p>`,
  }
  const result = await render(spec, { server: { data: 'mocked' } })
  assert(!fetcherCalled,                    'Fetcher should not be called when server is provided')
  assert(result.html.includes('mocked'),    `Expected mocked, got: ${result.html}`)
})

await test('resolves multiple fetchers in parallel', async () => {
  const result = await render(listSpec)
  assert(result.html.includes('Alpha'), `Missing Alpha: ${result.html}`)
  assert(result.html.includes('Beta'),  `Missing Beta: ${result.html}`)
  assert(result.html.includes('Gamma'), `Missing Gamma: ${result.html}`)
})

await test('result.server contains resolved fetcher results', async () => {
  const result = await render(listSpec)
  assert(Array.isArray(result.server.items),    'Expected items array')
  assertEqual(result.server.items.length, 3)
})

// ---------------------------------------------------------------------------

console.log('\nresult.text()\n')

await test('returns all text content with tags stripped', async () => {
  const result = renderSync(counterSpec, { state: { count: 5 } })
  const text = result.text()
  assertEqual(text, '5')
})

await test('collapses whitespace and joins text from multiple elements', async () => {
  const result = renderSync(formSpec)
  // Buttons have text "Send"
  assert(result.text().includes('Send'), `Expected Send in text: ${result.text()}`)
})

// ---------------------------------------------------------------------------

console.log('\nresult.has(selector)\n')

await test('returns true when element exists', async () => {
  const result = renderSync(counterSpec)
  assert(result.has('div'), 'Expected div to exist')
})

await test('returns true for class selector', async () => {
  const result = renderSync(counterSpec)
  assert(result.has('.counter'), 'Expected .counter to exist')
})

await test('returns false when element does not exist', async () => {
  const result = renderSync(counterSpec)
  assert(!result.has('table'), 'Expected no table')
})

await test('matches attribute selector [attr]', async () => {
  const result = renderSync(formSpec)
  assert(result.has('[required]'), 'Expected [required] to exist')
})

await test('matches attribute selector [attr="value"]', async () => {
  const result = renderSync(formSpec)
  assert(result.has('input[type="email"]'), 'Expected email input')
})

await test('matches attribute selector [attr="value"] (negative)', async () => {
  const result = renderSync(formSpec)
  assert(!result.has('input[type="password"]'), 'Expected no password input')
})

// ---------------------------------------------------------------------------

console.log('\nresult.find() and result.get()\n')

await test('find() returns the first matching element', async () => {
  const result = renderSync(counterSpec)
  const el = result.find('span')
  assert(el !== null, 'Expected span element')
  assertEqual(el.tag, 'span')
})

await test('find() returns null when not found', async () => {
  const result = renderSync(counterSpec)
  const el = result.find('table')
  assertEqual(el, null)
})

await test('get() returns the element when found', async () => {
  const result = renderSync(counterSpec)
  const el = result.get('.counter')
  assert(el !== null, 'Expected .counter element')
  assertEqual(el.tag, 'div')
})

await test('get() throws when element not found', async () => {
  const result = renderSync(counterSpec)
  let threw = false
  try { result.get('table') } catch (e) {
    threw = true
    assert(e.message.includes('table'), `Expected selector in error: ${e.message}`)
  }
  assert(threw, 'Expected get() to throw')
})

await test('find() by id selector', async () => {
  const result = renderSync(counterSpec, { state: { count: 3 } })
  const el = result.find('#count')
  assert(el !== null, 'Expected #count element')
  assertEqual(el.text, '3')
})

await test('find() by compound selector (tag + class)', async () => {
  const result = renderSync(counterSpec)
  const el = result.find('div.counter')
  assert(el !== null, 'Expected div.counter')
})

await test('find() by attribute selector', async () => {
  const result = await render(productSpec, { server: { product: { name: 'W', price: 1 } } })
  const el = result.find('[disabled]')
  assert(el !== null, 'Expected disabled button')
  assertEqual(el.tag, 'button')
})

// ---------------------------------------------------------------------------

console.log('\nresult.findAll()\n')

await test('findAll() returns all matching elements', async () => {
  const result = await render(listSpec)
  const items = result.findAll('li')
  assertEqual(items.length, 3)
})

await test('findAll() returns empty array when nothing matches', async () => {
  const result = renderSync(counterSpec)
  const items = result.findAll('table')
  assertEqual(items.length, 0)
})

// ---------------------------------------------------------------------------

console.log('\nresult.count()\n')

await test('count() returns the number of matching elements', async () => {
  const result = renderSync(formSpec)
  assertEqual(result.count('input'), 2)
})

await test('count() returns 0 when nothing matches', async () => {
  const result = renderSync(counterSpec)
  assertEqual(result.count('table'), 0)
})

// ---------------------------------------------------------------------------

console.log('\nresult.attr()\n')

await test('attr() returns attribute value', async () => {
  const result = renderSync(formSpec)
  assertEqual(result.attr('input[name="email"]', 'type'), 'email')
})

await test('attr() returns empty string for boolean attributes', async () => {
  const result = await render(productSpec, { server: { product: { name: 'W', price: 1 } } })
  assertEqual(result.attr('button[disabled]', 'disabled'), '')
})

await test('attr() returns null when element not found', async () => {
  const result = renderSync(counterSpec)
  assertEqual(result.attr('table', 'class'), null)
})

await test('attr() returns null when attribute not present', async () => {
  const result = renderSync(counterSpec)
  assertEqual(result.attr('span', 'data-missing'), null)
})

// ---------------------------------------------------------------------------

console.log('\nElement methods\n')

await test('element.find() searches within the element', async () => {
  const result = renderSync(counterSpec)
  const container = result.get('.counter')
  const span = container.find('span')
  assert(span !== null, 'Expected span inside .counter')
})

await test('element.find() does not match outside the element', async () => {
  const spec = {
    route: '/test',
    state: {},
    view: () => `
      <section id="a"><p class="target">A</p></section>
      <section id="b"><p class="other">B</p></section>
    `,
  }
  const result = renderSync(spec)
  const a = result.get('#a')
  assert(a.has('.target'), 'Expected .target in #a')
  assert(!a.has('.other'), 'Expected .other to be outside #a')
})

await test('element.findAll() returns all descendants', async () => {
  const result = await render(listSpec)
  const ul = result.get('ul')
  assertEqual(ul.findAll('li').length, 3)
})

await test('element.text returns inner text content', async () => {
  const result = await render(listSpec)
  const items = result.findAll('li')
  assertEqual(items[0].text, 'Alpha')
  assertEqual(items[1].text, 'Beta')
  assertEqual(items[2].text, 'Gamma')
})

await test('element.attr() returns attribute value', async () => {
  const result = renderSync(formSpec)
  const email = result.get('input[type="email"]')
  assertEqual(email.attr('name'), 'email')
})

await test('element.has() checks for descendants', async () => {
  const result = renderSync(formSpec)
  const form = result.get('form')
  assert(form.has('button[type="submit"]'), 'Expected submit button in form')
})

// ---------------------------------------------------------------------------

console.log('\nHTML entity handling\n')

await test('text() decodes HTML entities', async () => {
  const spec = {
    route: '/esc',
    state: { msg: 'Hello &amp; World' },
    view:  (state) => `<p>${state.msg}</p>`,
  }
  const result = renderSync(spec)
  assertEqual(result.get('p').text, 'Hello & World')
})

await test('text() decodes &lt; and &gt;', async () => {
  const spec = {
    route: '/esc2',
    state: {},
    view:  () => `<p>&lt;code&gt;</p>`,
  }
  const result = renderSync(spec)
  assertEqual(result.get('p').text, '<code>')
})

// ---------------------------------------------------------------------------

console.log('\nEdge cases\n')

await test('handles void elements without closing tag', async () => {
  const spec = {
    route: '/void',
    state: {},
    view:  () => `<div><img src="/logo.png" alt="Logo"><input type="text"></div>`,
  }
  const result = renderSync(spec)
  assert(result.has('img'), 'Expected img')
  assert(result.has('input'), 'Expected input')
  assertEqual(result.attr('img', 'src'), '/logo.png')
})

await test('handles nested same-tag elements correctly', async () => {
  const spec = {
    route: '/nested',
    state: {},
    view:  () => `<div class="outer"><div class="inner"><span>deep</span></div></div>`,
  }
  const result = renderSync(spec)
  const outer = result.get('.outer')
  const inner = outer.find('.inner')
  assert(inner !== null, 'Expected .inner')
  const span = inner.find('span')
  assert(span !== null, 'Expected span in .inner')
  assertEqual(span.text, 'deep')
})

await test('count() handles multiple disjoint elements', async () => {
  const spec = {
    route: '/multi',
    state: {},
    view:  () => `<ul><li>A</li><li>B</li><li>C</li></ul>`,
  }
  const result = renderSync(spec)
  assertEqual(result.count('li'), 3)
})

await test('renderSync returns raw html string', async () => {
  const result = renderSync(counterSpec)
  assert(typeof result.html === 'string', 'Expected html to be a string')
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
