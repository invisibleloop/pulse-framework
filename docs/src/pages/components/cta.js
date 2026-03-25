import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { cta, button } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/cta')

export default {
  route: '/components/cta',
  meta: {
    title: 'CTA — Pulse Docs',
    description: 'Call-to-action block with eyebrow, heading, body text, and an actions slot.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/cta',
    prev,
    next,
    name: 'cta',
    description: 'Call-to-action block with eyebrow, heading, body text, and an actions slot. Sits inside <code>section()</code> + <code>container()</code> — adds no padding of its own.',
    content: `
      ${demo(
        cta({
          eyebrow:  'Get started today',
          title:    'Ready to build?',
          subtitle: 'One spec file per page. SSR always on. Lighthouse 100 out of the box.',
          actions:  button({ label: 'Start building →', href: '#', variant: 'primary', size: 'lg' }) +
                    button({ label: 'View on GitHub',    href: '#', variant: 'ghost',   size: 'lg' }),
        }),
        `cta({
  eyebrow:  'Get started today',
  title:    'Ready to build?',
  subtitle: 'One spec file per page. SSR always on. Lighthouse 100 out of the box.',
  actions:  button({ label: 'Start building →', href: '/docs', variant: 'primary', size: 'lg' }) +
            button({ label: 'View on GitHub',    href: 'https://github.com/...', variant: 'ghost', size: 'lg' }),
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>eyebrow</code>',  'string',        '—',          'Small label above the heading'],
          ['<code>title</code>',    'string',        '—',          'Main heading'],
          ['<code>level</code>',    'number',        '2',          'Heading tag for the title (1–6). Visual style is unchanged.'],
          ['<code>subtitle</code>', 'string',        '—',          'Supporting paragraph'],
          ['<code>actions</code>',  'string (HTML)', '—',          'Raw HTML slot — typically button() calls'],
          ['<code>align</code>',    'string',        "'center'",   "'center' · 'left'"],
        ]
      )}
    `,
  }),
}
