/**
 * Pulse UI — Empty state
 *
 * Shown when a list or section has no content yet.
 *
 * @param {object} opts
 * @param {string} opts.title       - Primary message
 * @param {string} opts.description - Supporting text (optional)
 * @param {object} opts.action      - { label, href, variant } — renders a button (optional)
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'
import { button }        from './button.js'

export function empty({
  title       = 'Nothing here yet',
  description = '',
  action      = null,
  class: cls  = '',
} = {}) {
  const classes = ['ui-empty', cls].filter(Boolean).join(' ')

  const actionHtml = action
    ? button({ label: action.label, href: action.href, variant: action.variant || 'secondary' })
    : ''

  return `<div class="${e(classes)}">
  <p class="ui-empty-title">${e(title)}</p>
  ${description ? `<p class="ui-empty-desc">${e(description)}</p>` : ''}
  ${actionHtml}
</div>`
}
