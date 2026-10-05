/**
 * Pulse UI — Prose
 *
 * Typography wrapper for rich text content: CMS output, markdown-rendered HTML,
 * blog posts, article bodies, legal text, etc.
 *
 * Styles all descendant elements (h1–h6, p, ul, ol, li, a, blockquote, code,
 * pre, table, hr, img) without requiring classes on individual elements.
 * Use this any time you're outputting HTML you don't control.
 *
 * @param {object} opts
 * @param {string}  opts.content - Raw HTML string (NOT escaped — trust only server-side content)
 * @param {string}  [opts.size]  - 'sm' | 'base' | 'lg'  (default: 'base')
 * @param {string}  [opts.class] - Extra classes on the wrapper
 */

export function prose({
  content    = '',
  size       = 'base',
  class: cls = '',
} = {}) {
  const classes = [
    'ui-prose',
    size !== 'base' ? `ui-prose--${size}` : '',
    cls,
  ].filter(Boolean).join(' ')

  return `<div class="${classes}">${content}</div>`
}
