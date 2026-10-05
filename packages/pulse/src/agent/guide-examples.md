## Pattern: action with validation and field errors

The correct wiring for a form action with per-field validation errors. `onStart` captures `FormData` before `validate` runs (uncontrolled inputs — never use `data-event` to mirror input values). `validate: true` runs the spec's `validation` rules before `run`. Field errors are surfaced via `state.errors`.

```js
export default {
  route: '/signup',
  meta: { title: 'Sign up', styles: ['/pulse-ui.css', '/app.css'] },
  state: {
    status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
    errors: [],
    fields: { name: '', email: '' },
  },
  validation: {
    'fields.name':  { required: true, minLength: 2 },
    'fields.email': { required: true, format: 'email' },
  },
  actions: {
    submit: {
      onStart: (state, formData) => ({
        status: 'loading',
        errors: [],
        fields: { name: formData.get('name') ?? '', email: formData.get('email') ?? '' },
      }),
      validate: true,
      run: async (state, serverState, formData) => {
        const res = await fetch('/api/signup', { method: 'POST', body: formData })
        if (!res.ok) {
          let message = `Request failed: ${res.status}`
          try { const j = await res.json(); message = j.message || j.error || message } catch {}
          throw new Error(message)
        }
        return await res.json()
      },
      onSuccess: (state, result) => ({
        status: 'success',
        _toast: { message: 'Account created!', variant: 'success' },
      }),
      onError: (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
        _toast: { message: 'Please check the form', variant: 'error' },
      }),
    },
  },
  view: (state) => `
    <main id="main-content">
      ${state.status === 'success'
        ? `<p>You're signed up.</p>`
        : `<form data-action="submit" class="u-flex u-flex-col u-gap-4">
            ${input({ name: 'name',  label: 'Name',  value: state.fields.name,
              error: state.errors.find(e => e.field === 'fields.name')?.message })}
            ${input({ name: 'email', label: 'Email', type: 'email', value: state.fields.email,
              error: state.errors.find(e => e.field === 'fields.email')?.message })}
            ${button({ label: state.status === 'loading' ? 'Saving…' : 'Sign up',
              type: 'submit', variant: 'primary',
              attrs: state.status === 'loading' ? 'aria-busy="true" disabled' : '' })}
          </form>`
      }
    </main>
  `,
}
```

**Key points:**
- `onStart` captures `FormData` into state so field values survive the re-render
- `validate: true` runs before `run()` — validation errors arrive in `onError` as `err.validation`
- Always check `err?.validation` first; fall back to `err.message`
- `aria-busy="true"` on the submit button while loading — spinner alone is not sufficient for accessibility
- `res.ok` checked before parsing; never use `await res.text()` as an error message

---

## Pattern: server data with dynamic route and missing-data fallback

The correct pattern for a dynamic route that loads data from a server fetcher. Always add `onViewError` — a missing or invalid param must not produce a 500.

```js
import { md }   from '@invisibleloop/pulse/md'
import { prose } from '@invisibleloop/pulse/ui'

const post = md('content/blog/:slug.md')

export default {
  route: '/blog/:slug',
  meta: {
    title:       async (ctx) => (await post(ctx)).frontmatter.title ?? 'Post not found',
    description: async (ctx) => (await post(ctx)).frontmatter.description ?? '',
  },
  server: { post },
  view: (state, server) => `
    <main id="main-content">
      <h1>${server.post.frontmatter.title}</h1>
      ${prose({ content: server.post.html })}
    </main>
  `,
  onViewError: (err) => `
    <main id="main-content">
      <p>Post not found. <a href="/blog">Back to blog</a></p>
    </main>
  `,
}
```

**Key points:**
- Call the same `md()` fetcher in both `meta` and `server` — it caches on `ctx._mdCache`, file is read once
- `onViewError` is required on any dynamic route where the view can receive null/missing data
- For database-backed routes: validate `ctx.params.id` before use; return a 404-equivalent via `onViewError` if not found
- Use `?.` and `??` throughout the view when server data can be null

---

## Pattern: streaming SSR with scoped fetchers

Use streaming when a page has slow data (feeds, lists, analytics) and you want the shell to paint instantly. `scope` prevents slow fetchers from blocking the shell.

```js
export default {
  route: '/dashboard',
  meta: { title: 'Dashboard', styles: ['/pulse-ui.css', '/app.css'] },
  state: {},
  server: {
    user:  async (ctx) => db.users.findByCookie(ctx.cookies.session),  // fast
    feed:  async () => fetchFeed(),   // slow
    ads:   async () => fetchAds(),    // slow
  },
  stream: {
    shell:    ['header'],
    deferred: ['feed'],
    scope: {
      header: ['user'],        // shell sends as soon as 'user' resolves
      feed:   ['feed', 'ads'], // deferred sends when both resolve
    },
  },
  view: {
    header: (state, server) => `
      <header>
        <p>Hello, ${server.user?.name ?? 'Guest'}</p>
      </header>
    `,
    feed: (state, server) => `
      <ul>
        ${server.feed.map(item => `<li data-key="${item.id}">${item.title}</li>`).join('')}
      </ul>
    `,
  },
}
```

**Key points:**
- `view` must be a named object of functions — not a single function — when using `stream`
- `scope` is optional but important: without it the shell waits for all fetchers
- `data-key` on list items enables O(1) keyed reconciliation when the list updates client-side
- A fetcher listed in `scope.header` but slow will delay the shell — keep shell fetchers fast

---

## Pattern: global store subscription and `_storeUpdate`

