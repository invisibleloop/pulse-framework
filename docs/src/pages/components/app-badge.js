import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { appBadge } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/app-badge')

export default {
  route: '/components/app-badge',
  meta: {
    title: 'App Badge — Pulse Docs',
    description: 'App Badge component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/app-badge',
    prev,
    next,
    name: 'appBadge',
    description: 'App Store and Google Play download buttons. Designed to sit in a <code>hero()</code> actions slot, or anywhere a download CTA is needed.',
    content: `
      ${demo(
        `<div style="display:flex;gap:.75rem;flex-wrap:wrap">` +
          appBadge({ store: 'apple',  href: '#' }) +
          appBadge({ store: 'google', href: '#' }) +
        `</div>`,
        `appBadge({ store: 'apple',  href: appStoreUrl })
appBadge({ store: 'google', href: playStoreUrl })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>store</code>', 'string', "'apple'", "'apple' or 'google'"],
          ['<code>href</code>',  'string', "'#'",     'Link to the app store listing'],
        ]
      )}
    `,
  }),
}
