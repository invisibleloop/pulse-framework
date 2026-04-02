/**
 * Pulse — HTTP Server
 *
 * Takes a map of specs, handles routing, streams responses.
 * Pure Node.js http module — no Express, no dependencies.
 *
 * Usage:
 *   import { createServer } from './src/server/index.js'
 *   import { contactSpec } from './specs/contact.js'
 *
 *   createServer([contactSpec], { port: 3000 })
 */

import http   from 'http'
import fs     from 'fs'
import path   from 'path'
import zlib   from 'zlib'
import crypto from 'crypto'
import { promisify }  from 'util'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)
export const version = _require('../../package.json').version
import { renderToString, renderToStream, renderToNavStream, wrapDocument, resolveServerState } from '../runtime/ssr.js'
import { validateSpec } from '../spec/schema.js'
import { validateStore, resolveStoreState } from '../store/index.js'

const gzipAsync   = promisify(zlib.gzip)
const brotliAsync = promisify(zlib.brotliCompress)

// ---------------------------------------------------------------------------
// Security headers — applied to every response
// ---------------------------------------------------------------------------

const SECURITY_HEADERS = {
  'X-Content-Type-Options':       'nosniff',
  'X-Frame-Options':              'DENY',
  'Referrer-Policy':              'strict-origin-when-cross-origin',
  'Permissions-Policy':           'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy':   'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

/**
 * Return Strict-Transport-Security header when the request is over HTTPS.
 * Detects HTTPS via the x-forwarded-proto header (CDN/proxy) or the socket.
 */
function httpsHeaders(req) {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.socket?.encrypted
  return isHttps ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' } : {}
}

/**
 * Base CSP directives — applied to every page response.
 * Keys are directive names; values are arrays of sources.
 * Callers may extend individual directives by merging extra sources.
 */
const BASE_CSP = {
  'default-src':    ["'none'"],
  'script-src':     ["'self'"],           // nonce appended at request time
  'style-src':      ["'self'"],
  'style-src-attr': ["'unsafe-inline'"],  // scoped: UI components use inline style= for CSS vars
  'img-src':        ["'self'", 'data:'],
  'font-src':       ["'self'"],
  'connect-src':    ["'self'"],
  'object-src':     ["'none'"],
  'frame-ancestors':["'none'"],
  'base-uri':       ["'self'"],
  'form-action':    ["'self'"],
}

function serializeCsp(directives) {
  return Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')
}

/**
 * Build the Content-Security-Policy header for a page response.
 * @param {string} nonce  Per-request nonce for inline scripts.
 * @param {Record<string,string[]>} [ext]  Extra sources to merge in per directive.
 */
function buildCsp(nonce, ext = {}) {
  const d = {
    ...BASE_CSP,
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src':  ["'self'", `'nonce-${nonce}'`],  // allows toast's runtime-injected <style nonce>
  }
  for (const [k, sources] of Object.entries(ext)) {
    d[k] = [...(d[k] || []), ...sources]
  }
  return serializeCsp(d)
}

/**
 * Build the nonce-free CSP for cached responses.
 * Safe because cached pages (no spec.server, no spec.store) are only cached
 * when they have no spec.hydrate — so no inline nonce scripts are present.
 * @param {Record<string,string[]>} [ext]  Extra sources to merge in per directive.
 */
function buildCachedCsp(ext = {}) {
  const d = { ...BASE_CSP }
  for (const [k, sources] of Object.entries(ext)) {
    d[k] = [...(d[k] || []), ...sources]
  }
  return serializeCsp(d)
}

// ---------------------------------------------------------------------------
// Compression helpers
// ---------------------------------------------------------------------------

/** Pick the best supported encoding from the Accept-Encoding header. */
function negotiateEncoding(req) {
  const accept = req.headers['accept-encoding'] || ''
  if (accept.includes('br'))   return 'br'
  if (accept.includes('gzip')) return 'gzip'
  return null
}

/** Compress a Buffer using the given encoding. Returns the original if none. */
async function compressBuffer(buf, encoding) {
  if (encoding === 'br')   return brotliAsync(buf)
  if (encoding === 'gzip') return gzipAsync(buf)
  return buf
}

/** Create a transform stream for the given encoding, or null. */
function createCompressor(encoding) {
  if (encoding === 'br')   return zlib.createBrotliCompress()
  if (encoding === 'gzip') return zlib.createGzip()
  return null
}

// ---------------------------------------------------------------------------
// Multipart form data parser
// ---------------------------------------------------------------------------

/**
 * Parse a multipart/form-data body Buffer into a plain object.
 *
 * Regular text fields → string values.
 * File fields         → { filename, type, data: Buffer, size }.
 * Repeated field names → array of values.
 *
 * @param {Buffer} buf        - Raw request body
 * @param {string} boundary   - Boundary string from the Content-Type header
 * @returns {Record<string, unknown>}
 */
function parseMultipart(buf, boundary) {
  const result  = {}
  const delim   = Buffer.from(`\r\n--${boundary}`)
  const first   = Buffer.from(`--${boundary}`)
  const CRLFX2  = Buffer.from('\r\n\r\n')

  let pos = buf.indexOf(first)
  if (pos === -1) return result
  pos += first.length

  while (pos < buf.length) {
    // After each boundary: \r\n = more parts, -- = final boundary
    if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break
    if (buf[pos] === 0x0d && buf[pos + 1] === 0x0a) pos += 2
    else break

    // Find next boundary — marks the end of this part's body
    const next = buf.indexOf(delim, pos)
    if (next === -1) break

    const part      = buf.subarray(pos, next)
    const headerEnd = part.indexOf(CRLFX2)
    if (headerEnd === -1) { pos = next + delim.length; continue }

    // Parse part headers
    const headerStr = part.subarray(0, headerEnd).toString('utf8')
    const body      = part.subarray(headerEnd + 4)
    const headers   = {}
    for (const line of headerStr.split('\r\n')) {
      const colon = line.indexOf(':')
      if (colon === -1) continue
      headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim()
    }

    // Extract name / filename from Content-Disposition
    const cd        = headers['content-disposition'] || ''
    const nameMatch = cd.match(/\bname="([^"]*)"/)
    const fileMatch = cd.match(/\bfilename="([^"]*)"/)
    if (!nameMatch) { pos = next + delim.length; continue }

    const name  = nameMatch[1]
    const value = fileMatch
      ? { filename: fileMatch[1], type: headers['content-type'] || 'application/octet-stream', data: body, size: body.length }
      : body.toString('utf8')

    // Support repeated names (e.g. checkboxes, multi-file inputs)
    const existing = result[name]
    if (existing !== undefined) {
      result[name] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    } else {
      result[name] = value
    }

    pos = next + delim.length
  }

  return result
}

// ---------------------------------------------------------------------------
// In-process TTL cache — server data memoization
// ---------------------------------------------------------------------------

class TtlCache {
  constructor() {
    this._store    = new Map()
    this._interval = null
  }

