/// <reference types="node" />

/**
 * Pulse — Core types
 * Shared across server, runtime, and SSR.
 */

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

/** One uploaded file part of a multipart body. */
export interface FormFile {
  filename: string
  type:     string
  data:     Buffer
  size:     number
}

/** A form field: a string, a file, or (for a repeated name) an array of them. */
export type FormValue = string | FormFile | Array<string | FormFile>

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
  /**
   * Parse a URL-encoded or multipart body into a plain object. Returns null for empty.
   * A name that appears more than once (a checkbox group, a multi-select) is an array, so check
   * with Array.isArray before treating a value as a string. Multipart file parts are FormFile.
   */
  formData(): Promise<Record<string, FormValue> | null>
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

/**
 * Return value of spec.submit().
 * { redirect } → 303 POST-redirect-GET. Any other object re-renders the page
 * with the value exposed as serverState.form; an optional status field sets
 * the HTTP response status (e.g. 422 for validation failures).
 */
export type SubmitResult =
  | { redirect: string }
  | { status?: number; [key: string]: unknown }

/** A sitemap entry: a '/path' string, or { path, lastmod } for a per-URL lastmod date. */
export type SitemapEntry = string | { path: string; lastmod?: string }

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
  /**
   * Which server fetchers each segment waits for. The shell is written as soon as its own fetchers
   * resolve; a deferred segment streams as soon as its own do. A segment left out is given all of them.
   */
  scope?:    Record<string, string[]>
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

/** A meta value, or a function (sync or async) resolved per request. */
type Meta<T> = T | ((ctx: RequestContext) => T | Promise<T>)

export interface MetaConfig {
  title?:       Meta<string>
  description?: Meta<string>
  styles?:      Meta<string[]>
  ogTitle?:     Meta<string>
  ogImage?:     Meta<string>
  schema?:      Record<string, unknown>
  theme?:       'light' | 'dark'
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// PulseSpec
// ---------------------------------------------------------------------------

/**
 * What a view receives as its second argument: the results of the `server` fetchers by name, plus
 * `form` and `csrf` on a page with `submit`, and the store keys the page subscribes to. Values are
 * `any` so a destructuring view such as `(state, { post }) => ...` works; pass a second type
 * argument to PulseSpec to be exact.
 */
export type ServerState = Record<string, any>

export interface PulseSpec<S extends object = Record<string, unknown>, V extends object = ServerState> {
  /**
   * URL pattern. Supports :param segments.
   * Use '*' for the custom not-found page — rendered with status 404 when no route matches.
   */
  route: string

  /**
   * Initial client-side state. Deep-cloned on mount.
   * Optional: omit it on a purely server-rendered page (no mutations, actions or persist).
   */
  state?: S

  /**
   * Pure function returning an HTML string.
   * Receives (clientState, serverState).
   * Can also be a keyed object of segment functions for streaming SSR.
   */
  view:
    | ((state: S, server: V) => string)
    | Record<string, (state: S, server: V) => string>

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
  render?: (ctx: RequestContext, server: V) => Promise<string> | string

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

  /** HTTP methods this page accepts. Default ['GET', 'HEAD'] (plus POST when submit is set). */
  methods?: Array<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'>

  /**
   * Server-side form handler — POST to this route works without client JS.
   * Return { redirect } for a 303 POST-redirect-GET; any other value re-renders
   * the page with the value exposed to the view as serverState.form (an optional
   * status field sets the response status, e.g. 422).
   * CSRF protection is enforced automatically: the view must include
   * ${server.csrf} inside the <form> or POSTs are rejected with 403.
   */
  submit?: (ctx: RequestContext) => Promise<SubmitResult | void> | SubmitResult | void

  /**
   * Set false to disable CSRF protection on the submit handler.
   * Only for endpoints with their own authentication (e.g. signed webhooks).
   */
  csrf?: boolean

  /**
   * Inclusion control for the auto-generated sitemap (createServer { sitemap: true }).
   * false → exclude this page. true → include a guarded static page that would be
   * excluded by default. Array or function → enumerate paths — required for dynamic
   * :param routes. Entries are '/path' strings or { path, lastmod } objects.
   */
  sitemap?: boolean | SitemapEntry[] | (() => Promise<SitemapEntry[]> | SitemapEntry[])

  /**
   * Called before server data fetchers on every request.
   * Return { redirect } to redirect, { status, json } for a custom response,
   * or nothing to allow the request to proceed.
   */
  guard?: (ctx: RequestContext) => Promise<GuardResult | void> | GuardResult | void

  /** HTTP Cache-Control for the page response. true = default TTL, a number = seconds (public, max-age=N), or an explicit CacheConfig. */
  cache?: boolean | number | CacheConfig

  /**
   * Query-string keys that change this page's output. The in-process page cache ignores the
   * query string by default; list a key here so distinct values get distinct cache entries.
   */
  cacheVary?: string[]

  /** Seconds to cache server.data() result in-process. */
  serverTtl?: number

  /** Timeout in ms for all server fetchers on this page. Overrides createServer fetcherTimeout. */
  serverTimeout?: number

  /** Request body limit in bytes for this route. Overrides createServer maxBody (default 1 MB), up or down. */
  maxBody?: number

  /**
   * Fallback renderer called when view() throws at runtime.
   * Return an HTML string to display instead of the default error message.
   * On the server, if not defined, view errors propagate to the 500 handler.
   */
  onViewError?: (err: Error, state: S, server: V) => string
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
