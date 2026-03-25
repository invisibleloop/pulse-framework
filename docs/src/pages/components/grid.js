import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { grid, card, stat, feature, testimonial } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/grid')

// Reusable placeholder item
const item = (label) =>
  `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:1.25rem;text-align:center;color:var(--muted)">${label}</div>`

export default {
  route: '/components/grid',
  meta: {
    title: 'Grid — Pulse Docs',
    description: 'Grid component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/grid',
    prev,
    next,
    name: 'grid',
    description: 'Responsive CSS grid. Collapses to a single column on mobile. Direct children of the content slot become grid items — no wrapper needed.',
    content: `
      <h2 class="doc-h2" id="cols">Column counts</h2>
      <p>Use <code>cols</code> to set the number of columns. All layouts collapse to one column on mobile.</p>

      <h3 class="doc-h3">2 columns</h3>
      ${demo(
        grid({ cols: 2, content: item('Left') + item('Right') }),
        `grid({ cols: 2, content: left + right })`
      )}

      <h3 class="doc-h3">3 columns (default)</h3>
      ${demo(
        grid({ cols: 3, content: item('One') + item('Two') + item('Three') }),
        `grid({ cols: 3, content: items.join('') })`
      )}

      <h3 class="doc-h3">4 columns</h3>
      ${demo(
        grid({ cols: 4, content: item('A') + item('B') + item('C') + item('D') }),
        `grid({ cols: 4, content: items.join('') })`
      )}

      <h2 class="doc-h2" id="gap">Gap sizes</h2>
      <p>Control spacing between items with <code>gap: 'sm' | 'md' | 'lg'</code>. Default is <code>'md'</code>.</p>

      <h3 class="doc-h3">Small gap</h3>
      ${demo(
        grid({ cols: 3, gap: 'sm', content: item('One') + item('Two') + item('Three') }),
        `grid({ cols: 3, gap: 'sm', content: items.join('') })`
      )}

      <h3 class="doc-h3">Large gap</h3>
      ${demo(
        grid({ cols: 3, gap: 'lg', content: item('One') + item('Two') + item('Three') }),
        `grid({ cols: 3, gap: 'lg', content: items.join('') })`
      )}

      <h2 class="doc-h2" id="with-components">With components</h2>
      <p>Grid accepts any HTML string as content — pass other component outputs directly.</p>

      <h3 class="doc-h3">Feature grid</h3>
      ${demo(
        grid({
          cols: 3,
          content: [
            feature({ icon: '⚡', title: 'Fast',    description: 'Sub-100ms server responses with streaming SSR.' }),
            feature({ icon: '🔒', title: 'Secure',  description: 'Security headers on every response, including errors.' }),
            feature({ icon: '🎯', title: 'Simple',  description: 'No build step, no virtual DOM, no dependencies.' }),
          ].join(''),
        }),
        `grid({
  cols: 3,
  content: features.map(f => feature(f)).join(''),
})`
      )}

      <h3 class="doc-h3">Stat grid</h3>
      ${demo(
        grid({
          cols: 4,
          content: [
            stat({ label: 'Monthly users',  value: '24.8k', change: '+12%',  trend: 'up'      }),
            stat({ label: 'Revenue',        value: '$18.2k', change: '+8.4%', trend: 'up'     }),
            stat({ label: 'Churn rate',     value: '2.1%',  change: '−0.3%', trend: 'down'   }),
            stat({ label: 'Uptime',         value: '99.98%', change: '0.0%', trend: 'neutral' }),
          ].join(''),
        }),
        `grid({
  cols: 4,
  content: stats.map(s => stat(s)).join(''),
})`
      )}

      <h3 class="doc-h3">Testimonial grid</h3>
      ${demo(
        grid({
          cols: 3,
          content: [
            testimonial({ quote: 'Shipped our redesign in a weekend. No boilerplate, no config hell.', name: 'Alex Morgan',   role: 'CTO at Launchpad', rating: 5 }),
            testimonial({ quote: 'The streaming SSR makes our pages feel instant. Lighthouse is happy.', name: 'Sara Kim',    role: 'Lead Engineer, Orbit', rating: 5 }),
            testimonial({ quote: 'Finally a UI kit that doesn\'t fight the platform. Just HTML.', name: 'Dan Okafor', role: 'Founder, Stackly', rating: 5 }),
          ].join(''),
        }),
        `grid({
  cols: 3,
  content: testimonials.map(t => testimonial(t)).join(''),
})`
      )}

      <h3 class="doc-h3">Card grid</h3>
      ${demo(
        grid({
          cols: 3,
          gap: 'md',
          content: [
            card({
              title: 'Getting started',
              content: `<p style="color:var(--muted);margin:0">Install and run your first Pulse app in under five minutes.</p>`,
              footer: `<span class="ui-badge">Guide</span>`,
            }),
            card({
              title: 'Components',
              content: `<p style="color:var(--muted);margin:0">30+ accessible, composable UI primitives ready to drop in.</p>`,
              footer: `<span class="ui-badge">Reference</span>`,
            }),
            card({
              title: 'Deployment',
              content: `<p style="color:var(--muted);margin:0">Static hosting, Node servers, or edge runtimes — one build.</p>`,
              footer: `<span class="ui-badge">Deploy</span>`,
            }),
          ].join(''),
        }),
        `grid({
  cols: 3,
  content: docs.map(d => card({
    title:   d.title,
    content: \`<p>\${d.summary}</p>\`,
    footer:  badge({ label: d.tag }),
  })).join(''),
})`
      )}

      <h2 class="doc-h2" id="1col">Single column</h2>
      <p>Use <code>cols: 1</code> for a stacked list with consistent spacing — useful for form sections or timelines.</p>
      ${demo(
        grid({ cols: 1, gap: 'sm', content: item('Step one') + item('Step two') + item('Step three') }),
        `grid({ cols: 1, gap: 'sm', content: steps.join('') })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>content</code>', 'string (HTML)', '—',     'Raw HTML slot — direct children are grid items'],
          ['<code>cols</code>',    'number',        '3',     '1 · 2 · 3 · 4'],
          ['<code>gap</code>',     'string',        "'md'",  "'sm' · 'md' · 'lg'"],
        ]
      )}
    `,
  }),
}
