import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { breadcrumbs } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/breadcrumbs')

export default {
  route: '/components/breadcrumbs',
  meta: {
    title: 'Breadcrumbs — Pulse Docs',
    description: 'Accessible breadcrumb navigation component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/breadcrumbs',
    prev,
    next,
    name: 'breadcrumbs',
    description: 'Accessible breadcrumb navigation. The current page item renders as a <code>&lt;span&gt;</code> with <code>aria-current="page"</code>; all preceding items render as links.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${demo(
        breadcrumbs({
          items: [
            { label: 'Home',     href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Sneakers' },
          ],
        }),
        `breadcrumbs({
  items: [
    { label: 'Home',     href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Sneakers' },
  ],
})`
      )}

      <h2 class="doc-h2" id="longer">Longer trail</h2>
      ${demo(
        breadcrumbs({
          items: [
            { label: 'Home',       href: '/' },
            { label: 'Shop',       href: '/shop' },
            { label: 'Footwear',   href: '/shop/footwear' },
            { label: 'Sneakers',   href: '/shop/footwear/sneakers' },
            { label: 'Air Max 90' },
          ],
        }),
        `breadcrumbs({
  items: [
    { label: 'Home',     href: '/' },
    { label: 'Shop',     href: '/shop' },
    { label: 'Footwear', href: '/shop/footwear' },
    { label: 'Sneakers', href: '/shop/footwear/sneakers' },
    { label: 'Air Max 90' },
  ],
})`
      )}

      <h2 class="doc-h2" id="separator">Custom separator</h2>
      ${demo(
        breadcrumbs({
          separator: '›',
          items: [
            { label: 'Docs',      href: '/docs' },
            { label: 'Components', href: '/docs/components' },
            { label: 'Breadcrumbs' },
          ],
        }),
        `breadcrumbs({
  separator: '›',
  items: [
    { label: 'Docs',       href: '/docs' },
    { label: 'Components', href: '/docs/components' },
    { label: 'Breadcrumbs' },
  ],
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>items</code>',     'array',  '[]',  'Array of <code>{ label, href }</code>. The last item should have no <code>href</code> — it becomes the current page.'],
          ['<code>separator</code>', 'string', "'/'", 'Character rendered between items'],
          ['<code>class</code>',     'string', '—',   ''],
        ]
      )}
    `,
  }),
}
