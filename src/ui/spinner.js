/**
 * Pulse UI — Spinner
 *
 * CSS-animated loading indicator. No JavaScript required.
 *
 * @param {object} opts
 * @param {'sm'|'md'|'lg'} opts.size
 * @param {'accent'|'muted'|'white'} opts.color
 * @param {string} opts.label  - Accessible label (default: 'Loading…')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const SIZES  = { sm: '1rem',    md: '1.5rem',  lg: '2.5rem'  }
const COLORS = { accent: 'var(--ui-accent)', muted: 'var(--ui-muted)', white: '#fff' }

export function spinner({
  size       = 'md',
  color      = 'accent',
  label      = 'Loading…',
  class: cls = '',
} = {}) {
  const sz  = SIZES[size]   ?? SIZES.md
  const clr = COLORS[color] ?? COLORS.accent
  const classes = ['ui-spinner', cls].filter(Boolean).join(' ')

  return `<span
  class="${e(classes)}"
  role="status"
  aria-label="${e(label)}"
  style="--spinner-size:${sz};--spinner-color:${clr}"
></span>`
}
