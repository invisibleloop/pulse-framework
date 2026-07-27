/**
 * Pulse UI — Tooltip
 *
 * CSS-powered tooltip. Wraps any trigger element — no JavaScript required.
 *
 * @param {object}                          opts
 * @param {string}                          opts.content   - Tooltip text (plain text; HTML not rendered)
 * @param {string}                          opts.trigger   - Raw HTML slot — the element the tooltip appears on
 * @param {'top'|'bottom'|'left'|'right'}   opts.position  - Placement (default: 'top')
 * @param {string}                          opts.class
 */

import { escHtml as e } from '../html.js'

const POSITIONS = new Set(['top', 'bottom', 'left', 'right'])

export function tooltip({
  content    = '',
  trigger    = '',
  position   = 'top',
  class: cls = '',
} = {}) {
  if (!POSITIONS.has(position)) position = 'top'

  const classes = ['ui-tooltip', `ui-tooltip--${position}`, cls].filter(Boolean).join(' ')

  return `<span class="${e(classes)}" data-tip="${e(content)}" aria-label="${e(content)}">${trigger}</span>`
}
