import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { empty } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/empty')

export default {
  route: '/components/empty',
  meta: {
    title: 'Empty — Pulse Docs',
    description: 'Empty state component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/empty',
    prev,
    next,
    name: 'empty',
    description: 'Empty state placeholder. Shows a centred title, optional description, and an optional call-to-action when there is nothing to display.',
    content: `
      ${demo(
        empty({
          title:       'No results found',
          description: 'Try adjusting your search or clearing the filters.',
          action:      { label: 'Clear filters', href: '#', variant: 'secondary' },
        }),
        `empty({
  title:       'No results found',
  description: 'Try adjusting your search or clearing the filters.',
  action:      { label: 'Clear filters', href: '/products', variant: 'secondary' },
})`
      )}
    `,
  }),
}
