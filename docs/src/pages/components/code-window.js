import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { codeWindow } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/code-window')

export default {
  route: '/components/code-window',
  meta: {
    title: 'Code Window — Pulse Docs',
    description: 'macOS-style window chrome around a code block. Accepts pre-highlighted HTML as the content slot.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/code-window',
    prev,
    next,
    name: 'codeWindow',
    description: 'macOS-style window chrome around a code block. Accepts pre-highlighted HTML as the content slot — the component handles all the chrome, layout, scrolling, and monospace typography.',
    content: `
      ${demo(
        codeWindow({
          filename: 'home.js',
          lang:     'JavaScript',
          content:  `<span style="color:var(--ui-accent)">export default</span> {
  <span style="color:var(--ui-text)">state</span>: { count: <span style="color:var(--ui-green)">0</span> },

  <span style="color:var(--ui-text)">view</span>: (state) =&gt; \`
    &lt;h1&gt;\${state.count}&lt;/h1&gt;
    &lt;button data-event=<span style="color:var(--ui-yellow)">"inc"</span>&gt;+&lt;/button&gt;
  \`,

  <span style="color:var(--ui-text)">mutations</span>: {
    inc: (state) =&gt; ({ count: state.count + <span style="color:var(--ui-green)">1</span> }),
  },
}`,
        }),
        `codeWindow({
  filename: 'home.js',
  lang:     'JavaScript',
  content:  highlightedHtml, // pre-rendered HTML with syntax token spans
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>content</code>',  'string (HTML)', '—', 'Raw HTML slot — pre-highlighted code HTML or plain text'],
          ['<code>filename</code>', 'string',        '—', "Filename shown in the chrome bar (e.g. 'home.js')"],
          ['<code>lang</code>',     'string',        '—', "Language label shown on the right of the chrome (e.g. 'JavaScript')"],
        ]
      )}
    `,
  }),
}
