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

  async function navigate(path, push) {
    try {
      const res = await fetch(path, { headers: { 'X-Pulse-Navigate': 'true' } })

      if (!res.ok) { location.href = path; return }

      const { html, title, styles, scripts, hydrate, serverState, storeState } = await res.json()

      // Update the client store singleton with fresh server-resolved store data.
      if (storeState && typeof window !== 'undefined' && window.__updatePulseStore__) {
        window.__updatePulseStore__(storeState)
      }

      root.innerHTML = html
      document.title = title || document.title

      if (Array.isArray(styles)) {
        const existing = new Set(
          [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'))
        )
        for (const href of styles) {
          if (!existing.has(href)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = href
            document.head.appendChild(link)
          }
        }
      }

      if (Array.isArray(scripts)) {
        const existingSrcs = new Set(
          [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'))
        )
        await Promise.all(scripts
          .filter(src => !existingSrcs.has(src))
          .map(src => new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = resolve
            script.onerror = resolve
            document.head.appendChild(script)
          }))
        )
      }

      runScripts(root)

      if (push) history.pushState({ pulse: true, path }, '', path)

      if (hydrate && mountFn) {
        // Destroy the previous mount to clean up its store subscription
        currentMount?.destroy()
        root.dataset.pulseMounted = '1'
        window.__PULSE_SERVER__ = serverState || {}
        const { default: spec } = await import(/* @vite-ignore */ hydrate)
        if (spec) currentMount = mountFn(spec, root, serverState || {})
      }

      document.dispatchEvent(new CustomEvent('pulse:navigate'))
      window.scrollTo({ top: 0, behavior: 'instant' })

      const focusTarget = root.querySelector('#main-content, main, h1') || root
      if (!focusTarget.hasAttribute('tabindex')) {
        focusTarget.setAttribute('tabindex', '-1')
        focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true })
      }
      focusTarget.focus({ preventScroll: true })

    } catch {
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
