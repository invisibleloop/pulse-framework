import{a as o}from"./runtime-QFURDKA2.js";import{a as d,b as a,c as i,d as l,e,g as t,h as s,i as u}from"./runtime-L2HNXIHW.js";import{a as c,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:h}=d("/testing"),n={route:"/testing",meta:{title:"Testing \u2014 Pulse Docs",description:"Test Pulse view functions with renderSync and render \u2014 query the HTML output with CSS-like selectors, no DOM required.",styles:["/docs.css"]},state:{},view:()=>a({currentHref:"/testing",prev:p,next:h,content:`
      ${i("Testing")}
      ${l("Pulse ships a built-in testing helper at <code>@invisibleloop/pulse/testing</code>. Render a spec's view in tests and query the HTML output with CSS-like selectors \u2014 no DOM, no jsdom, no extra dependencies.")}

      ${e("quick-start","Quick start")}
      ${t(o(`import { renderSync, render } from '@invisibleloop/pulse/testing'
import assert from 'node:assert/strict'
import spec from './src/pages/counter.js'

// Synchronous \u2014 calls view directly, mock state and server
const result = renderSync(spec, { state: { count: 5 } })
assert(result.has('button'))
assert.equal(result.get('#count').text, '5')

// Async \u2014 runs real spec.server fetchers (or pass server to mock them)
const result = await render(productSpec, {
  server: { product: { id: 1, name: 'Widget', price: 9.99 } }
})
assert.equal(result.get('h1').text, 'Widget')
assert.equal(result.count('li'), 3)`,"js"))}

      ${e("render-sync","renderSync(spec, options?)")}
      <p>Synchronous. Calls the view function directly \u2014 no server fetcher resolution. The fastest path for unit testing pure view functions.</p>
      ${s(["Option","Type","Default","Description"],[["<code>state</code>","<code>object</code>","<code>{}</code>","State overrides merged with <code>spec.state</code>."],["<code>server</code>","<code>object</code>","<code>{}</code>","Server state passed directly to the view. Fetchers are never called."]])}
      ${t(o(`import { renderSync } from '@invisibleloop/pulse/testing'

const result = renderSync(formSpec, {
  state:  { name: 'Alice', email: 'alice@example.com' },
  server: { plans: [{ id: 'pro', label: 'Pro' }] },
})`,"js"))}

      ${e("render-async","render(spec, options?)")}
      <p>Async. Two modes \u2014 mock or integration:</p>
      <ul>
        <li><strong>Mock mode</strong> \u2014 pass <code>server</code> to use that data directly. Fetchers are not called. Fast and deterministic.</li>
        <li><strong>Integration mode</strong> \u2014 omit <code>server</code> and real <code>spec.server</code> fetchers run. Pass <code>ctx</code> to set params, cookies, headers, etc.</li>
      </ul>
      ${s(["Option","Type","Default","Description"],[["<code>state</code>","<code>object</code>","<code>{}</code>","State overrides merged with <code>spec.state</code>."],["<code>server</code>","<code>object</code>","<code>undefined</code>","Server state passed directly to the view. When set, fetchers are skipped entirely."],["<code>ctx</code>","<code>object</code>","<code>{}</code>","Request context passed to <code>spec.server</code> fetchers (integration mode only). Accepts <code>params</code>, <code>query</code>, <code>cookies</code>, <code>headers</code>, etc."]])}
      ${t(o(`import { render } from '@invisibleloop/pulse/testing'

// Mock \u2014 skip fetchers
const result = await render(productSpec, {
  server: { product: { id: 42, name: 'Gadget' } }
})

// Integration \u2014 real fetchers, with ctx
const result = await render(productSpec, {
  ctx: { params: { id: '42' }, cookies: { session: 'abc' } }
})`,"js"))}

      ${e("render-result","RenderResult")}
      <p>Both functions return the same <code>RenderResult</code> object.</p>
      ${s(["Property / method","Returns","Description"],[["<code>.html</code>","<code>string</code>","Raw HTML string from the view."],["<code>.state</code>","<code>object</code>","Client state used for rendering."],["<code>.server</code>","<code>object</code>","Server state used for rendering."],["<code>.text()</code>","<code>string</code>","All text content \u2014 tags stripped, entities decoded, whitespace collapsed."],["<code>.has(selector)</code>","<code>boolean</code>","True if any element matches selector."],["<code>.find(selector)</code>","<code>Element | null</code>","First matching element, or null."],["<code>.get(selector)</code>","<code>Element</code>","First matching element. Throws with a clear message if not found."],["<code>.findAll(selector)</code>","<code>Element[]</code>","All matching elements."],["<code>.count(selector)</code>","<code>number</code>","Number of matching elements."],["<code>.attr(selector, name)</code>","<code>string | null</code>","Attribute value of the first matching element. Null if element or attribute absent."]])}

      ${e("element","Element")}
      <p>Elements returned by <code>find()</code>, <code>get()</code>, and <code>findAll()</code> support the same query methods scoped to their own subtree.</p>
      ${s(["Property / method","Returns","Description"],[["<code>.tag</code>","<code>string</code>","Tag name (lowercase)."],["<code>.text</code>","<code>string</code>","All text content within the element, whitespace-collapsed."],["<code>.attrs</code>","<code>object</code>","Parsed attribute map. Boolean attrs (e.g. <code>disabled</code>) have value <code>true</code>."],["<code>.attr(name)</code>","<code>string | null</code>",'Get one attribute. Returns <code>""</code> for boolean attrs, <code>null</code> if absent \u2014 mirrors <code>getAttribute()</code>.'],["<code>.find(selector)</code>","<code>Element | null</code>","First matching descendant."],["<code>.findAll(selector)</code>","<code>Element[]</code>","All matching descendants."],["<code>.has(selector)</code>","<code>boolean</code>","True if any descendant matches selector."]])}

      ${e("selectors","Supported selectors")}
      <p>The selector engine supports the most common patterns. Descendant combinators (<code>div p</code>) are not supported \u2014 use <code>element.findAll()</code> to search within a matched element instead.</p>
      ${s(["Selector","Example","Matches"],[["Tag","<code>button</code>","Any <code>&lt;button&gt;</code>"],["Class","<code>.ui-btn</code>","Elements with that class"],["ID","<code>#submit</code>","Element with that id"],["Attribute present","<code>[disabled]</code>","Elements with a <code>disabled</code> attribute"],["Attribute value",'<code>[type="submit"]</code>',"Elements where <code>type</code> equals <code>submit</code>"],["Compound","<code>button.primary[disabled]</code>","All conditions on the same element"]])}
      ${t(o(`result.has('button')                         // any <button>
result.has('.ui-btn--primary')               // BEM modifier class
result.has('[data-action="submit"]')         // data attribute
result.has('input[type="email"][required]')  // compound
result.get('form').findAll('input')          // inputs inside form`,"js"))}

      ${e("patterns","Common patterns")}
      ${t(o(`// Assert an element exists and check its text
assert.equal(result.get('h1').text, 'Page Title')

// Assert an element does NOT exist
assert(!result.has('.error-message'))

// Check an attribute value
assert.equal(result.attr('input[name="email"]', 'type'), 'email')

// Boolean attributes \u2014 attr() returns '' (not 'disabled')
assert.equal(result.attr('[disabled]', 'disabled'), '')
assert(result.get('[disabled]').attr('disabled') === '')

// Count elements
assert.equal(result.count('li'), 3)

// Inspect all items
const items = result.findAll('li')
assert.equal(items[0].text, 'Alpha')
assert.equal(items[1].text, 'Beta')

// Scope a search to a subtree
const form = result.get('form')
assert(form.has('button[type="submit"]'))
assert.equal(form.count('input'), 2)

// Text content decodes entities
// <p>&lt;b&gt;bold&lt;/b&gt;</p> \u2192 text === '<b>bold</b>'
assert.equal(result.get('p').text, '<b>bold</b>')`,"js"))}

      ${e("test-file","Example test file")}
      ${t(o(`/**
 * src/pages/counter.test.js
 * run: node src/pages/counter.test.js
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSync } from '@invisibleloop/pulse/testing'
import spec from './counter.js'

test('renders the current count', () => {
  const result = renderSync(spec, { state: { count: 7 } })
  assert.equal(result.get('#count').text, '7')
})

test('increment mutation returns count + 1', () => {
  const next = spec.mutations.increment({ count: 0 })
  assert.equal(next.count, 1)
})

test('decrement mutation returns count - 1', () => {
  const next = spec.mutations.decrement({ count: 5 })
  assert.equal(next.count, 4)
})

test('view renders increment and decrement buttons', () => {
  const result = renderSync(spec)
  assert(result.has('[data-event="increment"]'))
  assert(result.has('[data-event="decrement"]'))
})`,"js"))}
      ${u("note","Use <code>renderSync</code> for mutations and pure view tests \u2014 it's synchronous and needs no <code>await</code>. Use <code>render</code> when your spec has <code>server</code> fetchers you want to exercise for integration coverage.")}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",c(n,r,window.__PULSE_SERVER__||{},{ssr:!0}),m(r,c));var S=n;export{S as default};
