/**
 * Pulse UI — Heading
 *
 * Styled heading with the correct semantic tag. Use this instead of raw <h1>–<h6>
 * to get consistent typography tokens without needing to remember utility classes.
 *
 * Does NOT add margin — use u-mt-* / u-mb-* utility classes for spacing.
 *
 * @param {object} opts
 * @param {number}  opts.level    - 1–6, controls the HTML tag
 * @param {string}  opts.text     - Heading text (escaped)
 * @param {string}  [opts.size]   - Override visual size: 'xs'|'sm'|'base'|'lg'|'xl'|'2xl'|'3xl'|'4xl'
 *                                  Defaults to the level's natural size.
 * @param {string}  [opts.color]   - 'default'|'muted'|'accent' (default: 'default')
 * @param {boolean} [opts.balance] - Add text-wrap: balance to prevent orphaned words on the last line
 * @param {string}  [opts.class]   - Extra classes on the element
 */

import { escHtml as e } from '../html.js'

const LEVEL_SIZE = { 1: '4xl', 2: '3xl', 3: '2xl', 4: 'xl', 5: 'base', 6: 'sm' }

export function heading({
  level      = 2,
  text       = '',
  size,
  color      = 'default',
  balance    = false,
  class: cls = '',
} = {}) {
  const tag      = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`
  const sizeKey  = size || LEVEL_SIZE[level] || 'base'
  const weight   = level <= 3 ? 'bold' : 'semibold'
  const colorCls = color !== 'default' ? ` u-text-${color}` : ''
  const classes  = [
    `u-text-${sizeKey}`,
    `u-font-${weight}`,
    'u-leading-tight',
    colorCls,
    balance ? 'u-text-balance' : '',
    cls,
  ].filter(Boolean).join(' ')

  return `<${tag} class="${classes}">${e(text)}</${tag}>`
}
