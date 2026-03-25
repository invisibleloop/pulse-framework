import{a as r}from"./runtime-QFURDKA2.js";import{a as i,b as u,c as h,d as l,e,f as s,g as t,h as a,i as d}from"./runtime-L2HNXIHW.js";import{a as c,b as p}from"./runtime-B73WLANC.js";var{prev:f,next:g}=i("/guard"),n={route:"/guard",meta:{title:"Guard \u2014 Pulse Docs",description:"Per-route authorization in Pulse. Guard functions run before server data fetchers and redirect unauthorized requests.",styles:["/docs.css"]},state:{},view:()=>u({currentHref:"/guard",prev:f,next:g,content:`
      ${h("Guard")}
      ${l("A <code>guard</code> function runs on every request to a route, before any server data is fetched. It is the enforced access control point \u2014 unauthorized requests are redirected before any database queries or data fetchers execute.")}

      ${e("basics","Basic usage")}
      <p>A <code>guard</code> function on any spec receives the same <code>ctx</code> object as server data fetchers \u2014 params, query, headers, and cookies.</p>
      ${t(r(`export default {
  route: '/dashboard',

  guard: async (ctx) => {
    if (!ctx.cookies.session) return { redirect: '/login' }
  },

  server: {
    user: async (ctx) => getCurrentUser(ctx.cookies.session),
  },

  state: {},
  view: (state, server) => \`
    <main id="main-content">
      <h1>Welcome, \${server.user.name}</h1>
    </main>
  \`,
}`,"js"))}

      <p>When the guard returns <code>{ redirect }</code>, the server responds with a <strong>302</strong> and all server data fetchers are skipped \u2014 no data is fetched for unauthorized requests. When the guard returns nothing, the request proceeds normally.</p>

      ${e("ctx","What ctx contains")}
      ${a(["Property / Method","Type","Description"],[["<code>ctx.cookies</code>","object","Parsed cookies from the <code>Cookie</code> header"],["<code>ctx.headers</code>","object","Raw request headers"],["<code>ctx.params</code>","object",'Route params e.g. <code>{ id: "42" }</code>'],["<code>ctx.query</code>","object","Parsed query string"],["<code>ctx.pathname</code>","string","URL path e.g. <code>/dashboard</code>"],["<code>ctx.method</code>","string","HTTP method e.g. <code>GET</code>, <code>POST</code>"],["<code>ctx.store</code>","object","Resolved global store state (if a store is registered)"],["<code>ctx.nonce</code>","string","CSP nonce for the current request"],["<code>await ctx.json()</code>","object | null","Parse a JSON request body"],["<code>await ctx.text()</code>","string","Read the body as a plain string"],["<code>await ctx.formData()</code>","object | null","Parse a URL-encoded body into a plain object"],["<code>await ctx.buffer()</code>","Buffer","Read the raw body as a Node.js Buffer"]])}

      ${e("examples","Common patterns")}

      ${s("Session check")}
      <p>Redirect to login when no session cookie is present.</p>
      ${t(r(`guard: async (ctx) => {
  if (!ctx.cookies.session) return { redirect: '/login' }
}`,"js"))}

      ${s("Role-based access")}
      <p>Fetch the user from the session and check their role. Keep the lookup fast \u2014 guard runs on every request to the route.</p>
      ${t(r(`guard: async (ctx) => {
  const user = await getUserFromSession(ctx.cookies.session)
  if (!user)            return { redirect: '/login' }
  if (!user.isAdmin)    return { redirect: '/403'   }
}`,"js"))}

      ${s("Redirect authenticated users away from login")}
      <p>Useful for login and signup pages \u2014 send already-authenticated users somewhere useful.</p>
      ${t(r(`export default {
  route: '/login',

  guard: async (ctx) => {
    if (ctx.cookies.session) return { redirect: '/dashboard' }
  },

  state: {},
  view: () => \`<main id="main-content">...</main>\`,
}`,"js"))}

      ${d("info","Guard runs server-side on every request, including client-side navigation requests \u2014 those go through the same server pipeline. There is no way to bypass guard from the browser.")}

      ${e("custom-responses","Custom status responses")}
      <p>Guard can return a custom HTTP response instead of (or alongside) a redirect. Return <code>{ status, json?, body?, headers? }</code> to send any status code with an optional JSON or text body. This is useful for POST handlers that need to signal validation errors or API-style rejections:</p>
      ${t(r(`guard: async (ctx) => {
  const token = ctx.headers.authorization
  if (!token) return { status: 401, json: { error: 'Unauthorized' } }

  if (ctx.method === 'POST') {
    const data = await ctx.formData()
    if (!data.email) return { status: 422, json: { error: 'Email required' } }
    await db.leads.create(data)
    return { redirect: '/contact?sent=1' }
  }
  // return nothing to let a GET request proceed to the view
}`,"js"))}
      ${d("note","To use <code>guard</code> as a POST handler, the spec must declare <code>methods: ['GET', 'POST']</code>. Without it, POST requests are rejected with 405 before guard runs.")}

      ${e("reference","Reference")}
      ${a(["Property","Type","Required"],[["<code>guard</code>","<code>async (ctx) =&gt; { redirect?: string } | { status, json?, body?, headers? } | void</code>","No"]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",c(n,o,window.__PULSE_SERVER__||{},{ssr:!0}),p(o,c));var P=n;export{P as default};
