import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { button, stack, media } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/media')

export default {
  route: '/components/media',
  meta: {
    title: 'Media — Pulse Docs',
    description: 'Media component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/media',
    prev,
    next,
    name: 'media',
    description: 'Two-column image + text layout. Stacks vertically on mobile. Set <code>reverse</code> to alternate image position for multi-block feature sections.',
    content: `
      ${demo(
        media({
          image:   `<div style="background:var(--ui-surface-2);border:1px solid var(--ui-border);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--ui-muted);font-size:.875rem">Screenshot</div>`,
          content: stack({ gap: 'md', content: '<h3 style="font-size:1.25rem;font-weight:700;color:var(--ui-text);margin:0">One-tap controls</h3><p style="color:var(--ui-muted);margin:0">Tap to flap. Chippy Bird takes seconds to learn and a lifetime to conquer.</p>' + button({ label: 'Download', href: '#' }) }),
        }),
        `media({
  image:   \`<img src="\${screenshot}" alt="App screenshot">\`,
  content: stack({ gap: 'md', content:
    '<h3>One-tap controls</h3>' +
    '<p>Tap to flap.</p>' +
    button({ label: 'Download', href: appStoreUrl })
  }),
  reverse: false,
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>image</code>',   'string (HTML)', '—',         'Raw HTML slot — img, figure, SVG, or styled div'],
          ['<code>content</code>', 'string (HTML)', '—',         'Raw HTML slot'],
          ['<code>reverse</code>', 'boolean',       'false',     'Puts text left, image right'],
          ['<code>align</code>',   'string',        "'center'",  "'center' · 'start'"],
          ['<code>gap</code>',     'string',        "'md'",      "'sm' · 'md' · 'lg'"],
        ]
      )}
    `,
  }),
}
