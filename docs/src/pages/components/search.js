import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { search } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/search')

export default {
  route: '/components/search',
  meta: {
    title: 'Search — Pulse Docs',
    description: 'Search input component with icon, debounce binding, and clear button.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/search',
    prev,
    next,
    name: 'search',
    description: 'A search input with a built-in icon and optional clear button. Handles the native browser cancel button, <code>data-event</code> binding, and debounce in one component. Use this instead of <code>input({ type: \'search\' })</code>.',
    content: `
      ${demo(
        search({ name: 'q', label: 'Search', placeholder: 'Search products…' }) +
        search({ name: 'q2', label: 'Search', placeholder: 'Search…', value: 'lamp', clearEvent: 'clearSearch', labelHidden: true }),
        `search({ name: 'q', label: 'Search', placeholder: 'Search products…' })

// With value, clear button, and hidden label:
search({
  name:        'q',
  label:       'Search',
  labelHidden: true,
  placeholder: 'Search…',
  value:       state.search,
  event:       'input:setSearch',
  debounce:    200,
  clearEvent:  'clearSearch',
})`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',        'string',  '—',     'Field name and id base'],
          ['<code>label</code>',       'string',  '—',     'Label text — always provide for accessibility'],
          ['<code>labelHidden</code>', 'boolean', 'false', 'Hides label visually; still read by screen readers'],
          ['<code>placeholder</code>', 'string',  '—',     ''],
          ['<code>value</code>',       'string',  '—',     'Current value — controls clear button visibility'],
          ['<code>event</code>',       'string',  '—',     '<code>data-event</code> binding, e.g. <code>\'input:setSearch\'</code>'],
          ['<code>debounce</code>',    'number',  '200',   'Debounce delay in ms — only applied when <code>event</code> is set'],
          ['<code>clearEvent</code>',  'string',  '—',     'Click event for the × button — only shown when <code>value</code> is non-empty'],
          ['<code>disabled</code>',    'boolean', 'false', ''],
          ['<code>id</code>',          'string',  '—',     'Override generated id'],
          ['<code>class</code>',       'string',  '—',     'Extra classes on the wrapper'],
          ['<code>attrs</code>',       'object',  '{}',    'Extra attributes on the <code>&lt;input&gt;</code>'],
        ]
      )}
    `,
  }),
}
