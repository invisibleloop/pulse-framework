/**
 * Pulse UI — Input
 *
 * Text input with label, hint, and error message.
 * aria-describedby is wired automatically from name when error/hint are present.
 *
 * @param {object} opts
 * @param {string}  opts.name        - Field name (also used as id base)
 * @param {string}  opts.label       - Visible label text
 * @param {string}  opts.type        - Input type (default: 'text')
 * @param {string}  opts.placeholder
 * @param {string}  opts.value       - Pre-filled value
 * @param {string}  opts.error       - Validation error message
 * @param {string}  opts.hint        - Helper text below the input
 * @param {boolean} opts.required
 * @param {boolean} opts.disabled
 * @param {string}  opts.id          - Override generated id
 * @param {string}  opts.class
 * @param {object}  opts.attrs       - Extra HTML attributes for the <input>
 */

import { escHtml as e } from '../html.js'

export function input({
  name        = '',
  label       = '',
  type        = 'text',
  placeholder = '',
  value       = '',
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

  const hintHtml  = hint  ? `<p id="${hintId}" class="ui-hint">${e(hint)}</p>`                    : ''
  const errorHtml = error ? `<p id="${errorId}" class="ui-error" role="alert">${e(error)}</p>`    : ''

  return `<div class="${e(wrapClasses)}">
  ${labelHtml}
  <input
    id="${fieldId}"
    name="${e(name)}"
    type="${e(type)}"
    class="ui-input"
    ${placeholder ? `placeholder="${e(placeholder)}"` : ''}
    ${value       ? `value="${e(value)}"`              : ''}
    ${required    ? 'required aria-required="true"'    : ''}
    ${disabled    ? 'disabled'                         : ''}
    ${described   ? `aria-describedby="${described}"`  : ''}
    ${error       ? 'aria-invalid="true"'              : ''}
    ${attrsStr}
  >
  ${hintHtml}
  ${errorHtml}
</div>`
}
