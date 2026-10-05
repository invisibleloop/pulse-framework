import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/navigation')

export default {
  route: '/navigation',
  meta: {
    theme:       'light',
    title: 'Navigation — Pulse Docs',
    description: 'Client-side navigation in Pulse — how link interception, JSON responses, and spec re-mounting work.',
    styles: ['/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/navigation',
    prev,
    next,
    content: `
      ${h1('Navigation')}
      ${lead('Client-side navigation in Pulse requires no configuration. When hydration is active, same-origin link clicks are intercepted automatically — the server renders the new page and returns JSON, and Pulse swaps the content without a full reload. If anything fails, it falls back to standard browser navigation.')}

      ${section('how-it-works', 'How it works')}
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
      ${callout('note', 'If any step fails — network error, missing bundle, unexpected response — Pulse falls back to <code>location.href = url</code> for a standard full-page navigation.')}

      ${section('init-navigation', 'initNavigation')}
      <p><code>initNavigation</code> is called automatically by the hydration bootstrap script. You do not call it manually in application code. It is exported from the runtime for use in custom bootstrap scenarios:</p>
      ${codeBlock(highlight(`import { mount } from '@invisibleloop/pulse/runtime'
import { initNavigation } from '@invisibleloop/pulse/navigate'

mount(spec, root, window.__PULSE_SERVER__ || {}, { ssr: true })
initNavigation(root, mount)`, 'js'))}

      ${section('json-response', 'Response shape')}
      <p>When Pulse receives a request with <code>X-Pulse-Navigate: true</code>, it renders the page and responds one of two ways, depending on whether the page has deferred streaming segments (<code>spec.stream.deferred</code>).</p>

      <h3 class="doc-h3">Most pages — a single JSON object</h3>
      <p>Pages with no <code>spec.stream.deferred</code> segments get one buffered JSON response:</p>
      ${codeBlock(highlight(`{
  "html":        "<main>...the page content...</main>",
  "title":       "New Page Title — Site",
  "styles":      ["/app.css"],
  "scripts":     [],
  "hydrate":     "/dist/new-page.boot-abc123.js",
  "serverState": { "key": "value" },
  "storeState":  { "user": { "name": "Jane" } }
}`, 'js'))}
      ${table(
        ['Field', 'Description'],
        [
          ['<code>html</code>', 'The rendered page content (the output of the view function, without the full document wrapper).'],
          ['<code>title</code>', 'The new page title, set via <code>document.title</code>.'],
          ['<code>styles</code> / <code>scripts</code>', "The new page's <code>meta.styles</code> / <code>meta.scripts</code>, applied to the document before mount."],
          ['<code>hydrate</code>', 'The bundle path for the new spec. <code>null</code> if the page has no hydration.'],
          ['<code>serverState</code>', 'The server data for the new page, used when mounting the new spec. Omitted if empty.'],
          ['<code>storeState</code>', 'The store state the new page subscribes to, if any. Omitted if empty.'],
        ]
      )}

      <h3 class="doc-h3">Pages with deferred segments — streaming NDJSON</h3>
      <p>A page that declares <code>spec.stream.deferred</code> streams instead — the client reads <code>Content-Type: application/x-ndjson</code> and applies newline-delimited JSON messages progressively as they arrive, rather than waiting for one buffered response:</p>
      ${codeBlock(highlight(`{"type":"meta","hydrate":"...","title":"...","styles":[...],"scripts":[...]}
{"type":"html","html":"<main>...shell...</main>","deferred":["feed"]}
{"type":"deferred","id":"feed","html":"<section>...</section>"}
{"type":"done","serverState":{...},"storeState":{...}}`, 'js'))}
      <p>Shell HTML fills immediately; deferred segments land inside their <code>&lt;pulse-deferred id="pd-[name]"&gt;</code> placeholder as each one resolves. This mirrors the streaming SSR behaviour on a full page load — client navigation gets the same shell-then-deferred experience, not a degraded fallback.</p>
      ${callout('note', "Both paths are picked automatically by the server based on the target page's <code>spec.stream</code> field — nothing to configure on the client.")}

      ${section('link-interception', 'Which links are intercepted')}
      <p>Only same-origin links are intercepted. Links with <code>target="_blank"</code>, <code>download</code>, <code>rel="external"</code>, or any cross-origin <code>href</code> are ignored and behave normally:</p>
      ${codeBlock(highlight(`<!-- Intercepted by Pulse client navigation -->
<a href="/about">About</a>
<a href="/products/42">Product</a>

<!-- NOT intercepted — standard browser navigation -->
<a href="https://example.com">External</a>
<a href="/report.pdf" download>Download</a>
<a href="/admin" target="_blank">Open in new tab</a>`, 'html'))}

      ${section('history', 'Browser history')}
      <p>Pulse uses the History API (<code>history.pushState</code>) to update the URL after each navigation. The back and forward buttons work as expected — each history entry corresponds to a page navigation.</p>
      <p>When the user navigates back, Pulse receives a <code>popstate</code> event and performs the same fetch-and-swap process for the previous URL.</p>

      ${section('no-hydration', 'Navigation without hydration')}
      <p>Client-side navigation only works on pages that have loaded the Pulse client runtime (i.e. pages with a <code>hydrate</code> path). If a user navigates from a hydrated page to a non-hydrated page, Pulse falls back to a full page load.</p>
      ${callout('tip', 'For documentation sites or mostly-static apps, omitting <code>hydrate</code> entirely and relying on standard browser navigation is simpler and keeps the JS payload at zero.')}

      ${section('scroll', 'Scroll behaviour')}
      <p>After each client-side navigation, Pulse scrolls to the top of the page — matching the behaviour of a full page load. If the URL includes a hash (e.g. <code>/docs#section</code>), Pulse scrolls to the target element.</p>
    `,
  }),
}
