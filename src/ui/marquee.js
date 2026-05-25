/**
 * Pulse UI — Marquee
 *
 * CSS-only infinite scrolling strip. Ideal for logo clouds, trust badges,
 * press mentions, or tag lists. No JavaScript — pure CSS animation.
 *
 * @param {object}  opts
 * @param {string[]} opts.items    - Array of raw HTML strings (logos, badges, text)
 * @param {number}  opts.speed     - Duration in seconds for one full loop (default: 30)
 * @param {'sm'|'md'|'lg'} opts.gap - Gap between items (default: 'lg')
 * @param {'left'|'right'} opts.direction - Scroll direction (default: 'left')
 * @param {boolean} opts.pause     - Pause animation on hover (default: true)
 * @param {boolean} opts.fade      - Fade edges with gradient mask (default: true)
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const GAPS = new Set(['sm', 'md', 'lg'])

export function marquee({
  items     = [],
  speed     = 30,
  gap       = 'lg',
  direction = 'left',
  pause     = true,
  fade      = true,
  class: cls = '',
} = {}) {
  if (!GAPS.has(gap)) gap = 'lg'
  const safeSpeed = Math.max(5, parseFloat(speed) || 30)
  const dir       = direction === 'right' ? 'reverse' : 'normal'

  const classes = [
    'ui-marquee',
    gap !== 'lg' && `ui-marquee--gap-${gap}`,
    pause       && 'ui-marquee--pause',
    fade        && 'ui-marquee--fade',
    cls,
  ].filter(Boolean).join(' ')

  // Items are duplicated so the loop is seamless
  const itemsHtml = items.map(item => `<li class="ui-marquee-item">${item}</li>`).join('')

  return `<div class="${e(classes)}" style="--marquee-speed:${safeSpeed}s;--marquee-dir:${dir}" aria-hidden="true">
  <ul class="ui-marquee-track">${itemsHtml}${itemsHtml}</ul>
</div>`
}
