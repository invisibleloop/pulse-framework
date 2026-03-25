import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout, section } from '../../lib/layout.js'
import { segmented, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/segmented')

export default {
  route: '/components/segmented',
  meta: {
    title: 'Segmented — Pulse Docs',
    description: 'iOS-style segmented control component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/segmented',
    prev,
    next,
    name: 'segmented',
    description: 'iOS-style segmented control built from hidden radio inputs. The selected segment is highlighted via CSS — no JavaScript required.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${demo(
        segmented({
          name:  'period',
          value: 'week',
          options: [
            { value: 'day',   label: 'Day'   },
            { value: 'week',  label: 'Week'  },
            { value: 'month', label: 'Month' },
          ],
        }),
        `segmented({
  name:  'period',
  value: state.period,
  options: [
    { value: 'day',   label: 'Day'   },
    { value: 'week',  label: 'Week'  },
    { value: 'month', label: 'Month' },
  ],
})`
      )}

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${demo(
        stack({ gap: 'md', content:
          segmented({
            name:  'size-sm',
            value: 'b',
            size:  'sm',
            options: [
              { value: 'a', label: 'Small' },
              { value: 'b', label: 'Sizes' },
              { value: 'c', label: 'Here'  },
            ],
          }) +
          segmented({
            name:  'size-md',
            value: 'b',
            size:  'md',
            options: [
              { value: 'a', label: 'Medium' },
              { value: 'b', label: 'Default' },
              { value: 'c', label: 'Size'    },
            ],
          }) +
          segmented({
            name:  'size-lg',
            value: 'b',
            size:  'lg',
            options: [
              { value: 'a', label: 'Large' },
              { value: 'b', label: 'Size'  },
              { value: 'c', label: 'Here'  },
            ],
          }),
        }),
        `segmented({ name: 'view', value: 'b', size: 'sm', options: [...] })
segmented({ name: 'view', value: 'b', size: 'md', options: [...] })
segmented({ name: 'view', value: 'b', size: 'lg', options: [...] })`
      )}

      <h2 class="doc-h2" id="ui-context">View toggle</h2>
      <p>A common use case — toggling between Grid and List views.</p>
      ${demo(
        segmented({
          name:  'layout',
          value: 'grid',
          options: [
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
          ],
        }),
        `segmented({
  name:    'layout',
  value:   state.layout,
  options: [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
  ],
})`
      )}

      ${callout('note', 'The segmented control submits the selected <code>value</code> string under <code>name</code> in FormData. Read it via <code>formData.get(\'period\')</code> in <code>action.onStart</code> or <code>action.run</code>.')}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>name</code>',     'string',  '—',    'Field name — submitted in FormData'],
          ['<code>options</code>',  'array',   '[]',   'Array of <code>{ value, label }</code>'],
          ['<code>value</code>',    'string',  '—',    'The currently selected value'],
          ['<code>size</code>',     '<code>sm | md | lg</code>', '<code>md</code>', ''],
          ['<code>disabled</code>', 'boolean', 'false', 'Disables all options'],
          ['<code>class</code>',    'string',  '—',    ''],
        ]
      )}
    `,
  }),
}
