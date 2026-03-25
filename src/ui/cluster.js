/**
 * Pulse UI — Cluster
 *
 * Flex row with wrapping. Groups inline elements horizontally
 * with consistent gap — buttons, badges, app store badges, stat rows, etc.
 *
 * @param {object} opts
 * @param {string} opts.content                              - Raw HTML slot
 * @param {'xs'|'sm'|'md'|'lg'} opts.gap                   - Gap between children (default: 'md')
 * @param {'start'|'center'|'end'|'between'} opts.justify   - justify-content (default: 'start')
 * @param {'start'|'center'|'end'} opts.align               - align-items (default: 'center')
 * @param {boolean} opts.wrap                               - Allow wrapping (default: true)
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const GAPS     = new Set(['xs', 'sm', 'md', 'lg'])
const JUSTIFYS = new Set(['start', 'center', 'end', 'between'])
const ALIGNS   = new Set(['start', 'center', 'end'])

export function cluster({
  content    = '',
  gap        = 'md',
  justify    = 'start',
  align      = 'center',
  wrap       = true,
  class: cls = '',
} = {}) {
  if (!GAPS.has(gap))       gap     = 'md'
  if (!JUSTIFYS.has(justify)) justify = 'start'
  if (!ALIGNS.has(align))   align   = 'center'

  const classes = [
    'ui-cluster',
    gap     !== 'md'     && `ui-cluster--gap-${gap}`,
    justify !== 'start'  && `ui-cluster--justify-${justify}`,
    align   !== 'center' && `ui-cluster--align-${align}`,
    !wrap                && 'ui-cluster--nowrap',
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${e(classes)}">${content}</div>`
}
