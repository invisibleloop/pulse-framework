import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { button } from '../../../../src/ui/index.js'
import { iconArrowRight, iconDownload, iconPlus, iconSend } from '../../../../src/ui/icons.js'

const { prev, next } = prevNext('/components/button')

export default {
  route: '/components/button',
  meta: {
    title: 'Button — Pulse Docs',
    description: 'Button component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/button',
    prev,
    next,
    name: 'button',
    description: 'Renders as <code>&lt;button&gt;</code> by default. Pass <code>href</code> to get an <code>&lt;a&gt;</code> that looks identical. All four variants are shown below.',
    content: `
      ${demo(
        button({ label: 'Primary',   variant: 'primary'   }) +
        button({ label: 'Secondary', variant: 'secondary' }) +
        button({ label: 'Ghost',     variant: 'ghost'     }) +
        button({ label: 'Danger',    variant: 'danger'    }),
        `button({ label: 'Primary',   variant: 'primary'   })
button({ label: 'Secondary', variant: 'secondary' })
button({ label: 'Ghost',     variant: 'ghost'     })
button({ label: 'Danger',    variant: 'danger'    })`
      )}

      ${demo(
        button({ label: 'Small',  size: 'sm' }) +
        button({ label: 'Medium', size: 'md' }) +
        button({ label: 'Large',  size: 'lg' }),
        `button({ label: 'Small',  size: 'sm' })
button({ label: 'Medium', size: 'md' })
button({ label: 'Large',  size: 'lg' })`
      )}

      ${demo(
        button({ label: 'Download', icon: iconDownload({ size: 14 }) }) +
        button({ label: 'New item', icon: iconPlus({ size: 14 }), variant: 'secondary' }) +
        button({ label: 'Continue', iconAfter: iconArrowRight({ size: 14 }) }) +
        button({ label: 'Send',     iconAfter: iconSend({ size: 14 }), variant: 'ghost' }),
        `import { iconDownload, iconPlus, iconArrowRight, iconSend } from '@invisibleloop/pulse/ui'

button({ label: 'Download', icon: iconDownload({ size: 14 }) })
button({ label: 'New item', icon: iconPlus({ size: 14 }),           variant: 'secondary' })
button({ label: 'Continue', iconAfter: iconArrowRight({ size: 14 }) })
button({ label: 'Send',     iconAfter: iconSend({ size: 14 }),      variant: 'ghost' })`
      )}

      ${demo(
        button({ label: 'Disabled', disabled: true }) +
        button({ label: 'Link', href: '/docs' }) +
        button({ label: 'Submit', type: 'submit', variant: 'primary' }),
        `button({ label: 'Disabled', disabled: true })
button({ label: 'Link',    href: '/docs'   })
button({ label: 'Submit',  type: 'submit', variant: 'primary' })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>label</code>',    'string',  '—',         'Visible text'],
          ['<code>variant</code>',  'string',  'primary',   'primary · secondary · ghost · danger'],
          ['<code>size</code>',     'string',  'md',        'sm · md · lg'],
          ['<code>href</code>',     'string',  '—',         'Renders <code>&lt;a&gt;</code> instead of <code>&lt;button&gt;</code>'],
          ['<code>disabled</code>', 'boolean', 'false',     ''],
          ['<code>type</code>',     'string',  'button',    'button · submit · reset'],
          ['<code>icon</code>',     'string',  '—',         'SVG HTML prepended inside'],
          ['<code>iconAfter</code>','string',  '—',         'SVG HTML appended inside'],
          ['<code>fullWidth</code>','boolean', 'false',     ''],
          ['<code>class</code>',    'string',  '—',         'Extra classes appended to the element'],
          ['<code>attrs</code>',    'object',  '{}',        'Extra HTML attributes (button only)'],
        ]
      )}
    `,
  }),
}
