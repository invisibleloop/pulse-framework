/**
 * Pulse — Image helpers
 *
 * Generates optimised image markup with correct attributes for CLS and LCP.
 * Import in page specs or components:
 *   import { img, picture } from '/@pulse/runtime/image.js'  (dev)
 *   import { img, picture } from '@invisibleloop/pulse/image' (production)
 */

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Generate an optimised <img> tag.
 *
 * Always include width + height to prevent CLS.
 * Use priority: true for the LCP image (above the fold hero).
 *
 * @param {Object} options
 * @param {string}  options.src        - Image URL
 * @param {string}  options.alt        - Alt text (required for accessibility)
 * @param {number}  [options.width]    - Intrinsic width in px — prevents CLS
 * @param {number}  [options.height]   - Intrinsic height in px — prevents CLS
 * @param {boolean} [options.priority] - true for LCP image: eager + high fetchpriority
 * @param {string}  [options.class]    - CSS class
 * @returns {string}
 */
export function img({ src, alt, width, height, priority = false, class: cls }) {
  const attrs = [
    `src="${esc(src)}"`,
    `alt="${esc(alt)}"`,
    width  != null ? `width="${width}"`   : '',
    height != null ? `height="${height}"` : '',
    `loading="${priority ? 'eager' : 'lazy'}"`,
    `decoding="async"`,
    priority ? 'fetchpriority="high"' : '',
    cls ? `class="${esc(cls)}"` : '',
  ].filter(Boolean).join(' ')

  return `<img ${attrs}>`
}

/**
 * Generate a <picture> element with modern format sources + fallback <img>.
 *
 * Provide sources in preference order (AVIF first, then WebP, then fallback src).
 * The fallback src on the <img> is the universal baseline (JPEG/PNG).
 *
 * @param {Object}   options
 * @param {string}   options.src          - Fallback image URL (JPEG/PNG)
 * @param {string}   options.alt          - Alt text
 * @param {number}   [options.width]      - Intrinsic width — prevents CLS
 * @param {number}   [options.height]     - Intrinsic height — prevents CLS
 * @param {boolean}  [options.priority]   - true for LCP image
 * @param {string}   [options.class]      - CSS class applied to <img>
 * @param {Array<{src: string, type: string}>} [options.sources]
 *   Modern format sources, e.g.:
 *   [{ src: '/hero.avif', type: 'image/avif' }, { src: '/hero.webp', type: 'image/webp' }]
 * @returns {string}
 */
export function picture({ src, alt, width, height, priority = false, class: cls, sources = [] }) {
  const sourceEls = sources
    .map(s => `<source srcset="${esc(s.src)}" type="${esc(s.type)}">`)
    .join('\n  ')

  const imgEl = img({ src, alt, width, height, priority, class: cls })

  return `<picture>\n  ${sourceEls}\n  ${imgEl}\n</picture>`
}
