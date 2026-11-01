# Running in production, and other server topics

Read this guide when you deploy a Pulse app. It also covers server topics outside page data. They are third-party inline scripts, a reverse proxy, the health check, the error journal, graceful shutdown and markdown pages. Page data, forms, cookies and `pulse start` are in `guide-server.md`.

## Third-party inline scripts — `server.nonce`

The framework auto-nonces its own inline `<script>` tags for CSP (`script-src` is nonce-restricted, not `'unsafe-inline'`). A hand-written `<script>` in a view — e.g. an ad network's or analytics tool's inline snippet that the framework doesn't generate itself — needs that same nonce or the browser blocks it as a CSP violation.

`server.nonce` is the per-request CSP nonce, available in every view with no extra setup:

```js
view: (state, server) => `
  <main id="main-content">
    <script nonce="${server.nonce}">
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  </main>`,
```

**Rules:**
- Only covers **inline** `<script>` content. An external `<script src="...">` doesn't need a nonce at all — CSP's `script-src` origin allowlist (`csp: { 'script-src': ['https://example.com'] }` in `createServer`) gates those instead; add the third party's origin there.
- Never hardcode a nonce value — it's per-request and regenerated on every response. `server.nonce` always reflects the current request's real value.
- If the third party's own SDK tries to register a [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) policy (some ad networks do), the framework's CSP restricts `trusted-types` to its own `pulse` policy — that's a separate, unrelated CSP dimension from nonces and isn't solved by `server.nonce`. It **is** extendable via `csp: { 'trusted-types': ['policy-name'] }` (merges with `pulse`, doesn't replace it) — see "Third-party scripts" in `pulse://guide/styles` for the full pattern and the explicit trade-off it represents.

## Production behind a proxy — pin the public origin

By default Pulse builds `<link rel="canonical">`, `sitemap.xml` and `robots.txt` from the request's `Host`, `X-Forwarded-Host` and `X-Forwarded-Proto` headers. Anyone can send those headers, and a CDN that ignores `Vary` will cache the result for everyone — one forged request can point every visitor's canonical URL at another domain. For a real deployment, pin the origin:

```js
// pulse.config.js
export default {
  origin: 'https://example.com',   // canonical + sitemap + robots use this; headers are ignored
}
```

It must be an absolute http(s) URL (a bad value fails at startup). `sitemap: { origin }` still wins for the sitemap if you set both. Also set `host: '127.0.0.1'` in `pulse.config.js` if a reverse proxy on the same machine is the only thing that should reach the server. `pulse dev` already listens on `127.0.0.1`; use `pulse dev --host 0.0.0.0` for phone testing or a container.

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

## Error journal — mechanized, agent-facing error tracking

In dev mode (`dev: true`), every error the three error layers above catch — plus post-hydration client view/action failures — is also recorded to `.pulse/errors.json`. This is a machine-checkable diagnostic, not a console line you have to notice: read it with `pulse_diagnose`, clear entries with `pulse_resolve_error`.

```js
// .pulse/errors.json — written automatically, never edit directly
[{ id, ts, route, phase, message, stack, resolved }]
// phase: 'view' | 'action' | 'server' | 'guard'
```

**Call `pulse_diagnose` when something seems broken and the cause isn't obvious**, or proactively after building/testing a page to confirm nothing threw during the session. Pass `{ route }` to filter to one page. `/verify` already calls this automatically before writing the stamp — an unresolved error for the target route blocks the stamp; a clean pass auto-resolves the route's entries via `pulse_stamp`. You don't need to call `pulse_resolve_error` manually in the normal `/verify` flow — only if you fixed something outside that loop and want it cleared immediately.

- Ring-buffered at 50 entries — a diagnostic tool, not a production error tracker
- `dev`-only — nothing is written in production, and the client-reporting endpoint (`/__pulse/error`) doesn't exist outside dev mode
- Never write to this file directly — it's framework-managed

## Graceful shutdown

`createServer` registers `SIGTERM` and `SIGINT` handlers automatically. When either signal arrives:

1. `server.close()` stops accepting new connections
2. Idle keep-alive sockets are destroyed immediately
3. In-flight requests are allowed to finish naturally
4. A force-exit fires after `shutdownTimeout` ms (default 30 000 ms) to prevent a stuck request from blocking a deploy

The `shutdown()` function is also returned from `createServer`, for custom process managers. It finishes by **ending the process** (`process.exit`). Do not call it in a test. The test runner is cut off before it reports, and the run can look like a pass. `createServer` is async, so `await` it:

```js
const { server, shutdown } = await createServer(specs, {
  port: 3000,
  shutdownTimeout: 10000,  // override default 30 s grace period
})

// Call manually when needed (SIGTERM is already wired up automatically)
shutdown()
```

In a test, start the server on port `0` and close the `server` yourself:

```js
const { server } = await createServer(specs, { port: 0, host: '127.0.0.1' })
if (!server.listening) await new Promise((resolve) => server.once('listening', resolve))  // createServer resolves before the port is bound
const base = `http://127.0.0.1:${server.address().port}`
// ... fetch(base + '/contact') ...
server.closeAllConnections()
await new Promise((resolve) => server.close(resolve))
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
}
```

A missing file makes the fetcher throw an error with `status: 404`, and the server answers that with a **404**: your `*` page if you have one, otherwise the default. You do not need `onViewError` for it (that is for a view that throws). Call `md()` in `meta` as above: the status is only still changeable before the response starts, so in streaming mode (the default) a 404 thrown from a plain `server` fetcher arrives too late; `meta` functions and `guard` run first.

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
