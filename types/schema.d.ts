/// <reference types="node" />

/**
 * Pulse — Core types
 * Shared across server, runtime, and SSR.
 */

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

export interface RequestContext {
  /** Route params extracted from the URL pattern, e.g. { id: '42' } */
  params:   Record<string, string>
  /** Parsed query string, e.g. { q: 'widget' } */
  query:    Record<string, string>
  /** Raw request headers */
  headers:  Record<string, string | string[] | undefined>
  /** URL pathname */
  pathname: string
  /** HTTP method */
  method:   string
  /** CSP nonce generated per request — pass to inline <script nonce="…"> */
  nonce:    string
  /** Parsed cookies from the request Cookie header */
  cookies:  Record<string, string>
  /** Brand config resolved by resolveBrand (undefined if not configured) */
  brand?:   unknown
  /** Global store state for keys declared in spec.store */
  store?:   Record<string, unknown>
  /** Active fetcher timeout in ms (null = no limit) */
  fetcherTimeout: number | null

  /** Parse a JSON request body. Returns null for an empty body. */
  json():     Promise<Record<string, unknown> | null>
  /** Read the body as a plain string. */
  text():     Promise<string>
  /** Parse a URL-encoded body into a plain object. Returns null for empty. */
  formData(): Promise<Record<string, string> | null>
  /** Read the raw body as a Node.js Buffer. */
  buffer():   Promise<Buffer>

  /**
   * Queue a Set-Cookie header on the response.
   * Defaults: Path=/, SameSite=Lax.
   */
  setCookie(
    name:  string,
    value: string,
    opts?: {
      httpOnly?: boolean
      secure?:   boolean
      path?:     string
      maxAge?:   number
      sameSite?: 'Strict' | 'Lax' | 'None'
      domain?:   string
    }
  ): void

  /** Queue an arbitrary response header. */
  setHeader(name: string, value: string): void
}

// ---------------------------------------------------------------------------
// Guard return value
// ---------------------------------------------------------------------------

export type GuardResult =
  | { redirect: string }
  | { status: number; json?: unknown; body?: string; headers?: Record<string, string> }

// ---------------------------------------------------------------------------
// Spec sub-types
// ---------------------------------------------------------------------------

export interface ValidationRule {
  required?:  boolean
  minLength?: number
  maxLength?: number
  min?:       number
  max?:       number
  format?:    'email' | 'url' | 'numeric'
  pattern?:   RegExp
}

export interface StreamConfig {
  /** Segment keys rendered in the first flush */
  shell:     string[]
  /** Segment keys rendered after their async data resolves */
  deferred?: string[]
}

export interface ActionConfig<S extends object = Record<string, unknown>> {
  /** Run validation (spec.validation) before executing. Default false. */
  validate?:  boolean
  /** Called before run() — optimistic update */
  onStart?:   (state: S, payload?: unknown) => Partial<S>
  /** Async operation. Return value is passed to onSuccess. */
  run:        (state: S, server?: unknown, payload?: unknown) => Promise<unknown>
  /** Called on success. Return partial state to merge. */
  onSuccess:  (state: S, payload: unknown) => Partial<S> & { _toast?: ToastOptions; _storeUpdate?: Record<string, unknown> }
  /** Called on error. Return partial state to merge. */
  onError:    (state: S, err: Error) => Partial<S> & { _toast?: ToastOptions }
}

export interface ToastOptions {
  message:   string
  variant?:  'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface CacheConfig {
  public?:              boolean
  maxAge?:              number
  staleWhileRevalidate?: number
}

export interface MetaConfig {
  title?:       string | ((ctx: RequestContext) => string)
  description?: string | ((ctx: RequestContext) => string)
  styles?:      string[] | ((ctx: RequestContext) => string[])
  ogTitle?:     string | ((ctx: RequestContext) => string)
  ogImage?:     string | ((ctx: RequestContext) => string)
  schema?:      Record<string, unknown>
  theme?:       'light' | 'dark'
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// PulseSpec
// ---------------------------------------------------------------------------

export interface PulseSpec<S extends object = Record<string, unknown>> {
  /** URL pattern. Supports :param segments. */
  route: string

