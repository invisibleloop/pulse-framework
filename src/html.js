/**
 * Pulse — HTML escaping helper
 * Exported for use in view functions to safely embed user-supplied data.
 */

/**
 * Escape HTML special characters. Use this in view functions whenever
 * rendering untrusted user data into HTML attributes or text content.
 *
 * @param {unknown} str
 * @returns {string}
 */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
