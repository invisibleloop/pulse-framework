import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { hero, appBadge } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/hero')

export default {
  route: '/components/hero',
  meta: {
    title: 'Hero — Pulse Docs',
    description: 'Hero component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/hero',
    prev,
    next,
    name: 'hero',
    description: 'Full-width hero section. The <code>actions</code> slot accepts any combination of <code>button()</code> and <code>appBadge()</code> calls. Set <code>align: \'left\'</code> for a split-layout hero. Use <code>size: \'sm\'</code> for inner-page headers that don\'t need the full vertical padding.',
    content: `
      ${demo(
        hero({
          eyebrow:  'Now available',
          title:    'The app your phone deserves',
          subtitle: 'Beautifully simple. Ridiculously fast. Available on iOS and Android.',
          actions:  appBadge({ store: 'apple', href: '#' }) + ' ' + appBadge({ store: 'google', href: '#' }),
        }),
        `hero({
  eyebrow:  'Now available',
  title:    'The app your phone deserves',
  subtitle: 'Beautifully simple. Ridiculously fast.',
  actions:  appBadge({ store: 'apple',  href: appStoreUrl }) +
            appBadge({ store: 'google', href: playStoreUrl }),
})`
      )}

      ${demo(
        hero({
          title:    'Blog',
          subtitle: 'Thoughts on building for the web.',
          size:     'sm',
        }),
        `hero({
  title:    'Blog',
  subtitle: 'Thoughts on building for the web.',
  size:     'sm',
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>eyebrow</code>',  'string',        '—',         'Small label above the title'],
          ['<code>title</code>',    'string',        '—',         ''],
          ['<code>subtitle</code>', 'string',        '—',         ''],
          ['<code>actions</code>',  'string (HTML)', '—',         'Raw HTML slot'],
          ['<code>align</code>',    'string',        "'center'",  "'center' or 'left'"],
          ['<code>size</code>',     'string',        "'md'",      "'md' (5rem padding) or 'sm' (2.5rem top, no bottom) — use sm for inner-page headers"],
        ]
      )}
    `,
  }),
}
