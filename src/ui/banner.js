/**
 * Pulse UI — Banner
 *
 * Full-width announcement bar — sits above the nav for promotions,
 * notices, or launch announcements.
 *
 * @param {object}  opts
 * @param {string}  opts.content                     - Raw HTML slot
 * @param {'info'|'promo'|'warning'} opts.variant    - Visual style (default: 'info')
 * @param {'top'|'bottom'} opts.position             - 'bottom' fixes the bar to the bottom of the viewport
 * @param {boolean} opts.dismissible                 - Show a close (×) button
 * @param {string}  opts.dismissEvent                - Mutation name fired on close (default: 'dismissBanner')
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['info', 'promo', 'warning'])

export function banner({
  content       = '',
  variant       = 'info',
  position      = 'top',
  dismissible   = false,
  dismissEvent  = 'dismissBanner',
  class: cls    = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'info'
  const classes = [
    'ui-banner',
    `ui-banner--${variant}`,
    position === 'bottom' && 'ui-banner--bottom',
    cls,
  ].filter(Boolean).join(' ')

  const closeBtn = dismissible
    ? `<button class="ui-banner-close" data-event="${e(dismissEvent)}" aria-label="Close announcement">×</button>`
    : ''

  return `<div class="${e(classes)}" role="banner">${content}${closeBtn}</div>`
}
