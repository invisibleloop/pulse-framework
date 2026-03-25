import{a as o}from"./runtime-QFURDKA2.js";import{a as i,b as n,c as l,d as p,e,g as t,h as s,i as r}from"./runtime-L2HNXIHW.js";import{a as c,b as m}from"./runtime-B73WLANC.js";var{prev:h,next:g}=i("/meta"),d={route:"/meta",meta:{title:"Metadata & SEO \u2014 Pulse Docs",description:"How to configure page metadata, Open Graph tags, and structured data in Pulse.",styles:["/docs.css"]},state:{},view:()=>n({currentHref:"/meta",prev:h,next:g,content:`
      ${l("Metadata & SEO")}
      ${p("The <code>meta</code> field declares everything that appears in the <code>&lt;head&gt;</code> \u2014 title, description, stylesheets, Open Graph tags, and structured data. All metadata is rendered server-side, so crawlers and social media scrapers see the final HTML without executing JavaScript.")}

      ${e("basics","Basic metadata")}
      ${t(o(`export default {
  route: '/about',
  meta: {
    title:       'About Us \u2014 Acme Corp',
    description: 'Learn about the team behind Acme Corp.',
    styles:      ['/app.css'],
  },
  state: {},
  view: () => \`<h1>About Us</h1>\`,
}`,"js"))}
      <p>This generates:</p>
      ${t(o(`<title>About Us \u2014 Acme Corp</title>
<meta name="description" content="Learn about the team behind Acme Corp.">
<link rel="stylesheet" href="/app.css">`,"html"))}

      ${e("all-fields","All meta fields")}
      ${s(["Field","Type","Description"],[["<code>title</code>","<code>string</code>","Page title \u2014 appears in the browser tab and search results."],["<code>description</code>","<code>string</code>","Meta description \u2014 appears in search engine snippets. Keep under 160 characters."],["<code>styles</code>","<code>string[]</code>",'Array of stylesheet URLs \u2014 each emits a <code>&lt;link rel="stylesheet"&gt;</code> tag.'],["<code>ogTitle</code>","<code>string</code>","Open Graph title. If omitted, falls back to <code>title</code>."],["<code>ogImage</code>","<code>string</code>","Open Graph image URL \u2014 shown when the page is shared on social media."],["<code>schema</code>","<code>object</code>",'JSON-LD structured data object \u2014 emitted as a <code>&lt;script type="application/ld+json"&gt;</code> tag.']])}

      ${e("open-graph","Open Graph")}
      <p>Open Graph tags control how the page appears when shared on social media (Twitter/X, Facebook, LinkedIn, Slack, etc.):</p>
      ${t(o(`meta: {
  title:       'My Product \u2014 Acme Corp',
  description: 'The best product ever made.',
  ogTitle:     'My Product',                         // shorter for social
  ogImage:     'https://acme.com/og/my-product.jpg', // 1200\xD7630 recommended
}`,"js"))}
      <p>Generated tags:</p>
      ${t(o(`<meta property="og:title" content="My Product">
<meta property="og:description" content="The best product ever made.">
<meta property="og:image" content="https://acme.com/og/my-product.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="My Product">
<meta name="twitter:image" content="https://acme.com/og/my-product.jpg">`,"html"))}
      ${r("tip","Use an absolute URL for <code>ogImage</code> \u2014 social media crawlers need the full URL to fetch the image. Recommended size: 1200\xD7630 pixels.")}

      ${e("structured-data","Structured data (ld+json)")}
      <p>The <code>schema</code> field accepts a plain object conforming to <a href="https://schema.org" target="_blank" rel="noopener">schema.org</a> vocabulary. Pulse serialises it as a <code>&lt;script type="application/ld+json"&gt;</code> tag in the head:</p>
      ${t(o(`meta: {
  title: 'How to make sourdough \u2014 My Blog',
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
}`,"js"))}
      <p>Common schema types:</p>
      ${s(["@type","Use for"],[["<code>WebSite</code>","The homepage or site root"],["<code>WebPage</code>","General pages"],["<code>Article</code>","Blog posts, news articles"],["<code>Product</code>","E-commerce product pages"],["<code>FAQPage</code>","FAQ pages (enables rich results in Google)"],["<code>BreadcrumbList</code>","Breadcrumb navigation"],["<code>Organization</code>","Company/brand information"]])}

      ${e("styles","Stylesheets")}
      <p>The <code>styles</code> array accepts any number of stylesheet URLs. They are emitted as <code>&lt;link rel="stylesheet"&gt;</code> tags in the <code>&lt;head&gt;</code> in the order declared:</p>
      ${t(o(`meta: {
  styles: [
    '/app.css',
    '/fonts.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  ],
}`,"js"))}
      ${r("note","For maximum performance, host your own fonts rather than using Google Fonts. External stylesheet requests add render-blocking latency and a DNS lookup.")}

      ${e("seo-tips","SEO tips")}
      <ul>
        <li>Write a unique <code>title</code> and <code>description</code> for every page \u2014 duplicate metadata prevents pages from competing in search results.</li>
        <li>Keep descriptions under 160 characters \u2014 longer values are truncated.</li>
        <li>Use structured data to qualify for Google rich results.</li>
        <li>All metadata is in the server-rendered HTML \u2014 search engines and social scrapers do not need to execute JavaScript to read it.</li>
        <li>Pulse targets 100/100 Lighthouse SEO out of the box. Run <code>/pulse-report</code> after new pages to confirm.</li>
      </ul>
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",c(d,a,window.__PULSE_SERVER__||{},{ssr:!0}),m(a,c));var L=d;export{L as default};
