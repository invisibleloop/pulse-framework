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

**Testing `pulse.store.js` — put the test file next to it, at the project root, not under `src/`.** `npm test` runs `src/**/*.test.js` and also `*.test.js` at the project root. The root pattern is what picks up `pulse.store.test.js`. A store test under `src/pages/`, placed there out of habit from the page-test convention, still runs. But `pulse.store.test.js` itself only runs from the root. Import the store the normal relative way: `import store from '../pulse.store.js'` from `src/pages/`, or `import store from './pulse.store.js'` from the root.

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

For data that changes on the **server** (stock levels, live scores, announcements), enable the live channel and broadcast with `pushStore`. Subscribed pages re-render without polling or any client code:

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
