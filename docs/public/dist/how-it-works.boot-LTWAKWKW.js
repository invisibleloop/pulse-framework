import{ab as u,c as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import{a,b as n,c as d,d as i,e as t,i as c}from"./runtime-L2HNXIHW.js";import{a as s,b as l}from"./runtime-B73WLANC.js";var{prev:h,next:p}=a("/how-it-works"),g=u({items:[{dot:"1",dotColor:"accent",label:"Understand",content:e({content:'<strong style="color:var(--ui-text)">Read the guide and inspect the project</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent fetches <code>pulse://workflow</code> and the relevant <code>pulse://guide/*</code> sections, then calls <code>pulse_list_structure</code> to see every existing page, component, and store. Ambiguities are surfaced before any files are touched.</p>'})},{dot:"2",dotColor:"accent",label:"Plan",content:e({content:'<strong style="color:var(--ui-text)">Present a plan \u2014 wait for confirmation</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Before writing anything the agent describes what it intends to build: the route, state shape, server data, interactions, and any components or integrations it will use. The task does not proceed until you confirm.</p>'})},{dot:"3",dotColor:"accent",label:"Build",content:e({content:'<strong style="color:var(--ui-text)">Write the spec and any supporting files</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The spec is written as a plain JS object: route, state, server data, mutations, actions, view. The guide constrains every decision \u2014 where state lives, how validation is wired, how the view is structured.</p>'})},{dot:"4",dotColor:"accent",label:"Validate",content:e({content:'<strong style="color:var(--ui-text)">Call <code>pulse_validate</code> \u2014 fix all errors and warnings</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The spec is checked against the Pulse schema. Every error and warning is resolved before moving on \u2014 missing hydrate, heading order violations, missing escaping, structural mistakes. A clean output is the gate to the next phase.</p>'})},{dot:"5",dotColor:"accent",label:"Browser",content:e({content:'<strong style="color:var(--ui-text)">Screenshot + Lighthouse \u2014 desktop and mobile</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent navigates to the route, takes a screenshot to confirm the rendered output, then runs Lighthouse on both desktop and mobile. Accessibility, Best Practices, and SEO must all be 100. Any failure is fixed and re-verified before continuing.</p>'})},{dot:"6",dotColor:"accent",label:"Tests",content:e({content:'<strong style="color:var(--ui-text)">Write tests, run them, fix failures</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Unit tests cover any pure logic extracted from the spec. View tests use <code>renderSync</code> / <code>render</code> to assert HTML output. All tests must pass. When fixing a bug, a failing test is written first to pin the behaviour.</p>'})},{dot:"7",dotColor:"accent",label:"Review",content:e({content:'<strong style="color:var(--ui-text)">Call <code>pulse_review</code> \u2014 only after phases 4\u20136 all pass</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent switches into reviewer mode \u2014 reading the source and rendered output against the full spec checklist. Accessibility, empty states, error handling, component usage, and security are all checked. The review agent is always last.</p>'})},{dot:"8",dotColor:"accent",label:"Fix and re-verify",content:e({content:'<strong style="color:var(--ui-text)">Fix every review issue \u2014 re-run affected gates</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Every issue raised in review is resolved. Validate, Lighthouse, and tests are re-run to confirm all gates still pass. The task is complete only when every phase clears cleanly.</p>'})},{dot:"\u2713",dotColor:"success",label:"Done",content:e({content:'<strong style="color:var(--ui-text)">The spec is the source of truth</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Validate clean. Lighthouse 100. Tests passing. Review clear. When all four gates pass, the page is done.</p>'})}]}),r={route:"/how-it-works",meta:{title:"How It Works \u2014 Pulse Docs",description:"How the Pulse MCP server gives an AI agent the knowledge and tools to build Pulse apps correctly.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>n({currentHref:"/how-it-works",prev:h,next:p,content:`
      ${d("How It Works")}
      ${i("When you run <code>pulse</code> in a project directory, a Model Context Protocol (MCP) server starts alongside the dev server. That MCP server is what gives your AI agent the knowledge, tools, and guardrails to build Pulse pages correctly \u2014 without you having to explain the framework in every prompt.")}

      ${t("mcp","The Pulse MCP server")}
      <p>MCP is a standard protocol that connects AI agents to external tools and knowledge. When Claude (or any MCP-compatible agent) opens a Pulse project, the MCP server is automatically detected and two things happen:</p>
      <ul>
        <li>The agent gains access to <strong>resources</strong> \u2014 read-only documents it can fetch at any time</li>
        <li>The agent gains access to <strong>tools</strong> \u2014 functions it can call to inspect and modify the project</li>
      </ul>
      <p>Together these replace the need to paste documentation into a system prompt or rely on the agent's training data to know how Pulse works.</p>

      ${t("resources","Resources: what the agent knows")}
      <p>The MCP server exposes two resources the agent reads before doing any work:</p>
      <ul>
        <li><strong><code>pulse://guide</code></strong> \u2014 the complete framework reference, split into focused sections so each fits comfortably in a single read. The agent fetches whichever sections are relevant to the task at hand.</li>
        <li><strong><code>pulse://persona</code></strong> \u2014 the quality bar the agent holds itself to: always write correct SSR, always handle errors, never skip empty states, never hardcode colours, never use <code>data-event</code> on text inputs. The persona defines what "done" means.</li>
      </ul>

      <p>The guide sections are:</p>
      <dl class="definition-list">
        <dt><code>pulse://guide/spec</code></dt>
        <dd>Spec format \u2014 state, mutations, actions, streaming SSR, validation, key rules, and form layout.</dd>

        <dt><code>pulse://guide/server</code></dt>
        <dd>Server data fetchers, global store, persist, cookies, redirects, and POST handling.</dd>

        <dt><code>pulse://guide/styles</code></dt>
        <dd>CSS tokens, theming, custom fonts, and utility classes.</dd>

        <dt><code>pulse://guide/routing</code></dt>
        <dd>Client-side navigation, page discovery, and dynamic routes.</dd>

        <dt><code>pulse://guide/components</code></dt>
        <dd>All UI components and their props, icons, charts, and composition patterns.</dd>

        <dt><code>pulse://guide/examples</code></dt>
        <dd>Complete working page examples covering common patterns.</dd>
      </dl>

      ${c("note","The guide is authoritative. When there is a question about how something should be structured \u2014 where state lives, how validation is wired, how streaming works \u2014 the guide answers it. The agent does not guess.")}

      ${t("tools","Tools: what the agent can do")}
      <p>The MCP server provides tools across four categories:</p>

      <h3 class="doc-h3">Scaffolding</h3>
      <dl class="definition-list">
        <dt><code>pulse_create_page</code></dt>
        <dd>Creates a new page spec file from a correct template. The filename determines the route \u2014 <code>about.js</code> becomes <code>/about</code>, <code>posts/[slug].js</code> becomes <code>/posts/:slug</code>. The file is written to <code>src/pages/</code> and picked up by the server automatically.</dd>

        <dt><code>pulse_create_component</code></dt>
        <dd>Creates a reusable view component in <code>src/components/</code>. Components export named functions that return HTML strings \u2014 no classes, no JSX, no lifecycle hooks.</dd>

        <dt><code>pulse_create_store</code></dt>
        <dd>Creates a global store module in <code>src/store/</code>. Stores hold shared state (cart, user session, theme) that multiple pages can subscribe to and mutate.</dd>

        <dt><code>pulse_create_action</code></dt>
        <dd>Scaffolds a reusable server action \u2014 useful for shared form submission logic, API calls, or mutations that appear on more than one page.</dd>
      </dl>

      <h3 class="doc-h3">Inspection</h3>
      <dl class="definition-list">
        <dt><code>pulse_list_structure</code></dt>
        <dd>Lists every page, component, and store that already exists in the project. The agent calls this before creating anything \u2014 to avoid duplication and to understand what the codebase already provides.</dd>

        <dt><code>pulse_fetch_page</code></dt>
        <dd>Reads the full source of an existing spec file. Used when the agent needs to understand an existing page before editing it, or when a review of the current state is needed.</dd>
      </dl>

      <h3 class="doc-h3">Validation &amp; review</h3>
      <dl class="definition-list">
        <dt><code>pulse_validate</code></dt>
        <dd>Validates a spec against the Pulse schema. Returns errors (which block progress) and warnings (which must also be resolved). The agent calls this after writing or editing every spec file.</dd>

        <dt><code>pulse_review</code></dt>
        <dd>Switches the agent into reviewer mode. Returns the spec source, the rendered HTML output, and a structured checklist covering accessibility, empty states, error handling, component usage, security, and correctness. The agent reads its own output critically and fixes every issue before continuing.</dd>
      </dl>

      <h3 class="doc-h3">Server</h3>
      <dl class="definition-list">
        <dt><code>pulse_restart_server</code></dt>
        <dd>Restarts the Pulse dev server. Called after structural changes \u2014 adding a new page, modifying the server entry \u2014 to reload all specs and re-register routes.</dd>

        <dt><code>pulse_build</code></dt>
        <dd>Builds the project for production. Bundles specs, hashes assets, and writes the manifest. Called when the agent needs to verify the production build or prepare a release.</dd>
      </dl>

      <h3 class="doc-h3">Maintenance</h3>
      <dl class="definition-list">
        <dt><code>pulse_check_version</code></dt>
        <dd>Reports the installed Pulse version and whether an update is available.</dd>

        <dt><code>pulse_update</code></dt>
        <dd>Updates the Pulse package to the latest version.</dd>
      </dl>

      ${t("flow","What happens when you ask for something")}

      ${g}

      ${t("why-mcp","Why MCP instead of a system prompt")}
      <p>A system prompt is static \u2014 it cannot see your project, cannot validate your code, and cannot guarantee the agent uses the right version of the framework. The MCP server is dynamic: it reads the guide from the installed version of Pulse, inspects the actual files in your project, and calls real validation on the spec the agent just wrote.</p>
      <p>The result is that the agent builds correctly on the first attempt far more often \u2014 not because it is smarter, but because the feedback loop is tighter and the knowledge is always current.</p>
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",s(r,o,window.__PULSE_SERVER__||{},{ssr:!0}),l(o,s));var T=r;export{T as default};
