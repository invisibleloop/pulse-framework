/**
 * Pulse UI — Search
 *
 * Search input with icon, optional clear button, and label.
 * Handles the native browser cancel button, debounce binding,
 * and the clear event all in one component.
 *
 * @param {object}  opts
 * @param {string}  opts.name         - Field name (also used as id base)
 * @param {string}  opts.label        - Label text (visually shown or screen-reader only)
 * @param {boolean} opts.labelHidden  - Hide label visually but keep for screen readers
 * @param {string}  opts.placeholder
 * @param {string}  opts.value        - Current search value (for re-renders)
 * @param {string}  opts.event        - data-event binding, e.g. 'input:setSearch'
 * @param {number}  opts.debounce     - Debounce delay in ms (default: 200)
 * @param {string}  opts.clearEvent   - Click event fired by the clear button (shown when value is non-empty)
 * @param {boolean} opts.disabled
 * @param {string}  opts.id           - Override generated id
 * @param {string}  opts.class
 * @param {object}  opts.attrs        - Extra HTML attributes for the <input>
 */

import { escHtml as e } from '../html.js'
import { iconSearch, iconX } from './icons.js'

export function search({
  name        = '',
  label       = '',
  labelHidden = false,
  placeholder = '',
  value       = '',
  event       = '',
  debounce    = 200,
  clearEvent  = '',
  disabled    = false,
  id          = '',
  class: cls  = '',
  attrs       = {},
} = {}) {
  const fieldId  = e(id || `field-${name}`)

  const wrapClasses = ['ui-field', 'ui-search', cls].filter(Boolean).join(' ')

  const labelClasses = ['ui-label', labelHidden ? 'ui-sr-only' : ''].filter(Boolean).join(' ')

  const labelHtml = label
    ? `<label for="${fieldId}" class="${labelClasses}">${e(label)}</label>`
    : ''

  const attrsStr = Object.entries(attrs)
    .map(([k, v]) => ` ${e(k)}="${e(String(v))}"`)
    .join('')

  const clearBtn = clearEvent && value
    ? `<button class="ui-search-clear" data-event="${e(clearEvent)}" type="button" aria-label="Clear search">${iconX({ size: 14 })}</button>`
    : ''

  return `<div class="${e(wrapClasses)}">
  ${labelHtml}
  <div class="ui-search-wrap">
    <span class="ui-search-icon" aria-hidden="true">${iconSearch({ size: 16 })}</span>
    <input
      id="${fieldId}"
      name="${e(name)}"
      type="search"
      class="ui-search-input"
      ${placeholder ? `placeholder="${e(placeholder)}"` : ''}
      ${value       ? `value="${e(value)}"`              : ''}
      ${disabled    ? 'disabled'                         : ''}
      ${event       ? `data-event="${e(event)}"`         : ''}
      ${event && debounce > 0 ? `data-debounce="${debounce}"` : ''}
      ${attrsStr}
    >
    ${clearBtn}
  </div>
</div>`
}
