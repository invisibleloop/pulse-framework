/**
 * Pulse 2 — Client Runtime
 *
 * Takes a spec, mounts it to a DOM element.
 * Handles events, applies mutations, enforces constraints, re-renders.
 *
 * No framework. No virtual DOM. No dependencies.
 */

import { initClientStore, getStoreState, subscribe, updateStore, registerStoreMutations, dispatchStoreMutation } from './store.js'

// Toast is lazy-loaded on first use — pages that never use _toast pay zero bytes
const showToast = (opts) => import('./toast.js').then(m => m.showToast(opts))

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
  if (!spec || spec.state === undefined || !spec.view) {
    throw new Error('[Pulse] mount: spec must have state and view')
  }
  // Spec is validated server-side at startup — no need to re-validate in the browser
  // Initialise the client store from SSR data (no-op after the first page mount).
  // window.__PULSE_STORE__ is serialised by the server when a store is registered.
  if (typeof window !== 'undefined') {
    initClientStore(window.__PULSE_STORE__ || {})
    // Register store mutations so data-store-event bindings can dispatch them.
    // No-op on subsequent mounts — mutations persist across client navigations.
    if (options.store?.mutations) {
      registerStoreMutations(options.store.mutations)
    }
  }

  // Separate page-level server state from store keys so they can be tracked
  // independently — store values come from the live singleton, not the snapshot.
  const _storeKeys = new Set(spec.store || [])
  const _pageServerState = {}
  for (const [k, v] of Object.entries(serverState)) {
    if (!_storeKeys.has(k)) _pageServerState[k] = v
  }

  // Build the server state the view sees: fresh store slice + page-level data.
  // Page-level keys always win over store keys with the same name.
  function getEffectiveServerState() {
    if (!_storeKeys.size) return _pageServerState
    const storeState = getStoreState()
    const slice = {}
    for (const key of _storeKeys) {
      if (storeState[key] !== undefined) slice[key] = storeState[key]
    }
    return { ...slice, ..._pageServerState }
  }

  // Deep clone initial state — never mutate the spec itself
  let state = deepClone(spec.state)

  // Restore persisted keys from localStorage
  const persistKey = spec.persist?.length ? `pulse:${spec.route || location.pathname}` : null
  let restoredFromPersist = false
  if (persistKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(persistKey) || '{}')
      spec.persist.forEach(k => {
        if (saved[k] !== undefined && saved[k] !== spec.state[k]) {
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
      console.error('[Pulse] View error:', err)
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
  // Dispatch — the single entry point for all state changes
  // ---------------------------------------------------------------------------

  function dispatch(type, payload) {
    // Mutation
    if (spec.mutations?.[type]) {
      const raw = spec.mutations[type](state, payload)
      if (raw?._toast) showToast(raw._toast)
      const { _toast, ...partial } = raw ?? {}
      const prev = state
      state = applyConstraints({ ...state, ...partial }, spec.constraints)
      persist()
      if (shallowChanged(prev, state)) render()
      return
    }

    // Action
    if (spec.actions?.[type]) {
      runAction(type, spec.actions[type], state, payload)
      return
    }

    console.warn(`[Pulse] No mutation or action found for "${type}"`)
  }

  // ---------------------------------------------------------------------------
  // Actions — async, cross the server/client boundary
  // ---------------------------------------------------------------------------

  async function runAction(name, action, currentState, payload) {
    // Optimistic update before async work
    if (action.onStart) {
      const raw = action.onStart(currentState, payload)
      if (raw?._toast) showToast(raw._toast)
      const { _toast, ...partial } = raw ?? {}
      const prev = state
      state = applyConstraints({ ...state, ...partial }, spec.constraints)
      if (shallowChanged(prev, state)) render()
    }

    // Validate before running if requested
    if (action.validate) {
      const errors = validateFields(state, spec.validation)
      if (errors.length > 0) {
        console.warn(`[Pulse] Validation failed for action "${name}":`, errors)
        const raw = action.onError?.(state, { validation: errors }) ?? {}
        if (raw._toast) showToast(raw._toast)
        const { _toast, ...partial } = raw
        const prev = state
        state = applyConstraints({ ...state, ...partial }, spec.constraints)
        if (shallowChanged(prev, state)) render()
        return
      }
    }

    try {
      // Pass fresh effective server state (includes live store values)
      const result = await action.run(state, getEffectiveServerState(), payload)
      const raw    = action.onSuccess(state, result) ?? {}

      // _storeUpdate — push changes to the global store and notify all subscribers
      if (raw._storeUpdate) updateStore(raw._storeUpdate)
      if (raw._toast)       showToast(raw._toast)
      const { _storeUpdate: _su, _toast: _t, ...partial } = raw
      const prev = state
      state = applyConstraints({ ...state, ...partial }, spec.constraints)
      if (shallowChanged(prev, state)) render()
    } catch (error) {
      console.error(`[Pulse] Action "${name}" failed:`, error)
      const raw = action.onError(state, error) ?? {}
      if (raw._toast) showToast(raw._toast)
      const { _toast, ...partial } = raw
      const prev = state
      state = applyConstraints({ ...state, ...partial }, spec.constraints)
      if (shallowChanged(prev, state)) render()
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

  // Subscribe to global store — re-render whenever store keys this page uses change.
  const _unsubStore = _storeKeys.size > 0 ? subscribe(() => render()) : null

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
    destroy: () => { _unsubStore?.(); _eventAbort.abort(); el.innerHTML = '' }
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
      if (sType === 'click') { e.preventDefault(); dispatchStoreMutation(sName, e) }
      return
    }

    // Dialog open — data-dialog-open="dialogId"
    const dialogOpenTarget = e.target?.closest?.('[data-dialog-open]')
    if (dialogOpenTarget) {
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
      if (sType === 'change') dispatchStoreMutation(sName, e)
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
      if (sType === 'input') dispatchStoreMutation(sName, e)
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
  temp.innerHTML = newHtml
  morphNodes(el, temp)
}

function morphNodes(cur, nxt) {
  const curNodes = Array.from(cur.childNodes)
  const nxtNodes = Array.from(nxt.childNodes)

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

function morphAttrs(cur, nxt) {
  for (const { name, value } of Array.from(nxt.attributes)) {
    if (cur.getAttribute(name) !== value) cur.setAttribute(name, value)
  }
  for (const { name } of Array.from(cur.attributes)) {
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
