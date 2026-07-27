/**
 * Pulse UI — Divider
 *
 * Horizontal rule with an optional centred label.
 * With a label, the line splits either side of the text.
 *
 * @param {object} opts
 * @param {string} opts.label  - Optional centred text (e.g. "or", "continue with")
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function divider({
  label      = '',
  class: cls = '',
} = {}) {
  const classes = ['ui-divider', label && 'ui-divider--label', cls].filter(Boolean).join(' ')

  if (label) {
    return `<div class="${e(classes)}" role="separator" aria-label="${e(label)}">
  <span class="ui-divider-line" aria-hidden="true"></span>
  <span class="ui-divider-text">${e(label)}</span>
  <span class="ui-divider-line" aria-hidden="true"></span>
</div>`
  }

  return `<hr class="${e(classes)}">`
}
