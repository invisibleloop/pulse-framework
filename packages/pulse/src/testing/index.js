/**
 * Pulse Testing — View testing helpers
 *
 * Render a spec's view in tests and assert on the HTML output.
 * No DOM, no jsdom, no browser — pure Node.js.
 *
 * Two entry points:
 *   renderSync(spec, options?) — synchronous, calls view directly
 *   render(spec, options?)     — async, runs real spec.server fetchers
 *
 * Both return a RenderResult with HTML query helpers.
 */

import { tokenize, findFirst, findAll, getInnerTokens, extractText } from './html.js'

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

/**
 * Wrap a matched token as a queryable Element.
 *
 * @param {{ type, tag, attrs, selfClose }} token
 * @param {Array} allTokens  Full token list (for inner content extraction)
 * @param {number} idx       Position of this token in allTokens
 */
function makeElement(token, allTokens, idx) {
  const inner = getInnerTokens(allTokens, idx)

  return {
    /** Element tag name (lowercase) */
    tag:   token.tag,
    /** Parsed attribute map. Boolean attrs (e.g. disabled) have value true. */
    attrs: token.attrs,
    /** All text content within this element, whitespace-collapsed. */
    text:  extractText(inner),

    /**
     * Get an attribute value. Returns '' for boolean attrs, null if absent.
     * Mirrors DOM getAttribute() behaviour.
     * @param {string} name
     * @returns {string | null}
     */
    attr(name) {
      const v = token.attrs[name.toLowerCase()]
      if (v === undefined) return null
      if (v === true)      return ''
      return String(v)
    },

    /**
     * Find the first descendant matching selector. Returns null if not found.
     * @param {string} selector
     */
    find(selector) {
      const m = findFirst(inner, selector)
      return m ? makeElement(m.token, inner, m.index) : null
    },

    /**
     * Find all descendants matching selector.
     * @param {string} selector
     * @returns {Element[]}
     */
    findAll(selector) {
      return findAll(inner, selector).map(({ token: t, index: i }) => makeElement(t, inner, i))
    },

    /**
     * True if any descendant matches selector.
     * @param {string} selector
     */
    has(selector) {
      return findFirst(inner, selector) !== null
    },
  }
}

// ---------------------------------------------------------------------------
// RenderResult
// ---------------------------------------------------------------------------

/**
 * Build a RenderResult from raw HTML + the state/server used.
 *
 * @param {string} html
 * @param {object} state
 * @param {object} server
 */
function makeResult(html, state, server) {
  const tokens = tokenize(html)

  return {
    /** Raw HTML string returned by the view function(s). */
    html,
    /** Client state used for rendering. */
    state,
    /** Server state used for rendering. */
    server,

    /** All text content in the output, whitespace-collapsed. */
    text() {
      return extractText(tokens)
    },

    /**
     * True if any element in the output matches selector.
     * @param {string} selector
     */
    has(selector) {
      return findFirst(tokens, selector) !== null
    },

    /**
     * Find the first element matching selector. Returns null if not found.
     * @param {string} selector
     * @returns {Element | null}
     */
    find(selector) {
      const m = findFirst(tokens, selector)
      return m ? makeElement(m.token, tokens, m.index) : null
    },

    /**
     * Find the first element matching selector. Throws if not found.
     * Use this when the element must exist — it gives a clear failure message.
     * @param {string} selector
     * @returns {Element}
     */
    get(selector) {
      const el = this.find(selector)
      if (!el) throw new Error(`Element not found: "${selector}"`)
      return el
    },

    /**
     * Find all elements matching selector.
     * @param {string} selector
     * @returns {Element[]}
     */
    findAll(selector) {
      return findAll(tokens, selector).map(({ token, index }) => makeElement(token, tokens, index))
    },

    /**
     * Get an attribute value from the first element matching selector.
     * Returns null if the element or attribute is not found.
     * @param {string} selector
     * @param {string} name
     * @returns {string | null}
     */
    attr(selector, name) {
      return this.find(selector)?.attr(name) ?? null
    },

    /**
     * Count elements matching selector.
     * @param {string} selector
     * @returns {number}
     */
    count(selector) {
      return findAll(tokens, selector).length
    },
  }
}

// ---------------------------------------------------------------------------
// renderSync
// ---------------------------------------------------------------------------

/**
 * Render a spec's view synchronously.
 *
 * Calls the view function directly — no server fetcher resolution.
 * Pass server state manually via options.server.
 *
 * Ideal for unit testing pure view functions where server data is mocked.
 *
 * @param {import('../../types/schema.js').PulseSpec} spec
 * @param {{ state?: object, server?: object }} [options]
 * @returns {RenderResult}
 *
 * @example
 * const result = renderSync(counterSpec, { state: { count: 5 } })
 * assert(result.has('span'))
 * assert(result.get('span').text === '5')
 */
export function renderSync(spec, options = {}) {
  const { state: stateOverrides = {}, server = {} } = options
  const state = { ...spec.state, ...stateOverrides }

  const html = typeof spec.view === 'function'
    ? spec.view(state, server)
    : Object.values(spec.view).map(fn => fn(state, server)).join('')

  return makeResult(String(html), state, server)
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

/**
 * Render a spec's view asynchronously, running real server fetchers.
 *
 * If options.server is provided, those values are used directly and fetchers
 * are skipped entirely — this is the fast mock path for unit tests.
 *
 * If options.server is omitted, spec.server fetchers are called with options.ctx
 * (default: empty object). Use this for integration tests.
 *
 * @param {import('../../types/schema.js').PulseSpec} spec
 * @param {{ state?: object, server?: object, ctx?: object }} [options]
 * @returns {Promise<RenderResult>}
 *
 * @example
 * // Mock server data — no real fetcher calls
 * const result = await render(productSpec, {
 *   server: { product: { id: 1, name: 'Widget' } }
 * })
 * assert.equal(result.get('h1').text, 'Widget')
 *
 * // Real fetchers — integration test
 * const result = await render(productSpec, { ctx: { params: { id: '1' } } })
 */
export async function render(spec, options = {}) {
  const { state: stateOverrides = {}, server: serverOverrides, ctx = {} } = options
  const state = { ...spec.state, ...stateOverrides }

  let server
  if (serverOverrides !== undefined) {
    // Caller provided mock server state — skip fetchers
    server = serverOverrides
  } else if (spec.server) {
    // Run real fetchers in parallel
    const entries = await Promise.all(
      Object.entries(spec.server).map(async ([key, fn]) => [key, await fn(ctx)])
    )
    server = Object.fromEntries(entries)
  } else {
    server = {}
  }

  const html = typeof spec.view === 'function'
    ? spec.view(state, server)
    : Object.values(spec.view).map(fn => fn(state, server)).join('')

  return makeResult(String(html), state, server)
}
