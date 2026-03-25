import{a as r}from"./runtime-QFURDKA2.js";import{a as n,b as d,c,d as l,e,g as s,h as p,i as a}from"./runtime-OFZXJMSU.js";import{a as i,b as h}from"./runtime-B73WLANC.js";var{prev:u,next:m}=n("/persist"),o={route:"/persist",meta:{title:"Persist \u2014 Pulse Docs",description:"Persist client state across page refreshes using localStorage.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/persist",prev:u,next:m,content:`
      ${c("Persist")}
      ${l("The <code>persist</code> field declares which state keys survive page refreshes. Everything else resets. The list is explicit \u2014 nothing is persisted unless it is named here, and sensitive data should never appear in it.")}

      ${e("declaring","Declaring persistence")}
      <p><code>persist</code> is an array of dot-path strings. Each path points to a key in state that should be saved:</p>
      ${s(r(`export default {
  route: '/settings',
  state: {
    theme:       'light',
    fontSize:    16,
    sidebarOpen: true,
    user: {
      name:        '',
      preferences: { notifications: true, newsletter: false },
    },
  },
  persist: [
    'theme',
    'fontSize',
    'user.preferences',
  ],
  // ...
}`,"js"))}
      <p>In this example, <code>theme</code>, <code>fontSize</code>, and the entire <code>user.preferences</code> sub-object are saved to <code>localStorage</code>. The <code>sidebarOpen</code> key and <code>user.name</code> are session-only \u2014 they reset on each visit.</p>

      ${e("how-it-works","How it works")}
      <p>On every state update, Pulse serialises the persisted keys and writes them to <code>localStorage</code> under a key derived from the page route. On the next mount, persisted values are read back and merged over the spec's initial state before the view renders.</p>

      ${p(["Step","What happens"],[["First visit","State initialised from <code>spec.state</code>. Nothing in storage yet."],["User interacts","Mutations update state. Persisted keys are written to <code>localStorage</code>."],["Page refresh / return visit","Persisted values loaded from storage and merged over initial state. View renders with restored state."]])}

      ${e("dot-paths","Dot-path notation")}
      <p>Persist keys use the same dot-path notation as <a href="/validation">validation</a>. Entire top-level keys or specific nested sub-objects can be persisted:</p>
      ${s(r(`persist: [
  'theme',                    // top-level key
  'user.preferences',         // nested sub-object (entire object is saved)
  'cart.items',               // array of cart items
]`,"js"))}
      ${a("note","When persisting a nested path like <code>user.preferences</code>, the <em>entire value at that path</em> is saved and restored \u2014 not individual sub-keys within it.")}

      ${e("storage-key","Storage key")}
      <p>Pulse stores persisted state under <code>pulse:[route]</code> in <code>localStorage</code>. For example, a spec with <code>route: '/settings'</code> uses the key <code>pulse:/settings</code>. This namespacing prevents collisions between pages.</p>

      ${e("ssr","SSR and persistence")}
      <p>On the server, <code>localStorage</code> does not exist. The server always renders with the spec's initial state. Persisted values are applied on the client after hydration \u2014 before the first mutation, after mount.</p>
      ${a("warning","If SSR and client state diverge significantly due to persisted values, a content flash may occur. Best practice: keep persisted state to preferences and settings that do not affect the main page content.")}

      ${e("clearing","Clearing persisted state")}
      <p>To clear persisted state programmatically, remove the relevant key from <code>localStorage</code>:</p>
      ${s(r("localStorage.removeItem('pulse:/settings')","js"))}
      <p>Or use a mutation that resets the persisted fields to their initial values \u2014 Pulse will save the reset values on the next update.</p>

      ${e("best-practices","Best practices")}
      <ul>
        <li>Persist preferences and settings (theme, language, layout choices)</li>
        <li>Persist shopping cart contents or draft form data</li>
        <li>Never persist sensitive data (tokens, passwords, PII) \u2014 <code>localStorage</code> is not secure storage</li>
        <li>Never persist data that must be authoritative \u2014 use <a href="/server-data">server data</a> for anything that should be fresh from the server</li>
        <li>Keep persisted payloads small \u2014 <code>localStorage</code> has a ~5 MB limit and blocks the main thread if abused</li>
      </ul>
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",i(o,t,window.__PULSE_SERVER__||{},{ssr:!0}),h(t,i));var P=o;export{P as default};
