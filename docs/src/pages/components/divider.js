import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { divider, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/divider')

export default {
  route: '/components/divider',
  meta: {
    title: 'Divider — Pulse Docs',
    description: 'Divider component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/divider',
    prev,
    next,
    name: 'divider',
    description: 'Horizontal rule for visual separation. With a <code>label</code>, the line splits either side of the text — the classic "or" pattern between login options.',
    content: `
      ${demo(
        stack({ gap: 'lg', content: divider() + divider({ label: 'or continue with' }) }),
        `divider()
divider({ label: 'or continue with' })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>label</code>', 'string', '—', 'Optional centred text — renders as <code>&lt;div&gt;</code> with role="separator" when provided, <code>&lt;hr&gt;</code> otherwise'],
        ]
      )}
    `,
  }),
}
