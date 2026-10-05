/**
 * Pulse — morph / key-based reconciliation tests
 * run: node src/runtime/morph.test.js
 *
 * Sets up a minimal DOM shim so morphNodes runs its real code path
 * (not the innerHTML fallback). Tests verify node identity is preserved
 * across updates — the key property of key-based reconciliation.
 */

// ---------------------------------------------------------------------------
// Minimal DOM shim
// ---------------------------------------------------------------------------

class FakeText {
  constructor(value) {
    this.nodeType  = 3
    this.nodeName  = '#text'
    this.nodeValue = value
    this.parentNode = null
    this.nextSibling = null
  }
  cloneNode() { return new FakeText(this.nodeValue) }
}

class FakeElement {
  constructor(tag) {
    this.nodeType  = 1
    this.nodeName  = tag.toUpperCase()
    this._attrs    = {}
    this._children = []
    this.parentNode  = null
    this.nextSibling = null
  }

  // ---- child access ----
  get childNodes() { return this._children }
  get lastChild()  { return this._children[this._children.length - 1] ?? null }

  // ---- attributes ----
  get attributes()        { return Object.entries(this._attrs).map(([name, value]) => ({ name, value })) }
  getAttribute(n)         { return this._attrs[n] ?? null }
  setAttribute(n, v)      { this._attrs[n] = v }
  removeAttribute(n)      { delete this._attrs[n] }
  hasAttribute(n)         { return n in this._attrs }

  // ---- mutation ----
  appendChild(node) {
    if (node.parentNode) node.parentNode._detach(node)
    const prev = this._children[this._children.length - 1]
    if (prev) prev.nextSibling = node
    node.nextSibling = null
    node.parentNode  = this
    this._children.push(node)
    return node
  }

  removeChild(node) {
    const i = this._children.indexOf(node)
    if (i === -1) throw new Error('removeChild: node not a child')
    this._children.splice(i, 1)
    if (i > 0) this._children[i - 1].nextSibling = this._children[i] ?? null
    node.parentNode  = null
    node.nextSibling = null
    return node
  }

  replaceChild(newNode, oldNode) {
    const i = this._children.indexOf(oldNode)
    if (i === -1) throw new Error('replaceChild: oldNode not a child')
    if (newNode.parentNode) newNode.parentNode._detach(newNode)
    this._children[i]  = newNode
    newNode.parentNode = this
    newNode.nextSibling = this._children[i + 1] ?? null
    if (i > 0) this._children[i - 1].nextSibling = newNode
    oldNode.parentNode  = null
    oldNode.nextSibling = null
    return oldNode
  }

  insertBefore(node, ref) {
    if (node.parentNode) node.parentNode._detach(node)
    if (ref === null) return this.appendChild(node)
    const i = this._children.indexOf(ref)
    if (i === -1) throw new Error('insertBefore: ref not a child')
    this._children.splice(i, 0, node)
    node.parentNode  = this
    node.nextSibling = ref
    if (i > 0) this._children[i - 1].nextSibling = node
    return node
  }

  // Internal: remove without clearing siblings (used by move operations)
  _detach(node) {
    const i = this._children.indexOf(node)
    if (i === -1) return
    this._children.splice(i, 1)
    if (i > 0) this._children[i - 1].nextSibling = this._children[i] ?? null
    node.parentNode = null
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.nodeName.toLowerCase())
    clone._attrs = { ...this._attrs }
    if (deep) {
      for (const child of this._children) {
        clone.appendChild(child.cloneNode(true))
      }
    }
    return clone
  }

  // ---- innerHTML (for test setup only) ----
  set innerHTML(html) {
    this._children = []
    for (const node of parseHtml(html)) this.appendChild(node)
  }

  get innerHTML() {
    return this._children.map(n => {
      if (n.nodeType === 3) return n.nodeValue
      const attrs = Object.entries(n._attrs).map(([k, v]) => ` ${k}="${v}"`).join('')
      return `<${n.nodeName.toLowerCase()}${attrs}>${n.innerHTML}</${n.nodeName.toLowerCase()}>`
    }).join('')
  }

  addEventListener() {}
  querySelectorAll() { return [] }
}

