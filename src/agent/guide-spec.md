Pulse is a spec-first frontend framework. Pages are JS files that export a default spec object.

## Spec structure

```js
export default {
  meta: {
    title:       'Page Title',             // string or (ctx) => string
    description: 'Meta description',       // string or (ctx) => string
    styles:      ['/app.css'],             // string[] or (ctx) => string[]
    ogTitle:     'Social title',           // optional — falls back to title
    ogImage:     'https://…/og.jpg',       // optional — 1200×630 recommended
    canonical:   'https://mysite.com/…',  // optional — string or (ctx, serverState) => string
    schema:      { '@context': 'https://schema.org', '@type': 'WebPage', … },  // optional JSON-LD
  },
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

## Key rules

- view() returns an HTML string using template literals
- **Component props are auto-escaped — pass literal strings, not HTML entities.** Use `'© 2026 Acme'` not `'&copy; 2026 Acme'`. Use `'Pricing & Plans'` not `'Pricing &amp; Plans'`. Passing HTML entities to component props double-escapes them (`&amp;amp;`, `&amp;copy;`) and shows raw entity text to the user.
- data-event="mutationName" on buttons/elements — passes the DOM event to the mutation
- data-event="change:mutationName" to fire on input change
- data-action="actionName" on <form> elements only — submits pass FormData to the action
- Do NOT use data-event on text inputs to mirror value into state — innerHTML re-renders destroy focus. Capture values from FormData in onStart or run instead.
- **`data-debounce="300"`** alongside `data-event="input:search"` — fires the mutation 300ms after the last keystroke. Use for live search, filtering. No per-spec timer code needed.
- **`data-throttle="100"`** alongside `data-event` — fires at most once per 100ms. Use for scroll or resize-like inputs. Both attributes apply to `input` and `change` events. Value is milliseconds.
- onSuccess AND onError are both required in every action (missing either will cause a runtime error)
- **`_toast`** — return `_toast: { message, variant, duration }` from any action hook (`onStart`, `onSuccess`, `onError`) or mutation to show a toast notification. It is stripped from spec state automatically — never stored. `variant`: `success` | `error` | `warning` | `info` (default). `duration`: ms before auto-dismiss (default 4000, 0 = sticky). The toast container is injected into `document.body` once and survives page navigations. Works from mutations too: `inc: (state) => ({ count: state.count + 1, _toast: { message: 'Done!' } })`.
- **`onViewError(err, state, serverState) → string`** — optional spec field. Called client-side when `view()` throws; return an HTML string to display instead of crashing. Without it the runtime renders a default inline error message. On the server, a throwing view propagates to the server error handler (500) unless `onViewError` is defined, in which case it returns a 200 with the fallback HTML.
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
