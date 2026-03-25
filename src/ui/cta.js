/**
 * Pulse UI — CTA (Call to Action)
 *
 * Centred block with eyebrow, large heading, body text, and an actions slot.
 * Sits inside a section() + container() — does not add its own padding.
 *
 * @param {object} opts
 * @param {string} opts.eyebrow  - Small label above the heading
 * @param {string} opts.title    - Main heading
 * @param {number} opts.level    - Heading level 1–6 (default 2). Visual style is always ui-cta-title.
 * @param {string} opts.subtitle - Supporting paragraph
 * @param {string} opts.actions  - Raw HTML slot — typically button() calls
 * @param {'center'|'left'} opts.align - Text alignment (default: 'center')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function cta({
  eyebrow    = '',
  title      = '',
  level      = 2,
  subtitle   = '',
  actions    = '',
  align      = 'center',
  class: cls = '',
} = {}) {
  const classes = ['ui-cta', align === 'left' && 'ui-cta--left', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  return `<div class="${e(classes)}">
  ${eyebrow  ? `<p class="ui-cta-eyebrow">${e(eyebrow)}</p>` : ''}
  ${title    ? `<${tag} class="ui-cta-title">${e(title)}</${tag}>` : ''}
  ${subtitle ? `<p class="ui-cta-subtitle">${e(subtitle)}</p>` : ''}
  ${actions  ? `<div class="ui-cta-actions">${actions}</div>` : ''}
</div>`
}
