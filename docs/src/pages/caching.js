import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/caching')

export default {
  route: '/caching',
  meta: {
    title: 'Caching — Pulse Docs',
    description: 'HTTP cache headers, in-process server data caching, and asset caching in Pulse.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/caching',
    prev,
    next,
    content: `
      ${h1('Caching')}
      ${lead('Pulse handles asset caching automatically — production bundles are content-hashed and served with immutable cache headers. Page caching is controlled declaratively in the spec: <code>serverTtl</code> for in-process data, <code>cache</code> for HTTP headers. Nothing is cached by default unless you declare it.')}

      ${section('server-ttl', 'serverTtl — in-process data cache')}
      <p><code>serverTtl</code> is a number of seconds to cache the result of <code>server.data()</code> in memory. Subsequent requests within the TTL window skip the async data fetch entirely and serve the cached result.</p>
      ${codeBlock(highlight(`export default {
  route: '/homepage',
  serverTtl: 60,   // cache server data for 60 seconds
  server: {
    data: async () => ({
      featured: await db.products.getFeatured(),
      stats:    await analytics.getGlobalStats(),
    }),
  },
}`, 'js'))}
      ${table(
        ['Value', 'Behaviour'],
        [
          ['<code>undefined</code> (default)', 'No caching — <code>server.data()</code> runs on every request'],
          ['<code>0</code>', 'No caching (same as undefined)'],
          ['<code>60</code>', 'Cache for 60 seconds — at most one database hit per minute'],
          ['<code>3600</code>', 'Cache for 1 hour'],
        ]
      )}
      ${callout('note', 'The in-process cache is per-process and per-route. It is not shared across multiple server instances. Use a distributed cache (Redis, etc.) for cross-instance consistency.')}
      ${callout('warning', 'In development, setting a long <code>serverTtl</code> can mask stale data. Set it to <code>0</code> or omit it during development, and add it when deploying to production.')}

      ${section('http-cache', 'cache — HTTP response headers')}
      <p>The <code>cache</code> field controls the <code>Cache-Control</code> header sent with the page HTML response. This tells browsers and CDNs how to cache the response.</p>
      ${codeBlock(highlight(`export default {
  route: '/blog/:slug',
  cache: {
    public:               true,    // allow CDN/proxy caching
    maxAge:               300,     // cache for 5 minutes
    staleWhileRevalidate: 86400,   // serve stale for up to 24 hours while revalidating
  },
  // ...
}`, 'js'))}

      ${section('cache-fields', 'Cache field reference')}
      ${table(
        ['Field', 'Type', 'Description'],
        [
          ['<code>public</code>', '<code>boolean</code>', 'If true, emits <code>public</code> — allows CDN/proxy caching. Default: <code>private</code>.'],
          ['<code>maxAge</code>', '<code>number</code>', 'Seconds before the response is considered stale. Emits <code>max-age=N</code>.'],
          ['<code>staleWhileRevalidate</code>', '<code>number</code>', 'Seconds to serve stale content while revalidating in the background. Emits <code>stale-while-revalidate=N</code>.'],
        ]
      )}
      ${codeBlock(highlight(`// private page — user-specific content
cache: { public: false, maxAge: 0 }
// → Cache-Control: private, no-store

// public marketing page — cached at CDN
cache: { public: true, maxAge: 3600, staleWhileRevalidate: 86400 }
// → Cache-Control: public, max-age=3600, stale-while-revalidate=86400`, 'js'))}

      ${section('html-default', 'Default HTML caching')}
      <p>By default, Pulse sends <code>Cache-Control: no-store</code> for all HTML responses. Users always see fresh content — stale HTML is never served from browser or proxy caches unless you explicitly declare a <code>cache</code> policy in the spec.</p>

      ${section('asset-caching', 'Asset caching')}
      <p>Static assets in <code>public/</code> receive <code>Cache-Control: max-age=3600</code> (one hour).</p>
      <p>Production bundles in <code>public/dist/</code> receive <code>Cache-Control: public, max-age=31536000, immutable</code> (one year, immutable). This is guaranteed safe because bundle filenames include a content hash — code changes produce a new hash, and browsers fetch the updated file automatically. There is nothing to configure.</p>

      ${section('dev-vs-prod', 'Development vs production')}
      ${table(
        ['Resource', 'Development', 'Production'],
        [
          ['HTML pages', '<code>no-store</code>', '<code>no-store</code> (or your <code>cache</code> config)'],
          ['Static assets (<code>/public/*</code>)', '<code>max-age=3600</code>', '<code>max-age=3600</code>'],
          ['JS bundles (<code>/dist/*</code>)', 'N/A (source files served directly)', '<code>immutable, max-age=31536000</code>'],
        ]
      )}
      ${callout('tip', 'For maximum performance, combine <code>serverTtl</code> for expensive database queries with a short <code>cache.maxAge</code> and a generous <code>cache.staleWhileRevalidate</code>. Users get fast responses; data stays reasonably fresh.')}
    `,
  }),
}
