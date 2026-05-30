/**
 * Pulse UI — Product Card
 *
 * Full-bleed editorial product card — the image IS the card. The product
 * name (and optional price) overlays at the bottom on hover. Designed for
 * fashion/e-commerce grids where photography is the primary communication.
 *
 * Unlike photoCard (polaroid frame + caption always visible), this card is
 * frameless: the image fills 100% of the card, and metadata is revealed on
 * hover via a gradient overlay.
 *
 * @param {object}  opts
 * @param {string}  opts.src          - Image source URL
 * @param {string}  opts.alt          - Alt text
 * @param {string}  opts.name         - Product name
 * @param {string}  opts.price        - Optional price string
 * @param {string}  opts.href         - Link destination (default: '#')
 * @param {string}  opts.badge        - Short badge text ("NEW", "SALE", "−20%")
 * @param {'left'|'right'} opts.badgeAlign - Badge corner (default: 'left')
 * @param {string}  opts.ratio        - CSS aspect-ratio (default: '4/5')
 * @param {'overlay'|'below'} opts.layout - 'overlay' (hover reveal) or 'below' (caption under image)
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

export function productCard({
  src        = '',
  alt        = '',
  name       = '',
  price      = '',
  href       = '#',
  badge      = '',
  badgeAlign = 'left',
  ratio      = '4/5',
  layout     = 'overlay',
  class: cls = '',
} = {}) {
  const classes = [
    'ui-product-card',
    badgeAlign === 'right' && 'ui-product-card--badge-right',
    layout === 'below' && 'ui-product-card--below',
    cls,
  ].filter(Boolean).join(' ')

  const cropStyle = ratio ? ` style="aspect-ratio:${e(ratio)}"` : ''

  const namePrice = name ? (layout === 'below'
    ? `<div class="ui-product-card-caption">
    <p class="ui-product-card-name">${e(name)}</p>
    ${price ? `<p class="ui-product-card-price">${e(price)}</p>` : ''}
  </div>`
    : `<div class="ui-product-card-overlay" aria-hidden="true">
    <p class="ui-product-card-name">${e(name)}</p>
    ${price ? `<p class="ui-product-card-price">${e(price)}</p>` : ''}
  </div>`) : ''

  return `<a href="${e(href)}" class="${e(classes)}">
  <div class="ui-product-card-crop"${cropStyle}>
    <img src="${e(src)}" alt="${e(alt)}" class="ui-product-card-img" loading="lazy" decoding="async">
  </div>
  ${badge ? `<span class="ui-product-card-badge">${e(badge)}</span>` : ''}
  ${namePrice}
</a>`
}
