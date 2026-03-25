import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { spinner, button, cluster } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/spinner')

export default {
  route: '/components/spinner',
  meta: {
    title: 'Spinner — Pulse Docs',
    description: 'Loading spinner component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/spinner',
    prev,
    next,
    name: 'spinner',
    description: 'CSS-animated loading ring. No JavaScript required. Use to indicate background activity — inside buttons, next to labels, or as a full-area overlay.',
    content: `

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${demo(
        cluster({ gap: 'lg', align: 'center', content:
          spinner({ size: 'sm' }) +
          spinner({ size: 'md' }) +
          spinner({ size: 'lg' }),
        }),
        `spinner({ size: 'sm' })
spinner({ size: 'md' })
spinner({ size: 'lg' })`
      )}

      <h2 class="doc-h2" id="colors">Colours</h2>
      ${demo(
        cluster({ gap: 'lg', align: 'center', content:
          spinner({ color: 'accent' }) +
          spinner({ color: 'muted'  }) +
          `<span style="background:var(--ui-accent);padding:.75rem;border-radius:var(--ui-radius);display:inline-flex">` +
            spinner({ color: 'white' }) +
          `</span>`,
        }),
        `spinner({ color: 'accent' })
spinner({ color: 'muted'  })
spinner({ color: 'white'  })`
      )}

      <h2 class="doc-h2" id="in-button">Inside a button</h2>
      <p>Pair with a <code>button()</code> to show loading state. Pass the spinner as the button's <code>icon</code> prop.</p>
      ${demo(
        button({ label: 'Saving', icon: spinner({ size: 'sm', color: 'white' }), disabled: true }) + ' ' +
        button({ label: 'Loading', icon: spinner({ size: 'sm' }), variant: 'secondary', disabled: true }),
        `button({
  label:    'Saving',
  icon:     spinner({ size: 'sm', color: 'white' }),
  disabled: state.loading,
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>size</code>',  '<code>sm | md | lg</code>',           '<code>md</code>',     '1rem / 1.5rem / 2.5rem'],
          ['<code>color</code>', '<code>accent | muted | white</code>', '<code>accent</code>', ''],
          ['<code>label</code>', 'string', '<code>Loading…</code>', 'Sets <code>aria-label</code> on the <code>role="status"</code> element'],
          ['<code>class</code>', 'string', '—', ''],
        ]
      )}
    `,
  }),
}