Use the global store for data shared across pages (user session, cart, theme). Read store data via `spec.store`; push changes back with `_storeUpdate` from `onSuccess`.

```js
// Page that reads from store and updates it on save
export default {
  route: '/settings',
  store: ['user', 'settings'],   // declares which store keys this page subscribes to
  meta: { title: 'Settings', styles: ['/pulse-ui.css', '/app.css'] },
  state: { status: 'idle' },
  actions: {
    save: {
      onStart: (state, formData) => ({ status: 'loading' }),
      run: async (state, serverState, formData) => {
        const theme = formData.get('theme')
        const res = await fetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify({ theme }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error(`Save failed: ${res.status}`)
        return { theme }
      },
      onSuccess: (state, { theme }) => ({
        status: 'idle',
        _storeUpdate: { settings: { theme } },  // merged into store; all subscribed pages re-render
        _toast: { message: 'Saved', variant: 'success' },
      }),
      onError: (state, err) => ({
        status: 'error',
        _toast: { message: err.message, variant: 'error' },
      }),
    },
  },
  view: (state, server) => `
    <main id="main-content">
      <form data-action="save" class="u-flex u-flex-col u-gap-4">
        ${select({ name: 'theme', label: 'Theme',
          options: [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }],
          value: server.settings?.theme ?? 'dark' })}
        ${button({ label: state.status === 'loading' ? 'Saving…' : 'Save', type: 'submit', variant: 'primary' })}
      </form>
    </main>
  `,
}
```

**Key points:**
- `spec.store` declares subscriptions — store data appears in the view's `server` argument
- `_storeUpdate` is stripped from page state and merged into the store — do not store it
- All pages subscribed to the affected store keys re-render without a server round-trip
- Never use a full page reload to propagate shared state changes — use `_storeUpdate`

---

## Pattern: guard with auth redirect

Use `guard` to protect routes. It runs before server fetchers. Return `{ redirect }` to send unauthenticated users elsewhere.

```js
export default {
  route: '/account',
  meta: { title: 'Account', styles: ['/pulse-ui.css', '/app.css'] },
  server: {
    user: async (ctx) => db.users.find(ctx.cookies.session),
  },
  guard: async (ctx) => {
    const user = await db.users.findByCookie(ctx.cookies.session)
    if (!user) return { redirect: '/login?next=/account' }
  },
  state: {},
  view: (state, server) => `
    <main id="main-content">
      <h1>Hello, ${server.user?.name}</h1>
    </main>
  `,
}
```

**Key points:**
- `guard` runs before server fetchers — returning `{ redirect }` short-circuits the entire request
- Return nothing (or `undefined`) to allow the request through
- For shared auth logic, extract to a helper and call it from `guard` on each protected spec
- `ctx.cookies` is available in `guard` — check session cookies here, not in the view

---

## Pattern: keyed list with client mutations

Use `data-key` on repeated elements whenever a list can be reordered, filtered, or have items added/removed client-side.

```js
export default {
  route: '/todos',
  meta: { title: 'Todos', styles: ['/pulse-ui.css', '/app.css'] },
  state: {
    items: [
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Write spec', done: false },
    ],
    filter: 'all',  // 'all' | 'active' | 'done'
  },
  mutations: {
    toggle: (state, e) => {
      const id = Number(e.target.closest('[data-id]').dataset.id)
      return { items: state.items.map(i => i.id === id ? { ...i, done: !i.done } : i) }
    },
    setFilter: (state, e) => ({ filter: e.target.value }),
  },
  view: (state) => {
    const visible = state.items.filter(i =>
      state.filter === 'all' ? true : state.filter === 'done' ? i.done : !i.done
    )
    return `
      <main id="main-content">
        <ul>
          ${visible.map(item => `
            <li data-key="${item.id}" data-id="${item.id}">
              <button data-event="toggle" aria-pressed="${item.done}">${item.text}</button>
            </li>
          `).join('')}
        </ul>
        <select data-event="change:setFilter" aria-label="Filter todos">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
        </select>
      </main>
    `
  },
}
```

**Key points:**
- `data-key` must be on every sibling element in the container — mixed keyed/unkeyed falls back to position matching
- Use `e.target.closest('[data-id]')` in mutations — never assume `e.target` is the element with the attribute
- `aria-pressed` on toggle buttons communicates state to screen readers
- Mutations are pure — no fetch, no DOM access, return partial state only

---

## Pattern: persist — what belongs and what doesn't

`persist` survives page reload via `localStorage`. Only serialisable, user-owned state that should survive a refresh belongs here.

```js
export default {
  route: '/builder',
  meta: { title: 'Builder', styles: ['/pulse-ui.css', '/app.css'] },
  state: {
    // ✓ persist these — user-owned, meaningful across sessions
    items:      [],
    activeStep: 0,
    draft:      { name: '', description: '' },

    // ✗ do NOT persist these — ephemeral UI state
    status:     'idle',
    errors:     [],
    modalOpen:  false,
  },
  persist: ['items', 'activeStep', 'draft'],
  mutations: {
    nextStep: (state) => ({ activeStep: Math.min(state.activeStep + 1, 3) }),
    prevStep: (state) => ({ activeStep: Math.max(state.activeStep - 1, 0) }),
  },
  view: (state) => `<main id="main-content">…</main>`,
}
```

**Key points:**
- Never persist `status`, `errors`, loading flags, or modal open state — these are session-only
- Never persist large objects or arrays that could grow unbounded — `localStorage` has a ~5MB limit
- Restored persist values override spec defaults on mount and trigger a re-render if different
- `persist` keys must exist in `state` — persisting a key not in state has no effect
