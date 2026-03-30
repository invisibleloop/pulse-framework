Pulse is a spec-first frontend framework. Pages are JS files that export a default spec object.

## Spec structure

```js
export default {
  meta: { title, description, styles: ['/app.css'] },
  state: { /* initial state */ },
  mutations: {
    // Synchronous. Return partial state. First arg is state, second is the DOM event.
    setName: (state, e) => ({ name: e.target.value }),
  },
  actions: {
    // Async lifecycle. <form data-action="actionName"> passes FormData as payload.
    submit: {
      onStart:   (state, formData) => ({ status: 'loading' }),   // optional — runs before run()
      run:       async (state, serverState, formData) => {        // required — return value passed to onSuccess
                   const name = formData.get('name')
                   return await fetch('/api', { method: 'POST', body: formData }).then(r => r.json())
                 },
      onSuccess: (state, result) => ({ status: 'success' }),     // required — result = return value of run()
      onError:   (state, error)  => ({ status: 'error' }),       // required — called if run() throws
    },
  },
  server: {
    // Resolved server-side before render. Passed to view() as second arg.
    posts: async () => fetchPostsFromDb(),
  },
  view: (state, serverState) => `<h1>${state.title}</h1>`,
}
```

## Streaming SSR — shell + deferred segments

Use streaming when a page has slow data and you want the shell to paint instantly while slower content streams in.

To use streaming, the `view` must be an **object of named segment functions** (not a single function), and the spec must declare a `stream` field:

```js
export default {
  route: '/',
  state: {},
  server: {
    user:  async (ctx) => getUser(ctx.cookies.session),   // fast
    items: async () => {
      await new Promise(r => setTimeout(r, 1000))          // slow
      return fetchItems()
    },
  },
  stream: {
    shell:    ['shell'],    // rendered and sent immediately
    deferred: ['content'], // streamed in when server data resolves
  },
  view: {
    shell:   (state, server) => `<nav>My App</nav><h1>Welcome ${server.user?.name}</h1>`,
    content: (state, server) => `<ul>${server.items.map(i => `<li>${i.title}</li>`).join('')}</ul>`,
  },
}
```

**Key rules:**
- `view` must be an object of named functions — not a single function — when using `stream`
- Streaming splits the **view**, not data fetching. All `server.*` fetchers resolve before any segment renders. Use `Promise.all` inside a fetcher to parallelise slow calls
- Deferred segments render a `<pulse-deferred>` placeholder while loading — no client JS required
- Only specs with a `stream` field use chunked responses; all others use standard buffered SSR

## Cross-page state and persistence

### Per-page persistence — `spec.persist`

`spec.persist` is an array of state key names automatically saved to `localStorage` after every mutation/action, and restored on mount. Storage key is `pulse:/route-path` (scoped per route).

```js
export default {
  route: '/cart',
  state: { items: [], count: 0 },
  persist: ['items', 'count'],  // survive page refresh
}
```

Only declared keys are saved. Restored values that differ from the spec default trigger a re-render on mount (even after SSR).

### Global store — `pulse.store.js`

The global store is a single shared server-side data layer. Declare fetchers once — user profiles, settings, feature flags — and any page can access them by name. No repeated fetchers, no prop drilling.

**Define the store** in `pulse.store.js`:
```js
// pulse.store.js
export default {
  state: {                                      // default/fallback values
    user:     null,
    settings: { theme: 'dark', lang: 'en' },
  },
  server: {                                     // async fetchers — run per request
    user:     async (ctx) => db.users.findByCookie(ctx.cookies.session),
    settings: async (ctx) => db.settings.forUser(ctx.cookies.userId),
  },
}
```

**Register the store** in your server file:
```js
import store from './pulse.store.js'
createServer([...specs], { store })
```

**Use store data in a page** — declare `spec.store` with the keys needed. They appear in the view's `server` argument:
```js
export default {
  route: '/dashboard',
  store: ['user', 'settings'],        // declare which store keys this page uses
  server: {
    stats: async (ctx) => db.stats.forUser(ctx.store.user?.id),  // ctx.store available here
  },
  state: {},
  view: (state, server) => `
    <h1>Hello, ${server.user?.name}</h1>
    <p>Theme: ${server.settings.theme}</p>
    <p>Requests: ${server.stats.total}</p>
  `,
}
```

- Store fetchers run **before** page server fetchers and guards — `ctx.store` is available in all of them
- Only keys listed in `spec.store` are passed to the view — nothing leaks to pages that don't declare it
- Page-level `server` keys win over store keys if there is a name collision
- Pages with `spec.store` are never HTML-cached (same rule as pages with `spec.server`)

**Reactive updates — no refresh needed**

Return `_storeUpdate` from a page action's `onSuccess` to push a change into the global store. All mounted pages that subscribe to the affected keys re-render immediately:
```js
actions: {
  saveTheme: {
    run: async (state, server, payload) => {
      await fetch('/api/settings', { method: 'PATCH', body: payload })
      return payload.get('theme')
    },
    onSuccess: (state, theme) => ({
      saved: true,
      _storeUpdate: { settings: { theme } },  // ← broadcast to all subscribed pages
    }),
    onError: (state, err) => ({ error: err.message }),
  },
},
```
`_storeUpdate` is stripped from local page state — it is only forwarded to the store. The rest of `onSuccess` merges into the page's own state as normal.

## Server context — redirects, cookies, POST bodies

