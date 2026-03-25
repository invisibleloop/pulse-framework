/**
 * Pulse — SSR renderer types
 * @invisibleloop/pulse/ssr
 */

import type { PulseSpec } from './schema.js'
import type { RequestContext } from './schema.js'

// ---------------------------------------------------------------------------
// renderToString
// ---------------------------------------------------------------------------

export interface RenderToStringResult {
  /** Complete rendered HTML fragment (without the outer document wrapper) */
  html:        string
  /** Resolved server state from all fetchers */
  serverState: Record<string, unknown>
  /** Render timings in milliseconds */
  timing: {
    data:   number
    render: number
    total:  number
  }
}

/**
 * Render a spec to a complete HTML string.
 * Resolves all server data before rendering — no streaming.
 *
 * @param spec       The page spec to render
 * @param ctx        Request context passed to server data fetchers
 * @param pageState  Optional additional client state
 */
export function renderToString(
  spec:       PulseSpec,
  ctx?:       Partial<RequestContext> & Record<string, unknown>,
  pageState?: Record<string, unknown>
): Promise<RenderToStringResult>

// ---------------------------------------------------------------------------
// renderToStream
// ---------------------------------------------------------------------------

/**
 * Render a spec as a Web ReadableStream.
 * Shell segments are flushed immediately; deferred segments follow as their
 * server data resolves. Falls back to non-streaming for simple specs.
 *
 * Returns a ReadableStream of Uint8Array chunks (HTML).
 *
 * @param spec The page spec to render
 * @param ctx  Request context passed to server data fetchers
 */
export function renderToStream(
  spec: PulseSpec,
  ctx?: Partial<RequestContext> & Record<string, unknown>
): ReadableStream<Uint8Array>

// ---------------------------------------------------------------------------
// wrapDocument
// ---------------------------------------------------------------------------

export interface WrapDocumentOptions {
  /** Rendered HTML content (body of the page) */
  content:      string
  /** The spec (for meta, hydration script) */
  spec?:        PulseSpec
  /** Resolved server state — serialised as window.__PULSE_SERVER__ */
  serverState?: Record<string, unknown>
  /** Timing values from renderToString */
  timing?:      { data: number; render: number; total: number }
  /** CSP nonce for the hydration script */
  nonce?:       string
  /** Canonical URL for <link rel="canonical"> */
  canonicalUrl?: string
  /** Extra HTML injected before </body> */
  extraBody?:   string
  /** Path to the runtime bundle for <link rel="modulepreload"> */
  runtimeBundle?: string
  /** Hydrate path resolved from manifest (overrides spec.hydrate) */
  resolvedHydrate?: string
}

export interface WrapDocumentResult {
  /** Complete HTML document string */
  html:               string
  /** Server-Timing header value (null if no timing provided) */
  serverTimingValue:  string | null
}

/**
 * Wrap a rendered HTML fragment in a full HTML document.
 * Adds DOCTYPE, <head> (meta, styles, hydration script), and </html>.
 */
export function wrapDocument(options: WrapDocumentOptions): WrapDocumentResult

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

/**
 * Race a promise against a timeout.
 * Rejects with a descriptive error if the promise does not resolve within ms.
 * Pass null or 0 for ms to disable the timeout (returns the original promise).
 *
 * @param promise The promise to race
 * @param ms      Timeout in milliseconds (null or 0 = disabled)
 * @param name    Fetcher name used in the rejection error message
 */
export function withTimeout<T>(promise: Promise<T>, ms: number | null, name: string): Promise<T>
