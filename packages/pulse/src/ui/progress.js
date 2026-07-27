/**
 * Pulse UI — Progress
 *
 * Horizontal progress bar. Supports determinate and indeterminate states.
 *
 * @param {object}  opts
 * @param {number}  opts.value      - Current value (0–max). Omit for indeterminate.
 * @param {number}  opts.max        - Maximum value (default: 100)
 * @param {string}  opts.label      - Accessible label
 * @param {boolean} opts.showLabel  - Render label text above the bar
 * @param {boolean} opts.showValue  - Render percentage above the bar (right-aligned)
 * @param {'accent'|'success'|'warning'|'error'} opts.variant
 * @param {'sm'|'md'|'lg'} opts.size
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = { accent: 'accent', success: 'success', warning: 'warning', error: 'error' }
const SIZES    = { sm: '.25rem', md: '.5rem', lg: '1rem' }

export function progress({
  value      = undefined,
  max        = 100,
  label      = '',
  showLabel  = false,
  showValue  = false,
  variant    = 'accent',
  size       = 'md',
  class: cls = '',
} = {}) {
  const indeterminate = value === undefined || value === null
  const clamped       = indeterminate ? 0 : Math.min(Math.max(Number(value), 0), max)
  const pct           = indeterminate ? 0 : Math.round((clamped / max) * 100)
  const v             = VARIANTS[variant] ?? 'accent'
  const h             = SIZES[size]       ?? SIZES.md

  const classes = [
    'ui-progress',
    `ui-progress--${v}`,
    indeterminate ? 'ui-progress--indeterminate' : '',
    cls,
  ].filter(Boolean).join(' ')

  const header = (showLabel || showValue) ? `
  <div class="ui-progress-header">
    ${showLabel && label ? `<span class="ui-progress-label">${e(label)}</span>` : '<span></span>'}
    ${showValue && !indeterminate ? `<span class="ui-progress-value">${pct}%</span>` : ''}
  </div>` : ''

  const ariaLabel = label ? e(label) : indeterminate ? 'Loading' : `${pct}%`

  return `<div
  class="${e(classes)}"
  role="progressbar"
  aria-label="${ariaLabel}"
  ${!indeterminate ? `aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="${max}"` : ''}
  style="--progress-height:${h}"
>${header}
  <div class="ui-progress-track">
    <div class="ui-progress-fill" style="${indeterminate ? '' : `width:${pct}%`}"></div>
  </div>
</div>`
}
