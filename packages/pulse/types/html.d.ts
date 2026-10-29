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

/**
 * Make a URL safe for an `href` or `src`: returns it unchanged when it is relative or uses
 * http, https, mailto or tel, and '#' for any other scheme (`javascript:`, `data:` ...).
 * Pass `{ image: true }` to also allow `data:image/...` URLs. Does not escape: wrap the result in
 * escHtml() when it goes into an attribute (the UI components already do both).
 *
 * @example
 * `<a href="${escHtml(safeUrl(user.website))}">site</a>`
 */
export function safeUrl(url: unknown, opts?: { image?: boolean }): string
