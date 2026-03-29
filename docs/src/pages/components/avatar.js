import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { avatar } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/avatar')

export default {
  route: '/components/avatar',
  meta: {
    title: 'Avatar — Pulse Docs',
    description: 'Avatar component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/avatar',
    prev,
    next,
    name: 'avatar',
    description: 'When <code>src</code> is set, renders an <code>&lt;img&gt;</code> with <code>loading="lazy"</code>. Without <code>src</code>, shows initials derived from <code>alt</code>.',
    content: `
      ${demo(
        `<div style="display:flex;gap:1rem;align-items:center">` +
          avatar({ alt: 'Alice Smith', size: 'sm' }) +
          avatar({ alt: 'Bob Jones',   size: 'md' }) +
          avatar({ alt: 'Carol White', size: 'lg' }) +
          avatar({ alt: 'Dan Brown',   size: 'xl' }) +
        `</div>`,
        `avatar({ src: user.avatarUrl, alt: user.name, size: 'md' })
avatar({ alt: 'Alice Smith' })          // renders initials "AS"
avatar({ alt: 'Alice', initials: 'A' }) // explicit initials`
      )}
    `,
  }),
}
