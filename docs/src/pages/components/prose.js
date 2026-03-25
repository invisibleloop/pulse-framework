import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { prose } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/prose')

const SAMPLE_HTML = `<h2>Why great coffee starts with water</h2>
<p>Most home baristas obsess over beans and grinders, but water quality is the single biggest variable in your cup. Tap water that is too hard leaves bitter, chalky espresso. Too soft and your shots taste flat and lifeless.</p>
<h3>The ideal mineral balance</h3>
<p>Speciality roasters recommend water with a total dissolved solids (TDS) between <strong>75–150 mg/L</strong> and a magnesium content of at least 10 mg/L. Magnesium is the mineral most responsible for extracting the fruity, floral notes from light roasts.</p>
<h3>What to do if your tap water is off</h3>
<ul>
  <li>Use a filter jug — Brita Maxtra+ reduces hardness and chlorine</li>
  <li>Try third-wave water sachets — add to distilled water for precise control</li>
  <li>Blend tap with still mineral water to hit the right TDS range</li>
</ul>
<blockquote>Water is the ingredient you can control most precisely, yet almost nobody does.</blockquote>
<p>Once your water is dialled in, even a modest grinder will produce noticeably better results. <a href="#">Read our water guide</a> for a full breakdown by region.</p>`

export default {
  route: '/components/prose',
  meta: {
    title: 'Prose — Pulse Docs',
    description: 'Typography wrapper for CMS output and rich text content in Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/prose',
    prev,
    next,
    name: 'prose',
    description: 'Typography wrapper for rich text you don\'t control: CMS output, markdown-rendered HTML, database content, blog posts. Styles all descendant elements — headings, paragraphs, lists, blockquotes, code, tables — using <code>--ui-*</code> tokens. No classes needed on individual elements.',
    content: `

      <h2 class="doc-h2" id="basic">Basic</h2>
      <p>Pass any HTML string to <code>content</code>. All elements inside are styled automatically.</p>
      ${demo(
        prose({ content: SAMPLE_HTML }),
        `import { prose } from '@invisibleloop/pulse/ui'

// CMS rich text field — output directly, fully styled
prose({ content: server.article.bodyHtml })

// Markdown rendered to HTML
prose({ content: renderMarkdown(server.post.body) })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="size">Size</h2>
      <p>Scale the base font size for different contexts.</p>
      ${demo(
        `<div class="u-flex u-flex-col u-gap-8">
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">sm — footnotes, sidebars</p>
            ${prose({ content: '<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Smaller text</li><li>Tighter line height</li></ul>', size: 'sm' })}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">base (default)</p>
            ${prose({ content: '<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Default size</li><li>Standard line height</li></ul>' })}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">lg — hero intro, feature descriptions</p>
            ${prose({ content: '<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Larger text</li><li>More generous spacing</li></ul>', size: 'lg' })}
          </div>
        </div>`,
        `prose({ content: cms.body, size: 'sm' })   // footnotes, sidebars
prose({ content: cms.body })               // default
prose({ content: cms.intro, size: 'lg' }) // hero intro`,
        { col: true }
      )}

      <h2 class="doc-h2" id="elements">Styled elements</h2>
      <p>Every common HTML element rendered inside <code>prose()</code> is styled using <code>--ui-*</code> tokens:</p>
      ${demo(
        prose({ content: `
          <h2>h2 heading</h2>
          <h3>h3 heading</h3>
          <p>A paragraph with <strong>bold</strong>, <em>italic</em>, and <a href="#">a link</a>. Also <code>inline code</code>.</p>
          <ul><li>Unordered item one</li><li>Unordered item two</li></ul>
          <ol><li>Ordered item one</li><li>Ordered item two</li></ol>
          <blockquote>A blockquote with an accent left border.</blockquote>
          <pre><code>// A code block
const x = 1 + 2</code></pre>
          <hr>
          <p class="u-text-sm u-text-muted">End of content.</p>
        ` }),
        `prose({ content: \`
  <h2>Section heading</h2>
  <p>Paragraph with <strong>bold</strong> and <a href="#">a link</a>.</p>
  <ul><li>List item</li></ul>
  <blockquote>A quote.</blockquote>
  <pre><code>const x = 1</code></pre>
\` })`,
        { col: true }
      )}

      ${callout('warning', '<strong>Do not escape the content prop.</strong> <code>prose()</code> renders raw HTML — it is designed for trusted server-side content only. Never pass unescaped user input directly. Sanitise CMS output before rendering if your CMS allows arbitrary HTML.')}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>content</code>', 'string', '—',                        'Raw HTML string — rendered as-is, not escaped. Use for server-side content only.'],
          ['<code>size</code>',    '<code>sm | base | lg</code>', '<code>base</code>', 'Base font size scale. <code>sm</code>=0.875rem, <code>base</code>=1rem, <code>lg</code>=1.125rem'],
          ['<code>class</code>',   'string', '—',                        'Extra classes on the wrapper <code>&lt;div&gt;</code>'],
        ]
      )}
    `,
  }),
}
