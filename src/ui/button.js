/**
 * Pulse UI — Button
 *
 * Renders as <a> when href is provided, <button> otherwise.
 * All visual variation goes through CSS modifier classes — never inline styles.
 *
 * @param {object} opts
 * @param {string}  opts.label     - Visible text (required)
 * @param {'primary'|'secondary'|'ghost'|'danger'} opts.variant
 * @param {'sm'|'md'|'lg'} opts.size
 * @param {string}  opts.href      - Renders as <a> when set
 * @param {boolean} opts.disabled
 * @param {'button'|'submit'|'reset'} opts.type
 * @param {string}  opts.icon      - SVG HTML prepended inside the element
 * @param {string}  opts.iconAfter - SVG HTML appended inside the element
 * @param {boolean} opts.fullWidth
 * @param {string}  opts.class     - Extra CSS classes appended to the element
 * @param {object}  opts.attrs     - Extra HTML attributes (key→value) for <button> only
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger'])
const SIZES    = new Set(['sm', 'md', 'lg'])

export function button({
  label      = '',
  variant    = 'primary',
  size       = 'md',
  href,
  disabled   = false,
  type       = 'button',
  icon       = '',
  iconAfter  = '',
  fullWidth  = false,
  class: cls = '',
  attrs      = {},
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'primary'
  if (!SIZES.has(size))       size    = 'md'

  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth  ? 'ui-btn--full'     : '',
    disabled   ? 'ui-btn--disabled' : '',
    cls,
  ].filter(Boolean).join(' ')

  const inner = [
    icon      ? `<span class="ui-btn-icon" aria-hidden="true">${icon}</span>` : '',
    `<span>${e(label)}</span>`,
    iconAfter ? `<span class="ui-btn-icon ui-btn-icon--after" aria-hidden="true">${iconAfter}</span>` : '',
  ].join('')

  if (href) {
    return `<a href="${e(href)}" class="${e(classes)}"${disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${inner}</a>`
  }

  const attrsStr = Object.entries(attrs)
    .map(([k, v]) => ` ${e(k)}="${e(String(v))}"`)
    .join('')

  return `<button type="${e(type)}" class="${e(classes)}"${disabled ? ' disabled aria-disabled="true"' : ''}${attrsStr}>${inner}</button>`
}
