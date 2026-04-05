# Pulse Templates — Scaffold Guide

Templates are complete, production-ready page specs you can adapt for a new brand. Always start from a template when the user's request matches one — do not build from scratch.

---

## When to use a template

Read the user's request and match against the triggers below. If it matches, use the template.

| Template | Route | Triggers |
|---|---|---|
| Mobile App Landing | `docs/src/pages/templates/mobile-app.js` | "landing page for a mobile app", "app marketing site", "app homepage", "SaaS landing page" |
| Blog Post          | `docs/src/pages/templates/blog-post.js`  | "blog post", "article page", "publication", "editorial site", "newsletter with blog" |

---

## Before writing any code — mandatory pre-build questions

Ask these **before** presenting a plan. Do not skip them.

1. **Colour palette** — "Do you have a colour palette, or should I choose one?"
2. **Brand fonts** — "Any brand fonts, or system-ui is fine?"
3. **Theme** — "Light or dark theme preference?"

Record the answers. If the user provides palette colours, note which are light/mid/dark toned so you can plan contrast strategy before writing any CSS.

**Why this matters:** Building with placeholder colours and retrofitting a palette requires rebuilding components, fixing WCAG contrast failures, and touching multiple files. Getting the palette upfront avoids that loop entirely.

---

## Mobile App Landing Page

### What it includes

| Section | Component(s) |
|---|---|
| Sticky nav | `nav` with logo, links, CTA button |
| Hero | `hero` (split layout) with `phoneFrame` mockup |
| Stats bar | `stat` × 4 in a `grid` |
| Features | `feature` × 6 in a `grid` |
| Testimonials | `testimonial` × 3 in a `grid` |
| Pricing | `pricing` × 3 (Free / Pro / Family) in a `grid` |
| FAQ | `accordion` |
| Download CTA | `cta` with `appBadge` |
| Footer | `footer` with logo, links, legal |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec — copy and adapt the mobile-app template |
| `public/themes/[name].css` | Brand theme — palette tokens + light-theme overrides |

### Adapting the template

1. **Brand name** — replace every instance of "Lumio" with the new app name.
2. **Copy** — update eyebrows, titles, subtitles, feature descriptions, testimonials, pricing names/features, FAQ items, and footer links to match the new product.
3. **Phone screen** — the `phoneScreen` HTML inside `phoneFrame` is a bespoke mockup. Update colours, labels, and data to match the new brand. Inline styles inside `phoneScreen` are intentional — the mockup uses sub-utility-scale sizes that utility classes cannot express.
4. **Colour palette** — create `public/themes/[name].css` (see CSS rules below).
5. **Icons** — the logo uses `iconFeather` for Lumio. Choose an appropriate icon from `src/ui/icons.js` or add a new one if nothing fits.
6. **Route** — set `route: '/[name]'` or `route: '/'` as appropriate.
7. **`pulse-ui.js`** — always load via `asset('/pulse-ui.js')` (import `asset` from the docs layout lib). Never hardcode `/pulse-ui.js` — the unhashed path gets a 1h cache header, not the immutable cache the hashed dist path gets.

### Theme CSS rules

Create `public/themes/[name].css`. Structure it like this:

```css
/* Token definitions — raw palette values */
:root {
  --color-primary:   #hex;
  --color-secondary: #hex;
  /* ... other palette colours */
}

/* Light theme overrides — must target [data-theme="light"], NOT :root */
/* [data-theme="light"] has higher specificity than :root in pulse-ui.css */
[data-theme="light"], .ui-theme-light {
  --ui-bg:           #hex;   /* page background */
  --ui-surface:      #hex;   /* card/panel surface */
  --ui-surface-2:    #hex;   /* nested surface */
  --ui-border:       #hex;   /* border colour */
  --ui-accent:       #hex;   /* MUST pass WCAG AA (4.5:1) on --ui-bg for small text */
  --ui-accent-hover: #hex;
  --ui-accent-dim:   rgba(...); /* subtle tint for hover states */
  --ui-accent-text:  #fff;   /* text on accent background */
  --ui-muted:        #hex;   /* secondary text */
}

/* Primary button text fix for light theme (framework default uses var(--ui-bg)) */
[data-theme="light"] .ui-btn--primary {
  color: #fff;
}

/* Nav — frosted glass effect */
[data-theme="light"] .ui-nav {
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* Mobile nav — inherit dark text, not the white nav bar colour */
[data-theme="light"] .ui-nav-mobile .ui-nav-link,
[data-theme="light"] .ui-nav-mobile .ui-nav-mega-item-label,
[data-theme="light"] .ui-nav-mobile-section {
  color: var(--ui-text);
}

/* Pricing — show Pro card first on mobile */
@media (max-width: 639px) {
  #pricing .ui-grid > div:nth-child(2) { order: -1; }
}
```

