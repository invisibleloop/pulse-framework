/**
 * Pulse — Pricing page example
 *
 * Demonstrates:
 *   - Landing page components (nav, pricing, accordion, cta, footer)
 *   - Billing-period toggle (monthly / annual) via mutation
 *   - Layout components (section, container, stack, cluster, grid)
 *   - No server data — fully static, still gets streaming SSR
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/pricing
 */

import {
  nav as uiNav, pricing, accordion, cta, footer as uiFooter,
  section as uiSection, container, stack, cluster,
  button, heading,
} from '../src/ui/index.js'

const PLANS = {
  monthly: [
    {
      name:        'Starter',
      price:       '£0',
      period:      'forever',
      description: 'For personal projects and tinkering.',
      features: [
        '1 project',
        '5,000 page views / month',
        'Pulse framework',
        'Community support',
      ],
      action:      button({ label: 'Get started free', variant: 'secondary', href: '/getting-started', fullWidth: true }),
      highlighted: false,
    },
    {
      name:        'Pro',
      price:       '£12',
      period:      '/ month',
      description: 'For indie developers and small teams.',
      badge:       'Most popular',
      features: [
        '10 projects',
        '500,000 page views / month',
        'Everything in Starter',
        'Streaming SSR',
        'Global CDN',
        'Email support',
      ],
      action:      button({ label: 'Start free trial', variant: 'primary', href: '/getting-started', fullWidth: true }),
      highlighted: true,
    },
    {
      name:        'Team',
      price:       '£49',
      period:      '/ month',
      description: 'For growing teams shipping fast.',
      features: [
        'Unlimited projects',
        '5M page views / month',
        'Everything in Pro',
        'Team collaboration',
        'Custom domains',
        'Priority support',
        'SLA guarantee',
      ],
      action:      button({ label: 'Contact sales', variant: 'secondary', href: '/contact', fullWidth: true }),
      highlighted: false,
    },
  ],
  annual: [
    {
      name:        'Starter',
      price:       '£0',
      period:      'forever',
      description: 'For personal projects and tinkering.',
      features: [
        '1 project',
        '5,000 page views / month',
        'Pulse framework',
        'Community support',
      ],
      action:      button({ label: 'Get started free', variant: 'secondary', href: '/getting-started', fullWidth: true }),
      highlighted: false,
    },
    {
      name:        'Pro',
      price:       '£9',
      period:      '/ month',
      description: 'For indie developers and small teams.',
      badge:       'Most popular',
      features: [
        '10 projects',
        '500,000 page views / month',
        'Everything in Starter',
        'Streaming SSR',
        'Global CDN',
        'Email support',
      ],
      action:      button({ label: 'Start free trial', variant: 'primary', href: '/getting-started', fullWidth: true }),
      highlighted: true,
    },
    {
      name:        'Team',
      price:       '£39',
      period:      '/ month',
      description: 'For growing teams shipping fast.',
      features: [
        'Unlimited projects',
        '5M page views / month',
        'Everything in Pro',
        'Team collaboration',
        'Custom domains',
        'Priority support',
        'SLA guarantee',
      ],
      action:      button({ label: 'Contact sales', variant: 'secondary', href: '/contact', fullWidth: true }),
      highlighted: false,
    },
  ],
}

export const FAQ = [
  { question: 'Can I change plans later?',               answer: 'Yes — upgrade or downgrade at any time. Changes take effect immediately; you\'ll be charged or credited on a pro-rated basis.' },
  { question: 'What counts as a page view?',             answer: 'A page view is a single server-rendered HTML response. Static assets, API calls, and navigations that reuse cached HTML are not counted.' },
  { question: 'Do you offer a free trial?',              answer: 'Pro and Team plans include a 14-day free trial — no credit card required. You\'ll get a reminder before the trial ends.' },
  { question: 'What happens if I exceed my page views?', answer: 'We\'ll notify you when you reach 80% of your limit. Your site stays live — we won\'t cut you off mid-month. Additional usage is billed at £1 per 100k views.' },
  { question: 'Is there a discount for non-profits?',    answer: 'Yes — registered non-profits and open source projects qualify for 50% off any paid plan. Email us with your details.' },
]

