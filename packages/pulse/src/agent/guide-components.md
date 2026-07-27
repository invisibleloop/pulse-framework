## UI components — MANDATORY

**RULE: Before writing any HTML, check whether a Pulse UI component exists for the purpose. If it does, you MUST use it. Raw HTML is only permitted for structural tags with no component equivalent (div, main, aside, footer, header).**

**RULE: All components accept a `class` prop — never `className` (that is React). Use `class` to add utility classes or custom identifiers to any component.**

Import only what you use. Icons are included — no third-party library needed. Always include `/pulse-ui.css` in `meta.styles`:
```js
import { nav, hero, feature, button, card, stat, grid, section, container, iconZap, iconShield, iconCheck } from '@invisibleloop/pulse/ui'
meta: { styles: ['/pulse-ui.css', '/app.css'] }
```

Interactive components (tooltip) also need `/pulse-ui.js` in `meta.scripts`. Modal is handled natively by the Pulse runtime — no extra script needed.

### Component root CSS classes

Use these when writing tests (`.get('.ui-card')`) or custom CSS overrides. The root class is the one to target — not an invented name.

| Component fn | Root CSS class | Notes |
|---|---|---|
| `nav` | `.ui-nav` | |
| `hero` | `.ui-hero` | |
| `button` | `.ui-btn` | |
| `card` | `.ui-card` | |
| `input` / `select` / `textarea` / `search` / `slider` | `.ui-field` | Wrapper div; inner input has `.ui-input` |
| `modal` | `.ui-modal` | |
| `alert` | `.ui-alert` | |
| `badge` | `.ui-badge` | |
| `stat` | `.ui-stat` | |
| `avatar` | `.ui-avatar` | |
| `empty` | `.ui-empty` | |
| `table` | `.ui-table-wrap` | Inner `<table>` has `.ui-table` |
| `spinner` | `.ui-spinner` | |
| `section` | `.ui-section` | |
| `container` | `.ui-container` | |
| `grid` | `.ui-grid` | |
| `stack` | `.ui-stack` | |
| `cluster` | `.ui-cluster` | |
| `feature` | `.ui-feature` | |
| `accordion` | `.ui-accordion` | |
| `cta` | `.ui-cta` | |
| `footer` | `.ui-footer` | |
| `phoneFrame` | `.ui-phone` | **Not** `.ui-phone-frame` |
| `prose` | `.ui-prose` | |
| `progress` | `.ui-progress` | |
| `breadcrumbs` | `.ui-breadcrumbs` | |
| `stepper` | `.ui-stepper` | |
| `tooltip` | `.ui-tooltip` | |
| `appBadge` | `.ui-app-badge` | |
| `uiImage` | `.ui-image` | |
| `segmented` | `.ui-segmented` | |
| `rating` | `.ui-rating` | |



### Charts

Server-rendered SVG charts — no JS, no dependencies. Drop into any card, section, or grid.

```js
import { barChart, lineChart, donutChart, sparkline } from '@invisibleloop/pulse/charts'

barChart({
  data: [{ label: 'Jan', value: 42 }, { label: 'Feb', value: 78 }],
  color: 'accent',       // accent · success · warning · error · blue · muted
  showValues: true,
  showGrid: true,
  gap: 0.25,
  height: 220,
})

lineChart({
  data: [{ label: 'Jan', value: 42 }, ...],
  color: 'accent',
  area: true,
  showDots: true,
  height: 220,
})

donutChart({
  data: [
    { label: 'Satisfied',   value: 73, color: 'success' },
    { label: 'Neutral',     value: 18, color: 'muted'   },
    { label: 'Unsatisfied', value: 9,  color: 'error'   },
  ],
  size: 200, thickness: 40, label: '73%', sublabel: 'satisfied',
})

sparkline({ data: [12,18,14,22,19,28], color: 'success', area: true })
```

Charts compose naturally:
```js
card({ title: 'Monthly signups', content: barChart({ data, height: 180 }) })
grid({ cols: 2, content:
  card({ title: 'Revenue', content: barChart({ data: monthly, color: 'accent' }) }) +
  card({ title: 'Traffic', content: lineChart({ data: daily,  color: 'blue', area: true }) }),
})
```

