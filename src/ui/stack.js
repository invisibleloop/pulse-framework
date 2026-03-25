/**
 * Pulse UI — Stack
 *
 * Flex column with consistent vertical gap. The simplest way to space
 * a sequence of elements vertically without writing custom CSS.
 *
 * @param {object} opts
 * @param {string} opts.content                         - Raw HTML slot
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} opts.gap          - Gap between children (default: 'md')
 * @param {'stretch'|'start'|'center'|'end'} opts.align - align-items (default: 'stretch')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const GAPS   = new Set(['xs', 'sm', 'md', 'lg', 'xl'])
const ALIGNS = new Set(['stretch', 'start', 'center', 'end'])

export function stack({
  content    = '',
  gap        = 'md',
  align      = 'stretch',
  class: cls = '',
} = {}) {
  if (!GAPS.has(gap))     gap   = 'md'
  if (!ALIGNS.has(align)) align = 'stretch'

  const classes = [
    'ui-stack',
    gap   !== 'md'      && `ui-stack--gap-${gap}`,
    align !== 'stretch' && `ui-stack--align-${align}`,
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${e(classes)}">${content}</div>`
}
