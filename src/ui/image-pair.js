/**
 * Pulse UI — Image Pair
 *
 * Two images side by side — no text. A pure editorial layout used in fashion,
 * portfolio, and magazine contexts to present photography at full scale.
 * Both images share the same aspect ratio and fill equal columns.
 *
 * For image + text layouts, use the media() component instead.
 *
 * @param {object}  opts
 * @param {string}  opts.leftSrc       - Left image URL
 * @param {string}  opts.leftAlt       - Left image alt text
 * @param {string}  opts.rightSrc      - Right image URL
 * @param {string}  opts.rightAlt      - Right image alt text
 * @param {string}  opts.ratio         - CSS aspect-ratio for both images (default: '3/4')
 * @param {'none'|'sm'|'md'} opts.gap  - Gap between images (default: 'none')
 * @param {string}  opts.label         - Optional aria-label for the section
 * @param {string}  opts.leftLabel     - Link label below left image (e.g. 'Craftmanship')
 * @param {string}  opts.leftHref      - href for left link
 * @param {string}  opts.rightLabel    - Link label below right image (e.g. 'Store')
 * @param {string}  opts.rightHref     - href for right link
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const GAPS = new Set(['none', 'sm', 'md'])

export function imagePair({
  leftSrc    = '',
  leftAlt    = '',
  rightSrc   = '',
  rightAlt   = '',
  ratio      = '3/4',
  gap        = 'none',
  label      = '',
  leftLabel  = '',
  leftHref   = '#',
  rightLabel = '',
  rightHref  = '#',
  class: cls = '',
} = {}) {
  if (!GAPS.has(gap)) gap = 'none'

  const classes = [
    'ui-image-pair',
    gap !== 'none' && `ui-image-pair--gap-${gap}`,
    (leftLabel || rightLabel) && 'ui-image-pair--captioned',
    cls,
  ].filter(Boolean).join(' ')

  const labelAttr = label ? ` aria-label="${e(label)}"` : ''
  const cropStyle = ratio ? ` style="aspect-ratio:${e(ratio)}"` : ''

  const leftCaption  = leftLabel  ? `<a href="${e(leftHref)}"  class="ui-image-pair-link">${e(leftLabel)} →</a>`  : ''
  const rightCaption = rightLabel ? `<a href="${e(rightHref)}" class="ui-image-pair-link">${e(rightLabel)} →</a>` : ''

  return `<div class="${e(classes)}"${labelAttr}>
  <div class="ui-image-pair-col">
    <div class="ui-image-pair-crop"${cropStyle}>
      <img src="${e(leftSrc)}" alt="${e(leftAlt)}" loading="lazy" decoding="async">
    </div>
    ${leftCaption}
  </div>
  <div class="ui-image-pair-col">
    <div class="ui-image-pair-crop"${cropStyle}>
      <img src="${e(rightSrc)}" alt="${e(rightAlt)}" loading="lazy" decoding="async">
    </div>
    ${rightCaption}
  </div>
</div>`
}
