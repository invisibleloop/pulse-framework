/**
 * Pulse UI — Banner
 *
 * Full-width announcement bar — sits above the nav for promotions,
 * notices, or launch announcements.
 *
 * @param {object} opts
 * @param {string} opts.content                     - Raw HTML slot
 * @param {'info'|'promo'|'warning'} opts.variant   - Visual style (default: 'info')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['info', 'promo', 'warning'])

export function banner({
  content    = '',
  variant    = 'info',
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'info'
  const classes = ['ui-banner', `ui-banner--${variant}`, cls].filter(Boolean).join(' ')

  return `<div class="${e(classes)}" role="banner">${content}</div>`
}
