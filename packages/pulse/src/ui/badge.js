/**
 * Pulse UI — Badge
 *
 * Inline label for status, category, or count.
 *
 * @param {object} opts
 * @param {string} opts.label
 * @param {'default'|'success'|'warning'|'error'|'info'} opts.variant
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['default', 'success', 'warning', 'error', 'info'])

export function badge({
  label      = '',
  variant    = 'default',
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'default'
  const classes = ['ui-badge', `ui-badge--${variant}`, cls].filter(Boolean).join(' ')
  return `<span class="${e(classes)}">${e(label)}</span>`
}
