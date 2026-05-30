/**
 * Pulse UI — Gallery
 *
 * Responsive image grid for photos, illustrations, or any visual content.
 * Three layout modes: grid (equal cells), strip (single scrollable row), masonry (Pinterest-style).
 *
 * @param {object}  opts
 * @param {Array<{src:string,alt:string,caption?:string,href?:string}>} opts.images
 * @param {'grid'|'strip'|'masonry'} opts.layout - Grid layout (default: 'grid')
 * @param {1|2|3|4} opts.cols     - Columns in grid/masonry layout (default: 3)
 * @param {'sm'|'md'|'lg'} opts.gap - Gap between images (default: 'md')
 * @param {boolean} opts.rounded  - Rounded corners on images
 * @param {string}  opts.ratio    - CSS aspect-ratio for grid/strip cells e.g. '4/3', '1/1', '16/9'
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const LAYOUTS = new Set(['grid', 'strip', 'masonry'])
const GAPS    = new Set(['sm', 'md', 'lg'])

export function gallery({
  images  = [],
  layout  = 'grid',
  cols    = 3,
  gap     = 'md',
  rounded = false,
  ratio   = '4/3',
  class: cls = '',
} = {}) {
  if (!LAYOUTS.has(layout)) layout = 'grid'
  if (!GAPS.has(gap))       gap    = 'md'
  const safeC = Math.min(Math.max(Math.floor(cols), 1), 4)

  const classes = [
    'ui-gallery',
    `ui-gallery--${layout}`,
    `ui-gallery--cols-${safeC}`,
    gap !== 'md' && `ui-gallery--gap-${gap}`,
    rounded     && 'ui-gallery--rounded',
    cls,
  ].filter(Boolean).join(' ')

  const items = images.map(img => {
    const imgTag = `<img src="${e(img.src)}" alt="${e(img.alt || '')}" class="ui-gallery-img" loading="lazy" decoding="async">`
    const cap    = img.caption ? `<figcaption class="ui-gallery-caption">${e(img.caption)}</figcaption>` : ''
    const inner  = img.href
      ? `<a href="${e(img.href)}" class="ui-gallery-link">${imgTag}</a>`
      : imgTag
    const cropStyle = (layout !== 'masonry' && ratio) ? ` style="aspect-ratio:${e(ratio)}"` : ''
    const crop = `<div class="ui-gallery-crop"${cropStyle}>${inner}</div>`
    return `<figure class="ui-gallery-item">${crop}${cap}</figure>`
  }).join('\n')

  return `<div class="${e(classes)}">\n${items}\n</div>`
}
