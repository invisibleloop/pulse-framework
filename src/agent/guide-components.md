## UI components — MANDATORY

**RULE: Before writing any HTML, check whether a Pulse UI component exists for the purpose. If it does, you MUST use it. Raw HTML is only permitted for structural tags with no component equivalent (div, main, aside, footer, header).**

**RULE: All components accept a `class` prop — never `className` (that is React). Use `class` to add utility classes or custom identifiers to any component.**

Import only what you use. Icons are included — no third-party library needed. Always include `/pulse-ui.css` in `meta.styles`:
```js
import { nav, hero, feature, button, card, stat, grid, section, container, iconZap, iconShield, iconCheck } from '@invisibleloop/pulse/ui'
meta: { styles: ['/pulse-ui.css', '/app.css'] }
```

Interactive components (carousel, tooltip) also need `/pulse-ui.js` in `meta.scripts`. Modal is handled natively by the Pulse runtime — no extra script needed.

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
| `testimonial` | `.ui-testimonial` | |
| `pricing` | `.ui-pricing` | |
| `accordion` | `.ui-accordion` | |
| `cta` | `.ui-cta` | |
| `footer` | `.ui-footer` | |
| `phoneFrame` | `.ui-phone` | **Not** `.ui-phone-frame` |
| `prose` | `.ui-prose` | |
| `progress` | `.ui-progress` | |
| `breadcrumbs` | `.ui-breadcrumbs` | |
| `stepper` | `.ui-stepper` | |
| `timeline` | `.ui-timeline` | |
| `carousel` | `.ui-carousel` | |
| `tooltip` | `.ui-tooltip` | |
| `appBadge` | `.ui-app-badge` | |
| `banner` | `.ui-banner` | |
| `uiImage` | `.ui-image` | |
| `gallery` | `.ui-gallery` | |
| `photoCard` | `.ui-photo-card` | |
| `marquee` | `.ui-marquee` | |
| `decorate` | `.ui-decorate` | Inline SVG — parent needs `position: relative` |
| `codeWindow` | `.ui-code-window` | |
| `segmented` | `.ui-segmented` | |
| `rating` | `.ui-rating` | |



### Charts

Server-rendered SVG charts — no JS, no dependencies. Drop into any card, section, or grid.

```js
import { barChart, lineChart, donutChart, sparkline } from '@invisibleloop/pulse/ui'

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
| `button` | `label`, `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `href`, `type`, `disabled`, `fullWidth`, `icon`, `iconAfter`, `attrs` |
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
| `table` | `headers`, `rows` (2D array of HTML strings), `caption` |
| `spinner` | `size` (sm/md/lg), `color` (accent/muted/white), `label` |
| `progress` | `value`, `max` (100), `label`, `showLabel`, `showValue`, `variant`, `size` |
| `breadcrumbs` | `items` ([{label,href}] — last item has no href), `separator` |
| `stepper` | `steps` (array of label strings), `current` (0-based) |
| `uiImage` | `src`, `alt`, `caption`, `ratio`, `rounded`, `pill`, `width`, `height`, `maxWidth` |
| `gallery` | `images` ([{src,alt,caption?,href?}]), `layout` (grid/strip/masonry), `cols` (1–4), `gap` (sm/md/lg), `rounded`, `ratio` — responsive image grid |
| `photoCard` | `src`, `alt`, `caption`, `tilt` (CSS rotate degrees, e.g. 2 or -1.5), `rounded`, `ratio` — polaroid-style card with optional tilt |
| `marquee` | `items` (array of HTML strings), `speed` (seconds, default 30), `gap`, `direction` (left/right), `pause` (hover pause), `fade` — CSS-only infinite scroll strip. Ideal for logos, trust badges |
| `decorate` | `pattern` (dots/grid/lines/zigzag/cross), `color`, `opacity`, `size` — inline SVG overlay. Parent needs `position: relative` (add class `u-relative`) |
| `pullquote` | `quote`, `cite`, `size` (md/lg) |
| `timeline` | `direction` (vertical/horizontal), `items` ([{dot,dotColor,label,content}]) |
| `timelineItem` | `content`, `label`, `dot`, `dotColor` (accent/success/warning/error/muted) |

