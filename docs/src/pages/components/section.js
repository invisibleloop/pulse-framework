import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { container, section as uiSection } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/section')

export default {
  route: '/components/section',
  meta: {
    title: 'Section — Pulse Docs',
    description: 'Vertical padding wrapper with optional background. Compose with container() for full-width background with constrained content.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/section',
    prev,
    next,
    name: 'section',
    description: 'Vertical padding wrapper with optional background. Compose with <code>container()</code> for full-width background with constrained content.',
    content: `
      ${demo(
        uiSection({
          eyebrow: 'Why Pulse',
          title: 'Built for speed.',
          subtitle: 'Every page scores 100 on Lighthouse by design, not by optimisation.',
          align: 'center',
          variant: 'alt',
          content: container({ size: 'md', content: '<p style="text-align:center;color:var(--ui-muted)">Content goes here</p>' }),
        }) +
        uiSection({ variant: 'dark', content: container({ size: 'md', content: '<p style="text-align:center;color:var(--ui-muted)">Dark background · no header</p>' }) }),
        `section({
  eyebrow:  'Why Pulse',
  title:    'Built for speed.',
  subtitle: 'Every page scores 100 on Lighthouse by design.',
  align:    'center',
  variant:  'alt',
  content:  container({ size: 'lg', content: featureGrid }),
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>',  'string (HTML)', '—',         'Raw HTML slot'],
          ['<code>variant</code>',  'string',        "'default'", "'default' · 'alt' · 'dark'"],
          ['<code>padding</code>',  'string',        "'md'",      "'sm' · 'md' · 'lg'"],
          ['<code>id</code>',       'string',        '—',         'Anchor id for nav links'],
          ['<code>eyebrow</code>',  'string',        '—',    'Small label above the title'],
          ['<code>title</code>',    'string',        '—',    'Section heading'],
          ['<code>level</code>',    'number',        '2',    'Heading tag for the title (1–6). Visual style is unchanged.'],
          ['<code>subtitle</code>', 'string',        '—',    'Supporting text beneath the heading'],
          ['<code>align</code>',    'string',        "'left'",    "'left' · 'center'"],
        ]
      )}
    `,
  }),
}
