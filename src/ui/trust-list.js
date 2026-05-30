/**
 * Pulse UI — TrustList
 *
 * A compact row of trust/compliance badges — "Part P registered · NICEIC · £10m insured".
 * Each item gets a leading icon (default: check mark). Common on trades, services,
 * and professional-services sites.
 *
 * @param {object}   opts
 * @param {string[]} opts.items       - List of labels
 * @param {string}   opts.icon        - Raw HTML slot — icon shown before each item (default: ✓ check SVG)
 * @param {string}   opts.color       - Icon colour CSS value (default: inherits --ui-accent)
 * @param {'sm'|'md'} opts.size
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'
import { iconCheck } from './icons.js'

const SIZES = new Set(['sm', 'md'])

export function trustList({
  items      = [],
  icon       = iconCheck({ size: 14 }),
  color      = '',
  size       = 'sm',
  class: cls = '',
} = {}) {
  if (!SIZES.has(size)) size = 'sm'

  const classes = [
    'ui-trust-list',
    size !== 'sm' && `ui-trust-list--${size}`,
    cls,
  ].filter(Boolean).join(' ')

  const iconStyle = color ? ` style="color:${color.replace(/"/g, "'")}"` : ''

  const itemsHtml = items.map(label =>
    `<li class="ui-trust-list-item">
  <span class="ui-trust-list-icon" aria-hidden="true"${iconStyle}>${icon}</span>
  <span>${e(label)}</span>
</li>`
  ).join('')

  return `<ul class="${e(classes)}">${itemsHtml}</ul>`
}
