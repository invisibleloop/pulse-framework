# Pulse Templates — Scaffold Guide

Templates are complete, production-ready page specs you can adapt for a new brand. Always start from a template when the user's request matches one — do not build from scratch.

**A template gives you the right *components and content slots* — not a mandatory section order.** The structural skeleton (hero → features → testimonials → CTA) suits corporate and minimal vibes. For playful, bold, brutalist, retro, and neon vibes, the template is a parts list, not a blueprint. Run `pulse_sketch` to find a layout that matches the emotional intent before you write a line of code.

---

## When to use a template

Read the user's request and match against the triggers below. If it matches, use the template.

| Template | Route | Triggers |
|---|---|---|
| Mobile App Landing  | `docs/src/pages/templates/mobile-app.js`       | "landing page for a mobile app", "app marketing site", "app homepage", "SaaS landing page" |
| Blog Post           | `docs/src/pages/templates/blog-post.js`        | "blog post", "article page", "publication", "editorial site", "newsletter with blog" |
| Local Business      | `docs/src/pages/templates/local-business.js`   | "local business", "dog groomer", "bakery", "physio", "plumber", "florist", "salon", "restaurant", "tradesperson", "small business" |
| Portfolio           | `docs/src/pages/templates/portfolio.js`        | "portfolio", "personal site", "freelancer site", "creative professional", "photographer", "designer site", "developer portfolio" |
| Event / Conference  | `docs/src/pages/templates/event.js`            | "conference", "event", "festival", "workshop", "concert", "meetup", "summit" |
| Editorial / Magazine | `docs/src/pages/templates/editorial.js`       | "magazine", "publication", "news site", "editorial", "online journal", "newsletter homepage" |

**Always fetch `pulse://guide/design-references` after matching a template** — it tells you which vibe and component combinations suit the product's aesthetic, so you don't default to the same SaaS geometry every time.

---

## Creative-override rule — when to ignore the template structure

When the vibe is **playful, bold, brutalist, retro, or neon**, run `pulse_sketch` before writing any code and **treat the template section order as optional**. These vibes require structural decisions that the template's default skeleton actively works against.

| Signal | What to do |
|---|---|
| Vibe is playful / bold / brutalist / retro / neon | Run `pulse_sketch` — pick one of 3 layout directions |
| User says "fun", "pop-art", "loud", "unexpected", "editorial", "raw" | Run `pulse_sketch` — section order is your call |
| User says "professional", "clean", "trustworthy", "corporate", "minimal" | Template structure is fine — adapt content only |

**What this means in practice for expressive vibes:**

- The template tells you *what to include* (a hero, features, social proof, CTA). It does **not** tell you how to arrange them or what shape they take.
- Full-colour section blocks, oversized typography heroes, marquee strips, dense grids, and palette-as-structure are all fair game.
- The `phoneFrame` in Mobile App Landing is **not mandatory** — a full-bleed game board, an oversized illustration, or a typography-only hero may serve the brief better.
- `feature()` in a 3-column grid is the most predictable layout on the web. If the brief is "fun and bold", use a marquee strip of features, a zigzag alternating layout, or full-bleed feature sections instead.

---

## Template-mode: lighter planning

When using a template, skip the full plan-and-confirm ceremony. Instead, output a single compact confirmation before writing:

```
Template:      Mobile App Landing
App name:      Nova
Substitutions: name, tagline, 5 features, 3 pricing tiers, palette, font
Theme:         light  (palette: #6366f1 primary, #f8fafc bg)
Files:         src/pages/nova.js, public/themes/nova.css
Confirm to proceed — or reply with changes.
```

Wait one turn for confirmation. This replaces the full plan/build/confirm cycle. It is enough — the user can see exactly what will change.

**Do not skip the confirmation.** Even for templates, one turn of "does this look right?" prevents throwing away a completed build because the app name or palette was wrong.

### One-shot builds without a template