The `ctx` object is available in `guard`, `server.*` fetchers, and `meta` functions.

### Reading cookies
`ctx.cookies` — plain object parsed from the request `Cookie` header:
```js
server: { user: async (ctx) => getUserByToken(ctx.cookies.session) }
```

### Redirects — use `guard`
Return `{ redirect: '/path' }` from `guard` to redirect (302) before any data fetching.
There is **no redirect mechanism from `server.*` fetchers** — use `guard` for that.
```js
guard: async (ctx) => {
  if (!ctx.cookies.session) return { redirect: '/login' }
}
```

### Setting cookies and headers
`ctx.setCookie(name, value, opts)` — queues a `Set-Cookie` header. Options: `httpOnly`, `secure`, `path`, `maxAge`, `sameSite`, `domain`. Defaults: `Path=/`, `SameSite=Lax`.
`ctx.setHeader(name, value)` — queues any arbitrary response header.

### Reading the request body

Body parsing is available in `guard`, `server.*` fetchers, and `render` (raw specs). All methods are lazy — the body stream is only consumed once and the result is memoised for the lifetime of the request.

```js
await ctx.json()      // parse JSON body → object | null
await ctx.text()      // raw string body → string
await ctx.formData()  // URL-encoded body → plain object | null
await ctx.buffer()    // raw Buffer
```

Bodies larger than `maxBody` (default 1 MB, configurable in `createServer`) are rejected with a 413 response before the handler runs.

**Page specs only accept GET/HEAD by default** (POST → 405). To handle POST on a page spec, opt in with `spec.methods`:

```js
export default {
  route:   '/contact',
  methods: ['GET', 'POST'],

  guard: async (ctx) => {
    if (ctx.method === 'POST') {
      const data = await ctx.formData()
      if (!data.email) return { status: 422, json: { error: 'Email required' } }
      await db.leads.create(data)
      return { redirect: '/contact?sent=1' }
    }
  },

  state: {},
  view: (state) => `<form method="POST">...</form>`,
}
```

**Guard can return a custom HTTP response** (instead of a redirect) by returning `{ status, json?, body?, headers? }`:

```js
guard: async (ctx) => {
  const token = ctx.headers.authorization
  if (!token) return { status: 401, json: { error: 'Unauthorized' } }
  // returning nothing lets the request proceed
}
```

**Raw response specs** (`contentType` set) accept any HTTP method by default — use `ctx.method` and `await ctx.json()` / `ctx.text()` to build webhooks or JSON APIs:

```js
export default {
  route:       '/api/hook',
  contentType: 'application/json',
  render: async (ctx) => {
    const payload = await ctx.json()
    await processWebhook(payload)
    return JSON.stringify({ ok: true })
  },
}
```

## Key rules

- view() returns an HTML string using template literals
- data-event="mutationName" on buttons/elements — passes the DOM event to the mutation
- data-event="change:mutationName" to fire on input change
- data-action="actionName" on <form> elements only — submits pass FormData to the action
- Do NOT use data-event on text inputs to mirror value into state — innerHTML re-renders destroy focus. Capture values from FormData in onStart or run instead.
- onSuccess AND onError are both required in every action (missing either will cause a runtime error)
- Always export default spec

## Form layout pattern

Use a `<form data-action="...">` element with class `u-flex u-flex-col u-gap-4` for vertical field stacking. For side-by-side fields (e.g. name + email), use `grid({ cols: 2, gap: 'md' })` inside the form — it collapses to one column on mobile automatically. Never use raw `<div class="...">` grids or custom CSS when `grid()` covers it.

```js
card({ content: `
  <form data-action="submit" class="u-flex u-flex-col u-gap-4">
    ${fieldset({ legend: 'Your details', content: `
      ${grid({ cols: 2, gap: 'md', content: `
        ${input({ name: 'firstName', label: 'First name', required: true })}
        ${input({ name: 'lastName',  label: 'Last name',  required: true })}
      ` })}
      ${input({ name: 'email', label: 'Email', type: 'email', required: true })}
    ` })}
    ${fieldset({ legend: 'Message', content: `
      ${textarea({ name: 'message', label: 'Tell us about your project', rows: 5, required: true })}
    ` })}
    ${button({ label: 'Send', type: 'submit', variant: 'primary', fullWidth: true })}
  </form>
` })
```

For simple forms without distinct groups, omit `fieldset` and use `u-flex u-flex-col u-gap-4` on the `<form>` directly.

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
body { background-color: var(--ui-bg); color: var(--ui-text); font-family: var(--ui-font); }
h1   { color: var(--ui-text); }
p    { color: var(--ui-muted); }
a    { color: var(--ui-accent); }
code { background: var(--ui-surface-2); color: var(--ui-accent); border: 1px solid var(--ui-border); }
```

The library is dark by default. To apply a **light theme**, set `meta.theme: 'light'` in the spec — this adds `data-theme="light"` to the `<body>` and activates the built-in light token set (accessible contrast for badges, alerts, and all semantic colours). Do NOT manually copy token values into `:root`.

```js
meta: {
  theme: 'light',
  styles: ['/pulse-ui.css', '/app.css'],
}
```

Token list: --ui-bg, --ui-surface, --ui-surface-2, --ui-border, --ui-text, --ui-muted, --ui-accent, --ui-accent-hover, --ui-green, --ui-red, --ui-yellow, --ui-blue, --ui-radius, --ui-radius-sm, --ui-font, --ui-mono. Never hardcode hex values — override the tokens.

## Custom fonts

All components use `--ui-font` (body) and `--ui-mono` (code). These resolve from `--font` and `--mono` respectively, so overriding those two variables in `:root` is all that is ever needed — no other CSS changes required.

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

Add the Google Fonts stylesheet URL **before** `pulse-ui.css` in `meta.styles`. Use `family=Name:wght@weights` and always include `&display=swap`.

**Never use `@import url(...)` in app.css** — CSS `@import` is render-blocking and much slower than a `<link>` tag. Always use `meta.styles`.

**Never set `font-family` directly on `body`** — this bypasses `--ui-font` so components won't inherit the font. Always set `--font` in `:root` instead.

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

Note: Adobe Fonts kit URLs require the project to be published and the domain to be authorised in your Adobe Fonts account.

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

@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root { --font: 'MyFont', system-ui, sans-serif; }
```