  get(key) {
    const entry = this._store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) { this._store.delete(key); return undefined }
    return entry.value
  }

  set(key, value, ttlSeconds) {
    this._store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  /** Remove all entries whose TTL has elapsed. */
  purgeExpired() {
    const now = Date.now()
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) this._store.delete(key)
    }
  }

  /**
   * Start a background eviction timer.
   * The interval is unref()'d so it never prevents the Node.js process from exiting.
   *
   * @param {number} intervalMs - how often to purge (default 60 000 ms)
   */
  startEviction(intervalMs = 60_000) {
    if (this._interval) return  // already running
    this._interval = setInterval(() => this.purgeExpired(), intervalMs).unref()
  }

  /** Stop the background eviction timer (used for graceful shutdown and tests). */
  stopEviction() {
    if (this._interval) { clearInterval(this._interval); this._interval = null }
  }
}

const serverDataCache = new TtlCache()
const pageHtmlCache   = new TtlCache()

serverDataCache.startEviction()
pageHtmlCache.startEviction()

// ---------------------------------------------------------------------------
// Cache-Control builder
// ---------------------------------------------------------------------------

/**
 * Normalise a cache config value.
 * Accepts a number (maxAge seconds), a boolean (true = public, maxAge=3600),
 * or an object { public, maxAge, staleWhileRevalidate }.
 */
function resolveCache(value) {
  if (!value) return null
  if (value === true)          return { public: true, maxAge: 3600, staleWhileRevalidate: 86400 }
  if (typeof value === 'number') return { public: true, maxAge: value }
  return value
}

/**
 * Build the Cache-Control value for an HTML response.
 * In dev mode always returns no-store.
 * spec.cache takes precedence over the server-level defaultCache.
 *
 * spec.cache / defaultCache:
 *   true                               → public, max-age=3600, stale-while-revalidate=86400
 *   number                             → public, max-age={n}
 *   { public, maxAge, staleWhileRevalidate }
 */
function buildCacheControl(spec, dev, defaultCache = null) {
  if (dev) return 'no-store'

  const cfg = resolveCache(spec?.cache) ?? resolveCache(defaultCache)
  if (!cfg) return 'no-store'

  const { public: isPublic = false, maxAge = 0, staleWhileRevalidate } = cfg
  const parts = [isPublic ? 'public' : 'private']
  if (maxAge > 0) parts.push(`max-age=${maxAge}`)
  if (staleWhileRevalidate) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  return parts.join(', ')
}

/**
 * Return the TTL in seconds for the in-process page cache,
 * or 0 if this response should not be cached in-process.
 */
function pageCacheTtl(spec, dev, defaultCache) {
  if (dev) return 0
  const cfg = resolveCache(spec?.cache) ?? resolveCache(defaultCache)
  return cfg?.maxAge || 0
}

// ---------------------------------------------------------------------------
// Dev import map — lets browser resolve @invisibleloop/pulse/* bare specifiers
// ---------------------------------------------------------------------------

/**
 * In dev mode, spec files use bare package specifiers (e.g. @invisibleloop/pulse/image)
 * so Node.js can resolve them during SSR. The browser can't resolve bare specifiers
 * without an import map, so we inject one in dev HTML responses.
 *
 * Must appear in <head> before any <script type="module">.
 */
/** Dev import map — lets browser resolve bare specifiers. Requires nonce for CSP. */
function devImportMap(nonce) {
  return `<script type="importmap" nonce="${nonce}">
{
  "imports": {
    "@invisibleloop/pulse/image": "/@pulse/runtime/image.js",
    "@invisibleloop/pulse/ui": "/@pulse/ui/index.js",
    "@invisibleloop/pulse/md": "/@pulse/md/browser-stub.js"
  }
}
</script>`
}

// ---------------------------------------------------------------------------
// Cached render — wraps renderToString with optional server-data TTL cache
// ---------------------------------------------------------------------------

/**
 * Render a spec to a string, optionally caching server data for `spec.serverTtl` seconds.
 *
 * In dev mode (or when serverTtl is not set) this is a pass-through to `renderToString`.
 * In prod with serverTtl set, server data fetcher results are memoized in-process and
 * the page is re-rendered with cached data on subsequent requests within the TTL window.
 *
 * @param {Object} spec
 * @param {Object} ctx
 * @param {boolean} dev
 * @returns {Promise<{ html: string, serverState: Object, timing: Object }>}
 */
async function cachedRenderToString(spec, ctx, dev) {
  if (dev || !spec.serverTtl) {
    return renderToString(spec, ctx)
  }

  // Build a cache key scoped to this route + request parameters
  const key = spec.route + '\0' + JSON.stringify(ctx.params) + '\0' + JSON.stringify(ctx.query)

  const cached = serverDataCache.get(key)
  if (cached) return cached

  const result = await renderToString(spec, ctx)
  serverDataCache.set(key, result, spec.serverTtl)
  return result
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
}

// ---------------------------------------------------------------------------
// createServer
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ServerOptions
 * @property {number}   [port=3000]
 * @property {boolean}  [stream=true]           - Use streaming SSR by default
 * @property {'remove'|'add'|'allow'} [trailingSlash='remove']
 *   - 'remove' — redirect /about/ → /about (301), canonical = no-slash (default)
 *   - 'add'    — redirect /about  → /about/ (301), canonical = slash
 *   - 'allow'  — serve both, no redirect, canonical = no-slash
 * @property {function} [onError]               - Error handler (err, req, res) => void
 * @property {function} [onRequest]             - Request hook (req, res) => void | false
 *                                                Return false to short-circuit routing
 */

// ---------------------------------------------------------------------------
// Spec entry resolution — URL objects are imported and get hydrate auto-set
// ---------------------------------------------------------------------------

/**
 * Returns true if the spec needs a client-side hydration script.
 * Specs with no mutations, actions, or persist are purely server-rendered.
 */
function needsHydration(spec) {
  return !!(spec.mutations && Object.keys(spec.mutations).length) ||
         !!(spec.actions   && Object.keys(spec.actions).length)   ||
         !!spec.persist
}

/**
 * Accept mixed arrays of spec objects and URL objects.
 * URL entries are dynamically imported; hydrate is auto-derived from the file
 * URL by stripping the project root, so developers never need to set it.
 *
 * root — a file: URL string or URL object for the project root directory.
 *        Defaults to process.cwd(). Pass `new URL('.', import.meta.url)` from
 *        your server.js for a CWD-independent alternative.
 */
