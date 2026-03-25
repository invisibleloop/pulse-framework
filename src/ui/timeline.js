/**
 * Pulse UI — Timeline
 *
 * Ordered list of events or steps connected by a line.
 * Supports vertical (default) and horizontal orientations.
 * Each item accepts a raw HTML content slot — pass any component output.
 *
 * @param {object}   opts
 * @param {'vertical'|'horizontal'} opts.direction - Orientation (default: 'vertical')
 * @param {Array}    opts.items   - Array of timelineItem option objects
 * @param {string}   opts.content - Raw HTML alternative to opts.items (advanced)
 * @param {string}   opts.class
 *
 * timelineItem:
 * @param {string}   opts.dot      - Raw HTML inside the dot — SVG icon or emoji
 * @param {'accent'|'success'|'warning'|'error'|'muted'} opts.dotColor
 * @param {string}   opts.label    - Timestamp or step label (escaped)
 * @param {string}   opts.content  - Raw HTML body — any component output
 */

import { escHtml as e } from '../html.js'

const DOT_COLORS = new Set(['accent', 'success', 'warning', 'error', 'muted'])

export function timelineItem({
  dot        = '',
  dotColor   = 'accent',
  label      = '',
  content    = '',
  class: cls = '',
} = {}) {
  if (!DOT_COLORS.has(dotColor)) dotColor = 'accent'

  const dotClasses = [
    'ui-timeline-dot',
    `ui-timeline-dot--${dotColor}`,
    dot ? 'ui-timeline-dot--icon' : '',
  ].filter(Boolean).join(' ')

  const labelHtml = label
    ? `<span class="ui-timeline-label">${e(label)}</span>`
    : ''

  const itemClasses = ['ui-timeline-item', cls].filter(Boolean).join(' ')

  return `<li class="${itemClasses}">
  <div class="ui-timeline-side">
    <div class="ui-timeline-connector ui-timeline-connector--before"></div>
    <div class="${e(dotClasses)}" aria-hidden="true">${dot}</div>
    <div class="ui-timeline-connector ui-timeline-connector--after"></div>
  </div>
  <div class="ui-timeline-main">
    ${labelHtml}
    <div class="ui-timeline-body">${content}</div>
  </div>
</li>`
}

export function timeline({
  direction  = 'vertical',
  items      = [],
  content    = '',
  class: cls = '',
} = {}) {
  if (direction !== 'horizontal') direction = 'vertical'

  const classes = ['ui-timeline', `ui-timeline--${direction}`, cls].filter(Boolean).join(' ')

  const itemsHtml = content || items.map(item => timelineItem(item)).join('')

  return `<ol class="${e(classes)}">${itemsHtml}</ol>`
}
