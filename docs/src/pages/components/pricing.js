import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, section } from '../../lib/layout.js'
import { button, pricing } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/pricing')

export default {
  route: '/components/pricing',
  meta: {
    title: 'Pricing — Pulse Docs',
    description: 'Pricing component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/pricing',
    prev,
    next,
    name: 'pricing',
    description: 'Single plan card with a feature list and CTA. Set <code>highlighted: true</code> on the recommended plan — it gets an accent border and a floating <code>badge</code> label.',
    content: `
      ${demo(
        pricing({ name: 'Pro', price: '$9', period: '/month', description: 'For growing teams', features: ['Unlimited pages', 'Priority support', 'Custom domain'], highlighted: true, badge: 'Most popular', action: button({ label: 'Get started', fullWidth: true }) }),
        `pricing({
  name:        'Pro',
  price:       '$9',
  period:      '/month',
  description: 'For growing teams',
  features:    ['Unlimited pages', 'Priority support', 'Custom domain'],
  highlighted: true,
  badge:       'Most popular',
  action:      button({ label: 'Get started', fullWidth: true }),
})`,
        { col: true }
      )}

      ${section('multi-plan', 'Multi-plan layout')}
      ${demo(
        `<div class="ui-pricing-grid ui-pricing-grid--cols-3">` +
          pricing({ name: 'Free', price: '$0', period: '/month', description: 'For personal projects', features: ['3 pages', 'Community support'], action: button({ label: 'Get started', variant: 'secondary', fullWidth: true }) }) +
          pricing({ name: 'Pro', price: '$9', period: '/month', description: 'For growing teams', features: ['Unlimited pages', 'Priority support', 'Custom domain'], highlighted: true, badge: 'Most popular', action: button({ label: 'Get started', fullWidth: true }) }) +
          pricing({ name: 'Team', price: '$29', period: '/month', description: 'For large organisations', features: ['Everything in Pro', 'SSO', 'SLA'], action: button({ label: 'Get started', variant: 'secondary', fullWidth: true }) }) +
        `</div>`,
        `<div class="ui-pricing-grid ui-pricing-grid--cols-3">
  \${pricing({ name: 'Free',  price: '$0',  ... })}
  \${pricing({ name: 'Pro',   price: '$9',  highlighted: true, badge: 'Most popular', ... })}
  \${pricing({ name: 'Team',  price: '$29', ... })}
</div>`,
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>name</code>',        'string',        '—',     ''],
          ['<code>level</code>',       'number',        '3',     'Heading tag for the plan name (1–6). Visual style is unchanged.'],
          ['<code>price</code>',       'string',        '—',     'Formatted string — e.g. "$9", "Free"'],
          ['<code>period</code>',      'string',        '—',     'e.g. "/month", "/year"'],
          ['<code>description</code>', 'string',        '—',     ''],
          ['<code>features</code>',    'string[]',      '[]',    'List of feature strings'],
          ['<code>action</code>',      'string (HTML)', '—',     'Raw HTML slot — typically a button()'],
          ['<code>highlighted</code>', 'boolean',       'false', 'Accent border + elevated appearance'],
          ['<code>badge</code>',       'string',        '—',     'Floating label above the card'],
        ]
      )}
    `,
  }),
}
