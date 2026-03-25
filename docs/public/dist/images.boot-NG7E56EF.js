import{a as o}from"./runtime-QFURDKA2.js";import{a as d,b as p,c as g,d as n,e,g as t,h as r,i as s}from"./runtime-OFZXJMSU.js";import{a as c,b as h}from"./runtime-B73WLANC.js";var{prev:m,next:l}=d("/images"),a={route:"/images",meta:{title:"Images \u2014 Pulse Docs",description:"The img() and picture() helpers for optimised, CLS-free image markup.",styles:["/docs.css"]},state:{},view:()=>p({currentHref:"/images",prev:m,next:l,content:`
      ${g("Images")}
      ${n("The <code>img()</code> and <code>picture()</code> helpers generate image markup that prevents CLS by requiring dimensions and handles loading priority correctly. Pulse targets 0.00 CLS \u2014 these helpers enforce the attributes that make that possible.")}

      ${e("import","Importing")}
      ${t(o(`// In your page spec or component
import { img, picture } from '@invisibleloop/pulse/image'`,"js"))}

      ${e("img","img(options)")}
      <p>Generates an optimised <code>&lt;img&gt;</code> element:</p>
      ${t(o(`img({
  src:      '/images/hero.jpg',
  alt:      'A hero image showing our product',
  width:    1200,
  height:   630,
  priority: true,    // \u2192 eager loading + high fetchpriority
})`,"js"))}
      <p>Output:</p>
      ${t(o('<img src="/images/hero.jpg" alt="A hero image showing our product" width="1200" height="630" loading="eager" decoding="async" fetchpriority="high">',"html"))}

      ${e("img-options","img() options")}
      ${r(["Option","Type","Required","Description"],[["<code>src</code>","<code>string</code>","Yes","Image URL."],["<code>alt</code>","<code>string</code>","Yes","Alt text. Required for accessibility. Use an empty string for decorative images."],["<code>width</code>","<code>number</code>","Recommended","Intrinsic width in pixels. Prevents CLS by reserving layout space."],["<code>height</code>","<code>number</code>","Recommended","Intrinsic height in pixels. Prevents CLS."],["<code>priority</code>","<code>boolean</code>","No",'If true: <code>loading="eager"</code> + <code>fetchpriority="high"</code>. Use for LCP images. Default: <code>false</code>.'],["<code>class</code>","<code>string</code>","No","CSS class applied to the <code>&lt;img&gt;</code> element."]])}

      ${s("warning","<code>width</code> and <code>height</code> are required to prevent Cumulative Layout Shift. Without them the browser cannot reserve layout space before the image loads. Pulse targets 0.00 CLS \u2014 omitting these attributes breaks that guarantee.")}

      ${e("picture","picture(options)")}
      <p>Generates a <code>&lt;picture&gt;</code> element with modern format sources and a fallback <code>&lt;img&gt;</code>. Use this to serve AVIF or WebP to browsers that support them, with JPEG/PNG as the fallback:</p>
      ${t(o(`picture({
  src:      '/images/hero.jpg',      // fallback
  alt:      'Hero image',
  width:    1200,
  height:   630,
  priority: true,
  sources: [
    { src: '/images/hero.avif', type: 'image/avif' },
    { src: '/images/hero.webp', type: 'image/webp' },
  ],
})`,"js"))}
      <p>Output:</p>
      ${t(o(`<picture>
  <source srcset="/images/hero.avif" type="image/avif">
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="Hero image" width="1200" height="630" loading="eager" decoding="async" fetchpriority="high">
</picture>`,"html"))}

      ${e("picture-options","picture() options")}
      ${r(["Option","Type","Description"],[["<code>src</code>","<code>string</code>","Fallback image URL (JPEG/PNG for universal compatibility)."],["<code>alt</code>","<code>string</code>","Alt text \u2014 shared by the inner <code>&lt;img&gt;</code>."],["<code>width</code>","<code>number</code>","Intrinsic width \u2014 applied to inner <code>&lt;img&gt;</code>."],["<code>height</code>","<code>number</code>","Intrinsic height \u2014 applied to inner <code>&lt;img&gt;</code>."],["<code>priority</code>","<code>boolean</code>","If true: eager loading + high priority."],["<code>class</code>","<code>string</code>","CSS class on the inner <code>&lt;img&gt;</code>."],["<code>sources</code>","<code>{src, type}[]</code>","Modern format sources in preference order (AVIF first, WebP second)."]])}

      ${e("priority","When to use priority")}
      <p>Set <code>priority: true</code> on the <strong>Largest Contentful Paint (LCP) element</strong> \u2014 typically the hero image above the fold. This tells the browser to load it with high priority, improving LCP.</p>
      <p>Every other image should omit <code>priority</code> (defaults to lazy loading with <code>loading="lazy"</code>). Lazy images are not fetched until they approach the viewport \u2014 reducing initial page weight and speeding up load time.</p>
      ${s("tip",'Only one image per page should have <code>priority: true</code>. Using it on multiple images defeats the purpose \u2014 every image becomes "high priority" which is the same as no image being prioritised.')}

      ${e("in-view","Using in a view")}
      ${t(o(`import { img, picture } from '@invisibleloop/pulse/image'

export default {
  route: '/blog/:slug',
  state: {},
  server: {
    data: async (ctx) => ({ post: await db.posts.findBySlug(ctx.params.slug) }),
  },
  view: (state, server) => \`
    <article>
      \${picture({
        src:      server.post.heroImage,
        alt:      server.post.heroAlt,
        width:    1200,
        height:   630,
        priority: true,
        sources:  [
          { src: server.post.heroImage.replace('.jpg', '.avif'), type: 'image/avif' },
          { src: server.post.heroImage.replace('.jpg', '.webp'), type: 'image/webp' },
        ],
      })}
      <h1>\${server.post.title}</h1>
    </article>
  \`,
}`,"js"))}
    `})};var i=document.getElementById("pulse-root");i&&!i.dataset.pulseMounted&&(i.dataset.pulseMounted="1",c(a,i,window.__PULSE_SERVER__||{},{ssr:!0}),h(i,c));var L=a;export{L as default};
