import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext }                   from '../../lib/nav.js'
import { table, callout }             from '../../lib/layout.js'
import { checkbox, fieldset }         from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/checkbox')

export default {
  route: '/components/checkbox',
  meta: {
    title:       'Checkbox — Pulse Docs',
    description: 'Custom-styled checkbox component for Pulse UI.',
    styles:      ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/checkbox',
    prev,
    next,
    name: 'checkbox',
    description: 'Custom-styled checkbox with animated check mark, full keyboard and screen-reader support. Pairs with <a href="/components/fieldset">fieldset</a> for labelled groups.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      <p>Pass <code>label</code> for the visible text. The <code>id</code> is auto-generated from <code>name</code> and <code>value</code>.</p>
      ${demo(
        checkbox({ name: 'agree', label: 'I agree to the terms' }),
        `checkbox({ name: 'agree', label: 'I agree to the terms' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="checked">Checked</h2>
      ${demo(
        checkbox({ name: 'newsletter', label: 'Send me updates', checked: true }),
        `checkbox({ name: 'newsletter', label: 'Send me updates', checked: state.newsletter })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="hint">Hint</h2>
      <p>A <code>hint</code> string renders below the label as supporting copy.</p>
      ${demo(
        checkbox({ name: 'marketing', label: 'Marketing emails', hint: 'Product news and tips. Unsubscribe any time.', checked: true }),
        `checkbox({
  name:    'marketing',
  label:   'Marketing emails',
  hint:    'Product news and tips. Unsubscribe any time.',
  checked: state.marketing,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="error">Error state</h2>
      <p>Pass <code>error</code> to show a validation message. The error is announced via <code>role="alert"</code>.</p>
      ${demo(
        checkbox({ name: 'terms', label: 'I accept the terms and conditions', error: 'You must accept the terms to continue.' }),
        `checkbox({
  name:  'terms',
  label: 'I accept the terms and conditions',
  error: server.errors.terms,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${demo(
        checkbox({ name: 'feature', label: 'Enable beta features', disabled: true }) +
        ' ' +
        checkbox({ name: 'feature2', label: 'Beta feature (on)', disabled: true, checked: true }),
        `checkbox({ name: 'feature', label: 'Enable beta features', disabled: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="group">Group in a fieldset</h2>
      <p>Compose multiple checkboxes inside a <a href="/components/fieldset">fieldset</a> for a semantic group.</p>
      ${demo(
        fieldset({
          legend: 'Notifications',
          content:
            checkbox({ name: 'notif', value: 'email',   label: 'Email',            checked: true  }) +
            checkbox({ name: 'notif', value: 'sms',     label: 'SMS'                              }) +
            checkbox({ name: 'notif', value: 'browser', label: 'Browser push',     checked: true  }) +
            checkbox({ name: 'notif', value: 'weekly',  label: 'Weekly digest',    disabled: true }),
        }),
        `fieldset({
  legend:  'Notifications',
  content:
    checkbox({ name: 'notif', value: 'email',   label: 'Email',         checked: true }) +
    checkbox({ name: 'notif', value: 'sms',     label: 'SMS'                          }) +
    checkbox({ name: 'notif', value: 'browser', label: 'Browser push',  checked: true }) +
    checkbox({ name: 'notif', value: 'weekly',  label: 'Weekly digest', disabled: true }),
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${callout('note', 'Checkboxes submit their <code>value</code> string (defaulting to <code>"on"</code>) under <code>name</code> in FormData only when checked. Unchecked checkboxes are absent from FormData. Read them in <code>action.onStart</code> via <code>formData.get(\'agree\')</code> — a <code>null</code> result means unchecked.')}

      <h2 class="doc-h2" id="labelhtml">Custom label HTML</h2>
      <p>When the label needs inline styling — for example a strikethrough on a completed todo — use <code>labelHtml</code> instead of <code>label</code>. The value is inserted as raw HTML so you are responsible for escaping any user content.</p>
      ${demo(
        checkbox({ name: 'task', labelHtml: '<span style="text-decoration:line-through;opacity:.5">Buy milk</span>', checked: true }),
        `checkbox({
  name:      'task',
  checked:   todo.done,
  labelHtml: \`<span class="\${todo.done ? 'u-text-muted' : ''}">\${esc(todo.text)}</span>\`,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="props">Props</h2>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',      'string',  '—',     'Field name'],
          ['<code>value</code>',     'string',  '—',     'Submitted value when checked (defaults to browser default <code>"on"</code>)'],
          ['<code>label</code>',     'string',  '—',     'Visible label text — escaped'],
          ['<code>labelHtml</code>', 'string',  '—',     'Raw HTML label slot — not escaped, use for styled spans'],
          ['<code>checked</code>',   'boolean', 'false', ''],
          ['<code>disabled</code>',  'boolean', 'false', ''],
          ['<code>id</code>',        'string',  '—',     'Override the auto-generated <code>id</code>'],
          ['<code>event</code>',     'string',  '—',     '<code>data-event</code> binding, e.g. <code>"change:toggle"</code>'],
          ['<code>hint</code>',      'string',  '—',     'Helper text below the label'],
          ['<code>error</code>',     'string',  '—',     'Validation error — announced via <code>role="alert"</code>'],
          ['<code>class</code>',     'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
