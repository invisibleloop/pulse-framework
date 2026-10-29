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

/**
 * Make a URL safe to put in an `href` or `src`. Returns the URL unchanged when it is relative
 * (a path, `?query`, `#fragment`) or uses http, https, mailto or tel; returns '#' for any other
 * scheme (`javascript:`, `vbscript:`, `data:` ...). Browsers ignore control characters and
 * whitespace inside a scheme (`java\tscript:`), so those are skipped when looking for one.
 *
 * Does not escape: wrap the result in escHtml() when it goes into an attribute. The UI components
 * (button, nav, footer, avatar, image ...) already do both.
 *
 * With `{ image: true }`, `data:image/png|jpeg|gif|webp|avif|svg+xml;` URLs are also allowed.
 *
 * @param {unknown} url
 * @param {{ image?: boolean }} [opts]
 * @returns {string}
 */
export function safeUrl(url, { image = false } = {}) {
  const text     = String(url ?? '')
  const stripped = text.replace(/[\x00-\x20]+/g, '')
  const scheme   = stripped.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/)
  if (!scheme) return text
  const proto = scheme[1].toLowerCase()
  if (proto === 'http' || proto === 'https' || proto === 'mailto' || proto === 'tel') return text
  if (image && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(stripped)) return text
  return '#'
}
