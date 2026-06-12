import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/routing')

export default {
  route: '/routing',
  meta: {
    title: 'Routing — Pulse Docs',
    description: 'How Pulse routes requests to page specs — static and dynamic routes, params, and conventions.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/routing',
    prev,
    next,
    content: `
      ${h1('Routing')}
      ${lead('Every route in Pulse is explicitly declared in the spec. There is no file-based routing, no magic directory conventions, and no implicit mapping. Every page\'s URL is visible in its spec file and nowhere else.')}

      ${section('route-field', 'The route field')}
      <p>Every spec has a <code>route</code> field. This is the URL pattern the spec handles:</p>
      ${codeBlock(highlight(`export default {
  route: '/about',
  view: () => \`<h1>About</h1>\`,
}`, 'js'))}
      <p>Pulse matches the exact path. By default, trailing slashes are removed — <code>/about/</code> redirects to <code>/about</code> with a 301. This is controlled by the <code>trailingSlash</code> option in <code>createServer</code>:</p>
      ${table(
        ['Value', 'Behaviour'],
        [
          ['<code>"remove"</code> (default)', 'Redirects <code>/about/</code> → <code>/about</code> (301)'],
          ['<code>"add"</code>', 'Redirects <code>/about</code> → <code>/about/</code> (301)'],
          ['<code>"allow"</code>', 'Serves both — no redirect'],
        ]
      )}
      ${codeBlock(highlight(`createServer(specs, {
  trailingSlash: 'add', // enforce trailing slashes
})`, 'js'))}

      ${section('dynamic', 'Dynamic segments')}
      <p>Use a colon prefix for dynamic path segments. Named segments are captured and available in <code>ctx.params</code> in <a href="/server-data">server data</a>:</p>
      ${codeBlock(highlight(`export default {
  route: '/products/:id',
  state: { quantity: 1 },
  server: {
    data: async (ctx) => {
      // ctx.params.id is the captured segment
      const product = await db.products.find(ctx.params.id)
      return { product }
    },
  },
  view: (state, server) => \`<h1>\${server.product.name}</h1>\`,
}`, 'js'))}

      ${section('multi-segment', 'Multiple dynamic segments')}
      <p>Any number of dynamic segments can appear in a route:</p>
      ${codeBlock(highlight(`route: '/blog/:year/:month/:slug'
// Matches: /blog/2025/03/my-first-post
// ctx.params = { year: '2025', month: '03', slug: 'my-first-post' }`, 'js'))}

      ${section('registering', 'Registering routes')}
      <p>Specs are registered explicitly by passing them to <code>createServer</code> as an array. Routes are matched in order — more specific routes must come before more general ones:</p>
      ${codeBlock(highlight(`import { createServer } from '@invisibleloop/pulse'
import home     from './src/pages/home.js'
import products from './src/pages/products.js'
import product  from './src/pages/product.js'   // more specific — comes first
import blog     from './src/pages/blog.js'

createServer([home, product, products, blog], { port: 3000 })`, 'js'))}

      ${section('query', 'Query strings')}
      <p>Query string parameters are not part of the route pattern but are accessible via <code>ctx.query</code> in server data:</p>
      ${codeBlock(highlight(`// URL: /products?category=shoes&sort=price
server: {
  data: async (ctx) => {
    const { category, sort } = ctx.query
    return { products: await db.products.list({ category, sort }) }
  },
}`, 'js'))}

      ${section('redirects', 'Redirects')}
      <p>Migrating an existing site? Preserve the old URLs with the <code>redirects</code> map — legacy links and search rankings survive the move:</p>
      ${codeBlock(highlight(`await createServer(pages, {
  redirects: {
    '/old-blog/:slug': '/blog/:slug',                 // 301 — :params carry over
    '/pricing-2024':   '/pricing',                    // 301 (default)
    '/promo':          { to: '/sale', status: 302 },  // temporary redirect
    '/moved/:slug':    'https://other.com/:slug',     // absolute targets for domain moves
  },
})`, 'js'))}
      <p>Redirects respond <strong>301</strong> by default (permanent — search engines transfer ranking to the target). Use <code>{ to, status }</code> for <code>302</code>, <code>307</code>, or <code>308</code>. The query string is preserved, redirects apply to GET/HEAD only, and the map is validated at startup — a bad entry fails the boot rather than silently misrouting traffic.</p>
      ${callout('note', 'Redirects are checked before route matching, so a redirect source that equals a registered route shadows the page — the server logs a startup warning when that happens. Occasionally intentional (retiring a page), usually a mistake.')}

      ${section('not-found', '404 handling')}
      <p>If no spec matches the incoming request path, Pulse returns a 404. To customise it, create a spec with <code>route: '*'</code> — it renders through the normal pipeline (layout, styles, components) with status 404:</p>
      ${codeBlock(highlight(`export default {
  route: '*',
  meta:  { title: 'Page not found', styles: ['/pulse-ui.css', '/theme.css', '/app.css'] },
  view:  () => \`<main id="main-content"><h1>Page not found</h1><p><a href="/">Back home</a></p></main>\`,
}`, 'js'), 'src/pages/not-found.js')}
      <p>See <a href="/error-pages">Error Pages</a> for the full behaviour, including 500 handling.</p>

      ${section('conventions', 'File naming conventions')}
      <p>While Pulse does not auto-discover files, the recommended convention maps file names to routes:</p>
      ${table(
        ['File', 'Route'],
        [
          ['<code>src/pages/home.js</code>', '<code>/</code>'],
          ['<code>src/pages/about.js</code>', '<code>/about</code>'],
          ['<code>src/pages/products.js</code>', '<code>/products</code>'],
          ['<code>src/pages/product.js</code>', '<code>/products/:id</code>'],
          ['<code>src/pages/blog-post.js</code>', '<code>/blog/:slug</code>'],
        ]
      )}
      ${callout('tip', 'The filename does not need to match the route exactly — it is just a helpful convention. A file named <code>product.js</code> can handle <code>/products/:id</code> without any issue.')}
    `,
  }),
}
