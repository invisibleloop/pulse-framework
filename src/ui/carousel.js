/**
 * Pulse UI — Carousel / Slider
 *
 * CSS scroll-snap carousel with optional prev/next arrows and dot navigation.
 * Requires pulse-ui.js for button and dot interactivity.
 *
 * @param {object}   opts
 * @param {string[]} opts.slides  - Array of raw HTML strings — one per slide
 * @param {boolean}  opts.arrows  - Show prev/next arrow buttons (default: true)
 * @param {boolean}  opts.dots    - Show dot navigation (default: true)
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'
import { iconChevronLeft, iconChevronRight } from './icons.js'

let _carouselId = 0

export function carousel({
  slides     = [],
  arrows     = true,
  dots       = true,
  class: cls = '',
} = {}) {
  const id = `carousel-${++_carouselId}`
  const classes = ['ui-carousel', cls].filter(Boolean).join(' ')

  const slidesHtml = slides
    .map((s, i) => {
      const panelId = `${id}-panel-${i + 1}`
      const tabId   = `${id}-tab-${i + 1}`
      return `<div class="ui-carousel-slide" id="${panelId}" role="tabpanel" aria-labelledby="${tabId}" tabindex="0">${s}</div>`
    })
    .join('\n    ')

  const arrowsHtml = arrows ? `
  <button class="ui-carousel-btn ui-carousel-prev" type="button" aria-label="Previous slide" hidden>
    ${iconChevronLeft({ size: 16 })}
  </button>
  <button class="ui-carousel-btn ui-carousel-next" type="button" aria-label="Next slide"${slides.length <= 1 ? ' hidden' : ''}>
    ${iconChevronRight({ size: 16 })}
  </button>` : ''

  const dotsHtml = dots && slides.length > 1 ? `
  <div class="ui-carousel-dots" role="tablist" aria-label="Slides">
    ${slides.map((_, i) => {
      const tabId   = `${id}-tab-${i + 1}`
      const panelId = `${id}-panel-${i + 1}`
      const active  = i === 0
      return `<button class="ui-carousel-dot${active ? ' active' : ''}" id="${tabId}" type="button" role="tab" aria-selected="${active}" aria-controls="${panelId}" tabindex="${active ? '0' : '-1'}" aria-label="Slide ${i + 1}"></button>`
    }).join('\n    ')}
  </div>` : ''

  return `<div class="${e(classes)}">
  <div class="ui-carousel-track">
    ${slidesHtml}
  </div>${arrowsHtml}${dotsHtml}
</div>`
}
