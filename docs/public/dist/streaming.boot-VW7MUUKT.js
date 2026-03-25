import{a}from"./runtime-QFURDKA2.js";import{a as i,b as d,c as l,d as c,e,g as t,h,i as r}from"./runtime-OFZXJMSU.js";import{a as n,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:g}=i("/streaming"),o={route:"/streaming",meta:{title:"Streaming SSR \u2014 Pulse Docs",description:"How streaming server-side rendering works in Pulse \u2014 shell, deferred segments, and when to use it.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/streaming",prev:p,next:g,content:`
      ${l("Streaming SSR")}
      ${c("Streaming SSR eliminates the tradeoff between fast paint and real content. The shell \u2014 chrome, navigation, above-the-fold layout \u2014 renders and streams immediately. Slower data-dependent segments arrive over the same connection without blocking the initial paint.")}

      ${e("how-it-works","How it works")}
      <p>Without streaming, the server waits for all data to resolve before sending any HTML \u2014 slow queries block the entire response. Pulse splits the view into a <strong>shell</strong> (sent immediately) and <strong>deferred</strong> segments (sent as placeholders, then replaced when data resolves).</p>
      <p>Deferred segments arrive as chunks of HTML over the same connection \u2014 no extra requests, no client-side JavaScript required to swap content in.</p>

      ${e("enabling","Enabling streaming")}
      <p>To use streaming, the <code>view</code> is an <strong>object of named segment functions</strong> rather than a single function. The spec declares which segments are in the shell and which are deferred:</p>
      ${t(a(`export default {
  route: '/dashboard',
  state: {},
  server: {
    data: async (ctx) => ({
      user:   await auth.getUser(ctx.cookies.sessionId),  // fast
      feed:   await db.feed.latest(),                      // slow
      stats:  await analytics.summary(ctx.params.id),      // slow
    }),
  },
  stream: {
    shell:    ['header', 'nav'],     // rendered immediately
    deferred: ['feed', 'stats'],     // streamed when server data resolves
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
}`,"js"))}

      ${e("placeholders","Deferred placeholders")}
      <p>While deferred segments are loading, Pulse renders a <code>&lt;div id="pulse-slot-[name]"&gt;</code> placeholder in their place. When the segment resolves, the rendered HTML is appended to the stream and a small inline script swaps the placeholder content.</p>
      ${r("note","The swap is done with a tiny inline script \u2014 not a separate JS bundle. Deferred streaming works even on pages with no hydration (<code>hydrate</code> omitted).")}

      ${e("server-data","Server data and streaming")}
      <p>All <code>server.data()</code> calls resolve in a single async call before rendering begins. Streaming is about splitting the <em>view</em> \u2014 not about parallelising data fetching. For parallel data fetching, use <code>Promise.all</code> inside <code>server.data()</code>:</p>
      ${t(a(`server: {
  data: async (ctx) => {
    // Fetch in parallel \u2014 both requests run concurrently
    const [feed, stats] = await Promise.all([
      db.feed.latest(),
      analytics.summary(),
    ])
    return { feed, stats }
  },
}`,"js"))}

      ${e("when-to-use","When to use streaming")}
      ${h(["Scenario","Use streaming?"],[["Page with fast server data (< 20ms)","No \u2014 standard SSR is simpler and fast enough"],["Page with slow database queries","Yes \u2014 stream the shell while data loads"],["Pages with above-the-fold and below-the-fold content","Yes \u2014 shell renders above the fold immediately"],["API or raw response endpoints",'No \u2014 use <a href="/raw-responses">raw responses</a>']])}

      ${e("stream-option","Server-level streaming option")}
      <p>Streaming is enabled by default in <code>createServer</code>. Disable it globally with <code>stream: false</code>:</p>
      ${t(a(`createServer(specs, {
  stream: false,  // disable streaming for all specs
})`,"js"))}
      <p>Even with global streaming enabled, only specs that declare a <code>stream</code> field will use chunked responses. All other specs use regular buffered SSR.</p>

      ${r("tip","Streaming is most beneficial on pages with large datasets or slow queries. For most pages, the speed of Pulse's synchronous rendering means streaming adds unnecessary complexity.")}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",n(o,s,window.__PULSE_SERVER__||{},{ssr:!0}),m(s,n));var P=o;export{P as default};
