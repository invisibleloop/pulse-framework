import{a as r}from"./runtime-QFURDKA2.js";import{a as c,b as d,c as i,d as l,e,g as t,h as p,i as a}from"./runtime-L2HNXIHW.js";import{a as o,b as u}from"./runtime-B73WLANC.js";var{prev:h,next:v}=c("/server-data"),n={route:"/server-data",meta:{title:"Server Data \u2014 Pulse Docs",description:"Fetch, transform, and combine data on the server before rendering \u2014 external APIs, multiple fetchers, parallel requests.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/server-data",prev:h,next:v,content:`
      ${i("Server Data")}
      ${l("The <code>server</code> field fetches data before the page renders. It runs exclusively on the server \u2014 credentials, database access, and API secrets stay there. The browser never receives the fetcher code, only its serialised output.")}

      ${e("basic","Basic usage")}
      <p>Declare a <code>data</code> async function inside the <code>server</code> object. It receives a <code>ctx</code> object with request context and returns a plain object:</p>
      ${t(r(`export default {
  route: '/products/:id',
  state: { quantity: 1 },
  server: {
    data: async (ctx) => {
      const product = await db.products.findById(ctx.params.id)
      const related = await db.products.findRelated(product.category)
      return { product, related }
    },
  },
  view: (state, server) => \`
    <main>
      <h1>\${server.product.name}</h1>
      <p>\${server.product.description}</p>
      <p>Price: \xA3\${server.product.price}</p>
      <div class="quantity">
        <button data-event="decrement">-</button>
        <span>\${state.quantity}</span>
        <button data-event="increment">+</button>
      </div>
    </main>
  \`,
}`,"js"))}

      ${e("ctx","The ctx object")}
      <p>The <code>ctx</code> argument passed to <code>server.data()</code> contains the full request context:</p>
      ${p(["Property","Type","Description"],[["<code>ctx.params</code>","<code>object</code>","URL path parameters from dynamic route segments (e.g. <code>:id</code>)."],["<code>ctx.query</code>","<code>object</code>","Parsed query string parameters (e.g. <code>?page=2&sort=asc</code>)."],["<code>ctx.headers</code>","<code>object</code>","Incoming request headers (lowercase keys)."],["<code>ctx.cookies</code>","<code>object</code>","Parsed cookies from the <code>Cookie</code> header."]])}
      ${t(r(`server: {
  data: async (ctx) => {
    // Dynamic route: /blog/:year/:slug
    const { year, slug } = ctx.params

    // Query string: ?page=2
    const page = parseInt(ctx.query.page ?? '1', 10)

    // Authentication via cookie
    const session = ctx.cookies.sessionId
      ? await sessions.find(ctx.cookies.sessionId)
      : null

    const post = await db.posts.findBySlug(year, slug)
    return { post, page, session }
  },
}`,"js"))}

      ${e("view-arg","Server state in the view")}
      <p>The resolved values from all server fetchers are merged into a single object and passed to the <code>view</code> function as its second argument, conventionally named <code>server</code>. Each fetcher key becomes a property:</p>
      ${t(r(`// server: { post: async (ctx) => ... }

view: (state, server) => \`
  <article>
    <h1>\${server.post.title}</h1>
    <time>\${server.post.date}</time>
    \${server.post.body}
  </article>
\``,"js"))}
      ${a("note","If no <code>server</code> fetchers are declared, the second argument to <code>view</code> is an empty object <code>{}</code>.")}

      ${e("ssr-only","SSR only \u2014 not available on the client")}
      <p>Server data is resolved before the HTML is generated and is never re-fetched in the browser. After hydration, the serialised output is available to the view as <code>window.__PULSE_SERVER__</code> for client-side re-renders \u2014 it is the same value the server computed, not a new request.</p>
      ${a("warning","Server state is serialised into the page HTML as <code>window.__PULSE_SERVER__</code> and is visible to anyone who views source. Filter fetcher output to only what the view needs \u2014 never include credentials, internal IDs, or user data beyond what must be rendered.")}

      ${e("errors","Error handling")}
      <p>If <code>server.data()</code> throws, the server returns a 500 error response. Handle errors gracefully by catching inside the function and returning a safe fallback:</p>
      ${t(r(`server: {
  data: async (ctx) => {
    try {
      const product = await db.products.findById(ctx.params.id)
      if (!product) return { product: null, notFound: true }
      return { product, notFound: false }
    } catch (err) {
      console.error('Failed to load product', err)
      return { product: null, notFound: true }
    }
  },
},
view: (state, server) => server.notFound
  ? \`<p>Product not found.</p>\`
  : \`<h1>\${server.product.name}</h1>\``,"js"))}

      ${e("multiple-fetchers","Multiple named fetchers")}
      <p>The <code>server</code> object supports any number of named async functions. Each one receives <code>ctx</code> and its return value is available on <code>server</code> in the view under the same key. Fetchers run in parallel \u2014 the page renders once all have resolved:</p>
      ${t(r(`export default {
  route: '/products/:id',
  state: { quantity: 1 },
  server: {
    product: async (ctx) => db.products.findById(ctx.params.id),
    reviews: async (ctx) => db.reviews.forProduct(ctx.params.id),
    related: async (ctx) => db.products.related(ctx.params.id),
  },
  view: (state, server) => \`
    <h1>\${server.product.name}</h1>
    <p>\${server.reviews.length} reviews</p>
    \${server.related.map(p => \`<a href="/products/\${p.id}">\${p.name}</a>\`).join('')}
  \`,
}`,"js"))}

      ${e("external-apis","External API fetching")}
      <p>Server fetchers run in Node.js. API keys and credentials are read from environment variables and never leave the server \u2014 only the fetcher's return value is serialised into the page:</p>
      ${t(r(`server: {
  weather: async (ctx) => {
    const res = await fetch(
      \`https://api.weather.example.com/current?city=\${ctx.query.city}\`,
      { headers: { Authorization: \`Bearer \${process.env.WEATHER_API_KEY}\` } }
    )
    if (!res.ok) return null
    return res.json()
  },
}`,"js"))}

      ${e("transforming","Transforming API responses")}
      <p>Fetchers are the right place to reshape external responses before they reach the view. Filter to only what the view needs \u2014 this reduces payload size and prevents internal fields from being serialised into the page HTML:</p>
      ${t(r(`server: {
  article: async (ctx) => {
    const res  = await fetch(\`https://cms.example.com/articles/\${ctx.params.slug}\`)
    const data = await res.json()

    // Shape and filter before serialisation
    return {
      title:       data.fields.title,
      body:        data.fields.bodyHtml,
      publishedAt: new Date(data.sys.createdAt).toLocaleDateString('en-GB'),
      author:      data.fields.author.name,
      // data.sys.revision, internal IDs etc. are dropped here
    }
  },
}`,"js"))}

      ${e("parallel","Parallel fetches within a single fetcher")}
      <p>When multiple independent requests are needed inside a single fetcher, <code>Promise.all</code> runs them concurrently so the total wait time is the slowest request, not the sum:</p>
      ${t(r(`server: {
  page: async (ctx) => {
    const [hero, featured, nav] = await Promise.all([
      fetch('https://cms.example.com/hero').then(r => r.json()),
      fetch('https://cms.example.com/featured').then(r => r.json()),
      fetch('https://cms.example.com/nav').then(r => r.json()),
    ])
    return { hero, featured, nav }
  },
}`,"js"))}

      ${e("caching-link","Caching server data")}
      <p>Use <a href="/caching"><code>serverTtl</code></a> to cache fetcher results in-process for a number of seconds. This avoids hitting external APIs or a database on every request for data that changes infrequently.</p>
      ${t(r(`export default {
  route: '/homepage',
  serverTtl: 60,  // cache all server fetchers for 60 seconds
  server: {
    featured: async () => fetch('https://api.example.com/featured').then(r => r.json()),
  },
}`,"js"))}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",o(n,s,window.__PULSE_SERVER__||{},{ssr:!0}),u(s,o));var j=n;export{j as default};
