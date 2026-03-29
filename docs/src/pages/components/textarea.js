import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { textarea } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/textarea')

export default {
  route: '/components/textarea',
  meta: {
    title: 'Textarea — Pulse Docs',
    description: 'Textarea component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/textarea',
    prev,
    next,
    name: 'textarea',
    description: 'Multi-line text input with label, hint, and error support. Wired up identically to <code>input</code> — <code>for</code>/<code>id</code> and <code>aria-describedby</code> are derived from <code>name</code>.',
    content: `
      ${demo(
        textarea({ name: 'bio', label: 'Bio', placeholder: 'Tell us about yourself…', hint: 'Max 500 characters', rows: 3 }) +
        textarea({ name: 'note', label: 'Note', value: 'hello world', error: 'Note is too long', rows: 3 }),
        `textarea({ name: 'bio',  label: 'Bio',  placeholder: 'Tell us about yourself…', hint: 'Max 500 characters' })
textarea({ name: 'note', label: 'Note', value: state.note, error: server.errors.note, rows: 6 })`,
        { col: true }
      )}
    `,
  }),
}
