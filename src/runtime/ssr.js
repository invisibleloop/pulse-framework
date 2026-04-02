/**
 * Pulse — SSR Renderer
 *
 * Takes a spec and an HTTP request context.
 * Resolves server state, executes view functions, returns streamable HTML.
 *
 * Two modes:
 *   renderToString  — resolves everything, returns a complete HTML string
 *   renderToStream  — streams shell immediately, deferred segments follow
 *
 * No framework. No dependencies. Pure Node.js streams.
 */

import { assertValidSpec, getStreamOrder } from '../spec/schema.js'

// ---------------------------------------------------------------------------
// renderToString
// ---------------------------------------------------------------------------

/**
 * Render a spec to a complete HTML string.
 * Resolves all server state before rendering — no streaming.
 * Use this for simple pages or when you need the full HTML before sending.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} [ctx]        - Request context passed to server data fetchers
 * @param {Object} [pageState]  - Optional page-level state (from a parent layout)
 * @returns {Promise<{ html: string, serverState: Object, timing: Object }>}
 */
export async function renderToString(spec, ctx = {}, pageState = {}) {
  assertValidSpec(spec)

  const t0 = performance.now()

  // Resolve all server data in parallel
  const serverState = await resolveServerState(spec, ctx)

  // Merge declared store keys into server state — store keys lose to page-level keys
  const mergedServerState = mergeStoreKeys(spec, serverState, ctx.store)

  const tData = performance.now()

  // Merge initial client state with any page-level state
  const clientState = { ...spec.state, ...pageState }

  // Render all segments
  const html = renderSegments(spec, clientState, mergedServerState)

  const tRender = performance.now()

  return {
    html,
    serverState: mergedServerState,
    timing: {
      data:   +(tData   - t0).toFixed(2),
      render: +(tRender - tData).toFixed(2),
      total:  +(tRender - t0).toFixed(2)
    }
  }
}

// ---------------------------------------------------------------------------
// renderToStream
// ---------------------------------------------------------------------------

/**
 * Render a spec to a Node.js Readable stream.
 *
 * Shell segments are written immediately on the first flush.
 * Deferred segments are written as their server data resolves.
 * Each deferred segment is wrapped in a <pulse-chunk> element and
 * replaced client-side by a tiny inline script.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} [ctx]
 * @returns {ReadableStream} - Web Streams API ReadableStream
 */
export function renderToStream(spec, ctx = {}, nonce = '') {
  assertValidSpec(spec)

  const { shell, deferred } = getStreamOrder(spec)
  const clientState = { ...spec.state }

  let controller

  const stream = new ReadableStream({
    start(c) { controller = c }
  })

  // Run async — don't await here, stream is returned immediately
  ;(async () => {
    try {
      const timeout = ctx.fetcherTimeout ?? null

      // Eagerly start ALL fetcher promises so shell and deferred run in parallel.
      // Each fetcher runs at most once — deferred-scoped fetchers fire immediately
      // rather than waiting for the shell to finish, and shared fetchers are
      // never called twice even if referenced by multiple segments.
      const fetcherCache = new Map()
      if (spec.server) {
        for (const [key, fn] of Object.entries(spec.server)) {
          fetcherCache.set(key, withTimeout(fn(ctx), timeout, key))
        }
      }

      // Await only the fetchers the shell segments need
      const shellServerState = await awaitFetchersForSegments(spec, shell, fetcherCache)
      const mergedShellState = mergeStoreKeys(spec, shellServerState, ctx.store)

      // Write shell immediately — deferred fetchers may still be in-flight
      const shellHtml = renderNamedSegments(spec, shell, clientState, mergedShellState)
      controller.enqueue(encode(shellHtml))

      if (deferred.length > 0) {
        // Placeholders so the browser knows where to insert deferred content
        const placeholders = deferred
          .map(key => `<pulse-deferred id="pd-${key}"></pulse-deferred>`)
          .join('')
        controller.enqueue(encode(placeholders))

        // Stream each deferred segment as soon as its own fetchers resolve.
        // Promise.all runs them concurrently — the fastest segment wins.
        await Promise.all(deferred.map(async (key) => {
          const segServerState = await awaitFetchersForSegments(spec, [key], fetcherCache)
          const mergedSegState = mergeStoreKeys(spec, segServerState, ctx.store)
          const segHtml        = renderNamedSegments(spec, [key], clientState, mergedSegState)

          // Inline script replaces the placeholder with the rendered content
          const chunk = `
            <template id="pt-${key}">${segHtml}</template>
            <script nonce="${nonce}">
              (function() {
                var t = document.getElementById('pt-${key}');
                var p = document.getElementById('pd-${key}');
                if (t && p) { p.replaceWith(t.content.cloneNode(true)); t.remove(); }
              })();
            </script>`

          controller.enqueue(encode(chunk))
        }))
      }

      // Collect all resolved server state for client hydration.
      // All promises are already settled by the time we reach here.
      const allServerState = fetcherCache.size > 0
        ? Object.fromEntries(await Promise.all([...fetcherCache.entries()].map(async ([k, p]) => [k, await p])))
        : {}
      const mergedAllState = mergeStoreKeys(spec, allServerState, ctx.store)
      if (spec.hydrate && Object.keys(mergedAllState).length > 0) {
        controller.enqueue(encode(
          `<script nonce="${nonce}">window.__PULSE_SERVER__ = ${JSON.stringify(mergedAllState)};</script>`
        ))
      }

      controller.close()
    } catch (err) {
      controller.error(err)
    }
  })()

  return stream
}