  /**
   * Initial client-side state. Deep-cloned on mount.
   * Required for page specs; omit only for raw content specs (contentType set).
   */
  state: S

  /**
   * Pure function returning an HTML string.
   * Receives (clientState, serverState).
   * Can also be a keyed object of segment functions for streaming SSR.
   */
  view:
    | ((state: S, server?: Record<string, unknown>) => string)
    | Record<string, (state: S, server?: Record<string, unknown>) => string>

  /**
   * Browser-importable path to this spec file.
   * Required for any spec with mutations, actions, or persist.
   */
  hydrate?: string

  /** Streaming SSR config — split view into shell and deferred segments. */
  stream?: StreamConfig

  /** Server-side data fetchers. Results passed as second arg to view. */
  server?: Record<string, (ctx: RequestContext) => Promise<unknown> | unknown>

  /**
   * Raw content spec — set Content-Type and implement render() instead of view().
   * Accepts any HTTP method. Use for RSS feeds, JSON APIs, sitemaps, webhooks.
   */
  contentType?: string

  /**
   * Required when contentType is set.
   * Receives (ctx, server) and returns the raw response body string.
   */
  render?: (ctx: RequestContext, server?: Record<string, unknown>) => Promise<string> | string

  /** Page metadata for the <head>. Fields may be functions for per-request resolution. */
  meta?: MetaConfig

  /** Synchronous state updaters. Each returns a partial state to merge. */
  mutations?: Record<string, (state: S, event?: Event | unknown) => Partial<S>>

  /** Async operations with full lifecycle hooks. */
  actions?: Record<string, ActionConfig<S>>

  /** Declarative validation rules keyed by dot-path state keys. */
  validation?: Record<string, ValidationRule>

  /** Min/max bounds clamped after every mutation. Cannot be bypassed. */
  constraints?: Record<string, { min?: number; max?: number }>

  /** State keys to persist in localStorage between visits. */
  persist?: string[]

  /** Global store keys this page subscribes to. Appear in view's server arg. */
  store?: string[]

  /** HTTP methods this page accepts. Default ['GET', 'HEAD']. */
  methods?: Array<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'>

  /**
   * Called before server data fetchers on every request.
   * Return { redirect } to redirect, { status, json } for a custom response,
   * or nothing to allow the request to proceed.
   */
  guard?: (ctx: RequestContext) => Promise<GuardResult | void> | GuardResult | void

  /** HTTP Cache-Control header config for the page response. */
  cache?: CacheConfig

  /** Seconds to cache server.data() result in-process. */
  serverTtl?: number

  /** Timeout in ms for all server fetchers on this page. Overrides createServer fetcherTimeout. */
  serverTimeout?: number

  /**
   * Fallback renderer called when view() throws at runtime.
   * Return an HTML string to display instead of the default error message.
   * On the server, if not defined, view errors propagate to the 500 handler.
   */
  onViewError?: (err: Error, state: S, server?: Record<string, unknown>) => string
}

// ---------------------------------------------------------------------------
// Validation utilities
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid:  boolean
  errors: string[]
}

/** Validate a spec. Returns { valid, errors }. Does not throw. */
export function validateSpec(spec: unknown): ValidationResult

/** Validate a spec. Throws with all errors if invalid. */
export function assertValidSpec(spec: unknown): void

/** Returns the segment keys defined in spec.view. ['default'] for a function view. */
export function getViewSegments(spec: PulseSpec): string[]

/** Returns { shell, deferred } stream order. All segments in shell if no stream config. */
export function getStreamOrder(spec: PulseSpec): { shell: string[]; deferred: string[] }