async function resolveSpecEntries(entries, root) {
  // Normalise root to a href string ending with /
  let rootHref
  if (root instanceof URL) {
    rootHref = root.href.endsWith('/') ? root.href : root.href + '/'
  } else if (typeof root === 'string' && root.startsWith('file://')) {
    rootHref = root.endsWith('/') ? root : root + '/'
  } else {
    // Default: process.cwd() converted to a file URL
    rootHref = 'file://' + process.cwd().replace(/\\/g, '/') + '/'
  }

  const resolved = []
  for (const entry of entries) {
    if (!(entry instanceof URL)) {
      resolved.push(entry)
      continue
    }
    const mod  = await import(entry.href)
    const spec = mod.default ?? mod
    if (!spec.hydrate && needsHydration(spec)) {
      // Strip project root to get the browser-importable path
      const browserPath = entry.href.startsWith(rootHref)
        ? '/' + entry.href.slice(rootHref.length)
        : entry.pathname  // fallback: use pathname as-is
      resolved.push({ ...spec, hydrate: browserPath })
    } else {
      resolved.push(spec)
    }
  }
  return resolved
}

/**
 * Create and start a Pulse HTTP server.
 *
 * @param {Array<import('../spec/schema.js').PulseSpec|URL>} entries
 * @param {ServerOptions} [options]
 * @returns {Promise<{server: http.Server, shutdown: Function, updateSpecs: Function}>}
 */
export async function createServer(entries, options = {}) {
  const {
    port          = 3000,
    stream        = true,
    staticDir     = null,
    manifest      = null,          // path to manifest.json or plain object
    trailingSlash = 'remove',      // 'remove' | 'add' | 'allow'
    extraBody     = '',            // extra HTML injected before </body> on every page
    dev           = false,         // dev mode — show detailed error pages
    store         = null,          // global store definition (pulse.store.js default export)
    root          = null,          // URL/string — project root for deriving browser paths from file: URLs
    resolveBrand   = null,          // async (host) => brandConfig — keyed by domain
    defaultCache   = null,          // default page cache: true | seconds | { public, maxAge, swr }
    fetcherTimeout  = null,          // ms before any server fetcher times out (null = no limit)
    maxBody         = 1024 * 1024,  // max request body size in bytes (default 1 MB)
    shutdownTimeout = 30000,        // ms to wait for in-flight requests before force-exit
    healthCheck    = '/healthz',    // path for health check endpoint, or false to disable
    csp            = {},            // extra CSP sources: { 'style-src': ['https://fonts.googleapis.com'] }
    onError        = (err, req, res) => defaultErrorHandler(err, req, res, dev),
    onRequest
  } = options

  // Resolve URL entries → spec objects, auto-setting hydrate where needed
  const specs = await resolveSpecEntries(entries, root)

  const healthPath = healthCheck === true ? '/healthz' : (healthCheck || null)

  // Validate store at startup — fail fast before the server accepts connections
  if (store) {
    const { valid, errors } = validateStore(store)
    if (!valid) {
      throw new Error(`Invalid Pulse store:\n${errors.map(e => `  — ${e}`).join('\n')}`)
    }
  }

  // Per-host brand cache — avoids hitting the data store on every request
  const brandCache = new TtlCache()
  brandCache.startEviction(30_000)  // brand TTL is 60s, scan every 30s

  // Load manifest — maps source hydrate paths to production bundle paths
  const hydrateMap     = loadManifest(manifest, staticDir)
  const runtimeBundle  = hydrateMap['_runtime'] || ''

  // Auto-detect favicon in staticDir
  const faviconPath = staticDir
    ? ['/favicon.svg', '/favicon.ico', '/favicon.png'].find(f => fs.existsSync(path.join(staticDir, f))) || null
    : null

  // Validate all specs upfront — fail at startup, not at request time
  for (const spec of specs) {
    // Strip framework-injected `hydrate` before validation — the check for manually-set
    // hydrate only makes sense on raw source files (MCP validate tool), not here.
    const { hydrate: _h, ...specToValidate } = spec
    const { valid, errors } = validateSpec(specToValidate)
    const routeErrors = []
    if (!spec.route || typeof spec.route !== 'string') {
      routeErrors.push('spec.route is required and must be a string (e.g. "/contact")')
    } else if (!spec.route.startsWith('/')) {
      routeErrors.push('spec.route must start with "/" (e.g. "/contact")')
    }
    const allErrors = [...errors, ...routeErrors]
    if (!valid || routeErrors.length > 0) {
      throw new Error(
        `Invalid spec for route "${spec?.route}":\n` +
        allErrors.map(e => `  — ${e}`).join('\n')
      )
    }
  }

  // Build route table — let so it can be swapped on hot reload
  let router = buildRouter(specs)

  const server = http.createServer(async (req, res) => {
    try {
      // Parse URL — needed before health check and routing
      const url      = new URL(req.url, `http://localhost:${port}`)
      const pathname = url.pathname

      // Health check — before onRequest and routing so load balancers always get a response
      if (healthPath && pathname === healthPath && (req.method === 'GET' || req.method === 'HEAD')) {
        const body = JSON.stringify({ status: 'ok', uptime: process.uptime() })
        res.writeHead(200, {
          'Content-Type':  'application/json',
          'Cache-Control': 'no-store',
          ...SECURITY_HEADERS,
        })
        res.end(req.method === 'HEAD' ? undefined : body)
        return
      }

      // Request hook — allows middleware-like behaviour
      if (onRequest) {
        const result = onRequest(req, res)
        if (result === false) return
      }

      // Static file serving — GET/HEAD only
      if (staticDir && (req.method === 'GET' || req.method === 'HEAD')) {
        const served = serveStatic(req, res, staticDir, dev)
        if (served) return
      }

      // Trailing slash normalisation — GET/HEAD only (redirects don't apply to POST etc.)
      if ((req.method === 'GET' || req.method === 'HEAD') && pathname !== '/') {
        if (trailingSlash === 'remove' && pathname.endsWith('/')) {
          const target = pathname.slice(0, -1) + (url.search || '')
          res.writeHead(301, { Location: target, ...SECURITY_HEADERS, ...httpsHeaders(req) })
          res.end()
          return
        }
        if (trailingSlash === 'add' && !pathname.endsWith('/')) {
          const target = pathname + '/' + (url.search || '')
          res.writeHead(301, { Location: target, ...SECURITY_HEADERS, ...httpsHeaders(req) })
          res.end()
          return
        }
        // 'allow' — no redirect
      }

      // Match route
      const match = matchRoute(router, pathname)

      if (!match) {
        res.writeHead(404, { 'Content-Type': 'text/html', ...SECURITY_HEADERS, ...httpsHeaders(req) })
        res.end(notFoundHtml(pathname))
        return
      }

      // Method gating — raw response specs accept any HTTP method.
      // Page specs default to GET/HEAD only; opt in to other methods via spec.methods.
      if (!match.spec.contentType) {
        const allowed = match.spec.methods
          ? match.spec.methods.map(m => m.toUpperCase())
          : ['GET', 'HEAD']
        if (!allowed.includes(req.method)) {
          res.writeHead(405, {
            'Content-Type': 'text/plain',
            'Allow': allowed.join(', '),
            ...SECURITY_HEADERS, ...httpsHeaders(req)
          })
          res.end('Method Not Allowed')
          return
        }
      }

      // Per-request CSP nonce — fresh cryptographic random value for every response
      const nonce = crypto.randomBytes(16).toString('base64url')

      // Build request context passed to guard, server data fetchers, and render
      const ctx  = buildContext(req, url, match.params, nonce, maxBody)

      // Brand resolution — attach ctx.brand before guard or server data runs
      if (resolveBrand) {
        const host = req.headers.host || ''
        const cached = brandCache.get(host)
        if (cached !== undefined) {
          ctx.brand = cached
        } else {
          ctx.brand = await resolveBrand(host)
          brandCache.set(host, ctx.brand, 60)
        }
      }

      // Global store — resolve once per request, attach to ctx before guard/server fetchers.
      // Use global fetcherTimeout for store fetchers; spec-level override applied below.
      ctx.fetcherTimeout = fetcherTimeout ?? null
      if (store) {
        ctx.store = await resolveStoreState(store, ctx)
      }

      const spec = resolveSpec(match.spec, hydrateMap)

      // Per-spec timeout overrides the global default
      if (spec.serverTimeout != null) ctx.fetcherTimeout = spec.serverTimeout

      // Guard — per-route authorization check runs before any data fetching.
      // Can return:
      //   { redirect: '/path' }              — 302 redirect
      //   { status, body, headers?, json? }  — custom response (e.g. 422 + error JSON)
      if (typeof spec.guard === 'function') {
        const result = await spec.guard(ctx)
        if (result?.redirect) {
          res.writeHead(302, mergeCtxHeaders(ctx, { Location: result.redirect, ...SECURITY_HEADERS, ...httpsHeaders(req) }))
          res.end()
          return
        }
        if (result?.status) {
          const body    = result.json != null ? JSON.stringify(result.json) : (result.body ?? '')
          const ct      = result.json != null ? 'application/json' : (result.headers?.['Content-Type'] ?? 'text/plain')
          const headers = { 'Content-Type': ct, ...SECURITY_HEADERS, ...httpsHeaders(req), ...(result.headers || {}) }
          res.writeHead(result.status, mergeCtxHeaders(ctx, headers))
          res.end(body)
          return
        }
      }

      // Derive the canonical base URL from the request.
      // Canonical path follows the trailingSlash mode so the <link> is consistent with redirects.
      // spec.meta.canonical (string or function) is resolved inside each handler, where serverState
      // is available — allowing dynamic canonicals from server fetcher results.
      const proto        = req.headers['x-forwarded-proto'] || 'http'
      const host         = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${port}`
      const canonicalPath = trailingSlash === 'add' && pathname !== '/'
        ? (pathname.endsWith('/') ? pathname : pathname + '/')
        : (pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname)
      const canonicalBase = `${proto}://${host}${canonicalPath}`

      // Raw content spec (RSS, sitemap, JSON API, webhooks) — bypass HTML pipeline
      if (spec.contentType) {
        await handleRawResponse(spec, ctx, req, res, dev)
        return
      }

      // Client-side navigation request — return JSON fragment (or NDJSON stream), not a full document
      if (req.headers['x-pulse-navigate'] === 'true') {
        // Only use NDJSON streaming when there are actual deferred segments to stream.
        // For simple pages (no spec.stream.deferred), the JSON path is faster and does
        // not hold the HTTP/1.1 connection open for the duration of the stream.
        const hasDeferred = stream && spec.stream?.deferred?.length > 0
        if (hasDeferred) {
          await handleNavStreamResponse(spec, ctx, req, res)
        } else {
          await handleNavResponse(spec, ctx, res, dev)
        }
        return
      }

      if (stream) {
        await handleStreamResponse(spec, ctx, req, res, extraBody, dev, canonicalBase, nonce, runtimeBundle, defaultCache, store, csp, faviconPath)
      } else {
        await handleStringResponse(spec, ctx, req, res, extraBody, dev, canonicalBase, nonce, runtimeBundle, defaultCache, store, csp, faviconPath)
      }

    } catch (err) {
      if (err?.status === 413) {
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS })
          res.end('Request body too large')
        }
        return
      }
      onError(err, req, res)
    }
  })

  // ---------------------------------------------------------------------------
  // Connection tracking for graceful shutdown
  // ---------------------------------------------------------------------------

  // Map<socket, isActive> — true while a request is being handled
  const connections = new Map()

  server.on('connection', socket => {
    connections.set(socket, false)
    socket.on('close', () => connections.delete(socket))
  })

  // Mark socket active at request start, idle at response finish.
  // If we're already draining, destroy the socket as soon as it goes idle.
  server.on('request', (req, res) => {
    const socket = req.socket
    connections.set(socket, true)
    res.on('finish', () => {
      connections.set(socket, false)
      if (draining) socket.destroy()
    })
  })

  let draining = false

  function shutdown() {
    if (draining) return
    draining = true

    console.log('⚡ Pulse shutting down gracefully…')

    // Stop background cache eviction timers
    serverDataCache.stopEviction()
    pageHtmlCache.stopEviction()
    brandCache.stopEviction()

    // Stop accepting new connections; exit once all connections are closed
    server.close(() => process.exit(0))

    // Destroy sockets that are idle (keep-alive but between requests)
    for (const [socket, active] of connections) {
      if (!active) socket.destroy()
    }

    // Force-exit after shutdownTimeout so a stuck request can't block a deploy
    setTimeout(() => {
      console.error(`⚡ Pulse force-exiting after ${shutdownTimeout}ms shutdown timeout`)
      process.exit(1)
    }, shutdownTimeout).unref()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT',  shutdown)

  server.listen(port, () => {
    console.log(`⚡ Pulse running at http://localhost:${port}`)
  })

  return {
    server,
    shutdown,
    updateSpecs(newSpecs) {
      router = buildRouter(newSpecs)
    }
  }
}

