## Pulse cheat sheet — the rules that decide most builds

Read this first. It is a summary: each section names the full guide to open only if you hit that topic.

### Shape of a site

- **One spec = one route = one file** in `src/pages/`. Every `.js` file there is a route; there is no registration step.
- **A dynamic route is still one spec**: `route: '/pokemon/:name'` serves every URL. Never one file per item.
- Shared nav, footer and layout live in `src/components/` and are imported by each page. Put `<main id="main-content">` in the layout once.
- Always `export default { ... }` with `server`, `guard`, `submit` and `meta` written inline in that object. A spread (`...base`) or a built spec object fails `pulse build`.

### A page

```js
import { layout } from '../components/layout.js'

export default {
  route: '/pokemon/:name',
  meta: {
    title: async (ctx) => {                       // meta is a plain object; its fields may be functions
      const p = await load(ctx)
      if (!p) throw Object.assign(new Error('Not found'), { status: 404 })
      return p.name
    },
    description: 'Short description.',
    theme: 'light',                               // unset means DARK. Decide when you write the page.
    styles: ['/pulse-ui.css', '/theme.css', '/app.css'],   // component css, then tokens, then your css
  },
  server: { pokemon: (ctx) => load(ctx) },        // runs in parallel before render; arrives as the view's 2nd argument
  view: (state, { pokemon }) => layout({ activePath: '/', content: `<h1>${pokemon.name}</h1>` }),
}

const load = (ctx) => ((ctx._cache ??= {}).p ??= fetchPokemon(ctx.params.name))   // meta and server share one fetch
```

- `view` returns an HTML string from a template literal. HTML attributes are `class=` and `for=`, not React names.
- Component props are escaped: pass `'© 2026'`, never `'&copy; 2026'`.
- Escape any data you put into HTML yourself. Server data is readable in the page source, so return only the fields the view uses.
- A streaming page sends status 200 before the body. To answer 404 for an unknown id, throw an error with `status: 404` from `meta` or `guard`, as above. Rendering "not found" text from `view` stays 200.
- `ctx` holds `params`, `query`, `headers`, `cookies`. The page cache ignores the query string: list keys that change the output in `cacheVary: ['q', 'page']`.
- Add a spec with `route: '*'` for a branded 404 page, built with the shared layout.

### Interactive pages (only when the page needs it)

- `state`, `mutations` (sync, return partial state), `actions` (async: `onStart`, `run`, `onSuccess`, `onError`; both outcome hooks are required).
- `data-event="name"` for clicks, `data-event="input:name"` plus `data-debounce="300"` for live search, `data-action="name"` on a `<form>`.
- Do not mirror a text input into state with `data-event`: the re-render destroys focus. Read the values from `FormData` in `onStart` or `run`.
- Repeated elements in a list: give every sibling a `data-key`.
- A page with no state, mutations, actions or persist ships no JavaScript. Leave `state` out.
- Forms that must work without JavaScript use `submit: async (ctx) => {...}`, put `${server.csrf}` inside the `<form>`, and return `{ redirect }` after success. `ctx.formData()` there is a plain object (`data.email`), not a browser `FormData` (no `.get`).

### Styles

- `meta.styles` loads in order: `/pulse-ui.css`, `/theme.css`, `/app.css`. Interactive components such as the mobile nav and `modal` also need `meta.scripts: ['/pulse-ui.js']`.
- **Hex colours live only in `public/theme.css`.** `app.css` and any other CSS file use `var(--ui-*)` tokens. The lint blocks hex there.
- No inline `style=""`. Use classes.
- `pulse build` removes CSS rules for class names it cannot find in `src/`. A class that exists only in fetched data (a category name from an API) loses its rule in production but works in dev. Select on a `data-` attribute (`[data-type="fire"]`), or list it in `pulse.config.js`: `css: { safelist: [/^type-/] }`.
- Import ready-made components from `@invisibleloop/pulse/ui` before hand-writing a button, card, hero, nav or the like (props: `pulse://guide/components`).

### Run and check

- `pulse start` listens on `PORT`, then `--port`, then 3000. A `PORT` left in your shell overrides `--port`.
- Images from another origin need `csp: { 'img-src': ['http://localhost:9000'] }` in `pulse.config.js`.
- Build with `pulse build` and check with the `pulse_validate` tool after each spec you write.

### Open the full guide only for

| Need | Read |
|---|---|
| Spec fields in full, streaming segments, form layout | `pulse://guide/spec` |
| Store, `persist`, cookies, redirects, post bodies, SSE | `pulse://guide/server` |
| Theming tokens, vibes, fonts, third-party scripts | `pulse://guide/styles` |
| Layout component, redirects map, sitemap, canonical URLs | `pulse://guide/routing` |
| Component props | `pulse://guide/components` |
| New branded page or site (intake, sketch, approvals) | `pulse://workflow` |
