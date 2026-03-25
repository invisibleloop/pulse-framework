import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { carousel } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/carousel')

function slide(bg, label) {
  return `<div style="height:220px;display:flex;align-items:center;justify-content:center;background:${bg};border-radius:10px;font-size:1.1rem;font-weight:700;color:var(--ui-text)">${label}</div>`
}

export default {
  route: '/components/carousel',
  meta: {
    title: 'Carousel — Pulse Docs',
    description: 'Carousel / slider component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/carousel',
    prev,
    next,
    name: 'carousel',
    description: 'CSS scroll-snap carousel with optional prev/next arrows and dot navigation. Touch / swipe friendly out of the box. Requires <code>pulse-ui.js</code> for button and dot interactivity.',
    content: `
      ${demo(
        carousel({
          slides: [
            slide('var(--ui-surface-2)', 'Slide 1'),
            slide('var(--ui-surface)',   'Slide 2'),
            slide('var(--ui-surface-2)', 'Slide 3'),
          ],
        }),
        `carousel({
  slides: [
    \`<div class="slide">Slide 1</div>\`,
    \`<div class="slide">Slide 2</div>\`,
    \`<div class="slide">Slide 3</div>\`,
  ],
})`
      )}

      <h3 class="doc-h3" id="arrows-dots"><a href="#arrows-dots" class="heading-anchor">Arrows and dots</a></h3>
      ${demo(
        carousel({
          arrows: true,
          dots:   false,
          slides: [
            slide('var(--ui-surface-2)', 'Arrows only — Slide 1'),
            slide('var(--ui-surface)',   'Arrows only — Slide 2'),
          ],
        }),
        `carousel({
  slides: [ /* ... */ ],
  arrows: true,
  dots:   false,   // hide dot navigation
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>slides</code>', 'string[] (HTML)',  '[]',             'Array of raw HTML strings — one per slide'],
          ['<code>arrows</code>', 'boolean',           '<code>true</code>',  'Show prev/next arrow buttons'],
          ['<code>dots</code>',   'boolean',           '<code>true</code>',  'Show dot navigation (hidden when only one slide)'],
          ['<code>class</code>',  'string',            '—',              ''],
        ]
      )}
    `,
  }),
}
