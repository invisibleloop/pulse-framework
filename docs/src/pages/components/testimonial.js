import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { testimonial } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/testimonial')

export default {
  route: '/components/testimonial',
  meta: {
    title: 'Testimonial — Pulse Docs',
    description: 'Testimonial component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/testimonial',
    prev,
    next,
    name: 'testimonial',
    description: 'Customer quote card with star rating, avatar, and attribution. When <code>src</code> is omitted the avatar shows initials derived from <code>name</code>.',
    content: `
      ${demo(
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">` +
          testimonial({ quote: 'This is the fastest app I have ever used. It replaced three tools I was paying for.', name: 'Alice Marsh', role: 'Head of Product, Stride', rating: 5 }) +
          testimonial({ quote: 'Switched from the competition six months ago and have not looked back once.', name: 'Ben Carter', role: 'Founder, Loopback', rating: 5 }) +
        `</div>`,
        `testimonial({
  quote:  'This is the fastest app I have ever used.',
  name:   'Alice Marsh',
  role:   'Head of Product, Stride',
  rating: 5,
  src:    user.avatarUrl,  // optional — falls back to initials
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', ''],
        [
          ['<code>quote</code>',  'string', '—', ''],
          ['<code>name</code>',   'string', '—', 'Author name — also used for avatar initials'],
          ['<code>role</code>',   'string', '—', ''],
          ['<code>src</code>',    'string', '—', 'Avatar image URL; omit to show initials'],
          ['<code>rating</code>', 'number', '0', '1–5 stars; omit or set 0 to hide'],
        ]
      )}
    `,
  }),
}