export default {
  route:   '/pricing',
  hydrate: '/examples/pricing.js',

  meta: {
    title:       'Pricing — Pulse',
    description: 'Simple, transparent pricing for every stage. Starter is free forever. Pro and Team plans include a 14-day trial.',
    styles:      ['/pulse-ui.css', '/examples/pricing.css'],
  },

  state: {
    billing: 'monthly',   // monthly | annual
  },

  mutations: {
    setBilling: (_state, e) => ({
      billing: e.target.closest('[data-billing]')?.dataset.billing || 'monthly',
    }),
  },

  view: (state) => {
    const plans = PLANS[state.billing]

    return `
    ${uiNav({
      logo:     `<span class="pr-logo">⚡ Pulse</span>`,
      logoHref: '/pricing',
      links: [
        { label: 'Counter',  href: '/counter'  },
        { label: 'Todos',    href: '/todos'     },
        { label: 'Contact',  href: '/contact'  },
        { label: 'Quiz',     href: '/quiz'      },
        { label: 'Products', href: '/products' },
        { label: 'Pricing',  href: '/pricing'  },
      ],
      sticky: true,
    })}

    <main id="main-content">

    ${uiSection({ content: container({ size: 'lg', content: stack({ gap: 'lg', align: 'center', content: `

      <div class="pr-eyebrow">Pricing</div>
      <h1 class="pr-hero-title">Simple, honest pricing.</h1>
      <p class="pr-hero-sub">Starter is free forever. Paid plans include a 14-day trial — no credit card required.</p>

      <div class="pr-toggle" role="group" aria-label="Billing period">
        ${button({ label: 'Monthly', variant: state.billing === 'monthly' ? 'primary' : 'ghost', size: 'sm', attrs: { 'data-event': 'setBilling', 'data-billing': 'monthly', 'aria-pressed': String(state.billing === 'monthly') } })}
        ${button({ label: 'Annual', variant: state.billing === 'annual' ? 'primary' : 'ghost', size: 'sm', iconAfter: '<span class="pr-save-label">Save 25%</span>', attrs: { 'data-event': 'setBilling', 'data-billing': 'annual', 'aria-pressed': String(state.billing === 'annual') } })}
      </div>

      ${state.billing === 'annual' ? `<p class="pr-annual-note">Annual plans are billed yearly. Prices shown are monthly equivalents.</p>` : ''}

      <div class="pr-plans">
        ${plans.map(p => pricing({ ...p, level: 2 })).join('')}
      </div>

    ` }) }) })}

    ${uiSection({ variant: 'alt', content: container({ size: 'md', content: stack({ gap: 'xl', align: 'center', content: `

      ${heading({ level: 2, text: 'Everything you need to ship', size: '3xl', class: 'u-text-center' })}

      <div class="pr-feature-table" role="region" aria-label="Feature comparison">
        <div class="pr-feature-header">
          <span>Feature</span>
          <span>Starter</span>
          <span>Pro</span>
          <span>Team</span>
        </div>
        ${[
          ['Streaming SSR',          '✓', '✓', '✓'],
          ['Security headers',       '✓', '✓', '✓'],
          ['Immutable asset caching','✓', '✓', '✓'],
          ['Custom domains',         '—', '—', '✓'],
          ['Global CDN',             '—', '✓', '✓'],
          ['Team seats',             '1', '3', 'Unlimited'],
          ['Support',                'Community', 'Email', 'Priority + SLA'],
        ].map(([feat, ...vals]) => `
        <div class="pr-feature-row">
          <span class="pr-feature-name">${feat}</span>
          ${vals.map(v => `<span class="pr-feature-val${v === '—' ? ' pr-feature-val--no' : v === '✓' ? ' pr-feature-val--yes' : ''}">${v}</span>`).join('')}
        </div>`).join('')}
      </div>

    ` }) }) })}

    ${uiSection({ content: container({ size: 'md', content: stack({ gap: 'lg', align: 'center', content: `
      ${heading({ level: 2, text: 'Frequently asked questions', size: '3xl', class: 'u-text-center' })}
      ${accordion({ items: FAQ })}
    ` }) }) })}

    ${cta({
      title:   'Ready to build?',
      content: 'Starter is free forever. No credit card. No catch.',
      actions: cluster({ justify: 'center', content:
        button({ label: 'Get started free', href: '/getting-started', size: 'lg' }) + ' ' +
        button({ label: 'Read the docs', href: '/getting-started', variant: 'secondary', size: 'lg' })
      }),
    })}

    </main>

    ${uiFooter({
      logo:      '<span class="pr-logo">⚡ Pulse</span>',
      tagline:   'The spec-first web framework.',
      columns: [
        { heading: 'Product',  links: [{ label: 'Counter',  href: '/counter'  }, { label: 'Todos', href: '/todos' }, { label: 'Contact', href: '/contact' }] },
        { heading: 'Examples', links: [{ label: 'Quiz',     href: '/quiz'     }, { label: 'Products', href: '/products' }] },
        { heading: 'Docs',     links: [{ label: 'Getting Started', href: '/getting-started' }, { label: 'Spec Reference', href: '/spec' }] },
      ],
      copy: `© ${new Date().getFullYear()} Pulse. Built with Pulse.`,
    })}`
  },
}
