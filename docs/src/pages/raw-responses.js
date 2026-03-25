import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/raw-responses')

export default {
  route: '/raw-responses',
  meta: {
    title: 'Raw Responses — Pulse Docs',
    description: 'Return non-HTML responses from Pulse specs — RSS, XML, JSON, and other content types.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/raw-responses',
    prev,
    next,
    content: `
      ${h1('Raw Responses')}
      ${lead('Setting <code>contentType</code> switches a spec from the HTML pipeline to a raw response mode. The view returns the response body directly — no doctype, no hydration script. Security headers and compression still apply.')}

      ${section('basics', 'The basics')}
      <p>Set <code>contentType</code> to any valid MIME type. When present, the normal HTML wrapper (doctype, head, body, hydration script) is skipped. The <code>render</code> function receives <code>(ctx, serverState)</code> and returns a string:</p>
      ${codeBlock(highlight(`export default {
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
}`, 'js'))}

      ${section('json', 'JSON API endpoints')}
      ${codeBlock(highlight(`export default {
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
}`, 'js'))}

      ${section('sitemap', 'XML sitemap')}
      ${codeBlock(highlight(`export default {
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
}`, 'js'))}

      ${section('view-signature', 'View function signature')}
      <p>For raw responses, the <code>view</code> function signature is <code>(ctx, serverState)</code>, not <code>(state, serverState)</code>. The <code>ctx</code> argument is the request context object with <code>params</code>, <code>query</code>, <code>headers</code>, and <code>cookies</code>.</p>
      ${callout('note', 'There is no client state (<code>state</code>) for raw response specs — they are purely server-side. The <code>state: {}</code> field is still required for spec validation, but is not used.')}

      ${section('escaping', 'Escaping in XML and HTML')}
      <p>Pulse does not auto-escape raw response bodies. When returning XML or HTML, escaping all user-supplied and dynamic content is required — unescaped output is an injection vulnerability:</p>
      ${codeBlock(highlight(`// Simple escape helper for XML/HTML contexts
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}`, 'js'))}
      ${callout('warning', 'Never interpolate raw user data or database content into XML/HTML without escaping. This applies to raw response specs just as much as to HTML view functions.')}

      ${section('caching-raw', 'Caching raw responses')}
      <p>Raw response specs support the same <code>serverTtl</code> and <code>cache</code> options as HTML specs. For feeds and sitemaps that update infrequently, a generous TTL dramatically reduces server load:</p>
      ${codeBlock(highlight(`export default {
  route:       '/feed.xml',
  contentType: 'application/rss+xml',
  serverTtl:   300,   // cache data for 5 minutes
  cache: {
    public:  true,
    maxAge:  300,
  },
  // ...
}`, 'js'))}
    `,
  }),
}
