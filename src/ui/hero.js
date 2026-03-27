/**
 * Pulse UI — Hero
 *
 * Full-width hero section with eyebrow, headline, subheadline, and action slot.
 * Pass `image` HTML to activate the split layout — text on one side, image on the other.
 *
 * @param {object}  opts
 * @param {string}  opts.eyebrow      - Small label above the title (e.g. "Now available")
 * @param {string}  opts.title        - Main headline
 * @param {string}  opts.subtitle     - Supporting text beneath the headline
 * @param {string}  opts.actions      - Raw HTML slot — typically button() or appBadge() calls
 * @param {string}  opts.image        - Raw HTML slot for the image (activates split layout)
 * @param {'right'|'left'} opts.imageAlign - Which side the image sits on (default: 'right')
 * @param {'center'|'left'} opts.align    - Text alignment when no image (default: 'center')
 * @param {'md'|'sm'} opts.size           - Vertical padding: 'md' (default, 5rem) or 'sm' (2.5rem)
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function hero({
  eyebrow     = '',
  title       = '',
  subtitle    = '',
  actions     = '',
  image       = '',
  imageAlign  = 'right',
  align       = 'center',
  size        = 'md',
  class: cls  = '',
} = {}) {
  const split = Boolean(image)
  const classes = [
    'ui-hero',
    split ? 'ui-hero--split' : align === 'left' && 'ui-hero--left',
    split && imageAlign === 'left' && 'ui-hero--media-left',
    size === 'sm' && 'ui-hero--sm',
    cls,
  ].filter(Boolean).join(' ')

  const content = `
    ${eyebrow  ? `<p class="ui-hero-eyebrow">${e(eyebrow)}</p>` : ''}
    ${title    ? `<h1 class="ui-hero-title">${e(title)}</h1>` : ''}
    ${subtitle ? `<p class="ui-hero-subtitle">${e(subtitle)}</p>` : ''}
    ${actions  ? `<div class="ui-hero-actions">${actions}</div>` : ''}`

  if (split) {
    return `<section class="${e(classes)}">
  <div class="ui-hero-inner">
    <div class="ui-hero-content">${content}
    </div>
    <div class="ui-hero-media">${image}</div>
  </div>
</section>`
  }

  return `<section class="${e(classes)}">
  <div class="ui-hero-inner">${content}
  </div>
</section>`
}
