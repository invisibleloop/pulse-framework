/**
 * Pulse UI — Segmented Control
 *
 * iOS-style segmented control implemented with hidden radio inputs.
 * The selected option's label is highlighted via input:checked + label CSS.
 *
 * @param {object}        opts
 * @param {string}        opts.name     - Field name (submitted in FormData)
 * @param {Array}         opts.options  - Array of { value, label }
 * @param {string}        opts.value    - Currently selected value
 * @param {boolean}       opts.disabled
 * @param {'sm'|'md'|'lg'} opts.size   - Size variant (default: 'md')
 * @param {string}        opts.event   - data-event binding, e.g. 'change:setTab'
 * @param {string}        opts.class
 */

import { escHtml as e } from '../html.js'

export function segmented({
  name       = '',
  options    = [],
  value      = '',
  disabled   = false,
  size       = 'md',
  event      = '',
  class: cls = '',
} = {}) {
  const sizeClass = size === 'sm' ? 'ui-segmented--sm'
    : size === 'lg' ? 'ui-segmented--lg'
    : ''

  const wrapClasses = ['ui-segmented', sizeClass, cls].filter(Boolean).join(' ')

  const items = options.map((opt, i) => {
    const optId  = e(`seg-${name}-${i}`)
    const checked = String(opt.value) === String(value)
    return `<input
    type="radio"
    class="ui-segmented-input"
    id="${optId}"
    name="${e(name)}"
    value="${e(String(opt.value))}"
    ${checked  ? 'checked'  : ''}
    ${disabled ? 'disabled' : ''}
    ${event    ? `data-event="${e(event)}"` : ''}
  ><label class="ui-segmented-label" for="${optId}">${e(String(opt.label))}</label>`
  }).join('')

  return `<div class="${e(wrapClasses)}" role="group">${items}</div>`
}
