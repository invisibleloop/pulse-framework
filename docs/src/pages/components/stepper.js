import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { stepper } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/stepper')

const STEPS = ['Account', 'Details', 'Payment', 'Review']

export default {
  route: '/components/stepper',
  meta: {
    title: 'Stepper — Pulse Docs',
    description: 'Horizontal step progress indicator component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/stepper',
    prev,
    next,
    name: 'stepper',
    description: 'Horizontal step progress indicator. Completed steps show a check icon; the active step has an accent border; upcoming steps are muted. A connector line between steps fills with accent colour as progress advances.',
    content: `

      <h2 class="doc-h2" id="step1">Step 1 active</h2>
      ${demo(
        stepper({ steps: STEPS, current: 0 }),
        `stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: 0,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="step2">Step 2 active</h2>
      ${demo(
        stepper({ steps: STEPS, current: 1 }),
        `stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: 1,
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="complete">All complete</h2>
      ${demo(
        stepper({ steps: STEPS, current: STEPS.length }),
        `stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: steps.length,   // past the last index = all complete
})`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>steps</code>',   'string[]', '[]',  'Array of step label strings'],
          ['<code>current</code>', 'number',   '0',   '0-based index of the active step. Pass <code>steps.length</code> to mark all steps complete.'],
          ['<code>class</code>',   'string',   '—',   ''],
        ]
      )}
    `,
  }),
}
