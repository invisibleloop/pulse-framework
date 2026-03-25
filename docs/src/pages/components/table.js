import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { badge, table as uiTable } from '../../../../src/ui/index.js'
import { escHtml } from '../../../../src/html.js'

const { prev, next } = prevNext('/components/table')

export default {
  route: '/components/table',
  meta: {
    title: 'Table — Pulse Docs',
    description: 'Table component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/table',
    prev,
    next,
    name: 'table',
    description: 'The scroll wrapper has <code>role="region"</code> and <code>tabindex="0"</code> so keyboard users can scroll horizontally on narrow screens. Row cells are raw HTML slots — wrap user-supplied values in <code>escHtml()</code> when building them.',
    content: `
      ${demo(
        uiTable({
          caption: 'Team members',
          headers: ['Name', 'Role', 'Status'],
          rows: [
            [escHtml('Alice Smith'), badge({ label: 'Admin',  variant: 'info'    }), badge({ label: 'Active',   variant: 'success' })],
            [escHtml('Bob Jones'),   badge({ label: 'Editor', variant: 'default' }), badge({ label: 'Active',   variant: 'success' })],
            [escHtml('Carol White'), badge({ label: 'Viewer', variant: 'default' }), badge({ label: 'Inactive', variant: 'default' })],
          ],
        }),
        `table({
  caption: 'Team members',
  headers: ['Name', 'Role', 'Status'],
  rows: server.users.map(u => [
    escHtml(u.name),
    badge({ label: u.role,   variant: u.role === 'admin' ? 'info' : 'default' }),
    badge({ label: u.status, variant: u.active ? 'success' : 'default'        }),
  ]),
})`
      )}
    `,
  }),
}
