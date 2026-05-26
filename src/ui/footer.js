/**
 * Pulse UI — Footer
 *
 * Site footer with logo slot, navigation links, and optional legal text.
 * Handles accessibility (landmark role, aria-label on nav) and responsive
 * stacking automatically.
 *
 * Two layouts:
 *
 * Simple (default):
 *   logo + flat link list + legal — one-liner or small site footer.
 *
 * Rich (when `columns` is provided):
 *   Optional subscribe form row, multi-column link grid, optional wordmark,
 *   and legal row. Use for brand-heavy or e-commerce sites.
 *
 * @param {object} opts
 * @param {string} opts.logo       - Raw HTML slot — SVG, img, or text
 * @param {string} opts.logoHref   - Logo link destination (default: '/')
 * @param {Array<{label: string, href: string}>} opts.links - Flat footer nav links (simple layout)
 * @param {string} opts.legal      - Copyright / legal text
 *
 * Rich layout params:
 * @param {Array<{title: string, links: Array<{label, href}>}>} opts.columns - Multi-column link sections
 * @param {string} opts.subscribe  - Raw HTML slot — newsletter subscribe form
 * @param {string} opts.wordmark   - Giant display text shown at the very bottom of the footer
 * @param {string} opts.background - CSS background value — sets the footer background colour
 * @param {string} opts.color      - Foreground/text colour — use when background needs contrast override
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function footer({
  logo       = '',
  logoHref   = '/',
  links      = [],
  legal      = '',
  columns    = [],
  subscribe  = '',
  wordmark   = '',
  background = '',
  color      = '',
  class: cls = '',
} = {}) {
  const isRich = columns.length > 0 || subscribe || wordmark

  const styles = [
    background && `background:${background.replace(/"/g, "'")}`,
    color      && `color:${color.replace(/"/g, "'")}`,
  ].filter(Boolean).join(';')
  const styleAttr = styles ? ` style="${styles}"` : ''

  const classes = ['ui-footer', isRich && 'ui-footer--rich', cls].filter(Boolean).join(' ')

  // Defensive shape checks — common mistakes that produce silent empty output
  if (typeof window === 'undefined') { // server only
    if (columns.length && columns.some(c => c.items && !c.links)) {
      console.warn('[Pulse footer] Column shape should be { title, links: [...] } — found { items } instead. Did you mean links?')
    }
    if (!columns.length && links.some(l => l.title || l.items)) {
      console.warn('[Pulse footer] Simple footer expects links: [{ label, href }] — found title/items keys. For multi-column layout, use columns: [{ title, links: [...] }].')
    }
  }

  // Simple layout
  if (!isRich) {
    const linksHtml = links.map(({ label = '', href = '' }) =>
      `<a href="${e(href)}" class="ui-footer-link">${e(label)}</a>`
    ).join('')

    return `<footer class="${e(classes)}"${styleAttr}>
  <div class="ui-footer-inner">
    ${logo  ? `<a href="${e(logoHref)}" class="ui-footer-logo">${logo}</a>` : ''}
    ${links.length ? `<nav class="ui-footer-links" aria-label="Footer navigation">${linksHtml}</nav>` : ''}
    ${legal ? `<p class="ui-footer-legal">${e(legal)}</p>` : ''}
  </div>
</footer>`
  }

  // Rich layout
  const columnsHtml = columns.map(({ title = '', links: cols = [] }) => `
    <div class="ui-footer-col">
      ${title ? `<p class="ui-footer-col-title">${e(title)}</p>` : ''}
      <ul class="ui-footer-col-links" role="list">
        ${cols.map(({ label = '', href = '' }) => `<li><a href="${e(href)}">${e(label)}</a></li>`).join('')}
      </ul>
    </div>`).join('')

  const legalLinks = links.map(({ label = '', href = '' }) =>
    `<a href="${e(href)}">${e(label)}</a>`
  ).join('')

  return `<footer class="${e(classes)}"${styleAttr}>
  ${logo || subscribe ? `<div class="ui-footer-top">
    ${logo ? `<a href="${e(logoHref)}" class="ui-footer-logo">${logo}</a>` : ''}
    ${subscribe ? `<div class="ui-footer-subscribe">${subscribe}</div>` : ''}
  </div>` : ''}
  ${columns.length ? `<div class="ui-footer-columns">${columnsHtml}
  </div>` : ''}
  ${wordmark ? `<div class="ui-footer-wordmark" data-wordmark="${e(wordmark)}" aria-hidden="true"></div>` : ''}
  ${legal || links.length ? `<div class="ui-footer-legal-row">
    ${legalLinks}
    ${legal ? `<span>${e(legal)}</span>` : ''}
  </div>` : ''}
</footer>`
}
