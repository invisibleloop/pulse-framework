import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { footer } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/footer')

export default {
  route: '/components/footer',
  meta: {
    title: 'Footer — Pulse Docs',
    description: 'Accessible site footer with logo slot, navigation links, and legal text.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/footer',
    prev,
    next,
    name: 'footer',
    description: 'Accessible site footer with logo slot, navigation links, and legal text. Handles responsive stacking, hover states, and focus styles automatically.',
    content: `
      ${demo(
        footer({
          logo:     'MyApp',
          logoHref: '/',
          links: [
            { label: 'Docs',    href: '/docs'    },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Blog',    href: '/blog'    },
            { label: 'GitHub',  href: 'https://github.com' },
          ],
          legal: '© 2026 MyApp Ltd.',
        }),
        `footer({
  logo:     'MyApp',
  logoHref: '/',
  links: [
    { label: 'Docs',    href: '/docs'    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'GitHub',  href: 'https://github.com' },
  ],
  legal: '© 2026 MyApp Ltd.',
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>logo</code>',     'string (HTML)', '—',   'Raw HTML slot — SVG, img, or text'],
          ['<code>logoHref</code>', 'string',        "'/'", 'Logo link destination'],
          ['<code>links</code>',    'array',         '[]',  '[{label, href}] — footer navigation links'],
          ['<code>legal</code>',    'string',        '—',   'Copyright / legal text'],
        ]
      )}
    `,
  }),
}
