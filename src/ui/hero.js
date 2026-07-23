/**
 * Pulse UI — Hero
 *
 * Full-width hero section with eyebrow, headline, subheadline, and action slot.
 * Pass `image` HTML to activate the split layout — text on one side, image on the other.
 *
 * @param {object}  opts
 * @param {string}  opts.eyebrow      - Small label above the title (e.g. "Now available")
 * @param {string}  opts.title        - Main headline
 * @param {string}  opts.subtitle     - Supporting text beneath the headline
 * @param {string}  opts.actions      - Raw HTML slot — typically button() or appBadge() calls
 * @param {string}  opts.image        - Raw HTML slot for the image
 * @param {'right'|'left'} opts.imageAlign - Which side the image sits on (default: 'right')
 * @param {'center'|'left'} opts.align    - Text alignment when no image (default: 'center')
 * @param {'md'|'sm'} opts.size           - Vertical padding: 'md' (default, 5rem) or 'sm' (2.5rem)
 * @param {'split'|'asymmetric'|'overlap'} opts.layout - Layout when image is provided.
 *   'split' (default): 50/50 columns.
 *   'asymmetric': 60/40 text-heavy columns.
 *   'overlap': image fills the section background, text overlaid with dark gradient.
 * @param {string}  opts.background    - Arbitrary CSS background value
 * @param {string}  opts.backgroundImage - CSS background-image value (url, gradient, etc) — enables full-bleed mode
 * @param {boolean|number} opts.overlay - Dark overlay opacity for backgroundImage mode (0–1, or true for 0.4 default)
 * @param {string}  opts.eyebrowColor  - Overrides eyebrow text colour
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const LAYOUTS = new Set(['split', 'asymmetric', 'overlap'])

export function hero({
  eyebrow     = '',
  title       = '',
  subtitle    = '',
  actions     = '',
  image       = '',
  imageAlign  = 'right',
  align       = 'center',
  size        = 'md',
  layout      = 'split',
  background   = '',
  backgroundImage = '',
  overlay      = false,
  eyebrowColor = '',
  color        = '',
  class: cls   = '',
} = {}) {
  const hasImage    = Boolean(image)
  const hasBackgroundImage = Boolean(backgroundImage)
  const safeLayout  = (hasImage && LAYOUTS.has(layout)) ? layout : 'split'

  const classes = [
    'ui-hero',
    !hasImage && !hasBackgroundImage && align === 'left' && 'ui-hero--left',
    hasImage && `ui-hero--${safeLayout}`,
    hasImage && safeLayout !== 'overlap' && imageAlign === 'left' && 'ui-hero--media-left',
    hasBackgroundImage && 'ui-hero--bg-image',
    size === 'sm' && 'ui-hero--sm',
    cls,
  ].filter(Boolean).join(' ')

  // Build inline styles
  const styleArr = []
  if (background) styleArr.push(`background:${background.replace(/"/g, "'")}`)
  if (backgroundImage) {
    styleArr.push(`background-image:${backgroundImage.replace(/"/g, "'")}`)
    styleArr.push(`background-size:cover`)
    styleArr.push(`background-position:center`)
    styleArr.push(`position:relative`)
  }
  if (color) {
    styleArr.push(`color:${color.replace(/"/g, "'")}`)
    styleArr.push(`--ui-muted:${color.replace(/"/g, "'")}`)
  }
  
  const styles = styleArr.join(';')
  const bgStyle = styles ? ` style="${styles}"` : ''

  // Overlay for background-image mode
  const overlayOpacity = overlay === true ? 0.4 : (typeof overlay === 'number' ? overlay : 0)
  const overlayHtml = hasBackgroundImage && overlay
    ? `<div class="ui-hero-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,${overlayOpacity});pointer-events:none;"></div>`
    : ''

  const eyebrowStyle = eyebrowColor ? ` style="color:${eyebrowColor.replace(/"/g, "'")}"` : ''
  const content = `
    ${eyebrow  ? `<p class="ui-hero-eyebrow"${eyebrowStyle}>${e(eyebrow)}</p>` : ''}
    ${title    ? `<h1 class="ui-hero-title">${e(title)}</h1>` : ''}
    ${subtitle ? `<p class="ui-hero-subtitle">${e(subtitle)}</p>` : ''}
    ${actions  ? `<div class="ui-hero-actions">${actions}</div>` : ''}`

  // Full-bleed background-image mode
  if (hasBackgroundImage) {
    return `<section class="${e(classes)}"${bgStyle}>
  ${overlayHtml}
  <div class="ui-hero-inner" style="position:relative;z-index:1;">${content}
  </div>
</section>`
  }

  // No image — centered or left-aligned
  if (!hasImage) {
    return `<section class="${e(classes)}"${bgStyle}>
  <div class="ui-hero-inner">${content}
  </div>
</section>`
  }

  // Overlap: image fills the section, text overlaid
  if (safeLayout === 'overlap') {
    return `<section class="${e(classes)}"${bgStyle}>
  <div class="ui-hero-overlap-media" aria-hidden="true">${image}</div>
  <div class="ui-hero-inner">
    <div class="ui-hero-content">${content}
    </div>
  </div>
</section>`
  }

  // Split or asymmetric
  return `<section class="${e(classes)}"${bgStyle}>
  <div class="ui-hero-inner">
    <div class="ui-hero-content">${content}
    </div>
    <div class="ui-hero-media">${image}</div>
  </div>
</section>`
}

