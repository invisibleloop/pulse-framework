import{a as o}from"./runtime-QFURDKA2.js";import{a as i,b as u,c as d,d as h,e,g as t,h as s,i as n}from"./runtime-L2HNXIHW.js";import{a as c,b as l}from"./runtime-B73WLANC.js";var{prev:p,next:A}=i("/auth"),a={route:"/auth",meta:{title:"Auth (Auth0) \u2014 Pulse Docs",description:"Integrating Auth0 OAuth authentication with Pulse using guard functions, ctx.setCookie, and raw response specs.",styles:["/docs.css"]},state:{},view:()=>u({currentHref:"/auth",prev:p,next:A,content:`
      ${d("Auth (Auth0)")}
      ${h("Pulse integrates with Auth0 \u2014 and any OAuth 2.0 provider \u2014 using plain HTTP redirects and a token exchange. No client-side auth SDK is required. Protected routes enforce access through <code>guard</code>, which runs before any data fetcher can execute.")}

      ${n("info","No Auth0 SDK required. The OAuth flow is plain HTTP redirects and a token exchange fetch \u2014 no client-side library needed.")}

      ${e("setup","Setup")}
      <p>Register your application in Auth0 and note your credentials. Store them in environment variables \u2014 never hardcode them in specs.</p>
      ${t(o(`# .env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback`,"bash"))}

      ${e("login","Login route")}
      <p>The login route is a raw response spec that redirects the browser to Auth0's authorization endpoint.</p>
      ${t(o(`// src/pages/auth/login.js
const {
  AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CALLBACK_URL
} = process.env

export default {
  route: '/auth/login',
  contentType: 'text/html',

  render: (ctx) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     AUTH0_CLIENT_ID,
      redirect_uri:  AUTH0_CALLBACK_URL,
      scope:         'openid profile email',
      state:         crypto.randomUUID(),
    })
    ctx.setHeader('Location', \`https://\${AUTH0_DOMAIN}/authorize?\${params}\`)
    return { redirect: \`https://\${AUTH0_DOMAIN}/authorize?\${params}\` }
  },
}`,"js"))}

      ${e("callback","Callback route")}
      <p>Auth0 redirects back to <code>/auth/callback</code> with a <code>code</code> query parameter. The server exchanges it for tokens, sets a session cookie, and redirects to the app.</p>
      ${t(o(`// src/pages/auth/callback.js
const {
  AUTH0_DOMAIN, AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET, AUTH0_CALLBACK_URL
} = process.env

export default {
  route: '/auth/callback',
  contentType: 'text/html',

  server: {
    session: async (ctx) => {
      const { code } = ctx.query
      if (!code) return null

      // Exchange auth code for tokens
      const res = await fetch(\`https://\${AUTH0_DOMAIN}/oauth/token\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type:    'authorization_code',
          client_id:     AUTH0_CLIENT_ID,
          client_secret: AUTH0_CLIENT_SECRET,
          redirect_uri:  AUTH0_CALLBACK_URL,
          code,
        }),
      })

      if (!res.ok) return null
      const { access_token, id_token } = await res.json()

      // Set a secure session cookie with the access token
      ctx.setCookie('session', access_token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge:   86400, // 24 hours
      })

      return access_token
    },
  },

  render: (ctx, server) => {
    if (!server.session) return { redirect: '/auth/login' }
    return { redirect: '/' }
  },
}`,"js"))}

      ${e("logout","Logout route")}
      <p>Clear the session cookie and redirect to Auth0's logout endpoint to invalidate the session there too.</p>
      ${t(o(`// src/pages/auth/logout.js
const { AUTH0_DOMAIN, AUTH0_CLIENT_ID } = process.env

export default {
  route: '/auth/logout',
  contentType: 'text/html',

  render: (ctx) => {
    // Expire the session cookie
    ctx.setCookie('session', '', { maxAge: 0 })

    const returnTo = encodeURIComponent('http://localhost:3000')
    return { redirect: \`https://\${AUTH0_DOMAIN}/v2/logout?client_id=\${AUTH0_CLIENT_ID}&returnTo=\${returnTo}\` }
  },
}`,"js"))}

      ${e("guard","Protecting routes")}
      <p>Use <code>guard</code> to verify the session token before any server data is fetched. For production, verify the JWT signature locally rather than calling Auth0 on every request.</p>
      ${t(o(`// src/pages/dashboard.js
export default {
  route: '/dashboard',

  guard: async (ctx) => {
    if (!ctx.cookies.session) return { redirect: '/auth/login' }

    // Optional: verify JWT signature for production
    // const user = await verifyJwt(ctx.cookies.session)
    // if (!user) return { redirect: '/auth/login' }
  },

  server: {
    profile: async (ctx) => fetchUserProfile(ctx.cookies.session),
  },

  state: {},
  view: (state, server) => \`
    <main id="main-content">
      <h1>Welcome, \${server.profile.name}</h1>
    </main>
  \`,
}`,"js"))}

      ${n("info","Guard runs before server data fetchers \u2014 if the session is invalid the profile fetch never happens.")}

      ${e("ctx-reference","ctx reference")}
      ${s(["Method","Description"],[["<code>ctx.cookies.session</code>","Read the session cookie set during OAuth callback"],["<code>ctx.setCookie(name, value, opts)</code>","Set a response cookie \u2014 used in callback and logout routes"],["<code>ctx.setHeader(name, value)</code>","Set an arbitrary response header"]])}

      ${s(["setCookie option","Type","Description"],[["<code>httpOnly</code>","boolean","Prevents JS access \u2014 always use for session cookies"],["<code>secure</code>","boolean","HTTPS only \u2014 set <code>true</code> in production"],["<code>sameSite</code>",'<code>"Lax" | "Strict" | "None"</code>',"<code>Lax</code> works for most OAuth flows"],["<code>maxAge</code>","number","Lifetime in seconds \u2014 omit for session cookie"],["<code>path</code>","string","Defaults to <code>/</code>"],["<code>domain</code>","string","Scope to a domain \u2014 omit for current host"]])}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",c(a,r,window.__PULSE_SERVER__||{},{ssr:!0}),l(r,c));var y=a;export{y as default};
