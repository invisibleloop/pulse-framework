/**
 * Pulse UI — ContactRow
 *
 * A horizontal strip of contact items — phone, email, address, hours.
 * Universal on local-business and trades sites. Renders as a <ul> of
 * icon + label pairs, each optionally linked.
 *
 * @param {object}   opts
 * @param {Array<{icon?: string, label: string, href?: string}>} opts.items
 * @param {'sm'|'md'} opts.size   - Text size (default: 'md')
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'

const SIZES = new Set(['sm', 'md'])

export function contactRow({
  items      = [],
  size       = 'md',
  class: cls = '',
} = {}) {
  if (!SIZES.has(size)) size = 'md'

  const classes = [
    'ui-contact-row',
    size !== 'md' && `ui-contact-row--${size}`,
    cls,
  ].filter(Boolean).join(' ')

  const itemsHtml = items.map(({ icon = '', label = '', href = '' }) => {
    const iconHtml = icon ? `<span class="ui-contact-row-icon" aria-hidden="true">${icon}</span>` : ''
    const inner = `${iconHtml}<span>${e(label)}</span>`
    const content = href
      ? `<a href="${e(href)}">${inner}</a>`
      : inner
    return `<li class="ui-contact-row-item">${content}</li>`
  }).join('')

  return `<ul class="${e(classes)}">${itemsHtml}</ul>`
}
