# Pulse — AI Agent Guide

Pulse is a spec-first frontend framework. The spec is the source of truth. No codegen, no virtual DOM, no dependencies (esbuild is dev-only).

## Commands

```bash
npm run dev    # start dev server at http://localhost:3001
npm test       # run all 92 unit tests
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

A spec is a plain JS object. Every property is optional except `route`, `state`, and `view`.

```js
export const mySpec = {
  route:   '/path',           // URL pattern, supports :params
  hydrate: '/path/to/spec.js',// browser-importable path → enables hydration

  meta: {
    title:       'Page Title',
    description: 'Meta description',
    styles:      ['/pulse.css'],
    ogTitle:     '...',
    ogImage:     '...',
  },

  // Server data — resolved before render, passed to view as second arg
  server: {
    data: async (ctx) => ({ ... })  // ctx has params, query, headers, cookies
  },

  // Timeout for all server fetchers on this page (ms). Overrides createServer fetcherTimeout.
  serverTimeout: 5000,

  // Global store keys this page subscribes to — appears in view's server arg
  // Store mutations update all subscribed pages without a server round-trip
  store: ['user', 'cart'],

  // Initial client state — deep cloned on mount, never mutated directly
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

createServer([specA, specB], {
  port:         3000,
  stream:       true,          // streaming SSR (default)
  staticDir:    'public',      // serve static files + auto-load manifest
  manifest:     null,          // explicit manifest path or object (overrides auto-detect)
  defaultCache: 3600,          // default HTML cache TTL in seconds for all pages (prod only)
                               // also accepts true (3600s + swr 86400s) or { public, maxAge, staleWhileRevalidate }
                               // spec.cache overrides per-page; in-process + Cache-Control headers both set
  fetcherTimeout:  5000,        // ms before any server fetcher times out (null = no limit)
                                // spec.serverTimeout overrides per-page
  shutdownTimeout: 30000,       // ms to wait for in-flight requests before force-exit on SIGTERM/SIGINT
  healthCheck:     '/healthz',  // built-in health endpoint path, or false to disable
  csp: {                        // extra sources merged into the framework's default CSP
    'style-src': ['https://fonts.googleapis.com'],
    'font-src':  ['https://fonts.gstatic.com'],
  },
  resolveBrand: async (host) => db.brands.findBySlug(host.split('.')[0]),
                               // multi-brand: result cached 60s, attached to ctx.brand
  onRequest:    (req, res) => { /* return false to short-circuit */ },
  onError:      (err, req, res) => { /* custom error handling */ }
})
```

All specs are validated at startup — bad specs throw before the server accepts connections.

## Multi-brand Sites

Pass `resolveBrand: async (host) => brandConfig` to `createServer`. The result is cached per host for 60 seconds and attached to `ctx.brand`. It is available in `guard`, `server` fetchers, and any `meta` field that is a function.

Any `meta` field can be a function `(ctx) => value` — called per request, not at startup:

```js
export default {
  meta: {
    title:  (ctx) => `${ctx.brand.name} — Home`,
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

**Supported selectors:** `button`, `.class`, `#id`, `[attr]`, `[attr="value"]`, and combinations: `button.primary[type="submit"]`.
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

Every build task follows this sequence. Each phase has a pass gate — do not advance until it clears.

**Before calling any slow tool (`pulse_build`, `lighthouse_audit`), output a status message to the user first** — e.g. "Building for production — ~30 s…" or "Running Lighthouse desktop audit…". Never call a slow tool silently.

| Phase | Action | Gate |
|---|---|---|
| 1. Understand | Read guides, call `pulse_list_structure` | — |
| 2. Plan | Present plan to user, wait for confirmation | User confirms |
| 3. Build | Write spec + related files | — |
| 4. Validate | `pulse_validate` — fix all errors + warnings | Clean output |
| 5. Browser | Screenshot + Lighthouse desktop + mobile | 100/100/100 (Accessibility, Best Practices, SEO) both strategies |
| 6. Tests | Write tests, run them, fix failures | All pass |
| 7. Review Agent | Invoke review — **only after phases 4–6 all pass** | — |
| 8. Fix | Fix every review issue, re-run affected gates | All gates still pass |

**Skip phase 2 confirmation only for trivially small, unambiguous tasks.** When in doubt, confirm.

**The Review Agent is always last.** Never invoke it before validate, Lighthouse, and tests all pass.

The `/verify` command runs the browser check loop (phases 4–5) automatically. Use it.

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

## Check Components Before Building

Before writing any UI HTML by hand, check `src/ui/index.js` — there are 50+ components available. Use them. Do not reinvent `button`, `card`, `alert`, `modal`, `spinner`, `badge`, `input`, etc.

@src/agent/checklist.md

## Performance Baseline

| Page | CLS | JS (brotli) |
|---|---|---|
| /counter | 0.00 | 4.2 kB (first visit) / 0.4 kB (cached runtime) |
| /contact | 0.00 | 4.3 kB (first visit) / 0.5 kB (cached runtime) |

First-visit JS = runtime chunk (~3.8 kB) + per-page boot file (~0.4–0.9 kB). On repeat visits the runtime is served from cache — only the boot file is fetched. If multiple pages share UI components, esbuild's code splitting extracts those into the runtime chunk, so the runtime chunk grows with shared code.

Lighthouse: 100/100/100 (Accessibility / Best Practices / SEO) on both pages.

LCP is fast by design (streaming SSR sends HTML before data resolves) but actual millisecond values depend on machine speed, browser, network conditions, and server location — do not quote specific numbers.
