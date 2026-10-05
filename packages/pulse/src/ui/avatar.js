/**
 * Pulse UI — Avatar
 *
 * User image or initials fallback. Renders <img> when src is provided,
 * <span> with initials otherwise. Initials are derived from alt text if not
 * explicitly provided.
 *
 * @param {object} opts
 * @param {string} opts.src       - Image URL (optional)
 * @param {string} opts.alt       - Alt text / name (used to derive initials)
 * @param {'sm'|'md'|'lg'|'xl'}  opts.size
 * @param {string} opts.initials  - Override derived initials
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const SIZES = new Set(['sm', 'md', 'lg', 'xl'])

function deriveInitials(alt) {
  return (alt || '')
    .trim()
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

export function avatar({
  src        = '',
  alt        = '',
  size       = 'md',
  initials   = '',
  class: cls = '',
} = {}) {
  if (!SIZES.has(size)) size = 'md'

  const classes = ['ui-avatar', `ui-avatar--${size}`, cls].filter(Boolean).join(' ')

  if (src) {
    return `<img src="${e(src)}" alt="${e(alt)}" class="${e(classes)}" width="40" height="40" loading="lazy" decoding="async">`
  }

  const display = initials || deriveInitials(alt)
  return `<span class="${e(classes)}" aria-label="${e(alt || 'Avatar')}" role="img">${e(display)}</span>`
}
