/**
 * Pulse UI — Rating
 *
 * Star rating display and interactive input.
 *
 * Without `name`: renders a read-only star display (role="img").
 * With `name`:    renders radio inputs — submits the numeric value in FormData.
 *
 * The interactive version uses a pure-CSS technique:
 *   - Stars are rendered in reverse DOM order inside a row-reverse flex container
 *     so they appear left-to-right (★1 … ★5) visually.
 *   - The hidden radio inputs sit between each label. Because they are
 *     position:absolute they are removed from the flex layout but remain in the
 *     DOM so CSS sibling selectors can reach from input → subsequent labels.
 *   - `input:checked ~ label` fills all labels (= lower-numbered stars) after
 *     the checked input in DOM, which appear to its left visually.
 *   - `label:hover ~ label` fills all subsequent labels (lower stars) on hover.
 *
 * @param {object}  opts
 * @param {number}  opts.value    - Current rating (0–max). Supports 0.5 steps for display.
 * @param {number}  opts.max      - Total stars (default: 5)
 * @param {string}  opts.name     - Field name — enables interactive radio mode
 * @param {string}  opts.label    - Accessible group label (interactive mode)
 * @param {'sm'|'md'|'lg'} opts.size
 * @param {boolean} opts.disabled
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const SIZES = { sm: '1rem', md: '1.5rem', lg: '2rem' }

const starFilled = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
const starEmpty  = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
const starHalf   = `<svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`

export function rating({
  value      = 0,
  max        = 5,
  name       = '',
  label      = '',
  size       = 'md',
  disabled   = false,
  class: cls = '',
} = {}) {
  const fontSize = SIZES[size] ?? SIZES.md
  const classes  = ['ui-rating', cls].filter(Boolean).join(' ')

  // ── Read-only display ──────────────────────────────────────────────────────
  if (!name) {
    const stars = Array.from({ length: max }, (_, i) => {
      const pos = i + 1
      if (value >= pos)       return `<span class="ui-rating-star ui-rating-star--filled">${starFilled}</span>`
      if (value >= pos - 0.5) return `<span class="ui-rating-star ui-rating-star--half">${starHalf}</span>`
      return `<span class="ui-rating-star">${starEmpty}</span>`
    }).join('')

    return `<div
  class="${e(classes)}"
  style="--rating-size:${fontSize}"
  role="img"
  aria-label="${e(value)} out of ${e(String(max))} stars"
>${stars}</div>`
  }

  // ── Interactive (radio) ────────────────────────────────────────────────────
  // Each input lives INSIDE its label — labels are the only flex items so no
  // hidden elements can intercept pointer events between stars.
  // Stars rendered in reverse DOM order (max → 1) inside a row-reverse flex
  // container so they appear visually as ★1 … ★max left-to-right.
  // CSS :has() drives the checked + hover highlight via sibling combinators.
  const items = Array.from({ length: max }, (_, i) => {
    const v       = max - i   // counts down: max, max-1, …, 1
    const checked = v === Math.round(value)
    const title   = `${v} out of ${max}`
    return `<label class="ui-rating-star" title="${title}" aria-label="${title} stars"><input
    type="radio"
    name="${e(name)}"
    value="${v}"
    class="ui-rating-input"
    ${checked  ? 'checked'  : ''}
    ${disabled ? 'disabled' : ''}
  >★</label>`
  }).join('')

  const srOnly     = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0'
  const groupLabel = label ? `<legend style="${srOnly}">${e(label)}</legend>` : ''

  return `<fieldset class="${e(classes)}" style="--rating-size:${fontSize};border:0;padding:0;margin:0"${disabled ? ' disabled' : ''}>
  ${groupLabel}
  <div class="ui-rating-stars">${items}</div>
</fieldset>`
}
