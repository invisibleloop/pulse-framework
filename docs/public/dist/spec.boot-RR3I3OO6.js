import{a as o}from"./runtime-QFURDKA2.js";import{a as n,b as d,c as i,d as l,e,g as t,h as p,i as a}from"./runtime-OFZXJMSU.js";import{a as s,b as h}from"./runtime-B73WLANC.js";var{prev:u,next:m}=n("/spec"),c={route:"/spec",meta:{title:"Spec Reference \u2014 Pulse Docs",description:"Complete reference for every field in a Pulse page spec.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/spec",prev:u,next:m,content:`
      ${i("Spec Reference")}
      ${l("The spec is a plain JavaScript object that defines a complete contract for a page. Pulse validates every spec at startup and rejects invalid ones before the server accepts connections. At runtime, it enforces state bounds, validation rules, and lifecycle order automatically.")}

      ${e("quick-ref","Quick reference")}
      ${p(["Field","Type","Required","Description"],[["<code>route</code>","<code>string</code>","Yes","URL pattern for this page. Supports <code>:param</code> segments."],["<code>state</code>","<code>object</code>","Yes","Initial client-side state. Deep-cloned on mount."],["<code>view</code>","<code>function</code>","Yes","Returns an HTML string. Receives <code>(state, serverState)</code>."],["<code>meta</code>","<code>object</code>","No","Page metadata: title, description, styles, OG tags, schema."],["<code>hydrate</code>","<code>string</code>","No","Browser-importable path to this spec file. Enables client hydration."],["<code>mutations</code>","<code>object</code>","No","Synchronous state updaters keyed by name."],["<code>actions</code>","<code>object</code>","No","Async operations with full lifecycle hooks."],["<code>validation</code>","<code>object</code>","No","Declarative validation rules keyed by dot-path state keys."],["<code>constraints</code>","<code>object</code>","No","Min/max bounds enforced after every mutation."],["<code>persist</code>","<code>string[]</code>","No","State keys to save in <code>localStorage</code>."],["<code>server</code>","<code>object</code>","No","Server-side data fetcher. Result passed to <code>view</code> as second arg."],["<code>store</code>","<code>string[]</code>","No",'Global store keys this page subscribes to. See <a href="/store">Global Store</a>.'],["<code>methods</code>","<code>string[]</code>","No","HTTP methods this page accepts. Default <code>['GET', 'HEAD']</code>. Add <code>'POST'</code> etc. to opt in."],["<code>stream</code>","<code>object</code>","No","Streaming SSR config: <code>shell</code> + <code>deferred</code> segment names."],["<code>cache</code>","<code>object</code>","No","HTTP cache control headers for the page response."],["<code>serverTtl</code>","<code>number</code>","No","Seconds to cache server data in-process."],["<code>serverTimeout</code>","<code>number</code>","No","Timeout in ms for all server fetchers on this page. Overrides the global <code>fetcherTimeout</code> option."],["<code>contentType</code>","<code>string</code>","No","Override response Content-Type. Enables raw (non-HTML) responses."],["<code>onViewError</code>","<code>function</code>","No","Fallback renderer called when <code>view()</code> throws. Return an HTML string."]])}

      ${e("route","route")}
      <p>The URL pattern this spec handles. Supports static segments and dynamic <code>:param</code> segments.</p>
      ${t(o(`route: '/products/:id'   // matches /products/42
route: '/blog/:year/:slug'`,"js"))}
      <p>Dynamic segments are available in server data and actions via <code>ctx.params</code>. See <a href="/routing">Routing</a> for more.</p>

      ${e("state","state")}
      <p>The initial client-side state for the page. Always a plain object. Pulse deep-clones it on every mount \u2014 mutations never affect the original spec, and state cannot leak between page loads.</p>
      ${t(o(`state: {
  count: 0,
  user: { name: '', email: '' },
  items: [],
}`,"js"))}
      <p>The state object is passed as the first argument to <code>view</code>, and as the first argument to every mutation and action hook. See <a href="/state">State</a>.</p>

      ${e("view","view")}
      <p>A pure function that receives <code>(state, serverState)</code> and returns an HTML string. Side effects are not permitted \u2014 the same inputs must always produce the same output. Pulse uses this guarantee to diff and re-render efficiently after mutations.</p>
      ${t(o("view: (state, server) => `\n  <main>\n    <h1>Hello, ${state.name}</h1>\n    ${server.items.map(item => `<p>${item.title}</p>`).join('')}\n  </main>\n`","js"))}
      <p>For streaming SSR, <code>view</code> can be an object of named segment functions. See <a href="/streaming">Streaming SSR</a>.</p>

      ${e("meta","meta")}
      <p>Page-level metadata. All fields are optional.</p>
      ${t(o(`meta: {
  title:       'Page Title \u2014 Site Name',
  description: 'Meta description for search engines.',
  styles:      ['/app.css', '/page.css'],
  ogTitle:     'Open Graph title',
  ogImage:     'https://example.com/og.jpg',
  schema:      { '@type': 'WebPage', name: 'Page Title' }, // ld+json
}`,"js"))}
      <p>See <a href="/meta">Metadata &amp; SEO</a> for the full reference.</p>

      ${e("hydrate","hydrate")}
      <p>A browser-importable path to this spec file. Setting this enables client-side hydration \u2014 Pulse emits a bootstrap script that imports the spec bundle and calls <code>mount()</code>. In production, the path is resolved automatically via <code>manifest.json</code>.</p>
      ${t(o(`hydrate: '/src/pages/counter.js'   // dev: source file path
// Production: resolved automatically via manifest.json`,"js"))}
      ${a("note","Omit <code>hydrate</code> for purely server-rendered pages with no client interactivity. Pulse sends zero JavaScript to the browser \u2014 no runtime overhead, no hydration cost.")}

      ${e("mutations","mutations")}
      <p>Synchronous state updaters. Each mutation is a function <code>(state, event) =&gt; partialState</code>. The returned partial object is merged into state. See <a href="/mutations">Mutations</a>.</p>
      ${t(o(`mutations: {
  increment: (state) => ({ count: state.count + 1 }),
  setName:   (state, event) => ({ name: event.target.value }),
}`,"js"))}
      <p>Mutations can return <code>_toast</code> to show a notification \u2014 it is stripped from state automatically. See <a href="/actions#toast">Toast notifications</a>.</p>

      ${e("actions","actions")}
      <p>Async operations with a full lifecycle. Each action has hooks for <code>onStart</code>, optional <code>validate</code>, <code>run</code>, <code>onSuccess</code>, and <code>onError</code>. See <a href="/actions">Actions</a>.</p>
      ${t(o(`actions: {
  submit: {
    onStart:   (state, formData) => ({ status: 'loading' }),
    validate:  true,
    run:       async (state, serverState, formData) => {
      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      return res.json()
    },
    onSuccess: (state, payload) => ({ status: 'success', data: payload }),
    onError:   (state, err) => ({
      status: 'error',
      errors: err?.validation ?? [{ message: err.message }],
    }),
  },
}`,"js"))}

      ${e("validation","validation")}
      <p>Declarative rules checked when an action has <code>validate: true</code>. Keys are dot-path strings into state. See <a href="/validation">Validation</a>.</p>
      ${t(o(`validation: {
  'fields.email': { required: true, format: 'email' },
  'fields.name':  { required: true, minLength: 2, maxLength: 100 },
  'fields.age':   { required: true, min: 18, max: 120 },
}`,"js"))}

      ${e("constraints","constraints")}
      <p>Min/max bounds enforced automatically after every mutation. Constraints cannot be bypassed \u2014 the state is clamped before the view re-renders, regardless of what the mutation returns. See <a href="/constraints">Constraints</a>.</p>
      ${t(o(`constraints: {
  count:    { min: 0, max: 100 },
  quantity: { min: 1, max: 99 },
}`,"js"))}

      ${e("persist","persist")}
      <p>An array of dot-path state keys to persist in <code>localStorage</code>. Values are restored on the next visit. See <a href="/persist">Persist</a>.</p>
      ${t(o("persist: ['theme', 'user.preferences']","js"))}

      ${e("server","server")}
      <p>Server-only data fetching. The result is passed to <code>view</code> as the second argument. Not available on the client. See <a href="/server-data">Server Data</a>.</p>
      ${t(o(`server: {
  data: async (ctx) => {
    const product = await db.products.find(ctx.params.id)
    return { product }
  }
}`,"js"))}

      ${e("stream","stream")}
      <p>Enables streaming SSR. Declare which named view segments are in the <code>shell</code> (rendered immediately) and which are <code>deferred</code> (streamed when ready). See <a href="/streaming">Streaming SSR</a>.</p>
      ${t(o(`stream: {
  shell:    ['header', 'nav'],
  deferred: ['feed', 'sidebar'],
}`,"js"))}

      ${e("cache","cache")}
      <p>HTTP Cache-Control header configuration for the page response. See <a href="/caching">Caching</a>.</p>
      ${t(o(`cache: {
  public:              true,
  maxAge:              300,       // seconds
  staleWhileRevalidate: 86400,
}`,"js"))}

      ${e("serverTtl","serverTtl")}
      <p>Number of seconds to cache the result of <code>server.data()</code> in-process. Subsequent requests within the TTL skip the async data fetch and re-render the HTML with the cached data. See <a href="/caching">Caching</a>.</p>
      ${t(o("serverTtl: 60  // cache server data for 60 seconds","js"))}
      ${a("tip","<strong>serverTtl vs cache</strong> \u2014 <code>serverTtl</code> caches only the server data fetcher results. The HTML is re-rendered on every request (good for personalised pages where only the fetched data is stable). <code>cache</code> caches the complete rendered HTML and sets <code>Cache-Control</code> headers (good for fully public pages that are identical for all users).")}

      ${e("serverTimeout","serverTimeout")}
      <p>Timeout in milliseconds for all <code>server.*</code> fetchers on this page. If any fetcher does not resolve within this limit, it rejects with a timeout error and the request returns a 500. Use this to prevent a slow DB query or external API from hanging the response indefinitely.</p>
      ${t(o("serverTimeout: 5000  // fail after 5 s \u2014 overrides createServer fetcherTimeout","js"))}
      <p>A global default applies to all pages via the <code>fetcherTimeout</code> option in <code>createServer</code>. <code>spec.serverTimeout</code> overrides it per page.</p>

      ${e("on-view-error","onViewError")}
      <p>An optional function called when <code>view()</code> throws at runtime. Return an HTML string to display in place of the crashed view. Without this, the Pulse runtime renders a default inline error message and logs the error to the console.</p>
      ${t(o(`onViewError: (err, state, serverState) => \`
  <div class="u-p-4 u-text-center">
    <p>Something went wrong. <a href="">Reload</a></p>
  </div>
\``,"js"))}
      ${a("note","On the server, a throwing view propagates to the server's error handler (500 response) unless <code>onViewError</code> is defined \u2014 in which case the page renders with the fallback HTML and a 200 status. On the client, the runtime always catches view errors and shows a fallback, whether or not <code>onViewError</code> is defined.")}

      ${e("methods","methods")}
      <p>HTTP methods this page accepts. Defaults to <code>['GET', 'HEAD']</code> \u2014 all other methods return 405. Add <code>'POST'</code> to handle form submissions or webhooks directly on a page route without a separate API endpoint.</p>
      ${t(o("methods: ['GET', 'POST']","js"))}
      <p>Read the method in <code>guard</code> to branch on POST vs GET:</p>
      ${t(o(`export default {
  route:   '/contact',
  methods: ['GET', 'POST'],

  guard: async (ctx) => {
    if (ctx.method === 'POST') {
      const data = await ctx.formData()
      if (!data?.email) return { status: 422, json: { error: 'Email required' } }
      await db.leads.create(data)
      return { redirect: '/contact?sent=1' }
    }
  },

  state: {},
  view:  (state) => \`<form method="POST">...</form>\`,
}`,"js"))}
      ${a("note","For raw response specs (<code>contentType</code> set), all HTTP methods are accepted by default \u2014 <code>methods</code> has no effect. Use <code>ctx.method</code> inside <code>render</code> to branch.")}

      ${e("contentType","contentType")}
      <p>Override the response <code>Content-Type</code>. When set, the view function receives <code>(ctx, serverState)</code> and returns the raw response body \u2014 the normal HTML wrapper is bypassed. See <a href="/raw-responses">Raw Responses</a>.</p>
      ${t(o("contentType: 'application/rss+xml'","js"))}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",s(c,r,window.__PULSE_SERVER__||{},{ssr:!0}),h(r,s));var b=c;export{b as default};