// ---------------------------------------------------------------------------
// Response handlers
// ---------------------------------------------------------------------------

/**
 * Client-side navigation — render the body fragment and return it as JSON.
 * The browser swaps #pulse-root with the html, updates the title, re-mounts.
 */
async function handleNavResponse(spec, ctx, res, dev = false) {
  const { html, serverState } = await cachedRenderToString(spec, ctx, dev)
  const meta = await resolveMeta(spec.meta, ctx)

  const payload = JSON.stringify({
    html,
    title:       meta.title || 'Pulse',
    styles:      meta.styles || [],
    scripts:     meta.scripts || [],
    hydrate:     spec.hydrate  || null,
    serverState: Object.keys(serverState).length > 0 ? serverState : undefined,
    storeState:  ctx.store && Object.keys(ctx.store).length > 0 ? ctx.store : undefined,
  })

  res.writeHead(200, {
    'Content-Type':  'application/json',
    'Cache-Control': buildCacheControl(spec, dev),
    ...SECURITY_HEADERS,
  })
  res.end(payload)
}

/**
 * Client-side navigation — streaming NDJSON variant.
 * Sends meta immediately, then streams shell HTML and deferred segments
 * as their server data resolves. The browser applies chunks progressively,
 * showing shell content without waiting for slower deferred fetchers.
 */
