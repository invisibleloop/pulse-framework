import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { pullquote } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/pullquote')

export default {
  route: '/components/pullquote',
  meta: {
    title: 'Pullquote — Pulse Docs',
    description: 'Styled blockquote component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/pullquote',
    prev,
    next,
    name: 'pullquote',
    description: 'Styled blockquote with an accent left border and optional attribution. Use it to highlight key quotes or testimonials within body content.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${demo(
        pullquote({
          quote: 'Design is not just what it looks like and feels like. Design is how it works.',
          cite:  'Steve Jobs, co-founder of Apple',
        }),
        `pullquote({
  quote: 'Design is not just what it looks like and feels like. Design is how it works.',
  cite:  'Steve Jobs, co-founder of Apple',
})`
      )}

      <h2 class="doc-h2" id="large">Large</h2>
      ${demo(
        pullquote({
          quote: 'Simplicity is the ultimate sophistication.',
          cite:  'Leonardo da Vinci',
          size:  'lg',
        }),
        `pullquote({
  quote: 'Simplicity is the ultimate sophistication.',
  cite:  'Leonardo da Vinci',
  size:  'lg',
})`
      )}

      <h2 class="doc-h2" id="no-cite">Without attribution</h2>
      ${demo(
        pullquote({
          quote: 'Good design makes a product understandable.',
        }),
        `pullquote({
  quote: 'Good design makes a product understandable.',
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>quote</code>', 'string',            '—',           'The quote text — escaped automatically'],
          ['<code>cite</code>',  'string',            '—',           'Attribution text — rendered in a <code>&lt;figcaption&gt;</code>'],
          ['<code>size</code>',  '<code>md | lg</code>', '<code>md</code>', 'Controls the font size of the quote text'],
          ['<code>class</code>', 'string',            '—',           ''],
        ]
      )}
    `,
  }),
}
