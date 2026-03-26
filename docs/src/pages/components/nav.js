import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { button, nav as uiNav } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/nav')

export default {
  route: '/components/nav',
  meta: {
    title: 'Nav — Pulse Docs',
    description: 'Nav component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/nav',
    prev,
    next,
    name: 'nav',
    description: 'Sticky-capable site header with logo, navigation links, and an optional CTA button. On mobile (&lt; 640px) links collapse behind a burger button — clicking it reveals an overlay panel that sits on top of page content without pushing it down. Wired automatically by <code>pulse-ui.js</code>.',
    content: `
      ${demo(
        uiNav({
          logo:     '<strong>MyApp</strong>',
          logoHref: '/',
          links:    [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }],
          action:   button({ label: 'Download', size: 'sm' }),
          sticky:   false,
        }),
        `nav({
  logo:     '<strong>MyApp</strong>',
  logoHref: '/',
  links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing',  href: '#pricing'  },
    { label: 'FAQ',      href: '#faq'      },
  ],
  action: button({ label: 'Download', size: 'sm' }),
  sticky: true,
})`
      )}

      <h2 class="doc-h2" id="mobile">Mobile view</h2>
      <p>At &lt; 640px the links and action are hidden and replaced with a burger button. The panel opens as an overlay — no layout shift.</p>

      <div class="demo-phone demo-mobile-nav">
        <div class="demo-phone-statusbar"><div class="demo-phone-pill"></div></div>
        ${uiNav({
          logo:     '<strong>MyApp</strong>',
          logoHref: '/',
          links:    [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }],
          action:   button({ label: 'Download', size: 'sm' }),
        })}
        <div class="demo-phone-content"><p>Tap the burger to open the overlay</p></div>
      </div>

      <h2 class="doc-h2" id="burger-left">Burger on the left</h2>
      <p>Set <code>burgerAlign: 'left'</code> to place the burger before the logo — common in app-style layouts.</p>

      <div class="demo-phone demo-mobile-nav">
        <div class="demo-phone-statusbar"><div class="demo-phone-pill"></div></div>
        ${uiNav({
          logo:        '<strong>MyApp</strong>',
          logoHref:    '/',
          links:       [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }],
          action:      button({ label: 'Download', size: 'sm' }),
          burgerAlign: 'left',
        })}
        <div class="demo-phone-content"><p>Burger on the left — logo stays right</p></div>
      </div>

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>logo</code>',     'string (HTML)', '—',     'Raw HTML slot — SVG, img, or text'],
          ['<code>logoHref</code>', 'string',        "'/'",   ''],
          ['<code>links</code>',   'array',          '[]',    '<code>{ label, href }[]</code>'],
          ['<code>action</code>',  'string (HTML)',  '—',     'Raw HTML slot — shown in desktop bar and mobile menu'],
          ['<code>sticky</code>',      'boolean', 'false',   'position: sticky with backdrop blur'],
          ['<code>burgerAlign</code>', 'string',  "'right'", "'right' or 'left' — mobile burger position"],
        ]
      )}
    `,
  }),
}
