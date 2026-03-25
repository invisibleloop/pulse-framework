/**
 * Pulse — Examples test suite
 *
 * View tests (renderSync) for all six example specs.
 * Unit tests for extracted pure logic functions.
 *
 * Run: node examples/examples.test.js
 */

import { test } from 'node:test'
import assert    from 'node:assert/strict'
import { renderSync, render } from '../src/testing/index.js'

import counter  from './counter.js'
import todos    from './todos.js'
import contact  from './contact.js'
import quiz, { QUESTIONS, scoreLabel } from './quiz.js'
import products, { applyFilters, CATEGORIES } from './products.js'
import pricing, { FAQ } from './pricing.js'

import { filterTodos, countByStatus } from './todos.js'

// ─── Counter ─────────────────────────────────────────────────────────────────

test('counter: renders initial value 0', () => {
  const r = renderSync(counter, { state: { count: 0, step: 1 } })
  const countSpan = r.find('.u-text-accent')
  assert(countSpan, 'count span should exist')
  assert.equal(countSpan.text, '0')
})

test('counter: shows progress bar', () => {
  const r = renderSync(counter, { state: { count: 10, step: 1 } })
  const fill = r.find('.ui-progress-fill')
  assert(fill, 'track fill should exist')
  assert(fill.attr('style')?.includes('50%'), 'fill width should be 50% at count 10')
})

test('counter: decrement disabled at min', () => {
  const r = renderSync(counter, { state: { count: 0, step: 1 } })
  const dec = r.find('[aria-label="Decrement"]')
  assert(dec, 'decrement button should exist')
  assert.equal(dec.attr('disabled'), '', 'decrement should be disabled at 0')
})

test('counter: increment disabled at max', () => {
  const r = renderSync(counter, { state: { count: 20, step: 1 } })
  const inc = r.find('[aria-label="Increment"]')
  assert(inc, 'increment button should exist')
  assert.equal(inc.attr('disabled'), '', 'increment should be disabled at 20')
})

test('counter: active step is checked in segmented control', () => {
  const r = renderSync(counter, { state: { count: 5, step: 2 } })
  const checked = r.find('input[value="2"]')
  assert(checked, 'step 2 input should exist')
  assert.equal(checked.attr('checked'), '', 'step 2 should be checked when step is 2')
})

test('counter: has main landmark', () => {
  const r = renderSync(counter, { state: { count: 0, step: 1 } })
  assert(r.has('#main-content'), 'main landmark must exist')
})

// ─── Todos — unit tests ───────────────────────────────────────────────────────

test('filterTodos: all returns all', () => {
  const todos = [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: true }]
  assert.equal(filterTodos(todos, 'all').length, 2)
})

test('filterTodos: active returns only undone', () => {
  const todos = [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: true }]
  const result = filterTodos(todos, 'active')
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 1)
})

test('filterTodos: done returns only completed', () => {
  const todos = [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: true }]
  const result = filterTodos(todos, 'done')
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 2)
})

test('countByStatus: counts correctly', () => {
  const todos = [
    { id: 1, text: 'a', done: false },
    { id: 2, text: 'b', done: true  },
    { id: 3, text: 'c', done: false },
  ]
  const { active, done, total } = countByStatus(todos)
  assert.equal(active, 2)
  assert.equal(done,   1)
  assert.equal(total,  3)
})

test('countByStatus: empty array', () => {
  const { active, done, total } = countByStatus([])
  assert.equal(active, 0)
  assert.equal(done,   0)
  assert.equal(total,  0)
})

// ─── Todos — view tests ───────────────────────────────────────────────────────

test('todos: empty state shows empty component', () => {
  const r = renderSync(todos, { state: { todos: [], filter: 'all', nextId: 1 } })
  assert(r.has('.ui-empty'), 'empty state component should render')
})

test('todos: renders todo items', () => {
  const state = {
    todos:  [{ id: 1, text: 'Buy milk', done: false }, { id: 2, text: 'Walk dog', done: true }],
    filter: 'all',
    nextId: 3,
  }
  const r = renderSync(todos, { state })
  assert.equal(r.count('[data-id]'), 2)
})

test('todos: done item has muted text span', () => {
  const state = {
    todos:  [{ id: 1, text: 'Done task', done: true }],
    filter: 'all',
    nextId: 2,
  }
  const r = renderSync(todos, { state })
  assert(r.has('.u-text-muted'), 'done item text should be muted')
  const cb = r.find('input[type="checkbox"]')
  assert.equal(cb?.attr('checked'), '', 'done item checkbox should be checked')
})

test('todos: active filter hides done items', () => {
  const state = {
    todos:  [{ id: 1, text: 'Active', done: false }, { id: 2, text: 'Done', done: true }],
    filter: 'active',
    nextId: 3,
  }
  const r = renderSync(todos, { state })
  assert.equal(r.count('[data-id]'), 1)
})

