## Spec review checklist

Before finishing any spec, verify every point below. Fix anything that fails.

### Critical

- **`meta` must be a plain object — never a function.** Individual fields (`title`, `description`, `styles`) can be `async (ctx) => value` functions, but `meta` itself is always `{}`.

  ```js
  // WRONG — meta is not a function factory
  meta: async (ctx) => ({ title: '...', styles: [...] })

  // CORRECT — meta is a plain object; individual fields are functions
  meta: {
    title:       async (ctx) => (await post(ctx)).frontmatter.title,
    description: async (ctx) => (await post(ctx)).frontmatter.description,
    styles:      ['/pulse-ui.css', '/app.css'],
  }
  ```

- **Do not set `hydrate` in specs.** It is auto-derived by the framework from the URL entry passed to `createServer`. Specs with `mutations`, `actions`, or `persist` are hydrated automatically. Purely server-rendered specs get zero JavaScript — no configuration needed.

### Components first

- **Before writing any HTML by hand, check `src/ui/index.js`.** There are 50+ components. Use `button`, `card`, `alert`, `input`, `spinner`, `badge`, `modal`, `nav`, `pagination`, `table`, etc. before writing equivalent HTML from scratch.

### Reuse (DRY)

- **Extract a view helper when the same HTML pattern appears 3 or more times in a single spec.** A plain JS function returning an HTML string is sufficient — no framework needed:
  ```js
  const card = ({ title, body }) => `<div class="card"><h3>${title}</h3><p>${body}</p></div>`
  ```
- **Create a shared component in `src/ui/` when the same pattern is needed across 2 or more different specs.** Follow the existing pattern: a named export that returns an HTML string.
- **Do not abstract a pattern that appears only once.** Duplication is cheaper than the wrong abstraction. Wait until the third use before extracting.

### Correctness

- Mutations return plain partial-state objects and have no side effects (no fetch, no DOM access).
- `persist` contains only serialisable state that should survive a page reload — not ephemeral UI state like a loading flag or temporary selection.
- `e.target` assumptions in mutations are safe if the element has child nodes — use `e.target.closest('[data-index]')` rather than assuming `e.target` is the element with the attribute.
- State shape is consistent — avoid a single field that is sometimes `null`, sometimes a string, sometimes a boolean. Use a dedicated `status` field instead.
- **Never use `state.modalOpen` or conditional modal rendering.** This destroys the `<dialog>` on every render, breaking focus, animation, and native ESC handling. Instead, always render the `<dialog>` in the DOM and use `data-dialog-open="id"` to open it — the runtime handles this without any spec state:
  ```html
  <!-- always in the view, never conditional -->
  ${modal({ id: 'confirm', title: 'Confirm', content: '...' })}
  <!-- anywhere on the page — opens the dialog, no mutation needed -->
  ${modalTrigger({ target: 'confirm', label: 'Open' })}
  <!-- or inline: -->
  <button data-dialog-open="confirm">Open</button>
  ```
  Close is handled natively by `<form method="dialog">` (inside the modal), ESC key, backdrop click, or `data-dialog-close` on any element.

### Defensive data handling

- **Always check `res.ok` before parsing fetch responses.** Never call `res.json()` on a response that may have failed. Never use `await res.text()` as an error message — on a 404 or 500, this returns raw HTML which surfaces directly in toasts and error alerts. The correct pattern:
  ```js
  const res = await fetch('/api/...')
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try { const j = await res.json(); message = j.message || j.error || message } catch {}
    throw new Error(message)
  }
  return await res.json()
  ```
- **Never assume the shape of data from external APIs or server fetchers.** Use optional chaining (`?.`) and nullish coalescing (`??`) at every access point. If a server fetcher can return `null`, the view must handle it — `server.user?.name ?? 'Guest'` not `server.user.name`.
- **Validate FormData fields before use.** `formData.get('email')` returns `null` if the field is missing. Check for null/empty before passing to an API or database.
- **Do not trust URL params.** `ctx.params.id` is a raw string from the URL. Validate it before use — check it exists, is the right type, and refers to a real resource. Return a 404 or redirect if it doesn't.

