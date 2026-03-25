import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { badge } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/badge')

export default {
  route: '/components/badge',
  meta: {
    title: 'Badge — Pulse Docs',
    description: 'Badge component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/badge',
    prev,
    next,
    name: 'badge',
    description: 'Inline status and label indicator. Five semantic variants cover the most common states.',
    content: `
      ${demo(
        badge({ label: 'Default', variant: 'default' }) + ' ' +
        badge({ label: 'Info',    variant: 'info'    }) + ' ' +
        badge({ label: 'Success', variant: 'success' }) + ' ' +
        badge({ label: 'Warning', variant: 'warning' }) + ' ' +
        badge({ label: 'Error',   variant: 'error'   }),
        `badge({ label: 'Default', variant: 'default' })
badge({ label: 'Info',    variant: 'info'    })
badge({ label: 'Success', variant: 'success' })
badge({ label: 'Warning', variant: 'warning' })
badge({ label: 'Error',   variant: 'error'   })`
      )}
    `,
  }),
}
