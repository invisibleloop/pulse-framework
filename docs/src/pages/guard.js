import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/guard')

export default {
  route: '/guard',
  meta: {
    title: 'Guard — Pulse Docs',
    description: 'Per-route authorization in Pulse. Guard functions run before server data fetchers and redirect unauthorized requests.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/guard',
    prev,
    next,
    content: `
      ${h1('Guard')}
      ${lead('A <code>guard</code> function runs on every request to a route, before any server data is fetched. It is the enforced access control point — unauthorized requests are redirected before any database queries or data fetchers execute.')}

      ${section('basics', 'Basic usage')}
      <p>A <code>guard</code> function on any spec receives the same <code>ctx</code> object as server data fetchers — params, query, headers, and cookies.</p>
      ${codeBlock(highlight(`export default {
  route: '/dashboard',

  guard: async (ctx) => {
    if (!ctx.cookies.session) return { redirect: '/login' }
  },

  server: {
    user: async (ctx) => getCurrentUser(ctx.cookies.session),
  },

  view: (state, server) => \`
    <main id="main-content">
      <h1>Welcome, \${server.user.name}</h1>
    </main>
  \`,
}`, 'js'))}

      <p>When the guard returns <code>{ redirect }</code>, the server responds with a <strong>302</strong> and all server data fetchers are skipped — no data is fetched for unauthorized requests. When the guard returns nothing, the request proceeds normally.</p>

      ${section('ctx', 'What ctx contains')}
      ${table(
        ['Property / Method', 'Type', 'Description'],
        [
          ['<code>ctx.cookies</code>', 'object', 'Parsed cookies from the <code>Cookie</code> header'],
          ['<code>ctx.headers</code>', 'object', 'Raw request headers'],
          ['<code>ctx.params</code>',  'object', 'Route params e.g. <code>{ id: "42" }</code>'],
          ['<code>ctx.query</code>',   'object', 'Parsed query string'],
          ['<code>ctx.pathname</code>','string',  'URL path e.g. <code>/dashboard</code>'],
          ['<code>ctx.method</code>',  'string',  'HTTP method e.g. <code>GET</code>, <code>POST</code>'],
          ['<code>ctx.store</code>',   'object',  'Resolved global store state (if a store is registered)'],
          ['<code>ctx.nonce</code>',   'string',  'CSP nonce for the current request'],
          ['<code>await ctx.json()</code>',     'object | null', 'Parse a JSON request body'],
          ['<code>await ctx.text()</code>',     'string',        'Read the body as a plain string'],
          ['<code>await ctx.formData()</code>', 'object | null', 'Parse a URL-encoded body into a plain object'],
          ['<code>await ctx.buffer()</code>',   'Buffer',        'Read the raw body as a Node.js Buffer'],
        ]
      )}

      ${section('examples', 'Common patterns')}

      ${sub('Session check')}
      <p>Redirect to login when no session cookie is present.</p>
      ${codeBlock(highlight(`guard: async (ctx) => {
  if (!ctx.cookies.session) return { redirect: '/login' }
}`, 'js'))}

      ${sub('Role-based access')}
      <p>Fetch the user from the session and check their role. Keep the lookup fast — guard runs on every request to the route.</p>
      ${codeBlock(highlight(`guard: async (ctx) => {
  const user = await getUserFromSession(ctx.cookies.session)
  if (!user)            return { redirect: '/login' }
  if (!user.isAdmin)    return { redirect: '/403'   }
}`, 'js'))}

      ${sub('Redirect authenticated users away from login')}
      <p>Useful for login and signup pages — send already-authenticated users somewhere useful.</p>
      ${codeBlock(highlight(`export default {
  route: '/login',

  guard: async (ctx) => {
    if (ctx.cookies.session) return { redirect: '/dashboard' }
  },

  view: () => \`<main id="main-content">...</main>\`,
}`, 'js'))}

      ${callout('info', 'Guard runs server-side on every request, including client-side navigation requests — those go through the same server pipeline. There is no way to bypass guard from the browser.')}

      ${section('custom-responses', 'Custom status responses')}
      <p>Guard can return a custom HTTP response instead of (or alongside) a redirect. Return <code>{ status, json?, body?, headers? }</code> to send any status code with an optional JSON or text body. This is useful for POST handlers that need to signal validation errors or API-style rejections:</p>
      ${codeBlock(highlight(`guard: async (ctx) => {
  const token = ctx.headers.authorization
  if (!token) return { status: 401, json: { error: 'Unauthorized' } }

  if (ctx.method === 'POST') {
    const data = await ctx.formData()
    if (!data.email) return { status: 422, json: { error: 'Email required' } }
    await db.leads.create(data)
    return { redirect: '/contact?sent=1' }
  }
  // return nothing to let a GET request proceed to the view
}`, 'js'))}
      ${callout('note', 'To use <code>guard</code> as a POST handler, the spec must declare <code>methods: [\'GET\', \'POST\']</code>. Without it, POST requests are rejected with 405 before guard runs.')}

      ${section('reference', 'Reference')}
      ${table(
        ['Property', 'Type', 'Required'],
        [
          ['<code>guard</code>', '<code>async (ctx) =&gt; { redirect?: string } | { status, json?, body?, headers? } | void</code>', 'No'],
        ]
      )}
    `,
  }),
}