test('todos: at limit shows limit message', () => {
  const state = {
    todos:  Array.from({ length: 20 }, (_, i) => ({ id: i + 1, text: `Task ${i + 1}`, done: false })),
    filter: 'all',
    nextId: 21,
  }
  const r = renderSync(todos, { state })
  assert(r.has('[role="alert"]'), 'limit alert should appear at 20 todos')
})

test('todos: has main landmark', () => {
  const r = renderSync(todos, { state: { todos: [], filter: 'all', nextId: 1 } })
  assert(r.has('#main-content'))
})

// ─── Contact — view tests ─────────────────────────────────────────────────────

test('contact: renders form in idle state', async () => {
  const r = await render(contact, { server: { info: { email: 'hi@example.com', phone: '+44 20 0000 0000', address: '1 Street', hours: '9–5' } } })
  assert(r.has('form[data-action="submit"]'), 'form should be visible in idle state')
})

test('contact: success state shows success content, hides form', async () => {
  const r = await render(contact, {
    state:  { status: 'success', errors: [] },
    server: { info: { email: 'hi@example.com', phone: '+44 20 0000 0000', address: '1 Street', hours: '9–5' } },
  })
  assert(!r.has('form'), 'form should be hidden on success')
  const h2s = r.findAll('h2')
  assert(h2s.some(h => h.text === 'Message sent!'), 'success heading should appear')
})

test('contact: has main landmark', async () => {
  const r = await render(contact, {
    server: { info: { email: 'hi@example.com', phone: '+44 20 0000 0000', address: '1 Street', hours: '9–5' } },
  })
  assert(r.has('#main-content'))
})

// ─── Quiz — unit tests ────────────────────────────────────────────────────────

test('scoreLabel: perfect score', () => {
  const { label, variant } = scoreLabel(5, 5)
  assert.equal(label, 'Perfect score!')
  assert.equal(variant, 'success')
})

test('scoreLabel: 80% is excellent', () => {
  const { label, variant } = scoreLabel(4, 5)
  assert.equal(label, 'Excellent!')
  assert.equal(variant, 'success')
})

test('scoreLabel: 60% is good', () => {
  const { label, variant } = scoreLabel(3, 5)
  assert.equal(label, 'Good effort!')
  assert.equal(variant, 'info')
})

test('scoreLabel: 40% keeps practising', () => {
  const { label, variant } = scoreLabel(2, 5)
  assert.equal(label, 'Keep practising!')
  assert.equal(variant, 'warning')
})

test('scoreLabel: below 40%', () => {
  const { label, variant } = scoreLabel(1, 5)
  assert.equal(label, 'Better luck next time.')
  assert.equal(variant, 'error')
})

test('QUESTIONS has 5 items', () => {
  assert.equal(QUESTIONS.length, 5)
})

test('each question has a valid answer index', () => {
  for (const q of QUESTIONS) {
    assert(q.answer >= 0 && q.answer < q.options.length,
      `Question ${q.id} answer index ${q.answer} out of range`)
  }
})

// ─── Quiz — view tests ────────────────────────────────────────────────────────

test('quiz: intro phase renders start button', () => {
  const r = renderSync(quiz, { state: { phase: 'intro', current: 0, answers: [], score: 0 } })
  assert(r.has('[data-event="start"]'), 'start button should exist on intro')
  assert(r.has('#main-content'))
})

test('quiz: question phase renders options', () => {
  const r = renderSync(quiz, { state: { phase: 'question', current: 0, answers: [], score: 0 } })
  assert.equal(r.count('[data-option]'), 4, 'first question has 4 options')
})

test('quiz: question phase shows progress', () => {
  const r = renderSync(quiz, { state: { phase: 'question', current: 2, answers: [1, 0], score: 1 } })
  assert(r.has('[role="progressbar"]'), 'progress bar should exist')
  const progressText = r.find('.u-text-muted')
  assert(progressText?.text.includes('3 of 5'), 'progress should show question 3 of 5')
})

test('quiz: results phase shows score', () => {
  const r = renderSync(quiz, { state: { phase: 'results', current: 4, answers: [1, 2, 0, 3, 1], score: 5 } })
  const scoreSpan = r.find('.u-text-accent')
  assert(scoreSpan, 'score span should exist')
  assert.equal(scoreSpan.text, '5')
  assert.equal(r.count('.u-flex.u-items-start'), 5, 'one row per question')
})

test('quiz: results shows correct/wrong rows', () => {
  // answer correctly for q1 (answer=1), wrong for q2 (answer=2 but we choose 0)
  const r = renderSync(quiz, {
    state: { phase: 'results', current: 4, answers: [1, 0, 0, 3, 1], score: 4 },
  })
  assert(r.has('.u-text-green'), 'correct row icon should be green')
  assert(r.has('.u-text-red'), 'wrong row icon should be red')
})

test('quiz: results has restart button', () => {
  const r = renderSync(quiz, { state: { phase: 'results', current: 4, answers: [1, 2, 0, 3, 1], score: 3 } })
  assert(r.has('[data-event="restart"]'))
})

