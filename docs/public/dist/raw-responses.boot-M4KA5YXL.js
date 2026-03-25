import{a as s}from"./runtime-QFURDKA2.js";import{a as p,b as c,c as i,d,e,g as t,i as r}from"./runtime-L2HNXIHW.js";import{a,b as l}from"./runtime-B73WLANC.js";var{prev:u,next:m}=p("/raw-responses"),n={route:"/raw-responses",meta:{title:"Raw Responses \u2014 Pulse Docs",description:"Return non-HTML responses from Pulse specs \u2014 RSS, XML, JSON, and other content types.",styles:["/docs.css"]},state:{},view:()=>c({currentHref:"/raw-responses",prev:u,next:m,content:`
      ${i("Raw Responses")}
      ${d("Setting <code>contentType</code> switches a spec from the HTML pipeline to a raw response mode. The view returns the response body directly \u2014 no doctype, no hydration script. Security headers and compression still apply.")}

      ${e("basics","The basics")}
      <p>Set <code>contentType</code> to any valid MIME type. When present, the normal HTML wrapper (doctype, head, body, hydration script) is skipped. The <code>render</code> function receives <code>(ctx, serverState)</code> and returns a string:</p>
      ${t(s(`export default {
  route: '/feed.xml',
  contentType: 'application/rss+xml',
  state: {},
  server: {
    data: async () => ({
      posts: await db.posts.latest(20),
    }),
  },
  view: (ctx, server) => \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>Recent posts</description>
    \${server.posts.map(post => \`
    <item>
      <title>\${esc(post.title)}</title>
      <link>https://example.com/blog/\${post.slug}</link>
      <pubDate>\${new Date(post.date).toUTCString()}</pubDate>
      <description>\${esc(post.excerpt)}</description>
    </item>
    \`).join('')}
  </channel>
</rss>\`,
}`,"js"))}

      ${e("json","JSON API endpoints")}
      ${t(s(`export default {
  route: '/api/products',
  contentType: 'application/json',
  state: {},
  server: {
    data: async (ctx) => ({
      products: await db.products.list({
        page:     parseInt(ctx.query.page ?? '1', 10),
        category: ctx.query.category,
      }),
    }),
  },
  view: (ctx, server) => JSON.stringify({
    products: server.products,
    page:     parseInt(ctx.query.page ?? '1', 10),
  }),
}`,"js"))}

      ${e("sitemap","XML sitemap")}
      ${t(s(`export default {
  route: '/sitemap.xml',
  contentType: 'application/xml',
  serverTtl:   3600,
  state: {},
  server: {
    data: async () => ({
      pages: await db.pages.allPublished(),
    }),
  },
  view: (ctx, server) => \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  \${server.pages.map(p => \`
  <url>
    <loc>https://example.com\${p.path}</loc>
    <lastmod>\${p.updatedAt.toISOString().slice(0, 10)}</lastmod>
  </url>
  \`).join('')}
</urlset>\`,
}`,"js"))}

      ${e("view-signature","View function signature")}
      <p>For raw responses, the <code>view</code> function signature is <code>(ctx, serverState)</code>, not <code>(state, serverState)</code>. The <code>ctx</code> argument is the request context object with <code>params</code>, <code>query</code>, <code>headers</code>, and <code>cookies</code>.</p>
      ${r("note","There is no client state (<code>state</code>) for raw response specs \u2014 they are purely server-side. The <code>state: {}</code> field is still required for spec validation, but is not used.")}

      ${e("escaping","Escaping in XML and HTML")}
      <p>Pulse does not auto-escape raw response bodies. When returning XML or HTML, escaping all user-supplied and dynamic content is required \u2014 unescaped output is an injection vulnerability:</p>
      ${t(s(`// Simple escape helper for XML/HTML contexts
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}`,"js"))}
      ${r("warning","Never interpolate raw user data or database content into XML/HTML without escaping. This applies to raw response specs just as much as to HTML view functions.")}

      ${e("caching-raw","Caching raw responses")}
      <p>Raw response specs support the same <code>serverTtl</code> and <code>cache</code> options as HTML specs. For feeds and sitemaps that update infrequently, a generous TTL dramatically reduces server load:</p>
      ${t(s(`export default {
  route:       '/feed.xml',
  contentType: 'application/rss+xml',
  serverTtl:   300,   // cache data for 5 minutes
  cache: {
    public:  true,
    maxAge:  300,
  },
  // ...
}`,"js"))}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",a(n,o,window.__PULSE_SERVER__||{},{ssr:!0}),l(o,a));var M=n;export{M as default};
