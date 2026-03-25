/**
 * Pulse UI — Breadcrumbs
 *
 * Accessible breadcrumb navigation. The last item (current page) renders as a
 * <span> with aria-current="page". All other items render as links.
 *
 * @param {object} opts
 * @param {Array}  opts.items      - Array of { label, href }. Last item has no href.
 * @param {string} opts.separator  - Separator character (default: '/')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function breadcrumbs({
  items      = [],
  separator  = '/',
  class: cls = '',
} = {}) {
  const navClasses = ['ui-breadcrumbs', cls].filter(Boolean).join(' ')

  const listItems = items.map((item, i) => {
    const isLast = i === items.length - 1
    const sep = i > 0
      ? `<span class="ui-breadcrumbs-sep" aria-hidden="true">${e(separator)}</span>`
      : ''

    const content = isLast
      ? `<span class="ui-breadcrumbs-current" aria-current="page">${e(item.label)}</span>`
      : `<a href="${e(item.href)}" class="ui-breadcrumbs-link">${e(item.label)}</a>`

    return `<li class="ui-breadcrumbs-item">${sep}${content}</li>`
  }).join('')

  return `<nav aria-label="Breadcrumb" class="${e(navClasses)}">
  <ol class="ui-breadcrumbs-list">${listItems}</ol>
</nav>`
}
