/**
 * Pulse Docs — Component page factory
 *
 * renderComponentPage({ name, description, demos, props, prev, next, currentHref })
 * Returns the HTML content string for a standard component doc page.
 */

import { renderLayout, h1, lead, codeBlock } from './layout.js'
import { highlight } from './highlight.js'

export function demo(previewHtml, codeStr, { col = false, scroll = false, bleed = false } = {}) {
  const previewClass = [
    'demo-preview',
    col    ? 'demo-preview--col'    : '',
    scroll ? 'demo-preview--scroll' : '',
    bleed  ? 'demo-preview--bleed'  : '',
  ].filter(Boolean).join(' ')
  const toggle = `<button class="demo-theme-toggle" aria-label="Toggle light/dark theme" title="Toggle theme">
    <svg class="demo-theme-toggle__dark" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
    <svg class="demo-theme-toggle__light" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>`
  return `<div class="component-demo">
  <div class="${previewClass}">${toggle}<div class="demo-preview-inner">${previewHtml}</div></div>
  <div class="demo-code">${codeBlock(highlight(codeStr, 'js'))}</div>
</div>`
}

/**
 * @param {object} opts
 * @param {string}   opts.currentHref  - The route of this page
 * @param {string}   opts.name         - Component name displayed in h1
 * @param {string}   opts.description  - Lead paragraph HTML
 * @param {string}   opts.content      - Full HTML body (demos + props table)
 * @param {object|null} opts.prev      - { label, href } or null
 * @param {object|null} opts.next      - { label, href } or null
 */
export function renderComponentPage({ currentHref, name, description, content, prev = null, next = null }) {
  return renderLayout({
    currentHref,
    prev,
    next,
    content: `
      ${h1(name)}
      ${lead(description)}
      ${content}
    `,
  })
}