No changes to `meta.styles` needed — the `@font-face` declarations live in `app.css` which is already loaded.

### Multi-brand fonts

For multi-brand sites, keep `@font-face` declarations (or the font service URL) in the per-brand theme file and override `--font` there:

```css
/* themes/acme.css */
:root { --font: 'proxima-nova', system-ui, sans-serif; }
```

## CSS rules — where to put styles and when to use utilities

RULE: Never use inline style attributes (style="...") in HTML. Always use classes.

RULE: For spacing, typography, layout, and colour, always prefer pulse-ui utility classes first. Only add to app.css if you need something the utilities cannot provide (e.g. a unique component style, a keyframe animation, a custom grid).

pulse-ui.css includes a full utility layer (u- prefix). Use these directly in HTML:

Spacing (scale: 1=4px 2=8px 3=12px 4=16px 5=20px 6=24px 8=32px 10=40px 12=48px 16=64px):
  u-mt-{0-16}  u-mb-{0-16}  u-mx-auto  u-ml-auto  u-mr-auto
  u-p-{0-8}  u-px-{0-8}  u-py-{0-8}

Typography:
  u-text-{xs,sm,base,lg,xl,2xl,3xl,4xl}
  u-font-{normal,medium,semibold,bold}
  u-text-{left,center,right}
  u-text-{default,muted,accent,green,red,yellow,blue}
  u-leading-{tight,snug,normal,relaxed,loose}

Layout:
  u-flex  u-flex-col  u-flex-wrap  u-flex-1  u-shrink-0
  u-items-{start,center,end,stretch}
  u-justify-{start,center,end,between}
  u-gap-{1-8}
  u-w-full  u-max-w-{xs,sm,md,lg,xl,prose}
  u-block  u-inline  u-inline-block  u-hidden

Visual:
  u-rounded  u-rounded-md  u-rounded-lg  u-rounded-xl  u-rounded-full
  u-border  u-border-t  u-border-b
  u-bg-surface  u-bg-surface2  u-bg-accent
  u-overflow-hidden  u-overflow-auto
  u-relative  u-absolute  u-opacity-50  u-opacity-75

Example — a centred hero block using only utilities, no custom CSS:
```html
<div class="u-flex u-flex-col u-items-center u-text-center u-py-16 u-gap-4">
  <h1 class="u-text-4xl u-font-bold">Hello</h1>
  <p class="u-text-lg u-text-muted u-max-w-prose">Subtitle goes here.</p>
</div>
```

When you DO need to write CSS, add it to public/app.css — never inline.

## Site navigation

Projects define navigation in src/components/layout.js via a NAV_LINKS array.
To add a new page to the nav: edit NAV_LINKS in src/components/layout.js only — do NOT add links in individual page files.

```js
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },  // ← add new pages here
]
```

## Page discovery — no registration needed

Pulse automatically discovers every .js file under src/pages/ and registers it as a route. You NEVER need to edit a server.js or register specs manually. Just create the file and it is live.

File → derived route (used only when the spec has no route property):
  src/pages/about.js          → /about
  src/pages/blog.js           → /blog
  src/pages/blog/index.js     → /blog
  src/pages/home.js or index.js → /

## Dynamic routes

Use :param syntax in the spec's route property. The filename doesn't matter — name it [slug].js or post.js, it makes no difference. The route property controls matching.

  route: '/blog/:slug'   ← param captured as ctx.params.slug

The param is available in server fetchers and meta functions:
  server: { post: async (ctx) => posts.find(p => p.slug === ctx.params.slug) ?? null }
  meta:   { title: (ctx) => posts[ctx.params.slug]?.title ?? 'Not Found' }

Convention: name dynamic-route files [param].js inside a subfolder:
  src/pages/blog/[slug].js  with  route: '/blog/:slug'

This is purely a human readability convention. Pulse does not process [ ] in filenames.

## UI components — MANDATORY

**RULE: Before writing any HTML, check whether a Pulse UI component exists for the purpose. If it does, you MUST use it. Raw HTML is only permitted for structural tags with no component equivalent (div, main, aside, footer, header).**

**RULE: For every feature, page, or UI element you build — regardless of how the request is phrased, whether it came from text or an image — your first step is always to check whether a Pulse UI component exists for it. If it does, you MUST use it. There are no exceptions.**

Before writing a single line of HTML, mentally scan the task and list which components apply. Only after exhausting the component list should you write raw HTML — and only for structural wrappers (div, main, aside, footer) with no component equivalent.