// Minimal HTML parser — handles flat list of elements with attributes + text content
// Sufficient for testing morph with <li data-key="x">text</li> structures
function parseHtml(html) {
  const nodes  = []
  const re     = /<(\w+)((?:\s+[\w-]+=(?:"[^"]*"|'[^']*'|[^\s>]*))*)\s*>([\s\S]*?)<\/\1>|([^<]+)/g
  let m
  while ((m = re.exec(html)) !== null) {
    if (m[4] !== undefined) {
      const text = m[4]
      if (text.trim()) nodes.push(new FakeText(text))
    } else {
      const el = new FakeElement(m[1])
      const attrRe = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g
      let am
      while ((am = attrRe.exec(m[2])) !== null) {
        el.setAttribute(am[1], am[2] ?? am[3] ?? am[4])
      }
      for (const child of parseHtml(m[3])) el.appendChild(child)
      nodes.push(el)
    }
  }
  return nodes
}

// Inject document shim so morph() uses real DOM path
global.document = {
  createElement: (tag) => new FakeElement(tag),
}

// ---------------------------------------------------------------------------
// Import runtime (after shim is in place)
// ---------------------------------------------------------------------------

import { mount } from './index.js'

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
    console.log(e.stack.split('\n')[1])
    failed++
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

// ---------------------------------------------------------------------------
// Helper — mount a spec and return the root element + instance
// ---------------------------------------------------------------------------

function makeListSpec(items) {
  return {
    route:   '/list',
    state:   { items },
    view:    (s) => `<ul>${s.items.map(it => `<li data-key="${it.id}">${it.label}</li>`).join('')}</ul>`,
    mutations: {
      setItems: (_, items) => ({ items }),
    },
  }
}

console.log('\nKey-based morphing\n')

// ---------------------------------------------------------------------------

test('initial render produces correct keyed list', () => {
  const el = new FakeElement('div')
  const items = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]
  mount(makeListSpec(items), el)

  const ul = el.childNodes[0]
  assert(ul.nodeName === 'UL', 'expected UL')
  assert(ul.childNodes.length === 2, `expected 2 children, got ${ul.childNodes.length}`)
  assert(ul.childNodes[0].getAttribute('data-key') === 'a', 'first key should be a')
  assert(ul.childNodes[1].getAttribute('data-key') === 'b', 'second key should be b')
})

test('removing an item removes only that node', () => {
  const el = new FakeElement('div')
  const items = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const instance = mount(makeListSpec(items), el)

  const ul    = el.childNodes[0]
  const nodeA = ul.childNodes[0]
  const nodeC = ul.childNodes[2]

  instance.dispatch('setItems', [{ id: 'a', label: 'A' }, { id: 'c', label: 'C' }])

  assert(ul.childNodes.length === 2, `expected 2 children after remove, got ${ul.childNodes.length}`)
  assert(ul.childNodes[0] === nodeA, 'node A should be the same object (not recreated)')
  assert(ul.childNodes[1] === nodeC, 'node C should be the same object (not recreated)')
})

test('reordering moves nodes without recreating them', () => {
  const el = new FakeElement('div')
  const items = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const instance = mount(makeListSpec(items), el)

  const ul    = el.childNodes[0]
  const nodeA = ul.childNodes[0]
  const nodeB = ul.childNodes[1]
  const nodeC = ul.childNodes[2]

  instance.dispatch('setItems', [{ id: 'c', label: 'C' }, { id: 'a', label: 'A' }, { id: 'b', label: 'B' }])

  assert(ul.childNodes.length === 3, 'length unchanged after reorder')
  assert(ul.childNodes[0] === nodeC, 'C should now be first (same node)')
  assert(ul.childNodes[1] === nodeA, 'A should now be second (same node)')
  assert(ul.childNodes[2] === nodeB, 'B should now be third (same node)')
})

test('inserting an item at the start preserves existing nodes', () => {
  const el = new FakeElement('div')
  const items = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
  const instance = mount(makeListSpec(items), el)

  const ul    = el.childNodes[0]
  const nodeA = ul.childNodes[0]
  const nodeB = ul.childNodes[1]

  instance.dispatch('setItems', [{ id: 'x', label: 'X' }, { id: 'a', label: 'A' }, { id: 'b', label: 'B' }])

  assert(ul.childNodes.length === 3, `expected 3 children, got ${ul.childNodes.length}`)
  assert(ul.childNodes[0].getAttribute('data-key') === 'x', 'new node X at index 0')
  assert(ul.childNodes[1] === nodeA, 'A same node at index 1')
  assert(ul.childNodes[2] === nodeB, 'B same node at index 2')
})

test('text content is updated when label changes on an existing node', () => {
  const el = new FakeElement('div')
  const items = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]
  const instance = mount(makeListSpec(items), el)

  const ul    = el.childNodes[0]
  const nodeA = ul.childNodes[0]

  instance.dispatch('setItems', [{ id: 'a', label: 'UPDATED' }, { id: 'b', label: 'Beta' }])

  assert(ul.childNodes[0] === nodeA, 'node A is same object (reused)')
  assert(nodeA.innerHTML === 'UPDATED', `expected text UPDATED, got: ${nodeA.innerHTML}`)
})

test('clearing to empty list removes all nodes', () => {
  const el = new FakeElement('div')
  const instance = mount(makeListSpec([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]), el)

  const ul = el.childNodes[0]
  instance.dispatch('setItems', [])

  assert(ul.childNodes.length === 0, `expected empty list, got ${ul.childNodes.length} nodes`)
})

test('unkeyed content falls back to position-based morphing', () => {
  const el = new FakeElement('div')
  const spec = {
    route: '/unkeyed',
    state: { label: 'hello' },
    view:  (s) => `<p>${s.label}</p>`,
    mutations: { setLabel: (_, v) => ({ label: v }) },
  }
  const instance = mount(spec, el)
  instance.dispatch('setLabel', 'world')

  assert(el.childNodes[0].innerHTML === 'world', `expected 'world', got: ${el.childNodes[0].innerHTML}`)
})

// ---------------------------------------------------------------------------

console.log()
if (failed > 0) {
  console.log(`${passed} passed, ${failed} failed`)
  process.exit(1)
} else {
  console.log(`${passed} passed, 0 failed`)
}
