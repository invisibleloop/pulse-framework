import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { alert } from '../../../../packages/pulse/src/ui/index.js'

const { prev, next } = prevNext('/components/alert')

export default {
  route: '/components/alert',
  meta: {
    theme:       'light',
    title: 'Alert — Pulse Docs',
    description: 'Alert component for Pulse UI.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/alert',
    prev,
    next,
    name: 'alert',
    description: '<code>error</code> and <code>warning</code> use <code>role="alert"</code> — screen readers announce them immediately. <code>info</code> and <code>success</code> use <code>role="status"</code> for a polite announcement.',
    content: `
      ${demo(
        alert({ variant: 'info',    message: 'Your account is pending email verification.' }) +
        alert({ variant: 'success', title: 'Saved',   message: 'Your changes have been saved.' }) +
        alert({ variant: 'warning', title: 'Heads up', message: 'This action cannot be undone.' }) +
        alert({ variant: 'error',   title: 'Failed',   message: 'Something went wrong. Please try again.' }),
        `alert({ variant: 'info',    message: 'Your account is pending email verification.' })
alert({ variant: 'success', title: 'Saved',    message: 'Your changes have been saved.' })
alert({ variant: 'warning', title: 'Heads up', message: 'This action cannot be undone.' })
// message is plain text and is escaped for you: use it for anything from a user, a form or an error.
// items are lines under the message, escaped; give a line an href to make it a link.
alert({ variant: 'error',   title: 'Fix these', items: [{ text: 'Email is required', href: '#email' }, { text: 'Message is too long', href: '#message' }] })
// content is an HTML string you wrote and is not escaped.
alert({ variant: 'error',   title: 'Failed',   message: server.error })
alert({ variant: 'info',    content: '<a href="/help">Read the guide</a>' })`,
        { col: true }
      )}
    `,
  }),
}
