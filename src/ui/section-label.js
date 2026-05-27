/**
 * Pulse UI — Section Label
 *
 * Eyebrow + heading + horizontal rule. The editorial equivalent of feature().
 * For: chapter openings, section dividers, content blocks.
 *
 * @param {object} opts
 * @param {string} opts.eyebrow - Small label above heading
 * @param {string} opts.heading - Main heading text
 * @param {number} opts.level - Heading level 1–6 (default 2)
 * @param {boolean} opts.rule - Show horizontal rule after heading (default true)
 * @param {'left'|'center'} opts.align - Text alignment (default 'left')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function sectionLabel({
  eyebrow    = '',
  heading    = '',
  level      = 2,
  rule       = true,
  align      = 'left',
  class: cls = '',
} = {}) {
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`
  const classes = [
    'ui-section-label',
    align === 'center' && 'ui-section-label--center',
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${e(classes)}">
  ${eyebrow ? `<p class="ui-section-label-eyebrow">${e(eyebrow)}</p>` : ''}
  ${heading ? `<${tag} class="ui-section-label-heading">${e(heading)}</${tag}>` : ''}
  ${rule ? '<hr class="ui-section-label-rule" aria-hidden="true">' : ''}
</div>`
}