// ---------------------------------------------------------------------------
// renderToNavStream
// ---------------------------------------------------------------------------

/**
 * Render a spec to a stream of newline-delimited JSON (NDJSON) messages
 * for use during client-side navigation. Sends four message types:
 *
 *   { type: 'meta',     title, styles, scripts, hydrate }  — immediately
 *   { type: 'html',     html, deferred }                   — shell ready
 *   { type: 'deferred', id, html }                         — each deferred segment
 *   { type: 'done',     serverState, storeState }          — all data resolved
 *
 * The client (navigate.js) reads lines as they arrive:
 *   - meta  → updates title + stylesheets
 *   - html  → swaps root.innerHTML (shell), finds <pulse-deferred> placeholders
 *   - deferred → replaces the matching placeholder with rendered HTML
 *   - done  → stores serverState, mounts spec
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} [ctx]
 * @param {Object} [resolvedMeta]  - Pre-resolved meta (title, styles, scripts)
 * @returns {ReadableStream}
 */
export function renderToNavStream(spec, ctx = {}, resolvedMeta = {}) {
  assertValidSpec(spec)

  const { shell, deferred } = getStreamOrder(spec)
  const clientState = { ...spec.state }

  let controller
  const stream = new ReadableStream({ start(c) { controller = c } })

  ;(async () => {
    try {
      const timeout = ctx.fetcherTimeout ?? null
      const writeLine = (obj) => controller.enqueue(encode(JSON.stringify(obj) + '\n'))

      // Eagerly start ALL fetcher promises so shell and deferred run in parallel
      const fetcherCache = new Map()
      if (spec.server) {
        for (const [key, fn] of Object.entries(spec.server)) {
          fetcherCache.set(key, withTimeout(fn(ctx), timeout, key))
        }
      }

      // 1. Send meta immediately — no data fetching needed
      writeLine({
        type:    'meta',
        title:   resolvedMeta.title   || 'Pulse',
        styles:  resolvedMeta.styles  || [],
        scripts: resolvedMeta.scripts || [],
        hydrate: spec.hydrate || null,
      })

      // 2. Await shell fetchers then send shell HTML
      const shellServerState = await awaitFetchersForSegments(spec, shell, fetcherCache)
      const mergedShellState = mergeStoreKeys(spec, shellServerState, ctx.store)
      let shellHtml = renderNamedSegments(spec, shell, clientState, mergedShellState)

      // Append <pulse-deferred> placeholders so the client knows where to inject deferred content
      if (deferred.length > 0) {
        shellHtml += deferred.map(key => `<pulse-deferred id="pd-${key}"></pulse-deferred>`).join('')
      }

      writeLine({ type: 'html', html: shellHtml, deferred })

      // 3. Stream each deferred segment as soon as its own fetchers resolve
      await Promise.all(deferred.map(async (key) => {
        const segServerState = await awaitFetchersForSegments(spec, [key], fetcherCache)
        const mergedSegState = mergeStoreKeys(spec, segServerState, ctx.store)
        const segHtml        = renderNamedSegments(spec, [key], clientState, mergedSegState)
        writeLine({ type: 'deferred', id: key, html: segHtml })
      }))

      // 4. Collect all resolved server state then send done
      const allServerState = fetcherCache.size > 0
        ? Object.fromEntries(await Promise.all([...fetcherCache.entries()].map(async ([k, p]) => [k, await p])))
        : {}
      const mergedAll = mergeStoreKeys(spec, allServerState, ctx.store)

      writeLine({
        type:        'done',
        serverState: Object.keys(mergedAll).length > 0 ? mergedAll : undefined,
        storeState:  ctx.store && Object.keys(ctx.store).length > 0 ? ctx.store : undefined,
      })

      controller.close()
    } catch (err) {
      controller.error(err)
    }
  })()

  return stream
}

