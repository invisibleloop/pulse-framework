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
  state: {},
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
  state: {},
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

      ${section('not-found', '404 handling')}
      <p>If no spec matches the incoming request path, Pulse returns a 404 response. The response body is a minimal HTML page. To customise the 404 page, use the <code>onError</code> option in <code>createServer</code>:</p>
      ${codeBlock(highlight(`createServer(specs, {
  onError: (err, req, res) => {
    if (err.status === 404) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>Not found</h1>')
    }
  }
})`, 'js'))}

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
