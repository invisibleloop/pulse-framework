/**
 * Pulse — Global Store
 *
 * The store is a single shared data layer declared in pulse.store.js.
 * Its server fetchers run once per request and the results are available to
 * any page that declares which keys it uses via spec.store.
 *
 * Store mutations (store.mutations) allow synchronous client-side updates that
 * broadcast to all subscribed pages without a server round-trip.
 */

/**
 * Validate a store definition.
 * Returns { valid: true } or { valid: false, errors: string[] }
 *
 * @param {unknown} store
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStore(store) {
  const errors = []

  if (!store || typeof store !== 'object' || Array.isArray(store)) {
    return { valid: false, errors: ['Store must be a plain object'] }
  }

  if (store.state !== undefined) {
    if (typeof store.state !== 'object' || Array.isArray(store.state)) {
      errors.push('store.state must be a plain object')
    }
  }

  if (store.server !== undefined) {
    if (typeof store.server !== 'object' || Array.isArray(store.server)) {
      errors.push('store.server must be a plain object of async functions')
    } else {
      for (const [key, fn] of Object.entries(store.server)) {
        if (typeof fn !== 'function') {
          errors.push(`store.server.${key} must be a function`)
        }
      }
    }
  }

  if (store.hydrate !== undefined) {
    if (typeof store.hydrate !== 'string' || !store.hydrate.startsWith('/')) {
      errors.push('store.hydrate must be a string starting with "/"')
    }
  }

  if (store.mutations !== undefined) {
    if (typeof store.mutations !== 'object' || Array.isArray(store.mutations)) {
      errors.push('store.mutations must be a plain object of functions')
    } else {
      for (const [key, fn] of Object.entries(store.mutations)) {
        if (typeof fn !== 'function') {
          errors.push(`store.mutations.${key} must be a function`)
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Resolve all store server fetchers in parallel.
 * Falls back to store.state values for keys not covered by server fetchers.
 *
 * @param {Object} store  - The store definition
 * @param {Object} ctx    - The request context (params, query, cookies, etc.)
 * @returns {Promise<Object>}
 */
export async function resolveStoreState(store, ctx) {
  const base = store.state ? { ...store.state } : {}

  if (!store.server) return base

  const timeout = ctx.fetcherTimeout ?? null

  const entries = await Promise.all(
    Object.entries(store.server).map(async ([key, fn]) => {
      const value = timeout
        ? await withTimeout(fn(ctx), timeout, `store.${key}`)
        : await fn(ctx)
      return [key, value]
    })
  )

  return { ...base, ...Object.fromEntries(entries) }
}

function withTimeout(promise, ms, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Store fetcher "${name}" timed out after ${ms}ms`)),
        ms
      )
    )
  ])
}