### Icons

55 built-in icons — no third-party library needed. All are pure functions: `iconName({ size, class, bg, bgColor }) => svgString`.

Props: `size` (px, default 16), `class`, `bg` ('circle' or 'square'), `bgColor` (accent/success/warning/error/muted).

```js
import { iconCheck, iconZap, iconShield, iconTrash } from '@invisibleloop/pulse/ui'

feature({ icon: iconZap({ size: 20 }) })
button({ label: 'Delete', variant: 'danger', icon: iconTrash({ size: 14 }) })
iconZap({   size: 20, bg: 'circle', bgColor: 'accent'  })
iconCheck({ size: 20, bg: 'circle', bgColor: 'success' })
```

Available icons:
- **Navigation:** iconArrowLeft/Right/Up/Down, iconChevronLeft/Right/Up/Down, iconExternalLink, iconMenu, iconX, iconMoreHorizontal, iconMoreVertical
- **Hand Pointers:** iconHandPointUp/Down/Left/Right
- **Status:** iconCheck, iconCheckCircle, iconXCircle, iconAlertCircle, iconAlertTriangle, iconInfo
- **Actions:** iconPlus, iconMinus, iconEdit, iconTrash, iconCopy, iconSearch, iconFilter, iconDownload, iconUpload, iconRefresh, iconSend
- **UI Controls:** iconEye, iconEyeOff, iconLock, iconUnlock, iconSettings, iconBell
- **People:** iconUser, iconUsers, iconMail, iconMessageSquare
- **Pages:** iconHome, iconLogOut, iconLogIn
- **Content:** iconFile, iconImage, iconLink, iconCode, iconCalendar, iconClock, iconBookmark, iconTag
- **Media:** iconPlay, iconPause, iconVolume, iconStar, iconHeart
- **Misc:** iconGlobe, iconShield, iconZap, iconTrendingUp, iconTrendingDown, iconLoader, iconGrid, iconPhone, iconGamepad, iconBug

**Never use emoji in UI output.** Use icons instead.

To add a missing icon: copy a Lucide path (MIT) into `src/ui/icons.js` using `s(paths, opts(o))` for stroke or `f(paths, opts(o))` for fill, export from `src/ui/index.js`.

### Form components

| Component | Key props |
|-----------|-----------|
| `button` | `label`, `variant` (primary/secondary/ghost/**ghost-light**/danger), `size` (sm/md/lg), `href`, `type`, `disabled`, `fullWidth`, `icon`, `iconAfter`, `attrs` — **use `ghost-light` when the button sits on a dark background** (hero, `section--dark`, navy wrapper); `ghost` uses `--ui-muted` text which fails contrast on dark backgrounds in light theme |
| `input` | `name`, `label`, `type`, `placeholder`, `value`, `error`, `hint`, `required`, `disabled`, `attrs` |
| `search` | `name`, `label`, `labelHidden`, `placeholder`, `value`, `event` (e.g. `'input:setSearch'`), `debounce` (ms, default 200), `clearEvent` (shown when value non-empty), `disabled`, `attrs` — search input with icon + clear button. **Use this instead of `input({ type: 'search' })`.** |
| `select` | `name`, `label`, `options` (strings or `{value,label}`), `value`, `error`, `required`, `event` |
| `textarea` | `name`, `label`, `placeholder`, `value`, `rows`, `error`, `hint`, `required`, `disabled`, `attrs` |
| `fieldset` | `legend`, `content` (HTML slot), `gap` (xs/sm/md/lg) |
| `toggle` | `name`, `label`, `checked`, `disabled`, `hint`, `id`, `event` — iOS-style switch; reads as `'on'` in FormData |
| `fileUpload` | `name`, `label`, `hint`, `error`, `accept`, `multiple`, `required`, `disabled`, `event` — drag-and-drop zone. **Never use `input({ type: 'file' })` for file uploads — always use `fileUpload()`.** |
| `slider` | `name`, `label`, `min`, `max`, `step`, `value`, `disabled`, `hint`, `event` — use `change:mutationName` not `input` |
| `segmented` | `name`, `options` ([{value,label}]), `value`, `size`, `disabled`, `event` — iOS-style segmented control. `value` must match an `options[].value` entry exactly — ensure `state` is initialised with a default that matches one of the option values. |
| `radio` | `name`, `value`, `label`, `checked`, `disabled`, `id`, `event` |
| `radioGroup` | `name`, `legend`, `options` ([{value,label,hint?,disabled?}]), `value`, `hint`, `error`, `gap`, `event` |
| `rating` | `value` (0–max, 0.5 steps), `max` (5), `name` (enables interactive mode), `label`, `size`, `disabled` |

