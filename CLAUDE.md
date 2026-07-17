# Pulse — AI Agent Guide

Pulse is a spec-first frontend framework. The spec is the source of truth. No codegen, no virtual DOM, no dependencies (esbuild is dev-only).

## Commands

```bash
npm run dev    # start dev server at http://localhost:3000 (pulse_build serves production on 3001)
npm test       # run the full unit test suite
npm run build  # bundle for production → public/dist/
```

## Project Structure

```
src/
  spec/schema.js          # authoritative spec definition + validation
  runtime/index.js        # client mount() + dispatch + constraints
  runtime/ssr.js          # server-side rendering (string + stream)
  runtime/navigate.js     # client-side navigation + history
  server/index.js         # HTTP server (Node built-in, zero deps)
examples/
  counter.js              # simple client-only spec
  contact.js              # spec with server data + async action
  dev.server.js           # combined dev server for both specs
scripts/
  build.js                # esbuild bundler — generates public/dist/
public/
  pulse.css               # base stylesheet (dark theme)
  dist/                   # generated — do not edit
    runtime-[hash].js     # shared runtime chunk (mount + navigate)
    [name].boot-[hash].js # per-page spec bundle
    manifest.json         # source hydrate paths → bundle paths
```

## The Spec

A spec is a plain JS object. Every property is optional except `route` and `view`. `state` defaults to `{}` — omit it on purely server-rendered pages.

**One spec = one page = one file.** A site is multiple specs, one per route. A dynamic route (`route: '/blog/:slug'`) is still a single spec serving every matching URL — never one spec per item, and never several pages folded into one spec with `ctx` conditionals. Shared sections live in `src/components/` and are imported by each spec.

