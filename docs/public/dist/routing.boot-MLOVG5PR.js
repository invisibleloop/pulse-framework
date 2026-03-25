import{a as o}from"./runtime-QFURDKA2.js";import{a as c,b as i,c as n,d,e,g as t,h as p,i as u}from"./runtime-OFZXJMSU.js";import{a as s,b as m}from"./runtime-B73WLANC.js";var{prev:l,next:g}=c("/routing"),a={route:"/routing",meta:{title:"Routing \u2014 Pulse Docs",description:"How Pulse routes requests to page specs \u2014 static and dynamic routes, params, and conventions.",styles:["/docs.css"]},state:{},view:()=>i({currentHref:"/routing",prev:l,next:g,content:`
      ${n("Routing")}
      ${d("Every route in Pulse is explicitly declared in the spec. There is no file-based routing, no magic directory conventions, and no implicit mapping. Every page's URL is visible in its spec file and nowhere else.")}

      ${e("route-field","The route field")}
      <p>Every spec has a <code>route</code> field. This is the URL pattern the spec handles:</p>
      ${t(o(`export default {
  route: '/about',
  state: {},
  view: () => \`<h1>About</h1>\`,
}`,"js"))}
      <p>Pulse matches the exact path. Trailing slashes are normalised \u2014 <code>/about</code> and <code>/about/</code> are treated the same.</p>

      ${e("dynamic","Dynamic segments")}
      <p>Use a colon prefix for dynamic path segments. Named segments are captured and available in <code>ctx.params</code> in <a href="/server-data">server data</a>:</p>
      ${t(o(`export default {
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
}`,"js"))}

      ${e("multi-segment","Multiple dynamic segments")}
      <p>Any number of dynamic segments can appear in a route:</p>
      ${t(o(`route: '/blog/:year/:month/:slug'
// Matches: /blog/2025/03/my-first-post
// ctx.params = { year: '2025', month: '03', slug: 'my-first-post' }`,"js"))}

      ${e("registering","Registering routes")}
      <p>Specs are registered explicitly by passing them to <code>createServer</code> as an array. Routes are matched in order \u2014 more specific routes must come before more general ones:</p>
      ${t(o(`import { createServer } from '@invisibleloop/pulse'
import home     from './src/pages/home.js'
import products from './src/pages/products.js'
import product  from './src/pages/product.js'   // more specific \u2014 comes first
import blog     from './src/pages/blog.js'

createServer([home, product, products, blog], { port: 3000 })`,"js"))}

      ${e("query","Query strings")}
      <p>Query string parameters are not part of the route pattern but are accessible via <code>ctx.query</code> in server data:</p>
      ${t(o(`// URL: /products?category=shoes&sort=price
server: {
  data: async (ctx) => {
    const { category, sort } = ctx.query
    return { products: await db.products.list({ category, sort }) }
  },
}`,"js"))}

      ${e("not-found","404 handling")}
      <p>If no spec matches the incoming request path, Pulse returns a 404 response. The response body is a minimal HTML page. To customise the 404 page, use the <code>onError</code> option in <code>createServer</code>:</p>
      ${t(o(`createServer(specs, {
  onError: (err, req, res) => {
    if (err.status === 404) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>Not found</h1>')
    }
  }
})`,"js"))}

      ${e("conventions","File naming conventions")}
      <p>While Pulse does not auto-discover files, the recommended convention maps file names to routes:</p>
      ${p(["File","Route"],[["<code>src/pages/home.js</code>","<code>/</code>"],["<code>src/pages/about.js</code>","<code>/about</code>"],["<code>src/pages/products.js</code>","<code>/products</code>"],["<code>src/pages/product.js</code>","<code>/products/:id</code>"],["<code>src/pages/blog-post.js</code>","<code>/blog/:slug</code>"]])}
      ${u("tip","The filename does not need to match the route exactly \u2014 it is just a helpful convention. A file named <code>product.js</code> can handle <code>/products/:id</code> without any issue.")}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",s(a,r,window.__PULSE_SERVER__||{},{ssr:!0}),m(r,s));var w=a;export{w as default};
