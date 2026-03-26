## meta.styles and meta.scripts

- meta.styles — array of CSS paths loaded as <link rel="stylesheet">. Always include '/app.css'.
- meta.scripts — array of JS paths loaded as <script defer>. Required for interactive UI components.

Interactive Pulse UI components (carousel, modal, accordion, tooltip) require BOTH:
```js
meta: {
  styles: ['/app.css', '/pulse-ui.css'],
  scripts: ['/pulse-ui.js'],
}
```
Non-interactive components (nav, hero, button, card, etc.) only need '/pulse-ui.css' in styles.

## Theming — always use CSS custom properties

pulse-ui.css exposes CSS custom properties for every token. app.css MUST use these tokens — never hardcode colour hex values.

Override tokens in :root inside app.css to retheme all components at once:
```css
:root {
  --bg:           #0d0d10;   /* page background */
  --surface:      #111116;   /* card / panel background */
  --surface-2:    #18181f;   /* inset / code background */
  --border:       #38383f;
  --text:         #e2e2ea;
  --muted:        #9090a0;
  --accent:       #9b8dff;
  --accent-hover: #b5aaff;
  --radius:       8px;
}
```

Then use the computed --ui-* tokens everywhere in app.css:
```css
/* pulse-ui.css already sets background-color and color on html/body — do not repeat them */
h1   { color: var(--ui-text); }
p    { color: var(--ui-muted); }
a    { color: var(--ui-accent); }
code { background: var(--ui-surface-2); color: var(--ui-accent); border: 1px solid var(--ui-border); }
```

**The library is dark by default.** `pulse-ui.css` applies `background-color: var(--ui-bg)` and `color: var(--ui-text)` to `html, body` automatically — you do NOT need to add these to app.css.

To apply a **light theme**, set `meta.theme: 'light'` in the spec — this adds `data-theme="light"` to the `<body>` and activates the built-in light token set (accessible contrast for badges, alerts, and all semantic colours). Do NOT manually copy token values into `:root`.

```js
meta: {
  theme: 'light',
  styles: ['/pulse-ui.css', '/app.css'],
}
```

Token list: --ui-bg, --ui-surface, --ui-surface-2, --ui-border, --ui-text, --ui-muted, --ui-accent, --ui-accent-hover, --ui-green, --ui-red, --ui-yellow, --ui-blue, --ui-radius, --ui-radius-sm, --ui-font, --ui-mono. Never hardcode hex values — override the tokens.

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

## CSS rules — where to put styles and when to use utilities

RULE: Never use inline style attributes (style="...") in HTML. Always use classes.

RULE: For spacing, typography, layout, and colour, always prefer pulse-ui utility classes first. Only add to app.css if you need something the utilities cannot provide (e.g. a unique component style, a keyframe animation, a custom grid).

pulse-ui.css includes a utility layer (u- prefix). **Only use classes from this exact list — do not invent variations. `u-container` does not exist; use the `container()` component instead.**

Spacing — exact available values only:
  Margin top:    u-mt-0  u-mt-1  u-mt-2  u-mt-3  u-mt-4  u-mt-5  u-mt-6  u-mt-8  u-mt-10  u-mt-12  u-mt-16
  Margin bottom: u-mb-0  u-mb-1  u-mb-2  u-mb-3  u-mb-4  u-mb-5  u-mb-6  u-mb-8  u-mb-10  u-mb-12  u-mb-16
  Margin x/auto: u-mx-auto  u-ml-auto  u-mr-auto
  Padding all:   u-p-0  u-p-1  u-p-2  u-p-3  u-p-4  u-p-5  u-p-6  u-p-8
  Padding x:     u-px-0  u-px-2  u-px-3  u-px-4  u-px-5  u-px-6  u-px-8
  Padding y:     u-py-0  u-py-2  u-py-3  u-py-4  u-py-5  u-py-6  u-py-8   ← max is u-py-8, not u-py-16

Typography:
  u-text-{xs,sm,base,lg,xl,2xl,3xl,4xl}
  u-font-{normal,medium,semibold,bold}   ← weight only; there is NO u-font-mono
  u-text-{left,center,right}
  u-text-{default,muted,accent,green,red,yellow,blue}
  u-leading-{tight,snug,normal,relaxed,loose}
  u-text-balance  u-break-all

Layout:
  u-flex  u-flex-col  u-flex-wrap  u-flex-1  u-shrink-0
  u-items-{start,center,end,stretch}
  u-justify-{start,center,end,between}
  u-gap-1  u-gap-2  u-gap-3  u-gap-4  u-gap-5  u-gap-6  u-gap-8
  u-w-full  u-w-auto
  u-max-w-{xs,sm,md,lg,xl,prose}
  u-block  u-inline  u-inline-block  u-hidden

Visual:
  u-rounded  u-rounded-md  u-rounded-lg  u-rounded-xl  u-rounded-full
  u-border  u-border-t  u-border-b
  u-bg-surface  u-bg-surface2  u-bg-accent
  u-overflow-hidden  u-overflow-auto
  u-relative  u-absolute  u-opacity-50  u-opacity-75

Example — a centred hero block using only utilities, no custom CSS:
```html
<div class="u-flex u-flex-col u-items-center u-text-center u-py-8 u-gap-4">
  <h1 class="u-text-4xl u-font-bold">Hello</h1>
  <p class="u-text-lg u-text-muted u-max-w-prose">Subtitle goes here.</p>
</div>
```

When you DO need to write CSS, add it to public/app.css — never inline.
