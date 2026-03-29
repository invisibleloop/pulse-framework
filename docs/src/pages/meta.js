import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/meta')

export default {
  route: '/meta',
  meta: {
    title: 'Metadata & SEO — Pulse Docs',
    description: 'How to configure page metadata, Open Graph tags, and structured data in Pulse.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/meta',
    prev,
    next,
    content: `
      ${h1('Metadata & SEO')}
      ${lead('The <code>meta</code> field declares everything that appears in the <code>&lt;head&gt;</code> — title, description, stylesheets, Open Graph tags, and structured data. All metadata is rendered server-side, so crawlers and social media scrapers see the final HTML without executing JavaScript.')}

      ${section('basics', 'Basic metadata')}
      ${codeBlock(highlight(`export default {
  route: '/about',
  meta: {
    title:       'About Us — Acme Corp',
    description: 'Learn about the team behind Acme Corp.',
    styles:      ['/app.css'],
  },
  view: () => \`<h1>About Us</h1>\`,
}`, 'js'))}
      <p>This generates:</p>
      ${codeBlock(highlight(`<title>About Us — Acme Corp</title>
<meta name="description" content="Learn about the team behind Acme Corp.">
<link rel="stylesheet" href="/app.css">`, 'html'))}

      ${section('all-fields', 'All meta fields')}
      ${table(
        ['Field', 'Type', 'Description'],
        [
          ['<code>title</code>', '<code>string</code>', 'Page title — appears in the browser tab and search results.'],
          ['<code>description</code>', '<code>string</code>', 'Meta description — appears in search engine snippets. Keep under 160 characters.'],
          ['<code>styles</code>', '<code>string[]</code>', 'Array of stylesheet URLs — each emits a <code>&lt;link rel="stylesheet"&gt;</code> tag.'],
          ['<code>ogTitle</code>', '<code>string</code>', 'Open Graph title. If omitted, falls back to <code>title</code>.'],
          ['<code>ogImage</code>', '<code>string</code>', 'Open Graph image URL — shown when the page is shared on social media.'],
          ['<code>schema</code>', '<code>object</code>', 'JSON-LD structured data object — emitted as a <code>&lt;script type="application/ld+json"&gt;</code> tag.'],
          ['<code>canonical</code>', '<code>string | (ctx, serverState) => string</code>', 'Canonical URL — overrides the auto-derived canonical. Accepts a function for dynamic values.'],
        ]
      )}

      ${section('open-graph', 'Open Graph')}
      <p>Open Graph tags control how the page appears when shared on social media (Twitter/X, Facebook, LinkedIn, Slack, etc.):</p>
      ${codeBlock(highlight(`meta: {
  title:       'My Product — Acme Corp',
  description: 'The best product ever made.',
  ogTitle:     'My Product',                         // shorter for social
  ogImage:     'https://acme.com/og/my-product.jpg', // 1200×630 recommended
}`, 'js'))}
      <p>Generated tags:</p>
      ${codeBlock(highlight(`<meta property="og:title" content="My Product">
<meta property="og:description" content="The best product ever made.">
<meta property="og:image" content="https://acme.com/og/my-product.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="My Product">
<meta name="twitter:image" content="https://acme.com/og/my-product.jpg">`, 'html'))}
      ${callout('tip', 'Use an absolute URL for <code>ogImage</code> — social media crawlers need the full URL to fetch the image. Recommended size: 1200×630 pixels.')}

      ${section('structured-data', 'Structured data (ld+json)')}
      <p>The <code>schema</code> field accepts a plain object conforming to <a href="https://schema.org" target="_blank" rel="noopener" aria-label="schema.org (opens in new tab)">schema.org</a> vocabulary. Pulse serialises it as a <code>&lt;script type="application/ld+json"&gt;</code> tag in the head:</p>
      ${codeBlock(highlight(`meta: {
  title: 'How to make sourdough — My Blog',
  schema: {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   'How to make sourdough',
    author: {
      '@type': 'Person',
      name:    'Jane Smith',
    },
    datePublished: '2025-01-15',
    image:         'https://myblog.com/sourdough.jpg',
  },
}`, 'js'))}
      <p>Common schema types:</p>
      ${table(
        ['@type', 'Use for'],
        [
          ['<code>WebSite</code>', 'The homepage or site root'],
          ['<code>WebPage</code>', 'General pages'],
          ['<code>Article</code>', 'Blog posts, news articles'],
          ['<code>Product</code>', 'E-commerce product pages'],
          ['<code>FAQPage</code>', 'FAQ pages (enables rich results in Google)'],
          ['<code>BreadcrumbList</code>', 'Breadcrumb navigation'],
          ['<code>Organization</code>', 'Company/brand information'],
        ]
      )}

      ${section('canonical', 'Canonical URLs')}
      <p>Pulse automatically derives a canonical URL from the request and emits it as a <code>&lt;link rel="canonical"&gt;</code> tag on every page. In most cases no configuration is needed.</p>
      <p>Use <code>meta.canonical</code> to override — for example, on paginated pages or when content is accessible at more than one URL. A plain string is resolved once at startup:</p>
      ${codeBlock(highlight(`// Paginated blog — pages 2, 3, … all canonicalise to the first page
meta: {
  title:     'Blog — Page 2',
  canonical: 'https://mysite.com/blog',
}`, 'js'))}
      <p>Pass a function to derive the canonical from the request context or server data. The function receives <code>(ctx, serverState)</code>:</p>
      ${codeBlock(highlight(`// Canonical from a URL param
meta: {
  canonical: (ctx) => \`https://mysite.com/products/\${ctx.params.slug}\`,
}

// Canonical from a server fetcher result (e.g. canonical slug from a database lookup)
meta: {
  canonical: (ctx, serverState) => \`https://mysite.com/products/\${serverState.product.slug}\`,
}`, 'js'))}
      ${callout('note', '<strong>Streaming caveat:</strong> when <code>stream: true</code> (the default), the <code>&lt;head&gt;</code> is written before server fetchers resolve, so <code>serverState</code> will be <code>null</code> for streaming responses. If your canonical depends on server data, set <code>stream: false</code> on that spec, or derive it from <code>ctx.params</code> instead.')}

      ${section('styles', 'Stylesheets')}
      <p>The <code>styles</code> array accepts any number of stylesheet URLs. They are emitted as <code>&lt;link rel="stylesheet"&gt;</code> tags in the <code>&lt;head&gt;</code> in the order declared:</p>
      ${codeBlock(highlight(`meta: {
  styles: [
    '/app.css',
    '/fonts.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  ],
}`, 'js'))}
      ${callout('note', 'For maximum performance, host your own fonts rather than using Google Fonts. External stylesheet requests add render-blocking latency and a DNS lookup.')}

      ${section('seo-tips', 'SEO tips')}
      <ul>
        <li>Write a unique <code>title</code> and <code>description</code> for every page — duplicate metadata prevents pages from competing in search results.</li>
        <li>Keep descriptions under 160 characters — longer values are truncated.</li>
        <li>Use structured data to qualify for Google rich results.</li>
        <li>All metadata is in the server-rendered HTML — search engines and social scrapers do not need to execute JavaScript to read it.</li>
        <li>Pulse targets 100/100 Lighthouse SEO out of the box. Run <code>/pulse-report</code> after new pages to confirm.</li>
      </ul>
    `,
  }),
}
