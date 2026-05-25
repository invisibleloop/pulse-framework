import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { gallery } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/gallery')

const PHOTOS = [
  { src: '/img/placeholder-landscape.svg', alt: 'Mountain landscape' },
  { src: '/img/placeholder-square.svg',    alt: 'Portrait photo' },
  { src: '/img/placeholder-tall.svg',      alt: 'Urban street' },
  { src: '/img/placeholder-landscape.svg', alt: 'Coastal path' },
  { src: '/img/placeholder-square.svg',    alt: 'Dog in the park' },
  { src: '/img/placeholder-tall.svg',      alt: 'City skyline' },
]

const CAPTIONED = [
  { src: '/img/placeholder-landscape.svg', alt: 'Mountain landscape', caption: 'Glen Coe, Scotland' },
  { src: '/img/placeholder-square.svg',    alt: 'Portrait',           caption: 'Lisbon, Portugal' },
  { src: '/img/placeholder-tall.svg',      alt: 'Urban',              caption: 'Tokyo, Japan' },
]

export default {
  route: '/components/gallery',
  meta: {
    title: 'Gallery — Pulse Docs',
    description: 'Responsive image gallery with grid, strip, and masonry layouts for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/gallery',
    prev,
    next,
    name: 'gallery',
    description: 'Responsive image gallery. Three layout modes: <code>grid</code> (equal aspect-ratio cells), <code>strip</code> (single horizontally scrollable row), and <code>masonry</code> (Pinterest-style varying heights). All images are lazy-loaded.',
    content: `
      <h2 class="doc-h2" id="grid">Grid layout</h2>
      <p>Equal-sized cells with a consistent aspect ratio. Good for portfolios and photo libraries.</p>
      ${demo(
        gallery({ images: PHOTOS, layout: 'grid', cols: 3, ratio: '4/3' }),
        `gallery({
  images: photos.map(p => ({ src: p.url, alt: p.alt })),
  layout: 'grid',
  cols:   3,
  ratio:  '4/3',
})`
      )}

      <h2 class="doc-h2" id="strip">Strip layout</h2>
      <p>A single horizontally scrollable row — ideal for a quick photo preview or a scrolling carousel of product shots.</p>
      ${demo(
        gallery({ images: PHOTOS, layout: 'strip', ratio: '4/3' }),
        `gallery({
  images: photos.map(p => ({ src: p.url, alt: p.alt })),
  layout: 'strip',
  ratio:  '4/3',
})`
      )}

      <h2 class="doc-h2" id="masonry">Masonry layout</h2>
      <p>Varying heights — images render at their natural ratio. Best for editorial photography where portrait and landscape images are mixed.</p>
      ${demo(
        gallery({ images: PHOTOS, layout: 'masonry', cols: 3 }),
        `gallery({
  images: photos.map(p => ({ src: p.url, alt: p.alt })),
  layout: 'masonry',
  cols:   3,
})`
      )}

      <h2 class="doc-h2" id="captions">Captions</h2>
      <p>Add a <code>caption</code> to any image in the array — rendered as a <code>&lt;figcaption&gt;</code>.</p>
      ${demo(
        gallery({ images: CAPTIONED, layout: 'grid', cols: 3, ratio: '4/3' }),
        `gallery({
  images: [
    { src: '/img/landscape.jpg', alt: 'Mountain', caption: 'Glen Coe, Scotland' },
    { src: '/img/portrait.jpg',  alt: 'Street',   caption: 'Lisbon, Portugal' },
  ],
  layout: 'grid',
  cols:   3,
  ratio:  '4/3',
})`
      )}

      <h2 class="doc-h2" id="linked">Linked images</h2>
      <p>Add an <code>href</code> to any image to wrap it in a link.</p>

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>images</code>',  'object[]',      '[]',       'Array of image objects: <code>{ src, alt, caption?, href? }</code>'],
          ['<code>layout</code>',  'string',        "'grid'",   "'grid' · 'strip' · 'masonry'"],
          ['<code>cols</code>',    'number',        '3',        'Columns in grid/masonry (1–4)'],
          ['<code>ratio</code>',   'string',        "'4/3'",    "CSS aspect-ratio for grid/strip cells — e.g. <code>'16/9'</code>, <code>'1/1'</code>. Ignored in masonry."],
          ['<code>gap</code>',     'string',        "'md'",     "'sm' · 'md' · 'lg'"],
          ['<code>rounded</code>', 'boolean',       'false',    'Adds border-radius to each image'],
        ]
      )}
    `,
  }),
}
