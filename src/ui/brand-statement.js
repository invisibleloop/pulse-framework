/**
 * Pulse UI — Brand Statement
 *
 * Full-width centred editorial statement — large serif or display type used
 * for brand voice paragraphs between visual sections. This is not a pull-quote
 * (no attribution border) — it is a first-person brand declaration.
 *
 * Typical use: "pieces that are both eclectic and everyday. Subtly precious,
 * expressive, and refined…"
 *
 * @param {object}  opts
 * @param {string}  opts.text         - Statement text (can include basic HTML like <em>, <br>)
 * @param {string}  opts.attribution  - Optional small attribution or tagline below
 * @param {'serif'|'display'|'sans'} opts.font  - Font style (default: 'serif')
 * @param {'sm'|'md'|'lg'} opts.size  - Text size (default: 'md')
 * @param {'left'|'center'|'right'} opts.align - Text alignment (default: 'center')
 * @param {string}  opts.maxWidth     - CSS max-width value (default: '860px')
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const FONTS  = new Set(['serif', 'display', 'sans'])
const SIZES  = new Set(['sm', 'md', 'lg'])
const ALIGNS = new Set(['left', 'center', 'right'])

export function brandStatement({
  text         = '',
  attribution  = '',
  font         = 'serif',
  size         = 'md',
  align        = 'center',
  maxWidth     = '',
  class: cls   = '',
} = {}) {
  if (!FONTS.has(font))   font  = 'serif'
  if (!SIZES.has(size))   size  = 'md'
  if (!ALIGNS.has(align)) align = 'center'

  const classes = [
    'ui-brand-statement',
    font  !== 'serif'   && `ui-brand-statement--${font}`,
    size  !== 'md'      && `ui-brand-statement--${size}`,
    align !== 'center'  && `ui-brand-statement--${align}`,
    cls,
  ].filter(Boolean).join(' ')

  const innerStyle = maxWidth
    ? ` style="max-width:${e(typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth)}"`
    : ''

  return `<div class="${e(classes)}">
  <div class="ui-brand-statement-inner"${innerStyle}>
    <p class="ui-brand-statement-text">${text}</p>
    ${attribution ? `<p class="ui-brand-statement-attr">${e(attribution)}</p>` : ''}
  </div>
</div>`
}
