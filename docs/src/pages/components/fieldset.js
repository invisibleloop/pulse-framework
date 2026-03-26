import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { fieldset, input, textarea, grid, button } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/fieldset')

export default {
  route: '/components/fieldset',
  meta: {
    title: 'Fieldset — Pulse Docs',
    description: 'Semantic grouping of related form fields with an accessible legend.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/fieldset',
    prev,
    next,
    name: 'fieldset',
    description: 'Wraps related fields in a semantic <code>&lt;fieldset&gt;</code> with a styled <code>&lt;legend&gt;</code>. Screen readers announce the legend when focus enters the group — use it whenever fields belong together (address, card details, contact info). Works naturally inside a <code>&lt;form data-action="..."&gt;</code>.',
    content: `
      ${demo(
        `<form class="u-flex u-flex-col u-gap-4">` +
        fieldset({ legend: 'Your details', content:
          grid({ cols: 2, gap: 'md', content:
            input({ name: 'first', label: 'First name', required: true }) +
            input({ name: 'last',  label: 'Last name',  required: true })
          }) +
          input({ name: 'email', label: 'Email address', type: 'email', required: true })
        }) +
        fieldset({ legend: 'Message', content:
          textarea({ name: 'message', label: 'Tell us about your project', rows: 4, required: true })
        }) +
        button({ label: 'Send message', type: 'submit', variant: 'primary', fullWidth: true }) +
        `</form>`,
        `import { fieldset, grid, input, textarea, button } from '@invisibleloop/pulse/ui'

\`<form data-action="submit" class="u-flex u-flex-col u-gap-4">
  \${fieldset({ legend: 'Your details', content: \`
    \${grid({ cols: 2, gap: 'md', content: \`
      \${input({ name: 'first', label: 'First name', required: true })}
      \${input({ name: 'last',  label: 'Last name',  required: true })}
    \` })}
    \${input({ name: 'email', label: 'Email address', type: 'email', required: true })}
  \` })}
  \${fieldset({ legend: 'Message', content: \`
    \${textarea({ name: 'message', label: 'Tell us about your project', rows: 4, required: true })}
  \` })}
  \${button({ label: 'Send message', type: 'submit', variant: 'primary', fullWidth: true })}
</form>\``
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>legend</code>',  'string', '—',   'Group label — rendered as <code>&lt;legend&gt;</code>, announced by screen readers on focus'],
          ['<code>content</code>', 'string', '—',   'Raw HTML slot — input(), select(), textarea(), grid(), etc.'],
          ['<code>gap</code>',     'string', 'md',  'Vertical gap between fields: xs / sm / md / lg'],
          ['<code>class</code>',   'string', '—',   'Extra classes on the <code>&lt;fieldset&gt;</code> element'],
        ]
      )}
    `,
  }),
}
