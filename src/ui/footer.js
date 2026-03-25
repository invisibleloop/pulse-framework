/**
 * Pulse UI — Footer
 *
 * Site footer with logo slot, navigation links, and optional legal text.
 * Handles accessibility (landmark role, aria-label on nav) and responsive
 * stacking automatically.
 *
 * @param {object} opts
 * @param {string} opts.logo      - Raw HTML slot — SVG, img, or text
 * @param {string} opts.logoHref  - Logo link destination (default: '/')
 * @param {Array<{label: string, href: string}>} opts.links - Footer nav links
 * @param {string} opts.legal     - Copyright / legal text (e.g. '© 2026 Acme Ltd.')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function footer({
  logo       = '',
  logoHref   = '/',
  links      = [],
  legal      = '',
  class: cls = '',
} = {}) {
  const classes = ['ui-footer', cls].filter(Boolean).join(' ')

  const linksHtml = links.map(({ label = '', href = '' }) =>
    `<a href="${e(href)}" class="ui-footer-link">${e(label)}</a>`
  ).join('')

  return `<footer class="${e(classes)}">
  <div class="ui-footer-inner">
    ${logo  ? `<a href="${e(logoHref)}" class="ui-footer-logo">${logo}</a>` : ''}
    ${links.length ? `<nav class="ui-footer-links" aria-label="Footer navigation">${linksHtml}</nav>` : ''}
    ${legal ? `<p class="ui-footer-legal">${e(legal)}</p>` : ''}
  </div>
</footer>`
}
