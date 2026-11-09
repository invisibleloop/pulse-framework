## Custom fonts

All components use `--ui-font` (body) and `--ui-mono` (code). These resolve from `--font` and `--mono` respectively, so overriding those two variables in `:root` is all that is ever needed — no other CSS changes required.

**To display monospace/code text, use a `<code>` element — not a utility class.** There is no `u-font-mono` class. `<code>` automatically inherits `--ui-mono` and gets the correct background and colour from pulse-ui.css.

**Two rules that must never be broken:**
- **Never `@import url(...)` a font in CSS** — use `meta.styles` instead. CSS `@import` is render-blocking; a `<link>` tag is not.
- **Never set `font-family` directly on `body` or any element** — this bypasses `--ui-font` and breaks component inheritance. Always set `--font` in `:root`.

```css
/* app.css */
:root {
  --font: 'Inter', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
```

### Google Fonts

**Google Fonts requires CSP configuration** — the default CSP blocks external font and stylesheet sources. You must pass `csp` to `createServer`, otherwise the font will be blocked and the page will fail Lighthouse Best Practices:

```js
// server.js
createServer(specs, {
  port: 3000,
  csp: {
    'style-src':  ['https://fonts.googleapis.com'],
    'font-src':   ['https://fonts.gstatic.com'],
  },
})
```

Then add the URL **before** `pulse-ui.css` in `meta.styles`. Use `family=Name:wght@weights` and always include `&display=swap`.

```js
meta: {
  styles: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    '/pulse-ui.css',
    '/app.css',
  ],
}
```

Then in app.css:
```css
:root { --font: 'Inter', system-ui, sans-serif; }
```

If you cannot modify `createServer` (e.g. the project uses auto-discovery), use a self-hosted font in `public/fonts/` with `@font-face` in `app.css` — no CSP changes needed.

### Subresource Integrity (SRI) for third-party scripts and styles

A script or stylesheet loaded from another origin can be pinned to a hash, so the browser refuses a copy that was changed on the CDN. List the hash in `meta.integrity`, keyed by the same URL you put in `meta.scripts` / `meta.styles`; Pulse adds `integrity` and `crossorigin="anonymous"` to the tag (on first load and on client navigation):

```js
meta: {
  scripts:   ['https://cdn.example.com/lib@1.2.3/lib.min.js'],
  integrity: { 'https://cdn.example.com/lib@1.2.3/lib.min.js': 'sha384-…' },
}
// hash: curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A   (prefix with sha384-)
```

- Pin a **versioned** URL: a hash of a file that changes under the same URL breaks the page. Loaders that change by design (ad networks, analytics tags, Google Fonts CSS) cannot use SRI.
- The server must send `Access-Control-Allow-Origin` for the file, and `csp['script-src']` must allow the origin (see below).
- `pulse_validate` warns about a cross-origin entry in `meta.scripts` with no hash, and errors on a malformed one.
- Pulse's own bundles are same-origin and content-hashed, so they need none.

### Third-party scripts (ad networks, analytics SDKs)

**Every `csp` key merges the same way — including `trusted-types` and `require-trusted-types-for`.** This is a real, tested behavior, not a guess: `csp` passed to `createServer` (or `pulse.config.js`) is spread onto the framework's base CSP directive-by-directive, so `csp: { 'trusted-types': ['google'] }` produces `trusted-types pulse google` in the response header — it does not replace or drop the framework's own `pulse` policy.

A third-party script (Google AdSense, GTM, and similar SDKs) typically needs up to three separate CSP extensions — do not assume only one is needed:

```js
// pulse.config.js
export default {
  csp: {
    // The loader <script src="..."> itself — origin allowlist, no nonce needed
    'script-src':    ['https://pagead2.googlesyndication.com'],
    // If the SDK creates its own Trusted Types policy (some ad SDKs do) —
    // scoped to exactly the policy name it registers, not a broad relaxation
    'trusted-types': ['google'],
  },
}
```

For the **inline** per-slot script the SDK's own docs tell you to paste in (e.g. `(adsbygoogle = window.adsbygoogle || []).push({})`), use `server.nonce` — see "Third-party inline scripts" in `pulse://guide/ops`. `csp.script-src` origin allowlisting only covers `<script src="...">`, not inline `<script>` content.

**Without the `trusted-types` extension, this is a hard failure, not a cosmetic one:** a script that calls `trustedTypes.createPolicy(...)` under a name other than `pulse` throws in the browser console, the SDK fails to initialize, AND `lighthouse_audit` fails Best Practices on the resulting console error/CSP violation — confirmed directly (an agent hit exactly this running a real audit against AdSense). This is not a "check the console if something seems off" edge case; if you're integrating a third-party SDK and Lighthouse Best Practices won't reach 100, check the browser console for a Trusted Types policy rejection before assuming the problem is elsewhere.

For multiple weights or italic variants, separate them with a semicolon in the URL:
```
?family=Inter:ital,wght@0,400;0,700;1,400&display=swap
```

### Adobe Fonts (Typekit)

Adobe Fonts provides a per-project CSS URL from your kit settings. Add it before `pulse-ui.css` in `meta.styles` — the font-family name comes from your Adobe Fonts kit.

```js
meta: {
  styles: [
    'https://use.typekit.net/YOURPROJECTID.css',
    '/pulse-ui.css',
    '/app.css',
  ],
}
```

Then in app.css, use the exact font name shown in your Adobe Fonts kit:
```css
:root { --font: 'proxima-nova', system-ui, sans-serif; }
```

### Self-hosted fonts

Place font files in `public/fonts/` and declare them with `@font-face` in `app.css`. Always use `woff2` format and `font-display: swap`.

```css
/* app.css */
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root { --font: 'MyFont', system-ui, sans-serif; }
```

### Multi-brand fonts

For multi-brand sites, keep `@font-face` declarations (or the font service URL) in the per-brand theme file and override `--font` there:

```css
/* themes/acme.css */
:root { --font: 'proxima-nova', system-ui, sans-serif; }
```