### Display components

| Component | Key props |
|-----------|-----------|
| `card` | `title`, `level` (1–6, default 3), `content` (HTML slot), `footer` (HTML slot), `flush` (full-bleed), `variant` (default/elevated/bordered/flat/glass/tinted) |
| `alert` | `variant` (info/success/warning/error), `title`, `content` |
| `badge` | `label`, `variant` (default/success/warning/error/info) |
| `stat` | `label`, `value`, `change`, `trend` (up/down/neutral), `size` (sm/md/lg — lg for hero KPIs), `center` |
| `avatar` | `src`, `alt`, `size` (sm/md/lg/xl), `initials` |
| `empty` | `title`, `description`, `action` ({label,href,variant}) |
| `table` | `headers`, `rows` (2D array of HTML strings), `caption` | ⚠ Each cell item must be **raw HTML content** — `table()` wraps each item in `<td>` itself. Do NOT pass `<td>...</td>` strings or you will get double-nested cells. |
| `spinner` | `size` (sm/md/lg), `color` (accent/muted/white), `label` |
| `progress` | `value`, `max` (100), `label`, `showLabel`, `showValue`, `variant`, `size` |
| `breadcrumbs` | `items` ([{label,href}] — last item has no href), `separator` |
| `stepper` | `steps` (array of label strings), `current` (0-based) |
| `uiImage` | `src`, `alt`, `caption`, `ratio`, `rounded`, `pill`, `width`, `height`, `maxWidth` |
| `pullquote` | `quote`, `cite`, `size` (md/lg) |

Image galleries, photo grids, logo/trust marquees, and timelines have no dedicated component — build them with `grid()` / `stack()` + `uiImage()` and raw HTML (creative override), or a CSS-only scrolling strip for marquee-style content.

### Typography components

| Component | Key props |
|-----------|-----------|
| `heading` | `level` (1–6), `text`, `size` (xs–4xl, overrides level default), `color` (default/muted/accent), `balance` (true — prevents orphaned words) |
| `prose` | `content` (raw HTML — not escaped), `size` (sm/base/lg) — for CMS/markdown content you don't control |

**Never write raw `<h1>`–`<h6>` without styling.** Use `heading()` instead. *(Mode A only — in a creative override, raw headings styled directly with utility classes or custom CSS are correct. The `heading()` component adds wrapper markup that can fight custom layouts.)* There is no dedicated list component — write `<ul>`/`<ol>` directly, styled with utility classes or `app.css`.

**Heading order across components.** `card`, `feature`, `section`, `cta`, and `modal` all accept a `level` prop. Use it to keep the document outline correct without changing visual style. For example, if a page has an h2 section title and each card inside it has a title, pass `level: 3` on the cards (the default) — but if the cards are the first heading on the page, pass `level: 2`. The CSS class stays the same (`ui-card-title` etc.) so appearance is unaffected.

**`balance: true`** on `heading()` prevents orphaned words. Apply to any heading the verification orphan check flags.

Use `prose()` for HTML from external sources (CMS, markdown). Use `heading()` when writing headings yourself.

### Editorial / typographic layouts

There is no dedicated editorial component family — for non-SaaS layouts (paperback books, vintage magazines, editorial sites, portfolio pages) needing structure that's tabular, asymmetric, or typography-led, compose from `heading()`, `prose()`, `pullquote()`, `divider()`, and raw HTML styled with utility classes or `app.css` (creative override).