```js
export const mySpec = {
  route:   '/path',           // URL pattern, supports :params. Use '*' for the custom
                              // not-found page — rendered with status 404 when no route matches

  meta: {
    title:       'Page Title',
    description: 'Meta description',
    styles:      ['/pulse.css'],
    theme:       'light',        // 'light' | 'dark' — ⚠ default is DARK when unset; decide at write time
    vibe:        'minimal',      // optional preset: radius, weight, spacing
    ogTitle:     '...',
    ogImage:     '...',
  },

  // Server data — resolved before render, passed to view as second arg
  server: {
    data: async (ctx) => ({ ... })  // ctx has params, query, headers, cookies
  },

  // Timeout for all server fetchers on this page (ms). Overrides createServer fetcherTimeout.
  serverTimeout: 5000,

  // Query-string keys that change this page's output, for the in-process page cache.
  // The cache IGNORES the query string by default — arbitrary ?n=… params cannot mint
  // unbounded cache entries (memory-DoS guard). If the rendered output depends on a
  // query param, list it here so distinct values get distinct cache entries.
  cacheVary: ['q', 'page'],

  // Sitemap inclusion (when createServer has sitemap: true).
  // Static routes are included automatically — only set this to:
  //   false              → exclude this page
  //   true               → include a guarded page (excluded by default)
  //   async () => [...]  → enumerate a dynamic :param route's URLs
  sitemap: async () => (await db.posts.list()).map(p => `/blog/${p.slug}`),

  // Global store keys this page subscribes to — appears in view's server arg.
  // The store is defined in pulse.store.js at the project root — AUTO-DISCOVERED
  // by pulse dev/start (no registration step). Mutations update all subscribed
  // pages without a server round-trip.
  store: ['user', 'cart'],

  // Initial client state — deep cloned on mount, never mutated directly
  // Optional — omit entirely on purely server-rendered pages (no mutations/actions/persist)
  state: { count: 0 },

  // Declarative min/max bounds — always enforced after mutations
  constraints: {
    count: { min: 0, max: 10 }
  },

  // Validation rules — checked when action.validate === true
  validation: {
    'fields.email': { required: true, format: 'email' },
    'fields.name':  { required: true, minLength: 2, maxLength: 100 }
    // formats: email | url | numeric
    // rules:   required | minLength | maxLength | min | max | pattern
  },

  // Pure function(s) — return HTML string, no side effects
  // Can be a single function or a keyed object of segment functions
  view: (state, server) => `<main>...</main>`,

  // Optional — called client-side when view() throws. Return an HTML string.
  // Without this, the runtime shows an inline error message and logs to console.
  // On the server, a throwing view always propagates to the server error handler
  // unless onViewError is defined, in which case it returns the fallback HTML with 200.
  onViewError: (err, state, serverState) => `<p>Something went wrong</p>`,

  // Synchronous state changes — return partial state to merge
  mutations: {
    increment: (state, event) => ({ count: state.count + 1 }),
  },

  // Async operations — lifecycle: onStart → validate → run → onSuccess/onError
  actions: {
    submit: {
      onStart:   (state, formData) => ({ status: 'loading', ... }),
      validate:  true,           // runs validation before run()
      run:       async (state, serverState, formData) => { /* fetch, etc */ },
      onSuccess: (state, payload) => ({
        status: 'success',
        _toast: { message: 'Saved!', variant: 'success' },  // show a toast
      }),
      onError:   (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
        _toast: { message: 'Something went wrong', variant: 'error' },
      }),
    }
  },

  // Server-side form handling — POST to this route, no client JS required.
  // CSRF protection is automatic: include ${server.csrf} inside the <form>.
  //   { redirect: '/path' }   → 303 POST-redirect-GET
  //   anything else           → page re-renders; return value appears as server.form
  //                             (optional status field sets the response status, e.g. 422)
  submit: async (ctx) => {
    const data = await ctx.formData()
    if (!data?.email) return { errors: { email: 'Required' }, values: data ?? {} }
    await saveSignup(data)
    return { redirect: '/thanks' }
  },
  // csrf: false,             // opt out ONLY for endpoints with their own auth (e.g. signed webhooks)

  // Streaming SSR — split view into shell (instant) + deferred segments
  stream: {
    shell:    ['header', 'nav'],
    deferred: ['feed'],

    // Optional: scope each segment to only the server fetchers it needs.
    // Shell sends as soon as its own fetchers resolve — deferred-only fetchers
    // never block the shell. Each deferred segment streams independently.
    // Omit scope (or omit a segment from scope) to give it all server state.
    scope: {
      header: ['user'],         // 'user' fetcher resolves → shell writes
      nav:    ['user'],
      feed:   ['posts', 'ads'], // 'posts' + 'ads' fetchers resolve → feed writes
    }
  }
}

export default mySpec  // required for hydration imports
```

## Server-Side Forms (no client JS)

A spec with `submit` accepts POST on its route — the form works with JavaScript disabled. **Always include `${server.csrf}` inside the form** (CSRF is enforced; POSTs without the token get 403):

```js
view: (state, server) => `
  <main id="main-content">
    ${server.form?.errors?.email ? alert({ variant: 'error', message: server.form.errors.email }) : ''}
    <form method="POST">
      ${server.csrf}
      ${input({ label: 'Email', name: 'email', type: 'email', required: true, value: server.form?.values?.email ?? '' })}
      ${button({ label: 'Sign up', type: 'submit' })}
    </form>
  </main>`,
```

- `server.form` is the return value of `submit()` on a re-render (validation errors, submitted values) — `undefined` on plain GET.
- **Progressive enhancement:** the same form can also carry `data-action="signup"` — hydrated visitors get the async action (no page reload), no-JS visitors fall back to the POST. Echo submitted values back into inputs via `value=` so a failed validation doesn't wipe the form.
- Always `return { redirect }` after a successful mutation (POST-redirect-GET) — never render success directly from the POST, or refresh resubmits the form.
- Multi-instance deployments: set a stable `secret` in `createServer` so CSRF tokens validate across instances.

## Custom 404 Page

Create a spec with `route: '*'` — it renders through the normal pipeline (layout, styles, hydration, validation) with status 404 whenever no route matches:

```js
// src/pages/not-found.js
export default {
  route: '*',
  meta:  { title: 'Page not found', styles: ['/pulse-ui.css', '/theme.css', '/app.css'] },
  view:  () => `<main id="main-content"><h1>Page not found</h1><p><a href="/">Back home</a></p></main>`,
}
```

Without a `'*'` spec, the framework's plain default 404 is served. 500s are customised via `createServer`'s `onError` option.

## HTML Event Binding

Pulse binds to DOM attributes — no JSX, no templates.

```html
<button data-event="increment">+</button>          <!-- click → mutation -->
<input  data-event="change:setName">               <!-- change → mutation -->
<input  data-event="input:setQuery">               <!-- input → mutation -->
<input  data-event="input:search" data-debounce="300">  <!-- debounced input (300ms) -->
<input  data-event="input:filter" data-throttle="100">  <!-- throttled input (100ms) -->
<form   data-action="submit">...</form>             <!-- submit → action, passes FormData -->
<button data-store-event="toggleTheme">Toggle</button>   <!-- click → store mutation -->
<select data-store-event="change:setLang">...</select>   <!-- change → store mutation -->
<button data-dialog-open="my-modal">Open modal</button> <!-- opens <dialog id="my-modal"> -->
<button data-dialog-close>Cancel</button>                <!-- closes nearest ancestor <dialog> -->
```

**List keys — use `data-key` on repeated elements** to enable key-based DOM reconciliation. When all element children of a container carry `data-key`, the runtime matches nodes by key instead of position — inserts, removals, and reorders become O(1) rather than O(n) patches, and existing DOM nodes (inputs, images) are preserved correctly:

```html
<ul>
  ${items.map(item => `<li data-key="${item.id}">${item.name}</li>`).join('')}
</ul>
```

All sibling elements in the container must have `data-key` to activate key mode — mixed keyed/unkeyed siblings fall back to position-based matching.

**Modal pattern — never use `state.modalOpen`.** Always render the `<dialog>` in the DOM unconditionally and use `data-dialog-open` to show it. ESC key, backdrop click, and `<form method="dialog">` all close it natively with no spec state.

**Important:** Do not use `data-event` on text inputs to mirror their value into state. The `innerHTML` replacement on every keystroke destroys focus. Instead, use uncontrolled inputs and capture `FormData` in `action.onStart` before `validate` runs.

## Dev vs Production Hydration

**Dev mode** — the HTML includes an inline bootstrap script importing source files directly:
```html
<script type="module">
  import spec from '/examples/counter.js'
  import { mount } from '/src/runtime/index.js'
  import { initNavigation } from '/src/runtime/navigate.js'
  mount(spec, root, window.__PULSE_SERVER__ || {}, { ssr: true })
  initNavigation(root, mount)
</script>
```

**Production** — after `npm run build`, `spec.hydrate` is resolved via `manifest.json` to a content-hashed bundle. The HTML becomes a single external tag:
```html
<script type="module" src="/dist/counter.boot-HASH.js"></script>
```

The bundle is self-executing (imports spec, calls `mount` + `initNavigation` internally). The `{ ssr: true }` option tells `mount` to skip the initial re-render and only bind events — this preserves the SSR-painted LCP element.

## Build Output

`npm run build` generates three things per app:

- `public/dist/runtime-[hash].js` — shared runtime (mount + navigate + store, ~3.8 kB brotli)
- `public/dist/[name].boot-[hash].js` — per-page spec bundle (~0.5–0.9 kB brotli)
- `public/dist/manifest.json` — maps `/examples/foo.js` → `/dist/foo.boot-HASH.js`

To add a new page to the build, add its spec path to the `ENTRIES` array in `scripts/build.js`.

The server auto-detects the manifest from `staticDir/dist/manifest.json` when `staticDir` is set. No config needed.

## Server

