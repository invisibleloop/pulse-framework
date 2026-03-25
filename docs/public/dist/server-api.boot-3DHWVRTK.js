import{a as t}from"./runtime-QFURDKA2.js";import{a as n,b as i,c as l,d as p,e,g as o,h as r,i as s}from"./runtime-OFZXJMSU.js";import{a,b as u}from"./runtime-B73WLANC.js";var{prev:h,next:m}=n("/server-api"),d={route:"/server-api",meta:{title:"Server API \u2014 Pulse Docs",description:"Complete reference for createServer \u2014 all options, hooks, and response behaviour.",styles:["/docs.css"]},state:{},view:()=>i({currentHref:"/server-api",prev:h,next:m,content:`
      ${l("Server API")}
      ${p("<code>createServer(specs, options)</code> starts an HTTP server with all guarantees active. Specs are validated before the server accepts connections. SSR, streaming, brotli compression, immutable asset caching, security headers, CSP nonces, and HSTS are all handled automatically.")}

      ${e("signature","createServer(specs, options)")}
      ${o(t(`import { createServer } from '@invisibleloop/pulse'

createServer(specs, options)`,"js"))}
      ${r(["Parameter","Type","Description"],[["<code>specs</code>","<code>Spec[]</code>","Array of page spec objects. Validated at startup \u2014 a bad spec throws before the server accepts connections."],["<code>options</code>","<code>object</code>","Server configuration options (see below)."]])}

      ${e("options","Options")}
      ${r(["Option","Type","Default","Description"],[["<code>port</code>","<code>number</code>","<code>3000</code>","Port to listen on."],["<code>stream</code>","<code>boolean</code>","<code>true</code>","Enable streaming SSR globally. Individual specs also declare a <code>stream</code> field to opt in."],["<code>staticDir</code>","<code>string</code>","<code>undefined</code>","Path to a directory of static files to serve. Relative to the process working directory."],["<code>manifest</code>","<code>string | object</code>","<code>null</code>","Explicit manifest path or object. Overrides auto-detection from <code>staticDir/dist/manifest.json</code>."],["<code>trailingSlash</code>",'<code>"remove" | "add" | "allow"</code>','<code>"remove"</code>','<code>"remove"</code> \u2014 301 redirect <code>/about/</code> \u2192 <code>/about</code>. <code>"add"</code> \u2014 301 redirect <code>/about</code> \u2192 <code>/about/</code>. <code>"allow"</code> \u2014 serve both, no redirect.'],["<code>store</code>","<code>object</code>","<code>null</code>",'Global store definition (default export from <code>pulse.store.js</code>). See <a href="/store">Global Store</a>.'],["<code>maxBody</code>","<code>number</code>","<code>1048576</code>","Maximum request body size in bytes (default 1 MB). Requests exceeding this limit receive a 413 response."],["<code>defaultCache</code>","<code>boolean | number | object</code>","<code>null</code>","Default HTML cache TTL for all pages in production. <code>true</code> = 1 h + 24 h SWR. A number sets <code>max-age</code> in seconds. An object accepts <code>{ public, maxAge, staleWhileRevalidate }</code>. <code>spec.cache</code> overrides per-page."],["<code>fetcherTimeout</code>","<code>number</code>","<code>null</code>","Global timeout in milliseconds for all server fetchers. A fetcher that does not resolve within this limit rejects with a timeout error (\u2192 500). Override per page with <code>spec.serverTimeout</code>."],["<code>shutdownTimeout</code>","<code>number</code>","<code>30000</code>",'Milliseconds to wait for in-flight requests to finish during graceful shutdown before force-exiting. See <a href="#graceful-shutdown">Graceful shutdown</a>.'],["<code>healthCheck</code>","<code>string | false</code>",'<code>"/healthz"</code>','Path for the built-in health check endpoint. Returns <code>{ status: "ok", uptime }</code>. Set to <code>false</code> to disable. The endpoint bypasses <code>onRequest</code> so load balancers always get a response.'],["<code>resolveBrand</code>","<code>async (host) => any</code>","<code>undefined</code>","Multi-brand support. Called once per host (cached 60s). Result is attached to <code>ctx.brand</code> and available in <code>guard</code>, <code>server</code>, and <code>meta</code> functions."],["<code>onRequest</code>","<code>function</code>","<code>undefined</code>","Called on every request before routing. Return <code>false</code> to short-circuit Pulse handling."],["<code>onError</code>","<code>function</code>","<code>undefined</code>","Called on unhandled errors. Receives <code>(err, req, res)</code>."]])}

      ${e("example","Full example")}
      ${o(t(`import { createServer } from '@invisibleloop/pulse'
import home    from './src/pages/home.js'
import contact from './src/pages/contact.js'

createServer([home, contact], {
  port:      3000,
  stream:    true,
  staticDir: 'public',
  onRequest: (req, res) => {
    // Add custom headers
    res.setHeader('X-My-Header', 'my-value')
    // Return false to block a request
    if (req.url.startsWith('/admin') && !isAuthenticated(req)) {
      res.writeHead(401)
      res.end('Unauthorized')
      return false
    }
    // Return undefined (or nothing) to let Pulse handle it
  },
  onError: (err, req, res) => {
    console.error(err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/html' })
      res.end('<h1>Internal Server Error</h1>')
    }
  },
})`,"js"))}

      ${e("multi-brand","Multi-brand sites")}
      <p>One Pulse server can serve multiple brands, using the request domain as the key. Pass <code>resolveBrand</code> to <code>createServer</code> \u2014 it receives the <code>host</code> header and returns a brand config object of any shape you choose. The result is cached per host for 60 seconds and attached to <code>ctx.brand</code>.</p>
      ${o(t(`// server.js
createServer(specs, {
  resolveBrand: async (host) => {
    const slug = host.split('.')[0]          // 'acme' from 'acme.myco.com'
    return db.brands.findBySlug(slug)        // { slug, name, accent, logo, ... }
  }
})`,"js"))}
      <p><code>ctx.brand</code> is available in <code>guard</code>, <code>server</code> fetchers, and any <code>meta</code> field. Meta fields can be functions that receive <code>ctx</code> \u2014 Pulse calls them per request:</p>
      ${o(t(`export default {
  route: '/',

  meta: {
    title:       (ctx) => \`\${ctx.brand.name} \u2014 Home\`,
    description: (ctx) => ctx.brand.tagline,
    styles:      (ctx) => ['/pulse-ui.css', \`/themes/\${ctx.brand.slug}.css\`],
  },

  // Expose brand config to the view via server state
  server: {
    brand: (ctx) => ctx.brand,
  },

  view: (state, { brand }) => \`
    <header>
      <img src="\${brand.logo}" alt="\${brand.name}">
      <nav>...</nav>
    </header>
    <main>...</main>
  \`,

  guard: async (ctx) => {
    if (!ctx.brand) return { redirect: '/not-found' }
  },
}`,"js"))}
      ${s("tip","Keep brand theme differences in CSS custom properties. One <code>/pulse-ui.css</code> handles layout and components \u2014 each <code>/themes/brand.css</code> only overrides <code>:root</code> variables like <code>--color-accent</code> and <code>--font-heading</code>. Theme files are typically under 1 kB.")}

      ${e("startup-validation","Startup validation")}
      <p>All specs are validated against the Pulse schema at startup. An invalid spec throws before the server accepts any connections \u2014 misconfigured specs are caught immediately, not when a user first hits the route. There is no silent failure path.</p>

      ${e("static-files","Static file serving")}
      <p>When <code>staticDir</code> is set, Pulse serves all files in that directory at their relative path. For example, a file at <code>public/app.css</code> is served at <code>/app.css</code>.</p>
      <p>If <code>staticDir/dist/manifest.json</code> exists, Pulse automatically loads it to resolve production hydration bundle paths. No additional configuration is needed.</p>
      ${o(t(`createServer(specs, {
  staticDir: 'public',   // serves public/* at /*
  // manifest auto-detected from public/dist/manifest.json
})`,"js"))}

      ${e("response-behaviour","Response behaviour")}
      ${r(["Request type","Response"],[["Full page request (GET/HEAD)","SSR HTML with doctype, head, body, and optional hydration script"],["<code>X-Pulse-Navigate: true</code> header","JSON: <code>{ html, title, hydrate, serverState }</code> for client-side navigation"],["POST/PUT/DELETE to a raw response spec","Handled by <code>spec.render</code> \u2014 used for webhooks and API endpoints"],["POST/PUT/DELETE to a page spec","405 Method Not Allowed"],["Static file","File contents with appropriate Content-Type"],["No matching route","404 response"]])}

      ${e("body-parsing","Reading request bodies")}
      <p>Body parsing is available in <code>guard</code>, <code>server.*</code> fetchers, and <code>render</code> (raw specs). All methods are lazy \u2014 the stream is consumed once and the result is memoised per request.</p>
      ${r(["Method","Returns","Description"],[["<code>await ctx.json()</code>","<code>object | null</code>","Parse a JSON request body. Returns <code>null</code> for an empty body."],["<code>await ctx.text()</code>","<code>string</code>","Read the body as a plain string."],["<code>await ctx.formData()</code>","<code>object | null</code>","Parse a URL-encoded body into a plain object. Returns <code>null</code> for an empty body."],["<code>await ctx.buffer()</code>","<code>Buffer</code>","Read the raw body as a Node.js Buffer."]])}
      <p>Bodies larger than <code>maxBody</code> (default 1 MB) are rejected with a <strong>413</strong> before the handler runs. Set <code>maxBody</code> in <code>createServer</code> options to adjust.</p>
      <p>Page specs only accept <strong>GET and HEAD</strong> by default \u2014 POST returns 405. To accept other methods, declare <code>spec.methods</code>:</p>
      ${o(t(`export default {
  route:   '/contact',
  methods: ['GET', 'POST'],

  guard: async (ctx) => {
    if (ctx.method === 'POST') {
      const data = await ctx.formData()
      if (!data.email) return { status: 422, json: { error: 'Email required' } }
      await db.leads.create(data)
      return { redirect: '/contact?sent=1' }
    }
  },

  state: {},
  view: () => \`<form method="POST">...</form>\`,
}`,"js"))}
      ${s("note","Raw response specs (<code>contentType</code> set) accept any HTTP method without <code>spec.methods</code> \u2014 they are always method-agnostic.")}

      ${e("escaping","Escaping user data")}
      <p>Import <code>escHtml</code> from <code>@invisibleloop/pulse/html</code> to safely embed untrusted values in HTML view strings:</p>
      ${o(t(`import { escHtml } from '@invisibleloop/pulse/html'

view: (state) => \`
  <p>Hello, \${escHtml(state.username)}</p>
\``,"js"))}
      ${s("warning","Always use <code>escHtml</code> around values that originate from user input, URL params, or external APIs. Omitting it is an XSS vulnerability.")}
      <p>To use a nonce on a view-authored inline script, pass <code>ctx.nonce</code> through a server fetcher:</p>
      ${o(t(`server: {
  meta: async (ctx) => ({ nonce: ctx.nonce }),
},

view: (state, server) => \`
  <script nonce="\${server.meta.nonce}">console.log('inline ok')<\/script>
\``,"js"))}
      <p>Inline scripts without the matching nonce are blocked by the CSP.</p>

      ${e("security-headers","Security headers")}
      <p>Pulse sends the following headers on <strong>every</strong> response \u2014 including 404 and 500 errors. There is no configuration required and no way to accidentally omit them:</p>
      ${o(t(`X-Content-Type-Options:       nosniff
X-Frame-Options:              DENY
Referrer-Policy:              strict-origin-when-cross-origin
Permissions-Policy:           camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy:   same-origin
Cross-Origin-Resource-Policy: same-origin`,"bash"))}

      ${e("csp","Content Security Policy")}
      <p>HTML page responses include a <code>Content-Security-Policy</code> header. Scripts require a per-request cryptographic nonce; stylesheets are restricted to same-origin; everything else defaults to <code>'none'</code>:</p>
      ${o(t(`Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-{random}';
  style-src 'self';
  style-src-attr 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'`,"bash"))}
      <p>All inline scripts injected by the framework carry a matching <code>nonce</code> attribute. The nonce is also available as <code>ctx.nonce</code> so view functions can attach it to their own inline scripts.</p>
      <p>To load resources from external origins \u2014 Google Fonts, a CDN, an external API \u2014 pass a <code>csp</code> object to <code>createServer</code>. Sources are merged into the framework defaults; existing directives are not replaced:</p>
      ${o(t(`createServer(specs, {
  csp: {
    'style-src': ['https://fonts.googleapis.com'],
    'font-src':  ['https://fonts.gstatic.com'],
    'connect-src': ['https://api.example.com'],
    'img-src': ['https://images.unsplash.com'],
  },
})`,"js"))}
      ${s("note",`The <code>style-src-attr 'unsafe-inline'</code> directive is required for inline <code>style="..."</code> attributes used by the UI component library to set CSS custom properties (e.g. spinner size, progress fill). It is scoped to attributes only \u2014 <code>&lt;style&gt;</code> blocks are fully nonce-controlled.`)}

      ${e("hsts","HSTS")}
      <p>When a request arrives with <code>x-forwarded-proto: https</code> (or over a TLS socket), Pulse adds:</p>
      ${o(t("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload","bash"))}
      <p>This is automatic \u2014 no configuration required. On plain HTTP the header is omitted. The <code>preload</code> directive means you can submit the domain to <a href="https://hstspreload.org" target="_blank" rel="noopener">hstspreload.org</a> so browsers enforce HTTPS before the first connection \u2014 this is a separate manual step, not automatic.</p>

      ${e("cookies","Cookie defaults")}
      <p>Cookies set via <code>ctx.setCookie()</code> default to <code>SameSite=Lax</code>. CSRF protection is on by default \u2014 omitting a <code>sameSite</code> option does not weaken it.</p>

      ${e("compression","Compression")}
      <p>Pulse compresses all compressible responses using brotli (preferred) or gzip (fallback), based on the <code>Accept-Encoding</code> header. Streaming responses use transform streams so compression and delivery happen concurrently.</p>

      ${e("nav-header","X-Pulse-Navigate header")}
      <p>When a request includes <code>X-Pulse-Navigate: true</code>, Pulse returns a JSON response instead of full HTML. This is used by the client-side navigation system to swap page content without a full reload:</p>
      ${o(t(`{
  "html":        "<main>...rendered content...</main>",
  "title":       "Page Title \u2014 Site",
  "hydrate":     "/dist/page.boot-abc123.js",
  "serverState": { "product": { "id": 1, "name": "..." } }
}`,"js"))}

      ${e("health-check","Health check endpoint")}
      <p>Pulse exposes a built-in health check at <code>/healthz</code> (configurable). It responds before <code>onRequest</code>, static file serving, and route matching \u2014 so load balancers and orchestration systems always get a response even if a hook is faulty.</p>
      ${o(t(`GET /healthz \u2192 200 OK
{ "status": "ok", "uptime": 42.3 }`,"json"))}
      <p>Configure the path or disable it entirely:</p>
      ${o(t(`createServer(specs, {
  healthCheck: '/ping',   // custom path
  // healthCheck: false,  // disable
})`,"js"))}
      ${s("note","<code>HEAD /healthz</code> is also supported \u2014 returns the same status headers with no body. The endpoint sets <code>Cache-Control: no-store</code> so proxies never serve a stale health status.")}

      ${e("graceful-shutdown","Graceful shutdown")}
      <p>Pulse registers <code>SIGTERM</code> and <code>SIGINT</code> handlers automatically. When either signal arrives:</p>
      <ol>
        <li><code>server.close()</code> stops accepting new connections.</li>
        <li>Idle keep-alive sockets are destroyed immediately.</li>
        <li>In-flight requests are allowed to finish naturally.</li>
        <li>After <code>shutdownTimeout</code> ms (default 30 000 ms), the process force-exits to prevent a stuck request from blocking a deploy indefinitely.</li>
      </ol>
      <p>The <code>shutdown()</code> function is also returned from <code>createServer</code> so you can trigger it programmatically:</p>
      ${o(t(`const { server, shutdown } = createServer(specs, {
  port:            3000,
  shutdownTimeout: 10000,  // 10 s \u2014 override the 30 s default
})

// SIGTERM is already wired automatically.
// Call manually when needed \u2014 idempotent, safe to call multiple times.
shutdown()`,"js"))}
      ${s("note","Idle keep-alive sockets are destroyed immediately on shutdown. In-flight streaming responses finish sending before the socket is closed \u2014 no partial responses are delivered to clients.")}
    `})};var c=document.getElementById("pulse-root");c&&!c.dataset.pulseMounted&&(c.dataset.pulseMounted="1",a(d,c,window.__PULSE_SERVER__||{},{ssr:!0}),u(c,a));var T=d;export{T as default};
