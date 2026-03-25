import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { progress, stack } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/progress')

export default {
  route: '/components/progress',
  meta: {
    title: 'Progress — Pulse Docs',
    description: 'Progress bar component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/progress',
    prev,
    next,
    name: 'progress',
    description: 'Horizontal progress bar with determinate and indeterminate states. Correct <code>role="progressbar"</code> and ARIA attributes are set automatically.',
    content: `

      <h2 class="doc-h2" id="default">Default</h2>
      ${demo(
        stack({ gap: 'md', content:
          progress({ value: 25  }) +
          progress({ value: 50  }) +
          progress({ value: 75  }) +
          progress({ value: 100 }),
        }),
        `progress({ value: 25  })
progress({ value: 50  })
progress({ value: 75  })
progress({ value: 100 })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="label">With label and value</h2>
      <p>Set <code>showLabel</code> and <code>showValue</code> to render text above the bar.</p>
      ${demo(
        stack({ gap: 'lg', content:
          progress({ value: 68, label: 'Storage used', showLabel: true, showValue: true }) +
          progress({ value: 32, label: 'Upload complete', showLabel: true, showValue: true }),
        }),
        `progress({ value: 68, label: 'Storage used',    showLabel: true, showValue: true })
progress({ value: 32, label: 'Upload complete', showLabel: true, showValue: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="variants">Variants</h2>
      ${demo(
        stack({ gap: 'md', content:
          progress({ value: 80, variant: 'accent'  }) +
          progress({ value: 80, variant: 'success' }) +
          progress({ value: 80, variant: 'warning' }) +
          progress({ value: 80, variant: 'error'   }),
        }),
        `progress({ value: 80, variant: 'accent'  })
progress({ value: 80, variant: 'success' })
progress({ value: 80, variant: 'warning' })
progress({ value: 80, variant: 'error'   })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${demo(
        stack({ gap: 'md', content:
          progress({ value: 60, size: 'sm' }) +
          progress({ value: 60, size: 'md' }) +
          progress({ value: 60, size: 'lg' }),
        }),
        `progress({ value: 60, size: 'sm' })
progress({ value: 60, size: 'md' })
progress({ value: 60, size: 'lg' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="indeterminate">Indeterminate</h2>
      <p>Omit <code>value</code> when the total duration is unknown — the bar animates continuously.</p>
      ${demo(
        progress({ label: 'Loading…' }),
        `progress({ label: 'Loading…' })   // no value = indeterminate`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>value</code>',      'number',  '—',          'Current value. Omit for indeterminate.'],
          ['<code>max</code>',        'number',  '100',        ''],
          ['<code>label</code>',      'string',  '—',          'Sets <code>aria-label</code> and the visible label when <code>showLabel</code> is true'],
          ['<code>showLabel</code>',  'boolean', 'false',      'Render label text above the bar'],
          ['<code>showValue</code>',  'boolean', 'false',      'Render percentage above the bar (right-aligned)'],
          ['<code>variant</code>',    '<code>accent | success | warning | error</code>', '<code>accent</code>', ''],
          ['<code>size</code>',       '<code>sm | md | lg</code>', '<code>md</code>', '.25rem / .5rem / 1rem'],
          ['<code>class</code>',      'string',  '—',          ''],
        ]
      )}
    `,
  }),
}
