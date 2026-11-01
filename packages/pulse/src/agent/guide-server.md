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

The global store is a shared data layer. Server fetchers run per request; mutations run on the client and broadcast to all subscribed pages without a server round-trip.

**Define the store** in `pulse.store.js` at the project root — that's the whole setup. The CLI auto-discovers it (like pages in `src/pages/`), loads it server-side, serves it to the browser, and hot-reloads it on edit:
```js
// pulse.store.js
export default {
  state: {                                      // default/fallback values
    user:     null,
    settings: { theme: 'dark', lang: 'en' },
    cart:     { count: 0 },
  },
  server: {                                     // async fetchers — run per request, server-side only
    user:     async (ctx) => db.users.findByCookie(ctx.cookies.session),
    settings: async (ctx) => db.settings.forUser(ctx.cookies.userId),
  },
  mutations: {                                  // synchronous client-side updates — broadcast to all subscribers
    // Same contract as spec.mutations: (storeState, payload?) => Partial<storeState>
    toggleTheme: (store) => ({
      settings: { ...store.settings, theme: store.settings.theme === 'dark' ? 'light' : 'dark' },
    }),
    addToCart: (store, e) => ({
      cart: { count: store.cart.count + 1 },
    }),
  },
}
```

**No registration step is needed** with `pulse dev` / `pulse start` — `pulse.store.js` is auto-discovered. Only when you call `createServer` yourself do you pass it manually:
```js
import store from './pulse.store.js'
createServer([...specs], { store })   // manual server entry only
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

**Dispatch store mutations from any page** using `data-store-event` (same format as `data-event`):
```html
<button data-store-event="toggleTheme">Toggle theme</button>
<button data-store-event="addToCart">Add to cart</button>
<select data-store-event="change:setLang">...</select>
```

All pages that declare `spec.store` with the affected keys re-render automatically — no server round-trip, no page reload.

- Store fetchers run **before** page server fetchers and guards — `ctx.store` is available in all of them
- Only keys listed in `spec.store` are passed to the view — nothing leaks to pages that don't declare it
- Page-level `server` keys win over store keys if there is a name collision
- Pages with `spec.store` are never HTML-cached (same rule as pages with `spec.server`)

**Testing `pulse.store.js` — put the test file next to it, at the project root, not under `src/`.** `npm test`'s glob covers `src/**/*.test.js` plus a root-level `*.test.js` specifically so `pulse.store.test.js` is picked up — a store test placed anywhere under `src/pages/` instead (following the page-test convention out of habit) still runs, but `pulse.store.test.js` itself only runs from the root. Import the store the normal relative way: `import store from '../pulse.store.js'` from `src/pages/`, or `import store from './pulse.store.js'` from the root.

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

### Live store push — server-initiated updates (SSE)

For data that changes on the **server** (stock levels, live scores, announcements), enable the live channel and broadcast with `pushStore` — subscribed pages re-render without polling or any client code:

```js
// pulse.config.js — enable the channel (CLI-managed apps)
export default { live: true }
```

```js
// any spec file — broadcast via the module-level import (no server handle needed)
import { pushStore } from '@invisibleloop/pulse'

