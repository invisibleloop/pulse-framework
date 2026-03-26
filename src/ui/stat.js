/**
 * Pulse UI — Stat
 *
 * A single metric with label, value, and optional trend indicator.
 *
 * @param {object} opts
 * @param {string} opts.label
 * @param {string} opts.value   - Formatted value string (e.g. "2.4k", "98%")
 * @param {string} opts.change  - Change label (e.g. "+12%", "−3")
 * @param {'up'|'down'|'neutral'} opts.trend
 * @param {boolean} opts.center - Centre-align all text
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'
import { iconTrendingUp, iconTrendingDown, iconMinus } from './icons.js'

const TRENDS = new Set(['up', 'down', 'neutral'])

const TREND_ICONS = {
  up:      iconTrendingUp({ size: 13 }),
  down:    iconTrendingDown({ size: 13 }),
  neutral: iconMinus({ size: 13 }),
}

const TREND_LABELS = { up: 'increase', down: 'decrease', neutral: 'no change' }

export function stat({
  label      = '',
  value      = '',
  change     = '',
  trend      = 'neutral',
  center     = false,
  class: cls = '',
} = {}) {
  if (!TRENDS.has(trend)) trend = 'neutral'

  const classes = ['ui-stat', center && 'ui-stat--center', cls].filter(Boolean).join(' ')

  const changeHtml = change
    ? `<p class="ui-stat-change ui-stat-change--${e(trend)}">
  <span role="img" aria-label="${e(TREND_LABELS[trend])}">${TREND_ICONS[trend]}</span>
  ${e(change)}
</p>`
    : ''

  return `<div class="${e(classes)}">
  <p class="ui-stat-label">${e(label)}</p>
  <p class="ui-stat-value">${e(value)}</p>
  ${changeHtml}
</div>`
}
