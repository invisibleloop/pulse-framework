import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { barChart, lineChart, donutChart, sparkline, stat, card, grid } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/charts')

// Shared sample data
const monthly = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 78 },
  { label: 'Mar', value: 55 },
  { label: 'Apr', value: 91 },
  { label: 'May', value: 63 },
  { label: 'Jun', value: 84 },
]

const traffic = [
  { label: 'Mon', value: 1200 },
  { label: 'Tue', value: 1850 },
  { label: 'Wed', value: 1540 },
  { label: 'Thu', value: 2100 },
  { label: 'Fri', value: 1760 },
  { label: 'Sat', value: 890  },
  { label: 'Sun', value: 720  },
]

export default {
  route: '/components/charts',
  meta: {
    title: 'Charts — Pulse Docs',
    description: 'Server-rendered SVG charts for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/charts',
    prev,
    next,
    name: 'charts',
    description: 'Server-rendered SVG charts — no JavaScript, no external library. Pure functions that return SVG strings, composable with any layout component. All colours use design tokens and respond to light/dark theme.',
    content: `

      <h2 class="doc-h2" id="bar">Bar chart</h2>
      <p>Vertical bars with optional grid, value labels, and a zero baseline. All colour variants available.</p>
      ${demo(
        barChart({ data: monthly, color: 'accent' }),
        `barChart({
  data: [
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 78 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 91 },
    { label: 'May', value: 63 },
    { label: 'Jun', value: 84 },
  ],
  color: 'accent',
})`
      )}

      <h3 class="doc-h3">With value labels</h3>
      ${demo(
        barChart({ data: monthly, color: 'success', showValues: true }),
        `barChart({ data, color: 'success', showValues: true })`
      )}

      <h3 class="doc-h3">Large dataset with tight gap</h3>
      ${demo(
        barChart({ data: traffic, color: 'blue', gap: 0.15 }),
        `barChart({ data: traffic, color: 'blue', gap: 0.15 })`
      )}

      <h3 class="doc-h3">Negative values</h3>
      ${demo(
        barChart({
          data: [
            { label: 'Q1', value:  24 },
            { label: 'Q2', value: -8  },
            { label: 'Q3', value:  41 },
            { label: 'Q4', value: -15 },
          ],
          color: 'warning',
          showValues: true,
        }),
        `barChart({
  data: [
    { label: 'Q1', value:  24 },
    { label: 'Q2', value: -8  },
    { label: 'Q3', value:  41 },
    { label: 'Q4', value: -15 },
  ],
  color: 'warning',
  showValues: true,
})`
      )}

      <h2 class="doc-h2" id="line">Line chart</h2>
      <p>Connected data points with optional dots, area fill, and grid lines.</p>
      ${demo(
        lineChart({ data: monthly, color: 'accent' }),
        `lineChart({
  data: [
    { label: 'Jan', value: 42 },
    ...
  ],
  color: 'accent',
})`
      )}

      <h3 class="doc-h3">With area fill</h3>
      ${demo(
        lineChart({ data: monthly, color: 'accent', area: true }),
        `lineChart({ data, color: 'accent', area: true })`
      )}

      <h3 class="doc-h3">No dots, area fill, success colour</h3>
      ${demo(
        lineChart({ data: traffic, color: 'success', area: true, showDots: false }),
        `lineChart({ data, color: 'success', area: true, showDots: false })`
      )}

      <h2 class="doc-h2" id="donut">Donut chart</h2>
      <p>Ring chart with multiple segments. Each item can override its colour. Pass <code>label</code> and <code>sublabel</code> for a centred annotation. Add <code>fluid: true</code> to expand to the parent container width.</p>
      ${demo(
        `<div style="display:flex;justify-content:center">` +
        donutChart({
          label: '73%',
          sublabel: 'satisfied',
          data: [
            { label: 'Satisfied',   value: 73, color: 'success' },
            { label: 'Neutral',     value: 18, color: 'muted'   },
            { label: 'Unsatisfied', value: 9,  color: 'error'   },
          ],
        }) + `</div>`,
        `donutChart({
  label:    '73%',
  sublabel: 'satisfied',
  data: [
    { label: 'Satisfied',   value: 73, color: 'success' },
    { label: 'Neutral',     value: 18, color: 'muted'   },
    { label: 'Unsatisfied', value: 9,  color: 'error'   },
  ],
})`
      )}

      <h3 class="doc-h3">Thinner ring</h3>
      ${demo(
        `<div style="display:flex;justify-content:center">` +
        donutChart({
          size: 180,
          thickness: 22,
          label: '4',
          sublabel: 'segments',
          data: [
            { label: 'A', value: 40, color: 'accent'  },
            { label: 'B', value: 30, color: 'blue'    },
            { label: 'C', value: 20, color: 'success' },
            { label: 'D', value: 10, color: 'warning' },
          ],
        }) + `</div>`,
        `donutChart({
  size: 180, thickness: 22,
  label: '4', sublabel: 'segments',
  data: [
    { label: 'A', value: 40, color: 'accent'  },
    { label: 'B', value: 30, color: 'blue'    },
    { label: 'C', value: 20, color: 'success' },
    { label: 'D', value: 10, color: 'warning' },
  ],
})`
      )}

      <h2 class="doc-h2" id="sparkline">Sparkline</h2>
      <p>Minimal inline trend line — pass a plain array of numbers. Designed to sit alongside <code>stat()</code> tiles or inside table cells. Add <code>fluid: true</code> to expand to the parent container width.</p>
      ${demo(
        `<div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">` +
          sparkline({ data: [12,18,14,22,19,28,24,31], color: 'accent',  area: true  }) +
          sparkline({ data: [31,24,28,19,22,14,18,12], color: 'error',   area: true  }) +
          sparkline({ data: [12,18,14,22,19,28,24,31], color: 'success', area: false }) +
        `</div>`,
        `sparkline({ data: [12,18,14,22,19,28,24,31], color: 'accent', area: true })
sparkline({ data: [31,24,28,19,22,14,18,12], color: 'error',  area: true })`
      )}

      <h2 class="doc-h2" id="composition">Composition</h2>
      <p>Charts compose with <code>card()</code>, <code>stat()</code>, <code>grid()</code> — drop any chart into any content slot.</p>
      ${demo(
        grid({
          cols: 2,
          gap: 'md',
          content:
            card({
              title: 'Monthly signups',
              content: barChart({ data: monthly, color: 'accent', height: 180 }),
            }) +
            card({
              title: 'Daily traffic',
              content: lineChart({ data: traffic, color: 'blue', area: true, height: 180 }),
            }),
        }),
        `grid({
  cols: 2,
  content:
    card({ title: 'Monthly signups', content: barChart({ data, height: 180 }) }) +
    card({ title: 'Daily traffic',   content: lineChart({ data, color: 'blue', area: true, height: 180 }) }),
})`
      )}

      <h3 class="doc-h3">Sparkline in stat tiles</h3>
      ${demo(
        grid({
          cols: 3,
          gap: 'md',
          content:
            card({ content: stat({ label: 'Revenue', value: '$18.2k', change: '+12%', trend: 'up' }) + `<div style="margin-top:.75rem">${sparkline({ data: [8,11,9,14,12,16,15,18], color: 'success', area: true })}</div>` }) +
            card({ content: stat({ label: 'Users', value: '4,821', change: '+8.4%', trend: 'up' }) + `<div style="margin-top:.75rem">${sparkline({ data: [22,28,24,31,27,34,30,38], color: 'accent', area: true })}</div>` }) +
            card({ content: stat({ label: 'Churn', value: '2.1%', change: '−0.3%', trend: 'down' }) + `<div style="margin-top:.75rem">${sparkline({ data: [8,6,7,5,6,4,5,3], color: 'error', area: true })}</div>` }),
        }),
        `card({
  content: stat({ label: 'Revenue', value: '$18.2k', change: '+12%', trend: 'up' }) +
    \`<div style="margin-top:.75rem">\${sparkline({ data, color: 'success', area: true })}</div>\`,
})`
      )}

      <h2 class="doc-h2" id="props">Props</h2>

      <h3 class="doc-h3">barChart()</h3>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>data</code>',       'array',   '—',        '<code>{ label, value }[]</code>'],
          ['<code>height</code>',     'number',  '220',      'SVG height in px'],
          ['<code>color</code>',      'string',  "'accent'", 'accent · success · warning · error · blue · muted'],
          ['<code>showValues</code>', 'boolean', 'false',    'Value labels above each bar'],
          ['<code>showGrid</code>',   'boolean', 'true',     'Horizontal grid lines'],
          ['<code>gap</code>',        'number',  '0.25',     'Gap between bars as fraction 0–0.9'],
        ]
      )}
      <p class="doc-note u-mt-2">Always renders at full parent width (<code>width="100%"</code>).</p>

      <h3 class="doc-h3" style="margin-top:2rem">lineChart()</h3>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>data</code>',      'array',   '—',        '<code>{ label, value }[]</code>'],
          ['<code>height</code>',    'number',  '220',      'SVG height in px'],
          ['<code>color</code>',     'string',  "'accent'", 'accent · success · warning · error · blue · muted'],
          ['<code>area</code>',      'boolean', 'false',    'Fill area under the line'],
          ['<code>showDots</code>',  'boolean', 'true',     'Dots at each data point'],
          ['<code>showGrid</code>',  'boolean', 'true',     'Horizontal grid lines'],
        ]
      )}
      <p class="doc-note u-mt-2">Always renders at full parent width (<code>width="100%"</code>).</p>

      <h3 class="doc-h3" style="margin-top:2rem">donutChart()</h3>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>data</code>',      'array',   '—',     '<code>{ label, value, color? }[]</code> — color per segment'],
          ['<code>size</code>',      'number',  '200',   'Diameter in px'],
          ['<code>thickness</code>', 'number',  '40',    'Ring thickness in px'],
          ['<code>label</code>',     'string',  '—',     'Large centre text'],
          ['<code>sublabel</code>',  'string',  '—',     'Smaller text below centre label'],
          ['<code>fluid</code>',     'boolean', 'false', 'Expand to parent width, preserving aspect ratio'],
        ]
      )}

      <h3 class="doc-h3" style="margin-top:2rem">sparkline()</h3>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>data</code>',   'number[]', '—',        'Plain array of numbers'],
          ['<code>width</code>',  'number',   '80',       'SVG width in px (ignored when fluid: true)'],
          ['<code>height</code>', 'number',   '32',       'SVG height in px'],
          ['<code>color</code>',  'string',   "'accent'", 'accent · success · warning · error · blue · muted'],
          ['<code>area</code>',   'boolean',  'false',    'Fill area under the line'],
          ['<code>fluid</code>',  'boolean',  'false',    'Expand to parent width, preserving aspect ratio'],
        ]
      )}
    `,
  }),
}