export default {
  route: '/hooks/stock',
  contentType: 'text/plain',
  state: {},
  render: async (ctx) => {
    const { stock } = await ctx.json()
    pushStore({ stock })   // every mounted page with store: ['stock'] re-renders
    return 'ok'
  },
}
```

When you own the server entry, `createServer` also returns the handle: `const { pushStore } = await createServer(pages, { live: true })`.

```js
// page spec — subscribes like any store key
export default {
  route: '/product',
  store: ['stock'],
  state: {},
  mutations: { noop: (s) => s },   // any mutation/action → page is hydrated
  view: (state, server) => `<p>${server.stock ?? '—'} in stock</p>`,
}
```

**Rules:**
- **Shared data only.** The channel is a broadcast — every connected client receives every patch. Never push per-user data (use page actions + `_storeUpdate` for that).
- Views must handle keys that haven't arrived yet (`server.stock ?? '—'`) — the first patch may land seconds after page load.
- The page must be hydrated (have mutations/actions) — purely server-rendered pages have no JS to receive patches.
- The connection is automatic and lazy: only pages with `store: [...]` keys open it, one EventSource per tab, native auto-reconnect.

## Server-side forms — `spec.submit` (works without client JS)

A spec with a `submit` handler accepts POST on its own route. The form works with JavaScript disabled — hydrated `actions` become an enhancement, not a requirement.

```js
export default {
  route: '/contact',
  submit: async (ctx) => {
    const data = await ctx.formData()
    if (!data?.email)        return { errors: { email: 'Email is required' }, values: data ?? {} }
    if (!isValid(data.email)) return { status: 422, errors: { email: 'Invalid email' }, values: data }
    await sendMessage(data)
    return { redirect: '/contact?sent=1' }   // 303 POST-redirect-GET
  },
  view: (state, server) => `
    <main id="main-content">
      ${server.form?.errors?.email ? `<p class="error">${escHtml(server.form.errors.email)}</p>` : ''}
      <form method="POST">
        ${server.csrf}
        ${input({ label: 'Email', name: 'email', type: 'email', required: true, value: server.form?.values?.email ?? '' })}
        ${button({ label: 'Send', type: 'submit' })}
      </form>
    </main>`,
}
```

**Rules:**
- `${server.csrf}` **must be inside every POST form** — CSRF protection is automatic and POSTs without a valid token are rejected with 403. Opt out with `csrf: false` only for endpoints with their own authentication (e.g. signed webhooks).
- `{ redirect }` → 303 See Other. Always redirect after a successful mutation — rendering success directly from the POST means refresh resubmits the form.
- Any other return value re-renders the page with it exposed as `server.form` — put `errors` and the submitted `values` there, and echo values back into inputs so failed validation doesn't wipe what the user typed. An optional `status` field sets the response status (e.g. 422).
- Escape user-submitted values before interpolating them into HTML (`escHtml`).
- **Progressive enhancement:** add `data-action="send"` to the same form — hydrated visitors get the async action with no page reload; no-JS visitors fall back to the POST.
- Multi-instance deployments: pass a stable `secret` to `createServer` (e.g. from an env var) so CSRF tokens issued by one instance validate on another.
- **A double click sends the form twice, and the CSRF token does not stop it.** The token is not single-use. To save once, put a random key in a hidden field when the form renders. Have `submit` refuse a key it has already saved.
- **On a longer page, a form mid-page needs to scroll the success/error state into view after the redirect.** The 303 lands the browser at the top of the page — a success message rendered next to the form (or anywhere below the fold) is invisible until the visitor scrolls down manually, which they have no reason to do after just submitting. Give the form section an `id`, add `${server.form?.sent ? '<script nonce=\"${server.nonce}\">document.getElementById(\"contact-form\").scrollIntoView()</script>' : ''}` right after it, or simplest: `<form id="contact-form" method="POST">`. Don't skip this on a short/single-purpose page (the form IS the page, nothing to scroll past) — it only matters once the form sits below other content.

## Server-side data persistence — outside the store and `spec.persist`

Neither of Pulse's two built-in state mechanisms is durable, shared server-side storage:
- `spec.persist` is **client-side** `localStorage`, scoped per route — gone if the visitor clears their browser, invisible to other visitors.
- The global store (`pulse.store.js`) is **in-memory**, shared across connected clients via SSE, but reset on every server restart and never written to disk.

For anything that needs to survive a restart and be shared across all requests — a URL shortener's code→URL map, a simple content store, any small dataset a form writes to — there's no built-in database, and the framework has no opinion on which one to use. **A JSON file on disk is a reasonable zero-dependency default for a small, low-concurrency dataset** (a few thousand records, not a high-write-throughput service); for anything bigger, bring your own database. Either way, write the persistence layer as its own module under `src/lib/`, imported from `guard`/`server`/`submit`/`actions.*.run` — never from the view.

```js
// src/lib/data-store.js — a minimal safe pattern for a small JSON-backed store
import fs   from 'node:fs/promises'
import path from 'node:path'

const FILE = path.join(process.cwd(), 'data', 'store.json')
let cache = null                 // in-memory, refreshed on write — avoids a disk read per request
let writeQueue = Promise.resolve()  // serializes writes so concurrent requests can't interleave

