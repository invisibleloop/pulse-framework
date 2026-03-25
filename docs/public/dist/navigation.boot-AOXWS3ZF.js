import{a}from"./runtime-QFURDKA2.js";import{a as s,b as d,c as l,d as c,e,g as o,h as p,i}from"./runtime-L2HNXIHW.js";import{a as n,b as h}from"./runtime-B73WLANC.js";var{prev:u,next:g}=s("/navigation"),r={route:"/navigation",meta:{title:"Navigation \u2014 Pulse Docs",description:"Client-side navigation in Pulse \u2014 how link interception, JSON responses, and spec re-mounting work.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/navigation",prev:u,next:g,content:`
      ${l("Navigation")}
      ${c("Client-side navigation in Pulse requires no configuration. When hydration is active, same-origin link clicks are intercepted automatically \u2014 the server renders the new page and returns JSON, and Pulse swaps the content without a full reload. If anything fails, it falls back to standard browser navigation.")}

      ${e("how-it-works","How it works")}
      <p>When <code>initNavigation</code> is called (part of the hydration bootstrap), Pulse attaches a click listener to the document. When a same-origin <code>&lt;a&gt;</code> is clicked:</p>
      <ol>
        <li>The default navigation is prevented.</li>
        <li>A fetch request is sent to the new URL with the header <code>X-Pulse-Navigate: true</code>.</li>
        <li>The server renders the page and returns a JSON response instead of full HTML.</li>
        <li>Pulse replaces the current page's root <code>innerHTML</code> with the new content and updates <code>document.title</code>.</li>
        <li>The new page's spec bundle is dynamically imported.</li>
        <li><code>mount()</code> is called to bind the new spec's events.</li>
        <li>The browser history is updated with <code>history.pushState</code>.</li>
      </ol>
      ${i("note","If any step fails \u2014 network error, missing bundle, unexpected response \u2014 Pulse falls back to <code>location.href = url</code> for a standard full-page navigation.")}

      ${e("init-navigation","initNavigation")}
      <p><code>initNavigation</code> is called automatically by the hydration bootstrap script. You do not call it manually in application code. It is exported from the runtime for use in custom bootstrap scenarios:</p>
      ${o(a(`import { mount } from '@invisibleloop/pulse/runtime'
import { initNavigation } from '@invisibleloop/pulse/navigate'

mount(spec, root, window.__PULSE_SERVER__ || {}, { ssr: true })
initNavigation(root, mount)`,"js"))}

      ${e("json-response","JSON response shape")}
      <p>When Pulse receives a request with <code>X-Pulse-Navigate: true</code>, it renders the page and returns:</p>
      ${o(a(`{
  "html":        "<main>...the page content...</main>",
  "title":       "New Page Title \u2014 Site",
  "hydrate":     "/dist/new-page.boot-abc123.js",
  "serverState": { "key": "value" }
}`,"js"))}
      ${p(["Field","Description"],[["<code>html</code>","The rendered page content (the output of the view function, without the full document wrapper)."],["<code>title</code>","The new page title, set via <code>document.title</code>."],["<code>hydrate</code>","The bundle path for the new spec. <code>null</code> if the page has no hydration."],["<code>serverState</code>","The server data for the new page, used when mounting the new spec."]])}

      ${e("link-interception","Which links are intercepted")}
      <p>Only same-origin links are intercepted. Links with <code>target="_blank"</code>, <code>download</code>, <code>rel="external"</code>, or any cross-origin <code>href</code> are ignored and behave normally:</p>
      ${o(a(`<!-- Intercepted by Pulse client navigation -->
<a href="/about">About</a>
<a href="/products/42">Product</a>

<!-- NOT intercepted \u2014 standard browser navigation -->
<a href="https://example.com">External</a>
<a href="/report.pdf" download>Download</a>
<a href="/admin" target="_blank">Open in new tab</a>`,"html"))}

      ${e("history","Browser history")}
      <p>Pulse uses the History API (<code>history.pushState</code>) to update the URL after each navigation. The back and forward buttons work as expected \u2014 each history entry corresponds to a page navigation.</p>
      <p>When the user navigates back, Pulse receives a <code>popstate</code> event and performs the same fetch-and-swap process for the previous URL.</p>

      ${e("no-hydration","Navigation without hydration")}
      <p>Client-side navigation only works on pages that have loaded the Pulse client runtime (i.e. pages with a <code>hydrate</code> path). If a user navigates from a hydrated page to a non-hydrated page, Pulse falls back to a full page load.</p>
      ${i("tip","For documentation sites or mostly-static apps, omitting <code>hydrate</code> entirely and relying on standard browser navigation is simpler and keeps the JS payload at zero.")}

      ${e("scroll","Scroll behaviour")}
      <p>After each client-side navigation, Pulse scrolls to the top of the page \u2014 matching the behaviour of a full page load. If the URL includes a hash (e.g. <code>/docs#section</code>), Pulse scrolls to the target element.</p>
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",n(r,t,window.__PULSE_SERVER__||{},{ssr:!0}),h(t,n));var N=r;export{N as default};
