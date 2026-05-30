/**
 * Pulse UI — Pullquote
 *
 * Styled blockquote with optional attribution.
 *
 * Two variants:
 *  - Default: left accent border — for inline editorial quotes in prose or sidebars
 *  - 'editorial': centred large italic serif, no border — for brand voice statements
 *    in fashion, luxury, or magazine contexts
 *
 * @param {object} opts
 * @param {string} opts.quote  - The quote text
 * @param {string} opts.cite   - Attribution (name, role, etc.)
 * @param {'md'|'lg'} opts.size - Size variant (default: 'md')
 * @param {'default'|'editorial'} opts.variant - Visual style (default: 'default')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function pullquote({
  quote      = '',
  cite       = '',
  size       = 'md',
  variant    = 'default',
  class: cls = '',
} = {}) {
  const figClasses  = [
    'ui-pullquote',
    size === 'lg'           && 'ui-pullquote--lg',
    variant === 'editorial' && 'ui-pullquote--editorial',
    cls,
  ].filter(Boolean).join(' ')

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
