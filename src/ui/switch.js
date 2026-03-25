/**
 * Pulse UI — Switch
 *
 * iOS-style toggle switch. Renders a visually hidden checkbox with a custom
 * styled track and thumb. Works with FormData — reads as 'on' when checked.
 *
 * @param {object}  opts
 * @param {string}  opts.name      - Field name
 * @param {string}  opts.label     - Visible label text
 * @param {boolean} opts.checked   - Initial checked state
 * @param {boolean} opts.disabled
 * @param {string}  opts.hint      - Helper text below the switch
 * @param {string}  opts.id        - Override generated id
 * @param {string}  opts.event     - data-event binding, e.g. 'change:setEnabled'
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function toggle({
  name       = '',
  label      = '',
  checked    = false,
  disabled   = false,
  hint       = '',
  id         = '',
  event      = '',
  class: cls = '',
} = {}) {
  const fieldId  = e(id || `field-${name}`)
  const hintId   = `${fieldId}-hint`
  const classes  = ['ui-switch', cls].filter(Boolean).join(' ')

  const hintHtml = hint
    ? `<p id="${hintId}" class="ui-hint">${e(hint)}</p>`
    : ''

  return `<div class="${e(classes)}">
  <label class="ui-switch-label${disabled ? ' ui-switch-label--disabled' : ''}">
    <input
      type="checkbox"
      id="${fieldId}"
      name="${e(name)}"
      class="ui-switch-input"
      ${checked  ? 'checked'  : ''}
      ${disabled ? 'disabled' : ''}
      ${event    ? `data-event="${e(event)}"` : ''}
      ${hint     ? `aria-describedby="${hintId}"` : ''}
    >
    <span class="ui-switch-track" aria-hidden="true">
      <span class="ui-switch-thumb"></span>
    </span>
    ${label ? `<span class="ui-switch-text">${e(label)}</span>` : ''}
  </label>
  ${hintHtml}
</div>`
}