// ─── Products — unit tests ────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { id: 1, name: 'Arc Lamp',    category: 'Lighting',  price: 89,  rating: 4.8, reviews: 100, featured: true  },
  { id: 2, name: 'Walnut Tray', category: 'Storage',   price: 45,  rating: 4.5, reviews: 50,  featured: false },
  { id: 3, name: 'Desk Pad',    category: 'Lighting',  price: 32,  rating: 4.2, reviews: 200, featured: false },
]

test('applyFilters: no filters returns all', () => {
  assert.equal(applyFilters(MOCK_PRODUCTS, '', 'All', 'featured').length, 3)
})

test('applyFilters: category filter', () => {
  const r = applyFilters(MOCK_PRODUCTS, '', 'Lighting', 'featured')
  assert.equal(r.length, 2)
  assert(r.every(p => p.category === 'Lighting'))
})

test('applyFilters: search filter', () => {
  const r = applyFilters(MOCK_PRODUCTS, 'lamp', 'All', 'featured')
  assert.equal(r.length, 1)
  assert.equal(r[0].name, 'Arc Lamp')
})

test('applyFilters: search is case-insensitive', () => {
  const r = applyFilters(MOCK_PRODUCTS, 'WALNUT', 'All', 'featured')
  assert.equal(r.length, 1)
})

test('applyFilters: price-asc sort', () => {
  const r = applyFilters(MOCK_PRODUCTS, '', 'All', 'price-asc')
  assert.equal(r[0].price, 32)
  assert.equal(r[2].price, 89)
})

test('applyFilters: price-desc sort', () => {
  const r = applyFilters(MOCK_PRODUCTS, '', 'All', 'price-desc')
  assert.equal(r[0].price, 89)
})

test('applyFilters: rating sort', () => {
  const r = applyFilters(MOCK_PRODUCTS, '', 'All', 'rating')
  assert.equal(r[0].rating, 4.8)
})

test('applyFilters: no results when nothing matches', () => {
  const r = applyFilters(MOCK_PRODUCTS, 'zzznotfound', 'All', 'featured')
  assert.equal(r.length, 0)
})

test('CATEGORIES includes All and is sorted', () => {
  assert.equal(CATEGORIES[0], 'All')
})

// ─── Products — view tests ────────────────────────────────────────────────────

const PRODUCTS_SERVER = { products: MOCK_PRODUCTS }

test('products: renders product cards', () => {
  const r = renderSync(products, {
    state:  { search: '', category: 'All', sort: 'featured' },
    server: PRODUCTS_SERVER,
  })
  assert.equal(r.count('h2'), 3)
})

test('products: has main landmark', () => {
  const r = renderSync(products, {
    state:  { search: '', category: 'All', sort: 'featured' },
    server: PRODUCTS_SERVER,
  })
  assert(r.has('#main-content'))
})

// ─── Pricing — unit tests ─────────────────────────────────────────────────────

test('FAQ has entries', () => {
  assert(FAQ.length > 0, 'FAQ should have at least one item')
  for (const item of FAQ) {
    assert(item.question, 'each FAQ item needs a question')
    assert(item.answer,   'each FAQ item needs an answer')
  }
})

// ─── Pricing — view tests ─────────────────────────────────────────────────────

test('pricing: monthly view renders 3 plans', () => {
  const r = renderSync(pricing, { state: { billing: 'monthly' } })
  assert.equal(r.count('.ui-pricing'), 3)
})

test('pricing: annual view renders 3 plans', () => {
  const r = renderSync(pricing, { state: { billing: 'annual' } })
  assert.equal(r.count('.ui-pricing'), 3)
})

test('pricing: monthly Pro price is £12', () => {
  const r = renderSync(pricing, { state: { billing: 'monthly' } })
  const prices = r.findAll('.ui-pricing-amount')
  assert(prices.some(p => p.text === '£12'), 'monthly Pro should be £12')
})

test('pricing: annual Pro price is £9', () => {
  const r = renderSync(pricing, { state: { billing: 'annual' } })
  const prices = r.findAll('.ui-pricing-amount')
  assert(prices.some(p => p.text === '£9'), 'annual Pro should be £9')
})

test('pricing: annual note appears when billing is annual', () => {
  const r = renderSync(pricing, { state: { billing: 'annual' } })
  assert(r.has('.pr-annual-note'), 'annual note should appear')
})

test('pricing: annual note absent when billing is monthly', () => {
  const r = renderSync(pricing, { state: { billing: 'monthly' } })
  assert(!r.has('.pr-annual-note'), 'annual note should not appear on monthly')
})

test('pricing: FAQ accordion renders', () => {
  const r = renderSync(pricing, { state: { billing: 'monthly' } })
  assert(r.has('.ui-accordion'), 'accordion should render')
})

test('pricing: has main landmark', () => {
  const r = renderSync(pricing, { state: { billing: 'monthly' } })
  assert(r.has('#main-content'))
})