For a one-shot "build me X" request that doesn't use a named template, use the same compact style — a 3–5 line brief, not a full phase-2 plan:

```
Building: Chess Club landing page (/chess-club)
Vibe:     editorial · dark navy + gold · brutalist structure
Sections: hero, about, schedule, join CTA
Files:    src/pages/chess-club.js, public/themes/chess-club.css
Confirm to proceed — or reply with changes.
```

Reserve the full plan-and-confirm ceremony (route / state / mutations / actions / server fetchers) for multi-page builds, pages with complex state, or when the user hasn't confirmed the scope yet.

---

## Before writing any code — mandatory product intake

Run `pulse_intake` before presenting the confirmation. It collects the product details that make template content directionally right instead of fiction.

**How to gather the intake information** — ask questions one at a time as plain prose, never as a batch with multiple-choice options. Product details are open-ended and free-form; preset choice lists don't fit and cause tool errors. Ask the simplest possible version of each question:

1. "What's the name of the app or product?"
2. "One sentence — what does it do?"
3. "What are its main features? Give me 3–6."
4. "Who's it for?" *(optional — skip if obvious from context)*
5. "Do you have brand colours? If so, paste the hex values."
6. "Any specific font, or system-ui?"
7. "Light or dark theme preference?"
8. "How should it feel visually? (e.g. warm and friendly, editorial and sharp, playful, minimal, bold — or describe in your own words)"

Ask each question and wait for the answer before asking the next. Do not present a list of preset choices for any of these — the answers are arbitrary text.

Once you have the answers, call `pulse_intake` with the collected details. It returns a product brief + early contrast warnings.

**If `pulse_intake` is unavailable**, gather the answers via the questions above and use them directly when adapting the template — replace every placeholder with real content.

**Do not invent app content.** Placeholder copy ("Lorem ipsum", "Feature A", "Benefit here") is thrown away immediately and makes the build feel broken. Real answers mean the first build is shippable copy.

Record the intake answers. If the user provides palette hex values, note which are light/mid/dark toned before writing any CSS — this is when to spot contrast problems, not after Lighthouse runs.

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

## Local Business Landing Page

**Design direction:** Warm Local Business · **Vibe:** `warm` · **Theme:** `light`

### What it includes

| Section | Component(s) |
|---|---|
| Sticky nav | `nav` with logo, links, Book Now CTA |
| Hero | `hero(layout:'split')` with real photo of the business |
| Stats strip | `stat` × 4 in `grid` — clients, rating, years, availability |
| Services | `card` × 6 in `grid` with name, description, and price |
| About | Two-column: photo + team bio with trust badges |
| Reviews | `testimonial` × 3 in `grid` |
| Contact / Hours | Two-column: address/phone/hours + booking form |
| CTA banner | `cta` with offer (e.g. 10% off first visit) |
| Footer | `footer` with address in `legal` |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec |
| `public/themes/[name].css` | Brand theme — warm palette, `[data-theme="light"]` |

### Adapting the template

