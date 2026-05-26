/**
 * Pulse UI — ServiceCard
 *
 * A bordered, left-aligned tile with icon, title, and description.
 * The most common pattern for trades/services grids — an unboxed, centred
 * feature() is the wrong tool for these; serviceCard() is built for it.
 *
 * Use inside a grid() or css grid for multi-column layouts.
 *
 * @param {object}  opts
 * @param {string}  opts.icon        - Raw HTML slot — SVG icon displayed in an accent-tinted box
 * @param {string}  opts.title
 * @param {number}  opts.level       - Heading level 1–6 (default 3)
 * @param {string}  opts.description
 * @param {string}  opts.href        - When set, wraps the card in an <a> making it fully clickable
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function serviceCard({
  icon        = '',
  title       = '',
  level       = 3,
  description = '',
  href        = '',
  class: cls  = '',
} = {}) {
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`
  const linked = Boolean(href)
  const classes = [
    'ui-service-card',
    linked && 'ui-service-card--linked',
    cls,
  ].filter(Boolean).join(' ')

  const inner = `
  ${icon        ? `<div class="ui-service-card-icon" aria-hidden="true">${icon}</div>` : ''}
  ${title       ? `<${tag} class="ui-service-card-title">${e(title)}</${tag}>` : ''}
  ${description ? `<p class="ui-service-card-desc">${e(description)}</p>` : ''}
`

  if (linked) {
    return `<a href="${e(href)}" class="${e(classes)}">${inner}</a>`
  }
  return `<div class="${e(classes)}">${inner}</div>`
}
