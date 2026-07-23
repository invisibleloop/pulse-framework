/**
 * Pulse 2 — Client Runtime
 *
 * Takes a spec, mounts it to a DOM element.
 * Handles events, applies mutations, enforces constraints, re-renders.
 *
 * No framework. No virtual DOM. No dependencies.
 */

import { trustedHTML, trustedScriptURL } from './tt.js'

// Toast is lazy-loaded on first use — pages that never use _toast pay zero bytes
const showToast = (opts) => import('./toast.js').then(m => m.showToast(opts))

// store.js is lazy-loaded only by pages that declare spec.store — pages that
// never subscribe to the global store pay zero bytes for it (same pattern as
// showToast above). updateStore is needed synchronously inside runAction()
// for _storeUpdate (any page can push to the store from an action, even one
// that doesn't itself subscribe), so it is loaded the same lazy way on first
// use and cached in _storeModule for subsequent calls.
let _storeModule = null
const loadStore = () => _storeModule
  ? Promise.resolve(_storeModule)
  : import('./store.js').then(m => { _storeModule = m; return m })

// data-store-event is wired via event delegation at bindEvents() time, before
// spec.store is known to be involved (a page can carry a data-store-event
// button without declaring spec.store itself) — load store.js on first fire.
const dispatchStoreMutationLazy = (name, payload) =>
  loadStore().then(({ dispatchStoreMutation }) => dispatchStoreMutation(name, payload))

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

/**
 * Mount a spec to a DOM element.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {HTMLElement} el
 * @param {Object} [serverState] - Serialised server state from SSR
 */
