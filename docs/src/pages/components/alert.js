import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { alert } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/alert')

export default {
  route: '/components/alert',
  meta: {
    title: 'Alert — Pulse Docs',
    description: 'Alert component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/alert',
    prev,
    next,
    name: 'alert',
    description: '<code>error</code> and <code>warning</code> use <code>role="alert"</code> — screen readers announce them immediately. <code>info</code> and <code>success</code> use <code>role="status"</code> for a polite announcement.',
    content: `
      ${demo(
        alert({ variant: 'info',    content: 'Your account is pending email verification.' }) +
        alert({ variant: 'success', title: 'Saved',   content: 'Your changes have been saved.' }) +
        alert({ variant: 'warning', title: 'Heads up', content: 'This action cannot be undone.' }) +
        alert({ variant: 'error',   title: 'Failed',   content: 'Something went wrong. Please try again.' }),
        `alert({ variant: 'info',    content: 'Your account is pending email verification.' })
alert({ variant: 'success', title: 'Saved',    content: 'Your changes have been saved.' })
alert({ variant: 'warning', title: 'Heads up', content: 'This action cannot be undone.' })
alert({ variant: 'error',   title: 'Failed',   content: escHtml(server.error) })`,
        { col: true }
      )}
    `,
  }),
}
