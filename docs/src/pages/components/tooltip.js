import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { tooltip, button, cluster } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/tooltip')

export default {
  route: '/components/tooltip',
  meta: {
    title: 'Tooltip — Pulse Docs',
    description: 'Tooltip component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/tooltip',
    prev,
    next,
    name: 'tooltip',
    description: 'CSS-powered tooltip that wraps any element. No JavaScript required — the bubble appears on hover and <code>:focus-within</code>. Supports four placements.',
    content: `
      ${demo(
        cluster({ gap: 'lg', justify: 'center', content:
          tooltip({ content: 'This appears on top',    position: 'top',    trigger: button({ label: 'Top',    variant: 'secondary' }) }) +
          tooltip({ content: 'This appears below',     position: 'bottom', trigger: button({ label: 'Bottom', variant: 'secondary' }) }) +
          tooltip({ content: 'This appears to the left',  position: 'left',   trigger: button({ label: 'Left',   variant: 'secondary' }) }) +
          tooltip({ content: 'This appears to the right', position: 'right',  trigger: button({ label: 'Right',  variant: 'secondary' }) }),
        }),
        `tooltip({
  content:  'This appears on top',
  position: 'top',       // top | bottom | left | right
  trigger:  button({ label: 'Hover me', variant: 'secondary' }),
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>',  'string',                          '—',       'Tooltip text (plain text only)'],
          ['<code>trigger</code>',  'string (HTML)',                   '—',       'Raw HTML slot — the element the tooltip wraps'],
          ['<code>position</code>', '<code>top | bottom | left | right</code>', '<code>top</code>', ''],
          ['<code>class</code>',    'string',                          '—',       ''],
        ]
      )}
    `,
  }),
}
