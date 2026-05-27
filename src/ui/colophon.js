/**
 * Pulse UI — Colophon
 *
 * Paperback-style end-of-page metadata block. A minimal footer
 * variant with tight type, no columns, centered layout.
 *
 * @param {object} opts
 * @param {string} opts.content - Raw HTML content slot
 * @param {'left'|'center'} opts.align - Text alignment (default 'center')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function colophon({
  content    = '',
  align      = 'center',
  class: cls = '',
} = {}) {
  const classes = [
    'ui-colophon',
    align === 'left' && 'ui-colophon--left',
    cls,
  ].filter(Boolean).join(' ')

  return `<footer class="${e(classes)}">
  <div class="ui-colophon-inner">${content}</div>
</footer>`
}