1. **Business name** — replace "Pawfect Grooming" everywhere.
2. **Service type** — update service names, descriptions, and prices to match the business.
3. **Photo** — the hero image and about section both use real photos; provide Unsplash URLs or placeholder paths. **If using external images**, add the host to `csp` in `pulse.config.js` (see pulse://guide/styles for examples).
4. **Palette** — earthy, warm tones work best. Terracotta, sage, cream, amber — avoid corporate blues.
5. **Contact details** — update address, phone, and opening hours in the contact section.
6. **Vibe** — always `warm` for local business; pairs with rounded cards and soft section dividers.

---

## Portfolio / Personal Site

**Design direction:** Minimal Portfolio · **Vibe:** `minimal` · **Theme:** dark (default)

### What it includes

| Section | Component(s) |
|---|---|
| Nav | Minimal nav — name as logo, text links, no CTA |
| Hero | `hero(layout:'centered', align:'left')` — title and short bio |
| Work grid | `card` × 6 with image, project name, description, skill badges |
| About | Single-column `container(size:'sm')` with `prose`-style paragraphs + skill badges |
| Contact | Centered section with email link, GitHub link, CV download |
| Footer | Minimal — name, 3 links, legal |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec |

Portfolio templates rarely need a separate theme CSS — the default dark palette with a single accent colour is sufficient. If the user has a brand colour, add it as a one-liner: `--ui-accent: #hex;` in `:root`.

### Adapting the template

1. **Name** — replace "Alex Mercer" everywhere, including the nav logo.
2. **Profession** — update the eyebrow and hero subtitle.
3. **Work grid** — replace with real project images, names, and descriptions. Use Unsplash or actual project screenshots. **If using external images**, add the host to `csp` in `pulse.config.js` (see pulse://guide/styles).
4. **Skills badges** — update to match the person's actual disciplines.
5. **Contact** — replace email, GitHub handle, and CV download link.
6. **Vibe** — `minimal` keeps the focus on the work; do not add excess decoration.

---

## Event / Conference Landing Page

**Design direction:** Event / Conference · **Vibe:** `bold` · **Theme:** dark (default)

### What it includes

| Section | Component(s) |
|---|---|
| Nav | `nav` with event logo, links, Get Tickets CTA |
| Hero | `hero(size:'xl', align:'center')` with gradient background |
| Stats strip | `stat` × 4 — days, speakers, attendees, tracks |
| Sponsor logos | `marquee` with sponsor names/logos |
| Speakers | `card` × 8 in `grid` with photo, name, role, topic |
| Schedule | `accordion` — one item per day with time/session/location |
| Venue | Two-column: venue info + photo |
| Tickets CTA | `cta` with prominent ticket button |
| Footer | `footer` with event links and company legal |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec |
| `public/themes/[name].css` | Optional — if brand has a specific accent colour |

### Adapting the template

1. **Event name and dates** — replace "SIGNAL", "14–16 October 2026", and "London" everywhere.
2. **Speakers** — replace with real speaker names, roles, photos, and talk topics.
3. **Schedule** — update accordion items with real session titles and times.
4. **Venue** — update name, address, capacity, and photo.
5. **Ticket price and URL** — update the ticket CTA with real link and price.
6. **Gradient hero** — adjust the gradient colours to match the event brand.
7. **Vibe** — `bold` for impact; consider `neon` for gaming/tech events.

---

## Editorial / Magazine Landing Page

**Design direction:** Editorial / Publication · **Vibe:** `editorial` · **Theme:** dark (default)

### What it includes

| Section | Component(s) |
|---|---|
| Nav | `nav` with publication name + category links + Subscribe CTA |
| Hero | `hero` with featured article title, deck, and author byline |
| Pullquote | `pullquote` from the featured article |
| Article grid | `card` × 6 with image, category badge, title, deck, author, date, read time |
| Newsletter signup | `section(variant:'spotlight')` with email input and subscribe button |
| Footer | `footer` with publication logo, category links, legal |

### Files to create

| File | Purpose |
|---|---|
| `src/pages/[name].js` | The page spec |

### Adapting the template

1. **Publication name** — replace "The Signal" everywhere.
2. **Navigation categories** — update section names to match the publication's editorial categories.
3. **Featured article** — replace hero title and subtitle with the actual lead story.
4. **Article grid** — replace all 6 article stubs with real or representative articles.
5. **Newsletter copy** — update the newsletter description and subscriber count.
6. **Vibe** — `editorial` applies serif display font and zero-radius geometry; critical for the right feel. Do not change it.

---

When you build a new template and want it available for future scaffolding:

1. Add it to this guide under its own `##` section following the pattern above.
2. Add a row to the "When to use a template" table.
3. Update the MCP resource (`pulse://guide/templates`) — it is loaded from this file.
