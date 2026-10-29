/// <reference types="node" />

/**
 * Pulse — Server API types
 * @invisibleloop/pulse  or  @invisibleloop/pulse/server
 */

import type { IncomingMessage, ServerResponse, Server } from 'http'
import type { PulseSpec } from './schema.js'

export type { PulseSpec, ServerState, RequestContext, ValidationRule, StreamConfig, ActionConfig,
             GuardResult, CacheConfig, MetaConfig, ToastOptions, ValidationResult,
             FormValue, FormFile, SubmitResult, SitemapEntry } from './schema.js'

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

  /**
   * Pin the site's public origin, e.g. `'https://example.com'`. Used for `<link rel="canonical">`,
   * `sitemap.xml` and `robots.txt` INSTEAD of the `Host` / `X-Forwarded-Host` / `X-Forwarded-Proto`
   * headers, which a client — or a CDN that ignores `Vary` — can forge to poison those URLs.
   * Recommended in production. An explicit `sitemap.origin` still takes precedence for the sitemap.
   * Must be an absolute http(s) URL; anything after the origin is dropped.
   */
  origin?: string

  /**
   * Network interface to listen on. Default: all interfaces (what a server behind a proxy or in
   * a container needs). `pulse dev` passes `'127.0.0.1'` unless told otherwise.
   */
  host?: string

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
   * Development only. Extra hostnames the dev server answers to. By default it answers only
   * requests addressed to localhost, an IP address, a `.local` or `.localhost` name or this
   * computer's hostname, which keeps a web page elsewhere from reaching it through DNS rebinding.
   * An entry is an exact name (`'myapp.test'`) or `'.example.com'` for the domain and everything
   * under it.
   */
  allowedHosts?: string[]

  /**
   * Strict-Transport-Security on HTTPS responses (HTTPS is detected from the socket or
   * `x-forwarded-proto`). Default: `max-age=31536000` — one year, this exact host only.
   * `false` sends none (the proxy or CDN in front sets its own). A string is sent verbatim.
   * `includeSubDomains` and `preload` are commitments about the whole domain, so they are opt-in;
   * `preload` requires `includeSubDomains: true` and `maxAge >= 31536000`.
   */
  hsts?: false | string | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean }

  /**
   * Path for the built-in health check endpoint. Default '/healthz'.
   * Returns { status: 'ok', uptime: number } — bypasses onRequest so load
   * balancers always get a response. Set to false to disable.
   */
  healthCheck?: string | false

  /** Called on every request before routing. Return false to short-circuit Pulse handling. */
  onRequest?: (req: IncomingMessage, res: ServerResponse) => false | void | unknown

  /**
   * HMAC secret for CSRF tokens (spec.submit forms). Defaults to a random
   * per-boot value — set a stable secret (e.g. from an env var) when running
   * multiple instances so tokens issued by one instance validate on another.
   */
  secret?: string | null

  /**
   * Auto-serve /sitemap.xml (and robots.txt) from the registered routes.
   * true derives the origin from request headers; { origin } pins it.
   * Static page routes are included automatically; dynamic :param routes
   * contribute via spec.sitemap; guarded pages are excluded unless the spec
   * opts in. A physical sitemap.xml in staticDir always wins.
   */
  sitemap?: boolean | { origin?: string }

  /**
   * robots.txt behaviour when sitemap is enabled. null/undefined auto-generates
   * (allow all + Sitemap line); false disables; a string is served verbatim.
   */
  robots?: string | false | null

  /**
   * Declarative redirect map for legacy URLs (SEO-safe migrations).
   * Sources are route patterns; targets are paths or absolute URLs and may
   * reference the same :params. A string target redirects with 301; use
   * { to, status } for 302/307/308. Checked before route matching (GET/HEAD
   * only); the query string is preserved. Validated at startup.
   * @example
   * redirects: {
   *   '/old-blog/:slug': '/blog/:slug',
   *   '/promo':          { to: '/pricing', status: 302 },
   * }
   */
  redirects?: Record<string, string | { to: string; status?: 301 | 302 | 307 | 308 }> | null

  /**
   * Enable the SSE store-push channel. createServer's return value gains a
   * working pushStore(partial) that broadcasts store patches to all connected
   * clients; pages subscribed via spec.store re-render immediately. Pass
   * { path } to move the endpoint (default '/__pulse/live'). The channel is a
   * broadcast — push SHARED data only (stock, announcements), never per-user data.
   */
  live?: boolean | { path?: string }

  /**
   * Extra CSP sources to merge into the framework's default Content-Security-Policy.
   * Use this to allow external stylesheets, fonts, or API origins.
   * Each key is a CSP directive name; each value is an array of sources to append.
   * @example
   * // Allow Google Fonts
   * csp: { 'style-src': ['https://fonts.googleapis.com'], 'font-src': ['https://fonts.gstatic.com'] }
   */
  csp?: Record<string, string[]>

  /**
   * Opt-in analytics script URL. Injected as `<script defer src>` in every page head,
   * and its origin is added to `script-src` and `connect-src`. Off by default —
   * Pulse never injects third-party scripts unless asked.
   * @example analytics: 'https://quietlytics.app/tracker.js'
   */
  analytics?: string | { src: string }

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

/**
 * Make a redirect target taken from the request (`?next=`, a form field) safe to use: returns
 * `target` only if it is a path on this site, otherwise `fallback`.
 * @example return { redirect: safeRedirect(ctx.query.next, '/dashboard') }
 */
export declare function safeRedirect(target: unknown, fallback?: string): string

/**
 * Module-level broadcast to the running live server — for spec files that have
 * no server handle (the CLI owns createServer in scaffolded apps).
 * Throws unless a server with `live: true` is running.
 * @example
 * import { pushStore } from '@invisibleloop/pulse'
 * pushStore({ stock: 5 })
 */
export declare function pushStore(partial: Record<string, unknown>): number

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
  updateSpecs(specs: PulseSpec<any, any>[]): void

  /** Swap the store definition at runtime (dev hot reload of pulse.store.js). Validates; throws on a bad definition. */
  updateStore(storeDef: PulseStoreDefinition | null): void

  /**
   * Broadcast a store patch to every connected live client (requires the
   * `live` option). Pages subscribed via spec.store merge the patch and
   * re-render immediately. Returns the number of clients reached.
   * Broadcast channel — push SHARED data only, never per-user data.
   * @example pushStore({ stock: 5 })
   */
  pushStore(partial: Record<string, unknown>): number
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
 * const { server, shutdown } = await createServer([home, contact], {
 *   port:      3000,
 *   stream:    true,
 *   staticDir: 'public',
 * })
 *
 * Entries are spec objects or `URL`s of spec files (`new URL('./home.js', import.meta.url)`); with
 * URLs the browser path used to hydrate each spec is derived for you.
 *
 * createServer is async: always `await` it.
 */
export function createServer(entries: Array<PulseSpec<any, any> | URL>, options?: ServerOptions): Promise<ServerInstance>
