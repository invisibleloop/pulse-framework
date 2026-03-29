import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { accordion } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/accordion')

export default {
  route: '/components/accordion',
  meta: {
    title: 'Accordion — Pulse Docs',
    description: 'Accordion component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/accordion',
    prev,
    next,
    name: 'accordion',
    description: 'Collapsible FAQ items built on native <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> — no JavaScript required. The open/close animation is handled entirely by the browser.',
    content: `
      ${demo(
        accordion({
          items: [
            { question: 'Is there a free plan?', answer: 'Yes — the free plan includes up to 3 pages and community support, with no credit card required.' },
            { question: 'Can I cancel anytime?', answer: 'Absolutely. There are no contracts or lock-in periods. Cancel from your account settings at any time.' },
            { question: 'Does it work on older devices?', answer: 'The app supports iOS 14+ and Android 8+, covering over 97% of active devices.' },
          ],
        }),
        `accordion({
  items: [
    { question: 'Is there a free plan?',     answer: 'Yes — up to 3 pages, no card required.' },
    { question: 'Can I cancel anytime?',     answer: 'No contracts. Cancel from your account.' },
    { question: 'Works on older devices?',   answer: 'iOS 14+ and Android 8+.' },
  ],
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>items</code>', 'array', '[]', '<code>{ question: string, answer: string }[]</code>'],
        ]
      )}
    `,
  }),
}