**Example: Book backlist** — a tabular list of items, built with raw HTML inside `stack()`:
```js
stack({
  gap: 'md',
  content: books.map(b => `
    <div class="book-entry">
      <span class="book-entry-year">${b.year}</span>
      <div>
        <h3>${b.title}</h3>
        <p>${b.description}</p>
      </div>
    </div>
  `).join(''),
})
```

**Example: Editorial hero** — a large display title with a custom-styled heading, and a first-paragraph drop-cap treatment via CSS (`::first-letter`) rather than a component:
```js
${heading({ level: 1, text: 'In Search of Lost Code', class: 'display-heading' })}
<p class="drop-cap">The first computers were humans, pencil-wielding calculators in windowless rooms, computing artillery trajectories by hand...</p>
```

**Example: Section divider** — an eyebrow + heading + rule, built directly:
```js
`<div class="section-label">
  <p class="section-label-eyebrow">Chapter 3</p>
  ${heading({ level: 2, text: 'The Rise of Symbolic Logic' })}
  ${divider()}
</div>`
```

**Example: Minimal footer for an editorial page** — plain HTML rather than `footer()`, when the page wants a tight, columnless colophon:
```js
`<footer class="colophon">
  <p>© 2025 Alden Press • Set in Lyon Text and Atlas Grotesk</p>
  <p><a href="/about">About</a> • <a href="/contact">Contact</a></p>
</footer>`
```

**Composition:** These layouts work inside `section()` + `container()` like any other Pulse component. Use `prose()` for body text, `heading()` for large type moments, and custom CSS classes (defined in `app.css` with tokens from `theme.css`) for editorial-specific presentation.

#### When components feel restrictive

**Symptom:** You're fighting a component's wrapper styles (padding, max-width, centering) in your CSS overrides.

**Solutions:**
1. **Use the right approach for your design.** If the page is editorial/typographic, compose from `heading()`, `prose()`, and raw HTML (creative override) instead of trying to force `hero()`, `feature()`, `cta()` into an editorial shape.
2. **Write custom markup for structural differences.** Components provide sensible defaults for common patterns. When your design structure diverges significantly (asymmetric grid, full-bleed sections, custom positioning), write the HTML directly — that's permitted for layouts. Use components for the UI primitives (`button`, `card`, `input`, `badge`), but write the outer structure yourself.
3. **Override with higher specificity.** Component wrappers use single class names (`.ui-hero`, `.ui-cta`). Override with a more specific selector in your `app.css`:
   ```css
   .my-editorial-hero .ui-hero-inner {
     max-width: none;
     padding: 0;
   }
   ```

Components are opinionated by design — they enforce accessibility, consistency, and tested patterns. When the design requires breaking those patterns, prefer custom markup over fighting the component.

#### Important: Vibes affect CSS tokens, not component HTML structure

The `meta.vibe` setting (`warm`, `editorial`, `playful`, `minimal`, `bold`, `brutalist`, `retro`, `corporate`, `neon`, `paper`) applies CSS variable overrides via `data-vibe` on the `<body>` element. This changes **visual styling** — border radius, font size, letter-spacing, heading weight — but does **not** change the **HTML structure** of components.

For example:
- `hero()` with `vibe: 'editorial'` still renders eyebrow + title + subtitle + actions (SaaS structure)
- The vibe adjusts the font sizes, tracking, and spacing, but the component HTML is unchanged

**If you need different HTML structure for an editorial design** — e.g., a large display title + asymmetric layout + drop cap instead of eyebrow/subtitle/actions — write custom markup styled with `heading()`/`prose()` plus utility classes or `app.css`. Do not expect `hero()` to become structurally editorial when `vibe: 'editorial'` is set.

This is by design: vibes are a paint job, not a structural transformation. Components stay predictable and testable. When the design structure itself differs from the SaaS patterns (centred hero, three-column features, pricing cards), reach for custom layout instead of trying to force `hero()` / `feature()` / `cta()` into shapes they weren't designed for.

### Landing page components