**RULE: All components accept a `class` prop — never `className` (that is React). Use `class` to add utility classes or custom identifiers to any component.**

Import only what you use. Icons are included — no third-party library needed. Always include `/pulse-ui.css` in `meta.styles`:
```js
import { nav, hero, feature, button, card, stat, grid, section, container, iconZap, iconShield, iconCheck } from '@invisibleloop/pulse/ui'
meta: { styles: ['/pulse-ui.css', '/app.css'] }
```

Interactive components (modal, carousel, tooltip, accordion) also need `/pulse-ui.js` in `meta.scripts`.

REQUIRED in meta.styles: always include '/pulse-ui.css' whenever you use any UI component.

Setup: pulse-ui.css must exist at public/pulse-ui.css — if missing, copy from node_modules/@invisibleloop/pulse/public/pulse-ui.css. Interactive components (modal, carousel) also need public/pulse-ui.js.

### Charts

Server-rendered SVG charts — no JS, no dependencies. Drop into any card, section, or grid.

```js
import { barChart, lineChart, donutChart, sparkline } from '@invisibleloop/pulse/ui'

// Bar chart
barChart({
  data: [{ label: 'Jan', value: 42 }, { label: 'Feb', value: 78 }],
  color: 'accent',       // accent · success · warning · error · blue · muted
  showValues: true,      // value labels above bars
  showGrid: true,        // horizontal grid lines (default: true)
  gap: 0.25,             // gap between bars 0–0.9
  height: 220,           // SVG height in px
})

// Line chart
lineChart({
  data: [{ label: 'Jan', value: 42 }, ...],
  color: 'accent',
  area: true,            // fill area under the line
  showDots: true,        // dots at each point (default: true)
  height: 220,
})

// Donut chart — each segment can override its colour
donutChart({
  data: [
    { label: 'Satisfied',   value: 73, color: 'success' },
    { label: 'Neutral',     value: 18, color: 'muted'   },
    { label: 'Unsatisfied', value: 9,  color: 'error'   },
  ],
  size:      200,   // diameter in px
  thickness: 40,    // ring thickness
  label:     '73%', // large centre text
  sublabel:  'satisfied',
})

// Sparkline — inline trend line, plain number array
sparkline({ data: [12,18,14,22,19,28], color: 'success', area: true })
sparkline({ data: [12,18,14,22,19,28], width: 80, height: 32 })
```

Charts compose naturally with other components:
```js
// Chart inside a card
card({ title: 'Monthly signups', content: barChart({ data, height: 180 }) })

// Grid of chart cards
grid({ cols: 2, content:
  card({ title: 'Revenue',  content: barChart({ data: monthly, color: 'accent' }) }) +
  card({ title: 'Traffic',  content: lineChart({ data: daily,  color: 'blue', area: true }) }),
})

// Sparkline below a stat tile
card({ content:
  stat({ label: 'Revenue', value: '$18k', change: '+12%', trend: 'up' }) +
  sparkline({ data: trend, color: 'success', area: true }),
})
```

### Icons

55 built-in icons — no third-party library needed. All are pure functions: `iconName({ size, class, bg, bgColor }) => svgString`.

Props:
- `size` — width/height in px (default: 16)
- `class` — extra CSS classes (on wrapper when `bg` is set, otherwise on the SVG)
- `bg` — `'circle'` or `'square'` — wraps icon in a tinted background shape
- `bgColor` — `'accent'` · `'success'` · `'warning'` · `'error'` · `'muted'` (default: `'accent'`)

```js
import { iconCheck, iconArrowRight, iconZap, iconShield } from '@invisibleloop/pulse/ui'

// Plain icon — inherits color from parent
feature({ icon: iconZap({ size: 20 }) })

// Icon in button — use the button icon prop
button({ label: 'Download', variant: 'primary',   icon: iconDownload({ size: 14 }) })
button({ label: 'Delete',   variant: 'danger',    icon: iconTrash({ size: 14 }) })
button({ label: 'Search',   variant: 'ghost',     icon: iconSearch({ size: 14 }) })

// Background circle — great for feature() icon slots or stat/timeline dots
iconZap({    size: 20, bg: 'circle', bgColor: 'accent'  })
iconCheck({  size: 20, bg: 'circle', bgColor: 'success' })
iconAlertTriangle({ size: 20, bg: 'circle', bgColor: 'warning' })

// Background square (rounded corners)
iconShield({ size: 22, bg: 'square', bgColor: 'success' })
iconCode({   size: 22, bg: 'square', bgColor: 'muted'   })

// Tint colour via utility class (no bg)
`<span class="u-text-accent">${iconStar({ size: 20 })}</span>`
```

Available icons (import by name):
- **Navigation:** iconArrowLeft/Right/Up/Down, iconChevronLeft/Right/Up/Down, iconExternalLink, iconMenu, iconX, iconMoreHorizontal, iconMoreVertical
- **Hand Pointers:** iconHandPointUp, iconHandPointDown, iconHandPointLeft, iconHandPointRight
- **Status:** iconCheck, iconCheckCircle, iconXCircle, iconAlertCircle, iconAlertTriangle, iconInfo
- **Actions:** iconPlus, iconMinus, iconEdit, iconTrash, iconCopy, iconSearch, iconFilter, iconDownload, iconUpload, iconRefresh, iconSend
- **UI Controls:** iconEye, iconEyeOff, iconLock, iconUnlock, iconSettings, iconBell
- **People:** iconUser, iconUsers, iconMail, iconMessageSquare
- **Pages:** iconHome, iconLogOut, iconLogIn
- **Content:** iconFile, iconImage, iconLink, iconCode, iconCalendar, iconClock, iconBookmark, iconTag
- **Media:** iconPlay, iconPause, iconVolume, iconStar, iconHeart
- **Devices:** iconPhone, iconGamepad
- **Misc:** iconGlobe, iconShield, iconZap, iconTrendingUp, iconTrendingDown, iconLoader, iconGrid

