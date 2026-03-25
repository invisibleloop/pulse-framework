/**
 * Pulse — Client runtime types
 * @invisibleloop/pulse/runtime
 */

import type { PulseSpec, PulseStoreDefinition } from './server.js'

export type { PulseSpec } from './schema.js'

// ---------------------------------------------------------------------------
// mount
// ---------------------------------------------------------------------------

export interface MountOptions {
  /**
   * Set to true when mounting after SSR — skips the initial render and only
   * binds event listeners. Preserves the SSR-painted LCP element and avoids a
   * re-render flash. Always true in production bundle boots.
   */
  ssr?: boolean

  /**
   * Store definition (default export from pulse.store.js).
   * Pass to the first mount() call on a page that uses spec.store.
   */
  store?: PulseStoreDefinition
}

export interface MountResult {
  /** Destroy this mount, remove event listeners, and unsubscribe from the store. */
  destroy(): void
}

/**
 * Mount a Pulse spec to a DOM element.
 *
 * Binds events, applies mutations, enforces constraints, and re-renders the
 * view on every state change. Call once per page load, then call destroy()
 * before mounting a new spec during client-side navigation.
 *
 * @example
 * import spec from './src/pages/counter.js'
 * import { mount } from '@invisibleloop/pulse/runtime'
 *
 * const root = document.getElementById('pulse-root')
 * mount(spec, root, window.__PULSE_SERVER__ ?? {}, { ssr: true })
 */
export function mount(
  spec:        PulseSpec,
  el:          HTMLElement,
  serverState?: Record<string, unknown>,
  options?:    MountOptions
): MountResult

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

/** Debounce a function — returns a new function that delays invocation. */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T

/** Throttle a function — returns a new function that limits invocation rate. */
export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T
