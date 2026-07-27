/**
 * Pulse UI — Accordion
 *
 * Collapsible FAQ-style items using native <details>/<summary> — no JS required.
 *
 * @param {object}   opts
 * @param {Array<{question: string, answer: string}>} opts.items
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'

export function accordion({
  items      = [],
  class: cls = '',
} = {}) {
  const classes = ['ui-accordion', cls].filter(Boolean).join(' ')

  const itemsHtml = items.map(({ question = '', answer = '' }) => `<details class="ui-accordion-item">
  <summary class="ui-accordion-summary">
    <span>${e(question)}</span>
    <span class="ui-accordion-icon" aria-hidden="true"></span>
  </summary>
  <div class="ui-accordion-body"><p>${e(answer)}</p></div>
</details>`).join('\n')

  return `<div class="${e(classes)}">${itemsHtml}</div>`
}