export function mount(spec, el, serverState = {}, options = {}) {
  if (!spec || !spec.view) {
    throw new Error('[Pulse] mount: spec must have a view')
  }
  // Spec is validated server-side at startup — no need to re-validate in the browser
  // Separate page-level server state from store keys so they can be tracked
  // independently — store values come from the live singleton, not the snapshot.
  const _storeKeys = new Set(spec.store || [])

  // store.js (initClientStore, registerStoreMutations, subscribe, initLiveStore,
  // getStoreState, updateStore, dispatchStoreMutation) is lazy-loaded — only pages
  // that actually touch the store pay for it. Two independent triggers load it:
  //   1. spec.store is non-empty (this page reads store data / needs live reactivity)
  //   2. a data-store-event fires, or an action returns _storeUpdate (this page
  //      pushes to the store without necessarily subscribing to it)
  // Both paths funnel through loadStore(), which caches the resolved module so a
  // second trigger on the same page is a no-op re-await, not a second fetch.
  //
  // initClientStore is safe to defer: it is only ever read via getStoreState(),
  // which is only called from getEffectiveServerState() below, itself gated on
  // _storeKeys.size — so a page with no spec.store never needs the store singleton
  // initialised at all. window.__PULSE_STORE__ is also re-serialised fresh by the
  // server on every navigation (see ssr.js buildStoreScript / navigate.js's
  // window.__updatePulseStore__), so there is no cross-navigation dependency on an
  // eager initClientStore call from a page that didn't declare spec.store.
  // Populated once store.js resolves and this page subscribes — destroy() reads
  // it at call time, so a destroy() that races the import still unsubscribes
  // correctly (it just runs the .then() below first, since both are microtasks
  // queued off the same import; destroy() itself is only ever called later, from
  // user code or client navigation, well after mount() has returned).
  let _unsubStore = null
  let _destroyed  = false

  // NOTE: subscribe() below is intentionally not gated on `typeof window` — this
  // matches the pre-lazy behaviour, where store subscription worked in any
  // environment (including Node test environments with no `window` global) as
  // long as spec.store was non-empty. Only the window-derived inputs
  // (window.__PULSE_STORE__, window.__PULSE_LIVE__) are individually guarded.
  if (_storeKeys.size > 0) {
    loadStore().then(({ initClientStore, registerStoreMutations, initLiveStore, subscribe }) => {
      if (_destroyed) return
      if (typeof window !== 'undefined') {
        // window.__PULSE_STORE__ is serialised by the server when a store is registered.
        initClientStore(window.__PULSE_STORE__ || {})
        // Register store mutations so data-store-event bindings can dispatch them.
        // No-op on subsequent mounts — mutations persist across client navigations.
        if (options.store?.mutations) {
          registerStoreMutations(options.store.mutations)
        }
        // Live store push — connect to the server's SSE channel, but only when this
        // page actually subscribes to store keys. Singleton: survives navigations,
        // repeat mounts are no-ops. Pages without store keys never open a connection.
        if (window.__PULSE_LIVE__) {
          initLiveStore(window.__PULSE_LIVE__)
        }
      }
      // Subscribe to global store — re-render whenever store keys this page uses
      // change. Wired here (after the async import resolves) rather than
      // synchronously in mount() — see the module-level comment on loadStore.
      _unsubStore = subscribe(() => render())
    })
  }
  const _pageServerState = {}
  for (const [k, v] of Object.entries(serverState)) {
    if (!_storeKeys.has(k)) _pageServerState[k] = v
  }

  // Snapshot of the store keys as SSR handed them to mount() — used as a
  // fallback for renders that happen before store.js's lazy import resolves
  // (initial render, and any dispatch that fires in that window). This keeps
  // first paint identical to the pre-lazy behaviour: the SSR-seeded values are
  // available immediately. Once store.js loads, getEffectiveServerState()
  // switches over to the live singleton (getStoreState()), which is required
  // for correctness after any store mutation.
  const _storeSnapshot = {}
  for (const k of _storeKeys) {
    if (serverState[k] !== undefined) _storeSnapshot[k] = serverState[k]
  }

  // Build the server state the view sees: fresh store slice + page-level data.
  // Page-level keys always win over store keys with the same name.
  function getEffectiveServerState() {
    if (!_storeKeys.size) return _pageServerState
    const storeState = _storeModule ? _storeModule.getStoreState() : _storeSnapshot
    const slice = {}
    for (const key of _storeKeys) {
      if (storeState[key] !== undefined) slice[key] = storeState[key]
    }
    return { ...slice, ..._pageServerState }
  }

  // Deep clone initial state — never mutate the spec itself
  let state = deepClone(spec.state ?? {})

  // Restore persisted keys from localStorage
  const persistKey = spec.persist?.length ? `pulse:${spec.route || location.pathname}` : null
  let restoredFromPersist = false
  if (persistKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(persistKey) || '{}')
      spec.persist.forEach(k => {
        if (saved[k] !== undefined && saved[k] !== (spec.state ?? {})[k]) {
          state[k] = saved[k]
          restoredFromPersist = true
        }
      })
    } catch { /* ignore parse errors */ }
  }

  // ---------------------------------------------------------------------------
  // Persist
  // ---------------------------------------------------------------------------

  function persist() {
    if (!persistKey) return
    try {
      const snapshot = {}
      spec.persist.forEach(k => { snapshot[k] = state[k] })
      localStorage.setItem(persistKey, JSON.stringify(snapshot))
    } catch { /* ignore quota errors */ }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  let lastHtml = null

  function render() {
    let html
    try {
      html = resolveView(spec, state, getEffectiveServerState())
    } catch (err) {
      console.error('[Pulse] view error:', err)
      const serverState = getEffectiveServerState()
      html = spec.onViewError
        ? spec.onViewError(err, state, serverState)
        : viewErrorFallback(err)
    }
    if (html === lastHtml) return  // nothing changed
    lastHtml = html
    morph(el, html)
  }

  // ---------------------------------------------------------------------------
  // Result application — shared by every mutation/action lifecycle step.
  // Handles the side-channel keys (_toast, _storeUpdate), merges the rest of
  // `raw` into state via constraints, and re-renders only if state actually
  // changed. Used by dispatch() and every stage of runAction().
  // ---------------------------------------------------------------------------

  function applyResult(raw) {
    const { _toast, _storeUpdate, ...partial } = raw ?? {}
    // store.js may not be loaded yet on a page that doesn't itself declare
    // spec.store but still pushes via _storeUpdate — load it on demand.
    if (_storeUpdate) loadStore().then(({ updateStore }) => updateStore(_storeUpdate))
    if (_toast)       showToast(_toast)
    const prev = state
    state = applyConstraints({ ...state, ...partial }, spec.constraints)
    if (shallowChanged(prev, state)) render()
  }

  // ---------------------------------------------------------------------------
  // Dispatch — the single entry point for all state changes
  // ---------------------------------------------------------------------------

  function dispatch(type, payload) {
    // Mutation
    if (spec.mutations?.[type]) {
      const raw = spec.mutations[type](state, payload)
      applyResult(raw)
      persist()
      return
    }

    // Action
    if (spec.actions?.[type]) {
      runAction(type, spec.actions[type], state, payload)
      return
    }

    console.warn(`[Pulse] no mutation/action "${type}"`)
  }

  // ---------------------------------------------------------------------------
  // Actions — async, cross the server/client boundary
  // ---------------------------------------------------------------------------

  async function runAction(name, action, currentState, payload) {
    // Optimistic update before async work
    if (action.onStart) {
      applyResult(action.onStart(currentState, payload))
    }

    // Validate before running if requested
    if (action.validate) {
      const errors = validateFields(state, spec.validation)
      if (errors.length > 0) {
        console.warn(`[Pulse] Validation failed: "${name}"`, errors)
        applyResult(action.onError?.(state, { validation: errors }))
        return
      }
    }

    try {
      // Pass fresh effective server state (includes live store values)
      const result = await action.run(state, getEffectiveServerState(), payload)
      applyResult(action.onSuccess(state, result))
    } catch (error) {
      console.error(`[Pulse] action "${name}" failed:`, error)
      applyResult(action.onError(state, error))
    }

    persist()
  }

  // ---------------------------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------------------------

  // Event delegation — one set of listeners on the root, survives morphing.
  // AbortController lets destroy() remove all listeners at once.
  const _eventAbort = new AbortController()
  bindEvents(el, dispatch, _eventAbort.signal)

  // If the element was server-rendered, skip the initial render to avoid
  // touching existing DOM — this preserves the early LCP paint from SSR.
  // Morph on first mutation will diff from whatever SSR left in the DOM.
  if (!(options.ssr && !restoredFromPersist)) {
    render()
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    /** Read current state — useful for debugging and testing */
    getState: () => deepClone(state),

    /** Programmatically dispatch a mutation or action */
    dispatch,

    /** Force a re-render — useful after external state changes */
    refresh: render,

    /** Tear down — remove event listeners, unsubscribe from store, clear element */
    destroy: () => { _destroyed = true; _unsubStore?.(); _eventAbort.abort(); el.innerHTML = trustedHTML('') }
  }
}