Load order in `meta.styles`: `['/pulse-ui.css', '/themes/[name].css']`

**WCAG contrast rule for `--ui-accent`:** The palette's mid-tones are often too light to pass 4.5:1 on a near-white background. If none of the palette colours pass, derive a darker tonal variant (e.g. darken the primary colour) for `--ui-accent`. Keep the palette colours for large background areas where dark text is used — those only need 3:1 (large text / non-text).

### Spec meta

```js
meta: {
  title:       '[App name] — [tagline]',
  description: '...',
  theme:       'light',
  styles:      ['/pulse-ui.css', '/themes/[name].css'],
},
```

`theme: 'light'` sets `data-theme="light"` on `<body>`, which activates the light theme rules in `pulse-ui.css` and your theme file.

### Utility classes — rule

All HTML outside `phoneScreen` must use utility classes, not inline `style=""` attributes. The only legitimate inline styles are:
- Inside `phoneScreen` (sub-utility-scale phone mockup)
- `letter-spacing` values (no utility equivalent)
- The skip-link off-screen positioning (`left: -9999px`)
- `color:#fff` on the nav logo span (overrides the nav's cascaded colour)
- `background` and `color` props on `hero()` and `nav()` — these are component props, not raw attributes

### Accessibility checklist for this template

- Nav and footer logo links must go to the same `href` (both `/`). Identical accessible name + different destination = WCAG failure.
- Skip link: `<a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;...">Skip to main content</a>` — always include it at the top of the view.
- `phoneFrame` has `role="img" aria-label="Phone screen preview"` built in.

---

## Blog Post

### What it includes

| Section | Component(s) |
|---|---|
| Sticky nav | `nav` with logo, links |
| Article header | `hero` (size `sm`, centered) — eyebrow category, title, subtitle/deck, byline in `actions` slot |
| Article body | `section` + `container(size: 'sm')` + `prose` |
| Newsletter signup | `section(variant: 'alt')` + `input` + `button` — subscribe action with loading/success states |
| Footer | `footer` with logo, links, legal |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec |
| `public/themes/[name].css` | Brand theme |

### State and action

The page needs minimal state — only the newsletter form requires hydration:

```js
state: { status: 'idle' },

actions: {
  subscribe: {
    onStart:   (state) => ({ status: 'loading' }),
    run:       async (state, serverState, formData) => {
                 const email = formData.get('email')
                 if (!email) throw new Error('Email address is required')
                 await yourEmailApi(email)
                 return { email }
               },
    onSuccess: (state) => ({
                 status: 'success',
                 _toast: { message: 'Subscribed! Welcome aboard.', variant: 'success' },
               }),
    onError:   (state, err) => ({
                 status: 'error',
                 _toast: { message: err.message || 'Something went wrong.', variant: 'error' },
               }),
  },
},
```

### Newsletter form — view pattern

The form is state-driven. Show success confirmation once subscribed:

```js
state.status === 'success'
  ? `<div class="u-flex u-items-center u-justify-center u-gap-2">
       ${iconCheckCircle({ size: 20 })}
       <span>You're subscribed. Clear skies ahead.</span>
     </div>`
  : `<form data-action="subscribe" novalidate>
       <div class="u-flex u-gap-3 u-flex-wrap u-justify-center u-items-end">
         ${input({ label: 'Email address', name: 'email', type: 'email', placeholder: 'your@email.com', required: true })}
         ${button({
           label: state.status === 'loading' ? 'Subscribing\u2026' : 'Subscribe',
           type:  'submit',
           attrs: state.status === 'loading' ? { 'aria-busy': 'true', disabled: '' } : {},
         })}
       </div>
     </form>`
```

### Dark theme CSS pattern

Dark theme overrides go in `:root` (not `[data-theme="light"]`):

```css
:root {
  --ui-bg:          #hex;   /* darkest background */
  --ui-surface:     #hex;   /* card / panel background */
  --ui-surface-2:   #hex;   /* nested surface */
  --ui-border:      rgba(..., 0.18);
  --ui-accent:      #hex;   /* MUST pass 4.5:1 on --ui-bg */
  --ui-accent-hover:#hex;
  --ui-accent-dim:  rgba(..., 0.12);
  --ui-accent-text: #hex;   /* text on accent-coloured backgrounds */
  --ui-muted:       rgba(..., 0.7);
}
```

Do NOT set `meta.theme: 'light'` on dark templates — the default pulse-ui theme is already dark.

---

## Adding a new template

When you build a new template and want it available for future scaffolding:

1. Add it to this guide under its own `##` section following the pattern above.
2. Add a row to the "When to use a template" table.
3. Update the MCP resource (`pulse://guide/templates`) — it is loaded from this file.
