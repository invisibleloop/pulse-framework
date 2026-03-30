import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/markdown')

export default {
  route: '/markdown',
  meta: {
    title: 'Markdown — Pulse Docs',
    description: 'Render markdown files as pages with syntax-highlighted code blocks, frontmatter, and the prose component.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/markdown',
    prev,
    next,
    content: `
      ${h1('Markdown')}
      ${lead('Pulse includes a built-in markdown parser. Write content in <code>.md</code> files, load them with the <code>md()</code> helper, and render with the <code>prose</code> component. No external dependencies — zero browser bytes.')}

      ${section('basic', 'Basic usage')}
      <p>Import <code>md</code> from <code>@invisibleloop/pulse/md</code> and call it with a file path. It returns an async server fetcher — use it in <code>server</code> and optionally in <code>meta</code>:</p>
      ${codeBlock(highlight(`import { md }    from '@invisibleloop/pulse/md'
import { prose } from '@invisibleloop/pulse/ui'

const page = md('content/about.md')

export default {
  route:  '/about',
  server: { page },
  view:   (state, { page }) => prose({ content: page.html }),
}`, 'js'))}
      <p>The fetcher returns <code>{ html, frontmatter }</code>. The <code>html</code> is ready to pass directly to <code>prose()</code>. The <code>frontmatter</code> object contains the parsed key/value pairs from the <code>---</code> block at the top of the file.</p>

      ${section('frontmatter', 'Frontmatter')}
      <p>Add a <code>---</code> block at the top of any <code>.md</code> file to define metadata. Use the values in <code>meta</code> for SEO:</p>
      ${codeBlock(highlight(`---
title: About Us
description: Learn about our company
date: 2024-01-15
---

# About Us

Welcome to our company…`, 'bash'))}
      ${codeBlock(highlight(`const page = md('content/about.md')

export default {
  route: '/about',
  meta: {
    title:       async (ctx) => (await page(ctx)).frontmatter.title,
    description: async (ctx) => (await page(ctx)).frontmatter.description,
  },
  server: { page },
  view:   (state, { page }) => prose({ content: page.html }),
}`, 'js'))}
      ${callout('tip', 'Calling <code>page(ctx)</code> in both <code>meta</code> and <code>server</code> reads the file only once per request — the result is cached on <code>ctx._mdCache</code> automatically.')}

      ${section('dynamic', 'Dynamic routes')}
      <p>Use <code>:param</code> placeholders in the path — they are resolved from <code>ctx.params</code> at request time:</p>
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
  view:   (state, { post }) => \`
    <main id="main-content">
      \${prose({ content: post.html })}
    </main>
  \`,
  onViewError: (err) => \`
    <main id="main-content">
      <p>Post not found.</p>
    </main>
  \`,
}`, 'js'))}
      ${callout('note', 'If the file does not exist, the fetcher throws with <code>{ status: 404 }</code>. Define <code>onViewError</code> on dynamic-route pages to render a friendly not-found message instead of a 500.')}

      ${section('parseMd', 'parseMd()')}
      <p>For cases where you already have a markdown string (from a database, API, or generated content), use <code>parseMd</code> directly instead of the file helper:</p>
      ${codeBlock(highlight(`import { parseMd } from '@invisibleloop/pulse/md'
import { prose }   from '@invisibleloop/pulse/ui'

export default {
  route: '/post/:id',
  server: {
    post: async (ctx) => {
      const record = await db.posts.find(ctx.params.id)
      const { html, frontmatter } = parseMd(record.body)
      return { html, title: frontmatter.title ?? record.title }
    }
  },
  view: (state, { post }) => prose({ content: post.html }),
}`, 'js'))}

      ${section('what-renders', 'What the parser renders')}
      ${table(
        ['Markdown', 'Output'],
        [
          ['<code># Heading</code> through <code>###### Heading</code>', '<code>&lt;h1&gt;</code>–<code>&lt;h6&gt;</code> with auto <code>id</code> anchors'],
          ['<code>**bold**</code>, <code>*italic*</code>, <code>~~strike~~</code>', '<code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;del&gt;</code>'],
          ['<code>`inline code`</code>', '<code>&lt;code&gt;</code>'],
          ['Fenced code block with language tag', '<code>&lt;pre&gt;&lt;code class="language-X"&gt;</code> with syntax highlighting'],
          ['<code>[text](url)</code>, <code>![alt](url)</code>', '<code>&lt;a&gt;</code>, <code>&lt;img&gt;</code>'],
          ['<code>- item</code>, <code>1. item</code>', '<code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code> (nested lists supported)'],
          ['<code>&gt; quote</code>', '<code>&lt;blockquote&gt;</code>'],
          ['GFM table (<code>| col | col |</code>)', '<code>&lt;table&gt;</code> with <code>&lt;thead&gt;</code> and <code>&lt;tbody&gt;</code>'],
          ['<code>---</code> (three or more)', '<code>&lt;hr&gt;</code>'],
        ]
      )}

      ${section('syntax-highlighting', 'Syntax highlighting')}
      <p>Fenced code blocks with a language tag are syntax-highlighted automatically — no client JS required. The highlighting runs on the server and emits <code>&lt;span class="tok-*"&gt;</code> elements. The colour tokens are defined in <code>pulse-ui.css</code> and respect the active theme.</p>
      ${codeBlock(highlight(`\`\`\`js
const greeting = 'Hello, world'
console.log(greeting)
\`\`\``, 'bash'))}
      <p>Supported languages:</p>
      ${table(
        ['Tag(s)', 'Highlighter'],
        [
          ['<code>js</code>, <code>javascript</code>, <code>ts</code>, <code>typescript</code>, <code>jsx</code>, <code>tsx</code>', 'JavaScript / TypeScript'],
          ['<code>html</code>, <code>xml</code>, <code>svg</code>, <code>vue</code>, <code>svelte</code>', 'HTML / XML'],
          ['<code>css</code>, <code>scss</code>, <code>less</code>', 'CSS'],
          ['<code>bash</code>, <code>sh</code>, <code>shell</code>, <code>zsh</code>', 'Bash / Shell'],
          ['<code>json</code>, <code>jsonc</code>', 'JSON'],
          ['Any other tag', 'Plain text (escaped, no colour tokens)'],
        ]
      )}

      ${section('prose', 'The prose component')}
      <p>The <code>prose</code> component is designed specifically for markdown output. It applies typographic styles to all descendant elements — headings, paragraphs, lists, blockquotes, code blocks, tables, images — without requiring any classes on the elements themselves:</p>
      ${codeBlock(highlight(`import { prose } from '@invisibleloop/pulse/ui'

// Wrap the html from parseMd or md()
prose({ content: page.html })

// Optional size modifier
prose({ content: page.html, size: 'lg' })  // 'sm' | 'base' | 'lg'`, 'js'))}
      ${callout('note', 'The <code>content</code> slot is injected as raw HTML — only pass server-side content that you trust. Never pass user-submitted HTML directly; sanitise it first.')}

      ${section('url-paths', 'Using URL paths')}
      <p>Pass a <code>URL</code> object to resolve paths relative to the spec file rather than the process working directory:</p>
      ${codeBlock(highlight(`const page = md(new URL('./content/about.md', import.meta.url))`, 'js'))}
    `,
  }),
}
