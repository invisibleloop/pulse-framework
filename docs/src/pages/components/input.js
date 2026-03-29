import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { input } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/input')

export default {
  route: '/components/input',
  meta: {
    title: 'Input — Pulse Docs',
    description: 'Input component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/input',
    prev,
    next,
    name: 'input',
    description: 'The label and error are wired up automatically — <code>for</code>/<code>id</code> and <code>aria-describedby</code> are set from <code>name</code>. You don\'t need to manage ids yourself.',
    content: `
      ${demo(
        input({ name: 'email1', label: 'Email address', type: 'email', placeholder: 'you@example.com' }) +
        input({ name: 'email2', label: 'Email address', type: 'email', value: 'bad@', error: 'Enter a valid email address' }) +
        input({ name: 'search', label: 'Search', placeholder: 'Filter by name…', hint: 'Results update as you type' }),
        `input({ name: 'email',  label: 'Email address', type: 'email', placeholder: 'you@example.com' })
input({ name: 'email',  label: 'Email address', error: 'Enter a valid email address', value: state.email })
input({ name: 'search', label: 'Search', placeholder: 'Filter by name…', hint: 'Results update as you type' })`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',        'string',  '—',    'Also used as id base: <code>field-{name}</code>'],
          ['<code>label</code>',       'string',  '—',    ''],
          ['<code>type</code>',        'string',  'text', 'Any valid HTML input type'],
          ['<code>placeholder</code>', 'string',  '—',    ''],
          ['<code>value</code>',       'string',  '—',    'Pre-filled value — escaped automatically'],
          ['<code>error</code>',       'string',  '—',    'Triggers <code>aria-invalid</code> and <code>role="alert"</code>'],
          ['<code>hint</code>',        'string',  '—',    'Helper text below the input'],
          ['<code>required</code>',    'boolean', 'false','Adds <code>required</code>, <code>aria-required</code>, and a visual asterisk'],
          ['<code>disabled</code>',    'boolean', 'false',''],
          ['<code>id</code>',          'string',  '—',    'Override the generated id'],
          ['<code>attrs</code>',       'object',  '{}',   'Extra attributes on the <code>&lt;input&gt;</code> element'],
        ]
      )}
    `,
  }),
}
