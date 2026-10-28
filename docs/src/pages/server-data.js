import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/server-data')

export default {
  route: '/server-data',
  meta: {
    theme:       'light',
    title: 'Server Data — Pulse Docs',
    description: 'Fetch, transform, and combine data on the server before rendering — external APIs, multiple fetchers, parallel requests.',
    styles: ['/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/server-data',
    prev,
    next,
    content: `
      ${h1('Server Data')}
      ${lead('The <code>server</code> field fetches data before the page renders. It runs exclusively on the server — credentials, database access, and API secrets stay there. The browser never receives the fetcher code, only its serialised output.')}

      ${section('basic', 'Basic usage')}
      <p>Declare one async function per piece of data inside the <code>server</code> object. Each is a <em>fetcher</em>: it receives a <code>ctx</code> object with the request context, and whatever it returns is available to the view as <code>server.&lt;name&gt;</code>. Fetchers run in parallel:</p>
      ${codeBlock(highlight(`export default {
  route: '/products/:id',
  state: { quantity: 1 },
  server: {
    product: async (ctx) => db.products.findById(ctx.params.id),
    related: async (ctx) => db.products.findRelated(ctx.params.id),
  },
  view: (state, server) => \`
    <main>
      <h1>\${server.product.name}</h1>
      <p>\${server.product.description}</p>
      <p>Price: £\${server.product.price}</p>
      <div class="quantity">
        <button data-event="decrement">-</button>
        <span>\${state.quantity}</span>
        <button data-event="increment">+</button>
      </div>
    </main>
  \`,
}`, 'js'))}

      ${section('ctx', 'The ctx object')}
      <p>The <code>ctx</code> argument passed to each fetcher contains the full request context:</p>
      ${table(
        ['Property', 'Type', 'Description'],
        [
          ['<code>ctx.params</code>', '<code>object</code>', 'URL path parameters from dynamic route segments (e.g. <code>:id</code>).'],
          ['<code>ctx.query</code>', '<code>object</code>', 'Parsed query string parameters (e.g. <code>?page=2&sort=asc</code>).'],
          ['<code>ctx.headers</code>', '<code>object</code>', 'Incoming request headers (lowercase keys).'],
          ['<code>ctx.cookies</code>', '<code>object</code>', 'Parsed cookies from the <code>Cookie</code> header.'],
        ]
      )}
      ${codeBlock(highlight(`server: {
  post: async (ctx) => {
    // Dynamic route: /blog/:year/:slug
    const { year, slug } = ctx.params
    return db.posts.findBySlug(year, slug)
  },

  comments: async (ctx) => {
    // Query string: ?page=2
    const page = parseInt(ctx.query.page ?? '1', 10)
    return db.comments.page(ctx.params.slug, page)
  },

  session: async (ctx) => {
    // Authentication via cookie
    return ctx.cookies.sessionId ? sessions.find(ctx.cookies.sessionId) : null
  },
}`, 'js'))}

      ${section('view-arg', 'Server state in the view')}
      <p>The resolved values from all server fetchers are merged into a single object and passed to the <code>view</code> function as its second argument, conventionally named <code>server</code>. Each fetcher key becomes a property:</p>
      ${codeBlock(highlight(`// server: { post: async (ctx) => ... }

view: (state, server) => \`
  <article>
    <h1>\${server.post.title}</h1>
    <time>\${server.post.date}</time>
    \${server.post.body}
  </article>
\``, 'js'))}
      ${callout('note', 'If no <code>server</code> fetchers are declared, the second argument to <code>view</code> is an empty object <code>{}</code>.')}

      ${section('ssr-only', 'SSR only — not available on the client')}
      <p>Server data is resolved before the HTML is generated and is never re-fetched in the browser. After hydration, the serialised output is available to the view as <code>window.__PULSE_SERVER__</code> for client-side re-renders — it is the same value the server computed, not a new request.</p>
      ${callout('warning', 'Server state is serialised into the page HTML as <code>window.__PULSE_SERVER__</code> and is visible to anyone who views source. Filter fetcher output to only what the view needs — never include credentials, internal IDs, or user data beyond what must be rendered.')}

      ${section('errors', 'Error handling')}
      <p>If a fetcher throws, the page cannot render normally: a buffered response (<code>stream: false</code>) returns a 500 through <code>onError</code>, and a streamed one (the default) logs the error and shows an error message, see <a href="/error-pages">Error pages</a>. Handle errors gracefully by catching inside the fetcher and returning a safe fallback:</p>
      ${codeBlock(highlight(`server: {
  product: async (ctx) => {
    try {
      return await db.products.findById(ctx.params.id)   // null when there is no such product
    } catch (err) {
      console.error('Failed to load product', err)
      return null
    }
  },
},
view: (state, server) => server.product
  ? \`<h1>\${server.product.name}</h1>\`
  : \`<p>Product not found.</p>\``, 'js'))}

      ${section('multiple-fetchers', 'Multiple named fetchers')}
      <p>The <code>server</code> object supports any number of named async functions. Each one receives <code>ctx</code> and its return value is available on <code>server</code> in the view under the same key. Fetchers run in parallel — the page renders once all have resolved:</p>
      ${codeBlock(highlight(`export default {
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
}`, 'js'))}

      ${section('external-apis', 'External API fetching')}
      <p>Server fetchers run in Node.js. API keys and credentials are read from environment variables and never leave the server — only the fetcher's return value is serialised into the page:</p>
      ${codeBlock(highlight(`server: {
  weather: async (ctx) => {
    const res = await fetch(
      \`https://api.weather.example.com/current?city=\${ctx.query.city}\`,
      { headers: { Authorization: \`Bearer \${process.env.WEATHER_API_KEY}\` } }
    )
    if (!res.ok) return null
    return res.json()
  },
}`, 'js'))}

      ${section('transforming', 'Transforming API responses')}
      <p>Fetchers are the right place to reshape external responses before they reach the view. Filter to only what the view needs — this reduces payload size and prevents internal fields from being serialised into the page HTML:</p>
      ${codeBlock(highlight(`server: {
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
}`, 'js'))}

      ${section('parallel', 'Parallel fetches within a single fetcher')}
      <p>When multiple independent requests are needed inside a single fetcher, <code>Promise.all</code> runs them concurrently so the total wait time is the slowest request, not the sum:</p>
      ${codeBlock(highlight(`server: {
  page: async (ctx) => {
    const [hero, featured, nav] = await Promise.all([
      fetch('https://cms.example.com/hero').then(r => r.json()),
      fetch('https://cms.example.com/featured').then(r => r.json()),
      fetch('https://cms.example.com/nav').then(r => r.json()),
    ])
    return { hero, featured, nav }
  },
}`, 'js'))}

      ${section('caching-link', 'Caching server data')}
      <p>Use <a href="/caching"><code>serverTtl</code></a> to cache fetcher results in-process for a number of seconds. This avoids hitting external APIs or a database on every request for data that changes infrequently.</p>
      ${codeBlock(highlight(`export default {
  route: '/homepage',
  serverTtl: 60,  // cache all server fetchers for 60 seconds
  server: {
    featured: async () => fetch('https://api.example.com/featured').then(r => r.json()),
  },
}`, 'js'))}

      ${section('markdown', 'Markdown files')}
      <p>Use the built-in <code>md()</code> helper to load and parse <code>.md</code> files as server data. The result (<code>{ html, frontmatter }</code>) is ready to pass to the <code>prose</code> component — no external dependencies, no client JS. See <a href="/markdown">Markdown</a> for the full reference.</p>
      ${codeBlock(highlight(`import { md }    from '@invisibleloop/pulse/md'
import { prose } from '@invisibleloop/pulse/ui'

const post = md('content/blog/:slug.md')

export default {
  route: '/blog/:slug',
  meta: {
    title:       async (ctx) => (await post(ctx)).frontmatter.title,
    description: async (ctx) => (await post(ctx)).frontmatter.description,
  },
  server: { post },
  view: (state, { post }) => prose({ content: post.html }),
  onViewError: () => \`<p>Post not found.</p>\`,
}`, 'js'))}
    `,
  }),
}
