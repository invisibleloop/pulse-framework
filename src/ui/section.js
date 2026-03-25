/**
 * Pulse UI — Section
 *
 * Vertical padding wrapper with optional background variant and built-in
 * section header (eyebrow + title + subtitle) above the content slot.
 * Compose with container() to get a constrained-width section.
 *
 * @param {object} opts
 * @param {string} opts.content                  - Raw HTML slot
 * @param {'default'|'alt'|'dark'} opts.variant  - Background variant (default: 'default')
 * @param {'sm'|'md'|'lg'} opts.padding          - Vertical padding size (default: 'md')
 * @param {string} opts.id                       - Section id for anchor links
 * @param {string} opts.eyebrow                  - Small label above the title
 * @param {string} opts.title                    - Section heading
 * @param {number} opts.level                    - Heading level 1–6 (default 2). Visual style is always ui-section-title.
 * @param {string} opts.subtitle                 - Supporting text beneath the heading
 * @param {'left'|'center'} opts.align           - Header text alignment (default: 'left')
 * @param {'sm'|'md'|'lg'|'none'} opts.gap      - Gap between header and content (default: 'md' = 2.5rem)
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const VARIANTS = new Set(['default', 'alt', 'dark'])
const PADDINGS = new Set(['sm', 'md', 'lg'])
const GAPS     = new Set(['none', 'sm', 'md', 'lg'])

export function section({
  content    = '',
  variant    = 'default',
  padding    = 'md',
  gap        = 'md',
  id         = '',
  eyebrow    = '',
  title      = '',
  level      = 2,
  subtitle   = '',
  align      = 'left',
  class: cls = '',
} = {}) {
  if (!VARIANTS.has(variant)) variant = 'default'
  if (!PADDINGS.has(padding)) padding = 'md'
  if (!GAPS.has(gap))         gap     = 'md'

  const classes = [
    'ui-section',
    variant !== 'default' && `ui-section--${variant}`,
    padding !== 'md'      && `ui-section--${padding}`,
    cls,
  ].filter(Boolean).join(' ')

  const idAttr = id ? ` id="${e(id)}"` : ''
  const tag    = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  const headerClasses = [
    'ui-section-header',
    align === 'center' && 'ui-section-header--center',
    gap   !== 'md'     && `ui-section-header--gap-${gap}`,
  ].filter(Boolean).join(' ')

  const header = (eyebrow || title || subtitle) ? `
  <div class="${headerClasses}">
    ${eyebrow  ? `<p class="ui-section-eyebrow">${e(eyebrow)}</p>` : ''}
    ${title    ? `<${tag} class="ui-section-title">${e(title)}</${tag}>` : ''}
    ${subtitle ? `<p class="ui-section-subtitle">${e(subtitle)}</p>` : ''}
  </div>` : ''

  return `<section class="${e(classes)}"${idAttr}>${header}${content}</section>`
}