**Never use emoji in UI output.** Use icons instead. Emoji are not accessible, not theme-aware, and render inconsistently across platforms.

#### Adding a new icon

If the icon you need does not exist, add it to `src/ui/icons.js`. All icons follow the same pattern:

```js
// Stroke-based (most icons) — inherits color from CSS via stroke="currentColor"
export const iconRocket = (o) => s('<path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0"/><path d="M12 2C6.5 7 5 13 7 18l5 5c5-2 11-3.5 16-9a15 15 0 00-16-12z"/><circle cx="14" cy="10" r="2"/>', opts(o))

// Fill-based (solid shapes only — use sparingly)
export const iconDiamond = (o) => f('<polygon points="12 2 22 12 12 22 2 12"/>', opts(o))
```

Rules for new icons:
- 24×24 viewBox, Lucide-compatible paths (lucide.dev is MIT licensed — copy paths directly)
- Stroke icons use `s(paths, opts(o))`. Fill icons use `f(paths, opts(o))`
- Name as `iconCamelCase` — exported as a named const
- Add it to the correct section in the file (Navigation, Status, Actions, etc.) or add a new section
- Export it from `src/ui/index.js` alongside the existing icon exports

After adding, import and use it exactly like any built-in icon:
```js
import { iconRocket } from '@invisibleloop/pulse/ui'
iconRocket({ size: 20, bg: 'circle', bgColor: 'accent' })
```

### UI components

