/**
 * Pulse UI — Feature
 *
 * Icon + title + description block. The standard "why us" grid card.
 *
 * @param {object} opts
 * @param {string}  opts.image       - Raw HTML slot — rendered above the icon (e.g. `<img src="...">`)
 * @param {string}  opts.icon        - Raw HTML slot — SVG or emoji; displayed in an accent-tinted box
 * @param {string}  opts.title
 * @param {number}  opts.level       - Heading level 1–6 (default 3). Visual style is always ui-feature-title.
 * @param {string}  opts.description
 * @param {boolean} opts.center      - Centre-align icon, title, and description
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function feature({
  image       = '',
  icon        = '',
  title       = '',
  level       = 3,
  description = '',
  body,  // alias for description
  center      = false,
  class: cls  = '',
  ...rest
} = {}) {
  // Accept 'body' as alias for 'description'
  const desc = description || body || ''
  
  // Warn about unknown props on the server
  if (typeof window === 'undefined') {
    const knownProps = new Set(['image', 'icon', 'title', 'level', 'description', 'body', 'center', 'class'])
    const unknownProps = Object.keys(rest).filter(k => !knownProps.has(k))
    if (unknownProps.length > 0) {
      console.warn(`[Pulse feature] Unknown prop${unknownProps.length > 1 ? 's' : ''}: ${unknownProps.join(', ')}. Did you mean 'description' instead of '${unknownProps[0]}'?`)
    }
  }

  const classes = ['ui-feature', center && 'ui-feature--center', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  return `<div class="${e(classes)}">
  ${image ? `<div class="ui-feature-image">${image}</div>` : ''}
  ${icon  ? `<div class="ui-feature-icon" aria-hidden="true">${icon}</div>` : ''}
  ${title ? `<${tag} class="ui-feature-title">${e(title)}</${tag}>` : ''}
  ${desc  ? `<p class="ui-feature-desc">${e(desc)}</p>` : ''}
</div>`
}