```js
import { createServer } from './src/server/index.js'

// Pass URL objects — hydrate is auto-derived, no need to set it in specs.
// Specs with mutations/actions/persist are hydrated automatically.
// Purely server-rendered specs get zero JavaScript.
await createServer(
  [
    new URL('./src/pages/home.js',    import.meta.url),
    new URL('./src/pages/contact.js', import.meta.url),
  ],
  {
    port:         3000,
    stream:       true,          // streaming SSR (default)
    staticDir:    'public',      // serve static files + auto-load manifest
    root:         new URL('.', import.meta.url),  // project root for deriving browser paths
    manifest:     null,          // explicit manifest path or object (overrides auto-detect)
    defaultCache: 3600,          // default HTML cache TTL in seconds for all pages (prod only)
                                 // also accepts true (3600s + swr 86400s) or { public, maxAge, staleWhileRevalidate }
                                 // spec.cache overrides per-page; in-process + Cache-Control headers both set
    fetcherTimeout:  5000,        // ms before any server fetcher times out (null = no limit)
                                  // spec.serverTimeout overrides per-page
    shutdownTimeout: 30000,       // ms to wait for in-flight requests before force-exit on SIGTERM/SIGINT
    healthCheck:     '/healthz',  // built-in health endpoint path, or false to disable
    secret:       process.env.PULSE_SECRET,  // HMAC secret for CSRF tokens — set a stable value
                                  // when running multiple instances (default: random per boot)
    sitemap:      true,           // auto-serve /sitemap.xml + robots.txt from registered routes
                                  // also accepts { origin: 'https://mysite.com' } to pin the URL origin;
                                  // dynamic :param routes contribute via spec.sitemap enumerators;
                                  // a physical sitemap.xml/robots.txt in staticDir always wins
    robots:       null,           // robots.txt when sitemap on: null = auto, false = off, string = verbatim
    redirects: {                  // declarative redirects for legacy URLs — 301 by default,
      '/old-blog/:slug': '/blog/:slug',          // :params carry over, query string preserved
      '/promo': { to: '/pricing', status: 302 }, // custom status: 301 | 302 | 307 | 308
    },                            // checked before routing (GET/HEAD only); validated at startup
    live:         true,           // SSE store-push channel (default path /__pulse/live) —
                                  // createServer returns pushStore(partial) for broadcasting
    csp: {                        // extra sources merged into the framework's default CSP
      'style-src': ['https://fonts.googleapis.com'],
      'font-src':  ['https://fonts.gstatic.com'],
    },
    resolveBrand: async (host) => db.brands.findBySlug(host.split('.')[0]),
                                 // multi-brand: result cached 60s, attached to ctx.brand
    onRequest:    (req, res) => { /* return false to short-circuit */ },
    onError:      (err, req, res) => { /* custom error handling */ }
  }
)
```

`createServer` is async — always `await` it. Spec objects are still accepted alongside URL objects for backwards compatibility.

All specs are validated at startup — bad specs throw before the server accepts connections.

## Live Store Push (SSE)

With `live: true`, `createServer` returns a **`pushStore(partial)`** function that broadcasts a store patch to every connected browser. Pages subscribed via `spec.store` re-render immediately — no polling, no client code:

```js
// Enable in pulse.config.js (CLI-managed apps) or createServer options:
export default { live: true }
```

```js
// Broadcast from any spec file — e.g. a webhook that updates stock:
import { pushStore } from '@invisibleloop/pulse'

export default {
  route: '/hooks/stock',
  contentType: 'text/plain',
  state: {},
  render: async (ctx) => {
    const { sku, stock } = await ctx.json()
    pushStore({ stock })          // every page with store: ['stock'] re-renders
    return 'ok'
  },
}
```

When you own the server entry, `createServer` also returns the handle directly: `const { pushStore } = await createServer(pages, { live: true })`.

- The client connects automatically — only on pages that declare `store: [...]` keys; one EventSource per tab, survives client navigations, reconnects natively.
- **Broadcast channel: shared data only** (stock counts, announcements, live scores). Never push per-user data — every connected client receives every patch.
- Views must handle keys that haven't arrived yet: `server.stock ?? '—'`.

## Multi-brand Sites

