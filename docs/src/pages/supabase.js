import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/supabase')

export default {
  route: '/supabase',
  meta: {
    title: 'Supabase — Pulse Docs',
    description: 'Integrate Supabase database queries, authentication, and file storage with Pulse server fetchers, actions, and guard.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/supabase',
    prev,
    next,
    content: `
      ${h1('Supabase')}
      ${lead('Supabase provides Postgres, authentication, and file storage. In Pulse, all Supabase queries run in server fetchers — credentials stay on the server, query results are filtered before serialisation, and <code>guard</code> enforces session checks before any data is fetched.')}

      ${section('setup', 'Setup')}
      ${codeBlock(highlight(`npm install @supabase/supabase-js`, 'bash'))}
      ${codeBlock(highlight(`# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key   # server-side only`, 'bash'))}
      <p>Create two client helpers — one for public queries (respects Row Level Security), one for admin operations:</p>
      ${codeBlock(highlight(`// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = process.env

// Public client — use in server fetchers for user-scoped queries
export function supabase(accessToken) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: accessToken
      ? { headers: { Authorization: \`Bearer \${accessToken}\` } }
      : {},
  })
  return client
}

// Admin client — bypasses RLS; use only for trusted server operations
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)`, 'js'))}
      ${callout('warning', 'The service key bypasses Row Level Security and has full database access. Keep it server-side only — in environment variables that are never sent to the browser or included in logs.')}

      ${section('querying', 'Querying data')}
      <p>Call Supabase inside <code>server</code> fetchers — they run on the server before every render. The result is passed to <code>view</code> as the second argument.</p>
      ${codeBlock(highlight(`// src/pages/posts.js
import { supabase } from '../lib/supabase.js'
import { escHtml } from '@invisibleloop/pulse/html'

export default {
  route: '/posts',

  server: {
    posts: async () => {
      const { data, error } = await supabase().from('posts')
        .select('id, title, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)
      return data
    },
  },

  state: {},

  view: (_state, server) => \`
    <main id="main-content">
      <h1>Posts</h1>
      <ul>
        \${server.posts.map(p => \`
          <li><a href="/posts/\${escHtml(p.slug)}">\${escHtml(p.title)}</a></li>
        \`).join('')}
      </ul>
    </main>
  \`,
}`, 'js'))}
      ${callout('tip', 'Add <code>serverTtl</code> to cache the Supabase query result in-process. A 60-second TTL on a public listing page means one database hit per minute across all visitors — Supabase stays fast even under load.')}

      ${section('auth-setup', 'Authentication')}
      <p>Supabase Auth issues a JWT access token and a refresh token on login. Store both in <code>httpOnly</code> cookies — they are never accessible to JavaScript and survive page navigations.</p>

      ${section('login', 'Login page')}
      ${codeBlock(highlight(`// src/pages/auth/login.js
import { supabase } from '../../lib/supabase.js'
import { escHtml } from '@invisibleloop/pulse/html'

export default {
  route: '/login',

  guard: async (ctx) => {
    // Already logged in — send to dashboard
    if (ctx.cookies.access_token) return { redirect: '/dashboard' }
  },

  state: { status: 'idle', error: '' },

  view: (state) => \`
    <main id="main-content">
      <h1>Sign in</h1>
      <form data-action="login">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required autocomplete="email">

        <label for="password">Password</label>
        <input id="password" name="password" type="password" required autocomplete="current-password">

        \${state.error ? \`<p role="alert">\${escHtml(state.error)}</p>\` : ''}

        <button type="submit">
          \${state.status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  \`,

  actions: {
    login: {
      onStart: () => ({ status: 'loading', error: '' }),

      run: async (_state, _server, formData) => {
        const { data, error } = await supabase().auth.signInWithPassword({
          email:    formData.get('email'),
          password: formData.get('password'),
        })
        if (error) throw new Error(error.message)
        return data.session
      },

      onSuccess: (state, session, ctx) => {
        const opts = { httpOnly: true, sameSite: 'Lax', path: '/' }
        ctx.setCookie('access_token',  session.access_token,  { ...opts, maxAge: 3600 })
        ctx.setCookie('refresh_token', session.refresh_token, { ...opts, maxAge: 604800 })
        ctx.setHeader('Location', '/dashboard')
        return { status: 'success' }
      },

      onError: (_state, err) => ({
        status: 'idle',
        error:  err.message || 'Sign in failed',
      }),
    },
  },
}`, 'js'))}

      ${section('guard', 'Protecting routes')}
      <p>Use <code>guard</code> to verify the session before any server data is fetched. Pass the token to your fetchers so Supabase enforces Row Level Security for that user.</p>
      ${codeBlock(highlight(`// src/pages/dashboard.js
import { supabase, admin } from '../lib/supabase.js'

export default {
  route: '/dashboard',

  guard: async (ctx) => {
    const token = ctx.cookies.access_token
    if (!token) return { redirect: '/login' }

    // Verify the token is still valid
    const { error } = await supabase(token).auth.getUser()
    if (error) return { redirect: '/login' }
  },

  server: {
    // Token is available in guard ctx — pass it through server state or
    // re-read from cookies in the fetcher
    profile: async (ctx) => {
      const { data } = await supabase(ctx.cookies.access_token)
        .from('profiles')
        .select('name, plan')
        .single()
      return data
    },
  },

  state: {},
  view: (_state, server) => \`
    <main id="main-content">
      <h1>Dashboard</h1>
      <p>Welcome, \${server.profile.name}</p>
    </main>
  \`,
}`, 'js'))}
      ${callout('note', 'Row Level Security is enforced by Postgres, not by your application code. A policy that checks <code>auth.uid() = user_id</code> means a bug in your server code cannot accidentally expose another user\'s data — the database rejects the query before it returns anything.')}

      ${section('logout', 'Logout')}
      ${codeBlock(highlight(`// src/pages/auth/logout.js
export default {
  route: '/logout',
  contentType: 'text/html',

  render: (ctx) => {
    const opts = { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 0 }
    ctx.setCookie('access_token',  '', opts)
    ctx.setCookie('refresh_token', '', opts)
    return { redirect: '/login' }
  },
}`, 'js'))}

      ${section('signup', 'Sign up')}
      ${codeBlock(highlight(`// src/pages/auth/signup.js
import { supabase } from '../../lib/supabase.js'
import { escHtml } from '@invisibleloop/pulse/html'

export default {
  route: '/signup',

  state: { status: 'idle', error: '' },

  view: (state) => \`
    <main id="main-content">
      <h1>Create account</h1>
      \${state.status === 'success'
        ? '<p role="status">Check your email to confirm your account.</p>'
        : \`
        <form data-action="signup">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required>

          <label for="password">Password</label>
          <input id="password" name="password" type="password" required minlength="8">

          \${state.error ? \`<p role="alert">\${escHtml(state.error)}</p>\` : ''}

          <button type="submit">
            \${state.status === 'loading' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        \`}
    </main>
  \`,

  actions: {
    signup: {
      onStart: () => ({ status: 'loading', error: '' }),

      run: async (_state, _server, formData) => {
        const { error } = await supabase().auth.signUp({
          email:    formData.get('email'),
          password: formData.get('password'),
        })
        if (error) throw new Error(error.message)
      },

      onSuccess: () => ({ status: 'success', error: '' }),
      onError:   (_state, err) => ({ status: 'idle', error: err.message }),
    },
  },
}`, 'js'))}

      ${section('storage', 'File storage')}
      <p>Upload files to Supabase Storage from an action. The file arrives in <code>FormData</code> — convert it to an <code>ArrayBuffer</code> and pass it to the storage client.</p>
      ${codeBlock(highlight(`// src/pages/upload.js
import { admin } from '../lib/supabase.js'
import { escHtml } from '@invisibleloop/pulse/html'

export default {
  route: '/upload',

  state: { status: 'idle', url: '', error: '' },

  view: (state) => \`
    <main id="main-content">
      <h1>Upload file</h1>
      <form data-action="upload" enctype="multipart/form-data">
        <input name="file" type="file" accept="image/*" required>
        <button type="submit">
          \${state.status === 'loading' ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      \${state.url ? \`<img src="\${escHtml(state.url)}" alt="Uploaded file" width="400" height="300">\` : ''}
      \${state.error ? \`<p role="alert">\${escHtml(state.error)}</p>\` : ''}
    </main>
  \`,

  actions: {
    upload: {
      onStart: () => ({ status: 'loading', error: '' }),

      run: async (_state, _server, formData) => {
        const file = formData.get('file')
        const buffer = await file.arrayBuffer()
        const ext    = file.name.split('.').pop()
        const path   = \`\${crypto.randomUUID()}.\${ext}\`

        const { error } = await admin.storage
          .from('uploads')
          .upload(path, buffer, { contentType: file.type })

        if (error) throw new Error(error.message)

        const { data } = admin.storage.from('uploads').getPublicUrl(path)
        return data.publicUrl
      },

      onSuccess: (_state, url) => ({ status: 'idle', url }),
      onError:   (_state, err) => ({ status: 'idle', error: err.message }),
    },
  },
}`, 'js'))}

      ${section('rls', 'Row Level Security')}
      <p>Always enable RLS on tables that hold user data. A minimal policy that lets users read only their own rows:</p>
      ${codeBlock(highlight(`-- Enable RLS on the table
alter table posts enable row level security;

-- Users can only select their own posts
create policy "users read own posts"
  on posts for select
  using (auth.uid() = user_id);

-- Users can only insert rows for themselves
create policy "users insert own posts"
  on posts for insert
  with check (auth.uid() = user_id);`, 'bash'))}
      ${callout('tip', 'The public client (with the user\'s access token) applies Row Level Security — queries are automatically scoped to that user\'s data. The admin client bypasses RLS entirely, which is what you want for webhook handlers, background jobs, and admin operations, but not for user-scoped queries.')}
    `,
  }),
}
