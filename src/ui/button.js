/**
 * Pulse UI — Button
 *
 * Renders as <a> when href is provided, <button> otherwise.
 * All visual variation goes through CSS modifier classes — never inline styles.
 *
 * @param {object} opts
 * @param {string}  opts.label     - Visible text — HTML is escaped. For SVG/icon content use opts.icon or opts.iconAfter.
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

  // Warn if href passed via attrs instead of the href prop (produces invalid <button href>)
  if (typeof window === 'undefined' && !href && attrs.href) {
    console.warn('[Pulse button] href passed via attrs produces invalid HTML (<button href>). Use button({ href: "..." }) instead — it renders an <a> automatically.')
  }

  // Warn if label contains HTML — it will be escaped. Use icon/iconAfter for SVG content.
  if (typeof window === 'undefined' && label && label.includes('<')) {
    console.warn('[Pulse button] label is HTML-escaped — SVG/HTML passed as label will render as text. Use icon: svgString or iconAfter: svgString instead.')
  }

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
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${e(k)}="${e(String(v))}"`)
    .join('')

  return `<button type="${e(type)}" class="${e(classes)}"${disabled ? ' disabled aria-disabled="true"' : ''}${attrsStr}>${inner}</button>`
}
