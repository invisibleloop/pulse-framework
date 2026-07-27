/**
 * Pulse UI — Card
 *
 * Surface container with optional title and footer.
 * Pass HTML strings for content and footer — they are not escaped.
 * Escape user data before passing it in.
 *
 * @param {object} opts
 * @param {string}  opts.title   - Escaped heading text (optional)
 * @param {number}  opts.level   - Heading level 1–6 (default 3). Controls the tag; visual style is always ui-card-title.
 * @param {string}  opts.content - HTML string for the card body
 * @param {string}  opts.footer  - HTML string for the card footer (optional)
 * @param {boolean} opts.flush   - Remove internal padding (for full-bleed content)
 * @param {'default'|'elevated'|'bordered'|'flat'|'glass'|'tinted'} opts.variant
 *   Visual style:
 *   - 'default'  — standard surface with subtle shadow (same as no variant)
 *   - 'elevated' — stronger shadow, lifts above the page
 *   - 'bordered' — no shadow, prominent border
 *   - 'flat'     — no shadow, no border, background only
 *   - 'glass'    — frosted-glass effect with backdrop blur
 *   - 'tinted'   — accent-tinted background, no shadow
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['default', 'elevated', 'bordered', 'flat', 'glass', 'tinted'])

export function card({
  title      = '',
  level      = 3,
  content    = '',
  footer     = '',
  flush      = false,
  variant    = 'default',
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'default'

  const classes = [
    'ui-card',
    variant !== 'default' ? `ui-card--${variant}` : '',
    flush ? 'ui-card--flush' : '',
    cls,
  ].filter(Boolean).join(' ')

  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  const titleHtml  = title  ? `<div class="ui-card-header"><${tag} class="ui-card-title">${e(title)}</${tag}></div>` : ''
  const footerHtml = footer ? `<div class="ui-card-footer">${footer}</div>` : ''

  return `<div class="${e(classes)}">${titleHtml}<div class="ui-card-body">${content}</div>${footerHtml}</div>`
}