| Component | Key props |
|-----------|-----------|
| `button` | `label`, `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `href` (renders `<a>`), `type` (button/submit/reset), `disabled`, `fullWidth`, `icon`, `iconAfter`, `attrs` |
| `input` | `name`, `label`, `type`, `placeholder`, `value`, `error`, `hint`, `required`, `disabled`, `attrs` |
| `select` | `name`, `label`, `options` (strings or `{value,label}`), `value`, `error`, `required`, `event` (data-event binding, e.g. `change:setVal`) |
| `textarea` | `name`, `label`, `placeholder`, `value`, `rows`, `error`, `hint`, `required`, `disabled`, `attrs` |
| `fieldset` | `legend` (group label), `content` (HTML slot), `gap` (xs/sm/md/lg) — semantic `<fieldset>` + `<legend>` for grouping related fields |
| `toggle` | `name`, `label`, `checked`, `disabled`, `hint`, `id`, `event` (data-event binding, e.g. `change:setEnabled`) — iOS-style switch; reads as `'on'` in FormData when checked |
| `fileUpload` | `name`, `label`, `hint`, `error`, `accept` (MIME types/extensions), `multiple`, `required`, `disabled`, `event` (data-event on the input, e.g. `change:fileSelected`) — drag-and-drop upload zone; file submitted in FormData under `name` |
| `rating` | `value` (0–max, supports 0.5 steps for display), `max` (default 5), `name` (enables interactive radio mode), `label`, `size` (sm/md/lg), `disabled` — omit `name` for read-only display |
| `spinner` | `size` (sm/md/lg), `color` (accent/muted/white), `label` (aria-label, default 'Loading…') — CSS-only rotating ring |
| `progress` | `value` (0–max, omit for indeterminate), `max` (default 100), `label`, `showLabel`, `showValue`, `variant` (accent/success/warning/error), `size` (sm/md/lg) |
| `slider` | `name`, `label`, `min` (0), `max` (100), `step` (1), `value` (50), `disabled`, `hint`, `event` (data-event binding, use `change:mutationName` not `input`) — styled range input; fill gradient updates live during drag automatically. Use `data-event="change:mutationName"` (not `input`) to capture value in state — `change` fires on release, avoiding mid-drag re-render. Submits numeric value in FormData |
| `segmented` | `name`, `options` ([{value,label}]), `value` (selected), `size` (sm/md/lg), `disabled`, `event` (data-event binding, e.g. `change:setTab`) — iOS-style segmented control using radio inputs |
| `breadcrumbs` | `items` ([{label,href}] — last item has no href), `separator` (default '/') — accessible nav with aria-current on the current page |
| `stepper` | `steps` (array of label strings), `current` (0-based active index) — horizontal step progress indicator |
| `uiImage` | `src`, `alt`, `caption`, `ratio` (CSS aspect-ratio e.g. '16/9'), `rounded` (larger corner radius ~1rem — for photos and book covers), `pill` (999px stadium radius — for avatars), `width`, `height`, `maxWidth` (number in px or CSS string — constrains the figure and centres it; use for portrait/book-cover images inside a `media()` column so they don't stretch to 50% container width) |
| `pullquote` | `quote`, `cite`, `size` (md/lg) — styled blockquote with accent left border |
| `heading` | `level` (1–6), `text`, `size` (xs/sm/base/lg/xl/2xl/3xl/4xl — overrides level default), `color` (default/muted/accent), `balance` (true — adds `text-wrap: balance` to prevent orphaned words on the last line) — semantic heading tag with correct visual styling; no margin added, use `u-mb-*` for spacing |
| `list` | `items` (array of HTML strings), `ordered` (false=ul, true=ol), `gap` (xs/sm/md) — styled list with tokens; items can contain any HTML including other components |
| `prose` | `content` (raw HTML string — NOT escaped), `size` (sm/base/lg) — typography wrapper for CMS output, markdown-rendered HTML, or any HTML you don't control; styles all descendant elements automatically |
| `radio` | `name`, `value`, `label`, `checked`, `disabled`, `id`, `event` (data-event binding, e.g. `change:setChoice`) — single radio button with custom styled dot |
| `radioGroup` | `name`, `legend`, `options` ([{value,label,hint?,disabled?}]), `value` (selected), `hint`, `error`, `gap`, `event` (data-event propagated to each radio input) (sm/md/lg) — semantic `<fieldset>` of radio options |
| `card` | `title`, `content` (HTML slot), `footer` (HTML slot), `flush` (removes body padding — use for full-bleed images or tables) |
| `alert` | `variant` (info/success/warning/error), `title`, `content` |
| `badge` | `label`, `variant` (default/success/warning/error/info) |
| `stat` | `label`, `value`, `change`, `trend` (up/down/neutral), `center` |
| `avatar` | `src`, `alt`, `size` (sm/md/lg/xl), `initials` |
| `empty` | `title`, `description`, `action` ({label,href,variant}) |
| `table` | `headers`, `rows` (2D array of HTML strings), `caption` |
| `timeline` | `direction` (vertical/horizontal), `items` ([{dot,dotColor,label,content}]), `content` (raw HTML via `timelineItem()`) — ordered events connected by a line |
| `timelineItem` | `content` (HTML slot — any component), `label` (timestamp/step label, escaped), `dot` (HTML slot — SVG or emoji, grows dot to 2rem), `dotColor` (accent/success/warning/error/muted) |

### Landing page components

| Component | Key props |
|-----------|-----------|
| `nav` | `logo` (HTML slot), `logoHref`, `links` ([{label,href}]), `action` (HTML slot), `sticky` |
| `hero` | `eyebrow`, `title`, `subtitle`, `actions` (HTML slot — button() calls), `align` (center/left), `size` (md/sm — sm reduces top padding and removes bottom padding, good for inner-page headers) |
| `feature` | `icon` (HTML slot — SVG, icon component, or emoji; rendered as-is with no wrapper styling — the icon itself controls its own shape and background), `title`, `description`, `center` (boolean — centres icon, title, and description on all screen sizes) |
| `testimonial` | `quote`, `name`, `role`, `src` (avatar image URL), `rating` (1–5) |
| `pricing` | `name`, `price`, `period`, `features` ([strings]), `action` (HTML slot), `highlighted` |
| `accordion` | `items` ([{title,content}]) — no JS, native `<details>` |
| `appBadge` | `store` (apple/google), `href` |

### Layout components

| Component | Key props |
|-----------|-----------|
| `container` | `content` (HTML slot), `size` (sm/md/lg/xl) — max-width wrapper |
| `section` | `content` (HTML slot), `variant` (default/alt/dark), `padding` (sm/md/lg), `id`, `eyebrow`, `title`, `subtitle`, `align` (left/center), `class` — heading props render above content |
| `grid` | `content` (HTML slot), `cols` (1–4), `gap` (sm/md/lg) — responsive CSS grid |
| `stack` | `content` (HTML slot), `gap` (xs/sm/md/lg/xl), `align` (stretch/start/center/end) — flex column |
| `cluster` | `content` (HTML slot), `gap` (xs/sm/md/lg), `justify` (start/center/end/between), `align` — flex row with wrap |
| `divider` | `label` — `<hr>` with optional centred label |
| `banner` | `content` (HTML slot), `variant` — full-width announcement bar |
| `media` | `image` (HTML slot), `content` (HTML slot), `reverse` (boolean — puts text left, image right) — two-column image + text, stacks on mobile |
| `cta` | `eyebrow`, `title`, `subtitle`, `actions` (HTML slot), `align` (center/left) — call-to-action block, sits inside section + container |
| `codeWindow` | `content` (raw HTML slot — highlighted code), `filename`, `lang` — macOS-style window chrome around a code block |
| `footer` | `logo` (HTML slot), `logoHref`, `links` ([{label,href}]), `legal` — accessible site footer, stacks on mobile |

### Component composition

All HTML slot props (`content`, `footer`, `actions`, etc.) accept any string — including the output of other components. Nest freely:

```js
// grid() wrapping multiple cards — the standard pattern for card grids
grid({
  cols: 3, gap: 'md',
  content: items.map(item => card({ title: item.name, content: `...` })).join(''),
})

// grid() inside a card's content slot — for structured layouts within a surface
card({
  title: 'Plan comparison',
  content: grid({
    cols: 3, gap: 'sm',
    content: plans.map(p => `<div class="u-text-center u-p-2">...</div>`).join(''),
  }),
  footer: button({ label: 'View pricing', href: '/pricing', variant: 'ghost', size: 'sm' }),
})