async function handleNavStreamResponse(spec, ctx, req, res) {
  const meta = await resolveMeta(spec.meta, ctx)

  res.writeHead(200, {
    'Content-Type':      'application/x-ndjson',
    'Cache-Control':     'no-store',
    'X-Accel-Buffering': 'no',
    ...SECURITY_HEADERS,
  })

  const navStream = renderToNavStream(spec, ctx, meta)
  const reader    = navStream.getReader()

  // If the client disconnects (e.g. user navigated away before the stream ended),
  // cancel the reader immediately so the HTTP connection is freed rather than held
  // open until the navStream finishes naturally.
  const onClose = () => reader.cancel()
  req.on('close', onClose)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
  } catch {
    // Headers already sent — cannot change status, just end cleanly
  } finally {
    req.off('close', onClose)
    res.end()
  }
}

/**
 * Render to a complete string then send — simpler, easier to cache.
 * Checks the in-process page cache before rendering; stores result after.
 */
async function handleStringResponse(spec, ctx, req, res, extraBody = '', dev = false, canonicalBase = '', nonce = '', runtimeBundle = '', defaultCache = null, store = null, csp = {}, faviconPath = null) {
  const cacheKey = spec.route + '\0' + JSON.stringify(ctx.params) + '\0' + JSON.stringify(ctx.query)
  // Pages with server data or store data embed a nonce'd __PULSE_SERVER__ script — don't cache them
  const ttl      = (!spec.server && !spec.store?.length) ? pageCacheTtl(spec, dev, defaultCache) : 0

  let html, serverTimingValue, fromCache = false

  const cached = ttl > 0 ? pageHtmlCache.get(cacheKey) : null
  if (cached) {
    html       = cached.html
    fromCache  = true
  } else {
    const { html: content, serverState, timing } = await cachedRenderToString(spec, ctx, dev)
    // Resolve canonical — supports a function receiving (ctx, serverState) so the URL can be
    // derived from server fetcher results (e.g. a canonical slug from a database lookup).
    const canonicalRaw = spec.meta?.canonical
    const canonicalUrl = typeof canonicalRaw === 'function'
      ? (canonicalRaw(ctx, serverState) || canonicalBase)
      : (canonicalRaw || canonicalBase)
    const canonicalTag      = canonicalUrl ? `<link rel="canonical" href="${escHtml(canonicalUrl)}">` : ''
    const resolvedSpec      = { ...spec, meta: await resolveMeta(spec.meta, ctx) }
    const resolvedExtraBody = typeof extraBody === 'function' ? extraBody(nonce) : extraBody
    const wrapped           = wrapDocument({ content, spec: resolvedSpec, serverState, storeState: ctx.store || null, storeDef: store || null, timing, extraBody: resolvedExtraBody, extraHead: (dev ? devImportMap(nonce) + '\n  ' : '') + canonicalTag, nonce, runtimeBundle, faviconHref: faviconPath || '' })
    html              = wrapped.html
    serverTimingValue = wrapped.serverTimingValue
    if (ttl > 0) pageHtmlCache.set(cacheKey, { html }, ttl)
  }

  const encoding = negotiateEncoding(req)
  const buf      = await compressBuffer(Buffer.from(html, 'utf8'), encoding)

  const headers = mergeCtxHeaders(ctx, {
    'Content-Type':              'text/html; charset=utf-8',
    'Cache-Control':             buildCacheControl(spec, dev, defaultCache),
    'Content-Security-Policy':   fromCache ? buildCachedCsp(csp) : buildCsp(nonce, csp),
    'Vary':                      'Accept-Encoding',
    ...SECURITY_HEADERS,
    ...httpsHeaders(req),
  })
  if (encoding)          headers['Content-Encoding'] = encoding
  if (serverTimingValue) headers['Server-Timing']    = serverTimingValue

  res.writeHead(200, headers)
  res.end(buf)
}

/**
 * Stream the response — shell first, deferred segments follow.
 * On a page-cache hit, serves the buffered HTML as a string (no streaming needed).
 */
