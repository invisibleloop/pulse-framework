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

### How theming works — two-layer token system

Pulse uses a **two-layer token system**:

1. **Input tokens** (unprefixed: `--bg`, `--text`, `--accent`, etc.) — you define these in `:root` or `[data-theme="light"]` to set your palette
2. **Output tokens** (prefixed: `--ui-bg`, `--ui-text`, `--ui-accent`, etc.) — pulse-ui components read these; you reference them in app.css

pulse-ui.css sets `--ui-*` tokens to `var(--your-input-token, fallback)`. When you override `--accent`, components automatically pick it up via `--ui-accent`.

**Which token names to use where:**

| File | Define input tokens | Reference output tokens |
|---|---|---|
| `public/theme.css` | ✓ `--accent: #e25;` | — |
| `app.css` | — | ✓ `color: var(--ui-accent);` |
| Pulse components | — | ✓ (already done internally) |

**Common mistake:** defining `--color-accent` or `--brand-primary` expecting components to use them. Components only read the canonical unprefixed names: `--accent`, `--text`, `--bg`, `--surface`, `--border`, `--muted`, `--radius`. Define those, and everything updates.

### Dark by default

**The library is dark by default.** `pulse-ui.css` applies `background-color: var(--ui-bg)` and `color: var(--ui-text)` to `html, body` automatically using the dark palette defined in `:root` — you do NOT need to add these to app.css.

For a **light theme**, set `meta.theme: 'light'` in the spec — this adds `data-theme="light"` to the `<body>` and activates the built-in light token set (accessible contrast for badges, alerts, and all semantic colours).

### Overriding tokens in your theme

Override input tokens in `:root` inside theme.css to retheme all components at once:
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

**Overriding tokens on a light-theme page:** `pulse-ui.css` defines light theme values under `[data-theme="light"]`, which has higher specificity than `:root`. Overrides written only to `:root` will be silently beaten. Always target `[data-theme="light"]` when overriding tokens for a light-theme page:

```css
/* WRONG — loses to pulse-ui.css */
:root { --ui-accent: #e25; }

/* CORRECT */
[data-theme="light"] { --ui-accent: #e25; }
```

```js
meta: {
  theme: 'light',
  styles: ['/pulse-ui.css', '/app.css'],
}
```

**Colour tokens:** `--ui-bg`, `--ui-surface`, `--ui-surface-2`, `--ui-border`, `--ui-text`, `--ui-muted`, `--ui-accent`, `--ui-accent-hover`, `--ui-accent-dim`, `--ui-accent-text`, `--ui-green`, `--ui-red`, `--ui-yellow`, `--ui-blue`, `--ui-radius`, `--ui-radius-sm`, `--ui-font`, `--ui-font-display`, `--ui-mono`. Never hardcode hex values — override the tokens.

**Display font token:** `--ui-font-display` is used for hero titles and section headings. By default it inherits `--ui-font`. Override it separately to get a display/heading face that differs from body text:
```css
/* app.css */
:root { --font-display: 'Playfair Display', Georgia, serif; }
```

**Letter-spacing token:** `--ui-letter-spacing-display` (default `-0.025em`) controls heading tightness. Override in `:root` to match your typeface:
```css
:root { --letter-spacing-display: -0.04em; }  /* tighter for heavy condensed fonts */
```

## Visual personality — meta.vibe

`meta.vibe` sets `data-vibe` on `<body>` and adjusts geometry + type tokens as a preset. It doesn't touch colour — pair it with a `theme.css` for full personality.

```js
meta: {
  vibe:   'warm',   // warm | editorial | playful | minimal | bold
  theme:  'light',
  styles: ['/pulse-ui.css', '/theme.css', '/app.css'],
}
```

| Vibe | Effect | Pairs well with |
|---|---|---|
| `warm` | radius 14px, softer letter-spacing | rounded photo cards, `section: paper`, warm palette |
| `editorial` | radius 0, serif display font, tight letter-spacing | `hero layout: overlap`, `section: diagonal`, `pullquote` |
| `playful` | radius 22px, neutral letter-spacing | `gallery` with rounded images, `marquee`, bright accent |
| `minimal` | radius 2px, open letter-spacing, no shadows | left-aligned hero, `section: spotlight`, monochrome |
| `bold` | radius 6px, very tight letter-spacing | `section: dark`, large `stat` components, gradient hero |

Vibes affect `--ui-radius`, `--ui-font-display`, and `--ui-letter-spacing-display`. All component shapes, borders, and heading appearance change automatically.

**Custom override:** Set vibe first, then fine-tune with CSS variable overrides in `public/theme.css`:
```css
/* Fine-tune the warm vibe */
[data-vibe="warm"] { --ui-radius: 18px; }
```

**Spacing tokens** (`--ui-space-N`): `--ui-space-1` (4px), `--ui-space-2` (8px), `--ui-space-3` (12px), `--ui-space-4` (16px), `--ui-space-5` (20px), `--ui-space-6` (24px), `--ui-space-8` (32px), `--ui-space-10` (40px), `--ui-space-12` (48px), `--ui-space-16` (64px), `--ui-space-20` (80px), `--ui-space-24` (96px). Use these for `padding`, `margin`, and `gap`.

