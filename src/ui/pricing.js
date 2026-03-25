/**
 * Pulse UI — Pricing
 *
 * A single pricing plan card with feature list and CTA.
 * Compose multiple in a flex/grid container for a full pricing section.
 *
 * @param {object}   opts
 * @param {string}   opts.name        - Plan name (e.g. "Pro")
 * @param {number}   opts.level       - Heading level 1–6 for the plan name (default 3). Visual style is always ui-pricing-name.
 * @param {string}   opts.price       - Price string (e.g. "$9", "Free")
 * @param {string}   opts.period      - Billing period (e.g. "/month")
 * @param {string}   opts.description - One-line plan description
 * @param {string[]} opts.features    - Array of feature strings
 * @param {string}   opts.action      - Raw HTML slot — typically a button()
 * @param {boolean}  opts.highlighted - Accent border + elevated appearance
 * @param {string}   opts.badge       - Floating label above the card (e.g. "Most popular")
 * @param {string}   opts.class
 */

import { escHtml as e } from '../html.js'

export function pricing({
  name        = '',
  level       = 3,
  price       = '',
  period      = '',
  description = '',
  features    = [],
  action      = '',
  highlighted = false,
  badge       = '',
  class: cls  = '',
} = {}) {
  const classes = ['ui-pricing', highlighted && 'ui-pricing--highlighted', cls].filter(Boolean).join(' ')
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`

  const featureList = features.length
    ? `<ul class="ui-pricing-features">
  ${features.map(f => `<li class="ui-pricing-feature"><span class="ui-pricing-check" aria-hidden="true">✓</span>${e(f)}</li>`).join('\n  ')}
</ul>`
    : ''

  return `<div class="${e(classes)}">
  ${badge ? `<p class="ui-pricing-badge">${e(badge)}</p>` : ''}
  <div class="ui-pricing-header">
    ${name        ? `<${tag} class="ui-pricing-name">${e(name)}</${tag}>` : ''}
    ${description ? `<p class="ui-pricing-desc">${e(description)}</p>` : ''}
  </div>
  <div class="ui-pricing-price">
    <span class="ui-pricing-amount">${e(price)}</span>
    ${period ? `<span class="ui-pricing-period">${e(period)}</span>` : ''}
  </div>
  ${featureList}
  ${action ? `<div class="ui-pricing-action">${action}</div>` : ''}
</div>`
}
