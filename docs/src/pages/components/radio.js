import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { radio, radioGroup, fieldset } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/radio')

export default {
  route: '/components/radio',
  meta: {
    title: 'Radio — Pulse Docs',
    description: 'Radio button and radio group components for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/radio',
    prev,
    next,
    name: 'radio',
    description: 'Custom-styled radio buttons with full keyboard and screen-reader support. Use <code>radio()</code> for a single option or <code>radioGroup()</code> for a semantic group inside a form.',
    content: `

      <h2 class="doc-h2" id="group">Radio group</h2>
      <p>The standard usage. <code>radioGroup()</code> renders a <code>&lt;fieldset&gt;</code> with a <code>&lt;legend&gt;</code> and marks the currently selected option via the <code>value</code> prop.</p>
      ${demo(
        radioGroup({
          name:    'plan',
          legend:  'Plan',
          value:   'pro',
          options: [
            { value: 'starter', label: 'Starter' },
            { value: 'pro',     label: 'Pro'     },
            { value: 'team',    label: 'Team'    },
          ],
        }),
        `radioGroup({
  name:    'plan',
  legend:  'Plan',
  value:   state.plan,   // marks the selected option
  options: [
    { value: 'starter', label: 'Starter' },
    { value: 'pro',     label: 'Pro'     },
    { value: 'team',    label: 'Team'    },
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="hints">Per-option hints</h2>
      <p>Each option accepts a <code>hint</code> string for supporting copy below the label.</p>
      ${demo(
        radioGroup({
          name:    'billing',
          legend:  'Billing cycle',
          value:   'annual',
          options: [
            { value: 'monthly', label: 'Monthly',  hint: 'Billed every month. Cancel any time.' },
            { value: 'annual',  label: 'Annual',   hint: 'Billed once a year. Save 20%.'        },
          ],
        }),
        `radioGroup({
  name:    'billing',
  legend:  'Billing cycle',
  value:   state.billing,
  options: [
    { value: 'monthly', label: 'Monthly', hint: 'Billed every month. Cancel any time.' },
    { value: 'annual',  label: 'Annual',  hint: 'Billed once a year. Save 20%.'        },
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="error">Error state</h2>
      <p>Pass <code>error</code> to show a validation message below the group. The message is linked via <code>aria-describedby</code>.</p>
      ${demo(
        radioGroup({
          name:    'size',
          legend:  'Size',
          error:   'Please select a size.',
          options: [
            { value: 'sm', label: 'Small'  },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large'  },
          ],
        }),
        `radioGroup({
  name:    'size',
  legend:  'Size',
  error:   server.errors.size,
  options: [
    { value: 'sm', label: 'Small'  },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large'  },
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="disabled">Disabled options</h2>
      <p>Set <code>disabled: true</code> on individual options, or pass <code>disabled</code> at the group level to disable all.</p>
      ${demo(
        radioGroup({
          name:    'tier',
          legend:  'Tier',
          value:   'basic',
          options: [
            { value: 'basic',       label: 'Basic'      },
            { value: 'pro',         label: 'Pro'        },
            { value: 'enterprise',  label: 'Enterprise', disabled: true },
          ],
        }),
        `radioGroup({
  name:    'tier',
  legend:  'Tier',
  value:   state.tier,
  options: [
    { value: 'basic',      label: 'Basic'      },
    { value: 'pro',        label: 'Pro'        },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="gap">Gap</h2>
      <p>Control spacing between options with <code>gap</code>: <code>'sm'</code> · <code>'md'</code> (default) · <code>'lg'</code>.</p>
      ${demo(
        radioGroup({
          name:    'color',
          legend:  'Colour',
          gap:     'lg',
          value:   'blue',
          options: [
            { value: 'red',  label: 'Red'  },
            { value: 'blue', label: 'Blue' },
            { value: 'green',label: 'Green'},
          ],
        }),
        `radioGroup({ ..., gap: 'lg' })`
      )}

      <h2 class="doc-h2" id="single">Single radio</h2>
      <p>Use <code>radio()</code> directly when you need to compose your own group layout — for example inside a <a href="/components/fieldset">fieldset</a> alongside other controls.</p>
      ${demo(
        fieldset({
          legend: 'Preferred contact',
          content:
            radio({ name: 'contact', value: 'email', label: 'Email', checked: true }) +
            radio({ name: 'contact', value: 'phone', label: 'Phone' }),
        }),
        `fieldset({
  legend:  'Preferred contact',
  content:
    radio({ name: 'contact', value: 'email', label: 'Email', checked: true }) +
    radio({ name: 'contact', value: 'phone', label: 'Phone' }),
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${callout('note', 'Radio groups submit the selected <code>value</code> string under <code>name</code> in FormData. If nothing is selected, the field is absent from FormData. Read it in <code>action.onStart</code> or <code>action.run</code> via <code>formData.get(\'plan\')</code>.')}

      <h2 class="doc-h2" id="props-group">radioGroup() props</h2>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',    'string',  '—',       'Shared <code>name</code> attribute for all inputs in the group'],
          ['<code>legend</code>',  'string',  '—',       'Group label — renders as a <code>&lt;legend&gt;</code>'],
          ['<code>options</code>', 'array',   '<code>[]</code>', 'Array of <code>{ value, label, hint?, disabled? }</code>'],
          ['<code>value</code>',   'string',  '—',       'The currently selected value — marks the matching option as <code>checked</code>'],
          ['<code>hint</code>',    'string',  '—',       'Helper text below the group'],
          ['<code>error</code>',   'string',  '—',       'Validation error — linked via <code>aria-describedby</code>'],
          ['<code>gap</code>',     '<code>sm | md | lg</code>', '<code>md</code>', 'Spacing between options'],
          ['<code>class</code>',   'string',  '—',       ''],
        ]
      )}

      <h2 class="doc-h2" id="props-radio">radio() props</h2>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>name</code>',     'string',  '—',      'Field name'],
          ['<code>value</code>',    'string',  '—',      'Submitted value when this option is selected'],
          ['<code>label</code>',    'string',  '—',      'Visible label'],
          ['<code>checked</code>',  'boolean', 'false',  ''],
          ['<code>disabled</code>', 'boolean', 'false',  ''],
          ['<code>id</code>',       'string',  '—',      'Override the generated <code>id</code>'],
          ['<code>class</code>',    'string',  '—',      ''],
        ]
      )}
    `,
  }),
}