Pass `resolveBrand: async (host) => brandConfig` to `createServer`. The result is cached per host for 60 seconds and attached to `ctx.brand`. It is available in `guard`, `server` fetchers, and any `meta` field that is a function.

Any `meta` field can be a function `(ctx) => value` — called per request, not at startup. Meta functions can also be **async**, so you can fetch data for `title`, `description`, `ogImage` etc.:

```js
export default {
  meta: {
    title:  async (ctx) => {
      const product = await fetchProduct(ctx.params.id)
      return product ? `${product.name} — Store` : 'Store'
    },
    styles: (ctx) => ['/pulse-ui.css', `/themes/${ctx.brand.slug}.css`],
  },
  server: {
    brand: (ctx) => ctx.brand,   // expose to view as serverState.brand
  },
  view: (state, { brand }) => `<h1>${brand.name}</h1>`,
  guard: async (ctx) => {
    if (!ctx.brand) return { redirect: '/not-found' }
  },
}
```

If `meta` and `server` both need the same API data, use a **request-scoped cache** on `ctx` to avoid fetching twice. `ctx` is created fresh per request, so `ctx._cache` never leaks between requests:

```js
// shared-fetchers.js
export async function getProduct(ctx) {
  ctx._cache        ??= {}
  ctx._cache.product ??= await db.products.find(ctx.params.id)
  return ctx._cache.product
}
```

```js
// spec
import { getProduct } from './shared-fetchers.js'

export default {
  meta: {
    title: async (ctx) => {
      const p = await getProduct(ctx)   // fetches once, cached on ctx
      return p ? `${p.name} — Store` : 'Store'
    },
  },
  server: {
    product: (ctx) => getProduct(ctx),  // hits the same cache, no second fetch
  },
}
```

Keep brand differences in CSS custom properties — one `/pulse-ui.css` for components, one small `/themes/slug.css` per brand that overrides `:root` variables only.

## Custom Fonts

`pulse-ui.css` exposes `--ui-font: var(--font, system-ui, ...)` and `--ui-mono: var(--mono, ...)`. All components use these tokens. To set a custom font, override `--font` in `:root` — it cascades into every component automatically.

```css
/* app.css */
:root {
  --font: 'Inter', system-ui, sans-serif;
}
```

Load the font via `meta.styles` before `pulse-ui.css`, or self-host in `staticDir/fonts/` with `@font-face`:

```js
meta: {
  styles: [
    'https://fonts.googleapis.com/css2?family=Inter&display=swap',
    '/pulse-ui.css',
    '/app.css',
  ]
}
```

For multi-brand setups, each brand theme file just overrides `--font` in `:root`.

## Overriding Theme Colours

Use **input tokens** (unprefixed: `--accent`, `--bg`, `--text`, etc.) in `theme.css`. `pulse-ui.css` maps them to output tokens via `var()` in **both** the dark (`:root`) and light (`[data-theme="light"]`) blocks:

```css
/* Dark theme — in :root */
:root {
  --accent: #9b8dff;
}

/* Light theme — in [data-theme="light"] */
[data-theme="light"] {
  --accent: #e25;   /* overrides the light default */
}
```

Setting `--accent` in `[data-theme="light"]` works correctly — `pulse-ui.css` resolves `var(--accent, ...)` there just like it does in `:root`.

If you need to override an output token directly (e.g. one with no input equivalent), target `[data-theme="light"]` explicitly:

```css
/* Direct output token override for light theme only */
[data-theme="light"] {
  --ui-nav-sticky-bg: rgba(255, 255, 255, 0.95);
}
```

## CSS File Responsibilities

There are two CSS files and they have distinct roles — do not mix them:

| File | Purpose | Allowed content |
|---|---|---|
| `public/theme.css` | Token definitions — hex values, raw colours, font URLs | Hex values, `rgb()`, `rgba()`, `hsl()`, `hsla()`, raw values, `@font-face`, `@import` |
| `app.css` (or per-page) | Layout and component overrides | `var()` tokens **only** — no hex values |

