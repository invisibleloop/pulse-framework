/**
 * Pulse UI — File Upload
 *
 * Drag-and-drop file upload zone with a hidden <input type="file">.
 * Clicking the zone opens the file picker. Dragging files over the zone
 * highlights it; dropping triggers the native change event so Pulse can
 * bind a mutation or action via data-event / data-action.
 *
 * The component is fully CSS-driven — no pulse-ui.js required.
 * The drag highlight is handled by a small inline script on the zone element.
 *
 * Submitted in FormData under `name` — works inside <form data-action="...">.
 *
 * @param {object}   opts
 * @param {string}   opts.name        - Field name (submitted in FormData)
 * @param {string}   opts.label       - Visible label text
 * @param {string}   opts.hint        - Helper text (e.g. 'PNG, JPG up to 5 MB')
 * @param {string}   opts.error       - Validation error message
 * @param {string}   opts.accept      - Accepted MIME types or extensions, e.g. 'image/*'
 * @param {boolean}  opts.multiple    - Allow multiple files
 * @param {boolean}  opts.required
 * @param {boolean}  opts.disabled
 * @param {string}   opts.id          - Override generated id
 * @param {string}   opts.event       - data-event binding on the <input>, e.g. 'change:fileSelected'
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'
import { iconUpload } from './icons.js'

export function fileUpload({
  name       = '',
  label      = '',
  hint       = '',
  error      = '',
  accept     = '',
  multiple   = false,
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
  const zoneClasses = ['ui-upload', disabled ? 'ui-upload--disabled' : '', error ? 'ui-upload--error' : ''].filter(Boolean).join(' ')

  const labelHtml = label
    ? `<label for="${fieldId}" class="ui-label">${e(label)}${required ? ' <span class="ui-required" aria-hidden="true">*</span>' : ''}</label>`
    : ''

  const hintHtml  = hint  ? `<p id="${hintId}"  class="ui-hint">${e(hint)}</p>`                  : ''
  const errorHtml = error ? `<p id="${errorId}" class="ui-error" role="alert">${e(error)}</p>`   : ''

  const icon = iconUpload({ size: 24, class: 'ui-upload-icon' })

  // All drag/click/keyboard behaviour is handled by pulse-ui.js via event delegation.
  // No inline handlers needed (and they'd be blocked by CSP anyway).

  return `<div class="${e(wrapClasses)}">
  ${labelHtml}
  <div class="${e(zoneClasses)}" role="button" tabindex="${disabled ? '-1' : '0'}" aria-label="Drag and drop or browse"${disabled ? ' aria-disabled="true"' : ''}
  >
    <div class="ui-upload-body">
      ${icon}
      <span class="ui-upload-text">Drag &amp; drop or <span class="ui-upload-browse">browse</span></span>
    </div>
    <input
      type="file"
      id="${fieldId}"
      name="${e(name)}"
      class="ui-upload-input"
      ${accept    ? `accept="${e(accept)}"`             : ''}
      ${multiple  ? 'multiple'                          : ''}
      ${required  ? 'required aria-required="true"'    : ''}
      ${disabled  ? 'disabled'                         : ''}
      ${event     ? `data-event="${e(event)}"`          : ''}
      ${described ? `aria-describedby="${described}"`  : ''}
      ${error     ? 'aria-invalid="true"'              : ''}
    >
  </div>
  ${hintHtml}
  ${errorHtml}
</div>`
}
