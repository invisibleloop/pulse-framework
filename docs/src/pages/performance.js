import { renderLayout, h1, lead, section, codeBlock, table, callout } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/performance')

export default {
  route: '/performance',
  meta: {
    title: 'Performance — Pulse Docs',
    description: 'Performance targets, techniques, and built-in optimisations in Pulse.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/performance',
    prev,
    next,
    content: `
      ${h1('Performance')}
      ${lead('Performance in Pulse is structural, not optional. Streaming SSR, immutable asset caching, brotli compression, and zero client JS by default are the baseline — not optimisations applied after the fact. A page that uses the framework correctly cannot score poorly.')}

      ${section('targets', 'Performance targets')}
      <p>Every page served by Pulse should meet these targets on localhost with no throttling:</p>
      ${table(
        ['Metric', 'Target', 'How'],
        [
          ['LCP', 'Fast', 'Streaming SSR sends HTML before server data resolves. Actual LCP depends on server location, CDN, and network conditions.'],
          ['CLS', '0.00', 'Always set <code>width</code> and <code>height</code> on images; framework never shifts layout'],
          ['Lighthouse Performance', '100', 'Compression, immutable caching, no render-blocking resources'],
          ['Lighthouse Accessibility', '100', 'Semantic HTML, proper alt text, sufficient contrast'],
          ['Lighthouse SEO', '100', 'Meta tags, structured data, canonical links'],
          ['Lighthouse Best Practices', '100', 'HTTPS, security headers, no deprecated APIs'],
        ]
      )}
      ${callout('note', 'Run <code>mcp__chrome-devtools__lighthouse_audit</code> after every new page to verify all four scores are 100. Fix any failures before considering the task done.')}
      ${callout('warning', '<strong>Third-party ads caveat:</strong> Pages that load ad network scripts will not achieve 100 across all categories. Ad scripts introduce render-blocking JS, third-party cookies (Best Practices), and late-loading content that causes CLS. Reserving fixed space for ad slots reduces CLS but cannot fully compensate for what ad networks inject at runtime. Treat 100/100/100 as the baseline for ad-free pages only.')}

      ${section('streaming-ssr', 'Streaming SSR')}
      <p>Pulse uses Node.js streams for SSR. The server sends the <code>&lt;head&gt;</code> and page shell immediately, before any async data resolves. Browsers start downloading CSS and fonts while the server fetches data — so the user sees a styled shell within milliseconds.</p>
      ${codeBlock(highlight(`export default {
  route: '/feed',

  // Shell renders instantly — hero, nav, layout
  // Deferred segments wait for data then stream in
  stream: {
    shell:    ['header', 'hero'],
    deferred: ['feed', 'sidebar'],
  },

  server: {
    feed:    async () => db.posts.getLatest(20),   // slow
    sidebar: async () => db.tags.getPopular(),     // slow
  },

  // view is a keyed object matching stream segments
  view: {
    header:  (state) => \`<header>...</header>\`,
    hero:    (state) => \`<section class="hero">...</section>\`,
    feed:    (state, server) => server.feed.map(renderPost).join(''),
    sidebar: (state, server) => renderSidebar(server.sidebar),
  },
}`, 'js'))}

      ${section('compression', 'Automatic compression')}
      <p>All responses are compressed automatically. Pulse negotiates the best available encoding from the <code>Accept-Encoding</code> header:</p>
      ${table(
        ['Encoding', 'Priority', 'Typical savings'],
        [
          ['Brotli (<code>br</code>)', 'First choice', '20–30% smaller than gzip for text content'],
          ['gzip', 'Fallback', 'Widely supported, good compression'],
          ['None', 'Last resort', 'No compression (rare)'],
        ]
      )}
      <p>HTML, CSS, JavaScript, JSON, XML, and SVG responses are all compressed. Binary formats (images, fonts) are served as-is.</p>

      ${section('asset-caching', 'Immutable asset caching')}
      <p>Production JS bundles include a content hash in their filename (<code>/dist/counter.boot-a1b2c3d4.js</code>). The server sends <code>Cache-Control: public, max-age=31536000, immutable</code> for these files — browsers cache them forever and never re-request them unless the hash changes.</p>
      <p>When you deploy a new version, the hash changes, and users automatically get the new file. No cache-busting tricks needed.</p>
      ${callout('tip', 'Static assets in <code>public/</code> get <code>max-age=3600</code>. For rarely-updated images, consider versioning them by filename.')}

      ${section('zero-client-js', 'Zero client JS by default')}
      <p>Pages with no <code>mutations</code>, <code>actions</code>, or <code>persist</code> send no JavaScript at all — the HTML is entirely self-contained. The Pulse CLI detects this automatically; you never need to opt out. This is appropriate for static content pages: marketing pages, blog posts, documentation.</p>
      ${codeBlock(highlight(`// No mutations, actions, or persist → zero JS sent to browser
export default {
  route: '/about',
  meta:  { title: 'About', styles: ['/app.css'] },
  view:  () => \`<main><h1>About us</h1></main>\`,
}`, 'js'))}

      ${section('js-bundle-splitting', 'JS bundle splitting and caching')}
      <p>When you open the network tab you will see a single <code>[page].boot-[hash].js</code> file loading. What is inside that file depends on how many pages your app has:</p>
      ${table(
        ['App size', 'What the boot file contains', 'Size (brotli)'],
        [
          ['Single page', 'Your spec + the full Pulse runtime bundled together', '~4 kB'],
          ['Multiple pages', 'Your spec only — runtime is in a separate <code>runtime-[hash].js</code> chunk', '~0.4–0.9 kB'],
        ]
      )}
      <p>With multiple pages, esbuild's code splitting extracts the Pulse runtime into a shared chunk because every page imports it. The browser downloads it once and caches it — subsequent page navigations only fetch the small per-page boot file.</p>
      <p><strong>What you see in the network tab across navigations:</strong></p>
      <ul>
        <li><strong>First page visit</strong> — <code>runtime-[hash].js</code> (~3.8 kB) + <code>home.boot-[hash].js</code> (~0.4 kB)</li>
        <li><strong>Navigate to another page</strong> — <code>contact.boot-[hash].js</code> (~0.5 kB) only. Runtime already cached.</li>
        <li><strong>Return visit</strong> — nothing. Both files served from cache with <code>immutable</code> headers.</li>
      </ul>
      ${callout('tip', 'The runtime hash only changes when the Pulse runtime itself is updated — not when your app changes. Deploying new pages or mutations does not bust the runtime cache for returning visitors.')}

      ${section('security-headers', 'Security headers')}
      <p>Every response — including 404 and 500 errors — carries a full set of security headers automatically. There is no configuration step and no way to accidentally omit them:</p>
      ${table(
        ['Header', 'Value'],
        [
          ['<code>X-Content-Type-Options</code>', '<code>nosniff</code>'],
          ['<code>X-Frame-Options</code>', '<code>DENY</code>'],
          ['<code>Referrer-Policy</code>', '<code>strict-origin-when-cross-origin</code>'],
          ['<code>Permissions-Policy</code>', '<code>camera=(), microphone=(), geolocation=()</code>'],
          ['<code>Cross-Origin-Opener-Policy</code>', '<code>same-origin</code>'],
          ['<code>Cross-Origin-Resource-Policy</code>', '<code>same-origin</code>'],
        ]
      )}
      <p>These headers are applied automatically — no configuration needed.</p>

      ${section('browser-support', 'Browser support')}
      <p>Pulse ships modern JavaScript and CSS without transpilation or polyfills. The effective minimum is set by two features:</p>
      ${table(
        ['Constraint', 'Chrome', 'Firefox', 'Safari', 'Edge', 'Since'],
        [
          ['<code>?.</code> optional chaining (JS)', '80', '74', '13.1', '80', 'Feb – Mar 2020'],
          ['<code>gap</code> on flexbox (CSS)', '84', '63', '14.1', '84', 'Aug 2020 – Apr 2021'],
        ]
      )}
      <p>In practice, <strong>Safari 14.1 (April 2021) is the combined floor</strong> — browsers released after that date support everything Pulse uses. This covers roughly 95%+ of global traffic.</p>
      ${callout('note', 'No explicit <code>target</code> is set in the esbuild config, so syntax ships as written. If you need to support older browsers, set <code>target</code> in <code>scripts/build.js</code> and esbuild will downcompile optional chaining and other modern syntax automatically.')}

      ${section('cls', 'Preventing layout shift (CLS)')}
      <p>Pulse targets 0.00 CLS. Layout shift is caused by elements that change size or position after the initial paint. These rules prevent it:</p>
      <ul>
        <li>Always set <code>width</code> and <code>height</code> on images (use the <code>img()</code> helper)</li>
        <li>Never inject content above existing content after page load</li>
        <li>Use <code>aspect-ratio</code> CSS for embeds (videos, iframes)</li>
        <li>Avoid loading web fonts that cause FOUT — use <code>font-display: swap</code> or system fonts</li>
      </ul>

      ${section('lcp', 'Optimising LCP')}
      <p>LCP (Largest Contentful Paint) is typically your hero image or largest heading. Tips:</p>
      <ul>
        <li>Use <code>priority: true</code> on the LCP image — sets <code>fetchpriority="high"</code> and <code>loading="eager"</code></li>
        <li>Avoid blocking server fetches — use <code>stream</code> so the shell renders without waiting for data</li>
        <li>Keep your hero HTML inline (SSR) — never rely on client JS to render the LCP element</li>
        <li>Use modern image formats (AVIF, WebP) via the <code>picture()</code> helper</li>
      </ul>

      ${callout('warning', 'Never render your LCP element (hero image, main heading) client-side. If it requires a client JS import or a dynamic import, it will not paint until JS executes — pushing LCP from &lt;100ms to &gt;500ms.')}
    `,
  }),
}