**`app.css` must never contain hex values.** `rgba()` and `hsla()` are allowed for translucency — but if the same translucent colour is used more than once, extract it as a token in `theme.css` (e.g. `--brand-overlay-12: rgba(0,0,0,0.12)`). If you need to define or override a colour token, put it in `public/theme.css` and reference it via `var()` in `app.css`.

**CSS for a section used by more than one spec lives in the shared `app.css`, once** — every spec that renders the section lists the same file in `meta.styles`. Never copy a CSS block into a second per-page stylesheet; two copies drift. Per-page stylesheets are only for styles a single page uses.

```css
/* public/theme.css — hex values live here */
[data-theme="light"] {
  --color-accent: #e25;
  --color-bg: #ffffff;
}

/* app.css — only var() references */
.hero {
  background: var(--color-bg);
  color: var(--color-accent);
}
```

Load both files via `meta.styles`, theme first:

```js
meta: {
  styles: ['/pulse-ui.css', '/theme.css', '/app.css'],
}
```

## HTTP Response Behaviour

- **Full page request** — SSR HTML with hydration bootstrap
- **`X-Pulse-Navigate: true`** — returns JSON `{ html, title, hydrate, serverState }` for client-side navigation
- **Security headers** — on every response: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- **Compression** — brotli preferred, gzip fallback for all compressible types
- **Cache** — `/dist/*` bundles: `immutable, max-age=31536000`; static assets: `max-age=3600`; HTML: `no-store`

## Client Navigation

`initNavigation(root, mount)` intercepts same-origin `<a>` clicks:
1. Fetches the new page with `X-Pulse-Navigate: true`
2. Swaps `root.innerHTML` + updates `document.title`
3. Dynamically imports the new spec bundle (`import(hydrate)`)
4. Calls `mount(spec, root, serverState)` to re-attach interactivity

Falls back to `location.href` on any error.

## Testing

Tests use Node.js built-in `node:test` and `node:assert`. Each test file is run directly:

```bash
node src/spec/schema.test.js
node src/runtime/runtime.test.js
node src/runtime/ssr.test.js
node src/server/server.test.js
```

Server tests use an incrementing port counter (`withServer` helper) to avoid TCP TIME_WAIT conflicts between tests. Each test gets its own port.

### View testing — `@invisibleloop/pulse/testing`

Use `renderSync` and `render` to test view HTML output. Both return a `RenderResult` with CSS-like query helpers — no DOM, no jsdom, pure Node.js.

```js
import { renderSync, render } from '@invisibleloop/pulse/testing'

// Sync — calls view directly, pass mock state/server
const result = renderSync(mySpec, { state: { count: 5 }, server: { items: [] } })
result.has('button')                        // → true/false
result.get('#count').text                   // → '5'  (throws if not found)
result.find('.title')?.text                 // → string | null
result.findAll('li')                        // → Element[]
result.count('li')                          // → number
result.attr('input[name="email"]', 'value') // → string | null
result.text()                               // → all text, tags stripped

// Async — runs real spec.server fetchers (pass server to mock them)
const result = await render(mySpec, { server: { product: mockProduct } })
const result = await render(mySpec, { ctx: { params: { id: '1' } } }) // real fetchers
```

**Supported selectors:** `button`, `.class`, `#id`, `[attr]`, `[attr="value"]`, and combinations: `button.primary[type="submit"]`. **Descendant combinators are supported:** `result.count('.parent li')` or `result.find('tbody tr')`.

`Element` also has `.find()`, `.findAll()`, `.has()`, `.attr()`, `.text`, `.tag`, `.attrs`.

## Key Decisions (Do Not Reverse)

