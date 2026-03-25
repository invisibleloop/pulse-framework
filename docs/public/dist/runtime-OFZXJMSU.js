var s=[{section:"Framework",items:[{label:"Overview",href:"/"},{label:"FAQ",href:"/faq"},{label:"Project Structure",href:"/project-structure"},{label:"Spec Reference",href:"/spec"},{label:"Configuration",href:"/config"}]},{section:"Developer Guide",items:[{label:"Getting Started",href:"/getting-started"},{label:"How It Works",href:"/how-it-works"},{label:"Slash Commands",href:"/slash-commands"},{label:"Prompt Examples",href:"/prompt-examples"},{label:"Component Library",href:"/components"}]},{section:"State & Behaviour",items:[{label:"State",href:"/state"},{label:"Mutations",href:"/mutations"},{label:"Actions",href:"/actions"},{label:"Validation",href:"/validation"},{label:"Constraints",href:"/constraints"},{label:"Persist",href:"/persist"}]},{section:"Server",items:[{label:"Server Data",href:"/server-data"},{label:"Global Store",href:"/store"},{label:"Routing",href:"/routing"},{label:"Streaming SSR",href:"/streaming"},{label:"Caching",href:"/caching"},{label:"Guard",href:"/guard"},{label:"Raw Responses",href:"/raw-responses"},{label:"Server API",href:"/server-api"},{label:"Extending Pulse",href:"/extending"}]},{section:"Client",items:[{label:"Hydration",href:"/hydration"},{label:"Navigation",href:"/navigation"},{label:"Images",href:"/images"}]},{section:"Deployment",items:[{label:"Deployment",href:"/deploy"}]},{section:"Integrations",items:[{label:"Supabase",href:"/supabase"},{label:"Auth (Auth0)",href:"/auth"},{label:"Payments (Stripe)",href:"/stripe"}]},{section:"Reference",items:[{label:"Metadata & SEO",href:"/meta"},{label:"Performance",href:"/performance"},{label:"Accessibility",href:"/accessibility"},{label:"Testing",href:"/testing"}]},{section:"UI Components",items:[{label:"Alert",href:"/components/alert"},{label:"Avatar",href:"/components/avatar"},{label:"Badge",href:"/components/badge"},{label:"Breadcrumbs",href:"/components/breadcrumbs"},{label:"Button",href:"/components/button"},{label:"Card",href:"/components/card"},{label:"Checkbox",href:"/components/checkbox"},{label:"Carousel",href:"/components/carousel"},{label:"Charts",href:"/components/charts"},{label:"Empty",href:"/components/empty"},{label:"Fieldset",href:"/components/fieldset"},{label:"File Upload",href:"/components/file-upload"},{label:"Heading",href:"/components/heading"},{label:"Icons",href:"/components/icons"},{label:"Image",href:"/components/image"},{label:"Input",href:"/components/input"},{label:"List",href:"/components/list"},{label:"Modal",href:"/components/modal"},{label:"Progress",href:"/components/progress"},{label:"Prose",href:"/components/prose"},{label:"Pullquote",href:"/components/pullquote"},{label:"Radio",href:"/components/radio"},{label:"Rating",href:"/components/rating"},{label:"Search",href:"/components/search"},{label:"Segmented",href:"/components/segmented"},{label:"Select",href:"/components/select"},{label:"Slider",href:"/components/slider"},{label:"Spinner",href:"/components/spinner"},{label:"Stat",href:"/components/stat"},{label:"Stepper",href:"/components/stepper"},{label:"Table",href:"/components/table"},{label:"Textarea",href:"/components/textarea"},{label:"Timeline",href:"/components/timeline"},{label:"Toggle",href:"/components/toggle"},{label:"Tooltip",href:"/components/tooltip"}]},{section:"Landing Components",items:[{label:"Accordion",href:"/components/accordion"},{label:"App Badge",href:"/components/app-badge"},{label:"CTA",href:"/components/cta"},{label:"Feature",href:"/components/feature"},{label:"Hero",href:"/components/hero"},{label:"Nav",href:"/components/nav"},{label:"Pricing",href:"/components/pricing"},{label:"Testimonial",href:"/components/testimonial"}]},{section:"Layout Components",items:[{label:"Banner",href:"/components/banner"},{label:"Cluster",href:"/components/cluster"},{label:"Code Window",href:"/components/code-window"},{label:"Container",href:"/components/container"},{label:"Divider",href:"/components/divider"},{label:"Footer",href:"/components/footer"},{label:"Grid",href:"/components/grid"},{label:"Media",href:"/components/media"},{label:"Section",href:"/components/section"},{label:"Stack",href:"/components/stack"}]}];function p(e){let a=s.flatMap(t=>t.items),l=a.findIndex(t=>t.href===e);return{prev:l>0?a[l-1]:null,next:l<a.length-1?a[l+1]:null}}function n(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function c(e){return`
    <aside class="docs-sidebar" aria-label="Documentation navigation">
      <div class="sidebar-logo">
        <a href="/" class="logo-link" aria-label="Pulse home">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
          <span class="logo-name">Pulse</span>
        </a>
        <span class="version-badge">v0.1</span>
      </div>
      <nav class="sidebar-nav">
        ${s.map(({section:l,items:t})=>{let r=t.map(o=>{let i=o.href===e;return`<a href="${n(o.href)}" class="nav-link${i?" active":""}"${i?' aria-current="page"':""}>${n(o.label)}</a>`}).join("");return`
      <div class="nav-section">
        <p class="nav-section-title">${n(l)}</p>
        ${r}
      </div>`}).join("")}
      </nav>
    </aside>`}function h(e,a){return!e&&!a?"":`
    <nav class="doc-prev-next" aria-label="Previous and next pages">
      <div class="prev-next-grid">
        ${e?`<a href="${n(e.href)}" class="prev-next-link prev-link">
          <span class="prev-next-label">\u2190 Previous</span>
          <span class="prev-next-title">${n(e.label)}</span>
        </a>`:"<div></div>"}
        ${a?`<a href="${n(a.href)}" class="prev-next-link next-link">
          <span class="prev-next-label">Next \u2192</span>
          <span class="prev-next-title">${n(a.label)}</span>
        </a>`:"<div></div>"}
      </div>
    </nav>`}function f({currentHref:e,content:a,prev:l=null,next:t=null}){return`
    <div class="sidebar-overlay" aria-hidden="true"></div>
    ${c(e)}
    <div class="docs-main">
      <header class="docs-header">
        <button class="mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="docs-sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clip-rule="evenodd"/>
          </svg>
        </button>
        <a href="/" class="header-logo-mobile" aria-label="Pulse home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
        </a>
        <a href="https://github.com/invisibleloop/pulse-framework" class="header-github" aria-label="View on GitHub" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          GitHub
        </a>
      </header>
      <main class="docs-content">
        ${a}
        ${h(l,t)}
      </main>
    </div>
    <script src="/menu.js"><\/script>
    <script src="/pulse-ui.js"><\/script>`}function m(e){return`<h1 class="doc-h1">${n(e)}</h1>`}function u(e){return`<p class="doc-lead">${e}</p>`}function v(e,a){return`<h2 class="doc-h2" id="${n(e)}"><a href="#${n(e)}" class="heading-anchor">${n(a)}</a></h2>`}function g(e,a){let l=a??e;return`<h3 class="doc-h3" id="${n(e)}"><a href="#${n(e)}" class="heading-anchor">${n(l)}</a></h3>`}function x(e,a=""){return`${a?`<div class="code-filename">${n(a)}</div>`:""}<pre class="code-block"><code>${e}</code></pre>`}function $(e,a){let l=e.map(r=>`<th>${r}</th>`).join(""),t=a.map(r=>`<tr>${r.map(o=>`<td>${o}</td>`).join("")}</tr>`).join("");return`<div class="table-wrap"><table><thead><tr>${l}</tr></thead><tbody>${t}</tbody></table></div>`}function S(e,a){let l={note:"\u2139",warning:"\u26A0",tip:"\u2726"};return`<div class="callout callout-${n(e)}"><span class="callout-icon" aria-hidden="true">${l[e]||"\u2139"}</span><div class="callout-body">${a}</div></div>`}export{p as a,f as b,m as c,u as d,v as e,g as f,x as g,$ as h,S as i};
