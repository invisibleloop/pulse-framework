/**
 * Trusted Types helper — routes innerHTML assignments through a declared policy
 * in browsers that support the API (Chromium). Falls back to a plain string
 * everywhere else — behaviour is identical, the protection is simply absent.
 *
 * Policy name 'pulse' must match the trusted-types CSP directive on the server.
 */

let _policy = null

/**
 * Return a TrustedHTML object (Chromium) or the raw string (all other browsers).
 * @param {string} html
 * @returns {TrustedHTML|string}
 */
export function trustedHTML(html) {
  if (typeof window === 'undefined' || !window.trustedTypes) return html
  if (!_policy) _policy = window.trustedTypes.createPolicy('pulse', { createHTML: s => s })
  return _policy.createHTML(html)
}
