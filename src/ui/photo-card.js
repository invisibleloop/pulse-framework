/**
 * Pulse UI — PhotoCard
 *
 * Polaroid-style photo card with optional caption and CSS tilt.
 * Ideal for "meet the team", testimonial portraits, or lifestyle photography.
 *
 * @param {object}  opts
 * @param {string}  opts.src      - Image source URL
 * @param {string}  opts.alt      - Alt text
 * @param {string}  opts.caption  - Caption text below the photo
 * @param {number}  opts.tilt     - CSS rotate degrees, e.g. 2 or -1.5. 0 = no tilt (default)
 * @param {boolean} opts.rounded  - Adds corner radius to the image (default: false = square crop)
 * @param {string}  opts.ratio    - CSS aspect-ratio for the image crop (default: '4/3')
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function photoCard({
  src     = '',
  alt     = '',
  caption = '',
  tilt    = 0,
  rounded = false,
  ratio   = '4/3',
  class: cls = '',
} = {}) {
  const safeTilt = parseFloat(tilt) || 0
  const classes  = [
    'ui-photo-card',
    rounded && 'ui-photo-card--rounded',
    cls,
  ].filter(Boolean).join(' ')

  const tiltStyle = safeTilt ? ` style="--photo-tilt:${safeTilt}deg"` : ''
  const cropStyle = ratio ? ` style="aspect-ratio:${e(ratio)}"` : ''

  return `<figure class="${e(classes)}"${tiltStyle}>
  <div class="ui-photo-card-crop"${cropStyle}>
    <img src="${e(src)}" alt="${e(alt)}" class="ui-photo-card-img" loading="lazy" decoding="async">
  </div>
  ${caption ? `<figcaption class="ui-photo-card-caption">${e(caption)}</figcaption>` : ''}
</figure>`
}
