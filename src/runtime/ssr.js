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
      // Resolve shell server data (only what shell segments need)
      const shellServerState = await resolveServerStateForSegments(spec, ctx, shell)

      // Merge declared store keys — store keys lose to page-level keys
      const mergedShellState = mergeStoreKeys(spec, shellServerState, ctx.store)

      // Write shell immediately
      const shellHtml = renderNamedSegments(spec, shell, clientState, mergedShellState)
      controller.enqueue(encode(shellHtml))

      // Write deferred segments as they resolve
      if (deferred.length > 0) {
        // Enqueue placeholder elements so the browser knows where to insert
        const placeholders = deferred
          .map(key => `<pulse-deferred id="pd-${key}"></pulse-deferred>`)
          .join('')
        controller.enqueue(encode(placeholders))

        // Resolve and stream each deferred segment
        await Promise.all(deferred.map(async (key) => {
          const segServerState = await resolveServerStateForSegments(spec, ctx, [key])
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

      // Inject server state so the client hydration can read it without
      // a second request — mirrors what wrapDocument does for the string path.
      // Emit when there is page server data or store data to serialise.
      if (Object.keys(mergedShellState).length > 0) {
        const script = `<script nonce="${nonce}">window.__PULSE_SERVER__ = ${JSON.stringify(mergedShellState)};</script>`
        controller.enqueue(encode(script))
      }

      controller.close()
    } catch (err) {
      controller.error(err)
    }
  })()

  return stream
}

// ---------------------------------------------------------------------------
// Page HTML wrapper
// ---------------------------------------------------------------------------

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
  // without making a second request
  const serverStateScript = Object.keys(serverState).length > 0
    ? `<script nonce="${nonce}">window.__PULSE_SERVER__ = ${JSON.stringify(serverState)};</script>`
    : ''

  // Serialise store state so the client store singleton can be initialised.
  // Also exposes window.__updatePulseStore__ so navigate.js can refresh the
  // singleton with fresh server data on client-side navigations.
  const storeStateScript = storeState && Object.keys(storeState).length > 0
    ? `<script nonce="${nonce}">window.__PULSE_STORE__=${JSON.stringify(storeState)};window.__updatePulseStore__=function(s){window.__PULSE_STORE__=Object.assign(window.__PULSE_STORE__||{},s);};</script>`
    : ''

  // Hydration bootstrap — makes the server-rendered HTML interactive.
  // When hydrate points to a self-executing bundle (/dist/…) a single <script>
  // tag is enough; the bundle imports spec + runtime and calls mount() itself.
  // In dev mode (source file path) we emit the explicit inline import block.
  const storeImport  = spec.hydrate && !isBundle(spec.hydrate) && storeDef?.hydrate
    ? `\n  import store from '${esc(storeDef.hydrate)}'`
    : ''
  const storeArg     = spec.hydrate && !isBundle(spec.hydrate) && storeDef?.hydrate
    ? ', { ssr: true, store }'
    : ', { ssr: true }'

  const hydrateScript = spec.hydrate
    ? isBundle(spec.hydrate)
      ? `<script type="module" src="${esc(spec.hydrate)}"></script>`
      : `<script type="module" nonce="${nonce}">
  import spec from '${esc(spec.hydrate)}'
  import { mount } from '/@pulse/runtime/index.js'
  import { initNavigation } from '/@pulse/runtime/navigate.js'${storeImport}
  const root = document.getElementById('pulse-root')
  mount(spec, root, window.__PULSE_SERVER__ || {}${storeArg})
  initNavigation(root, mount)
</script>`
    : ''

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
 * Resolve server data for a specific set of segments only.
 * Used by the streaming renderer to avoid fetching deferred data
 * before the shell is sent.
 *
 * Currently resolves all server state — segment-level data dependencies
 * will be an opt-in annotation in a future iteration.
 *
 * @param {import('../spec/schema.js').PulseSpec} spec
 * @param {Object} ctx
 * @param {string[]} _segments - Segment keys (reserved for future scoping)
 * @returns {Promise<Object>}
 */
async function resolveServerStateForSegments(spec, ctx, _segments) {
  return resolveServerState(spec, ctx)
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
