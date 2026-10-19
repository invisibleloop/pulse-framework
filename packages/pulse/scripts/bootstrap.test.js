/**
 * Production boot bundle entry (scripts/bootstrap.js)
 * run: node scripts/bootstrap.test.js
 *
 * Runs the generated source with stubbed imports, so it checks what the browser would do:
 * the first page's mount() instance reaches initNavigation (#168), the store variant passes
 * the store through, and a root that is already mounted is left alone.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBootstrapSource } from './bootstrap.js'

function run(opts, { mounted = false, hasRoot = true } = {}) {
  const src  = buildBootstrapSource({ relSpec: './page.js', relRuntime: './rt.js', relNavigate: './nav.js', ...opts })
  const body = src.split('\n').filter(l => !/^\s*import /.test(l)).join('\n').replace('export default spec', '')
  const events   = []
  const instance = { destroy() {} }
  const root     = { dataset: mounted ? { pulseMounted: '1' } : {} }
  const mount          = (...args) => { events.push(['mount', args]); return instance }
  const initNavigation = (...args) => { events.push(['initNavigation', args]); return { setMount: m => events.push(['setMount', m]) } }
  const document = { getElementById: () => (hasRoot ? root : null) }
  const store = { the: 'store' }
  new Function('spec', 'mount', 'initNavigation', 'store', 'document', 'window', body)({ the: 'spec' }, mount, initNavigation, store, document, { __PULSE_SERVER__: { s: 1 } })
  return { events, instance, root, store }
}

test('registers the first mount() instance with initNavigation', () => {
  const { events, instance } = run({})
  const names = events.map(e => e[0])
  assert.deepEqual(names, ['mount', 'initNavigation', 'setMount'])
  assert.equal(events[2][1], instance, 'setMount must receive the instance mount() returned')
  assert.deepEqual(events[0][1][3], { ssr: true }, 'mounts with { ssr: true }')
})

test('the store variant passes the store to mount() and still registers the instance', () => {
  const { events, instance, store } = run({ storeImport: "\nimport store from './pulse.store.js'", mountOpts: '{ ssr: true, store }' })
  assert.equal(events[0][1][3].store, store)
  assert.equal(events.find(e => e[0] === 'setMount')[1], instance)
})

test('a root that is already mounted, or missing, is left alone', () => {
  assert.deepEqual(run({}, { mounted: true }).events, [])
  assert.deepEqual(run({}, { hasRoot: false }).events, [])
})

test('marks the root as mounted before mounting', () => {
  assert.equal(run({}).root.dataset.pulseMounted, '1')
})