### Typography components

| Component | Key props |
|-----------|-----------|
| `heading` | `level` (1–6), `text`, `size` (xs–4xl, overrides level default), `color` (default/muted/accent), `balance` (true — prevents orphaned words) |
| `list` | `items` (array of HTML strings), `ordered`, `gap` (xs/sm/md) |
| `prose` | `content` (raw HTML — not escaped), `size` (sm/base/lg) — for CMS/markdown content you don't control |

**Never write raw `<h1>`–`<h6>` or `<ul>`/`<ol>` without styling.** Use `heading()` and `list()` instead.

**Heading order across components.** `card`, `feature`, `section`, `pricing`, `cta`, and `modal` all accept a `level` prop. Use it to keep the document outline correct without changing visual style. For example, if a page has an h2 section title and each card inside it has a title, pass `level: 3` on the cards (the default) — but if the cards are the first heading on the page, pass `level: 2`. The CSS class stays the same (`ui-card-title` etc.) so appearance is unaffected.

**`balance: true`** on `heading()` prevents orphaned words. Apply to any heading the verification orphan check flags.

Use `prose()` for HTML from external sources (CMS, markdown). Use `heading()`/`list()` when writing content yourself.

### Landing page components

| Component | Key props |
|-----------|-----------|
| `nav` | `logo` (HTML slot), `logoHref`, `links` ([{label,href}]), `action` (HTML slot), `sticky`, `background` (any CSS value — overrides default surface colour), `color` (foreground colour — set when custom background doesn't contrast with default muted text) |
| `hero` | `eyebrow`, `title`, `subtitle`, `actions` (HTML slot), `image` (HTML slot — activates image layout), `imageAlign` (right/left), `align` (center/left), `size` (md/sm), `layout` (split/asymmetric/overlap — when image provided: 'split'=50/50, 'asymmetric'=60/40 text-heavy, 'overlap'=image fills section with text overlay), `gradient` (true/false or preset: 'purple'\|'blue'\|'green'\|'rose'\|'orange'), `background` (any CSS value), `eyebrowColor` |
| `phoneFrame` | `content` (HTML slot — rendered inside the phone screen). Pure CSS phone mockup with dynamic island, side buttons, home indicator. Use as the `image` slot in `hero()` for app landing pages. |
| `feature` | `icon` (HTML slot), `title`, `level` (1–6, default 3), `description`, `center` |
| `testimonial` | `quote`, `name`, `role`, `src`, `rating` (1–5) |
| `pricing` | `name`, `level` (1–6, default 3), `price`, `period`, `features` ([strings]), `action` (HTML slot), `highlighted` |
| `accordion` | `items` ([{question,answer}]) — native `<details>`, no JS |
| `appBadge` | `store` (apple/google), `href` |
| `cta` | `eyebrow`, `title`, `level` (1–6, default 2), `subtitle`, `actions` (HTML slot), `align` |

### Layout components

| Component | Key props |
|-----------|-----------|
| `container` | `content`, `size` (sm/md/lg/xl) |
| `section` | `content`, `variant` (default/alt/dark/diagonal/paper/spotlight), `padding` (sm/md/lg), `id`, `eyebrow`, `title`, `level` (1–6, default 2), `subtitle`, `align` — `diagonal`: tapered bottom edge; `paper`: dot-grid texture; `spotlight`: radial gradient focus |
| `grid` | `content`, `cols` (1–4), `gap` (sm/md/lg) — responsive, collapses on mobile |
| `stack` | `content`, `gap` (xs–xl), `align` — flex column |
| `cluster` | `content`, `gap`, `justify`, `align` — flex row with wrap |
| `divider` | `label` |
| `banner` | `content`, `variant` |
| `media` | `image` (HTML slot), `content` (HTML slot), `reverse` — two-column image + text |
| `codeWindow` | `content` (highlighted code HTML), `filename`, `lang` |
| `footer` | `logo`, `logoHref`, `links` (flat: `[{label,href}]`), `legal`, `background`, `color` — **Rich layout:** add `columns: [{title, links:[{label,href}]}]` to switch to multi-column mode; also accepts `subscribe` (HTML slot), `wordmark` (giant display text) |

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
