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
