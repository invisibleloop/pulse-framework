/**
 * Trusted Types helper — routes innerHTML assignments through a declared policy
 * in browsers that support the API (Chromium). Falls back to a plain string
 * everywhere else — behaviour is identical, the protection is simply absent.
 *
 * Policy name 'pulse' must match the trusted-types CSP directive on the server.
 *
 * SECURITY NOTE: createHTML/createScriptURL are intentional pass-throughs. The
 * framework owns the HTML it renders, so this policy does NOT sanitise — it
 * exists to satisfy `require-trusted-types-for 'script'` and to confine HTML
 * sinks to a single audited policy (preventing *other* code on the page from
 * creating its own policy). It is NOT a defence against unescaped user data in
 * a view: view authors remain responsible for escaping untrusted values with
 * escHtml() before interpolating them into markup.
 */

let _policy = null

function getPolicy() {
  if (!_policy) {
    _policy = window.trustedTypes.createPolicy('pulse', {
      createHTML:      s => s,
      createScriptURL: s => s,
    })
  }
  return _policy
}

/**
 * Return a TrustedHTML object (Chromium) or the raw string (all other browsers).
 * @param {string} html
 * @returns {TrustedHTML|string}
 */
export function trustedHTML(html) {
  if (typeof window === 'undefined' || !window.trustedTypes) return html
  return getPolicy().createHTML(html)
}

/**
 * Return a TrustedScriptURL object (Chromium) or the raw string (all other browsers).
 * Used when setting the `src` attribute on <script> elements during DOM morphing.
 * @param {string} url
 * @returns {TrustedScriptURL|string}
 */
export function trustedScriptURL(url) {
  if (typeof window === 'undefined' || !window.trustedTypes) return url
  return getPolicy().createScriptURL(url)
}