// ---------------------------------------------------------------------------
// Page HTML wrapper — shared script builders
// ---------------------------------------------------------------------------

/**
 * Build the inline script that exposes window.__PULSE_NONCE__ and (optionally)
 * window.__PULSE_STORE__ to the client runtime.
 *
 * Only emitted for hydrated pages. Purely server-rendered pages have no JS to
 * read these globals, and omitting the inline script keeps cached HTML nonce-free
 * so it can be served with a nonce-free CSP without a CSP violation.
 */
export function buildStoreScript(spec, storeState, nonce) {
  if (!spec.hydrate) return ''
  if (storeState && Object.keys(storeState).length > 0) {
    return `<script nonce="${nonce}">window.__PULSE_NONCE__='${nonce}';window.__PULSE_STORE__=${JSON.stringify(storeState)};window.__updatePulseStore__=function(s){window.__PULSE_STORE__=Object.assign(window.__PULSE_STORE__||{},s);};</script>`
  }
  return `<script nonce="${nonce}">window.__PULSE_NONCE__='${nonce}';</script>`
}

/**
 * Build the hydration <script> tag that mounts the spec client-side.
 *
 * Bundle paths (/dist/) → a single external <script type="module" src="..."> tag.
 * Dev source paths       → an inline module block with explicit imports (nonce required).
 */
export function buildHydrateScript(spec, storeDef, nonce) {
  if (!spec.hydrate) return ''
  if (isBundle(spec.hydrate)) {
    return `<script type="module" src="${esc(spec.hydrate)}"></script>`
  }
  const storeImport = storeDef?.hydrate ? `\n  import store from '${esc(storeDef.hydrate)}'` : ''
  const storeArg    = storeDef?.hydrate ? ', { ssr: true, store }' : ', { ssr: true }'
  return `<script type="module" nonce="${nonce}">
  import spec from '${esc(spec.hydrate)}'
  import { mount } from '/@pulse/runtime/index.js'
  import { initNavigation } from '/@pulse/runtime/navigate.js'${storeImport}
  const root = document.getElementById('pulse-root')
  mount(spec, root, window.__PULSE_SERVER__ || {}${storeArg})
  initNavigation(root, mount)
</script>`
}

/**
 * Wrap rendered content in a full HTML document.
 *
 * @param {Object} options
 * @param {string}  options.content      - The rendered body content
 * @param {Object}  [options.spec]       - The spec (used for meta, title)
 * @param {Object}  [options.serverState] - Serialised for client resumption
 * @param {Object}  [options.timing]     - Server-Timing values
 * @returns {string}
 */