| Component | Key props |
|-----------|-----------|
| `nav` | `logo` (HTML slot), `logoHref`, `links` ([{label,href}]), `action` (HTML slot), `sticky`, `background` (any CSS value — overrides default surface colour), `color` (foreground colour — set when custom background doesn't contrast with default muted text) — ⚠ **renders a `<nav>` landmark internally. Never wrap it in another `<nav>` or `<header><nav>` — that creates a duplicate landmark Lighthouse flags as an accessibility failure. Wrapping in `<header>` alone is fine.** |
| `hero` | `eyebrow`, `title`, `subtitle`, `actions` (HTML slot), `image` (HTML slot — activates image layout), `imageAlign` (right/left), `align` (center/left), `size` (md/sm), `layout` (split/asymmetric/overlap — when image provided: 'split'=50/50, 'asymmetric'=60/40 text-heavy, 'overlap'=image fills section with text overlay), `gradient` (true/false or preset: 'purple'\|'blue'\|'green'\|'rose'\|'orange'), `background` (any CSS value), `eyebrowColor` |
| `phoneFrame` | `content` (HTML slot — rendered inside the phone screen), `animate` (boolean, default `false` — enables a gentle 3-D tilt on hover). Pure CSS phone mockup with dynamic island, side buttons, home indicator. Use as the `image` slot in `hero()` for app landing pages. Add `animate: true` whenever the phone is a prominent hero element. |
| `feature` | `image` (HTML slot — rendered above icon), `icon` (HTML slot), `title`, `level` (1–6, default 3), `description` (or `body` as alias), `center` |
| `accordion` | `items` ([{question,answer}]) — native `<details>`, no JS |
| `appBadge` | `store` (apple/google), `href` — **always use this for App Store / Google Play download buttons. Never write a raw `<a>` with an SVG badge image.** Designed to sit in a `hero()` `actions` slot or anywhere a download CTA is needed. |
| `cta` | `eyebrow`, `title`, `level` (1–6, default 2), `subtitle` (or `body` as alias), `actions` (HTML slot), `align` (center/left) |

There is no dedicated `testimonial` or `pricing` component. Build a testimonial with `card({ content, footer })` — the quote in `content`, an `avatar()` + name/role in `footer`. Build a pricing table with `grid()` of `card({ title, content, footer })` tiles — one card per plan, `variant: 'elevated'` on the highlighted plan.

### Layout components

| Component | Key props |
|-----------|-----------|
| `container` | `content`, `size` (sm/md/lg/xl) |
| `section` | `content`, `variant` (default/alt/dark/diagonal/paper/spotlight), `padding` (sm/md/lg), `id`, `eyebrow`, `title`, `level` (1–6, default 2), `subtitle`, `align` — `diagonal`: tapered bottom edge; `paper`: dot-grid texture; `spotlight`: radial gradient focus; **`dark`: in light theme renders navy `#1a1a2e` background (not light grey) with automatic light text and ghost-button overrides; customise via `--ui-dark-bg`/`--ui-dark-text`** |
| `grid` | `content`, `cols` (1–4), `gap` (sm/md/lg) — responsive, collapses on mobile |
| `stack` | `content`, `gap` (xs–xl), `align` — flex column |
| `cluster` | `content`, `gap`, `justify`, `align` — flex row with wrap |
| `divider` | `label` |
| `media` | `image` (HTML slot), `content` (HTML slot), `reverse` — two-column image + text |
| `footer` | `logo`, `logoHref`, `links` (flat: `[{label,href}]`), `legal`, `background`, `color` — **Rich layout:** add `columns: [{title, links:[{label,href}]}]` to switch to multi-column mode; also accepts `subscribe` (HTML slot), `wordmark` (giant display text) |

There is no dedicated `banner` (thin announcement strip) or `codeWindow` (syntax-highlighted code frame) component. Build a banner as a small raw `<div>` strip styled with utility classes. Build a code window with a raw `<pre><code>` block (creative override), styled via `app.css`.

### Modal / dialog

Use `modal()` + `modalTrigger()` (or `data-dialog-open`). **Never use `state.modalOpen` or conditional rendering** — this destroys the dialog element on every render, breaking focus, animation, and native ESC.

```js
import { modal, modalTrigger, button } from '@invisibleloop/pulse/ui'

view: (state) => `
  <main id="main-content">
    <!-- Always in the DOM — never conditional -->
    ${modal({
      id:      'confirm',
      title:   'Delete item?',
      content: '<p>This cannot be undone.</p>',
      footer:  button({ label: 'Delete', variant: 'danger', attrs: { 'data-dialog-close': '' } }),
    })}

    <!-- Opens the dialog — no spec state, no mutation needed -->
    ${modalTrigger({ target: 'confirm', label: 'Delete', variant: 'ghost' })}

    <!-- Or inline with any element -->
    <button data-dialog-open="confirm">Delete</button>
  </main>
`
```

**How close works (all native — no JS needed):**
- `<form method="dialog">` submit inside the modal (the X button uses this)
- ESC key
- Clicking the backdrop (outside the dialog content)
- `data-dialog-close` attribute on any element inside or outside the dialog

**`modal()` props:** `id` (required), `title`, `content`, `footer`, `size` (sm/md/lg/xl), `class`
**`modalTrigger()` props:** `target` (dialog id), `label`, `variant`, `size`, `class`

### Forms inside a modal

**`modal()` wraps all content in `<form method="dialog">`. You cannot nest a `<form data-action="...">` inside it — browsers silently ignore nested forms, so the action will never fire.**

When the modal action requires a Pulse action (e.g. confirm delete, submit settings), use the `form` HTML attribute to associate a button with an external form:

```js
view: (state) => `
  <main id="main-content">
    <!-- The action form lives OUTSIDE the modal -->
    <form id="delete-form" data-action="deleteAccount" style="display:none"></form>

    ${modal({
      id:      'confirm-delete',
      title:   'Delete account?',
      content: '<p>This cannot be undone.</p>',
      footer:
        button({ label: 'Cancel',         variant: 'secondary', type: 'submit' }) +
        button({ label: 'Confirm delete', variant: 'danger',    attrs: { form: 'delete-form', type: 'submit' } }),
    })}

    ${modalTrigger({ target: 'confirm-delete', label: 'Delete account', variant: 'danger' })}
  </main>
`
```

- **Cancel** — `type="submit"` with no `form` attribute submits the modal's own `<form method="dialog">`, closing it natively.
- **Confirm** — `form="delete-form"` associates the button with the external form, triggering the Pulse action.
- The hidden form needs no visible fields; `onStart` can read `state` directly for any data needed by the action.

### Attaching Pulse events to components

Pass events via `attrs` — must be an object:
```js
button({ label: 'Like',   attrs: { 'data-event': 'like' } })
button({ label: 'Delete', attrs: { 'data-event': 'remove', 'data-id': item.id } })
```

### Typical landing page structure

```js
import { nav, hero, section, container, grid, feature, button } from '@invisibleloop/pulse/ui'

view: () => `
  ${nav({
    logo:   'MyApp',
    links:  [{ label: 'Docs', href: '/docs' }, { label: 'Pricing', href: '/pricing' }],
    action: button({ label: 'Sign up', href: '/signup', variant: 'primary', size: 'sm' }),
  })}
  <main id="main-content">
    ${hero({
      eyebrow:  'Now in beta',
      title:    'Build fast. Ship faster.',
      subtitle: 'The framework that gets out of your way.',
      actions:  button({ label: 'Get started →', href: '/docs', variant: 'primary', size: 'lg' }),
    })}
    ${section({ content: container({ content: grid({
      cols:    3,
      content: [
        feature({ icon: iconZap({ size: 20, bg: 'circle' }),    title: 'Fast',    description: 'SSR always on.' }),
        feature({ icon: iconShield({ size: 20, bg: 'circle' }), title: 'Safe',    description: 'Constraints enforced.' }),
        feature({ icon: iconCheck({ size: 20, bg: 'circle' }),  title: 'Correct', description: '100 Lighthouse.' }),
      ].join(''),
    }) }) })}
  </main>
`
```
