import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { heading, card } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/heading')

export default {
  route: '/components/heading',
  meta: {
    title: 'Heading — Pulse Docs',
    description: 'Styled semantic heading component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/heading',
    prev,
    next,
    name: 'heading',
    description: 'Styled semantic heading. Renders the correct HTML tag (<code>h1</code>–<code>h6</code>) with consistent typography tokens. Use this instead of raw heading tags so you get the right visual style without remembering utility classes.',
    content: `

      <h2 class="doc-h2" id="levels">All levels</h2>
      <p>Each level has a default visual size. The semantic tag and visual size are independent — see <a href="#size-override">size override</a> below.</p>
      ${demo(
        [1, 2, 3, 4, 5, 6].map(l => heading({ level: l, text: `Heading level ${l}` })).join(''),
        `heading({ level: 1, text: 'Page title' })
heading({ level: 2, text: 'Section title' })
heading({ level: 3, text: 'Subsection' })
heading({ level: 4, text: 'Card heading' })
heading({ level: 5, text: 'Label' })
heading({ level: 6, text: 'Caption' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="size-override">Size override</h2>
      <p>The <code>size</code> prop lets you use a different visual scale than the default for that level. Useful when you need the correct semantic structure for SEO or accessibility but want a different visual weight.</p>
      ${demo(
        [
          heading({ level: 2, text: 'Semantic h2, looks like h4', size: 'xl' }),
          heading({ level: 3, text: 'Semantic h3, extra large', size: '4xl' }),
        ].join(''),
        `// h2 for structure, but visually smaller
heading({ level: 2, text: 'Related articles', size: 'xl' })

// h3 that needs to be visually prominent
heading({ level: 3, text: 'Featured', size: '4xl' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="color">Color</h2>
      ${demo(
        [
          heading({ level: 3, text: 'Default colour' }),
          heading({ level: 3, text: 'Muted — for secondary labels', color: 'muted' }),
          heading({ level: 3, text: 'Accent — for highlights', color: 'accent' }),
        ].join(''),
        `heading({ level: 3, text: 'Default colour' })
heading({ level: 3, text: 'Muted — for secondary labels', color: 'muted' })
heading({ level: 3, text: 'Accent — for highlights', color: 'accent' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="spacing">Spacing</h2>
      <p><code>heading()</code> adds no margin. Use <code>u-mt-*</code> and <code>u-mb-*</code> utility classes to control spacing in context.</p>
      ${demo(
        card({ content: `
          ${heading({ level: 2, text: 'Account settings', class: 'u-mb-2' })}
          <p class="u-text-muted u-text-sm">Manage your profile and preferences.</p>
        `}),
        `card({ content: \`
  \${heading({ level: 2, text: 'Account settings', class: 'u-mb-2' })}
  <p class="u-text-muted u-text-sm">Manage your profile and preferences.</p>
\`})`,
        { col: true }
      )}

      <h2 class="doc-h2" id="balance">Preventing orphans</h2>
      <p>When a heading wraps across lines, the last line can be left with a single short word — an orphan. The <code>balance</code> prop adds <code>text-wrap: balance</code>, which distributes text evenly across all lines so no word is stranded.</p>
      ${demo(
        [
          heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight' }),
          heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight', balance: true }),
        ].join('<p class="u-text-muted u-text-sm u-mt-2 u-mb-4">↑ without balance — ↓ with balance: true</p>'),
        `// Without — last line may have a single word
heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight' })

// With — text distributed evenly across lines
heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight', balance: true })`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>level</code>',   'number (1–6)', '2',               'Controls both the HTML tag and the default visual size'],
          ['<code>text</code>',    'string',       '—',               'Heading text — escaped automatically'],
          ['<code>size</code>',    '<code>xs | sm | base | lg | xl | 2xl | 3xl | 4xl</code>', '—', 'Override the visual font size independently of the semantic level. Defaults: h1=4xl, h2=3xl, h3=2xl, h4=xl, h5=base, h6=sm'],
          ['<code>color</code>',   '<code>default | muted | accent</code>', '<code>default</code>', 'Text colour token'],
          ['<code>balance</code>', 'boolean', '<code>false</code>', 'Adds <code>text-wrap: balance</code> — prevents orphaned words on the last line when the heading wraps'],
          ['<code>class</code>',   'string', '—', 'Extra classes — use for spacing utilities such as <code>u-mb-4</code>'],
        ]
      )}
    `,
  }),
}
