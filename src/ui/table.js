/**
 * Pulse UI — Table
 *
 * Responsive, accessible data table.
 * The scroll wrapper has role="region" and tabindex="0" so keyboard users can
 * scroll horizontally. Cells accept HTML strings (not escaped) — escape
 * user data before passing it in.
 *
 * @param {object}   opts
 * @param {string[]} opts.headers  - Column header labels (escaped automatically)
 * @param {Array[]}  opts.rows     - 2D array of cell content (HTML strings)
 * @param {string}   opts.caption  - Accessible caption (also used as aria-label)
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'

export function table({
  headers    = [],
  rows       = [],
  caption    = '',
  class: cls = '',
} = {}) {
  const wrapClasses = ['ui-table-wrap', cls].filter(Boolean).join(' ')

  const captionHtml = caption
    ? `<caption class="ui-table-caption">${e(caption)}</caption>`
    : ''

  const ths = headers
    .map(h => `<th scope="col">${e(h)}</th>`)
    .join('')

  const trs = rows
    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')

  return `<div class="${e(wrapClasses)}" role="region" aria-label="${e(caption || 'Table')}" tabindex="0">
  <table class="ui-table">
    ${captionHtml}
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</div>`
}
