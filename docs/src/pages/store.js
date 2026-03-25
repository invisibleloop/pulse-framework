import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/store')

export default {
  route: '/store',
  meta: {
    title: 'Global Store — Pulse Docs',
    description: 'Share server-fetched data across pages with a global store in Pulse.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/store',
    prev,
    next,
    content: `
      ${h1('Global Store')}
      ${lead('The global store is a single shared data layer. Declare server fetchers once in <code>pulse.store.js</code> — user profiles, settings, feature flags — and any page can access them by name. No prop drilling, no repeated fetches.')}

      ${section('when-to-use', 'When to use the store')}
      <p>The store is the right tool when the same server data is needed on multiple pages and it would be wasteful to redeclare the same fetcher in every spec:</p>
      <ul>
        <li>Current user / session — <code>store.user</code></li>
        <li>App settings or feature flags — <code>store.settings</code></li>
        <li>Navigation items that come from a CMS — <code>store.nav</code></li>
        <li>Subscription or plan level — <code>store.plan</code></li>
      </ul>
      ${callout('note', 'The store has no client-side reactivity. Data is fetched on the server per request and is available to the view at mount time. For page-specific data, use <a href="/server-data"><code>spec.server</code></a> instead.')}

      ${section('defining', 'Defining the store')}
      <p>Create a <code>pulse.store.js</code> file at the root of your project. Export a plain object with an optional <code>state</code> (default values) and a <code>server</code> map of async fetchers:</p>
      ${codeBlock(highlight(`// pulse.store.js
export default {
  // Default / fallback values used on the server before fetchers resolve
  state: {
    user:     null,
    settings: { theme: 'dark', lang: 'en' },
    nav:      [],
  },

  // Server fetchers — run once per request, results override state defaults
  server: {
    user:     async (ctx) => db.users.findByCookie(ctx.cookies.session),
    settings: async (ctx) => db.settings.forUser(ctx.cookies.userId),
    nav:      async ()    => cms.getNavItems(),
  },
}`, 'js'))}

      ${section('registering', 'Registering the store')}
      <p>Pass your store to <code>createServer</code> via the <code>store</code> option. The store is validated at startup — bad fetchers throw before the server accepts connections:</p>
      ${codeBlock(highlight(`import { createServer } from '@invisibleloop/pulse'
import store from './pulse.store.js'
import { dashboardSpec } from './src/pages/dashboard.js'
import { settingsSpec }  from './src/pages/settings.js'

createServer([dashboardSpec, settingsSpec], {
  port:      3000,
  staticDir: 'public',
  store,                 // ← register the global store
})`, 'js'))}

      ${section('using', 'Using store data in a page')}
      <p>Declare which store keys a page needs using the <code>store</code> field. Those keys are merged into the <code>server</code> argument of the view — alongside any page-level server data:</p>
      ${codeBlock(highlight(`// src/pages/dashboard.js
export default {
  route:    '/dashboard',
  store:    ['user', 'settings'],   // declare which store keys this page uses

  // Page-level server data still works alongside store data
  server: {
    stats: async (ctx) => db.stats.forUser(ctx.store.user?.id),
  },

  state: { filter: 'week' },

  view: (state, server) => \`
    <main>
      <h1>Hello, \${server.user?.name ?? 'there'}</h1>
      <p>Theme: \${server.settings.theme}</p>
      <p>Stats: \${server.stats.total} requests this \${state.filter}</p>
    </main>
  \`,
}`, 'js'))}
      <p>Only the keys listed in <code>spec.store</code> are available in the view — nothing leaks from the store to pages that do not declare a dependency on it. Page-level <code>server</code> keys always win if there is a name collision with the store.</p>

      ${section('ctx-store', 'Accessing the store in server fetchers')}
      <p>Store data is resolved before page server fetchers run. The full resolved store state is available as <code>ctx.store</code> in any page's <code>server</code> fetcher, <code>guard</code>, and <code>meta</code> functions:</p>
      ${codeBlock(highlight(`export default {
  route: '/account',
  store: ['user'],

  // Guard can use ctx.store to check auth before fetching page data
  guard: async (ctx) => {
    if (!ctx.store.user) return { redirect: '/login' }
  },

  // Server fetchers receive ctx.store with the resolved store state
  server: {
    orders: async (ctx) => db.orders.forUser(ctx.store.user.id),
  },

  view: (state, server) => \`
    <h1>Orders for \${server.user.name}</h1>
  \`,
}`, 'js'))}

      ${section('store-field-reference', 'Store field reference')}
      ${table(
        ['Field', 'Type', 'Description'],
        [
          ['<code>state</code>', 'object', 'Default values. Used as fallbacks when a server fetcher returns <code>undefined</code> or the server key is absent.'],
          ['<code>server</code>', 'object of functions', 'Async fetchers — <code>async (ctx) => value</code>. Receive the same <code>ctx</code> as page server fetchers. Results override <code>state</code> defaults.'],
        ]
      )}

      ${section('spec-store-reference', 'spec.store field')}
      ${table(
        ['Field', 'Type', 'Description'],
        [
          ['<code>store</code>', 'string[]', 'Array of store key strings to make available in the view\'s <code>server</code> argument. e.g. <code>[\'user\', \'settings\']</code>'],
        ]
      )}
      ${callout('tip', 'Pages that do not declare <code>store</code> receive no store data — the store never leaks to pages that do not ask for it.')}

      ${section('reactivity', 'Reactive updates — no refresh needed')}
      <p>When a page action changes store data, all other mounted pages that subscribe to the affected keys re-render immediately — no page refresh, no polling.</p>
      <p>Return <code>_storeUpdate</code> from a page action's <code>onSuccess</code> to push a change into the global store:</p>
      ${codeBlock(highlight(`// src/pages/settings.js
export default {
  route:    '/settings',
  store:    ['settings'],
  state:    { saved: false },

  actions: {
    saveTheme: {
      run: async (state, server, payload) => {
        const theme = payload.get('theme')
        await fetch('/api/settings', { method: 'PATCH', body: payload })
        return theme
      },
      onSuccess: (state, theme) => ({
        saved: true,
        _storeUpdate: { settings: { theme } },  // ← push to global store
      }),
      onError: (state, err) => ({ error: err.message }),
    },
  },

  view: (state, server) => \`
    <form data-action="saveTheme">
      <select name="theme">
        <option value="dark"  \${server.settings.theme === 'dark'  ? 'selected' : ''}>Dark</option>
        <option value="light" \${server.settings.theme === 'light' ? 'selected' : ''}>Light</option>
      </select>
      <button type="submit">Save</button>
      \${state.saved ? '<p>Saved!</p>' : ''}
    </form>
  \`,
}`, 'js'))}
      <p>Any other page that has <code>store: ['settings']</code> will re-render with the new theme value the moment <code>_storeUpdate</code> is dispatched — without navigating away or refreshing.</p>
      ${callout('note', '<code>_storeUpdate</code> is stripped from the local page state — it is only forwarded to the store. The rest of the <code>onSuccess</code> return is merged into the page\'s own state as usual.')}

      ${section('caching', 'Caching and performance')}
      <p>Store fetchers run once per request, in parallel. They share the same request context as page server fetchers, so they can read cookies, params, and headers to scope data to the current user.</p>
      <p>If your store data changes infrequently (nav items from a CMS, feature flags), consider adding a <code>serverTtl</code> to the relevant page spec to cache the full rendered HTML — or caching inside the fetcher itself:</p>
      ${codeBlock(highlight(`// pulse.store.js — cache nav items in-process for 60 seconds
import { createCache } from './src/lib/cache.js'

const navCache = createCache(60)

export default {
  server: {
    nav: async () => navCache.getOrFetch('nav', () => cms.getNavItems()),
  },
}`, 'js'))}
    `,
  }),
}
