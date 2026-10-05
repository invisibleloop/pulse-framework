/**
 * Pulse — HTML escaping types
 * @invisibleloop/pulse/html
 */

/**
 * Escape HTML special characters for safe embedding in HTML attributes or text.
 *
 * Always use this around values from user input, URL params, or external APIs.
 * Omitting it is an XSS vulnerability.
 *
 * @example
 * import { escHtml } from '@invisibleloop/pulse/html'
 *
 * view: (state) => `<p>Hello, ${escHtml(state.username)}</p>`
 */
export function escHtml(str: unknown): string
