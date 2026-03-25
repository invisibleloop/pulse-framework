/**
 * Pulse UI — Grid
 *
 * Responsive CSS grid. Direct children become grid items.
 * Collapses to a single column on mobile by default.
 *
 * @param {object} opts
 * @param {string} opts.content    - Raw HTML slot — direct children are grid items
 * @param {1|2|3|4} opts.cols      - Number of columns (default: 3)
 * @param {'sm'|'md'|'lg'} opts.gap - Gap between items (default: 'md')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const VALID_COLS = new Set([1, 2, 3, 4])
const GAPS       = new Set(['sm', 'md', 'lg'])

export function grid({
  content    = '',
  cols       = 3,
  gap        = 'md',
  class: cls = '',
} = {}) {
  if (!VALID_COLS.has(cols)) cols = 3
  if (!GAPS.has(gap))        gap  = 'md'

  const classes = [
    'ui-grid',
    `ui-grid--cols-${cols}`,
    gap !== 'md' && `ui-grid--gap-${gap}`,
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${e(classes)}">${content}</div>`
}
