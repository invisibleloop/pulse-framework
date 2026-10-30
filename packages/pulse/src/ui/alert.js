/**
 * Pulse UI — Alert
 *
 * Inline feedback message. error/warning use role="alert" (assertive),
 * info/success use role="status" (polite).
 *
 * @param {object}  opts
 * @param {'info'|'success'|'warning'|'error'} opts.variant
 * @param {string}  opts.title   - Bold heading (optional)
 * @param {string}  opts.message - Message body as plain text — escaped, so it is safe for user or error text
 * @param {string}  opts.content - Message body as an HTML string — NOT escaped. Use `message` for text.
 * @param {Array<{ text: string, href?: string }>} opts.items - Lines under the message, as plain text, escaped. With `href` a line is a link, for example an error that jumps to its field (`href: '#email'`). Use this for a list of errors from a user or a form.
 * @param {string}  opts.class
 */

import { escHtml as e, safeUrl } from '../html.js'
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
  message    = '',
  content    = '',
  items      = [],
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'info'

  const role    = (variant === 'error' || variant === 'warning') ? 'alert' : 'status'
  const classes = ['ui-alert', `ui-alert--${variant}`, cls].filter(Boolean).join(' ')

  const titleHtml = title ? `<strong class="ui-alert-title">${e(title)}</strong> ` : ''

  const list = Array.isArray(items) && items.length
    ? `<ul class="ui-alert-list">${items.map(item => {
        const line = typeof item === 'string' ? { text: item } : (item ?? {})
        const text = e(line.text ?? '')
        return `<li>${line.href ? `<a href="${e(safeUrl(line.href))}">${text}</a>` : text}</li>`
      }).join('')}</ul>`
    : ''

  return `<div class="${e(classes)}" role="${role}">
  <span class="ui-alert-icon">${ICONS[variant]}</span>
  <div class="ui-alert-body">${titleHtml}${content || e(message)}${list}</div>
</div>`
}