| Decision | Reason |
|---|---|
| `{ ssr: true }` skips initial render in `mount()` | Preserves SSR-painted LCP — re-rendering would cause a flash and push LCP to ~500ms |
| `onStart` captures `FormData` before `validate` runs | Uncontrolled inputs — `innerHTML` replacement on keystroke destroys focus |
| Self-executing bundles with `export default spec` | Single HTTP request for JS; spec exported so client navigation can re-mount |
| `splitting: true` in esbuild | Shared runtime extracted once, cached across all page navigations |
| `window.__PULSE_SERVER__` injected by `renderToStream` | Streaming path must serialize server state into HTML — client hydration reads it without a second request |
| Bundle path detection via `/dist/` prefix | `wrapDocument` and streaming path emit `<script src>` for bundles, inline bootstrap for dev source files |
| Security headers on every response, including 404/405 | Defense in depth — error responses are also entry points |

## Build Workflow

### New page or new site? Start with intake — always

For any **new page, landing page, or branded site**, run this sequence first. Do not skip to building.

```
0. pulse_extract_inspiration(url/image)       → structured design brief  [if user shares reference]
1. pulse_intake(name, pitch, features, ...)   → product brief + contrast check
2. pulse_sketch(brief, vibe?, antiStyle?)     → 3 layout directions to choose from
3. pulse_intent(description)                  → archetype + scaffold + guide list
```

**Before calling `pulse_intake`**, gather the required information by asking the user — one question at a time, in plain prose, no bullet lists. You need at minimum: the product name, what it does (pitch), and its key features. **Always ask first whether they have design inspiration** (a site they love, a screenshot, a mood board — dropped into `public/intake/` or pasted as a URL), and check `public/intake/` for images already there. Then ask for palette, **theme (light or dark — Pulse defaults to dark when unset)**, vibe, and anti-style if not mentioned.

**`pulse_sketch` is mandatory** for `playful`, `bold`, `brutalist`, `retro`, or `neon` vibes — those vibes fight the default centred-hero layout. Skip it only for `corporate` or `minimal` when no structural preference has been stated.

For **small edits, bug fixes, or "add X to existing Y"** — skip intake/sketch and go straight to Understand below.

---

Every build task follows this sequence. Each phase has a pass gate — do not advance until it clears.

**Before calling any slow tool (`pulse_build`, `lighthouse_audit`), output a status message to the user first** — e.g. "Building for production — ~30 s…" or "Running Lighthouse desktop audit…". Never call a slow tool silently.

> **Canonical workflow:** `pulse://workflow` (`src/agent/workflow.md`) is the authoritative version, including complexity tiers (not every task needs all phases). The table below is the summary — if they ever disagree, the MCP resource wins.

| Phase | Action | Gate |
|---|---|---|
| 1. Understand | Read guides, call `pulse_list_structure` | — |
| 2. Plan | Present plan to user, wait for confirmation | User confirms |
| 3. Build | Write spec + related files | — |
| 4. Validate | `pulse_validate` — fix all errors + warnings | Clean output |
| 5a. Design approval *(new builds only)* | Screenshot → describe → ask the user | ⛔ User approves layout before any slow checks run (skip for edits/fixes) |
| 5b. Browser | `pulse_design_review` (if intake ran) → `pulse_layout_review` → `/verify` (Lighthouse desktop + mobile + `pulse_review`) | ⛔ Do not skip: all gates must pass + `.pulse-verified` stamp written |
| 6. Tests | Write tests, run them, fix failures | All pass |
| 7. Code Review | `pulse_review` — only after phases 4–6 pass | — |
| 8. Fix | Fix every review issue, re-run affected gates | All gates still pass |

**Skip phase 2 confirmation only for trivially small, unambiguous tasks.** When in doubt, confirm.

**Template mode exception:** when adapting a pre-built template (see `pulse://guide/templates`), replace the full plan with a single compact confirmation block — template, substitutions, files. One turn is enough; do not run the full phase 2 ceremony.

**The Code Review is always last.** Never invoke `pulse_review` before validate, Lighthouse, design review, and tests all pass.

The `/verify` command runs the browser check loop (phases 4–5b) automatically. Use it.

## Pulse vs React — Do Not Do These

Pulse views are plain JS template literals, not JSX. These React patterns are **wrong in Pulse**:

