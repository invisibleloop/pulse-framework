import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { list } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/list')

export default {
  route: '/components/list',
  meta: {
    title: 'List — Pulse Docs',
    description: 'Styled ordered and unordered list component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/list',
    prev,
    next,
    name: 'list',
    description: 'Styled unordered or ordered list with consistent spacing and colour tokens. Use this instead of raw <code>&lt;ul&gt;</code> / <code>&lt;ol&gt;</code>. Items are HTML strings — other components can be passed as items.',
    content: `

      <h2 class="doc-h2" id="unordered">Unordered</h2>
      ${demo(
        list({ items: ['Streaming SSR on every page', 'Security headers by default', 'Zero client-side dependencies', 'Lighthouse 100 out of the box'] }),
        `list({
  items: [
    'Streaming SSR on every page',
    'Security headers by default',
    'Zero client-side dependencies',
    'Lighthouse 100 out of the box',
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="ordered">Ordered</h2>
      ${demo(
        list({
          ordered: true,
          items: ['Create a new Pulse project', 'Add your pages to <code>src/pages/</code>', 'Run <code>pulse dev</code> to start the server', 'Deploy when ready'],
        }),
        `list({
  ordered: true,
  items: [
    'Create a new Pulse project',
    'Add your pages to src/pages/',
    'Run pulse dev to start the server',
    'Deploy when ready',
  ],
})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="gap">Gap</h2>
      <p>Control vertical spacing between items with the <code>gap</code> prop.</p>
      ${demo(
        `<div class="u-flex u-gap-8">
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">xs</p>
            ${list({ gap: 'xs', items: ['Design', 'Build', 'Ship'] })}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">sm (default)</p>
            ${list({ gap: 'sm', items: ['Design', 'Build', 'Ship'] })}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">md</p>
            ${list({ gap: 'md', items: ['Design', 'Build', 'Ship'] })}
          </div>
        </div>`,
        `list({ gap: 'xs', items: [...] })
list({ gap: 'sm', items: [...] })  // default
list({ gap: 'md', items: [...] })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="rich-items">Items with markup</h2>
      <p>Items are HTML strings — pass any markup including other components. Always escape user data before including it in item strings.</p>
      ${demo(
        list({
          items: [
            `<strong>spec.state</strong> — initial client state, deep-cloned on mount`,
            `<strong>spec.mutations</strong> — synchronous state updates`,
            `<strong>spec.actions</strong> — async operations with lifecycle hooks`,
            `<strong>spec.server</strong> — server-side data fetchers`,
          ],
        }),
        `list({
  items: [
    '<strong>spec.state</strong> — initial client state',
    '<strong>spec.mutations</strong> — synchronous state updates',
    '<strong>spec.actions</strong> — async operations with lifecycle hooks',
    '<strong>spec.server</strong> — server-side data fetchers',
  ],
})`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>items</code>',   'string[]',                         '—',             'Array of HTML strings for each list item — escape user data before passing'],
          ['<code>ordered</code>', 'boolean',                          '<code>false</code>', '<code>false</code> renders <code>&lt;ul&gt;</code>, <code>true</code> renders <code>&lt;ol&gt;</code>'],
          ['<code>gap</code>',     '<code>xs | sm | md</code>',        '<code>sm</code>',    'Vertical spacing between items'],
          ['<code>class</code>',   'string',                           '—',             'Extra classes on the list element'],
        ]
      )}
    `,
  }),
}