**Type-scale tokens** (`--ui-text-*`): `--ui-text-xs` (12px), `--ui-text-sm` (14px), `--ui-text-base` (16px), `--ui-text-lg` (18px), `--ui-text-xl` (20px), `--ui-text-2xl` (24px), `--ui-text-3xl` (30px), `--ui-text-4xl` (36px). Use these for `font-size`.

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

### External images (img-src)

The default CSP does **not** restrict `img-src` — it inherits `default-src 'self'`, which means images served from the same origin load fine. But if you load images from an external host (e.g. `https://images.unsplash.com`, `https://picsum.photos`, a CDN), you must add the host to `img-src`.

**Do this at build time, before writing any image tags.** If you know you'll use external images, add the CSP entry to `pulse.config.js` first — discovering the block at Lighthouse time costs an extra round-trip.

```js
// pulse.config.js
export default {
  csp: {
    'img-src': ['https://picsum.photos', 'https://fastly.picsum.photos'],
  },
}
```

Or via `createServer`:

```js
createServer(specs, {
  csp: {
    'img-src': ['https://images.unsplash.com', 'https://picsum.photos'],
  },
})
```

**Common hosts to add:**
| Source | `img-src` entry |
|---|---|
| picsum.photos | `https://picsum.photos https://fastly.picsum.photos` |
| Unsplash | `https://images.unsplash.com` |
| Cloudinary | `https://res.cloudinary.com` |
| Imgix | your subdomain, e.g. `https://mysite.imgix.net` |

> **picsum CDN note:** `picsum.photos` redirects image requests through `fastly.picsum.photos`. You must whitelist **both** domains — whitelisting only `https://picsum.photos` will still block the actual image bytes and the browser error will point to the `fastly.picsum.photos` URL, which is confusing to debug.

Without this, external images will be blocked in production and Lighthouse will flag a Best Practices failure. Use the same pattern for other external resource types (`media-src` for video, `connect-src` for fetch/XHR to external APIs).

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

### The hex colour rule — know this upfront

There are three places you write colour values. The rules are different for each:

| Where | Hex/raw values | `var(--ui-*)` tokens | Inline `style=""` |
|---|---|---|---|
| `public/theme.css` or `public/themes/*.css` | **✓ allowed** — this is where palette values live | ✓ allowed | — |
| `app.css` or any `.css` file in `public/` | **✗ blocked by lint** | **✓ required** | — |
| JS spec files (the `view` function) | **✓ allowed** (e.g. `color: '#fff'` on component props) | ✓ allowed | **✗ avoid** |

The rule in plain English: **CSS files reference tokens; theme files define them.** JS spec files are exempt because component props like `hero({ background: '#1a1a2e' })` are intentional design overrides, not CSS authoring.

**Common mistake:** Writing `--ui-accent: #e25;` directly in `app.css`. This trips the lint. Move it to `public/theme.css` (dark theme in `:root`) or `public/themes/brand.css` (light theme in `[data-theme="light"]`).

```css
/* public/theme.css — hex values live here ✓ */
[data-theme="light"] { --ui-accent: #e25; }

/* app.css — var() only ✓ */
.hero { color: var(--ui-accent); }

/* app.css — this will be blocked ✗ */
.hero { color: #e25; }
```

Load order in `meta.styles` matters: `pulse-ui.css` → `theme.css` → `app.css`. Theme tokens must exist before `app.css` references them.

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


## Placeholder images for prototypes

**Use `picsum.photos` with numeric IDs for anything Lighthouse-audited.** Unsplash direct IDs rotate and 404 without warning. Picsum seeds are convenient for development but can return `ERR_CONNECTION_CLOSED` under Lighthouse's burst-load pattern — use numeric IDs for pages you'll audit:

```html
<!-- Best for Lighthouse: numeric IDs — stable under burst load -->
<img src="https://picsum.photos/id/10/1200/600" alt="..." width="1200" height="600">
<img src="https://picsum.photos/id/64/80/80" alt="..." width="80" height="80">

<!-- OK for dev / visual work only: seeds can fail under Lighthouse burst -->
<img src="https://picsum.photos/seed/hero/1200/600" alt="..." width="1200" height="600">
```

The numeric ID is sequential (1–1000+). Browse options at `https://picsum.photos/images`. Use numeric IDs whenever you're running Lighthouse — seeds are fine for screenshots and dev iteration.

**Avoid:** `https://images.unsplash.com/photo-LONGID?...` — these are unstable for prototypes. If you use Unsplash, add `https://images.unsplash.com` to `csp.img-src` in `pulse.config.js`, and expect some IDs to rot.

> **Unsplash photo IDs must be the full hash.** The format is `photo-` followed by an 11-character alphanumeric hash, e.g. `photo-1506905925346-21bda4d32df4`. A truncated or partial ID (e.g. `photo-1506905925346`) returns a 404 silently — the image is missing with no obvious error. Always copy the full ID from the Unsplash URL.
