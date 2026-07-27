/**
 * Pulse UI — CTA (Call to Action)
 *
 * Centred block with eyebrow, large heading, body text, and an actions slot.
 * Sits inside a section() + container() — does not add its own padding.
 *
 * @param {object} opts
 * @param {string} opts.eyebrow  - Small label above the heading
 * @param {string} opts.title    - Main heading
 * @param {number} opts.level    - Heading level 1–6 (default 2). Visual style is always ui-cta-title.
 * @param {string} opts.subtitle - Supporting paragraph
 * @param {string} opts.actions  - Raw HTML slot — typically button() calls
 * @param {'center'|'left'} opts.align - Text alignment (default: 'center')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function cta({
  eyebrow    = '',
  title      = '',
  level      = 2,
  subtitle   = '',
  body,  // alias for subtitle
  actions    = '',
  align      = 'center',
  class: cls = '',
  ...rest
} = {}) {
  // Accept 'body' as alias for 'subtitle'
  const sub = subtitle || body || ''
  
  // Warn about unknown props on the server
  if (typeof window === 'undefined') {
    const knownProps = new Set(['eyebrow', 'title', 'level', 'subtitle', 'body', 'actions', 'align', 'class'])
    const unknownProps = Object.keys(rest).filter(k => !knownProps.has(k))
    if (unknownProps.length > 0) {
      console.warn(`[Pulse cta] Unknown prop${unknownProps.length > 1 ? 's' : ''}: ${unknownProps.join(', ')}. Did you mean 'subtitle' instead of '${unknownProps[0]}'?`)
    }
  }

  const classes = ['ui-cta', align === 'left' && 'ui-cta--left', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  return `<div class="${e(classes)}">
  ${eyebrow ? `<p class="ui-cta-eyebrow">${e(eyebrow)}</p>` : ''}
  ${title   ? `<${tag} class="ui-cta-title">${e(title)}</${tag}>` : ''}
  ${sub     ? `<p class="ui-cta-subtitle">${e(sub)}</p>` : ''}
  ${actions ? `<div class="ui-cta-actions">${actions}</div>` : ''}
</div>`
}
