import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { banner, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/banner')

export default {
  route: '/components/banner',
  meta: {
    title: 'Banner — Pulse Docs',
    description: 'Banner component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/banner',
    prev,
    next,
    name: 'banner',
    description: 'Full-width announcement bar. Sits above the nav for promotions and launch announcements. The content slot accepts links and formatted text.',
    content: `
      ${demo(
        stack({
          gap: 'sm',
          content:
            banner({ variant: 'promo',   content: '🎉 Chippy Bird v2.0 is out — <a href="#" style="color:inherit;text-decoration:underline">see what\'s new</a>' }) +
            banner({ variant: 'info',    content: 'Android support is coming soon. <a href="#" style="color:inherit;text-decoration:underline">Join the waitlist</a>' }) +
            banner({ variant: 'warning', content: 'Scheduled maintenance Sunday 2–4am UTC.' }),
        }),
        `banner({ variant: 'promo', content:
  '🎉 v2.0 is out — ' + button({ label: "See what's new", variant: 'ghost', size: 'sm', href: '/changelog' })
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>', 'string (HTML)', '—',      'Raw HTML slot'],
          ['<code>variant</code>', 'string',        "'info'", "'info' · 'promo' · 'warning'"],
        ]
      )}
    `,
  }),
}
