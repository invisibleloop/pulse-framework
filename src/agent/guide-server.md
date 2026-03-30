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

**Define the store** in `pulse.store.js`:
```js
// pulse.store.js
export default {
  hydrate: '/pulse.store.js',                   // browser-importable path — required for mutations

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
      if (!data.email) return { redirect: '/contact?error=required' }
      await db.leads.create(data)
      // Flash cookie — consumed once, clears on next GET (see server fetcher below)
      ctx.setCookie('flash_sent', '1', { maxAge: 30 })
      return { redirect: '/contact' }
    }
  },

  server: {
    status: async (ctx) => {
      const sent = ctx.cookies.flash_sent === '1'
      if (sent) ctx.setCookie('flash_sent', '', { maxAge: 0 })  // clear immediately
      return { sent, error: ctx.query?.error ?? null }
    },
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
2. In the `server.*` fetcher on the subsequent GET: read the cookie, then clear it immediately with `maxAge: 0`.
3. Pass the flag to the view. On refresh the cookie is gone — the form renders normally.

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

## Health check endpoint

Pulse exposes a built-in health check at `/healthz` by default. It responds **before** `onRequest`, static files, and route matching — so load balancers always get a response.

```
GET /healthz → 200 OK
{ "status": "ok", "uptime": 42.3 }
```

Configure the path or disable it:

```js
createServer(specs, {
  healthCheck: '/ping',   // custom path
  // healthCheck: false,  // disable
})
```

Key properties:
- Bypasses `onRequest` — a faulty hook can't accidentally block health checks
- `HEAD /healthz` is supported (no body)
- `Cache-Control: no-store` — proxies never serve a stale health status
- Fires before route matching — a user spec at `/healthz` is shadowed when the built-in is enabled

## Graceful shutdown

`createServer` registers `SIGTERM` and `SIGINT` handlers automatically. When either signal arrives:

1. `server.close()` stops accepting new connections
2. Idle keep-alive sockets are destroyed immediately
3. In-flight requests are allowed to finish naturally
4. A force-exit fires after `shutdownTimeout` ms (default 30 000 ms) to prevent a stuck request from blocking a deploy

The `shutdown()` function is also returned from `createServer` so you can trigger it programmatically (useful in tests or custom process managers):

```js
const { server, shutdown } = createServer(specs, {
  port: 3000,
  shutdownTimeout: 10000,  // override default 30 s grace period
})

// Call manually when needed (SIGTERM is already wired up automatically)
shutdown()
```

`shutdown()` is idempotent — calling it multiple times is safe.

## Markdown

Pulse has a built-in markdown parser. Use it for any content written in `.md` files — blog posts, documentation, static pages. All parsing happens server-side. Zero browser JS.

### `md(pathPattern)` — file helper

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

Returns `{ html, frontmatter }`. `html` goes into `prose()`. `frontmatter` is the parsed `---` block.

### Frontmatter for meta tags

The same fetcher can be called in both `meta` and `server` — the file is only read once per request (cached on `ctx._mdCache`):

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

Always add `onViewError` on dynamic markdown routes — if the file does not exist the fetcher throws `{ status: 404 }`.

### `parseMd(source)` — string parser

For markdown from a database or API rather than a file:

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
