/**
 * Pulse 2 — Spec Schema
 *
 * This is the authoritative definition of a valid Pulse spec.
 * Everything the runtime, SSR renderer, streaming layer, and AI layer
 * are built against this contract.
 *
 * A spec is a plain JS object. It is the source of truth for a route.
 * Human-readable code (React, Svelte, etc.) is generated FROM this — never the reverse.
 */

// ---------------------------------------------------------------------------
// Types (JSDoc — no build step, no TypeScript compiler needed)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} StreamConfig
 * Shell segments render immediately on first flush.
 * Deferred segments render after their server data resolves.
 *
 * @property {string[]} shell    - Segment keys to render in the first flush
 * @property {string[]} [deferred] - Segment keys to render after async data
 */

/**
 * @typedef {Object} ValidationRule
 * Declared once. Enforced at both ends — browser before submit, server before action.
 *
 * @property {boolean} [required]
 * @property {number}  [minLength]
 * @property {number}  [maxLength]
 * @property {number}  [min]
 * @property {number}  [max]
 * @property {'email'|'url'|'numeric'} [format]
 * @property {RegExp}  [pattern]
 */

/**
 * @typedef {Object} ActionConfig
 * Actions cross the server/client boundary. They are always async.
 * The runtime handles the network request — the spec just declares the intent.
 *
 * @property {boolean}  [validate]   - Run validation before executing. Default false.
 * @property {function} run          - async (state, serverState?) => void
 * @property {function} onSuccess    - (state) => Partial<state>
 * @property {function} onError      - (state, error) => Partial<state>
 * @property {function} [onStart]    - (state) => Partial<state> — optimistic update
 */

