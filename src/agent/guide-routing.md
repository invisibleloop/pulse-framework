## Multi-page sites — the right patterns

### Shared layout component

When a project has more than one page, **never repeat the nav and footer in every spec**. Extract them into a shared component:

```js
// src/components/layout.js
import { nav, footer, button } from '@invisibleloop/pulse/ui'

export const NAV_LINKS = [
  { label: 'Home',    href: '/' },
  { label: 'About',  href: '/about' },
  { label: 'Blog',   href: '/blog' },
]

export const layout = ({ content, activePath = '' }) => `
  ${nav({
    logo: 'My Site',
    logoHref: '/',
    links: NAV_LINKS.map(l => ({
      ...l,
      attrs: activePath === l.href ? 'aria-current="page"' : '',
    })),
    action: button({ label: 'Sign up', href: '/signup', variant: 'primary', size: 'sm' }),
  })}
  <main id="main-content">
    ${content}
  </main>
  ${footer({
    logo: 'My Site',
    links: NAV_LINKS,
    legal: '© 2026 My Site',
  })}
`
```

Each page spec uses it:
```js
import { layout } from '../components/layout.js'

export default {
  route: '/about',
  view: () => layout({
    activePath: '/about',
    content: `<h1>About us</h1>`,
  }),
}
```

**Rules:**
- Add new nav links in `src/components/layout.js` only — never hardcode nav links in individual page specs.
- Pass `activePath` so the active nav item gets `aria-current="page"` — this is required for Lighthouse accessibility.
- The `layout()` component must include `<main id="main-content">` — do not add it again inside `content`.

### Skip link

Add a skip link before the nav for keyboard users. It must be the first focusable element on every page:

```js
// src/components/layout.js
export const SKIP_LINK = `<a href="#main-content" class="skip-link">Skip to main content</a>`

// public/app.css
.skip-link {
  position: absolute;
  left: -9999px;
  top: var(--ui-space-2);
  z-index: 9999;
  padding: var(--ui-space-2) var(--ui-space-4);
  background: var(--ui-accent);
  color: var(--ui-bg);
  font-weight: 600;
}
.skip-link:focus { left: var(--ui-space-2); }
```

Include it at the top of every layout: `${SKIP_LINK}${nav({...})}`.

### Active nav state

The active page link must have `aria-current="page"`. Without it Lighthouse accessibility fails.

The pattern above uses `attrs` — alternatively, use CSS with `:not` and a body class, or check `ctx` in the server fetcher and pass a flag to the view. Any approach is fine; the output must be `aria-current="page"` on the matching link.

### Shared state across pages

Use the global store (`pulse.store.js`) for state that needs to be consistent across pages — user session, cart count, theme preference. Do not duplicate server fetchers across specs for the same data.

See `pulse://guide/server` for the full store API.

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

## Custom 404 page

Create a spec with `route: '*'` — it renders through the normal pipeline (layout, styles, hydration) with status 404 whenever no route matches:

```js
// src/pages/not-found.js
import { layout } from '../components/layout.js'

export default {
  route: '*',
  meta:  { title: 'Page not found', styles: ['/pulse-ui.css', '/theme.css', '/app.css'] },
  view:  () => layout({
    content: `<h1>Page not found</h1><p>That page doesn't exist. <a href="/">Back home</a></p>`,
  }),
}
```

- Use the shared `layout()` so the 404 carries the site's nav and footer.
- **Every site should have one** — without it, visitors to a bad URL get the framework's unbranded default 404.
- 500 errors are customised via `createServer`'s `onError` option, not a spec.

## Sitemap & robots.txt

Enable in `pulse.config.js` / `createServer` — the framework serves `/sitemap.xml` and `/robots.txt` generated from the registered routes:

```js
// pulse.config.js
export default {
  sitemap: true,                              // or { origin: 'https://mysite.com' } to pin the origin
}
```

- **Static routes are included automatically.** Excluded by default: `route: '*'`, raw content specs, guarded pages (set `sitemap: true` on the spec to opt a guarded page in), and `sitemap: false` pages.
- **Dynamic `:param` routes need an enumerator** or they are skipped (a startup hint lists them):

```js
export default {
  route:   '/blog/:slug',
  sitemap: async () => (await db.posts.list()).map(p => ({ path: `/blog/${p.slug}`, lastmod: p.updatedAt })),
  // entries can be '/path' strings or { path, lastmod } objects
}
```

- `robots: false` disables robots.txt; a string serves verbatim. A physical `sitemap.xml`/`robots.txt` in `staticDir` always wins over the generated one.
- **Always enable this on production sites** — it is one config line and crawlers need it.

## Canonical URLs

Pulse auto-derives a canonical URL from every request and emits `<link rel="canonical">` in the `<head>`. No config needed in most cases.

Override with `meta.canonical` when content is accessible at multiple URLs, or for paginated series:

```js
// Static override
meta: { canonical: 'https://mysite.com/blog' }

// From URL params (works in both streaming and string mode)
meta: { canonical: (ctx) => `https://mysite.com/products/${ctx.params.slug}` }

// From server data — e.g. canonical slug from a DB lookup
// Only works when stream: false. In streaming mode serverState is null at head-write time.
meta: { canonical: (ctx, serverState) => `https://mysite.com/products/${serverState.product.slug}` }
```

The function signature is `(ctx, serverState) => string`. `serverState` is only populated on the string (non-streaming) path — if your canonical depends on server fetcher results, add `stream: false` to that spec.
