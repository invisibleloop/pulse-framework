/**
 * Pulse UI — App Badge
 *
 * App Store and Google Play download buttons.
 *
 * @param {object} opts
 * @param {'apple'|'google'} opts.store - Which badge to render
 * @param {string} opts.href            - Link to the app store listing
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const APPLE_ICON = `<svg width="18" height="22" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.2-148.8-97.2C67.6 772.6 20.4 678.3 20.4 588.3c0-154.8 100.9-236.7 199.6-236.7 74.7 0 136.8 47.4 183.1 47.4 44.4 0 113.9-49.9 197-49.9zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>`

const GOOGLE_ICON = `<svg width="18" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.6-232.5L47 0zm425.6 225.6l-58.9-34-67.7 68.6 67.7 68.5 60.1-34.3c17.3-9.8 17.3-38.1-.2-48.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>`

const CONFIGS = {
  apple: {
    icon:  APPLE_ICON,
    line1: 'Download on the',
    line2: 'App Store',
    label: 'Download on the App Store',
  },
  google: {
    icon:  GOOGLE_ICON,
    line1: 'Get it on',
    line2: 'Google Play',
    label: 'Get it on Google Play',
  },
}

export function appBadge({
  store      = 'apple',
  href       = '#',
  class: cls = '',
} = {}) {
  const cfg = CONFIGS[store] ?? CONFIGS.apple
  const classes = ['ui-app-badge', cls].filter(Boolean).join(' ')

  return `<a href="${e(href)}" class="${e(classes)}" aria-label="${e(cfg.label)}" target="_blank" rel="noopener noreferrer">
  ${cfg.icon}
  <span class="ui-app-badge-text">
    <span class="ui-app-badge-line1">${cfg.line1}</span>
    <span class="ui-app-badge-line2">${cfg.line2}</span>
  </span>
</a>`
}
