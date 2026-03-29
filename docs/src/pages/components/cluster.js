import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { badge, cluster } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/cluster')

export default {
  route: '/components/cluster',
  meta: {
    title: 'Cluster — Pulse Docs',
    description: 'Cluster component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/cluster',
    prev,
    next,
    name: 'cluster',
    description: 'Flex row with wrapping. Groups inline elements horizontally — action buttons, badges, app store badges, stat rows.',
    content: `
      ${demo(
        cluster({
          gap: 'sm',
          content: badge({ label: 'Performance' }) + badge({ label: 'Accessibility' }) + badge({ label: 'Zero JS', variant: 'success' }) + badge({ label: 'SSR', variant: 'info' }),
        }),
        `cluster({ gap: 'sm', justify: 'center', content:
  badge({ label: 'Performance' }) +
  badge({ label: 'Zero JS', variant: 'success' }) +
  appBadge({ store: 'apple', href: url })
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>', 'string (HTML)', '—',       'Raw HTML slot'],
          ['<code>gap</code>',     'string',        "'md'",    "'xs' · 'sm' · 'md' · 'lg'"],
          ['<code>justify</code>', 'string',        "'start'", "'start' · 'center' · 'end' · 'between'"],
          ['<code>align</code>',   'string',        "'center'","'start' · 'center' · 'end'"],
          ['<code>wrap</code>',    'boolean',       'true',    'Set false to prevent wrapping'],
        ]
      )}
    `,
  }),
}
