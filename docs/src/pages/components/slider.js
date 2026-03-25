import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { slider } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/slider')

export default {
  route: '/components/slider',
  meta: {
    title: 'Slider — Pulse Docs',
    description: 'Styled range input slider component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: { brightness: 100 },
  mutations: {
    setBrightness: (state, e) => ({ brightness: Number(e.target.value) }),
  },
  view: (state) => renderComponentPage({
    currentHref: '/components/slider',
    prev,
    next,
    name: 'slider',
    description: 'Styled range input with label, hint, and a CSS-driven fill gradient that tracks the thumb live as you drag.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${demo(
        slider({ name: 'volume', label: 'Volume', showValue: true }),
        `slider({ name: 'volume', label: 'Volume', showValue: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="min-max-step">Min, max, step, and hint</h2>
      ${demo(
        slider({
          name:      'brightness',
          label:     'Brightness',
          min:       0,
          max:       200,
          step:      10,
          value:     100,
          showValue: true,
          hint:      'Adjust display brightness (0–200)',
        }),
        `slider({
  name:      'brightness',
  label:     'Brightness',
  min:       0,
  max:       200,
  step:      10,
  value:     100,
  showValue: true,
  hint:      'Adjust display brightness (0–200)',
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="live-value">Live value in state</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use <code>data-event="change:mutationName"</code> to capture the value when the user releases the handle. The fill gradient always updates live — no mutation needed for that.</p>
      ${demo(
        `<div>
          ${slider({ name: 'brightness', label: 'Brightness', value: state.brightness, min: 0, max: 200, step: 10, showValue: true, event: 'change:setBrightness' })}
        </div>`,
        `// state
{ brightness: 100 }

// mutation
setBrightness: (state, e) => ({ brightness: Number(e.target.value) })

// view
slider({
  name:      'brightness',
  label:     'Brightness',
  min:       0,
  max:       200,
  step:      10,
  value:     state.brightness,
  showValue: true,
  event:     'change:setBrightness',
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${demo(
        slider({ name: 'opacity', label: 'Opacity', value: 30, disabled: true }),
        `slider({ name: 'opacity', label: 'Opacity', value: 30, disabled: true })`,
        { col: true }
      )}

      ${callout('note', 'The fill gradient updates live during drag automatically. To read the final value, either use <code>data-event="change:mutationName"</code> on the slider or submit it as part of a form — the value is available in FormData as a number string under <code>name</code>.')}
      ${callout('warning', 'Do not use <code>data-event="input:mutationName"</code> on a slider. Pulse replaces <code>innerHTML</code> on every mutation, which interrupts the drag mid-gesture. Use <code>change</code> instead — it fires once when the user releases the handle.')}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>name</code>',     'string',  '—',     'Field name — submitted in FormData'],
          ['<code>label</code>',    'string',  '—',     'Visible label text'],
          ['<code>min</code>',      'number',  '0',     'Minimum value'],
          ['<code>max</code>',      'number',  '100',   'Maximum value'],
          ['<code>step</code>',     'number',  '1',     'Step increment'],
          ['<code>value</code>',    'number',  '50',    'Current value'],
          ['<code>showValue</code>', 'boolean', 'false', 'Show current value live beside the label as you drag'],
          ['<code>disabled</code>', 'boolean', 'false', ''],
          ['<code>hint</code>',     'string',  '—',     'Helper text below the slider'],
          ['<code>event</code>',    'string',  '—',     '<code>data-event</code> binding, e.g. <code>change:mutationName</code>'],
          ['<code>id</code>',       'string',  '—',     'Override the generated <code>id</code>'],
          ['<code>class</code>',    'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
