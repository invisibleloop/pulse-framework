import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { button, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/stack')

export default {
  route: '/components/stack',
  meta: {
    title: 'Stack — Pulse Docs',
    description: 'Stack component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/stack',
    prev,
    next,
    name: 'stack',
    description: 'Flex column with consistent vertical gap. Replaces the common pattern of adding <code>margin-bottom</code> to every child element.',
    content: `
      ${demo(
        stack({
          gap: 'sm',
          content:
            button({ label: 'Primary action' }) +
            button({ label: 'Secondary action', variant: 'secondary' }) +
            button({ label: 'Ghost action', variant: 'ghost' }),
        }),
        `stack({ gap: 'sm', align: 'start', content:
  button({ label: 'Primary action' }) +
  button({ label: 'Secondary action', variant: 'secondary' }) +
  button({ label: 'Ghost', variant: 'ghost' })
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>', 'string (HTML)', '—',         'Raw HTML slot'],
          ['<code>gap</code>',     'string',        "'md'",      "'xs' · 'sm' · 'md' · 'lg' · 'xl'"],
          ['<code>align</code>',   'string',        "'stretch'", "'stretch' · 'start' · 'center' · 'end'"],
        ]
      )}
    `,
  }),
}
