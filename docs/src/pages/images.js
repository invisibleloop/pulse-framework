import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/images')

export default {
  route: '/images',
  meta: {
    title: 'Images — Pulse Docs',
    description: 'The img() and picture() helpers for optimised, CLS-free image markup.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/images',
    prev,
    next,
    content: `
      ${h1('Images')}
      ${lead('The <code>img()</code> and <code>picture()</code> helpers generate image markup that prevents CLS by requiring dimensions and handles loading priority correctly. Pulse targets 0.00 CLS — these helpers enforce the attributes that make that possible.')}

      ${section('import', 'Importing')}
      ${codeBlock(highlight(`// In your page spec or component
import { img, picture } from '@invisibleloop/pulse/image'`, 'js'))}

      ${section('img', 'img(options)')}
      <p>Generates an optimised <code>&lt;img&gt;</code> element:</p>
      ${codeBlock(highlight(`img({
  src:      '/images/hero.jpg',
  alt:      'A hero image showing our product',
  width:    1200,
  height:   630,
  priority: true,    // → eager loading + high fetchpriority
})`, 'js'))}
      <p>Output:</p>
      ${codeBlock(highlight(`<img src="/images/hero.jpg" alt="A hero image showing our product" width="1200" height="630" loading="eager" decoding="async" fetchpriority="high">`, 'html'))}

      ${section('img-options', 'img() options')}
      ${table(
        ['Option', 'Type', 'Required', 'Description'],
        [
          ['<code>src</code>', '<code>string</code>', 'Yes', 'Image URL.'],
          ['<code>alt</code>', '<code>string</code>', 'Yes', 'Alt text. Required for accessibility. Use an empty string for decorative images.'],
          ['<code>width</code>', '<code>number</code>', 'Recommended', 'Intrinsic width in pixels. Prevents CLS by reserving layout space.'],
          ['<code>height</code>', '<code>number</code>', 'Recommended', 'Intrinsic height in pixels. Prevents CLS.'],
          ['<code>priority</code>', '<code>boolean</code>', 'No', 'If true: <code>loading="eager"</code> + <code>fetchpriority="high"</code>. Use for LCP images. Default: <code>false</code>.'],
          ['<code>class</code>', '<code>string</code>', 'No', 'CSS class applied to the <code>&lt;img&gt;</code> element.'],
        ]
      )}

      ${callout('warning', '<code>width</code> and <code>height</code> are required to prevent Cumulative Layout Shift. Without them the browser cannot reserve layout space before the image loads. Pulse targets 0.00 CLS — omitting these attributes breaks that guarantee.')}

      ${section('picture', 'picture(options)')}
      <p>Generates a <code>&lt;picture&gt;</code> element with modern format sources and a fallback <code>&lt;img&gt;</code>. Use this to serve AVIF or WebP to browsers that support them, with JPEG/PNG as the fallback:</p>
      ${codeBlock(highlight(`picture({
  src:      '/images/hero.jpg',      // fallback
  alt:      'Hero image',
  width:    1200,
  height:   630,
  priority: true,
  sources: [
    { src: '/images/hero.avif', type: 'image/avif' },
    { src: '/images/hero.webp', type: 'image/webp' },
  ],
})`, 'js'))}
      <p>Output:</p>
      ${codeBlock(highlight(`<picture>
  <source srcset="/images/hero.avif" type="image/avif">
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="Hero image" width="1200" height="630" loading="eager" decoding="async" fetchpriority="high">
</picture>`, 'html'))}

      ${section('picture-options', 'picture() options')}
      ${table(
        ['Option', 'Type', 'Description'],
        [
          ['<code>src</code>', '<code>string</code>', 'Fallback image URL (JPEG/PNG for universal compatibility).'],
          ['<code>alt</code>', '<code>string</code>', 'Alt text — shared by the inner <code>&lt;img&gt;</code>.'],
          ['<code>width</code>', '<code>number</code>', 'Intrinsic width — applied to inner <code>&lt;img&gt;</code>.'],
          ['<code>height</code>', '<code>number</code>', 'Intrinsic height — applied to inner <code>&lt;img&gt;</code>.'],
          ['<code>priority</code>', '<code>boolean</code>', 'If true: eager loading + high priority.'],
          ['<code>class</code>', '<code>string</code>', 'CSS class on the inner <code>&lt;img&gt;</code>.'],
          ['<code>sources</code>', '<code>{src, type}[]</code>', 'Modern format sources in preference order (AVIF first, WebP second).'],
        ]
      )}

      ${section('priority', 'When to use priority')}
      <p>Set <code>priority: true</code> on the <strong>Largest Contentful Paint (LCP) element</strong> — typically the hero image above the fold. This tells the browser to load it with high priority, improving LCP.</p>
      <p>Every other image should omit <code>priority</code> (defaults to lazy loading with <code>loading="lazy"</code>). Lazy images are not fetched until they approach the viewport — reducing initial page weight and speeding up load time.</p>
      ${callout('tip', 'Only one image per page should have <code>priority: true</code>. Using it on multiple images defeats the purpose — every image becomes "high priority" which is the same as no image being prioritised.')}

      ${section('in-view', 'Using in a view')}
      ${codeBlock(highlight(`import { img, picture } from '@invisibleloop/pulse/image'

export default {
  route: '/blog/:slug',
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
}`, 'js'))}
    `,
  }),
}
