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
 * @param {object}  opts
 * @param {string}  opts.logo      - Raw HTML slot — SVG, img, or text
 * @param {string}  opts.logoHref  - Logo link destination (default: '/')
 * @param {Array<{label: string, href: string}>} opts.links
 * @param {string}  opts.action    - Raw HTML slot — typically a button()
 * @param {boolean} opts.sticky      - Position sticky with backdrop blur
 * @param {'right'|'left'} opts.burgerAlign - Mobile burger position (default: 'right')
 * @param {string}  opts.class
 */

import { escHtml as e } from '../html.js'
import { iconMenu, iconX } from './icons.js'

let _navId = 0

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

  const linksHtml = links.map(({ label = '', href = '' }) =>
    `<a href="${e(href)}" class="ui-nav-link">${e(label)}</a>`
  ).join('')

  const burgerHtml = links.length ? `
  <button class="ui-nav-burger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="${id}-mobile">
    ${iconMenu({ size: 20, class: 'ui-nav-burger-open' })}
    ${iconX({ size: 20, class: 'ui-nav-burger-close' })}
  </button>` : ''

  const mobileMenuHtml = links.length ? `
  <div class="ui-nav-mobile" id="${id}-mobile" aria-label="Mobile navigation">
    <nav>${linksHtml}</nav>
  </div>` : ''

  return `<header class="${e(classes)}">
  <div class="ui-nav-inner">
    <a href="${e(logoHref)}" class="ui-nav-logo">${logo}</a>
    ${links.length ? `<nav class="ui-nav-links" aria-label="Site navigation">${linksHtml}</nav>` : ''}
    ${action ? `<div class="ui-nav-action">${action}</div>` : ''}${burgerHtml}
  </div>${mobileMenuHtml}
</header>`
}