async function handleStreamResponse(spec, ctx, req, res, extraBody = '', dev = false, canonicalBase = '', nonce = '', runtimeBundle = '', defaultCache = null, store = null, csp = {}, faviconPath = null) {
  // Serve from in-process page cache when available — skip streaming overhead.
  // Pages with spec.server or spec.store embed a nonce'd __PULSE_SERVER__ script so are never cached.
  const cacheKey = spec.route + '\0' + JSON.stringify(ctx.params) + '\0' + JSON.stringify(ctx.query)
  const ttl      = (!spec.server && !spec.store?.length) ? pageCacheTtl(spec, dev, defaultCache) : 0
  const cached   = ttl > 0 ? pageHtmlCache.get(cacheKey) : null

  if (cached) {
    const encoding = negotiateEncoding(req)
    const buf      = await compressBuffer(Buffer.from(cached.html, 'utf8'), encoding)
    const headers  = mergeCtxHeaders(ctx, {
      'Content-Type':            'text/html; charset=utf-8',
      'Cache-Control':           buildCacheControl(spec, dev, defaultCache),
      'Content-Security-Policy': buildCachedCsp(csp),
      'Vary':                    'Accept-Encoding',
      ...SECURITY_HEADERS,
      ...httpsHeaders(req),
    })
    if (encoding) headers['Content-Encoding'] = encoding
    res.writeHead(200, headers)
    res.end(buf)
    return
  }
  const t0 = performance.now()

  // Write the document opening immediately so the browser starts parsing
  const meta  = await resolveMeta(spec.meta, ctx)
  const title = meta.title || 'Pulse'
  // Resolve canonical — supports a string or a function receiving (ctx).
  // Note: server fetcher results are not yet available when the <head> is written in streaming mode.
  // If your canonical depends on server data, use stream: false on that spec, or set it as a string.
  const canonicalRaw = spec.meta?.canonical
  const canonicalUrl = typeof canonicalRaw === 'function'
    ? (canonicalRaw(ctx) || canonicalBase)
    : (canonicalRaw || canonicalBase)

  // 103 Early Hints — browser starts fetching CSS/JS while server resolves data
  const earlyLinks = [
    ...(meta.styles || []).map(href => `<${href}>; rel=preload; as=style`),
    ...(runtimeBundle && spec.hydrate?.startsWith('/dist/') ? [`<${runtimeBundle}>; rel=modulepreload; as=script`] : []),
  ]
  if (earlyLinks.length > 0) {
    try { res.writeEarlyHints({ link: earlyLinks }) } catch {}
  }

  const stylePreloads = (meta.styles || [])
    .map(href => `  <link rel="preload" as="style" href="${escHtml(href)}">`)
    .join('\n')

  const runtimePreload = runtimeBundle && spec.hydrate?.startsWith('/dist/')
    ? `  <link rel="modulepreload" as="script" href="${escHtml(runtimeBundle)}">`
    : ''

  const metaTags = [
    canonicalUrl      ? `  <link rel="canonical" href="${escHtml(canonicalUrl)}">` : '',
    meta.description  ? `  <meta name="description" content="${escHtml(meta.description)}">` : '',
    meta.ogTitle      ? `  <meta property="og:title" content="${escHtml(meta.ogTitle)}">` : '',
    meta.ogImage      ? `  <meta property="og:image" content="${escHtml(meta.ogImage)}">` : '',
    ...(meta.styles || []).map((href, i) => `  <link rel="stylesheet" href="${escHtml(href)}"${i === 0 ? ' fetchpriority="high"' : ''}>`),
    (meta.deferredStyles || []).length > 0
      ? `  <script nonce="${nonce}">(function(){${
          (meta.deferredStyles || []).map(href =>
            `var l=document.createElement('link');l.rel='stylesheet';l.href='${escHtml(href)}';document.head.appendChild(l);`
          ).join('')
        }})();</script>`
      : '',
    meta.schema ? `  <script type="application/ld+json">${JSON.stringify(meta.schema)}</script>` : '',
  ].filter(Boolean).join('\n')

  const bodyAttr = meta.theme ? ` data-theme="${escHtml(meta.theme)}"` : ''

  const docOpen = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="${faviconPath || 'data:,'}">
  <title>${escHtml(title)}</title>
${stylePreloads ? stylePreloads + '\n' : ''}${runtimePreload ? runtimePreload + '\n' : ''}${dev ? devImportMap(nonce) + '\n' : ''}${metaTags}
</head>
<body${bodyAttr}>
  <div id="pulse-root">`

  const storeImport  = !spec.hydrate?.startsWith('/dist/') && store?.hydrate
    ? `\n  import store from '${escHtml(store.hydrate)}'`
    : ''
  const storeArg     = !spec.hydrate?.startsWith('/dist/') && store?.hydrate
    ? ', { ssr: true, store }'
    : ', { ssr: true }'

  const hydrateScript = spec.hydrate
    ? spec.hydrate.startsWith('/dist/')
      ? `\n  <script type="module" src="${escHtml(spec.hydrate)}"></script>`
      : `\n  <script type="module" nonce="${nonce}">
  import spec from '${escHtml(spec.hydrate)}'
  import { mount } from '/@pulse/runtime/index.js'
  import { initNavigation } from '/@pulse/runtime/navigate.js'${storeImport}
  const root = document.getElementById('pulse-root')
  mount(spec, root, window.__PULSE_SERVER__ || {}${storeArg})
  initNavigation(root, mount)
</script>`
    : ''

  const scriptTags = (meta.scripts || [])
    .map(src => `  <script src="${escHtml(src)}" defer></script>`)
    .join('\n')

  const resolvedExtraBody = typeof extraBody === 'function' ? extraBody(nonce) : extraBody

  // Emit window.__PULSE_STORE__ so the client store singleton can be initialised.
  // Also exposes __updatePulseStore__ for navigate.js to refresh store on navigation.
  // window.__PULSE_NONCE__ lets the toast runtime inject a nonce'd <style> tag to
  // satisfy the style-src CSP directive (which disallows uninonce'd inline styles).
  const storeScript = ctx.store && Object.keys(ctx.store).length > 0
    ? `\n  <script nonce="${nonce}">window.__PULSE_NONCE__='${nonce}';window.__PULSE_STORE__=${JSON.stringify(ctx.store)};window.__updatePulseStore__=function(s){window.__PULSE_STORE__=Object.assign(window.__PULSE_STORE__||{},s);};</script>`
    : spec.hydrate
      ? `\n  <script nonce="${nonce}">window.__PULSE_NONCE__='${nonce}';</script>`
      : ''

  const docClose = `
  </div>
  ${scriptTags}${storeScript}${hydrateScript}
  ${resolvedExtraBody}
</body>
</html>`

  const encoding   = negotiateEncoding(req)
  const compressor = createCompressor(encoding)

  const headers = mergeCtxHeaders(ctx, {
    'Content-Type':              'text/html; charset=utf-8',
    'Transfer-Encoding':         'chunked',
    'Cache-Control':             buildCacheControl(spec, dev, defaultCache),
    'Content-Security-Policy':   buildCsp(nonce, csp),
    'Vary':                      'Accept-Encoding',
    ...SECURITY_HEADERS,
    ...httpsHeaders(req),
  })
  if (encoding) headers['Content-Encoding'] = encoding

  res.writeHead(200, headers)

  // Route writes through the compressor (if any) → response
  const out   = compressor ?? res
  if (compressor) compressor.pipe(res)
  const write = (chunk) => out.write(chunk)
  const end   = (chunk) => out.end(chunk)

  // Buffer chunks so we can store the full HTML in the page cache after sending
  const chunks = ttl > 0 ? [docOpen] : null

  write(docOpen)

  try {
    // Pipe the spec's stream into the response
    const stream  = renderToStream(spec, ctx, nonce)
    const reader  = stream.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      write(chunk)
      chunks?.push(chunk)
    }

    // Inject server timing for client resumption
    const total = (performance.now() - t0).toFixed(2)
    const timingScript = `\n  <script nonce="${nonce}">window.__PULSE_TIMING__ = { total: ${total} };</script>`
    write(timingScript)
    // Timing script has a nonce — exclude from cache so cached HTML has no inline scripts
    chunks?.push(docClose)

    end(docClose)

    // Store assembled HTML in page cache for subsequent requests
    if (chunks) pageHtmlCache.set(cacheKey, { html: chunks.join('') }, ttl)
  } catch (err) {
    // Headers already sent — inject an error script that replaces pulse-root content.
    // JSON.stringify safely encodes the HTML for insertion into a script context.
    try {
      write(streamErrorScript(err, dev, nonce))
      end('\n</body>\n</html>')
    } catch {
      res.destroy()
    }
  }
}

/**
 * Raw content response — serves non-HTML content (RSS, sitemaps, JSON APIs, etc.)
 * Bypasses the HTML pipeline entirely. Resolves spec.server data, then calls
 * spec.render(ctx, serverState) to produce the response body.
 *
 * Supports: spec.server, spec.cache, spec.serverTtl — same as page specs.
 * Compresses text/*, *\/xml, and *\/json content types automatically.
 */
async function handleRawResponse(spec, ctx, req, res, dev) {
  let content

  if (!dev && spec.serverTtl) {
    const key = 'raw:' + spec.route + '\0' + JSON.stringify(ctx.params) + '\0' + JSON.stringify(ctx.query)
    content = serverDataCache.get(key)
    if (!content) {
      const serverState = await resolveServerState(spec, ctx)
      content = await spec.render(ctx, serverState)
      serverDataCache.set(key, content, spec.serverTtl)
    }
  } else {
    const serverState = await resolveServerState(spec, ctx)
    content = await spec.render(ctx, serverState)
  }

  // render() may return { redirect } instead of a string — used for auth callbacks etc.
  if (content && typeof content === 'object' && content.redirect) {
    res.writeHead(302, mergeCtxHeaders(ctx, { Location: content.redirect, ...SECURITY_HEADERS, ...httpsHeaders(req) }))
    res.end()
    return
  }

  const ct           = spec.contentType
  const compressible = /text\/|\/xml|\/json/.test(ct)
  const encoding     = compressible ? negotiateEncoding(req) : null
  const buf          = await compressBuffer(Buffer.from(content, 'utf8'), encoding)

  const headers = mergeCtxHeaders(ctx, {
    'Content-Type':  ct,
    'Cache-Control': buildCacheControl(spec, dev),
    ...SECURITY_HEADERS,
    ...httpsHeaders(req),
  })
  if (encoding)     headers['Content-Encoding'] = encoding
  if (compressible) headers['Vary'] = 'Accept-Encoding'

  res.writeHead(200, headers)
  res.end(buf)
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/**
 * Build a router from an array of specs.
 * Supports static routes (/about) and param routes (/products/:id).
 *
 * @param {import('../spec/schema.js').PulseSpec[]} specs
 * @returns {{ pattern: RegExp, params: string[], spec: Object }[]}
 */
function buildRouter(specs) {
  return specs.map(spec => {
    const { pattern, params } = routeToRegex(spec.route)
    return { pattern, params, spec }
  })
}

/**
 * Match a pathname against the router.
 * Returns the first match with extracted params, or null.
 *
 * @param {ReturnType<typeof buildRouter>} router
 * @param {string} pathname
 * @returns {{ spec: Object, params: Object } | null}
 */
function matchRoute(router, pathname) {
  for (const route of router) {
    const match = pathname.match(route.pattern)
    if (!match) continue

    const params = {}
    route.params.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1])
    })

    return { spec: route.spec, params }
  }
  return null
}

/**
 * Convert a route pattern to a regex.
 * /products/:id  → /^\/products\/([^/]+)\/?$/
 * /about         → /^\/about\/?$/
 *
 * @param {string} route
 * @returns {{ pattern: RegExp, params: string[] }}
 */
function routeToRegex(route) {
  const params  = []
  const pattern = route
    .replace(/:([^/]+)/g, (_, name) => { params.push(name); return '([^/]+)' })
    .replace(/\//g, '\\/')

  return {
    pattern: new RegExp(`^${pattern}\\/?$`),
    params
  }
}

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

/**
 * Build the context object passed to server data fetchers.
 * Includes parsed URL, route params, headers, and convenience helpers.
 *
 * @param {http.IncomingMessage} req
 * @param {URL} url
 * @param {Object} params
 * @returns {Object}
 */
function buildContext(req, url, params, nonce = '', maxBody = 1024 * 1024) {
  const _responseHeaders = []

  // Memoised body buffer — reads the request stream exactly once.
  // Returns a rejected promise if the body exceeds maxBody bytes.
  let _bodyPromise = null
  function _readBody() {
    if (_bodyPromise) return _bodyPromise
    _bodyPromise = new Promise((resolve, reject) => {
      const chunks = []
      let size = 0
      req.on('data', chunk => {
        size += chunk.length
        if (size > maxBody) {
          return reject(Object.assign(new Error(`Request body exceeds ${maxBody} bytes`), { status: 413 }))
        }
        chunks.push(chunk)
      })
      req.on('end',   () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })
    return _bodyPromise
  }

  return {
    // Route params — e.g. { id: '42' } for /products/:id
    params,

    // Query string — e.g. { q: 'widget' } for ?q=widget
    query: Object.fromEntries(url.searchParams),

    // Raw headers
    headers: req.headers,

    // Convenience
    pathname: url.pathname,
    method:   req.method,
    nonce,

    // Cookie helper — returns parsed cookies as a plain object
    get cookies() {
      return parseCookies(req.headers.cookie || '')
    },

    // ---------------------------------------------------------------------------
    // Body parsers — async, memoised, safe to call from guard or server fetchers
    // ---------------------------------------------------------------------------

    // Parse the request body as JSON.
    // Returns null when the body is empty.
    async json() {
      const buf = await _readBody()
      if (!buf.length) return null
      return JSON.parse(buf.toString('utf8'))
    },

    // Return the request body as a plain string.
    async text() {
      const buf = await _readBody()
      return buf.toString('utf8')
    },

    // Parse the request body into a plain object.
    // Handles application/x-www-form-urlencoded and multipart/form-data.
    // Multipart file fields are returned as { filename, type, data: Buffer, size }.
    // Returns null when the body is empty.
    async formData() {
      const buf = await _readBody()
      if (!buf.length) return null
      const ct = req.headers['content-type'] || ''
      if (ct.includes('multipart/form-data')) {
        const m = ct.match(/boundary=([^\s;]+)/)
        if (!m) return null
        return parseMultipart(buf, m[1].replace(/^"|"$/g, ''))
      }
      return Object.fromEntries(new URLSearchParams(buf.toString('utf8')))
    },

    // Return the raw request body as a Buffer.
    async buffer() {
      return _readBody()
    },

    // ---------------------------------------------------------------------------
    // Response helpers
    // ---------------------------------------------------------------------------

    // Set an arbitrary response header (e.g. Location, custom headers)
    setHeader(name, value) {
      _responseHeaders.push([name, value])
    },

    // Set a Set-Cookie response header with common options
    // opts: { httpOnly, secure, path, maxAge, sameSite, domain }
    setCookie(name, value, opts = {}) {
      let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
      if (opts.path     !== undefined) cookie += `; Path=${opts.path}`
      else                             cookie += `; Path=/`
      if (opts.maxAge   !== undefined) cookie += `; Max-Age=${opts.maxAge}`
      if (opts.domain   !== undefined) cookie += `; Domain=${opts.domain}`
      cookie += `; SameSite=${opts.sameSite ?? 'Lax'}`
      if (opts.httpOnly)               cookie += `; HttpOnly`
      if (opts.secure)                 cookie += `; Secure`
      _responseHeaders.push(['Set-Cookie', cookie])
    },

    // Internal — consumed by the response handlers
    _responseHeaders,
  }
}

/**
 * Merge response headers set via ctx.setHeader / ctx.setCookie into a headers
 * object suitable for res.writeHead(). Handles multiple Set-Cookie values.
 */
function mergeCtxHeaders(ctx, headers) {
  if (!ctx._responseHeaders.length) return headers
  const result = { ...headers }
  for (const [name, value] of ctx._responseHeaders) {
    const key = name.toLowerCase() === 'set-cookie' ? 'Set-Cookie' : name
    if (key === 'Set-Cookie') {
      const existing = result['Set-Cookie']
      result['Set-Cookie'] = existing
        ? (Array.isArray(existing) ? [...existing, value] : [existing, value])
        : [value]
    } else {
      result[key] = value
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Manifest & spec resolution
// ---------------------------------------------------------------------------

/**
 * Load a hydrate manifest.
 * Accepts a manifest object, a path to a JSON file, or auto-detects from
 * staticDir/dist/manifest.json when staticDir is set.
 *
 * @param {Object|string|null} manifest
 * @param {string|null} staticDir
 * @returns {Object} map of source paths → bundle paths
 */
function loadManifest(manifest, staticDir) {
  if (!manifest && !staticDir) return {}

  if (manifest && typeof manifest === 'object') return manifest

  const manifestPath = typeof manifest === 'string'
    ? manifest
    : staticDir ? path.join(staticDir, 'dist', 'manifest.json') : null

  if (!manifestPath) return {}

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * Return a copy of the spec with the hydrate path and any meta.styles paths
 * resolved to their production bundle paths (if manifest entries exist).
 *
 * @param {Object} spec
 * @param {Object} hydrateMap
 * @returns {Object}
 */
function resolveSpec(spec, hydrateMap) {
  let resolved = spec

  if (spec.hydrate && hydrateMap[spec.hydrate]) {
    resolved = { ...resolved, hydrate: hydrateMap[spec.hydrate] }
  }

  if (Array.isArray(spec.meta?.styles)) {
    const resolvedStyles = spec.meta.styles.map(href => hydrateMap[href] || href)
    if (resolvedStyles.some((s, i) => s !== spec.meta.styles[i])) {
      resolved = { ...resolved, meta: { ...resolved.meta, styles: resolvedStyles } }
    }
  }

  if (Array.isArray(spec.meta?.scripts)) {
    const resolvedScripts = spec.meta.scripts.map(href => hydrateMap[href] || href)
    if (resolvedScripts.some((s, i) => s !== spec.meta.scripts[i])) {
      resolved = { ...resolved, meta: { ...resolved.meta, scripts: resolvedScripts } }
    }
  }

  return resolved
}

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

/**
 * Attempt to serve a static file from staticDir.
 * Returns true if the file was served, false if not found.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse}  res
 * @param {string} staticDir - Absolute path to the static files directory
 * @returns {boolean}
 */
function serveStatic(req, res, staticDir, dev = false) {
  const url      = new URL(req.url, 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)

  // Prevent directory traversal
  const filePath = path.join(staticDir, pathname)
  if (!filePath.startsWith(staticDir + path.sep) && filePath !== staticDir) return false

  let stat
  try { stat = fs.statSync(filePath) } catch { return false }
  if (!stat.isFile()) return false

  const ext  = path.extname(filePath).toLowerCase()
  const mime = MIME_TYPES[ext] || 'application/octet-stream'

  // Content-hashed bundles under /dist/ can be cached indefinitely.
  // In dev, all other files get no-store so CSS/JS changes are reflected immediately.
  const isImmutable = pathname.startsWith('/dist/')
  const cache = isImmutable
    ? 'public, max-age=31536000, immutable'
    : dev ? 'no-store' : 'public, max-age=3600'

  // Only compress compressible text types
  const compressible = ['.js', '.css', '.html', '.json', '.svg'].includes(ext)
  const encoding     = compressible ? negotiateEncoding(req) : null
  const compressor   = createCompressor(encoding)

  const headers = {
    'Content-Type':  mime,
    'Cache-Control': cache,
    'Vary':          'Accept-Encoding',
    ...SECURITY_HEADERS,
  }
  if (encoding) headers['Content-Encoding'] = encoding

  res.writeHead(200, headers)
  const fileStream = fs.createReadStream(filePath)
  if (compressor) {
    fileStream.pipe(compressor).pipe(res)
  } else {
    fileStream.pipe(res)
  }
  return true
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Resolve any function values in spec.meta by calling them with ctx.
 * Allows meta.title, meta.styles, meta.description etc. to be per-request
 * functions — useful for multi-brand sites where values vary by domain.
 *
 * @param {Object|undefined} meta
 * @param {Object} ctx
 * @returns {Object}
 */
async function resolveMeta(meta, ctx) {
  if (!meta) return {}
  const resolved = {}
  await Promise.all(
    Object.entries(meta).map(async ([key, val]) => {
      resolved[key] = typeof val === 'function' ? await val(ctx) : val
    })
  )
  return resolved
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(pair => {
      const [key, ...rest] = pair.trim().split('=')
      return [key.trim(), decodeURIComponent(rest.join('=').trim())]
    })
  )
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function notFoundHtml(pathname) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>404 — Not Found</title></head>
<body>
  <h1>404</h1>
  <p>No route found for <code>${escHtml(pathname)}</code></p>
</body>
</html>`
}

