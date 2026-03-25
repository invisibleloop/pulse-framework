/**
 * Pulse UI — Textarea
 *
 * Multi-line text input with label, hint, and error message.
 *
 * @param {object}  opts
 * @param {string}  opts.name
 * @param {string}  opts.label
 * @param {string}  opts.placeholder
 * @param {string}  opts.value
 * @param {number}  opts.rows
 * @param {string}  opts.error
 * @param {string}  opts.hint
 * @param {boolean} opts.required
 * @param {boolean} opts.disabled
 * @param {string}  opts.id
 * @param {string}  opts.class
 * @param {object}  opts.attrs
 */

import { escHtml as e } from '../html.js'

export function textarea({
  name        = '',
  label       = '',
  placeholder = '',
  value       = '',
  rows        = 4,
  error       = '',
  hint        = '',
  required    = false,
  disabled    = false,
  id          = '',
  class: cls  = '',
  attrs       = {},
} = {}) {
  const fieldId   = e(id || `field-${name}`)
  const errorId   = `${fieldId}-error`
  const hintId    = `${fieldId}-hint`
  const described = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ')

  const wrapClasses = ['ui-field', error ? 'ui-field--error' : '', cls].filter(Boolean).join(' ')

  const attrsStr = Object.entries(attrs)
    .map(([k, v]) => ` ${e(k)}="${e(String(v))}"`)
    .join('')

  const labelHtml = label
    ? `<label for="${fieldId}" class="ui-label">${e(label)}${required ? ' <span class="ui-required" aria-hidden="true">*</span>' : ''}</label>`
    : ''

  const hintHtml  = hint  ? `<p id="${hintId}" class="ui-hint">${e(hint)}</p>`                 : ''
  const errorHtml = error ? `<p id="${errorId}" class="ui-error" role="alert">${e(error)}</p>` : ''

  return `<div class="${e(wrapClasses)}">
  ${labelHtml}
  <textarea
    id="${fieldId}"
    name="${e(name)}"
    class="ui-textarea"
    rows="${Number(rows) || 4}"
    ${placeholder ? `placeholder="${e(placeholder)}"` : ''}
    ${required    ? 'required aria-required="true"'   : ''}
    ${disabled    ? 'disabled'                         : ''}
    ${described   ? `aria-describedby="${described}"`  : ''}
    ${error       ? 'aria-invalid="true"'              : ''}
    ${attrsStr}
  >${e(value)}</textarea>
  ${hintHtml}
  ${errorHtml}
</div>`
}
