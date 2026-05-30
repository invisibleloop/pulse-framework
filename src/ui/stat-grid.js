/**
 * Pulse UI — StatGrid
 *
 * A grid of stat tiles with optional coloured panel background.
 * Use when you need multiple stat() tiles arranged together — e.g. a 2×2
 * "at a glance" panel inside a hero or section.
 *
 * Each item is passed directly to stat(). The grid handles layout.
 *
 * @param {object}   opts
 * @param {Array}    opts.stats      - Array of stat() option objects (label, value, change, trend, size, suffix)
 * @param {number}   opts.columns    - Number of grid columns (default: 2)
 * @param {string}   opts.background - CSS background value (e.g. 'var(--ui-surface-raised)')
 * @param {string}   opts.color      - Foreground/text colour override
 * @param {string}   opts.class
 */

import { stat }       from './stat.js'
import { escHtml as e } from '../html.js'

export function statGrid({
  stats      = [],
  columns    = 2,
  background = '',
  color      = '',
  class: cls = '',
} = {}) {
  const classes = ['ui-stat-grid', cls].filter(Boolean).join(' ')

  const styles = [
    `--stat-cols:${Number(columns) || 2}`,
    background && `background:${background.replace(/"/g, "'")}`,
    color      && `color:${color.replace(/"/g, "'")}`,
  ].filter(Boolean).join(';')
  const styleAttr = styles ? ` style="${styles}"` : ''

  const tilesHtml = stats.map(s => stat(s)).join('')

  return `<div class="${e(classes)}"${styleAttr}>${tilesHtml}</div>`
}
