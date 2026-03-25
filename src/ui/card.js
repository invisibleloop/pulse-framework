/**
 * Pulse UI — Card
 *
 * Surface container with optional title and footer.
 * Pass HTML strings for content and footer — they are not escaped.
 * Escape user data before passing it in.
 *
 * @param {object} opts
 * @param {string}  opts.title   - Escaped heading text (optional)
 * @param {number}  opts.level   - Heading level 1–6 (default 3). Controls the tag; visual style is always ui-card-title.
 * @param {string}  opts.content - HTML string for the card body
 * @param {string}  opts.footer  - HTML string for the card footer (optional)
 * @param {boolean} opts.flush   - Remove internal padding (for full-bleed content)
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function card({
  title      = '',
  level      = 3,
  content    = '',
  footer     = '',
  flush      = false,
  class: cls = '',
} = {}) {
  const classes = ['ui-card', flush ? 'ui-card--flush' : '', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  const titleHtml  = title  ? `<div class="ui-card-header"><${tag} class="ui-card-title">${e(title)}</${tag}></div>` : ''
  const footerHtml = footer ? `<div class="ui-card-footer">${footer}</div>` : ''

  return `<div class="${e(classes)}">${titleHtml}<div class="ui-card-body">${content}</div>${footerHtml}</div>`
}
