/**
 * Pulse UI — Nav
 *
 * Site header with logo, navigation links, and an optional CTA slot.
 * Set sticky: true for a position: sticky top bar with backdrop blur.
 *
 * On mobile (< 640px) links are hidden behind a burger button. Clicking
 * the burger toggles the .ui-nav--open class on the <header>, which
 * reveals an absolutely-positioned dropdown that overlays page content.
 * Wired automatically by pulse-ui.js — no extra JS needed.
 *
 * Links may be plain links or mega-nav dropdowns:
 *   { label: 'Docs', href: '/docs' }
 *   { label: 'Products', mega: [
 *     { heading: 'Solutions', items: [
 *       { label: 'Analytics', href: '/analytics', description: 'Track metrics' },
 *     ]},
 *   ]}
 *
 * @param {object}  opts
 * @param {string}  opts.logo       - Raw HTML slot — SVG, img, or text
 * @param {string}  opts.logoHref   - Logo link destination (default: '/')
 * @param {Array<{label:string, href?:string, mega?:Array}>} opts.links
 * @param {string}  opts.action     - Raw HTML slot — typically a button()
 * @param {boolean} opts.sticky     - Position sticky with backdrop blur
 * @param {'right'|'left'} opts.burgerAlign - Mobile burger position (default: 'right')
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'
import { iconMenu, iconX, iconChevronDown } from './icons.js'

let _navId = 0

function megaItem({ label = '', href = '', description = '' }) {
  return `<div class="ui-nav-mega-item">
    <a href="${e(href)}" class="ui-nav-mega-item-label">${e(label)}</a>
    ${description ? `<span class="ui-nav-mega-item-desc">${e(description)}</span>` : ''}
  </div>`
}

function megaPanel(columns, panelId) {
  const cols = columns.map(col => `
    <div class="ui-nav-mega-col">
      ${col.heading ? `<p class="ui-nav-mega-heading">${e(col.heading)}</p>` : ''}
      ${(col.items || []).map(megaItem).join('')}
    </div>`).join('')
  return `<div class="ui-nav-mega-panel" id="${panelId}" hidden>
    <div class="ui-nav-mega-inner">${cols}
    </div>
  </div>`
}

function renderLink(link, navId, idx) {
  if (link.mega) {
    const panelId = `${navId}-mega-${idx}`
    return `<div class="ui-nav-mega-wrap">
    <button type="button" class="ui-nav-link ui-nav-mega-trigger" aria-expanded="false" aria-haspopup="true" aria-controls="${panelId}">
      ${e(link.label || '')}${iconChevronDown({ size: 13, class: 'ui-nav-mega-chevron' })}
    </button>
    ${megaPanel(link.mega, panelId)}
  </div>`
  }
  return `<a href="${e(link.href || '')}" class="ui-nav-link">${e(link.label || '')}</a>`
}

function renderMobileLink(link) {
  if (link.mega) {
    const items = link.mega.flatMap(col => col.items || [])
    return `<p class="ui-nav-mobile-section">${e(link.label || '')}</p>` + items.map(item => megaItem(item)).join('')
  }
  return `<a href="${e(link.href || '')}" class="ui-nav-link">${e(link.label || '')}</a>`
}

export function nav({
  logo          = '',
  logoHref      = '/',
  links         = [],
  action        = '',
  sticky        = false,
  burgerAlign   = 'right',
  class: cls    = '',
} = {}) {
  const id      = `ui-nav-${++_navId}`
  const classes = ['ui-nav', sticky && 'ui-nav--sticky', burgerAlign === 'left' && 'ui-nav--burger-left', cls].filter(Boolean).join(' ')

  const linksHtml       = links.map((l, i) => renderLink(l, id, i)).join('')
  const mobileLinksHtml = links.map(renderMobileLink).join('')

  const burgerHtml = links.length ? `
  <button class="ui-nav-burger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="${id}-mobile">
    ${iconMenu({ size: 20, class: 'ui-nav-burger-open' })}
    ${iconX({ size: 20, class: 'ui-nav-burger-close' })}
  </button>` : ''

  const mobileMenuHtml = links.length ? `
  <div class="ui-nav-mobile" id="${id}-mobile" aria-label="Mobile navigation">
    <nav>${mobileLinksHtml}</nav>
  </div>` : ''

  return `<header class="${e(classes)}">
  <div class="ui-nav-inner">
    <a href="${e(logoHref)}" class="ui-nav-logo">${logo}</a>
    ${links.length ? `<nav class="ui-nav-links" aria-label="Site navigation">${linksHtml}</nav>` : ''}
    ${action ? `<div class="ui-nav-action">${action}</div>` : ''}${burgerHtml}
  </div>${mobileMenuHtml}
</header>`
}
