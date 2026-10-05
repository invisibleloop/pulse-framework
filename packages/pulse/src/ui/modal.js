/**
 * Pulse UI — Modal
 *
 * A <dialog>-based modal. Use modal() to render the dialog element and
 * modalTrigger() (or any element with data-modal-open="id") to open it.
 *
 * Requires pulse-ui.js for the open trigger.
 * The close button inside the dialog uses native <form method="dialog"> — no JS needed.
 * Clicking the backdrop also closes the modal (handled by pulse-ui.js).
 *
 * @param {object}            opts
 * @param {string}            opts.id       - Unique ID — required so triggers can target this dialog
 * @param {string}            opts.title    - Dialog heading
 * @param {number}            opts.level    - Heading level 1–6 (default 2). Visual style is always ui-modal-title.
 * @param {string}            opts.content  - Body HTML
 * @param {string}            opts.footer   - Footer HTML — typically button() calls
 * @param {'sm'|'md'|'lg'|'xl'} opts.size
 * @param {string}            opts.class
 */

import { escHtml as e } from '../html.js'
import { iconX } from './icons.js'

const SIZES = new Set(['sm', 'md', 'lg', 'xl'])

export function modal({
  id         = '',
  title      = '',
  level      = 2,
  content    = '',
  footer     = '',
  size       = 'md',
  class: cls = '',
} = {}) {
  if (!SIZES.has(size)) size = 'md'

  const classes = ['ui-modal', size !== 'md' && `ui-modal--${size}`, cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  return `<dialog class="${e(classes)}"${id ? ` id="${e(id)}"` : ''}${id ? ` aria-labelledby="${e(id)}-title"` : ''}>
  <form method="dialog" class="ui-modal-inner">
    <header class="ui-modal-header">
      <${tag} class="ui-modal-title"${id ? ` id="${e(id)}-title"` : ''}>${e(title)}</${tag}>
      <button type="submit" class="ui-modal-close" aria-label="Close dialog">
        ${iconX({ size: 16 })}
      </button>
    </header>
    <div class="ui-modal-body">${content}</div>
    ${footer ? `<footer class="ui-modal-footer">${footer}</footer>` : ''}
  </form>
</dialog>`
}

/**
 * Button that opens a modal by ID.
 * Any element with data-modal-open="<id>" also works with pulse-ui.js.
 *
 * @param {object}  opts
 * @param {string}  opts.target   - The modal's id attribute
 * @param {string}  opts.label    - Button label
 * @param {'primary'|'secondary'|'ghost'|'danger'} opts.variant
 * @param {'sm'|'md'|'lg'} opts.size
 * @param {string}  opts.class
 */
export function modalTrigger({
  target     = '',
  label      = 'Open',
  variant    = 'primary',
  size       = 'md',
  class: cls = '',
} = {}) {
  const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger'])
  const BTN_SIZES = new Set(['sm', 'md', 'lg'])
  if (!VARIANTS.has(variant)) variant = 'primary'
  if (!BTN_SIZES.has(size))   size    = 'md'

  const classes = ['ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, cls].filter(Boolean).join(' ')

  return `<button type="button" class="${e(classes)}" data-dialog-open="${e(target)}"><span>${e(label)}</span></button>`
}
