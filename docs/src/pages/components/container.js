import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { container } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/container')

export default {
  route: '/components/container',
  meta: {
    title: 'Container — Pulse Docs',
    description: 'Container component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/container',
    prev,
    next,
    name: 'container',
    description: 'Max-width wrapper with horizontal padding. The four size presets cover the most common layout widths.',
    content: `
      ${demo(
        container({ content: '<p style="background:var(--surface-2);border:1px dashed var(--border);padding:1rem;border-radius:6px;text-align:center;color:var(--muted)">Content constrained to 768px</p>', size: 'md' }),
        `container({ size: 'md', content: \`
  \${hero({ title: 'Hello' })}
  \${grid({ cols: 3, content: features })}
\` })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>content</code>', 'string (HTML)', '—',    'Raw HTML slot'],
          ['<code>size</code>',    'string',        "'lg'", "'sm' (640px) · 'md' (768px) · 'lg' (1100px) · 'xl' (1280px)"],
        ]
      )}
    `,
  }),
}