// ---------------------------------------------------------------------------
// View resolution
// ---------------------------------------------------------------------------

/**
 * Execute the spec's view function(s) and return a complete HTML string.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} state
 * @param {Object} serverState
 * @returns {string}
 */
function resolveView(spec, state, serverState) {
  if (typeof spec.view === 'function') {
    return spec.view(state, serverState)
  }

  // Segmented view — concatenate all segments in definition order
  return Object.values(spec.view)
    .map(fn => fn(state, serverState))
    .join('')
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

/**
 * Bind all data-event and data-action attributes within el.
 * Uses event delegation — one listener per event type per element.
 *
 * Attribute format:
 *   data-event="mutationName"           → fires on click
 *   data-event="change:mutationName"    → fires on change
 *   data-event="input:mutationName"     → fires on input
 *   data-action="actionName"            → fires on form submit
 *
 * @param {HTMLElement} el
 * @param {function} dispatch
 */
/**
 * Bind events via delegation on the root element.
 * One listener per event type — survives DOM morphing without rebinding.
 */
function bindEvents(el, dispatch, signal) {
  const opts = signal ? { signal } : {}

  el.addEventListener('click', e => {
    // Store mutations
    const storeTarget = e.target?.closest?.('[data-store-event]')
    if (storeTarget) {
      const [sType, sName] = parseEventAttr(storeTarget.dataset.storeEvent)
      if (sType === 'click') { e.preventDefault(); dispatchStoreMutationLazy(sName, e) }
      return
    }

    // Dialog open — data-dialog-open="dialogId"
    // If the element also carries data-event, fire the mutation first so the view
    // re-renders with updated state before the dialog opens.
    const dialogOpenTarget = e.target?.closest?.('[data-dialog-open]')
    if (dialogOpenTarget) {
      const eventAttr = dialogOpenTarget.dataset.event
      if (eventAttr) {
        const [type, name] = parseEventAttr(eventAttr)
        if (type === 'click') { e.preventDefault(); dispatch(name, e) }
      }
      const dialog = document.getElementById(dialogOpenTarget.dataset.dialogOpen)
      if (dialog?.showModal) { e.preventDefault(); dialog.showModal() }
      return
    }

    // Dialog close — data-dialog-close (closes nearest ancestor <dialog>)
    const dialogCloseTarget = e.target?.closest?.('[data-dialog-close]')
    if (dialogCloseTarget) {
      const dialog = dialogCloseTarget.closest('dialog')
      if (dialog) { e.preventDefault(); dialog.close() }
      return
    }

    // Backdrop close — click lands on the <dialog> element itself (outside content area)
    if (e.target?.tagName === 'DIALOG') { e.target.close(); return }

    // Spec events
    const target = e.target?.closest?.('[data-event]')
    if (!target) return
    const [type, name] = parseEventAttr(target.dataset.event)
    if (type !== 'click') return
    e.preventDefault()
    dispatch(name, e)
  }, opts)

  el.addEventListener('change', e => {
    const storeTarget = e.target?.closest?.('[data-store-event]')
    if (storeTarget) {
      const [sType, sName] = parseEventAttr(storeTarget.dataset.storeEvent)
      if (sType === 'change') dispatchStoreMutationLazy(sName, e)
      return
    }
    const target = e.target?.closest?.('[data-event]')
    if (!target) return
    const [type, name] = parseEventAttr(target.dataset.event)
    if (type !== 'change') return
    dispatchTimed(target, name, e, dispatch)
  }, opts)

  el.addEventListener('input', e => {
    const storeTarget = e.target?.closest?.('[data-store-event]')
    if (storeTarget) {
      const [sType, sName] = parseEventAttr(storeTarget.dataset.storeEvent)
      if (sType === 'input') dispatchStoreMutationLazy(sName, e)
      return
    }
    const target = e.target?.closest?.('[data-event]')
    if (!target) return
    const [type, name] = parseEventAttr(target.dataset.event)
    if (type !== 'input') return
    dispatchTimed(target, name, e, dispatch)
  }, opts)

  el.addEventListener('submit', e => {
    const target = e.target?.closest?.('[data-action]')
    if (!target) return
    e.preventDefault()
    dispatch(target.dataset.action, new FormData(target))
    if (target.hasAttribute('data-reset')) target.reset()
  }, opts)
}

/**
 * Morph the children of `el` to match `newHtml` — updates only what changed.
 * Preserves existing DOM nodes (images, inputs, etc.) rather than replacing them.
 * Falls back to innerHTML in non-browser environments (tests, SSR).
 */
function morph(el, newHtml) {
  if (typeof document === 'undefined') {
    el.innerHTML = newHtml
    return
  }
  const temp = document.createElement('div')
  temp.innerHTML = trustedHTML(newHtml)
  morphNodes(el, temp)
}

function morphNodes(cur, nxt) {
  const nxtNodes = Array.from(nxt.childNodes)

  // Key-based reconciliation — activated when every element child carries data-key.
  // Handles insert, remove, and reorder in O(n) without touching unaffected nodes.
  const nxtEls = nxtNodes.filter(n => n.nodeType === 1)
  if (nxtEls.length > 0 && nxtEls.every(n => n.getAttribute('data-key') !== null)) {
    morphKeyed(cur, nxtEls)
    return
  }

  // Position-based fallback for unkeyed content
  const curNodes = Array.from(cur.childNodes)

  nxtNodes.forEach((nxtNode, i) => {
    const curNode = curNodes[i]

    if (!curNode) {
      cur.appendChild(nxtNode.cloneNode(true))
      return
    }

    if (curNode.nodeType !== nxtNode.nodeType || curNode.nodeName !== nxtNode.nodeName) {
      cur.replaceChild(nxtNode.cloneNode(true), curNode)
      return
    }

    if (nxtNode.nodeType === 3) { // TEXT_NODE
      if (curNode.nodeValue !== nxtNode.nodeValue) curNode.nodeValue = nxtNode.nodeValue
      return
    }

    if (nxtNode.nodeType === 1) { // ELEMENT_NODE
      morphAttrs(curNode, nxtNode)
      morphNodes(curNode, nxtNode)
    }
  })

  // Remove surplus nodes
  while (cur.childNodes.length > nxtNodes.length) cur.removeChild(cur.lastChild)
}

/**
 * Key-based reconciliation for a container whose element children all carry data-key.
 * Builds a map of existing keyed nodes, then places new nodes in reverse order using
 * insertBefore — O(n) moves, O(n) removals, zero unnecessary DOM patches.
 *
 * @param {Element} cur   - existing parent element
 * @param {Element[]} nxtEls - ordered array of new element children (all have data-key)
 */
function morphKeyed(cur, nxtEls) {
  // Index existing keyed children
  const keyMap = new Map()
  for (const node of cur.childNodes) {
    if (node.nodeType === 1) {
      const k = node.getAttribute('data-key')
      if (k !== null) keyMap.set(k, node)
    }
  }

  // Place elements in reverse order — insertBefore(node, ref) where ref tracks the
  // right-hand boundary. When a node is already in the correct position, skip the move.
  let ref = null
  for (let i = nxtEls.length - 1; i >= 0; i--) {
    const nxtEl = nxtEls[i]
    const key   = nxtEl.getAttribute('data-key')
    let   node  = keyMap.get(key)

    if (node) {
      keyMap.delete(key)
      morphAttrs(node, nxtEl)
      morphNodes(node, nxtEl)
    } else {
      node = nxtEl.cloneNode(true)
    }

    if (node.nextSibling !== ref || node.parentNode !== cur) {
      cur.insertBefore(node, ref)
    }
    ref = node
  }

  // Remove elements no longer in the list
  for (const node of keyMap.values()) cur.removeChild(node)
}

function morphAttrs(cur, nxt) {
  for (const { name, value } of Array.from(nxt.attributes)) {
    if (cur.getAttribute(name) !== value) {
      // Trusted Types: script[src] is a TrustedScriptURL sink
      const safeValue = (cur.tagName === 'SCRIPT' && name === 'src')
        ? trustedScriptURL(value)
        : value
      cur.setAttribute(name, safeValue)
    }
  }
  for (const { name } of Array.from(cur.attributes)) {
    // `open` on <dialog> is managed by the native showModal/close API — never remove it
    if (cur.tagName === 'DIALOG' && name === 'open') continue
    if (!nxt.hasAttribute(name)) cur.removeAttribute(name)
  }
}

/**
 * Parse a data-event attribute value.
 * "click:increment" → ['click', 'increment']
 * "increment"       → ['click', 'increment']  (click is default)
 *
 * @param {string} value
 * @returns {[string, string]}
 */
function parseEventAttr(value) {
  const parts = value.split(':')
  if (parts.length === 1) return ['click', parts[0]]
  return [parts[0], parts[1]]
}

/**
 * Dispatch a mutation, applying debounce or throttle if declared on the element.
 * data-debounce="300" — waits 300ms after the last event before firing
 * data-throttle="300" — fires at most once every 300ms
 * No attribute — fires immediately (existing behaviour)
 *
 * The wrapped function is cached on the element via WeakMap so accumulation
 * works correctly across renders without creating new timers on every event.
 */
function dispatchTimed(target, name, e, dispatch) {
  const debounceMs = parseInt(target.dataset.debounce, 10)
  if (debounceMs > 0) {
    getCached(target, 'd', name, debounceMs, (ev) => dispatch(name, ev))(e)
    return
  }
  const throttleMs = parseInt(target.dataset.throttle, 10)
  if (throttleMs > 0) {
    getCached(target, 't', name, throttleMs, (ev) => dispatch(name, ev))(e)
    return
  }
  dispatch(name, e)
}

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

/**
 * Apply declared constraints to a state object.
 * Returns a new state object — never mutates in place.
 *
 * @param {Object} state
 * @param {Object} [constraints]
 * @returns {Object}
 */
function applyConstraints(state, constraints) {
  if (!constraints) return state

  const hasNested = Object.keys(constraints).some(p => p.includes('.'))
  const next = hasNested ? structuredClone(state) : state

  for (const [path, rules] of Object.entries(constraints)) {
    const { obj, key } = resolvePath(next, path)
    if (obj === null || obj[key] === undefined) continue

    if (rules.min !== undefined && typeof obj[key] === 'number') {
      obj[key] = Math.max(obj[key], rules.min)
    }
    if (rules.max !== undefined && typeof obj[key] === 'number') {
      obj[key] = Math.min(obj[key], rules.max)
    }
  }

  return next
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Run validation rules against the current state.
 * Returns an array of error objects — empty means valid.
 *
 * @param {Object} state
 * @param {Object} [validation]
 * @returns {{ path: string, rule: string, message: string }[]}
 */
export function validateFields(state, validation) {
  if (!validation) return []

  const errors = []

  for (const [path, rules] of Object.entries(validation)) {
    const { obj, key } = resolvePath(state, path)
    const value = obj?.[key]

    if (rules.required && !value) {
      errors.push({ path, rule: 'required', message: `${path} is required` })
      continue  // no point running further rules on an empty value
    }

    if (value === undefined || value === null || value === '') continue

    if (rules.minLength !== undefined && String(value).length < rules.minLength) {
      errors.push({ path, rule: 'minLength', message: `${path} must be at least ${rules.minLength} characters` })
    }

    if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
      errors.push({ path, rule: 'maxLength', message: `${path} must be no more than ${rules.maxLength} characters` })
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push({ path, rule: 'min', message: `${path} must be at least ${rules.min}` })
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      errors.push({ path, rule: 'max', message: `${path} must be no more than ${rules.max}` })
    }

    if (rules.format === 'email' && !isValidEmail(String(value))) {
      errors.push({ path, rule: 'format', message: `${path} must be a valid email address` })
    }

    if (rules.format === 'url' && !isValidUrl(String(value))) {
      errors.push({ path, rule: 'format', message: `${path} must be a valid URL` })
    }

    if (rules.format === 'numeric' && isNaN(Number(value))) {
      errors.push({ path, rule: 'format', message: `${path} must be numeric` })
    }

    if (rules.pattern && !rules.pattern.test(String(value))) {
      errors.push({ path, rule: 'pattern', message: `${path} does not match the required format` })
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-notation path into an object.
 * Returns the parent object and the final key so the caller can read or write.
 *
 * resolvePath({ fields: { email: '' } }, 'fields.email')
 * → { obj: { email: '' }, key: 'email' }
 *
 * @param {Object} obj
 * @param {string} path
 * @returns {{ obj: Object|null, key: string }}
 */
function resolvePath(obj, path) {
  const parts = path.split('.')
  const key   = parts.pop()
  let   cur   = obj

  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') {
      return { obj: null, key }
    }
    cur = cur[part]
  }

  return { obj: cur, key }
}

/**
 * Deep clone a plain object. No circular reference support needed —
 * spec state is always a plain serialisable object.
 *
 * @param {Object} obj
 * @returns {Object}
 */
function deepClone(obj) {
  return structuredClone(obj)
}

/**
 * Returns true when two flat state objects differ by reference at any key.
 * Used to skip render() when a mutation produces no actual change —
 * e.g. a constraint-clamped increment when already at max.
 * Only compares top-level keys — nested objects are compared by reference,
 * which is correct since mutations return new partial objects via spread.
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
function shallowChanged(a, b) {
  if (a === b) return false
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return true
  return ka.some(k => a[k] !== b[k])
}

function viewErrorFallback(err) {
  const msg = err?.message ? `: ${err.message}` : ''
  return `<div style="padding:1rem;color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;border-radius:.375rem;font-family:monospace;font-size:.875rem"><strong>View error</strong>${msg}</div>`
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// ---------------------------------------------------------------------------
// Debounce / throttle
// ---------------------------------------------------------------------------

/**
 * WeakMap cache so each element gets one stable debounced/throttled wrapper
 * per (name, delay) pair — survives DOM morphing without creating new timers.
 */
const _timerCache = new WeakMap()

function getCached(el, kind, name, delay, fn) {
  if (!_timerCache.has(el)) _timerCache.set(el, {})
  const cache = _timerCache.get(el)
  const key   = `${kind}:${name}:${delay}`
  if (!cache[key]) cache[key] = kind === 'd' ? debounce(fn, delay) : throttle(fn, delay)
  return cache[key]
}

export function debounce(fn, delay) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle(fn, delay) {
  let last = 0
  return function(...args) {
    const now = Date.now()
    if (now - last >= delay) { last = now; fn(...args) }
  }
}

function isValidUrl(value) {
  try { new URL(value); return true } catch { return false }
}
