/**
 * Shared helpers for Pulse examples.
 * All examples import from here to stay DRY.
 */

import { nav }                from '../src/ui/index.js'
import { iconSun, iconMoon } from '../src/ui/icons.js'

const ALL_LINKS = [
  { label: 'Counter',  href: '/counter'  },
  { label: 'Todos',    href: '/todos'    },
  { label: 'Contact',  href: '/contact'  },
  { label: 'Quiz',     href: '/quiz'     },
  { label: 'Products', href: '/products' },
  { label: 'Pricing',  href: '/pricing'  },
]

// Both icons rendered in DOM; JS hides the inactive one via `hidden` attribute.
// Dark mode (default): show sun (click → go light). Light mode: show moon (click → go dark).
const themeToggleButton = `
<button id="theme-toggle" class="ui-btn ui-btn--ghost ui-btn--sm" aria-label="Switch to light mode" style="display:flex;align-items:center;">
  <span id="theme-icon-sun">${iconSun({ size: 16 })}</span>
  <span id="theme-icon-moon" hidden>${iconMoon({ size: 16 })}</span>
</button>`

/**
 * Returns a nonce'd theme-switcher script for use as `extraBody` in createServer.
 * Must be injected server-side so the nonce matches the page's CSP header.
 *
 * Usage in dev.server.js:
 *   createServer(specs, { extraBody: themeScript })
 *
 * @param {string} nonce
 */
export function themeScript(nonce) {
  return `<script nonce="${nonce}">
(function () {
  var KEY = 'pulse-theme', LIGHT = 'light', DARK = 'dark'
  var theme = localStorage.getItem(KEY) === LIGHT ? LIGHT : DARK
  document.documentElement.dataset.theme = theme

  function updateUI(t) {
    var sun  = document.getElementById('theme-icon-sun')
    var moon = document.getElementById('theme-icon-moon')
    if (sun)  sun.hidden  = (t === LIGHT)
    if (moon) moon.hidden = (t !== LIGHT)
    var btn = document.getElementById('theme-toggle')
    if (btn)  btn.setAttribute('aria-label', t === LIGHT ? 'Switch to dark mode' : 'Switch to light mode')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { updateUI(theme) }, { once: true })
  } else {
    updateUI(theme)
  }

  if (window.__themeInit) return
  window.__themeInit = true
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#theme-toggle')
    if (!btn) return
    var next = document.documentElement.dataset.theme === LIGHT ? DARK : LIGHT
    localStorage.setItem(KEY, next)
    document.documentElement.dataset.theme = next
    updateUI(next)
  })
})()
</script>`
}

/**
 * Renders the shared examples nav bar using the ui-nav component.
 * @param {string} logo     - Raw HTML logo slot
 * @param {string} logoHref - Logo link destination
 */
export function examplesNav(logo, logoHref) {
  return nav({ logo, logoHref, links: ALL_LINKS, sticky: true, action: themeToggleButton })
}
