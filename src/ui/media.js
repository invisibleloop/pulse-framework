/**
 * Pulse UI — Media
 *
 * Image + text side-by-side layout. Stacks vertically on mobile.
 * The image slot accepts any HTML — <img>, <figure>, an SVG, or a styled div.
 *
 * @param {object} opts
 * @param {string} opts.image              - Raw HTML slot — the visual side
 * @param {string} opts.content            - Raw HTML slot — the text side
 * @param {boolean} opts.reverse           - Put text left, image right (default: false)
 * @param {'start'|'center'} opts.align    - Vertical alignment of columns (default: 'center')
 * @param {'sm'|'md'|'lg'} opts.gap        - Gap between columns (default: 'md')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const ALIGNS = new Set(['start', 'center'])
const GAPS   = new Set(['sm', 'md', 'lg'])

export function media({
  image      = '',
  content    = '',
  reverse    = false,
  align      = 'center',
  gap        = 'md',
  class: cls = '',
} = {}) {
  if (!ALIGNS.has(align)) align = 'center'
  if (!GAPS.has(gap))     gap   = 'md'

  const classes = [
    'ui-media',
    reverse         && 'ui-media--reverse',
    align !== 'center' && `ui-media--align-${align}`,
    gap   !== 'md'  && `ui-media--gap-${gap}`,
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${e(classes)}">
  <div class="ui-media-image">${image}</div>
  <div class="ui-media-content">${content}</div>
</div>`
}
