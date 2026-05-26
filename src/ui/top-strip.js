/**
 * Pulse UI — TopStrip
 *
 * A slim utility bar that sits above the nav — phone numbers, trading hours,
 * social links, or any short announcements. Distinct from banner() which is
 * for promotional/dismissible messages.
 *
 * Two layout modes:
 *   - left + right slots: `topStrip({ left: '...', right: '...' })`
 *   - single content: `topStrip({ content: '...' })`
 *
 * @param {object}  opts
 * @param {string}  opts.content    - Single centred content (overrides left/right)
 * @param {string}  opts.left       - Left-aligned slot
 * @param {string}  opts.right      - Right-aligned slot
 * @param {string}  opts.background - CSS background value
 * @param {string}  opts.color      - Foreground/text colour
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function topStrip({
  content    = '',
  left       = '',
  right      = '',
  background = '',
  color      = '',
  class: cls = '',
} = {}) {
  const classes = ['ui-top-strip', cls].filter(Boolean).join(' ')

  const styles = [
    background && `background:${background.replace(/"/g, "'")}`,
    color      && `color:${color.replace(/"/g, "'")}`,
  ].filter(Boolean).join(';')
  const styleAttr = styles ? ` style="${styles}"` : ''

  if (content) {
    return `<div class="${e(classes)}"${styleAttr}><div class="ui-top-strip-content">${content}</div></div>`
  }

  return `<div class="${e(classes)}"${styleAttr}>
  ${left  ? `<div class="ui-top-strip-left">${left}</div>` : ''}
  ${right ? `<div class="ui-top-strip-right">${right}</div>` : ''}
</div>`
}
