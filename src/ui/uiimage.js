/**
 * Pulse UI — Image
 *
 * Responsive image with optional aspect-ratio crop, caption, and rounded corners.
 * Always uses loading="lazy" and decoding="async".
 *
 * @param {object}  opts
 * @param {string}  opts.src      - Image source URL
 * @param {string}  opts.alt      - Alt text (required for accessibility)
 * @param {string}  opts.caption  - Optional figcaption text
 * @param {string}  opts.ratio    - CSS aspect-ratio string e.g. '16/9', '4/3', '1/1'
 * @param {boolean} opts.rounded  - Larger corner radius (1rem) — for photos, cards, book covers
 * @param {boolean} opts.pill     - Full pill/stadium radius (999px) — for avatars or circular crops
 * @param {number|string} opts.width    - img width attribute (browser hint only)
 * @param {number|string} opts.height   - img height attribute
 * @param {number|string} opts.maxWidth - CSS max-width on the figure (px value or CSS string). Use this to constrain portrait/narrow images inside wide columns.
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function uiImage({
  src        = '',
  alt        = '',
  caption    = '',
  ratio      = '',
  rounded    = false,
  pill       = false,
  width      = '',
  height     = '',
  maxWidth   = '',
  class: cls = '',
} = {}) {
  // The outer figure uses display:contents so the inner crop div
  // becomes a direct flex/block child of whatever container holds it.
  // This is required for aspect-ratio to resolve correctly in flex contexts.
  const figClasses = ['ui-image', rounded ? 'ui-image--rounded' : '', pill ? 'ui-image--pill' : '', cls].filter(Boolean).join(' ')

  const maxWidthStyle = maxWidth
    ? ` style="max-width:${e(typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth)};margin-left:auto;margin-right:auto"`
    : ''

  const widthAttr  = width  ? ` width="${e(String(width))}"` : ''
  const heightAttr = height ? ` height="${e(String(height))}"` : ''

  const captionHtml = caption
    ? `<figcaption class="ui-image-caption">${e(caption)}</figcaption>`
    : ''

  if (ratio) {
    return `<figure class="${e(figClasses)}"${maxWidthStyle}>
  <div class="ui-image-crop">
    <img src="${e(src)}" alt="${e(alt)}" class="ui-image-img--cover" style="aspect-ratio:${e(ratio)}"${widthAttr}${heightAttr} loading="lazy" decoding="async">
  </div>
  ${captionHtml}
</figure>`
  }

  return `<figure class="${e(figClasses)}"${maxWidthStyle}>
  <div class="ui-image-wrap">
    <img src="${e(src)}" alt="${e(alt)}" class="ui-image-img"${widthAttr}${heightAttr} loading="lazy" decoding="async">
  </div>
  ${captionHtml}
</figure>`
}
