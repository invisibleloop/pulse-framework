/**
 * Pulse UI — Fieldset
 *
 * Semantic grouping of related form fields. Renders a <fieldset> with an
 * accessible <legend>, styled to match the design system. Use inside a
 * card() or directly inside a <form>.
 *
 * @param {object} opts
 * @param {string} opts.legend   - Group label (renders as <legend>)
 * @param {string} opts.content  - Raw HTML slot — input(), select(), grid(), etc.
 * @param {'xs'|'sm'|'md'|'lg'} opts.gap - Gap between fields (default: 'md')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const GAPS = new Set(['xs', 'sm', 'md', 'lg'])

export function fieldset({
  legend     = '',
  content    = '',
  gap        = 'md',
  class: cls = '',
} = {}) {
  if (!GAPS.has(gap)) gap = 'md'

  const classes = [
    'ui-fieldset',
    gap !== 'md' && `ui-fieldset--gap-${gap}`,
    cls,
  ].filter(Boolean).join(' ')

  return `<fieldset class="${e(classes)}">
  ${legend ? `<legend class="ui-fieldset-legend">${e(legend)}</legend>` : ''}
  <div class="ui-fieldset-body">${content}</div>
</fieldset>`
}