function defaultErrorHandler(err, _req, res, dev = false) {
  console.error('[Pulse] Server error:', err)
  if (res.headersSent) return

  const html = dev ? errorPage(err) : errorPage500()
  res.writeHead(500, {
    'Content-Type': 'text/html; charset=utf-8',
    ...SECURITY_HEADERS,
  })
  res.end(html)
}

function errorPage(err) {
  const message = escHtml(err?.message || String(err))
  const stack   = escHtml(err?.stack   || '')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse Error</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #111; color: #f0f0f0; padding: 2rem; line-height: 1.5; }
    h1   { font-size: 1.25rem; color: #ff6b6b; margin-bottom: 1rem; display: flex; align-items: center; gap: .5rem; }
    h1::before { content: '⚠'; }
    .message { font-size: 1rem; color: #ffd6d6; background: #1e1010; border-left: 3px solid #ff6b6b; padding: .75rem 1rem; margin-bottom: 1.5rem; border-radius: 0 4px 4px 0; word-break: break-word; }
    pre  { font-size: .8rem; color: #999; background: #1a1a1a; padding: 1rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
    .label { font-size: .7rem; color: #555; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }
  </style>
</head>
<body>
  <h1>Pulse render error</h1>
  <div class="message">${message}</div>
  <div class="label">Stack trace</div>
  <pre>${stack}</pre>
</body>
</html>`
}

function streamErrorScript(err, dev, nonce = '') {
  const inner = dev
    ? `<div style="padding:1.5rem;font-family:system-ui,sans-serif;background:#1e1010;border-left:3px solid #ff6b6b;border-radius:0 4px 4px 0;margin:1rem">` +
      `<p style="color:#ff6b6b;font-weight:600;margin:0 0 .5rem">Pulse render error</p>` +
      `<p style="color:#ffd6d6;margin:0 0 1rem;word-break:break-word">${escHtml(err?.message || String(err))}</p>` +
      `<pre style="font-size:.75rem;color:#999;white-space:pre-wrap;word-break:break-word;margin:0">${escHtml(err?.stack || '')}</pre>` +
      `</div>`
    : `<div style="padding:2rem;text-align:center;font-family:system-ui,sans-serif;color:#666">Something went wrong.</div>`

  return `<script nonce="${nonce}">(function(){var r=document.getElementById('pulse-root');if(r)r.innerHTML=${JSON.stringify(inner)};})()</script>`
}

function errorPage500() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 — Server Error</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #111; color: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; }
    h1 { font-size: 4rem; color: #333; }
    p  { color: #666; margin-top: .5rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>500</h1>
    <p>Something went wrong.</p>
  </div>
</body>
</html>`
}
