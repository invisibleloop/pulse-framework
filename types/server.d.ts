/// <reference types="node" />

/**
 * Pulse — Server API types
 * @invisibleloop/pulse  or  @invisibleloop/pulse/server
 */

import type { IncomingMessage, ServerResponse, Server } from 'http'
import type { PulseSpec } from './schema.js'

export type { PulseSpec, RequestContext, ValidationRule, StreamConfig, ActionConfig,
             GuardResult, CacheConfig, MetaConfig, ToastOptions, ValidationResult } from './schema.js'

// ---------------------------------------------------------------------------
// createServer options
// ---------------------------------------------------------------------------

export interface ServerOptions {
  /** Port to listen on. Default 3000. */
  port?: number

  /** Enable streaming SSR globally. Default true. */
  stream?: boolean

  /** Path to a directory of static files served at their relative path. */
  staticDir?: string

  /** Explicit manifest path or object. Overrides auto-detection from staticDir/dist/manifest.json. */
  manifest?: string | Record<string, string> | null

  /**
   * Trailing slash behaviour. Default 'remove'.
   * 'remove' — 301 /about/ → /about
   * 'add'    — 301 /about  → /about/
   * 'allow'  — serve both, no redirect
   */
  trailingSlash?: 'remove' | 'add' | 'allow'

  /** Maximum request body size in bytes. Default 1 MB. Requests exceeding this receive a 413. */
  maxBody?: number

  /**
   * Default HTML cache TTL for all pages in production.
   * true = 1 h + 24 h SWR, number = max-age in seconds,
   * object = { public, maxAge, staleWhileRevalidate }.
   * spec.cache overrides per page.
   */
  defaultCache?: boolean | number | { public?: boolean; maxAge?: number; staleWhileRevalidate?: number } | null

  /** Global timeout in ms for all server fetchers. null = no limit. Override per page with spec.serverTimeout. */
  fetcherTimeout?: number | null

  /**
   * Multi-brand support. Called once per host (cached 60 s).
   * Result is attached to ctx.brand and available in guard, server, and meta functions.
   */
  resolveBrand?: (host: string) => Promise<unknown> | unknown

  /**
   * Milliseconds to wait for in-flight requests to complete during graceful
   * shutdown before force-exiting. Default 30 000 ms.
   */
  shutdownTimeout?: number

  /**
   * Path for the built-in health check endpoint. Default '/healthz'.
   * Returns { status: 'ok', uptime: number } — bypasses onRequest so load
   * balancers always get a response. Set to false to disable.
   */
  healthCheck?: string | false

  /** Called on every request before routing. Return false to short-circuit Pulse handling. */
  onRequest?: (req: IncomingMessage, res: ServerResponse) => false | void | unknown

  /**
   * Extra CSP sources to merge into the framework's default Content-Security-Policy.
   * Use this to allow external stylesheets, fonts, or API origins.
   * Each key is a CSP directive name; each value is an array of sources to append.
   * @example
   * // Allow Google Fonts
   * csp: { 'style-src': ['https://fonts.googleapis.com'], 'font-src': ['https://fonts.gstatic.com'] }
   */
  csp?: Record<string, string[]>

  /** Called on unhandled errors. Receives (err, req, res). */
  onError?: (err: Error, req: IncomingMessage, res: ServerResponse) => void

  /** Global store definition (default export from pulse.store.js). */
  store?: PulseStoreDefinition | null
}

// ---------------------------------------------------------------------------
// Store (used via server options)
// ---------------------------------------------------------------------------

export interface PulseStoreDefinition {
  hydrate?:   string
  state:      Record<string, unknown>
  server?:    Record<string, (ctx: import('./schema.js').RequestContext) => Promise<unknown> | unknown>
  mutations?: Record<string, (state: Record<string, unknown>, payload?: unknown) => Partial<Record<string, unknown>>>
}

// ---------------------------------------------------------------------------
// createServer return value
// ---------------------------------------------------------------------------

export interface ServerInstance {
  /** The underlying Node.js http.Server */
  server: Server

  /**
   * Gracefully shut down the server.
   * Stops accepting new connections, destroys idle keep-alive sockets, lets
   * in-flight requests finish, then force-exits after shutdownTimeout ms.
   * SIGTERM and SIGINT are already wired up automatically.
   * Idempotent — safe to call multiple times.
   */
  shutdown(): void

  /** Swap the spec list at runtime (used by the dev server for hot reload). */
  updateSpecs(specs: PulseSpec[]): void
}

// ---------------------------------------------------------------------------
// createServer
// ---------------------------------------------------------------------------

/**
 * Create and start a Pulse HTTP server.
 *
 * All specs are validated at startup — an invalid spec throws before the
 * server accepts any connections.
 *
 * @example
 * import { createServer } from '@invisibleloop/pulse'
 * import home    from './src/pages/home.js'
 * import contact from './src/pages/contact.js'
 *
 * const { server, shutdown } = createServer([home, contact], {
 *   port:      3000,
 *   stream:    true,
 *   staticDir: 'public',
 * })
 */
export function createServer(specs: PulseSpec[], options?: ServerOptions): ServerInstance
