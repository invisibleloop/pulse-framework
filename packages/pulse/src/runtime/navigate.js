/**
 * Pulse — Client-side navigation
 *
 * Intercepts same-origin <a> clicks, fetches the new page as a JSON fragment
 * (via X-Pulse-Navigate header), swaps #pulse-root, mounts the new spec.
 *
 * Handles browser back/forward via popstate.
 * Falls back to full page load on any error.
 */

import { trustedHTML } from './tt.js'

/**
 * Initialise navigation for a Pulse app.
 * Call once after the initial mount().
 *
 * @param {HTMLElement} root    - The #pulse-root element
 * @param {function}    mountFn - The mount() function from the runtime
 */
export function initNavigation(root, mountFn) {
  // Mark initial history entry so popstate can identify Pulse navigations
  // Keep the query string and fragment: this rewrites the address bar, so passing only the
  // pathname would silently drop ?q=… and #section from the URL the visitor landed on.
  const landed = location.pathname + (location.search || '') + (location.hash || '')
  history.replaceState({ pulse: true, path: landed }, '', landed)

  // The path (no fragment) of the page currently in the DOM, so a history step that only
  // changes the fragment is left to the browser instead of refetching the page.
  let shownPath = location.pathname + (location.search || '')

  // Track the current mount instance so we can destroy it (and its store
  // subscription) before mounting the next page.
  let currentMount = null
  let currentNavController = null

  // The target page has no client bundle (a purely server-rendered page), so nothing will mount
  // over the previous page's instance. Release it, or its listeners keep firing on the new DOM
  // and a store change re-renders the old view into it (#171). Call it immediately before the
  // new HTML replaces the old (never earlier: if the response is cut off first, the visitor
  // keeps a working page). keepDom: the caller swaps the root's content itself.
  function releaseCurrentMount() {
    const mount = currentMount
    currentMount = null            // cleared first, so a throwing destroy() cannot leave a stale reference
    mount?.destroy({ keepDom: true })
  }

  async function navigate(path, push) {
    // Cancel any in-flight navigation before starting a new one
    currentNavController?.abort()
    const controller = new AbortController()
    currentNavController = controller

    try {
      const res = await fetch(path, { headers: { 'X-Pulse-Navigate': 'true' }, signal: controller.signal })

      if (!res.ok) { location.href = path; return }

      const ct = res.headers.get('content-type') || ''

      if (ct.includes('application/x-ndjson')) {
        // Streaming nav response — apply chunks progressively as they arrive
        const reader  = res.body.getReader()
        // Explicitly cancel the reader when this navigation is superseded — aborting
        // the fetch signal does not reliably cancel an in-progress body stream reader
        // in all browsers, so we do it explicitly.
        controller.signal.addEventListener('abort', () => reader.cancel(), { once: true })
        const decoder = new TextDecoder()
        let buf              = ''
        let hydratePath      = null
        let finalServerState = {}
        const deferredSlots  = new Map()

        const processLine = async (line) => {
          if (!line.trim()) return
          const msg = JSON.parse(line)

          if (msg.type === 'meta') {
            hydratePath    = msg.hydrate
            document.title = msg.title || document.title
            applyStyles(msg.styles)
            await applyScripts(msg.scripts)

          } else if (msg.type === 'html') {
            if (!hydratePath) {
              if (controller.signal.aborted) return   // superseded: leave the old page alone
              releaseCurrentMount()
            }
            root.innerHTML = trustedHTML(msg.html)
            // Index <pulse-deferred> placeholders so deferred chunks land in the right spot
            for (const id of (msg.deferred || [])) {
              const el = root.querySelector(`[id="pd-${id}"]`)
              if (el) deferredSlots.set(id, el)
            }
            if (push) history.pushState({ pulse: true, path }, '', path)
            shownPath = withoutHash(path)
            scrollAndFocus(root, hashOf(path))

          } else if (msg.type === 'deferred') {
            const slot = deferredSlots.get(msg.id)
            if (slot) {
              const tmp = document.createElement('div')
              tmp.innerHTML = trustedHTML(msg.html)
              slot.replaceWith(...tmp.childNodes)
              deferredSlots.delete(msg.id)
            }

          } else if (msg.type === 'done') {
            if (msg.storeState && window.__updatePulseStore__) {
              window.__updatePulseStore__(msg.storeState)
            }
            finalServerState = msg.serverState || {}
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop()  // last element may be an incomplete line
          for (const line of lines) await processLine(line)
        }
        if (buf) await processLine(buf)

        // Bail out if a newer navigation superseded us while we were streaming
        if (controller.signal.aborted) return

        runScripts(root)
        document.dispatchEvent(new CustomEvent('pulse:navigate'))

        if (hydratePath && mountFn) {
          const { default: spec } = await import(/* @vite-ignore */ hydratePath)
          // A newer navigation may have started while the import was in flight —
          // bail out rather than destroying the already-mounted next page.
          if (controller.signal.aborted) return
          currentMount?.destroy()
          root.dataset.pulseMounted = '1'
          window.__PULSE_SERVER__ = finalServerState
          if (spec) currentMount = mountFn(spec, root, finalServerState)
        }

      } else {
        // Legacy JSON response (server running with stream: false)
        const { html, title, styles, scripts, hydrate, serverState, storeState } = await res.json()

        if (controller.signal.aborted) return

        if (storeState && window.__updatePulseStore__) {
          window.__updatePulseStore__(storeState)
        }

        if (!hydrate) releaseCurrentMount()
        root.innerHTML = trustedHTML(html)
        document.title = title || document.title
        applyStyles(styles)
        await applyScripts(scripts)
        runScripts(root)

        if (push) history.pushState({ pulse: true, path }, '', path)

        if (hydrate && mountFn) {
          const { default: spec } = await import(/* @vite-ignore */ hydrate)
          if (controller.signal.aborted) return
          currentMount?.destroy()
          root.dataset.pulseMounted = '1'
          window.__PULSE_SERVER__ = serverState || {}
          if (spec) currentMount = mountFn(spec, root, serverState || {})
        }

        document.dispatchEvent(new CustomEvent('pulse:navigate'))
        shownPath = withoutHash(path)
        scrollAndFocus(root, hashOf(path))
      }

    } catch (err) {
      if (err?.name === 'AbortError') return
      location.href = path
    }
  }

  // Intercept all <a> clicks on the document
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a')
    if (!a) return

    // Leave the click alone when something else already handled it, or it is not a plain
    // primary-button click on a navigation link.
    if (e.defaultPrevented) return
    if (e.button) return
    if (a.hasAttribute?.('download')) return

    const href = a.getAttribute('href')
    if (!href) return

    // Resolve against the document's base (the current URL, or <base href>), as the browser does:
    // on /blog/post, href="comments" is /blog/comments and href="?tab=2" is /blog/post?tab=2.
    // (Resolving against the origin alone sent both to the site root.)
    let url
    try { url = new URL(href, document.baseURI || location.href || location.origin) } catch { return }

    if (url.origin !== location.origin) return
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    if (a.target && a.target !== '_self') return

    // A fragment link to the page already shown ("#main-content", "/here#part"): the browser
    // scrolls to the target, moves focus to it and records the history entry itself.
    // Refetching would reset the scroll to the top and break skip links.
    if (href.startsWith('#') || (url.hash && url.pathname + url.search === location.pathname + location.search)) return

    e.preventDefault()
    navigate(url.pathname + url.search + url.hash, true)
  })

  // A fragment link the browser handled itself creates a history entry without Pulse state, so
  // stepping back onto it from another page would be ignored below. Mark it as ours.
  window.addEventListener('hashchange', () => {
    if (history.state?.pulse) return
    history.replaceState({ pulse: true, path: location.pathname + location.search + location.hash }, '')
  })

  // Handle browser back / forward
  window.addEventListener('popstate', (e) => {
    if (!e.state?.pulse) return
    // Back/forward between two fragments of the page already shown: the browser restores
    // the scroll position itself.
    if (location.pathname + location.search === shownPath) return
    navigate(location.pathname + location.search + location.hash, false)
  })

  // Return a setter so the initial mount instance can be registered for cleanup
  return {
    setMount: (m) => { currentMount = m }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Re-run any inline <script> tags inside el.
 * Browsers do not execute scripts injected via innerHTML, so after a navigation
 * swap we must clone each script element and append it to the document to fire it.
 */
function runScripts(el) {
  el.querySelectorAll('script:not([src])').forEach(old => {
    const s = document.createElement('script')
    s.textContent = old.textContent
    document.head.appendChild(s)
    s.remove()
  })
}

/** Inject any stylesheets not already present in <head>. */
function applyStyles(styles) {
  if (!Array.isArray(styles)) return
  const existing = new Set(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'))
  )
  for (const href of styles) {
    if (!existing.has(href)) {
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  }
}

/** Inject any external scripts not already present in <head>. Returns a Promise. */
function applyScripts(scripts) {
  if (!Array.isArray(scripts)) return Promise.resolve()
  const existingSrcs = new Set(
    [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'))
  )
  return Promise.all(
    scripts
      .filter(src => !existingSrcs.has(src))
      .map(src => new Promise((resolve) => {
        const script   = document.createElement('script')
        script.src     = src
        script.onload  = resolve
        script.onerror = resolve
        document.head.appendChild(script)
      }))
  )
}

const withoutHash = (path) => path.split('#')[0]
const hashOf = (path) => (path.includes('#') ? path.slice(path.indexOf('#')) : '')

/**
 * After a navigation: scroll to the fragment's element when the URL has one, otherwise to the
 * top. Focus moves to that element, or to the main landmark.
 */
function scrollAndFocus(root, hash = '') {
  let id = hash.slice(1)
  try { id = decodeURIComponent(id) } catch { /* keep the raw fragment */ }
  const anchor = id ? document.getElementById?.(id) : null

  if (anchor) anchor.scrollIntoView?.()
  else window.scrollTo({ top: 0, behavior: 'instant' })

  const focusTarget = anchor || root.querySelector('#main-content, main, h1') || root
  if (!focusTarget.hasAttribute('tabindex')) {
    focusTarget.setAttribute('tabindex', '-1')
    focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true })
  }
  focusTarget.focus({ preventScroll: true })
}
