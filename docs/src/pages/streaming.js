import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/streaming')

export default {
  route: '/streaming',
  meta: {
    theme:       'light',
    title: 'Streaming SSR — Pulse Docs',
    description: 'How streaming server-side rendering works in Pulse — shell, deferred segments, and when to use it.',
    styles: ['/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/streaming',
    prev,
    next,
    content: `
      ${h1('Streaming SSR')}
      ${lead('Streaming SSR eliminates the tradeoff between fast paint and real content. The shell — chrome, navigation, above-the-fold layout — renders and streams immediately. Slower data-dependent segments arrive over the same connection without blocking the initial paint.')}

      ${section('how-it-works', 'How it works')}
      <p>Without streaming, the server waits for all data to resolve before sending any HTML — slow queries block the entire response. Pulse splits the view into a <strong>shell</strong> (sent immediately) and <strong>deferred</strong> segments (sent as placeholders, then replaced when data resolves).</p>
      <p>Deferred segments arrive as chunks of HTML over the same connection — no extra requests, no client-side JavaScript required to swap content in.</p>

      ${section('enabling', 'Enabling streaming')}
      <p>To use streaming, the <code>view</code> is an <strong>object of named segment functions</strong> rather than a single function. The spec declares which segments are in the shell and which are deferred:</p>
      ${codeBlock(highlight(`export default {
  route: '/dashboard',
  server: {
    user:  async (ctx) => auth.getUser(ctx.cookies.sessionId),   // fast
    feed:  async ()    => db.feed.latest(),                       // slow
    stats: async (ctx) => analytics.summary(ctx.params.id),       // slow
  },
  stream: {
    shell:    ['header', 'nav'],     // rendered immediately
    deferred: ['feed', 'stats'],     // streamed when their data resolves
    scope: {                         // which fetchers each segment waits for
      header: ['user'], nav: ['user'],
      feed:   ['feed'], stats: ['stats'],
    },
  },
  view: {
    header: (state, server) => \`
      <header class="site-header">
        <a href="/">Dashboard</a>
        <span>Hello, \${server.user.name}</span>
      </header>
    \`,
    nav: () => \`
      <nav>
        <a href="/dashboard">Home</a>
        <a href="/settings">Settings</a>
      </nav>
    \`,
    feed: (state, server) => \`
      <section class="feed">
        \${server.feed.map(item => \`<article>\${item.title}</article>\`).join('')}
      </section>
    \`,
    stats: (state, server) => \`
      <div class="stats">
        <p>Page views: \${server.stats.views}</p>
        <p>Conversions: \${server.stats.conversions}</p>
      </div>
    \`,
  },
}`, 'js'))}

      ${section('placeholders', 'Deferred placeholders')}
      <p>While deferred segments are loading, Pulse renders a <code>&lt;pulse-deferred id="pd-[name]"&gt;</code> placeholder in their place. When a segment resolves, its HTML is streamed in a <code>&lt;template&gt;</code> tag alongside a small nonce'd inline script that swaps the placeholder for the template's content — no client JS framework involved, just <code>replaceWith()</code>.</p>
      ${callout('note', 'The swap is done with a tiny inline script — not a separate JS bundle. Deferred streaming works even on pages with no hydration (<code>hydrate</code> omitted).')}

      ${section('server-data', 'Server data and streaming')}
      <p>Every <code>server</code> fetcher starts at once, in parallel. What streaming changes is what each part of the page <em>waits for</em>. Declare <code>stream.scope</code> to say which fetchers each segment needs: the shell is written as soon as <em>its own</em> fetchers resolve, a slow fetcher that only a deferred segment uses never holds it up, and each deferred segment streams as soon as <em>its</em> fetchers resolve:</p>
      ${codeBlock(highlight(`server: {
  user:  async (ctx) => auth.getUser(ctx.cookies.sessionId),   // fast
  feed:  async ()    => db.feed.latest(),                       // slow
},
stream: {
  shell:    ['header'],
  deferred: ['feed'],
  scope: { header: ['user'], feed: ['feed'] },   // the header never waits for the feed
},`, 'js'))}
      ${callout('note', 'A segment that is left out of <code>scope</code> (or all of them, if you omit it) is given every fetcher, so it waits for all of them. Split data across <em>named fetchers</em>, as above, so that <code>scope</code> has something to separate: one fetcher that returns everything cannot be waited for in parts.')}

      ${section('when-to-use', 'When to use streaming')}
      ${table(
        ['Scenario', 'Use streaming?'],
        [
          ['Page with fast server data (< 20ms)', 'No — standard SSR is simpler and fast enough'],
          ['Page with slow database queries', 'Yes — stream the shell while data loads'],
          ['Pages with above-the-fold and below-the-fold content', 'Yes — shell renders above the fold immediately'],
          ['API or raw response endpoints', 'No — use <a href="/raw-responses">raw responses</a>'],
        ]
      )}

      ${section('stream-option', 'Server-level streaming option')}
      <p>Streaming is enabled by default in <code>createServer</code>. Disable it globally with <code>stream: false</code>:</p>
      ${codeBlock(highlight(`createServer(specs, {
  stream: false,  // disable streaming for all specs
})`, 'js'))}
      <p>Even with global streaming enabled, only specs that declare a <code>stream</code> field will use chunked responses. All other specs use regular buffered SSR.</p>

      ${callout('note', 'Streaming sends one page in parts. To update pages that are already open, see <a href="/store#live">live updates</a>: the server broadcasts shared data to every connected browser.')}
      ${callout('tip', 'Streaming is most beneficial on pages with large datasets or slow queries. For most pages, the speed of Pulse\'s synchronous rendering means streaming adds unnecessary complexity.')}
    `,
  }),
}