// badge() + button() inside card content and footer
card({
  title: 'API rate limits',
  content: `
    <div class="u-flex u-gap-2 u-mb-4">
      ${badge({ label: 'Production', variant: 'success' })}
      ${badge({ label: 'v2.1', variant: 'info' })}
    </div>
    <p class="u-text-muted u-text-sm">Requests are capped at 1,000/min.</p>
  `,
  footer: `
    ${button({ label: 'View docs',        href: '/docs',    variant: 'ghost',     size: 'sm' })}
    ${button({ label: 'Request increase', href: '/contact', variant: 'secondary', size: 'sm' })}
  `,
})

// flush card with image — remove body padding for full-bleed image, restore below
card({
  flush: true,
  content: `
    <div class="u-overflow-hidden u-rounded-md" style="height:180px">
      <img src="/img/photo.jpg" alt="..." style="width:100%;height:100%;object-fit:cover">
    </div>
    <div class="u-p-5">
      <p class="u-font-semibold u-mb-2">Card title</p>
      <p class="u-text-muted u-text-sm">Supporting description.</p>
    </div>
  `,
  footer: button({ label: 'Read more', href: '#', variant: 'ghost', size: 'sm' }),
})
```

### Timeline patterns

Vertical (default) — events flow downward, connector line links each dot:
```js
timeline({
  items: [
    { label: 'Jan 2024', dotColor: 'success', content: '<strong>Launched</strong><p>v1.0 shipped to GA.</p>' },
    { label: 'Mar 2024', dotColor: 'accent',  content: '<strong>1k users</strong><p>Organic growth milestone.</p>' },
    { label: 'Q3 2024',  dotColor: 'muted',   content: '<strong>Mobile (planned)</strong>' },
  ],
})
```

Horizontal — steps flow left to right (good for onboarding flows):
```js
timeline({
  direction: 'horizontal',
  items: [
    { label: 'Step 1', content: '<p>Sign up</p>'      },
    { label: 'Step 2', content: '<p>Connect data</p>' },
    { label: 'Step 3', content: '<p>Go live</p>'      },
  ],
})
```

Icon dots — pass any SVG as `dot`; dotColor tints both dot background and icon:
```js
timeline({
  items: [
    { dot: checkSvg, dotColor: 'success', label: 'Done',    content: card({ title: 'Onboarding complete' }) },
    { dot: alertSvg, dotColor: 'warning', label: 'Pending', content: '<p>Awaiting approval.</p>' },
  ],
})
```

The `content` slot accepts any component — card(), stat(), badge(), button(), etc. Use `timelineItem()` directly for conditional or dynamic lists:
```js
timeline({
  content: steps.map(s =>
    timelineItem({ dotColor: s.done ? 'success' : 'muted', label: s.date, content: s.html })
  ).join(''),
})
```

### Typography components — headings, lists, and prose

**Never write raw `<h1>`–`<h6>` or `<ul>`/`<ol>` without styling.** Use these components instead:

#### `heading({ level, text, size?, color?, balance?, class? })`

Renders the correct semantic tag with consistent visual styling. Use for any standalone heading in a UI page — above a form, inside a card, in a section.

```js
import { heading } from '@invisibleloop/pulse/ui'

heading({ level: 1, text: 'Dashboard' })
// → <h1 class="u-text-4xl u-font-bold u-leading-tight">Dashboard</h1>

heading({ level: 2, text: 'Recent orders' })
heading({ level: 3, text: 'Billing address', class: 'u-mb-4' })
heading({ level: 2, text: 'No results', color: 'muted' })

// Override visual size independently of semantic level (SEO/accessibility need h2 but want h4 size visually)
heading({ level: 2, text: 'Related articles', size: 'lg' })

// Prevent orphaned words — adds text-wrap: balance
heading({ level: 1, text: 'The quick brown fox jumps over', balance: true })
```

Default size per level: h1=4xl, h2=3xl, h3=2xl, h4=xl, h5=base, h6=sm. Does not add margin — use `u-mb-*` / `u-mt-*` utility classes for spacing.

**`balance: true`** adds `text-wrap: balance`, which distributes text evenly across lines so no single word is stranded on the last line. Use it when a heading wraps and the visual result looks uneven. The verification workflow includes an orphan check — apply `balance: true` to any heading it flags.

#### `list({ items, ordered?, gap?, class? })`

Styled unordered or ordered list. Items are HTML strings — other components can be passed as items.

```js
import { list } from '@invisibleloop/pulse/ui'

// Simple text list
list({ items: ['Fast', 'Accessible', 'Zero dependencies'] })

// Ordered steps
list({ items: ['Create account', 'Verify email', 'Set up profile'], ordered: true })

// Items with markup — include links, badges, etc.
list({ items: items.map(i => `<strong>${e(i.name)}</strong> — ${e(i.desc)}`) })

// Spacing: 'xs' | 'sm' (default) | 'md'
list({ items: features, gap: 'md' })
```

#### `prose({ content, size?, class? })`

Typography wrapper for **any HTML you don't control**: CMS rich text, markdown output, database content, API responses. Styles all descendant elements (h1–h6, p, ul, ol, li, a, blockquote, code, pre, table, img) using `--ui-*` tokens. No classes needed on individual elements.

```js
import { prose } from '@invisibleloop/pulse/ui'

// CMS rich text field — output directly, fully styled
prose({ content: server.article.bodyHtml })

// Markdown rendered to HTML (use md() helper — see Markdown section below)
prose({ content: server.page.html })