/**
 * @typedef {Object} PulseSpec
 * The complete definition of a route.
 *
 * @property {string}   route       - URL pattern e.g. '/contact', '/products/:id'
 * @property {StreamConfig} [stream] - Streaming priority config. Default: render all in shell.
 *
 * @property {Object.<string, function>} [server]
 *   Async functions executed on the server. Results serialised into the initial HTML.
 *   Each key becomes available as the second argument to view functions.
 *   e.g. { products: async (req) => db.products.findAll() }
 *
 * @property {Object} state
 *   Initial client state. Plain object — no special types, no proxies.
 *   This is the only mutable state in the system. All mutations go through
 *   the mutations map — never direct assignment.
 *
 * @property {Object.<string, ValidationRule>} [validation]
 *   Dot-notation paths into state mapped to validation rules.
 *   e.g. { 'fields.email': { required: true, format: 'email' } }
 *
 * @property {Object.<string, function>|function} view
 *   Pure functions: (clientState, serverState?) => HTML string.
 *   Can be a single function for simple components, or a map of named
 *   segments for routes that use streaming.
 *   MUST be pure — no side effects, no async, deterministic output.
 *
 * @property {Object.<string, function>} [mutations]
 *   Pure functions: (state, payload?) => Partial<state>
 *   Each key matches a data-event attribute on a DOM element.
 *   e.g. { increment: (state) => ({ count: state.count + 1 }) }
 *   Return only the keys that change — runtime merges with current state.
 *
 * @property {Object.<string, ActionConfig>} [actions]
 *   Async operations that cross the server/client boundary.
 *   Triggered by data-action attributes on form elements.
 *
 * @property {Object} [meta]
 *   Page metadata — title, description, og tags etc.
 *   Used by the SSR renderer to populate <head>.
 *   Any value can be a function (ctx) => value for per-request resolution,
 *   useful for multi-brand sites where title, styles, or og tags vary by domain.
 *   e.g. { title: (ctx) => ctx.brand.name, styles: (ctx) => ['/themes/' + ctx.brand.slug + '.css'] }
 *   theme: 'light' adds data-theme="light" to <body>, activating the built-in light token set.
 *
 * @property {Object} [constraints]
 *   Runtime constraints on state values.
 *   Applied after every mutation — state can never violate these.
 *   e.g. { 'count': { min: 0, max: 10 } }
 *
 * @property {string} [hydrate]
 *   Browser-importable path to this spec file (must have a default export).
 *   When set, the SSR renderer injects a bootstrap <script> that calls mount()
 *   after the server-rendered HTML arrives, resuming interactivity.
 *   e.g. '/examples/counter.js'
 *
 * @property {function} [guard]
 *   Optional async function called before server data fetchers on every request.
 *   Return { redirect: '/login' } to deny access and redirect the user.
 *   Return nothing (or undefined) to allow the request to proceed.
 *   e.g. async (ctx) => { if (!ctx.cookies.session) return { redirect: '/login' } }
 */

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a spec object against the schema.
 * Returns { valid: true } or { valid: false, errors: string[] }
 *
 * @param {unknown} spec
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSpec(spec) {
  const errors   = []
  const warnings = []

  if (!spec || typeof spec !== 'object') {
    return { valid: false, errors: ['Spec must be a plain object'] }
  }

  // route
  if (spec.route === undefined) {
    warnings.push('spec.route is not set — the server cannot register this page without a route')
  } else if (typeof spec.route !== 'string') {
    errors.push('spec.route must be a string (e.g. "/contact")')
  } else if (!spec.route.startsWith('/')) {
    errors.push('spec.route must start with "/" (e.g. "/contact")')
  }

  // contentType — marks a raw content spec (RSS, sitemap, JSON API, etc.)
  if (spec.contentType !== undefined) {
    if (typeof spec.contentType !== 'string' || !spec.contentType.trim()) {
      errors.push('spec.contentType must be a non-empty string (e.g. "application/rss+xml; charset=utf-8")')
    }
    if (typeof spec.render !== 'function') {
      errors.push('spec.render is required when spec.contentType is set — (ctx, server) => string')
    }
    // Raw specs don't need state or view — skip those checks
    return { valid: errors.length === 0, errors }
  }

  // state
  if (spec.state === undefined) {
    errors.push('spec.state is required — use {} if there is no client state')
  } else if (typeof spec.state !== 'object' || Array.isArray(spec.state)) {
    errors.push('spec.state must be a plain object')
  }

  // view
  if (!spec.view) {
    errors.push('spec.view is required')
  } else if (typeof spec.view !== 'function' && typeof spec.view !== 'object') {
    errors.push('spec.view must be a function or a map of named segment functions')
  } else if (typeof spec.view === 'object') {
    for (const [key, fn] of Object.entries(spec.view)) {
      if (typeof fn !== 'function') {
        errors.push(`spec.view.${key} must be a function`)
      }
    }
  }

  // stream
  if (spec.stream) {
    if (!Array.isArray(spec.stream.shell)) {
      errors.push('spec.stream.shell must be an array of segment key strings')
    }
    if (spec.stream.deferred && !Array.isArray(spec.stream.deferred)) {
      errors.push('spec.stream.deferred must be an array of segment key strings')
    }
    // ensure streamed segments exist in view
    if (typeof spec.view === 'object') {
      const allSegments = [
        ...(spec.stream.shell || []),
        ...(spec.stream.deferred || [])
      ]
      for (const seg of allSegments) {
        if (!spec.view[seg]) {
          errors.push(`spec.stream references "${seg}" but spec.view.${seg} is not defined`)
        }
      }
    }
  }

  // server
  if (spec.server) {
    if (typeof spec.server !== 'object') {
      errors.push('spec.server must be a plain object of async functions')
    } else {
      for (const [key, fn] of Object.entries(spec.server)) {
        if (typeof fn !== 'function') {
          errors.push(`spec.server.${key} must be a function`)
        }
      }
    }
  }

  // mutations
  if (spec.mutations) {
    if (typeof spec.mutations !== 'object') {
      errors.push('spec.mutations must be a plain object of functions')
    } else {
      for (const [key, fn] of Object.entries(spec.mutations)) {
        if (typeof fn !== 'function') {
          errors.push(`spec.mutations.${key} must be a function`)
        }
      }
    }
  }

  // actions
  if (spec.actions) {
    if (typeof spec.actions !== 'object') {
      errors.push('spec.actions must be a plain object')
    } else {
      for (const [key, action] of Object.entries(spec.actions)) {
        if (typeof action.run !== 'function') {
          errors.push(`spec.actions.${key}.run must be an async function`)
        }
        if (typeof action.onSuccess !== 'function') {
          errors.push(`spec.actions.${key}.onSuccess must be a function`)
        }
        if (typeof action.onError !== 'function') {
          errors.push(`spec.actions.${key}.onError must be a function`)
        }
      }
    }
  }

  // validation
  if (spec.validation) {
    if (typeof spec.validation !== 'object') {
      errors.push('spec.validation must be a plain object')
    } else {
      const validRuleKeys = ['required', 'minLength', 'maxLength', 'min', 'max', 'format', 'pattern']
      for (const [path, rules] of Object.entries(spec.validation)) {
        if (typeof rules !== 'object') {
          errors.push(`spec.validation["${path}"] must be a plain object of rules`)
          continue
        }
        for (const key of Object.keys(rules)) {
          if (!validRuleKeys.includes(key)) {
            errors.push(`spec.validation["${path}"].${key} is not a recognised rule. Valid rules: ${validRuleKeys.join(', ')}`)
          }
        }
      }
    }
  }

  // constraints
  if (spec.constraints) {
    if (typeof spec.constraints !== 'object') {
      errors.push('spec.constraints must be a plain object')
    }
  }

  // persist
  if (spec.persist !== undefined) {
    if (!Array.isArray(spec.persist) || !spec.persist.every(k => typeof k === 'string')) {
      errors.push('spec.persist must be an array of state key strings, e.g. [\'count\']')
    }
  }

  // store — keys from the global store this page subscribes to
  if (spec.store !== undefined) {
    if (!Array.isArray(spec.store) || !spec.store.every(k => typeof k === 'string')) {
      errors.push('spec.store must be an array of store key strings, e.g. [\'user\', \'settings\']')
    }
  }

  // onViewError — fallback renderer called when view() throws
  if (spec.onViewError !== undefined) {
    if (typeof spec.onViewError !== 'function') {
      errors.push('spec.onViewError must be a function — (err, state, serverState) => htmlString')
    }
  }

  // methods — HTTP methods this page spec accepts (default GET + HEAD)
  if (spec.methods !== undefined) {
    const VALID_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    if (!Array.isArray(spec.methods) || !spec.methods.every(m => VALID_METHODS.includes(m.toUpperCase()))) {
      errors.push(`spec.methods must be an array of HTTP method strings, e.g. ['GET', 'POST']. Valid values: ${VALID_METHODS.join(', ')}`)
    }
  }

  // meta
  if (spec.meta) {
    if (typeof spec.meta !== 'object') {
      errors.push('spec.meta must be a plain object')
    } else if (spec.meta.schema !== undefined && typeof spec.meta.schema !== 'object') {
      errors.push('spec.meta.schema must be a plain object (JSON-LD)')
    }
  }

  // serverTtl — seconds to cache server data in-process
  if (spec.serverTtl !== undefined) {
    if (typeof spec.serverTtl !== 'number' || spec.serverTtl <= 0) {
      errors.push('spec.serverTtl must be a positive number (seconds)')
    }
  }

  // serverTimeout — ms before any server fetcher times out
  if (spec.serverTimeout !== undefined) {
    if (typeof spec.serverTimeout !== 'number' || spec.serverTimeout <= 0) {
      errors.push('spec.serverTimeout must be a positive number (milliseconds)')
    }
  }

  // guard — per-route authorization check
  if (spec.guard !== undefined) {
    if (typeof spec.guard !== 'function') {
      errors.push('spec.guard must be a function — async (ctx) => { redirect?: string }')
    }
  }

  // cache — HTTP cache-control for HTML responses
  if (spec.cache !== undefined) {
    if (typeof spec.cache !== 'object' || Array.isArray(spec.cache)) {
      errors.push('spec.cache must be a plain object')
    } else {
      if (spec.cache.maxAge !== undefined && typeof spec.cache.maxAge !== 'number') {
        errors.push('spec.cache.maxAge must be a number (seconds)')
      }
      if (spec.cache.staleWhileRevalidate !== undefined && typeof spec.cache.staleWhileRevalidate !== 'number') {
        errors.push('spec.cache.staleWhileRevalidate must be a number (seconds)')
      }
      if (spec.cache.public !== undefined && typeof spec.cache.public !== 'boolean') {
        errors.push('spec.cache.public must be a boolean')
      }
    }
  }

  // hydrate — required whenever there is any client interactivity
  if (!spec.hydrate && !spec.contentType) {
    if (spec.mutations || spec.actions || spec.persist) {
      warnings.push('spec.hydrate is missing — pages with mutations, actions, or persist need hydrate set to their browser-importable path, or client interactivity will silently do nothing')
    }
  }

  // meta quality
  if (!spec.meta) {
    warnings.push('spec.meta is missing — add at minimum title and description for SEO')
  } else {
    if (!spec.meta.title || (typeof spec.meta.title === 'string' && !spec.meta.title.trim())) {
      warnings.push('spec.meta.title is missing')
    }
    const desc = spec.meta.description
    if (!desc) {
      warnings.push('spec.meta.description is missing — add a meaningful description for SEO')
    } else if (typeof desc === 'string' && desc.trim() === 'Built with Pulse') {
      warnings.push('spec.meta.description is still the default "Built with Pulse" — replace it with a real description')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert a spec is valid. Throws with all errors if not.
 * Used by the runtime and SSR renderer on startup.
 *
 * @param {unknown} spec
 * @throws {Error}
 */
export function assertValidSpec(spec) {
  const { valid, errors, warnings } = validateSpec(spec)
  if (!valid) {
    throw new Error(
      `Invalid Pulse spec${spec?.route ? ` for route "${spec.route}"` : ''}:\n` +
      errors.map(e => `  — ${e}`).join('\n')
    )
  }
  if (warnings.length > 0) {
    console.warn(
      `Pulse spec warnings${spec?.route ? ` for route "${spec.route}"` : ''}:\n` +
      warnings.map(w => `  ⚠ ${w}`).join('\n')
    )
  }
}

/**
 * Get all segment keys defined in a spec's view.
 * For a function view, returns ['default'].
 * For a segmented view, returns the object keys.
 *
 * @param {PulseSpec} spec
 * @returns {string[]}
 */
export function getViewSegments(spec) {
  if (typeof spec.view === 'function') return ['default']
  return Object.keys(spec.view)
}

/**
 * Get the stream order for a spec.
 * Returns { shell: string[], deferred: string[] }
 * If no stream config, all segments are in shell.
 *
 * @param {PulseSpec} spec
 * @returns {{ shell: string[], deferred: string[] }}
 */
export function getStreamOrder(spec) {
  if (!spec.stream) {
    return { shell: getViewSegments(spec), deferred: [] }
  }
  return {
    shell:    spec.stream.shell    || [],
    deferred: spec.stream.deferred || []
  }
}
