/**
 * Pulse — View testing helper types
 * @invisibleloop/pulse/testing
 */

import type { PulseSpec, RequestContext } from './schema.js'

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

export interface Element {
  /** Tag name (lowercase) */
  tag:   string
  /** Parsed attributes. Boolean attrs (e.g. disabled) have value true. */
  attrs: Record<string, string | true>
  /** All text content within the element, whitespace-collapsed. */
  text:  string

  /**
   * Get an attribute value. Returns '' for boolean attrs, null if absent.
   * Mirrors DOM getAttribute() behaviour.
   */
  attr(name: string): string | null

  /** Find the first descendant matching selector. Returns null if not found. */
  find(selector: string): Element | null

  /** Find all descendants matching selector. */
  findAll(selector: string): Element[]

  /** True if any descendant matches selector. */
  has(selector: string): boolean
}

// ---------------------------------------------------------------------------
// RenderResult
// ---------------------------------------------------------------------------

export interface RenderResult<S extends object = Record<string, unknown>> {
  /** Raw HTML string returned by the view function(s). */
  html:   string
  /** Client state used for rendering. */
  state:  S
  /** Server state used for rendering (resolved fetchers or provided mock). */
  server: Record<string, unknown>

  /** All text content in the output, whitespace-collapsed, tags stripped. */
  text(): string

  /** True if any element in the output matches selector. */
  has(selector: string): boolean

  /**
   * Find the first element matching selector.
   * Returns null if not found.
   */
  find(selector: string): Element | null

  /**
   * Find the first element matching selector.
   * Throws with a clear message if not found.
   * Use this when the element must exist — failures are immediately obvious.
   */
  get(selector: string): Element

  /** Find all elements matching selector. */
  findAll(selector: string): Element[]

  /**
   * Get an attribute value from the first element matching selector.
   * Returns null if the element or attribute is not present.
   */
  attr(selector: string, name: string): string | null

  /** Count elements matching selector. */
  count(selector: string): number
}

// ---------------------------------------------------------------------------
// renderSync
// ---------------------------------------------------------------------------

export interface RenderSyncOptions<S extends object = Record<string, unknown>> {
  /** State overrides merged with spec.state. */
  state?:  Partial<S>
  /** Server state passed directly to the view (bypasses spec.server fetchers). */
  server?: Record<string, unknown>
}

/**
 * Render a spec's view synchronously.
 *
 * Calls the view function directly — no server fetcher resolution.
 * Pass mock server data via `options.server`.
 *
 * Ideal for fast unit tests of pure view functions.
 *
 * @example
 * import { renderSync } from '@invisibleloop/pulse/testing'
 *
 * const result = renderSync(counterSpec, { state: { count: 5 } })
 * assert(result.get('#count').text === '5')
 */
export function renderSync<S extends object = Record<string, unknown>>(
  spec:     PulseSpec<S>,
  options?: RenderSyncOptions<S>
): RenderResult<S>

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

export interface RenderOptions<S extends object = Record<string, unknown>> {
  /** State overrides merged with spec.state. */
  state?:  Partial<S>
  /**
   * Server state passed directly to the view.
   * When provided, spec.server fetchers are NOT called — use for unit tests.
   * When omitted, spec.server fetchers are called with `ctx` — use for integration tests.
   */
  server?: Record<string, unknown>
  /**
   * Request context passed to spec.server fetchers.
   * Only relevant when server is not provided (integration mode).
   */
  ctx?:    Partial<RequestContext> & Record<string, unknown>
}

/**
 * Render a spec's view asynchronously.
 *
 * Two modes:
 * - **Mock mode** — pass `server` in options to bypass fetchers entirely.
 *   Fast, deterministic, no I/O.
 * - **Integration mode** — omit `server` to run real spec.server fetchers.
 *   Use `ctx` to set params, cookies, headers, etc.
 *
 * @example
 * // Mock server data
 * const result = await render(productSpec, {
 *   server: { product: { id: 1, name: 'Widget' } }
 * })
 * assert.equal(result.get('h1').text, 'Widget')
 *
 * // Integration — real fetchers
 * const result = await render(productSpec, {
 *   ctx: { params: { id: '42' } }
 * })
 */
export function render<S extends object = Record<string, unknown>>(
  spec:     PulseSpec<S>,
  options?: RenderOptions<S>
): Promise<RenderResult<S>>
