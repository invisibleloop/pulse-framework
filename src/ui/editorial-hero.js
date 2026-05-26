/**
 * Pulse UI — Editorial Hero
 *
 * Full-bleed hero with two side-by-side images and display text that
 * overlaps both columns simultaneously. The text uses mix-blend-mode: multiply
 * so it visually "lives inside" the photography — a signature technique in
 * fashion and luxury editorial design.
 *
 * The overlay text is decorative (aria-hidden) with a separate accessible
 * heading provided via the `heading` param.
 *
 * @param {object}         opts
 * @param {string}         opts.leftImage   - Raw HTML slot for the left image (<img>, uiImage, etc.)
 * @param {string}         opts.rightImage  - Raw HTML slot for the right image
 * @param {string|string[]} opts.lines      - Headline text — string or array of lines
 * @param {string}         opts.heading     - Accessible heading text (sr-only, replaces lines for AT)
 * @param {string}         opts.cta         - Raw HTML slot — optional CTA link at the bottom
 * @param {string}         opts.color       - Overlay text colour (default: var(--ui-color-accent))
 * @param {'multiply'|'screen'|'overlay'|'none'} opts.blend - blend-mode for overlay text (default: 'multiply')
 * @param {string}         opts.ratio       - Image aspect-ratio CSS string (default: '3/4')
 * @param {string}         opts.class
 */

import { escHtml as e } from '../html.js'

const BLENDS = new Set(['multiply', 'screen', 'overlay', 'none'])

export function editorialHero({
  leftImage  = '',
  rightImage = '',
  lines      = [],
  heading    = '',
  cta        = '',
  color      = '',
  blend      = 'multiply',
  ratio      = '3/4',
  class: cls = '',
} = {}) {
  if (!BLENDS.has(blend)) blend = 'multiply'

  const classes   = ['ui-editorial-hero', cls].filter(Boolean).join(' ')
  const lineArray = Array.isArray(lines) ? lines : [lines]

  const overlayStyle = [
    color ? `color:${color.replace(/"/g, "'")}` : '',
    blend !== 'none' ? `mix-blend-mode:${blend}` : '',
  ].filter(Boolean).join(';')

  const overlayAttr = overlayStyle ? ` style="${overlayStyle}"` : ''
  const imageStyle  = ratio ? ` style="aspect-ratio:${e(ratio)}"` : ''

  const linesHtml = lineArray.map(l => `<span>${e(l)}</span>`).join('')

  return `<section class="${e(classes)}">
  ${heading ? `<h1 class="ui-editorial-hero-heading">${e(heading)}</h1>` : ''}
  <div class="ui-editorial-hero-images"${imageStyle}>
    <div class="ui-editorial-hero-img">${leftImage}</div>
    <div class="ui-editorial-hero-img">${rightImage}</div>
  </div>
  ${linesHtml ? `<div class="ui-editorial-hero-overlay" aria-hidden="true"${overlayAttr}>${linesHtml}</div>` : ''}
  ${cta ? `<div class="ui-editorial-hero-cta">${cta}</div>` : ''}
</section>`
}
