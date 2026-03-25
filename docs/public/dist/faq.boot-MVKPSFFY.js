import{a as r,b as i,c as o,d as n}from"./runtime-OFZXJMSU.js";import{a,b as c}from"./runtime-B73WLANC.js";var{prev:l,next:u}=r("/faq");function e(d,p){return`
    <div class="faq-item">
      <h2 class="faq-q">${d}</h2>
      <div class="faq-a">${p}</div>
    </div>`}var s={route:"/faq",meta:{title:"FAQ \u2014 Pulse Docs",description:"Frequently asked questions about the Pulse framework.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/faq",prev:l,next:u,content:`
      ${o("FAQ")}
      ${n("Common questions about Pulse \u2014 what it is, what it isn't, and whether it's right for your project.")}

      ${e("Is Pulse ready for production?",`<p>The architecture is production-quality \u2014 streaming SSR, security headers, immutable caching, and zero runtime dependencies are built in and have been running reliably in real deployments. The framework itself targets Lighthouse 100 on every scaffolded page.</p>
        <p>That said, Pulse is v0.1 early access. The core spec format is stable, but some APIs may change before v1. It is best suited to new projects where you control the stack, and to teams who are comfortable building on something that is still evolving. If you need a framework with a five-year stability guarantee, wait for v1.</p>`)}

      ${e("Why plain JS objects instead of JSX or components?",`<p>JSX and component trees are designed for incremental DOM updates \u2014 the virtual DOM needs a tree to diff. Pulse does not have a virtual DOM. Views are pure functions that return an HTML string; the framework re-renders the whole page segment on state change.</p>
        <p>Plain JS objects are also unambiguous for AI agents. There is no syntax to learn, no component abstraction to navigate \u2014 just a JS object with well-defined keys. An agent can read, write, and validate a spec without understanding any framework-specific idioms.</p>`)}

      ${e("Why no virtual DOM?",`<p>A virtual DOM solves the problem of efficient incremental updates to a large, complex component tree. Pulse pages are server-rendered HTML strings \u2014 the client runtime re-renders a bounded section of the page when state changes, which is fast enough for the kinds of interactions Pulse is designed for.</p>
        <p>Eliminating the virtual DOM means eliminating the ~40\u2013100 kB runtime that comes with it. Pulse ships ~2 kB brotli to the browser on first visit. That is not a compression trick \u2014 there is genuinely no framework runtime on the client.</p>`)}

      ${e("Can I use npm packages in my specs?",`<p>Yes, on the server side. Server fetchers run in Node.js and can import any npm package \u2014 database clients, API SDKs, utility libraries. These never reach the browser.</p>
        <p>Client-side code (mutations and actions) runs in the browser and is bundled by esbuild. You can import pure JS utilities here, but avoid packages that depend on Node.js built-ins or that are large \u2014 the goal is to keep the client bundle small. UI components come from the built-in component library, which covers most cases without external dependencies.</p>`)}

      ${e("Does Pulse work with TypeScript?",`<p>Type definitions are included for all public APIs \u2014 <code>createServer</code>, the spec shape, UI components, and the testing utilities. You can write specs in TypeScript and import the <code>Spec</code> type to get full autocompletion and type checking.</p>
        <p>The examples and docs are in plain JS for readability, but TypeScript is a first-class option.</p>`)}

      ${e("Can I use a database directly in Pulse?",`<p>Yes. Server fetchers are plain async functions \u2014 you can query a database, call an ORM, or use any server-side library directly. There is no data layer abstraction to work around.</p>
        <pre class="code-block"><code>server: {
  posts: async (ctx) => {
    return db.posts.findMany({ where: { published: true } })
  },
}</code></pre>
        <p>The result is passed to your view as <code>server.posts</code>. See the <a href="/server-data">Server Data</a> and <a href="/supabase">Supabase</a> docs for worked examples.</p>`)}

      ${e("How does Pulse compare to Next.js?",`<p>Next.js is a full-featured React framework designed for large teams building complex applications. It ships React to the browser on every page, supports many rendering strategies, and has a large ecosystem.</p>
        <p>Pulse is opinionated in the other direction: one spec format, one rendering model, no client framework, no configuration. It is smaller, simpler, and faster to get a Lighthouse 100 result \u2014 but it does not have the ecosystem breadth or the component model that React provides. If your project needs React, use Next.js. If you want to ship fast, simple, server-rendered pages with minimal JS, Pulse is worth trying.</p>`)}

      ${e("Can I build a multi-page app with client-side navigation?",`<p>Yes. <code>initNavigation</code> intercepts same-origin link clicks, fetches the new page, swaps the DOM, and re-mounts the spec \u2014 all without a full page reload. From the user's perspective it feels like an SPA; from the server's perspective every navigation is a standard HTTP request.</p>
        <p>See the <a href="/navigation">Navigation</a> docs for details.</p>`)}

      ${e("Does Pulse handle authentication?",`<p>Pulse has a <code>guard</code> function that runs before any server fetcher executes. It receives the request context (cookies, headers, params) and can redirect or return an error if the user is not authenticated. This makes it impossible to accidentally skip an auth check \u2014 the guard runs before data is fetched.</p>
        <p>For a complete auth integration, see the <a href="/auth">Auth0 guide</a>. The pattern works the same with any auth provider.</p>`)}

      ${e("What is the AI-native claim actually about?",`<p>Two things. First, the spec format was designed to be easy for an AI agent to generate correctly \u2014 one JS object per page, a validated schema, no ambiguous patterns. An agent that writes a Pulse spec either produces a valid spec or gets a schema error it can fix. There is no grey area.</p>
        <p>Second, the CLI starts an MCP server alongside the dev server, giving the agent tools to create pages, validate specs, screenshot routes, and run Lighthouse audits \u2014 without leaving the editor. The agent can build and verify a page end-to-end without human intervention on the tooling side.</p>`)}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",a(s,t,window.__PULSE_SERVER__||{},{ssr:!0}),c(t,a));var b=s;export{b as default};