// Larger text (e.g. hero intro)
prose({ content: server.page.intro, size: 'lg' })
```

**When to use `prose()` vs `heading()` / `list()`:**
- **`prose()`** — when the HTML comes from outside your spec (CMS, database, markdown). You don't control the tags.
- **`heading()` / `list()`** — when you're writing the content yourself inside the view template.

---

## Markdown

Pulse has a built-in markdown parser. Use it for static-site content, blog posts, documentation pages, or any content written in `.md` files. Zero browser JS — all parsing happens server-side.

### `md(pathPattern)` — file helper

Import from `@invisibleloop/pulse/md`. Returns an async server fetcher. Use it in `server` and optionally `meta`:

```js
import { md }    from '@invisibleloop/pulse/md'
import { prose } from '@invisibleloop/pulse/ui'

const page = md('content/about.md')

export default {
  route:  '/about',
  server: { page },
  view:   (state, { page }) => prose({ content: page.html }),
}
```

The fetcher returns `{ html, frontmatter }`. `html` is ready to pass to `prose()`. `frontmatter` is the parsed `---` block.

### Frontmatter for meta tags

**`meta` must be a plain object — never a function.** Individual fields can be `async (ctx) => value`. This is the correct pattern for pulling frontmatter into meta:

```js
// WRONG — meta cannot be a function factory
meta: async (ctx) => {
  const post = await fetchPost(ctx)
  return { title: post.frontmatter.title, styles: ['/app.css'] }
}

// CORRECT — meta is a plain object; each field is a function
meta: {
  title:       async (ctx) => (await post(ctx)).frontmatter.title,
  description: async (ctx) => (await post(ctx)).frontmatter.description,
  styles:      ['/pulse-ui.css', '/app.css'],  // static fields stay as values
}
```

Call the same fetcher in both `meta` and `server` — it reads the file only once per request (cached on `ctx._mdCache`):

```js
const page = md('content/about.md')

export default {
  route: '/about',
  meta: {
    title:       async (ctx) => (await page(ctx)).frontmatter.title,
    description: async (ctx) => (await page(ctx)).frontmatter.description,
  },
  server: { page },
  view:   (state, { page }) => prose({ content: page.html }),
}
```

### Dynamic routes — `:param` placeholders

```js
const post = md('content/blog/:slug.md')

export default {
  route: '/blog/:slug',
  meta: {
    title:       async (ctx) => (await post(ctx)).frontmatter.title,
    description: async (ctx) => (await post(ctx)).frontmatter.description,
  },
  server: { post },
  view: (state, { post }) => `
    <main id="main-content">
      ${prose({ content: post.html })}
    </main>
  `,
  onViewError: () => `<main id="main-content"><p>Post not found.</p></main>`,
}
```

Always add `onViewError` on dynamic markdown routes — if the file doesn't exist the fetcher throws `{ status: 404 }`.

### `parseMd(source)` — string parser

For markdown that comes from a database or API rather than a file:

```js
import { parseMd } from '@invisibleloop/pulse/md'

server: {
  post: async (ctx) => {
    const record = await db.posts.find(ctx.params.id)
    const { html, frontmatter } = parseMd(record.body)
    return { html, title: frontmatter.title ?? record.title }
  }
}
```

### What the parser supports

Headings (with auto anchor IDs), bold/italic/strikethrough, inline code, fenced code blocks with syntax highlighting (js/ts/html/css/bash/json), links, images, ordered + unordered lists (nested), blockquotes, GFM tables, horizontal rules, frontmatter.

### Attaching Pulse events to components

Pass events via `attrs` — must be an object, not a string:
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
        feature({ icon: '⚡', title: 'Fast',    description: 'SSR always on.' }),
        feature({ icon: '🛡️', title: 'Safe',    description: 'Constraints enforced.' }),
        feature({ icon: '🎯', title: 'Correct', description: '100 Lighthouse.' }),
      ].join(''),
    }) }) })}
  </main>
`
```

## Example page — contact form

```js
import { nav, section, input, textarea, button, alert, container } from '@invisibleloop/pulse/ui'
import { layout } from '../components/layout.js'

export default {
  meta: {
    title:  'Contact',
    styles: ['/app.css', '/pulse-ui.css'],
  },
  state: {
    status: 'idle',
    errors: [],
  },
  actions: {
    send: {
      onStart: (state, formData) => ({
        status:  'loading',
        name:    formData.get('name'),
        email:   formData.get('email'),
        message: formData.get('message'),
      }),
      run: async (state, serverState, formData) => {
        const res = await fetch('/api/contact', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(await res.text())
        return await res.json()
      },
      onSuccess: (state, result) => ({ status: 'success' }),
      onError:   (state, err)    => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },
  },
  view: (state) => layout(`
    ${container({ content: `
      ${section({ title: 'Contact Us', subtitle: 'We will get back to you within 24 hours.' })}
      ${state.status === 'success'
        ? alert({ type: 'success', message: 'Message sent!' })
        : `<form data-action="send" class="u-flex u-flex-col u-gap-4">
            ${grid({ cols: 2, gap: 'md', content: `
              ${input({ name: 'name',  label: 'Name',  placeholder: 'Your name',       required: true })}
              ${input({ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true })}
            ` })}
            ${textarea({ name: 'message', label: 'Message', rows: 5, required: true })}
            ${state.errors.length ? alert({ type: 'error', message: state.errors[0].message }) : ''}
            ${button({ label: state.status === 'loading' ? 'Sending…' : 'Send', type: 'submit', variant: 'primary', fullWidth: true })}
          </form>`
      }
    ` })}
  `),
}
```
