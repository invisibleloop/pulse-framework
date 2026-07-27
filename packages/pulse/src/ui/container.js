/**
 * Pulse UI — Container
 *
 * Max-width wrapper with horizontal padding. Every page section needs one.
 *
 * @param {object} opts
 * @param {string} opts.content        - Raw HTML slot
 * @param {'sm'|'md'|'lg'|'xl'} opts.size - Max-width preset (default: 'lg')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const SIZES = new Set(['sm', 'md', 'lg', 'xl'])

export function container({
  content    = '',
  size       = 'lg',
  class: cls = '',
} = {}) {
  if (!SIZES.has(size)) size = 'lg'
  const classes = ['ui-container', `ui-container--${size}`, cls].filter(Boolean).join(' ')
  return `<div class="${e(classes)}">${content}</div>`
}
