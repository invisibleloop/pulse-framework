/**
 * Pulse UI — Pullquote
 *
 * Styled blockquote with accent left border and optional attribution.
 *
 * @param {object} opts
 * @param {string} opts.quote  - The quote text
 * @param {string} opts.cite   - Attribution (name, role, etc.)
 * @param {'md'|'lg'} opts.size - Size variant (default: 'md')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function pullquote({
  quote      = '',
  cite       = '',
  size       = 'md',
  class: cls = '',
} = {}) {
  const sizeClass   = size === 'lg' ? 'ui-pullquote--lg' : ''
  const figClasses  = ['ui-pullquote', sizeClass, cls].filter(Boolean).join(' ')

  const citeHtml = cite
    ? `<figcaption class="ui-pullquote-cite">${e(cite)}</figcaption>`
    : ''

  return `<figure class="${e(figClasses)}">
  <blockquote>
    <p class="ui-pullquote-text">${e(quote)}</p>
  </blockquote>
  ${citeHtml}
</figure>`
}