### CSS

- **`app.css` must contain no hex values or raw colour values.** A lint hook enforces this and will block the build. Hex values belong in `public/theme.css` as token definitions; `app.css` references them via `var()` only.
- **Load order in `meta.styles`:** `pulse-ui.css` → `theme.css` → `app.css`. Theme tokens must be defined before `app.css` references them.

### Security

- Any value from user input (URL params, form fields, external APIs) interpolated into view HTML must be escaped.

### Tests

- Pure logic functions extracted from a spec (e.g. `checkResult`, `validate`, `formatPrice`) must have unit tests in a corresponding `.test.js` file.
- **When fixing a bug, write a failing test first.** The test must reproduce the bug before the fix is applied, then pass after. This pins the behaviour so the bug cannot silently return. A fix without a regression test is incomplete.
- **Use `renderSync` / `render` from `@invisibleloop/pulse/testing` to test view HTML output.** Do not test views with raw `html.includes()` — use the query helpers instead:
  ```js
  import { renderSync, render } from '@invisibleloop/pulse/testing'

  // Sync — call view directly with mock state/server
  const result = renderSync(mySpec, { state: { count: 5 }, server: { items: [] } })
  assert(result.has('button'))
  assert.equal(result.get('#count').text, '5')
  assert.equal(result.count('li'), 0)

  // Async — run real server fetchers (integration), or pass server to skip them
  const result = await render(mySpec, { server: { product: mockProduct } })
  assert.equal(result.get('h1').text, mockProduct.name)
  assert.equal(result.attr('img', 'src'), mockProduct.image)
  ```
  Supported selectors: `tag`, `.class`, `#id`, `[attr]`, `[attr="value"]`, and combinations (`button.primary[disabled]`).

### Markdown

- **Use `md()` from `@invisibleloop/pulse/md` for `.md` file content.** Never read and parse markdown manually. Pass the result's `html` to `prose()`.
- **Call the same `md()` fetcher in both `meta` and `server`** — it caches on `ctx._mdCache` so the file is only read once per request. Do not create two separate fetchers for the same file.
- **Always add `onViewError` on dynamic markdown routes** (routes with `:param` segments loading `.md` files). A missing file throws `{ status: 404 }` which must be caught gracefully.

### View error handling

- **Define `onViewError` on any page where the view could throw due to bad or missing data.** Without it, a runtime view error returns a 500 on the server and shows a generic inline message on the client. With it, the server returns 200 with your fallback HTML instead of a 500, and the client renders your fallback:
  ```js
  onViewError: (err, state, serverState) => `
    <div class="u-p-4 u-text-center">
      <p>Something went wrong. <a href="">Reload</a></p>
    </div>
  `
  ```
  Use this on pages that render data from external APIs or user-supplied content — any path where the view can encounter `null`, `undefined`, or unexpected shapes that would cause a crash. It is not required on simple pages with predictable data.

### Store updates from actions

- **Use `_storeUpdate` to push changes to the global store from an action.** Return it from `onSuccess` alongside the local state update — it is stripped from page state and forwarded to the store. All mounted pages that subscribe to the affected keys re-render immediately:
  ```js
  onSuccess: (state, theme) => ({
    saved:        true,
    _storeUpdate: { settings: { theme } },  // ← merged into store state
  }),
  ```
  `_storeUpdate` only merges into the store — it does not appear in the page's own state. The rest of the return is merged into local state as normal. Use this instead of a full-page reload when a user action changes shared data (theme, cart count, user profile, etc.).

### Accessibility

- Interactive elements without visible text have an `aria-label`.
- Disabled state is reflected with the `disabled` attribute, not just CSS.
- The page has a `<main id="main-content">` landmark.
