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

// ---------------------------------------------------------------------------
// Live store push — SSE channel from the server (createServer { live: true })
// ---------------------------------------------------------------------------

let _liveSource = null

/**
 * Connect to the server's live store-push channel (SSE). Singleton per tab —
 * survives client-side navigations; repeat calls are no-ops. Patches arrive as
 * `store` events and merge via updateStore(), so every page subscribed through
 * spec.store re-renders immediately. EventSource reconnects automatically.
 *
 * Called by mount() only when the page subscribes to store keys and the server
 * set window.__PULSE_LIVE__ — pages without store keys never open a connection.
 *
 * @param {string} url - the SSE endpoint path (e.g. '/__pulse/live')
 */
export function initLiveStore(url) {
  if (_liveSource || typeof EventSource === 'undefined' || !url) return
  _liveSource = new EventSource(url)
  _liveSource.addEventListener('store', (e) => {
    try {
      const patch = JSON.parse(e.data)
      if (patch && typeof patch === 'object') updateStore(patch)
    } catch { /* malformed frame — ignore, never break the page */ }
  })
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
