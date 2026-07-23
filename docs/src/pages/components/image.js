import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { uiImage } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/image')

export default {
  route: '/components/image',
  meta: {
    theme:       'light',
    title: 'Image — Pulse Docs',
    description: 'Responsive image component with optional aspect-ratio crop and caption for Pulse UI.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/image',
    prev,
    next,
    name: 'uiImage',
    description: 'Responsive image component. Supports aspect-ratio cropping with <code>object-fit: cover</code>, optional caption, and rounded corners. Always uses <code>loading="lazy"</code> and <code>decoding="async"</code>.',
    content: `

      <h2 class="doc-h2" id="ratio">With aspect ratio</h2>
      <p>Set <code>ratio</code> to constrain the image to a fixed aspect ratio. The image fills the crop area with <code>object-fit: cover</code>.</p>
      ${demo(
        uiImage({ src: '/img/heic1501a.jpg', alt: 'The Pillars of Creation in the Eagle Nebula, captured by the Hubble Space Telescope', ratio: '16/9' }),
        `uiImage({ src: '/img/nebula.jpg', alt: 'The Pillars of Creation in the Eagle Nebula', ratio: '16/9' })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="rounded">Square and rounded</h2>
      ${demo(
        `<div style="max-width:200px;margin:0 auto">${uiImage({ src: '/img/heic1501a.jpg', alt: 'The Pillars of Creation in the Eagle Nebula, captured by the Hubble Space Telescope', ratio: '1/1', rounded: true })}</div>`,
        `uiImage({ src: '/img/nebula.jpg', alt: 'The Pillars of Creation in the Eagle Nebula', ratio: '1/1', rounded: true })`,
        { col: true }
      )}

      <h2 class="doc-h2" id="caption">With caption</h2>
      ${demo(
        uiImage({
          src:     '/img/heic1501a.jpg',
          alt:     'The Pillars of Creation in the Eagle Nebula, captured by the Hubble Space Telescope',
          ratio:   '4/3',
          caption: 'The Pillars of Creation, Eagle Nebula. Photo: NASA, ESA, Hubble Heritage Team.',
        }),
        `uiImage({
  src:     '/img/nebula.jpg',
  alt:     'The Pillars of Creation in the Eagle Nebula',
  ratio:   '4/3',
  caption: 'The Pillars of Creation, Eagle Nebula. Photo: NASA, ESA, Hubble Heritage Team.',
})`,
        { col: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>src</code>',      'string',  '—',     'Image source URL'],
          ['<code>alt</code>',      'string',  '—',     'Alt text — required for accessibility'],
          ['<code>caption</code>',  'string',  '—',     'Renders a <code>&lt;figcaption&gt;</code> below the image'],
          ['<code>ratio</code>',    'string',  '—',     'CSS aspect-ratio string e.g. <code>\'16/9\'</code>, <code>\'4/3\'</code>, <code>\'1/1\'</code>. When set, the image fills the crop area with <code>object-fit: cover</code>.'],
          ['<code>rounded</code>',  'boolean', 'false', 'Applies full border-radius to the image wrap'],
          ['<code>width</code>',    'number',  '—',     'Sets the <code>width</code> attribute on the <code>&lt;img&gt;</code>'],
          ['<code>height</code>',   'number',  '—',     'Sets the <code>height</code> attribute on the <code>&lt;img&gt;</code>'],
          ['<code>class</code>',    'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
