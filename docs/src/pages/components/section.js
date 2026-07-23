import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { container, section as uiSection } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/section')

export default {
  route: '/components/section',
  meta: {
    theme:       'light',
    title: 'Section — Pulse Docs',
    description: 'Vertical padding wrapper with optional background. Compose with container() for full-width background with constrained content.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
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

      <h2 class="doc-h2" id="diagonal">Diagonal variant</h2>
      <p>The <code>diagonal</code> variant clips the bottom edge to a slanted angle, creating a layered stacking effect when multiple sections follow each other. The section after it should start with no top gap.</p>
      ${demo(
        uiSection({
          variant: 'diagonal',
          eyebrow: 'Diagonal',
          title: 'Slanted bottom edge.',
          align: 'center',
          content: container({ size: 'md', content: '<p style="text-align:center;color:var(--ui-muted)">Content here</p>' }),
        }),
        `section({ variant: 'diagonal', title: 'Slanted edge', align: 'center', content })`
      )}

      <h2 class="doc-h2" id="paper">Paper variant</h2>
      <p>The <code>paper</code> variant applies a subtle off-white background and slight inset box shadow — useful for content sections that need to feel warmer and tactile.</p>
      ${demo(
        uiSection({
          variant: 'paper',
          eyebrow: 'Paper',
          title: 'Warm and tactile.',
          align: 'center',
          content: container({ size: 'md', content: '<p style="text-align:center;color:var(--ui-muted)">Content here</p>' }),
        }),
        `section({ variant: 'paper', title: 'Warm and tactile', align: 'center', content })`
      )}

      <h2 class="doc-h2" id="spotlight">Spotlight variant</h2>
      <p>The <code>spotlight</code> variant adds a radial gradient light source at the top centre — gives the section a dramatic, focused feeling.</p>
      ${demo(
        uiSection({
          variant: 'spotlight',
          eyebrow: 'Spotlight',
          title: 'Dramatically focused.',
          align: 'center',
          content: container({ size: 'md', content: '<p style="text-align:center;color:var(--ui-muted)">Content here</p>' }),
        }),
        `section({ variant: 'spotlight', title: 'Dramatically focused', align: 'center', content })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>',  'string (HTML)', '—',         'Raw HTML slot'],
          ['<code>variant</code>',  'string',        "'default'", "'default' · 'alt' · 'dark' · 'diagonal' · 'paper' · 'spotlight'"],
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
