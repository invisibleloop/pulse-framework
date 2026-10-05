/**
 * Pulse UI — Checkbox
 *
 * Styled checkbox with optional label. Wraps a visually-hidden <input> and a
 * custom box element driven by CSS :checked state.
 *
 * @param {object}  opts
 * @param {string}  opts.name       - Field name
 * @param {string}  opts.value      - Submitted value
 * @param {string}  opts.label      - Visible label text (escaped)
 * @param {string}  opts.labelHtml  - Raw HTML label slot (not escaped — use for styled spans)
 * @param {boolean} opts.checked
 * @param {boolean} opts.disabled
 * @param {string}  opts.id         - Override generated id
 * @param {string}  opts.event      - data-event binding (e.g. 'change:toggle')
 * @param {string}  opts.hint       - Helper text below the label
 * @param {string}  opts.error      - Validation error message
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function checkbox({
  name       = '',
  value      = '',
  label      = '',
  labelHtml  = '',
  checked    = false,
  disabled   = false,
  id         = '',
  event      = '',
  hint       = '',
  error      = '',
  class: cls = '',
} = {}) {
  const uid = e(id || ['checkbox', name, value].filter(Boolean).join('-'))

  const classes = [
    'ui-checkbox',
    disabled        ? 'ui-checkbox--disabled' : '',
    error           ? 'ui-checkbox--error'    : '',
    cls,
  ].filter(Boolean).join(' ')

  const labelContent = labelHtml
    ? labelHtml
    : label ? `<span class="ui-checkbox-label">${e(label)}</span>` : ''

  return `<label class="${e(classes)}">
  <input
    type="checkbox"
    id="${uid}"
    ${name  ? `name="${e(name)}"` : ''}
    ${value ? `value="${e(value)}"` : ''}
    class="ui-checkbox-input"
    ${checked  ? 'checked'  : ''}
    ${disabled ? 'disabled' : ''}
    ${event    ? `data-event="${e(event)}"` : ''}
  >
  <span class="ui-checkbox-box" aria-hidden="true"></span>
  ${labelContent}
  ${hint  ? `<p class="ui-hint">${e(hint)}</p>`               : ''}
  ${error ? `<p class="ui-error" role="alert">${e(error)}</p>` : ''}
</label>`
}
