/**
 * Pulse UI — Slider
 *
 * Styled range input with label and hint.
 * The fill gradient is driven by --slider-fill CSS custom property.
 *
 * @param {object}  opts
 * @param {string}  opts.name      - Field name (submitted in FormData as a number string)
 * @param {string}  opts.label     - Visible label text
 * @param {number}  opts.min       - Minimum value (default: 0)
 * @param {number}  opts.max       - Maximum value (default: 100)
 * @param {number}  opts.step      - Step increment (default: 1)
 * @param {number}  opts.value     - Current value (default: 50)
 * @param {boolean} opts.disabled
 * @param {string}  opts.hint       - Helper text below the slider
 * @param {boolean} opts.showValue  - Show the current value live beside the label
 * @param {string}  opts.id         - Override generated id
 * @param {string}  opts.event      - data-event binding, e.g. 'change:setBrightness'
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function slider({
  name       = '',
  label      = '',
  min        = 0,
  max        = 100,
  step       = 1,
  value      = 50,
  disabled   = false,
  hint       = '',
  showValue  = false,
  id         = '',
  event      = '',
  class: cls = '',
} = {}) {
  const fieldId   = e(id || `slider-${name}`)
  const hintId    = `${fieldId}-hint`
  const described = hint ? hintId : ''

  const minN   = Number(min)
  const maxN   = Number(max)
  const valN   = Math.min(Math.max(Number(value), minN), maxN)
  const fillPct = maxN > minN
    ? (((valN - minN) / (maxN - minN)) * 100).toFixed(2) + '%'
    : '0%'

  const wrapClasses = ['ui-field', cls].filter(Boolean).join(' ')

  const outputId  = `${fieldId}-output`

  const labelHtml = label
    ? `<label for="${fieldId}" class="ui-label${showValue ? ' ui-label--row' : ''}">
        ${e(label)}
        ${showValue ? `<output id="${outputId}" class="ui-slider-output" for="${fieldId}">${valN}</output>` : ''}
      </label>`
    : ''

  const hintHtml = hint
    ? `<p id="${hintId}" class="ui-hint">${e(hint)}</p>`
    : ''

  return `<div class="${e(wrapClasses)}" style="--slider-fill:${fillPct}">
  ${labelHtml}
  <input
    type="range"
    id="${fieldId}"
    name="${e(name)}"
    class="ui-slider"
    min="${minN}"
    max="${maxN}"
    step="${e(String(step))}"
    value="${valN}"
    aria-valuemin="${minN}"
    aria-valuemax="${maxN}"
    aria-valuenow="${valN}"
    ${disabled ? 'disabled'                           : ''}
    ${event    ? `data-event="${e(event)}"`           : ''}
    ${described  ? `aria-describedby="${described}"` : ''}
  >
  ${hintHtml}
</div>`
}
