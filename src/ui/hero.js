/**
 * Pulse UI — Hero
 *
 * Full-width hero section with eyebrow, headline, subheadline, and action slot.
 *
 * @param {object}  opts
 * @param {string}  opts.eyebrow   - Small label above the title (e.g. "Now available")
 * @param {string}  opts.title     - Main headline
 * @param {string}  opts.subtitle  - Supporting text beneath the headline
 * @param {string}  opts.actions   - Raw HTML slot — typically button() or appBadge() calls
 * @param {'center'|'left'} opts.align - Text alignment (default: 'center')
 * @param {'md'|'sm'} opts.size   - Vertical padding size: 'md' (default, 5rem) or 'sm' (2.5rem)
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function hero({
  eyebrow    = '',
  title      = '',
  subtitle   = '',
  actions    = '',
  align      = 'center',
  size       = 'md',
  class: cls = '',
} = {}) {
  const classes = ['ui-hero', align === 'left' && 'ui-hero--left', size === 'sm' && 'ui-hero--sm', cls].filter(Boolean).join(' ')

  return `<section class="${e(classes)}">
  <div class="ui-hero-inner">
    ${eyebrow  ? `<p class="ui-hero-eyebrow">${e(eyebrow)}</p>` : ''}
    ${title    ? `<h1 class="ui-hero-title">${e(title)}</h1>` : ''}
    ${subtitle ? `<p class="ui-hero-subtitle">${e(subtitle)}</p>` : ''}
    ${actions  ? `<div class="ui-hero-actions">${actions}</div>` : ''}
  </div>
</section>`
}
