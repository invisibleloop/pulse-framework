import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { feature } from '../../../../src/ui/index.js'
import { iconZap, iconLock, iconPhone } from '../../../../src/ui/icons.js'

const { prev, next } = prevNext('/components/feature')

export default {
  route: '/components/feature',
  meta: {
    title: 'Feature — Pulse Docs',
    description: 'Feature component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/feature',
    prev,
    next,
    name: 'feature',
    description: 'Icon + title + description block. Compose three or four in a CSS grid for the standard "why us" section.',
    content: `
      ${demo(
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem">` +
          feature({ icon: iconZap({ size: 20 }), title: 'Instant load', description: 'Streaming SSR ships HTML before data resolves. Fast by default.' }) +
          feature({ icon: iconLock({ size: 20 }), title: 'Private by default', description: 'No trackers. No third-party scripts. Ever.' }) +
          feature({ icon: iconPhone({ size: 20 }), title: 'Works offline', description: 'Full functionality without a connection.' }) +
        `</div>`,
        `import { iconZap, iconLock, iconPhone } from '@invisibleloop/pulse/ui'

feature({ icon: iconZap({ size: 20 }),   title: 'Instant load',       description: 'Streaming SSR ships HTML before data resolves.' })
feature({ icon: iconLock({ size: 20 }),  title: 'Private by default', description: 'No trackers, ever.' })
feature({ icon: iconPhone({ size: 20 }), title: 'Works offline',      description: 'Full functionality without a connection.' })`
      )}

      ${demo(
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem">` +
          feature({ icon: iconZap({ size: 20 }), title: 'Instant load', description: 'Streaming SSR ships HTML before data resolves. Fast by default.', center: true }) +
          feature({ icon: iconLock({ size: 20 }), title: 'Private by default', description: 'No trackers. No third-party scripts. Ever.', center: true }) +
          feature({ icon: iconPhone({ size: 20 }), title: 'Works offline', description: 'Full functionality without a connection.', center: true }) +
        `</div>`,
        `feature({ icon: iconZap({ size: 20 }),   title: 'Instant load',       description: '...', center: true })
feature({ icon: iconLock({ size: 20 }),  title: 'Private by default', description: '...', center: true })
feature({ icon: iconPhone({ size: 20 }), title: 'Works offline',      description: '...', center: true })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>icon</code>',        'string (HTML)', '—', 'Raw HTML slot — SVG or emoji; displayed in an accent-tinted box'],
          ['<code>title</code>',       'string',        '—', ''],
          ['<code>level</code>',       'number',        '3', 'Heading tag for the title (1–6). Visual style is unchanged.'],
          ['<code>description</code>', 'string',        '—', ''],
          ['<code>center</code>',      'boolean',       'false', 'Centre-align the icon, title, and description'],
        ]
      )}
    `,
  }),
}
