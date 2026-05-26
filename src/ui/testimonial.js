/**
 * Pulse UI — Testimonial
 *
 * A customer quote with optional star rating, avatar, and attribution.
 *
 * @param {object} opts
 * @param {string} opts.quote    - The testimonial text
 * @param {string} opts.name     - Author full name
 * @param {string} opts.role     - Author role/company (e.g. "CEO at Acme")
 * @param {string} opts.src      - Avatar image URL; falls back to initials when omitted
 * @param {string} opts.initials - Override auto-derived initials (useful for names containing & or unusual characters)
 * @param {number} opts.rating   - Star rating 1–5; omit to hide stars
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function testimonial({
  quote      = '',
  name       = '',
  role       = '',
  src        = '',
  initials:  initialsOverride = '',
  rating     = 0,
  class: cls = '',
} = {}) {
  const classes = ['ui-testimonial', cls].filter(Boolean).join(' ')

  const stars = rating > 0
    ? `<p class="ui-testimonial-rating" aria-label="${Math.round(rating)} out of 5 stars">${'★'.repeat(Math.min(5, Math.max(1, Math.round(rating))))}</p>`
    : ''

  // Filter to letter chars only so names like "Tomás & Ren Okabe" produce "TR" not "T&"
  const derivedInitials = name
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-ZÀ-ÿ]/g, ''))
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const initials = initialsOverride || derivedInitials

  const avatarHtml = src
    ? `<img src="${e(src)}" alt="${e(name)}" class="ui-testimonial-avatar" loading="lazy" width="40" height="40">`
    : `<div class="ui-testimonial-avatar ui-testimonial-avatar--initials" aria-hidden="true">${e(initials)}</div>`

  return `<figure class="${e(classes)}">
  ${stars}
  <blockquote class="ui-testimonial-quote"><p>${e(quote)}</p></blockquote>
  <figcaption class="ui-testimonial-author">
    ${avatarHtml}
    <div class="ui-testimonial-meta">
      <p class="ui-testimonial-name">${e(name)}</p>
      ${role ? `<p class="ui-testimonial-role">${e(role)}</p>` : ''}
    </div>
  </figcaption>
</figure>`
}
