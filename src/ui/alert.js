/**
 * Pulse UI — Alert
 *
 * Inline feedback message. error/warning use role="alert" (assertive),
 * info/success use role="status" (polite).
 *
 * @param {object}  opts
 * @param {'info'|'success'|'warning'|'error'} opts.variant
 * @param {string}  opts.title   - Bold heading (optional)
 * @param {string}  opts.content - Message body — HTML string, not escaped
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'
import { iconInfo, iconCheckCircle, iconAlertTriangle, iconXCircle } from './icons.js'

const VARIANTS = new Set(['info', 'success', 'warning', 'error'])

const ICONS = {
  info:    iconInfo({ size: 18 }),
  success: iconCheckCircle({ size: 18 }),
  warning: iconAlertTriangle({ size: 18 }),
  error:   iconXCircle({ size: 18 }),
}

export function alert({
  variant    = 'info',
  title      = '',
  content    = '',
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'info'

  const role    = (variant === 'error' || variant === 'warning') ? 'alert' : 'status'
  const classes = ['ui-alert', `ui-alert--${variant}`, cls].filter(Boolean).join(' ')

  const titleHtml = title ? `<strong class="ui-alert-title">${e(title)}</strong> ` : ''

  return `<div class="${e(classes)}" role="${role}">
  <span class="ui-alert-icon">${ICONS[variant]}</span>
  <div class="ui-alert-body">${titleHtml}${content}</div>
</div>`
}
