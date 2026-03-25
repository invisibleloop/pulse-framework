/**
 * Pulse UI — Stepper
 *
 * Horizontal step progress indicator.
 * Steps before `current` are complete (filled accent dot with check icon).
 * The step at `current` is active (accent border + accent number).
 * Steps after `current` are upcoming (muted border + muted number).
 *
 * @param {object}  opts
 * @param {Array}   opts.steps    - Array of step label strings
 * @param {number}  opts.current  - 0-based index of the active step
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'
import { iconCheck } from './icons.js'

const CHECK_SVG = iconCheck({ size: 12 })

export function stepper({
  steps      = [],
  current    = 0,
  class: cls = '',
} = {}) {
  const wrapClasses = ['ui-stepper', cls].filter(Boolean).join(' ')

  const items = steps.map((label, i) => {
    const isComplete = i < current
    const isActive   = i === current

    const modClass = isComplete ? 'ui-stepper-item--complete'
      : isActive   ? 'ui-stepper-item--active'
      : ''

    const dot = isComplete
      ? `<div class="ui-stepper-dot">${CHECK_SVG}</div>`
      : `<div class="ui-stepper-dot">${i + 1}</div>`

    return `<div class="ui-stepper-item${modClass ? ` ${modClass}` : ''}">
  ${dot}
  <span class="ui-stepper-label">${e(label)}</span>
</div>`
  }).join('')

  return `<div class="${e(wrapClasses)}">${items}</div>`
}
