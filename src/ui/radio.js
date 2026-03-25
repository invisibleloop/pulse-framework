/**
 * Pulse UI — Radio & RadioGroup
 *
 * radio()      — single radio button with label
 * radioGroup() — semantic fieldset of radio options
 *
 * @param {object}   opts                    (radio)
 * @param {string}   opts.name               - Field name
 * @param {string}   opts.value              - Submitted value
 * @param {string}   opts.label              - Visible label
 * @param {boolean}  opts.checked
 * @param {boolean}  opts.disabled
 * @param {string}   opts.id                 - Override generated id
 * @param {string}   opts.class
 *
 * @param {object}   opts                    (radioGroup)
 * @param {string}   opts.name               - Shared field name
 * @param {string}   opts.legend             - Group label (renders as <legend>)
 * @param {Array}    opts.options             - [{ value, label, hint?, disabled? }]
 * @param {string}   opts.value              - Currently selected value
 * @param {string}   opts.hint               - Helper text below the group
 * @param {string}   opts.error              - Validation error message
 * @param {'sm'|'md'|'lg'} opts.gap          - Gap between options (default: 'md')
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'

export function radio({
  name       = '',
  value      = '',
  label      = '',
  checked    = false,
  disabled   = false,
  id         = '',
  event      = '',
  class: cls = '',
} = {}) {
  const fieldId = e(id || `radio-${name}-${value}`)
  const classes = ['ui-radio', cls].filter(Boolean).join(' ')

  return `<label class="${e(classes)}${disabled ? ' ui-radio--disabled' : ''}">
  <input
    type="radio"
    id="${fieldId}"
    name="${e(name)}"
    value="${e(value)}"
    class="ui-radio-input"
    ${checked  ? 'checked'  : ''}
    ${disabled ? 'disabled' : ''}
    ${event    ? `data-event="${e(event)}"` : ''}
  >
  <span class="ui-radio-dot" aria-hidden="true"></span>
  ${label ? `<span class="ui-radio-label">${e(label)}</span>` : ''}
</label>`
}

const GAPS = { sm: '.375rem', md: '.75rem', lg: '1.25rem' }

export function radioGroup({
  name       = '',
  legend     = '',
  options    = [],
  value      = '',
  hint       = '',
  error      = '',
  gap        = 'md',
  event      = '',
  class: cls = '',
} = {}) {
  const groupId  = `radiogroup-${name}`
  const errorId  = `${groupId}-error`
  const hintId   = `${groupId}-hint`
  const gapValue = GAPS[gap] ?? GAPS.md

  const described = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ')

  const items = options.map(opt =>
    radio({
      name,
      value:    opt.value,
      label:    opt.label,
      checked:  String(opt.value) === String(value),
      disabled: opt.disabled ?? false,
      event,
    }) + (opt.hint ? `<p class="ui-hint" style="margin:-.25rem 0 0 2rem">${e(opt.hint)}</p>` : '')
  ).join('')

  const hintHtml  = hint  ? `<p id="${hintId}"  class="ui-hint">${e(hint)}</p>`                   : ''
  const errorHtml = error ? `<p id="${errorId}" class="ui-error" role="alert">${e(error)}</p>`     : ''

  const classes = ['ui-radio-group', error ? 'ui-radio-group--error' : '', cls].filter(Boolean).join(' ')

  return `<fieldset class="${e(classes)}"${described ? ` aria-describedby="${described}"` : ''}>
  ${legend ? `<legend class="ui-fieldset-legend">${e(legend)}</legend>` : ''}
  <div class="ui-radio-group-body" style="--radio-gap:${gapValue}">
    ${items}
    ${hintHtml}
    ${errorHtml}
  </div>
</fieldset>`
}
