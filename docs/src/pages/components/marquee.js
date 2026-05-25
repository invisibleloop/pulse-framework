import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { marquee } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/marquee')

const LOGOS = [
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">ACME&nbsp;CORP</span>`,
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">NOVA&nbsp;INC</span>`,
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">STELLAR</span>`,
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">ORBIT&nbsp;CO</span>`,
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">HELIX</span>`,
  `<span style="font-weight:600;font-size:.875rem;opacity:.6;white-space:nowrap;letter-spacing:.5px">PRISM&nbsp;AI</span>`,
]

export default {
  route: '/components/marquee',
  meta: {
    title: 'Marquee — Pulse Docs',
    description: 'CSS-only infinite scrolling strip for logo clouds, trust badges, and tag lists in Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/marquee',
    prev,
    next,
    name: 'marquee',
    description: 'CSS-only infinite scrolling strip. No JavaScript — pure CSS animation. Use for logo clouds, press mentions, trust badges, or feature tags. <strong>The strip is hidden from screen readers</strong> (<code>aria-hidden="true"</code>) — it is decorative, not content.',
    content: `
      <h2 class="doc-h2" id="logos">Logo cloud</h2>
      <p>A common use-case: a strip of client or partner logos scrolling slowly from right to left.</p>
      ${demo(
        marquee({ items: LOGOS }),
        `marquee({
  items: ['<img src="/logos/acme.svg" alt="">',
          '<img src="/logos/nova.svg" alt="">',
          '<img src="/logos/helix.svg" alt="">'],
})`
      )}

      <h2 class="doc-h2" id="slow">Custom speed</h2>
      <p>The default <code>speed</code> is 30 seconds per loop. Slow it down for fewer items, or speed it up for a more energetic feel.</p>
      ${demo(
        marquee({ items: LOGOS, speed: 60 }),
        `marquee({ items, speed: 60 })  // slow`
      )}

      <h2 class="doc-h2" id="direction">Direction</h2>
      <p>Set <code>direction: 'right'</code> to scroll right-to-left instead.</p>
      ${demo(
        marquee({ items: LOGOS, direction: 'right' }),
        `marquee({ items, direction: 'right' })`
      )}

      <h2 class="doc-h2" id="no-fade">Without fade</h2>
      <p>Edge fading is on by default. Disable it with <code>fade: false</code>.</p>
      ${demo(
        marquee({ items: LOGOS, fade: false }),
        `marquee({ items, fade: false })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>items</code>',     'string[]',  '[]',         'Array of raw HTML strings — images, badges, or text'],
          ['<code>speed</code>',     'number',    '30',         'Duration (seconds) for one full loop. Lower = faster.'],
          ['<code>gap</code>',       'string',    "'lg'",       "'sm' · 'md' · 'lg'"],
          ['<code>direction</code>', 'string',    "'left'",     "'left' (right-to-left scroll) or 'right'"],
          ['<code>pause</code>',     'boolean',   'true',       'Pause animation on hover'],
          ['<code>fade</code>',      'boolean',   'true',       'Apply gradient mask to fade the left and right edges'],
        ]
      )}
    `,
  }),
}
