/**
 * Pulse UI — Entry List
 *
 * Tabular list of items with leading metadata (year, number, date),
 * title, and trailing description. For: backlists, release notes,
 * project archives, talk logs, changelogs.
 *
 * @param {object} opts
 * @param {Array<{meta: string, title: string, description: string}>} opts.items
 * @param {string} opts.metaLabel - Accessible label for metadata column (e.g. "Year", "Date")
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function entryList({
  items      = [],
  metaLabel  = 'Date',
  class: cls = '',
} = {}) {
  if (!Array.isArray(items) || items.length === 0) return ''

  const classes = ['ui-entry-list', cls].filter(Boolean).join(' ')

  const rows = items.map(item => `
    <div class="ui-entry-list-item">
      <div class="ui-entry-list-meta" aria-label="${e(metaLabel)}">${e(item.meta || '')}</div>
      <div class="ui-entry-list-content">
        <h3 class="ui-entry-list-title">${e(item.title || '')}</h3>
        ${item.description ? `<p class="ui-entry-list-description">${e(item.description)}</p>` : ''}
      </div>
    </div>
  `).join('')

  return `<div class="${e(classes)}">${rows}</div>`
}
