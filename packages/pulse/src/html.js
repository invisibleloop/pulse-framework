/**
 * Pulse — HTML escaping helper
 * Exported for use in view functions to safely embed user-supplied data.
 */

/**
 * Escape HTML special characters. Use this in view functions whenever
 * rendering untrusted user data into HTML attributes or text content.
 * 
 * Preserves HTML entities (&middot;, &nbsp;, &copy;, etc) so component
 * labels can use them without double-escaping.
 *
 * @param {unknown} str
 * @returns {string}
 */
export function escHtml(str) {
  return String(str)
    // Replace & only if not already part of an HTML entity
    // Matches &<word>; or &#<digits>; or &#x<hex>;
    .replace(/&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
