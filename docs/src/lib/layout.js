/**
 * Pulse Docs — Page layout
 *
 * renderLayout({ currentHref, content, prev, next }) → HTML string
 * Used by every docs page except the home page.
 */

import { NAV } from './nav.js'
import pkg from '../../../package.json' with { type: 'json' }

// Resolve static asset paths through the build manifest (hashed in prod, raw in dev).
// Populated by initLayoutManifest() in server.js before the server starts.
let _manifest = {}
export function initLayoutManifest(m) { _manifest = m }
const asset = href => _manifest[href] || href

const version = typeof pkg !== 'undefined' ? (pkg?.version ?? '') : ''

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sidebar(currentHref) {
  const sections = NAV.map(({ section, items }) => {
    const links = items.map(item => {
      const active = item.href === currentHref
      return `<a href="${esc(item.href)}" class="nav-link${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`
    }).join('')
    return `
      <div class="nav-section">
        <p class="nav-section-title">${esc(section)}</p>
        ${links}
      </div>`
  }).join('')

  return `
    <aside class="docs-sidebar" aria-label="Documentation navigation">
      <div class="sidebar-logo">
        <a href="/" class="logo-link" aria-label="Pulse home">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
          <span class="logo-name">Pulse</span>
        </a>
        <span class="version-badge">v${version}</span>
      </div>
      <nav class="sidebar-nav">
        ${sections}
      </nav>
    </aside>`
}

function prevNextBar(prev, next) {
  if (!prev && !next) return ''
  return `
    <nav class="doc-prev-next" aria-label="Previous and next pages">
      <div class="prev-next-grid">
        ${prev ? `<a href="${esc(prev.href)}" class="prev-next-link prev-link">
          <span class="prev-next-label">← Previous</span>
          <span class="prev-next-title">${esc(prev.label)}</span>
        </a>` : '<div></div>'}
        ${next ? `<a href="${esc(next.href)}" class="prev-next-link next-link">
          <span class="prev-next-label">Next →</span>
          <span class="prev-next-title">${esc(next.label)}</span>
        </a>` : '<div></div>'}
      </div>
    </nav>`
}

export function renderLayout({ currentHref, content, prev = null, next = null }) {
  return `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="sidebar-overlay" aria-hidden="true"></div>
    ${sidebar(currentHref)}
    <div class="docs-main">
      <header class="docs-header">
        <button class="mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="docs-sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clip-rule="evenodd"/>
          </svg>
        </button>
        <a href="/" class="header-logo-mobile" aria-label="Pulse home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
        </a>
        <a href="https://github.com/invisibleloop/pulse-framework" class="header-github" aria-label="View on GitHub (opens in new tab)" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          GitHub
        </a>
      </header>
      <main class="docs-content" id="main-content">
        ${content}
        ${prevNextBar(prev, next)}
      </main>
    </div>
    <script src="${asset('/menu.js')}" defer></script>
    <script src="${asset('/pulse-ui.js')}" defer></script>`
}

/**
 * Convenience helpers used in every page's view function
 */

export function h1(text) {
  return `<h1 class="doc-h1">${esc(text)}</h1>`
}

export function lead(text) {
  return `<p class="doc-lead">${text}</p>`
}

export function section(id, title) {
  return `<h2 class="doc-h2" id="${esc(id)}"><a href="#${esc(id)}" class="heading-anchor">${esc(title)}</a></h2>`
}

export function sub(id, title) {
  const label = title ?? id
  return `<h3 class="doc-h3" id="${esc(id)}"><a href="#${esc(id)}" class="heading-anchor">${esc(label)}</a></h3>`
}

export function codeBlock(highlighted, filename = '') {
  const header = filename ? `<div class="code-filename">${esc(filename)}</div>` : ''
  return `${header}<pre class="code-block"><code>${highlighted}</code></pre>`
}

export function table(headers, rows, caption = '') {
  const cap = caption ? `<caption>${esc(caption)}</caption>` : ''
  const ths = headers.map(h => `<th scope="col">${h}</th>`).join('')
  const trs = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
  ).join('')
  return `<div class="table-wrap"><table>${cap}<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
}

export function callout(type, content) {
  // type: 'note' | 'warning' | 'tip'
  const icons = { note: 'ℹ', warning: '⚠', tip: '✦' }
  return `<div class="callout callout-${esc(type)}"><span class="callout-icon" aria-hidden="true">${icons[type] || 'ℹ'}</span><div class="callout-body">${content}</div></div>`
}
