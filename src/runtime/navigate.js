/**
 * Pulse — Client-side navigation
 *
 * Intercepts same-origin <a> clicks, fetches the new page as a JSON fragment
 * (via X-Pulse-Navigate header), swaps #pulse-root, mounts the new spec.
 *
 * Handles browser back/forward via popstate.
 * Falls back to full page load on any error.
 */

/**
 * Initialise navigation for a Pulse app.
 * Call once after the initial mount().
 *
 * @param {HTMLElement} root    - The #pulse-root element
 * @param {function}    mountFn - The mount() function from the runtime
 */
export function initNavigation(root, mountFn) {
  // Mark initial history entry so popstate can identify Pulse navigations
  history.replaceState({ pulse: true, path: location.pathname }, '', location.pathname)

  // Track the current mount instance so we can destroy it (and its store
  // subscription) before mounting the next page.
  let currentMount = null
  let currentNavController = null

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
            root.innerHTML = msg.html
            // Index <pulse-deferred> placeholders so deferred chunks land in the right spot
            for (const id of (msg.deferred || [])) {
              const el = root.querySelector(`[id="pd-${id}"]`)
              if (el) deferredSlots.set(id, el)
            }
            if (push) history.pushState({ pulse: true, path }, '', path)
            scrollAndFocus(root)

          } else if (msg.type === 'deferred') {
            const slot = deferredSlots.get(msg.id)
            if (slot) {
              const tmp = document.createElement('div')
              tmp.innerHTML = msg.html
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
          currentMount?.destroy()
          root.dataset.pulseMounted = '1'
          window.__PULSE_SERVER__ = finalServerState
          const { default: spec } = await import(/* @vite-ignore */ hydratePath)
          if (spec) currentMount = mountFn(spec, root, finalServerState)
        }

      } else {
        // Legacy JSON response (server running with stream: false)
        const { html, title, styles, scripts, hydrate, serverState, storeState } = await res.json()

        if (controller.signal.aborted) return

        if (storeState && window.__updatePulseStore__) {
          window.__updatePulseStore__(storeState)
        }

        root.innerHTML = html
        document.title = title || document.title
        applyStyles(styles)
        await applyScripts(scripts)
        runScripts(root)

        if (push) history.pushState({ pulse: true, path }, '', path)

        if (hydrate && mountFn) {
          currentMount?.destroy()
          root.dataset.pulseMounted = '1'
          window.__PULSE_SERVER__ = serverState || {}
          const { default: spec } = await import(/* @vite-ignore */ hydrate)
          if (spec) currentMount = mountFn(spec, root, serverState || {})
        }

        document.dispatchEvent(new CustomEvent('pulse:navigate'))
        scrollAndFocus(root)
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

    const href = a.getAttribute('href')
    if (!href) return

    let url
    try { url = new URL(href, location.origin) } catch { return }

    if (url.origin !== location.origin) return
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    if (a.target && a.target !== '_self') return

    e.preventDefault()
    navigate(url.pathname + url.search, true)
  })

  // Handle browser back / forward
  window.addEventListener('popstate', (e) => {
    if (e.state?.pulse) navigate(location.pathname + location.search, false)
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

/** Scroll to top and move focus to the main landmark. */
function scrollAndFocus(root) {
  window.scrollTo({ top: 0, behavior: 'instant' })
  const focusTarget = root.querySelector('#main-content, main, h1') || root
  if (!focusTarget.hasAttribute('tabindex')) {
    focusTarget.setAttribute('tabindex', '-1')
    focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true })
  }
  focusTarget.focus({ preventScroll: true })
}
