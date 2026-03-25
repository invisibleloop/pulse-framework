/**
 * Pulse UI — Feature
 *
 * Icon + title + description block. The standard "why us" grid card.
 *
 * @param {object} opts
 * @param {string}  opts.icon        - Raw HTML slot — SVG or emoji; displayed in an accent-tinted box
 * @param {string}  opts.title
 * @param {number}  opts.level       - Heading level 1–6 (default 3). Visual style is always ui-feature-title.
 * @param {string}  opts.description
 * @param {boolean} opts.center      - Centre-align icon, title, and description
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function feature({
  icon        = '',
  title       = '',
  level       = 3,
  description = '',
  center      = false,
  class: cls  = '',
} = {}) {
  const classes = ['ui-feature', center && 'ui-feature--center', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  return `<div class="${e(classes)}">
  ${icon        ? `<div class="ui-feature-icon" aria-hidden="true">${icon}</div>` : ''}
  ${title       ? `<${tag} class="ui-feature-title">${e(title)}</${tag}>` : ''}
  ${description ? `<p class="ui-feature-desc">${e(description)}</p>` : ''}
</div>`
}
