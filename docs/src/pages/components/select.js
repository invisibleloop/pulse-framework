import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { select } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/select')

export default {
  route: '/components/select',
  meta: {
    title: 'Select — Pulse Docs',
    description: 'Select component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/select',
    prev,
    next,
    name: 'select',
    description: 'Options can be plain strings or <code>{ value, label }</code> objects. Pass <code>value</code> to mark the current selection.',
    content: `
      ${demo(
        select({
          name: 'role', label: 'Role',
          options: ['Admin', 'Editor', 'Viewer'],
          value: 'Editor',
        }) +
        select({
          name: 'status', label: 'Status',
          options: [{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }],
          error: 'Please select a status',
        }),
        `select({ name: 'role', label: 'Role', options: ['Admin', 'Editor', 'Viewer'], value: state.role })
select({
  name:    'country',
  label:   'Country',
  options: [{ value: 'gb', label: 'United Kingdom' }, { value: 'us', label: 'United States' }],
  value:   state.country,
  required: true,
})`,
        { col: true }
      )}
    `,
  }),
}
