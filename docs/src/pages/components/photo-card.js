import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { photoCard } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/photo-card')

export default {
  route: '/components/photo-card',
  meta: {
    title: 'Photo Card — Pulse Docs',
    description: 'Polaroid-style photo card with optional tilt and caption for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/photo-card',
    prev,
    next,
    name: 'photoCard',
    description: 'Polaroid-style photo card with a border, white padding, optional caption, and CSS tilt. Ideal for "meet the team" sections, testimonial portraits, and lifestyle photography.',
    content: `
      <h2 class="doc-h2" id="basic">Basic photo card</h2>
      <p>A framed image with a white polaroid border.</p>
      ${demo(
        `<div style="display:flex;gap:2rem;align-items:center;justify-content:center;flex-wrap:wrap;padding:2rem">` +
        photoCard({ src: '/img/placeholder-square.svg', alt: 'Team member portrait', caption: 'Sarah, Designer' }) +
        `</div>`,
        `photoCard({
  src:     '/img/team/sarah.jpg',
  alt:     'Sarah, Designer',
  caption: 'Sarah, Designer',
})`
      )}

      <h2 class="doc-h2" id="tilt">With tilt</h2>
      <p>Pass a <code>tilt</code> value (degrees) to rotate the card. Negative values lean left, positive values lean right. Useful for giving sections a hand-placed, organic feeling.</p>
      ${demo(
        `<div style="display:flex;gap:2rem;align-items:center;justify-content:center;flex-wrap:wrap;padding:2rem">` +
        photoCard({ src: '/img/placeholder-square.svg', alt: 'Team photo',  caption: 'Andy, founder',    tilt: -2 }) +
        photoCard({ src: '/img/placeholder-tall.svg',   alt: 'Office dog',  caption: 'Biscuit, mascot',  tilt: 1.5 }) +
        photoCard({ src: '/img/placeholder-square.svg', alt: 'Team photo',  caption: 'Jen, engineering', tilt: -1 }) +
        `</div>`,
        `photoCard({ src, alt: 'Andy, founder',    caption: 'Andy, founder',    tilt: -2  })
photoCard({ src, alt: 'Office dog',   caption: 'Biscuit, mascot', tilt: 1.5 })
photoCard({ src, alt: 'Jen, engineering', caption: 'Jen, engineering', tilt: -1 })`
      )}

      <h2 class="doc-h2" id="ratios">Aspect ratios</h2>
      <p>Set <code>ratio</code> to control the crop. <code>'1/1'</code> for square portraits, <code>'4/3'</code> for landscape shots.</p>
      ${demo(
        `<div style="display:flex;gap:2rem;align-items:flex-start;justify-content:center;flex-wrap:wrap;padding:2rem">` +
        photoCard({ src: '/img/placeholder-square.svg',    alt: 'Square crop',    caption: "ratio: '1/1'",   ratio: '1/1',  tilt: 1 }) +
        photoCard({ src: '/img/placeholder-landscape.svg', alt: 'Landscape crop', caption: "ratio: '4/3'",   ratio: '4/3',  tilt: -1.5 }) +
        photoCard({ src: '/img/placeholder-tall.svg',      alt: 'Tall crop',      caption: "ratio: '3/4'",   ratio: '3/4',  tilt: 2 }) +
        `</div>`,
        `photoCard({ src, alt: 'Square portrait',    ratio: '1/1', tilt: 1 })
photoCard({ src, alt: 'Landscape photo',    ratio: '4/3', tilt: -1.5 })
photoCard({ src, alt: 'Tall portrait',      ratio: '3/4', tilt: 2 })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>src</code>',     'string',  '—',       'Image source URL'],
          ['<code>alt</code>',     'string',  '—',       'Alt text — required for accessibility'],
          ['<code>caption</code>', 'string',  '—',       'Caption text below the photo'],
          ['<code>tilt</code>',    'number',  '0',       'CSS rotate degrees — negative leans left, positive leans right. 0 = no tilt'],
          ['<code>ratio</code>',   'string',  "'4/3'",   'CSS aspect-ratio for the image crop'],
          ['<code>rounded</code>', 'boolean', 'false',   'Rounds the image corners inside the card frame'],
        ]
      )}
    `,
  }),
}
