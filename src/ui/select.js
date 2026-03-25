/**
 * Pulse UI — Select
 *
 * Dropdown with label, hint, and error message.
 * Options accept { value, label } objects or plain strings.
 *
 * @param {object}   opts
 * @param {string}   opts.name
 * @param {string}   opts.label
 * @param {Array}    opts.options   - Array of strings or { value, label } objects
 * @param {string}   opts.value     - Currently selected value
 * @param {string}   opts.error
 * @param {string}   opts.hint
 * @param {boolean}  opts.required
 * @param {boolean}  opts.disabled
 * @param {string}   opts.id
 * @param {string}   opts.event     - data-event binding, e.g. 'change:setCategory'
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'
import { iconChevronDown } from './icons.js'

export function select({
  name       = '',
  label      = '',
  options    = [],
  value      = '',
  error      = '',
  hint       = '',
  required   = false,
  disabled   = false,
  id         = '',
  event      = '',
  class: cls = '',
} = {}) {
  const fieldId   = e(id || `field-${name}`)
  const errorId   = `${fieldId}-error`
  const hintId    = `${fieldId}-hint`
  const described = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ')

  const wrapClasses = ['ui-field', error ? 'ui-field--error' : '', cls].filter(Boolean).join(' ')

  const labelHtml = label
    ? `<label for="${fieldId}" class="ui-label">${e(label)}${required ? ' <span class="ui-required" aria-hidden="true">*</span>' : ''}</label>`
    : ''

  const optionsHtml = options.map(opt => {
    const v = typeof opt === 'string' ? opt : opt.value
    const l = typeof opt === 'string' ? opt : opt.label
    return `<option value="${e(v)}"${v === value ? ' selected' : ''}>${e(l)}</option>`
  }).join('')

  const chevron = iconChevronDown({ size: 12 })

  const hintHtml  = hint  ? `<p id="${hintId}" class="ui-hint">${e(hint)}</p>`                 : ''
  const errorHtml = error ? `<p id="${errorId}" class="ui-error" role="alert">${e(error)}</p>` : ''

  return `<div class="${e(wrapClasses)}">
  ${labelHtml}
  <div class="ui-select-wrap">
    <select
      id="${fieldId}"
      name="${e(name)}"
      class="ui-select"
      ${required  ? 'required aria-required="true"'   : ''}
      ${disabled  ? 'disabled'                         : ''}
      ${event     ? `data-event="${e(event)}"`         : ''}
      ${described ? `aria-describedby="${described}"`  : ''}
      ${error     ? 'aria-invalid="true"'              : ''}
    >${optionsHtml}</select>
    <span class="ui-select-chevron" aria-hidden="true">${chevron}</span>
  </div>
  ${hintHtml}
  ${errorHtml}
</div>`
}
