/**
 * Pulse — Client Store Singleton
 *
 * A module-level singleton that holds global store state on the client.
 * Pages that declare spec.store subscribe to this and re-render when it changes.
 *
 * Initialised once from window.__PULSE_STORE__ (serialised by the server).
 * Subsequent calls to initClientStore are no-ops — the store persists across
 * client-side navigations so store actions on one page are visible on the next.
 *
 * Browser-only — never imported by the SSR path.
 */

let _state = {}
let _initialized = false
let _mutations = {}
let _mutationsRegistered = false
const _subs = new Set()

/**
 * Seed the store from SSR data.
 * No-op after the first call — navigations do not reset the store.
 *
 * @param {Object} initialState
 */
export function initClientStore(initialState) {
  if (_initialized) return
  _state = { ...(initialState || {}) }
  _initialized = true
}

/**
 * Return the current store state.
 * @returns {Object}
 */
export function getStoreState() {
  return _state
}

/**
 * Subscribe to store changes.
 * The callback receives the new store state on every update.
 * Returns an unsubscribe function — call it in destroy() to prevent leaks.
 *
 * @param {function} fn
 * @returns {function} unsubscribe
 */
export function subscribe(fn) {
  _subs.add(fn)
  return () => _subs.delete(fn)
}

/**
 * Merge a partial object into the store and notify all subscribers.
 * Called by the runtime when a page action returns { _storeUpdate: {...} }.
 *
 * @param {Object} partial
 */
export function updateStore(partial) {
  _state = { ..._state, ...partial }
  for (const fn of _subs) fn(_state)
}

/**
 * Register store mutations from the store definition.
 * No-op after the first call — navigations do not re-register mutations.
 *
 * @param {Object} mutations
 */
export function registerStoreMutations(mutations) {
  if (_mutationsRegistered) return
  _mutations = mutations || {}
  _mutationsRegistered = true
}

/**
 * Dispatch a store mutation by name.
 * The mutation receives the current store state and an optional payload,
 * and returns a partial store object merged via updateStore.
 * All subscribed pages re-render automatically.
 *
 * @param {string} name
 * @param {*} [payload]
 */
export function dispatchStoreMutation(name, payload) {
  const fn = _mutations[name]
  if (!fn) {
    console.warn(`[Pulse] No store mutation found for "${name}"`)
    return
  }
  updateStore(fn(_state, payload))
}
