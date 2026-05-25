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
 * @param {boolean|'purple'|'blue'|'green'|'rose'|'orange'} opts.gradient
 * @param {string}  opts.background    - Arbitrary CSS background value — overrides gradient preset
 * @param {string}  opts.eyebrowColor  - Overrides eyebrow text colour
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const GRADIENT_PRESETS = new Set(['purple', 'blue', 'green', 'rose', 'orange'])
const LAYOUTS          = new Set(['split', 'asymmetric', 'overlap'])

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
  gradient     = false,
  background   = '',
  eyebrowColor = '',
  color        = '',
  class: cls   = '',
} = {}) {
  const hasImage    = Boolean(image)
  const safeLayout  = (hasImage && LAYOUTS.has(layout)) ? layout : 'split'

  // Resolve gradient class
  const gradientClass = gradient
    ? (gradient === true || gradient === 'purple')
      ? 'ui-hero--gradient'
      : GRADIENT_PRESETS.has(gradient) ? `ui-hero--gradient--${gradient}` : ''
    : ''

  const classes = [
    'ui-hero',
    !hasImage && align === 'left' && 'ui-hero--left',
    hasImage && `ui-hero--${safeLayout}`,
    hasImage && safeLayout !== 'overlap' && imageAlign === 'left' && 'ui-hero--media-left',
    size === 'sm' && 'ui-hero--sm',
    gradientClass,
    cls,
  ].filter(Boolean).join(' ')

  const styles = [
    background && `background:${background.replace(/"/g, "'")}`,
    color      && `color:${color.replace(/"/g, "'")};--ui-muted:${color.replace(/"/g, "'")}`,
  ].filter(Boolean).join(';')
  const bgStyle = styles ? ` style="${styles}"` : ''

  const eyebrowStyle = eyebrowColor ? ` style="color:${eyebrowColor.replace(/"/g, "'")}"` : ''
  const content = `
    ${eyebrow  ? `<p class="ui-hero-eyebrow"${eyebrowStyle}>${e(eyebrow)}</p>` : ''}
    ${title    ? `<h1 class="ui-hero-title">${e(title)}</h1>` : ''}
    ${subtitle ? `<p class="ui-hero-subtitle">${e(subtitle)}</p>` : ''}
    ${actions  ? `<div class="ui-hero-actions">${actions}</div>` : ''}`

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

