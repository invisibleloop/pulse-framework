import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { toggle, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/toggle')

export default {
  route: '/components/toggle',
  meta: {
    title: 'Toggle — Pulse Docs',
    description: 'iOS-style switch toggle component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/toggle',
    prev,
    next,
    name: 'toggle',
    description: 'iOS-style switch that renders a visually hidden <code>&lt;input type="checkbox"&gt;</code> with a custom track and thumb. No JavaScript required — state is read from FormData on submission.',
    content: `

      <h2 class="doc-h2" id="default">Default</h2>
      ${demo(
        stack({ gap: 'md', content:
          toggle({ name: 'notifications', label: 'Email notifications' }) +
          toggle({ name: 'updates',       label: 'Product updates', checked: true }),
        }),
        `toggle({ name: 'notifications', label: 'Email notifications' })
toggle({ name: 'updates',       label: 'Product updates', checked: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="hint">With hint</h2>
      <p>Use <code>hint</code> to add supporting text below the switch.</p>
      ${demo(
        stack({ gap: 'lg', content:
          toggle({ name: 'marketing', label: 'Marketing emails', hint: 'Receive tips, product news, and special offers.' }) +
          toggle({ name: 'digest',    label: 'Weekly digest',    hint: 'A summary of activity sent every Monday morning.', checked: true }),
        }),
        `toggle({
  name:    'marketing',
  label:   'Marketing emails',
  hint:    'Receive tips, product news, and special offers.',
})
toggle({
  name:    'digest',
  label:   'Weekly digest',
  hint:    'A summary of activity sent every Monday morning.',
  checked: true,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${demo(
        stack({ gap: 'md', content:
          toggle({ name: 'a', label: 'Off and disabled',  disabled: true }) +
          toggle({ name: 'b', label: 'On and disabled',   disabled: true, checked: true }),
        }),
        `toggle({ name: 'a', label: 'Off and disabled', disabled: true })
toggle({ name: 'b', label: 'On and disabled',  disabled: true, checked: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${callout('note', 'The switch submits as <code>\'on\'</code> under its <code>name</code> when checked. When unchecked, the field is absent from FormData entirely — the same behaviour as a native checkbox. Read it with <code>formData.get(\'name\') === \'on\'</code>.')}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',     'string',  '—',     'Field name — submitted in FormData'],
          ['<code>label</code>',    'string',  '—',     'Visible label text'],
          ['<code>checked</code>',  'boolean', 'false', 'Initial on/off state'],
          ['<code>disabled</code>', 'boolean', 'false', ''],
          ['<code>hint</code>',     'string',  '—',     'Helper text below the switch'],
          ['<code>id</code>',       'string',  '—',     'Override the generated <code>id</code>'],
          ['<code>class</code>',    'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
