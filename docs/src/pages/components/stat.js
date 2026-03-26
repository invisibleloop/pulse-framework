import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { stat } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/stat')

export default {
  route: '/components/stat',
  meta: {
    title: 'Stat — Pulse Docs',
    description: 'Stat component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/stat',
    prev,
    next,
    name: 'stat',
    description: 'Numeric metric display with optional trend indicator. Use inside a <code>card()</code> or a flex/grid container for dashboard layouts.',
    content: `
      ${demo(
        `<div style="display:flex;gap:2rem;flex-wrap:wrap">` +
          stat({ label: 'Total users',  value: '12,483', change: '+8.2%', trend: 'up'      }) +
          stat({ label: 'Bounce rate',  value: '24%',    change: '−3.1%', trend: 'down'    }) +
          stat({ label: 'Avg. session', value: '4m 12s'                                    }) +
        `</div>`,
        `stat({ label: 'Total users',  value: '12,483', change: '+8.2%', trend: 'up'   })
stat({ label: 'Bounce rate',  value: '24%',    change: '−3.1%', trend: 'down' })
stat({ label: 'Avg. session', value: '4m 12s' })`
      )}
      <p>The <code>center</code> prop centre-aligns the value, label, and change — useful in grids or dashboard cards.</p>
      ${demo(
        `<div style="display:flex;gap:2rem;flex-wrap:wrap">` +
          stat({ label: 'Total users',  value: '12,483', change: '+8.2%', trend: 'up',   center: true }) +
          stat({ label: 'Bounce rate',  value: '24%',    change: '−3.1%', trend: 'down', center: true }) +
          stat({ label: 'Avg. session', value: '4m 12s',                                 center: true }) +
        `</div>`,
        `stat({ label: 'Total users', value: '12,483', change: '+8.2%', trend: 'up', center: true })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>label</code>',  'string',  '—',       ''],
          ['<code>value</code>',  'string',  '—',       'Formatted value string — e.g. "2.4k", "98%"'],
          ['<code>change</code>', 'string',  '—',       'Change label — e.g. "+12%", "−3"'],
          ['<code>trend</code>',  'string',  'neutral', 'up · down · neutral'],
          ['<code>center</code>', 'boolean', 'false',   'Centre-aligns value, label, and change'],
        ]
      )}
    `,
  }),
}