async function load() {
  if (cache) return cache
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8'))
  } catch {
    cache = {}   // file doesn't exist yet — start empty
  }
  return cache
}

async function persist(next) {
  // Atomic write: write to a temp file, then rename — rename is atomic on POSIX,
  // so a crash mid-write can never leave a corrupt/partial file on disk.
  const tmp = FILE + '.tmp'
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(next, null, 2))
  await fs.rename(tmp, FILE)
  cache = next
}

// Serialize every write through one promise chain — without this, two
// concurrent requests can both read the same state, modify it separately,
// and the second write silently clobbers the first (a classic lost update).
export function mutate(fn) {
  writeQueue = writeQueue.then(load).then(async (data) => {
    const next = await fn(data)
    await persist(next)
    return next
  })
  return writeQueue
}

export const read = load
```

**Rules:**
- Load-on-first-read, cache in memory, refresh the cache on every write — the hot path (a read-heavy redirect lookup, say) shouldn't hit disk on every request.
- Serialize writes through a single promise queue, as above. This is single-process only — it does not protect against two separate server *instances* writing the same file; for multi-instance deployment, use a real database instead.
- Write via temp-file-then-rename, never `fs.writeFile` directly to the real path — a process killed mid-write leaves the rename-source temp file intact and the real file untouched, not a half-written JSON file that fails to parse on next boot.
- Add the data file to `.gitignore` — it's runtime state, not something to commit.
- **This local helper module must not be imported into a page's `view` or client-side `mutations`/`actions`** — only into `guard`, `server` fetchers, `submit`, or an action's `run`. A local module using `node:fs` (or any Node built-in) that ends up reachable from client code will break the production build — see the next point.
- **A page whose only server-side logic is `guard`/`submit`/`server` (no `mutations`, `actions`, or `persist`) gets zero client JS** — this is the normal, correct outcome for a redirect handler, a form-only page, or anything else that's purely server-rendered. If a build ever tries to bundle a local server-only module (e.g. you see esbuild choke on `node:fs` or similar), that's the build's hydration-need check misfiring, not something to work around in your spec — it should already match this rule.

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
`ctx.setCookie(name, value, opts)` — queues a `Set-Cookie` header. Options: `httpOnly`, `secure`, `path`, `maxAge`, `sameSite`, `domain`. Defaults: `Path=/`, `SameSite=Lax`. `path`, `domain`, `maxAge` (integer seconds) and `sameSite` (`Strict`/`Lax`/`None`) are validated and a bad value throws, so never build them from user input.
`ctx.setHeader(name, value)` — queues any arbitrary response header.

### Reading the request body

Body parsing is available in `guard`, `server.*` fetchers, and `render` (raw specs). All methods are lazy — the body stream is only consumed once and the result is memoised for the lifetime of the request.

```js
await ctx.json()      // parse JSON body → object | null
await ctx.text()      // raw string body → string
await ctx.formData()  // URL-encoded body → plain object | null — NOT a FormData, see below
await ctx.buffer()    // raw Buffer
```

Bodies larger than the limit are rejected with a 413 when the handler reads them. The limit is `maxBody` in `createServer` (default 1 MB); set `maxBody` on a spec to override it for that route only, e.g. `maxBody: 6 * 1024 * 1024` on an image-upload route. Prefer a per-route limit to raising the global one, and authenticate in `guard` first: the framework reads the body only after the guard runs (unless your guard reads it itself), so an unauthenticated caller never gets the larger buffer. A `submit` route with CSRF is the exception to rely on: the body is read before the CSRF check, so give a public form only the limit it needs.

**A field name that appears more than once (a checkbox group, a multi-select) comes back as an array** of its values; a field that appears once is a string. Normalise with `[].concat(data.tag ?? [])` when a field may be either.

**`ctx.formData()` returns a plain object, not a browser `FormData`.** Read fields directly — `data?.email`, not `data.get('email')` — the latter throws `TypeError: data.get is not a function`. This trips people up because client-side action code (`actions.*.run(state, serverState, formData)`) receives a real `FormData` object with a `.get()` method — same method name, different context, different shape. If you're writing `spec.submit` and reach for `.get()`, that's the tell you've copied the client-side pattern by mistake.

**Page specs only accept GET/HEAD by default** (POST → 405). To handle POST on a page spec, opt in with `spec.methods`:

```js
export default {
  route:   '/contact',
  methods: ['GET', 'POST'],

  guard: async (ctx) => {
    if (ctx.method === 'POST') {
      const data = await ctx.formData()
      if (!data.email) return { redirect: '/contact?error=required' }
      await db.leads.create(data)
      // Flash cookie — consumed once, cleared by the guard on the next GET (see below)
      ctx.setCookie('flash_sent', '1', { maxAge: 30 })
      return { redirect: '/contact' }
    }
    // The guard runs before the response starts, so it can clear the cookie
    if (ctx.cookies.flash_sent === '1') ctx.setCookie('flash_sent', '', { maxAge: 0 })
  },

  server: {
    // Read only. A fetcher cannot set a cookie on a streamed page (see below)
    status: async (ctx) => ({
      sent:  ctx.cookies.flash_sent === '1',
      error: ctx.query?.error ?? null,
    }),
  },

  state: {},
  view: (_state, server) => `
    ${server.status.sent
      ? '<p>Message sent!</p>'
      : '<form method="POST">...</form>'
    }
  `,
}
```

### Post-Redirect-Get (PRG) and success messages

**Never use `?success=1` query params for success state.** They persist in the URL — refreshing re-shows the message, sharing the URL gives a false success to someone else, and it looks wrong.

**Use a flash cookie instead:**

1. After the POST succeeds: `ctx.setCookie('flash_sent', '1', { maxAge: 30 })` then redirect to the clean URL.
2. In `guard` on the next GET: if the cookie is present, clear it with `ctx.setCookie('flash_sent', '', { maxAge: 0 })`.
3. In a `server.*` fetcher, read `ctx.cookies.flash_sent` and pass the flag to the view. The fetcher only reads. `ctx.cookies` still holds the cookie the browser sent.
4. On refresh the browser no longer sends the cookie, so the form renders normally.

**Clear the cookie in `guard`, never in a `server` fetcher.** A streamed page sends its headers before the fetchers run. A cookie set by a fetcher is lost, and a refresh shows the confirmation again. `guard` and `meta` run before the headers go out.

Error states (validation failures) are fine as query params (`?error=required`) because they are expected to persist until the user corrects the form.

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

## Starting a project by hand and running `pulse start`

A project needs `"type": "module"`, the dependency `@invisibleloop/pulse`, and these scripts:

```json
{ "scripts": { "build": "pulse build", "start": "pulse start" } }
```

`pulse start` listens on the `PORT` environment variable first, then on `--port`, then on 3000. Hosts that set `PORT` need no flag. A `PORT` left in your shell overrides `--port`, and Pulse prints a warning when it does.

To allow images from another origin, add its source to the policy in `pulse.config.js`: `csp: { 'img-src': ['http://localhost:9000'] }`.

## What `pulse build` runs

`pulse build` finds the CSS classes your pages use by reading every file under `src/`. It does not render the pages, so it calls no `server` fetcher and no data source. It keeps every CSS rule that starts like a class name your code builds at run time. Two examples are `` `type-${name}` `` and `` `ui-btn--${variant}` ``.

A class that exists only in fetched data cannot be found this way. An example is a category name that comes from an API. Its CSS rule is removed from the production build. Keep it in one of two ways:

- List it: `css: { safelist: ['category-news', /^tag-/] }` in `pulse.config.js`.
- Render the pages at build time: `css: { renderPages: true }`. The build then renders each page once, with an empty context, and runs your `server` fetchers. In that render `ctx.build` is `true`, `process.env.PULSE_BUILD` is `'1'`, and `ctx.params` is empty. A fetcher that must not call a database or an API returns early:

```js
server: {
  item: async (ctx) => {
    if (ctx.build) return null
    return fetchItem(ctx.params.name)
  },
},
```

A view must still render when `server.item` is `null`. If a render fails, the build skips it and goes on.

Before version 0.38.0 the render was on by default. A project that relied on it for data-only classes now needs `renderPages: true` or a safelist.

Running in production, the health check, graceful shutdown, the error journal, third-party inline scripts and markdown pages are in `guide-ops.md`.