export function wrapDocument({ content, spec = {}, serverState = {}, storeState = null, storeDef = null, timing = {}, extraBody = '', extraHead = '', nonce = '', runtimeBundle = '', faviconHref = '' }) {
  const meta  = spec.meta  || {}
  const title = meta.title || 'Pulse'

  const bodyAttr = meta.theme ? ` data-theme="${esc(meta.theme)}"` : ''

  const metaTags = [
    meta.description ? `<meta name="description" content="${esc(meta.description)}">` : '',
    meta.ogTitle     ? `<meta property="og:title" content="${esc(meta.ogTitle)}">` : '',
    meta.ogImage     ? `<meta property="og:image" content="${esc(meta.ogImage)}">` : '',
  ].filter(Boolean).join('\n  ')

  const stylePreloads = (meta.styles || [])
    .map(href => `<link rel="preload" as="style" href="${esc(href)}">`)
    .join('\n  ')

  const runtimePreload = runtimeBundle && isBundle(spec.hydrate)
    ? `<link rel="modulepreload" as="script" href="${esc(runtimeBundle)}">`
    : ''

  const styleLinks = (meta.styles || [])
    .map((href, i) => `<link rel="stylesheet" href="${esc(href)}"${i === 0 ? ' fetchpriority="high"' : ''}>`)
    .join('\n  ')

  // Deferred styles — injected via a nonce'd script so CSP is respected.
  // Dynamically-inserted <link rel="stylesheet"> elements are non-render-blocking.
  const deferredStyleLinks = (meta.deferredStyles || []).length > 0
    ? `<script nonce="${nonce}">(function(){${
        (meta.deferredStyles || []).map(href =>
          `var l=document.createElement('link');l.rel='stylesheet';l.href='${esc(href)}';document.head.appendChild(l);`
        ).join('')
      }})();</script>`
    : ''

  const scriptTags = (meta.scripts || [])
    .map(src => `<script src="${esc(src)}" defer></script>`)
    .join('\n  ')

  const schemaScript = meta.schema
    ? `<script type="application/ld+json">${JSON.stringify(meta.schema)}</script>`
    : ''

  // Serialise server state into the page so the client runtime can read it
  // without making a second request. Only needed when the page is hydrated —
  // purely server-rendered pages have no JS to read it.
  const serverStateScript = spec.hydrate && Object.keys(serverState).length > 0
    ? `<script nonce="${nonce}">window.__PULSE_SERVER__ = ${JSON.stringify(serverState)};</script>`
    : ''

  const storeStateScript = buildStoreScript(spec, storeState, nonce)
  const hydrateScript    = buildHydrateScript(spec, storeDef, nonce)

  // Server-Timing header value (caller is responsible for setting the header)
  const serverTimingValue = timing.total !== undefined
    ? `data;dur=${timing.data}, render;dur=${timing.render}, total;dur=${timing.total}`
    : null

  return {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="${faviconHref || 'data:,'}">
  <title>${esc(title)}</title>
  ${stylePreloads}
  ${runtimePreload}
  ${extraHead}
  ${metaTags}
  ${styleLinks}
  ${deferredStyleLinks}
  ${schemaScript}
</head>
<body${bodyAttr}>
  <a href="#main-content" class="pulse-skip-link">Skip to main content</a>
  <div id="pulse-root">
    ${content}
  </div>
  ${storeStateScript}
  ${serverStateScript}
  ${scriptTags}
  ${hydrateScript}
  ${extraBody}
</body>
</html>`,
    serverTimingValue
  }
}

// ---------------------------------------------------------------------------
// Internal — store state merging
// ---------------------------------------------------------------------------

/**
 * Merge declared store keys into a server state object.
 * Only keys listed in spec.store are included — nothing leaks from the store
 * to pages that don't declare a dependency on it.
 * Page-level server state always wins over store values with the same key.
 *
 * @param {Object} spec
 * @param {Object} serverState
 * @param {Object} [storeState]
 * @returns {Object}
 */
function mergeStoreKeys(spec, serverState, storeState) {
  if (!spec.store?.length || !storeState) return serverState
  const slice = {}
  for (const key of spec.store) {
    if (storeState[key] !== undefined) slice[key] = storeState[key]
  }
  return { ...slice, ...serverState }
}

// ---------------------------------------------------------------------------
// Internal — server state resolution
// ---------------------------------------------------------------------------

/**
 * Resolve all server data fetchers in parallel.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} ctx
 * @returns {Promise<Object>}
 */
export async function resolveServerState(spec, ctx) {
  if (!spec.server) return {}

  const timeout = ctx.fetcherTimeout ?? null

  const entries = await Promise.all(
    Object.entries(spec.server).map(async ([key, fn]) => {
      const value = await withTimeout(fn(ctx), timeout, key)
      return [key, value]
    })
  )

  return Object.fromEntries(entries)
}

/**
 * Await the subset of already-started fetcher promises that the given
 * segment group needs. Uses spec.stream.scope when declared; falls back
 * to all fetchers when a segment has no scope annotation.
 *
 * Fetchers are never started here — they were all started eagerly at the
 * top of renderToStream via the fetcherCache Map.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {string[]} segmentKeys
 * @param {Map<string, Promise>} fetcherCache
 * @returns {Promise<Object>}
 */
async function awaitFetchersForSegments(spec, segmentKeys, fetcherCache) {
  if (!spec.server || fetcherCache.size === 0) return {}

  const neededKeys = getScopedFetcherKeys(spec, segmentKeys)

  const entries = await Promise.all(
    neededKeys
      .filter(key => fetcherCache.has(key))
      .map(async key => [key, await fetcherCache.get(key)])
  )

  return Object.fromEntries(entries)
}

/**
 * Return the server fetcher keys needed by a set of segments.
 * Uses spec.stream.scope when declared. Segments not listed in scope
 * receive all server keys (safe default — same behaviour as before).
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {string[]} segmentKeys
 * @returns {string[]}
 */
function getScopedFetcherKeys(spec, segmentKeys) {
  if (!spec.server) return []

  const scope = spec.stream?.scope
  if (!scope) return Object.keys(spec.server)  // no annotation → all fetchers

  const needed = new Set()
  for (const seg of segmentKeys) {
    const scoped = scope[seg]
    if (!scoped) return Object.keys(spec.server)  // unscoped segment → all fetchers
    for (const key of scoped) needed.add(key)
  }
  return [...needed]
}

// ---------------------------------------------------------------------------
// Internal — view rendering
// ---------------------------------------------------------------------------

/**
 * Render all view segments to a single HTML string.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} clientState
 * @param {Object} serverState
 * @returns {string}
 */
function renderSegments(spec, clientState, serverState) {
  try {
    if (typeof spec.view === 'function') {
      return spec.view(clientState, serverState)
    }
    return Object.entries(spec.view)
      .map(([, fn]) => fn(clientState, serverState))
      .join('')
  } catch (err) {
    // If the spec declares a custom error renderer, use it and continue.
    // Otherwise rethrow — the server's existing error handler (dev/prod pages) takes over.
    if (spec.onViewError) {
      console.error('[Pulse SSR] View error (caught by onViewError):', err)
      return spec.onViewError(err, clientState, serverState)
    }
    throw err
  }
}

/**
 * Render a named subset of view segments.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {string[]} keys
 * @param {Object} clientState
 * @param {Object} serverState
 * @returns {string}
 */
function renderNamedSegments(spec, keys, clientState, serverState) {
  try {
    if (typeof spec.view === 'function') {
      return spec.view(clientState, serverState)
    }
    return keys
      .map(key => {
        if (!spec.view[key]) {
          console.warn(`[Pulse SSR] View segment "${key}" not found`)
          return ''
        }
        return spec.view[key](clientState, serverState)
      })
      .join('')
  } catch (err) {
    if (spec.onViewError) {
      console.error('[Pulse SSR] View error (caught by onViewError):', err)
      return spec.onViewError(err, clientState, serverState)
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Race a promise against a timeout rejection.
 * Returns the promise result if it resolves within `ms`.
 * Rejects with a descriptive error if the timeout fires first.
 * No-op when ms is falsy (null / 0 / undefined).
 *
 * @param {Promise<any>} promise
 * @param {number|null}  ms     - Timeout in milliseconds
 * @param {string}       name   - Fetcher key for error messages
 * @returns {Promise<any>}
 */
export function withTimeout(promise, ms, name) {
  if (!ms) return promise
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Server fetcher "${name}" timed out after ${ms}ms`)),
        ms
      )
    )
  ])
}

const encoder = new TextEncoder()

function encode(str) {
  return encoder.encode(str)
}

/**
 * Returns true when the hydrate path points to a pre-built self-executing
 * bundle (i.e. resolved via the manifest) rather than a raw source file.
 * Bundles live under /dist/ and carry a content hash in their filename.
 *
 * @param {string} hydratePath
 * @returns {boolean}
 */
function isBundle(hydratePath) {
  return hydratePath.startsWith('/dist/')
}

/**
 * Escape HTML special characters for safe attribute insertion.
 */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