| Wrong (React) | Correct (Pulse) |
|---|---|
| `className="foo"` | `class="foo"` |
| `htmlFor="id"` | `for="id"` |
| `onClick={handler}` | `data-event="click:mutationName"` |
| `onChange={handler}` | `data-event="change:mutationName"` |
| `<input value={state.x}>` | Uncontrolled — read via `FormData` in `onStart` |
| `{expression}` in JSX | `${expression}` in template literal |
| `<>...</>` fragments | No fragments — use a real wrapper element |
| `import React from 'react'` | No import needed — plain JS |
| `useState`, `useEffect`, `useRef` | No hooks — use `state`, `mutations`, `actions` |
| `key={item.id}` on list items | No `key` props — no virtual DOM |
| Capitalized `<MyComponent />` | Call as a plain function: `${myComponent(props)}` |
| `setState(prev => ...)` | Mutations return partial state: `(state) => ({ x: state.x + 1 })` |

Also: mutations must be pure (no fetch, no DOM access). Only `actions` can be async.

## Markdown

Pulse has a built-in markdown parser. Use it for blog posts, docs pages, and any static content written in `.md` files. Import from `@invisibleloop/pulse/md`. All parsing is server-side — zero browser JS.

```js
import { md }    from '@invisibleloop/pulse/md'
import { prose } from '@invisibleloop/pulse/ui'

// Static path
const page = md('content/about.md')

// Dynamic route — :param resolved from ctx.params
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

- `md(path)` returns an async fetcher — call it in both `meta` and `server`, the file is read only once per request
- Result is `{ html, frontmatter }` — `html` goes into `prose()`, `frontmatter` holds the `---` key/value pairs
- Missing file throws `{ status: 404 }` — always add `onViewError` on dynamic markdown routes
- For markdown from a database/API use `parseMd(source)` directly: `import { parseMd } from '@invisibleloop/pulse/md'`
- Use `new URL('./content/file.md', import.meta.url)` to resolve relative to the spec file rather than `process.cwd()`

## Check Components Before Building

Before writing any UI HTML by hand, check `src/ui/index.js` — there are 50+ components available. Use them. Do not reinvent `button`, `card`, `alert`, `modal`, `spinner`, `badge`, `input`, etc.

**Common patterns with dedicated components — never write these from scratch:**

- Hero sections → `hero({ title, subtitle, actions, image, layout })`
- Product/service cards → `card({ title, body, image, footer })`
- Image + text layouts → `media({ image, content, reverse })`
- Feature tiles → `feature({ icon, title, description })`
- Testimonials → `card({ content, footer })` with quote + avatar/name in the content slot
- Call-to-action sections → `cta({ title, subtitle, actions })`

If you're about to write `class="hero"` or `class="product-card"`, stop — import the component instead. You can add custom CSS on top of components for brand-specific styling, but the structure and accessibility must come from the component.

@src/agent/checklist.md

## Performance Baseline

| Page | CLS | JS (brotli) |
|---|---|---|
| /counter | 0.00 | 4.2 kB (first visit) / 0.4 kB (cached runtime) |
| /contact | 0.00 | 4.3 kB (first visit) / 0.5 kB (cached runtime) |

First-visit JS = runtime chunk (~3.8 kB) + per-page boot file (~0.4–0.9 kB). On repeat visits the runtime is served from cache — only the boot file is fetched. If multiple pages share UI components, esbuild's code splitting extracts those into the runtime chunk, so the runtime chunk grows with shared code.

Lighthouse: 100/100/100 (Accessibility / Best Practices / SEO) on both pages.

LCP is fast by design (streaming SSR sends HTML before data resolves) but actual millisecond values depend on machine speed, browser, network conditions, and server location — do not quote specific numbers.

**Caveat — third-party ads:** Pages that load ad network scripts will not achieve 100 across all categories. Ad scripts introduce render-blocking JS, third-party cookies (Best Practices), and late-loading content that causes CLS. Reserving fixed space for ad slots reduces CLS but cannot fully compensate for what ad networks inject at runtime. Treat 100/100/100 as the baseline for ad-free pages only.
