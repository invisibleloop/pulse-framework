import { renderLayout, h1, lead, section, callout } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { card } from '../../../src/ui/index.js'

const { prev, next } = prevNext('/how-it-works')

// Numbered vertical flow diagram — raw HTML (creative override), replacing
// the removed timeline()/timelineItem() components. Styled via .hiw-flow*
// classes in docs.css.
const flowStep = ({ dot, label, content }) => `
  <li class="hiw-flow-item">
    <div class="hiw-flow-side">
      <div class="hiw-flow-connector hiw-flow-connector--before"></div>
      <div class="hiw-flow-dot" aria-hidden="true">${dot}</div>
      <div class="hiw-flow-connector hiw-flow-connector--after"></div>
    </div>
    <div class="hiw-flow-main">
      <span class="hiw-flow-label">${label}</span>
      <div class="hiw-flow-body">${content}</div>
    </div>
  </li>
`

const agentFlow = `<ol class="hiw-flow">${[
    {
      dot: '1',
      label: 'Understand',
      content: card({ content: `<strong style="color:var(--ui-text)">Read the guide and inspect the project</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent fetches <code>pulse://workflow</code> and the relevant <code>pulse://guide/*</code> sections, then calls <code>pulse_list_structure</code> to see every existing page, component, and store. Ambiguities are surfaced before any files are touched.</p>` }),
    },
    {
      dot: '2',
      label: 'Plan',
      content: card({ content: `<strong style="color:var(--ui-text)">Present a plan — wait for confirmation</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Before writing anything the agent describes what it intends to build: the route, state shape, server data, interactions, and any components or integrations it will use. The task does not proceed until you confirm.</p>` }),
    },
    {
      dot: '3',
      label: 'Build',
      content: card({ content: `<strong style="color:var(--ui-text)">Write the spec and any supporting files</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The spec is written as a plain JS object: route, state, server data, mutations, actions, view. The guide constrains every decision — where state lives, how validation is wired, how the view is structured.</p>` }),
    },
    {
      dot: '4',
      label: 'Validate',
      content: card({ content: `<strong style="color:var(--ui-text)">Call <code>pulse_validate</code> — fix all errors and warnings</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The spec is checked against the Pulse schema. Every error and warning is resolved before moving on — missing hydrate, heading order violations, missing escaping, structural mistakes. A clean output is the gate to the next phase.</p>` }),
    },
    {
      dot: '5',
      label: 'Browser',
      content: card({ content: `<strong style="color:var(--ui-text)">Screenshot + Lighthouse — desktop and mobile</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent navigates to the route, takes a screenshot to confirm the rendered output, then runs Lighthouse on both desktop and mobile. Accessibility, Best Practices, and SEO must all be 100. Any failure is fixed and re-verified before continuing.</p>` }),
    },
    {
      dot: '6',
      label: 'Tests',
      content: card({ content: `<strong style="color:var(--ui-text)">Write tests, run them, fix failures</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Unit tests cover any pure logic extracted from the spec. View tests use <code>renderSync</code> / <code>render</code> to assert HTML output. All tests must pass. When fixing a bug, a failing test is written first to pin the behaviour.</p>` }),
    },
    {
      dot: '7',
      label: 'Review',
      content: card({ content: `<strong style="color:var(--ui-text)">Call <code>pulse_review</code> — only after phases 4–6 all pass</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">The agent switches into reviewer mode — reading the source and rendered output against the full spec checklist. Accessibility, empty states, error handling, component usage, and security are all checked. The review agent is always last.</p>` }),
    },
    {
      dot: '8',
      label: 'Fix and re-verify',
      content: card({ content: `<strong style="color:var(--ui-text)">Fix every review issue — re-run affected gates</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Every issue raised in review is resolved. Validate, Lighthouse, and tests are re-run to confirm all gates still pass. The task is complete only when every phase clears cleanly.</p>` }),
    },
    {
      dot: '✓',
      label: 'Done',
      content: card({ content: `<strong style="color:var(--ui-text)">The spec is the source of truth</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Validate clean. Lighthouse 100. Tests passing. Review clear. When all four gates pass, the page is done.</p>` }),
    },
  ].map(flowStep).join('')}</ol>`

export default {
  route: '/how-it-works',
  meta: {
    theme:       'light',
    title: 'How It Works — Pulse Docs',
    description: 'How the Pulse MCP server gives an AI agent the knowledge and tools to build Pulse apps correctly.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/how-it-works',
    prev,
    next,
    content: `
      ${h1('How It Works')}
      ${lead('When you run <code>pulse</code> in a project directory, a Model Context Protocol (MCP) server starts alongside the dev server. That MCP server is what gives your AI agent the knowledge, tools, and guardrails to build Pulse pages correctly — without you having to explain the framework in every prompt.')}

      ${section('mcp', 'The Pulse MCP server')}
      <p>MCP is a standard protocol that connects AI agents to external tools and knowledge. When Claude (or any MCP-compatible agent) opens a Pulse project, the MCP server is automatically detected and two things happen:</p>
      <ul>
        <li>The agent gains access to <strong>resources</strong> — read-only documents it can fetch at any time</li>
        <li>The agent gains access to <strong>tools</strong> — functions it can call to inspect and modify the project</li>
      </ul>
      <p>Together these replace the need to paste documentation into a system prompt or rely on the agent's training data to know how Pulse works.</p>

      ${section('resources', 'Resources: what the agent knows')}
      <p>The MCP server exposes read-only documents the agent fetches at any time. There are two top-level resources and a set of focused guide sections:</p>

      <dl class="definition-list">
        <dt><code>pulse://quickstart</code></dt>
        <dd>Workflow phases, spec skeleton, component rules, and theming essentials combined into a single fetch. Used for targeted edits, bug fixes, or simple one-shot page builds — avoids loading the full guide for small tasks.</dd>

        <dt><code>pulse://workflow</code></dt>
        <dd>The full build workflow — every phase, pass gate, and ordering rule. The agent reads this before starting any new page or project.</dd>

        <dt><code>pulse://persona</code></dt>
        <dd>The quality bar the agent holds itself to: always write correct SSR, always handle errors, never skip empty states, never hardcode colours, never use <code>data-event</code> on text inputs. The persona defines what "done" means.</dd>
      </dl>

      <p>The guide is split into topic sections the agent fetches as needed:</p>
      <dl class="definition-list">
        <dt><code>pulse://guide/spec</code></dt>
        <dd>Spec format — state, mutations, actions, streaming SSR, validation, key rules, and form layout.</dd>

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

        <dt><code>pulse://guide/templates</code></dt>
        <dd>Pre-built landing page templates, adaptation rules, and theme CSS patterns. Fetched when building a new branded site or landing page.</dd>

        <dt><code>pulse://guide/design-references</code></dt>
        <dd>Twelve design directions with vibes, component combinations, palette patterns, and signature moves. Fetched during intake to pick the right aesthetic rather than defaulting to a generic SaaS look.</dd>

        <dt><code>pulse://guide/design-gallery</code></dt>
        <dd>All templates with visual descriptions and key components. Includes critical prop-name references and component recipes for cards, stat strips, and forms. Fetched when adapting a template or combining components.</dd>

        <dt><code>pulse://guide/explore</code></dt>
        <dd>Zone-based layout thinking, seven structural gestures, raw HTML patterns without components, and an anti-pattern checklist. Fetched when a distinctive or unusual layout is needed.</dd>
      </dl>

      ${callout('note', 'The guide is authoritative. When there is a question about how something should be structured — where state lives, how validation is wired, how streaming works — the guide answers it. The agent does not guess.')}

      ${section('tools', 'Tools: what the agent can do')}
      <p>The MCP server provides tools across five categories:</p>

      <h3 class="doc-h3">Design &amp; intake</h3>
      <dl class="definition-list">
        <dt><code>pulse_extract_inspiration</code></dt>
        <dd>Extracts a structured design brief from a URL or image shared as inspiration. Called before <code>pulse_intake</code> when the user says "I like the look of X" — it tells the agent exactly what to observe and capture.</dd>

        <dt><code>pulse_intake</code></dt>
        <dd>Captures the product name, pitch, features, palette, vibe, and anti-style before scaffolding any new page or branded template. Returns a structured brief with copy-ready content, early contrast warnings, and component suggestions. Always runs before <code>pulse_sketch</code>.</dd>

        <dt><code>pulse_sketch</code></dt>
        <dd>Generates three structurally distinct layout directions (full-bleed, asymmetric split, editorial flow, etc.) before any code is written. Called after <code>pulse_intake</code> — prevents every project from defaulting to the same centred-hero layout.</dd>

        <dt><code>pulse_intent</code></dt>
        <dd>Intent engine — describe what you want to build and get back a matched archetype, recommended components, a ready-to-adapt spec scaffold, and which guide sections to read first. An alternative entry point to <code>pulse://workflow</code> for targeted tasks.</dd>

        <dt><code>pulse_design_review</code></dt>
        <dd>Reviews the built page's visual design against the original product brief from <code>pulse_intake</code>. Checks whether the design looks and feels appropriate for the product, audience, and vibe. Runs after screenshot, before Lighthouse.</dd>

        <dt><code>pulse_layout_review</code></dt>
        <dd>Multi-viewport layout review — checks for overflow, collapsed sections, and broken images at different screen widths. Runs after design approval but before Lighthouse, catching layout issues that Lighthouse doesn't flag.</dd>

        <dt><code>pulse_tokens</code></dt>
        <dd>Lists all available <code>--ui-*</code> CSS custom property tokens from the installed <code>pulse-ui.css</code>. Used before writing theme overrides to avoid guessing token names.</dd>

        <dt><code>pulse_check_contrast</code></dt>
        <dd>Static WCAG contrast checker. Extracts colour variable definitions from a theme file and checks common foreground/background pairings for WCAG AA compliance. Run immediately after writing a theme file to catch palette mistakes before Lighthouse.</dd>
      </dl>

      <h3 class="doc-h3">Scaffolding</h3>
      <dl class="definition-list">
        <dt><code>pulse_create_page</code></dt>
        <dd>Creates a new page spec file from a correct template. The filename determines the route — <code>about.js</code> becomes <code>/about</code>, <code>posts/[slug].js</code> becomes <code>/posts/:slug</code>. The file is written to <code>src/pages/</code> and picked up by the server automatically.</dd>

        <dt><code>pulse_create_component</code></dt>
        <dd>Creates a reusable view component in <code>src/components/</code>. Components export named functions that return HTML strings — no classes, no JSX, no lifecycle hooks.</dd>

        <dt><code>pulse_create_store</code></dt>
        <dd>Creates a global store module in <code>src/store/</code>. Stores hold shared state (cart, user session, theme) that multiple pages can subscribe to and mutate.</dd>

        <dt><code>pulse_create_action</code></dt>
        <dd>Scaffolds a reusable server action — useful for shared form submission logic, API calls, or mutations that appear on more than one page.</dd>
      </dl>

      <h3 class="doc-h3">Inspection</h3>
      <dl class="definition-list">
        <dt><code>pulse_status</code></dt>
        <dd>Project health snapshot — pages, routes, server status, last build. Called at the start of a session to orient quickly without reading files individually.</dd>

        <dt><code>pulse_list_structure</code></dt>
        <dd>Lists every page, component, and store that already exists in the project. The agent calls this before creating anything — to avoid duplication and to understand what the codebase already provides.</dd>

        <dt><code>pulse_fetch_page</code></dt>
        <dd>Reads the full source of an existing spec file. Used when the agent needs to understand an existing page before editing it, or when a review of the current state is needed.</dd>

        <dt><code>pulse_list_icons</code></dt>
        <dd>Lists all available Pulse UI icon names, grouped by category. Called before importing icons — the agent never guesses a name.</dd>
      </dl>

      <h3 class="doc-h3">Validation &amp; review</h3>
      <dl class="definition-list">
        <dt><code>pulse_validate</code></dt>
        <dd>Validates a spec against the Pulse schema. Returns errors (which block progress) and warnings (which must also be resolved). The agent calls this after writing or editing every spec file.</dd>

        <dt><code>pulse_suggest</code></dt>
        <dd>Draft-mode feedback — paste a partial or complete spec and get constructive suggestions before running the hard validator. Unlike <code>pulse_validate</code>, it is collaborative rather than a gate: it notices patterns, spots likely omissions, and offers ideas. Used mid-build for a second opinion.</dd>

        <dt><code>pulse_review</code></dt>
        <dd>Switches the agent into reviewer mode. Returns the spec source, the rendered HTML output, and a structured checklist covering accessibility, empty states, error handling, component usage, security, and correctness. The agent reads its own output critically and fixes every issue before continuing.</dd>

        <dt><code>pulse_run_tests</code></dt>
        <dd>Runs the project test suite (<code>npm test</code>) and returns the full output. Called after writing or editing specs to verify nothing is broken.</dd>
      </dl>

      <h3 class="doc-h3">Server &amp; maintenance</h3>
      <dl class="definition-list">
        <dt><code>pulse_restart_server</code></dt>
        <dd>Restarts the Pulse dev server. Called after structural changes — adding a new page, modifying the server entry — to reload all specs and re-register routes.</dd>

        <dt><code>pulse_build</code></dt>
        <dd>Builds the project for production. Bundles specs, hashes assets, and writes the manifest. Called when the agent needs to verify the production build or prepare a release.</dd>

        <dt><code>pulse_check_version</code></dt>
        <dd>Reports the installed Pulse version and whether an update is available.</dd>

        <dt><code>pulse_update</code></dt>
        <dd>Updates the Pulse package to the latest version and copies the latest UI assets and agent files into the project.</dd>
      </dl>

      ${section('flow', 'What happens when you ask for something')}

      ${agentFlow}

      ${section('why-mcp', 'Why MCP instead of a system prompt')}
      <p>A system prompt is static — it cannot see your project, cannot validate your code, and cannot guarantee the agent uses the right version of the framework. The MCP server is dynamic: it reads the guide from the installed version of Pulse, inspects the actual files in your project, and calls real validation on the spec the agent just wrote.</p>
      <p>The result is that the agent builds correctly on the first attempt far more often — not because it is smarter, but because the feedback loop is tighter and the knowledge is always current.</p>
    `,
  }),
}
