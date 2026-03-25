import{a as s}from"./runtime-QFURDKA2.js";import{a as n,b as d,c as l,d as h,e,g as t,h as a,i as o}from"./runtime-OFZXJMSU.js";import{a as c,b as p}from"./runtime-B73WLANC.js";var{prev:u,next:f}=n("/store"),i={route:"/store",meta:{title:"Global Store \u2014 Pulse Docs",description:"Share server-fetched data across pages with a global store in Pulse.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/store",prev:u,next:f,content:`
      ${l("Global Store")}
      ${h("The global store is a single shared data layer. Declare server fetchers once in <code>pulse.store.js</code> \u2014 user profiles, settings, feature flags \u2014 and any page can access them by name. No prop drilling, no repeated fetches.")}

      ${e("when-to-use","When to use the store")}
      <p>The store is the right tool when the same server data is needed on multiple pages and it would be wasteful to redeclare the same fetcher in every spec:</p>
      <ul>
        <li>Current user / session \u2014 <code>store.user</code></li>
        <li>App settings or feature flags \u2014 <code>store.settings</code></li>
        <li>Navigation items that come from a CMS \u2014 <code>store.nav</code></li>
        <li>Subscription or plan level \u2014 <code>store.plan</code></li>
      </ul>
      ${o("note",'The store has no client-side reactivity. Data is fetched on the server per request and is available to the view at mount time. For page-specific data, use <a href="/server-data"><code>spec.server</code></a> instead.')}

      ${e("defining","Defining the store")}
      <p>Create a <code>pulse.store.js</code> file at the root of your project. Export a plain object with an optional <code>state</code> (default values) and a <code>server</code> map of async fetchers:</p>
      ${t(s(`// pulse.store.js
export default {
  // Default / fallback values used on the server before fetchers resolve
  state: {
    user:     null,
    settings: { theme: 'dark', lang: 'en' },
    nav:      [],
  },

  // Server fetchers \u2014 run once per request, results override state defaults
  server: {
    user:     async (ctx) => db.users.findByCookie(ctx.cookies.session),
    settings: async (ctx) => db.settings.forUser(ctx.cookies.userId),
    nav:      async ()    => cms.getNavItems(),
  },
}`,"js"))}

      ${e("registering","Registering the store")}
      <p>Pass your store to <code>createServer</code> via the <code>store</code> option. The store is validated at startup \u2014 bad fetchers throw before the server accepts connections:</p>
      ${t(s(`import { createServer } from '@invisibleloop/pulse'
import store from './pulse.store.js'
import { dashboardSpec } from './src/pages/dashboard.js'
import { settingsSpec }  from './src/pages/settings.js'

createServer([dashboardSpec, settingsSpec], {
  port:      3000,
  staticDir: 'public',
  store,                 // \u2190 register the global store
})`,"js"))}

      ${e("using","Using store data in a page")}
      <p>Declare which store keys a page needs using the <code>store</code> field. Those keys are merged into the <code>server</code> argument of the view \u2014 alongside any page-level server data:</p>
      ${t(s(`// src/pages/dashboard.js
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
}`,"js"))}
      <p>Only the keys listed in <code>spec.store</code> are available in the view \u2014 nothing leaks from the store to pages that do not declare a dependency on it. Page-level <code>server</code> keys always win if there is a name collision with the store.</p>

      ${e("ctx-store","Accessing the store in server fetchers")}
      <p>Store data is resolved before page server fetchers run. The full resolved store state is available as <code>ctx.store</code> in any page's <code>server</code> fetcher, <code>guard</code>, and <code>meta</code> functions:</p>
      ${t(s(`export default {
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
}`,"js"))}

      ${e("store-field-reference","Store field reference")}
      ${a(["Field","Type","Description"],[["<code>state</code>","object","Default values. Used as fallbacks when a server fetcher returns <code>undefined</code> or the server key is absent."],["<code>server</code>","object of functions","Async fetchers \u2014 <code>async (ctx) => value</code>. Receive the same <code>ctx</code> as page server fetchers. Results override <code>state</code> defaults."]])}

      ${e("spec-store-reference","spec.store field")}
      ${a(["Field","Type","Description"],[["<code>store</code>","string[]","Array of store key strings to make available in the view's <code>server</code> argument. e.g. <code>['user', 'settings']</code>"]])}
      ${o("tip","Pages that do not declare <code>store</code> receive no store data \u2014 the store never leaks to pages that do not ask for it.")}

      ${e("reactivity","Reactive updates \u2014 no refresh needed")}
      <p>When a page action changes store data, all other mounted pages that subscribe to the affected keys re-render immediately \u2014 no page refresh, no polling.</p>
      <p>Return <code>_storeUpdate</code> from a page action's <code>onSuccess</code> to push a change into the global store:</p>
      ${t(s(`// src/pages/settings.js
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
        _storeUpdate: { settings: { theme } },  // \u2190 push to global store
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
}`,"js"))}
      <p>Any other page that has <code>store: ['settings']</code> will re-render with the new theme value the moment <code>_storeUpdate</code> is dispatched \u2014 without navigating away or refreshing.</p>
      ${o("note","<code>_storeUpdate</code> is stripped from the local page state \u2014 it is only forwarded to the store. The rest of the <code>onSuccess</code> return is merged into the page's own state as usual.")}

      ${e("caching","Caching and performance")}
      <p>Store fetchers run once per request, in parallel. They share the same request context as page server fetchers, so they can read cookies, params, and headers to scope data to the current user.</p>
      <p>If your store data changes infrequently (nav items from a CMS, feature flags), consider adding a <code>serverTtl</code> to the relevant page spec to cache the full rendered HTML \u2014 or caching inside the fetcher itself:</p>
      ${t(s(`// pulse.store.js \u2014 cache nav items in-process for 60 seconds
import { createCache } from './src/lib/cache.js'

const navCache = createCache(60)

export default {
  server: {
    nav: async () => navCache.getOrFetch('nav', () => cms.getNavItems()),
  },
}`,"js"))}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",c(i,r,window.__PULSE_SERVER__||{},{ssr:!0}),p(r,c));var x=i;export{x as default};
