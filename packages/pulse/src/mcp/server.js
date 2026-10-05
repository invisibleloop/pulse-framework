#!/usr/bin/env node
/**
 * Pulse MCP Server
 *
 * Provides tools and resources for an AI agent working inside a Pulse project.
 *
 * Resources:
 *   pulse://start   — context-aware entry point (new project / edit / bug fix)
 *   pulse://guide   — complete guide: spec format, UI components, CSS rules, patterns
 *
 * Tools:
 *   pulse_intent         — intent engine: describe what to build, get archetype + scaffold
 *   pulse_suggest        — draft-mode contextual feedback on partial specs (use after first draft)
 *   pulse_intake         — product intake: capture app details before scaffolding
 *   pulse_sketch         — generate 3 structural layout directions before writing code
 *   pulse_list_icons     — list all available icon names, grouped by category
 *   pulse_check_contrast — static WCAG contrast check on theme CSS colors
 *   pulse_list_structure — list all pages and components
 *   pulse_create_page    — create a new page spec with proper template
 *   pulse_create_component — create a reusable component
 *   pulse_create_tests   — generate starter test file with XSS, null data, and landmark stubs
 *   pulse_validate       — validate a spec against the schema
 *   pulse_review         — full code review (pass quick:true for lightweight mid-build check)
 *   pulse_stamp          — write the .pulse-verified stamp (call as last step of /verify)
 *   pulse_diagnose       — read the dev-only error journal (.pulse/errors.json)
 *   pulse_resolve_error  — mark error journal entries resolved
 *   pulse_check_bundles  — inspect production bundle contents (not just sizes)
 *   pulse_check_version  — installed vs static vs npm latest
 *   pulse_update         — re-copy pulse-ui assets from package → public/
 */

import { McpServer }           from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z }                   from 'zod'

import path                      from 'path'
import fs                        from 'fs'
import http                      from 'http'
import { spawn, spawnSync } from 'child_process'

import { loadPages } from '../cli/discover.js'
import { validateContent, validateFile, formatValidationResult } from '../cli/validate.js'
import { readJournal, formatJournal, resolveEntries, formatResolveResult } from '../cli/diagnose.js'
import { writeStamp, formatStampResult } from '../cli/stamp.js'
import { checkBundles, formatBundleCheck } from '../cli/check-bundles.js'
import { runQuickReview, formatQuickReview, runFullReview, formatFullReview } from '../cli/review.js'
import { killPulseServerOnPort } from '../cli/process-utils.js'

// ---------------------------------------------------------------------------
// Crash guards — an uncaught error in any tool handler must not kill the
// stdio transport. Without these, Claude Code sees the process exit and
// reports "pulse: disconnected" instead of a tool-level error. stderr only —
// stdout is the JSON-RPC channel and any stray write corrupts the stream.
// ---------------------------------------------------------------------------

process.on('uncaughtException', (err) => {
  console.error('[pulse-mcp] uncaught exception:', err?.stack || err)
})
process.on('unhandledRejection', (err) => {
  console.error('[pulse-mcp] unhandled rejection:', err?.stack || err)
})

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

const rootArg = process.argv.indexOf('--root')
const ROOT    = rootArg !== -1
  ? path.resolve(process.argv[rootArg + 1])
  : process.cwd()

const PAGES_DIR      = path.join(ROOT, 'src', 'pages')
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components')

// Detect whether ROOT is actually a Pulse project — used to warn the agent
// early rather than silently misbehaving in unrelated repos.
const IS_PULSE_PROJECT = (() => {
  if (fs.existsSync(path.join(ROOT, 'pulse.config.js'))) return true
  if (fs.existsSync(PAGES_DIR)) return true
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    return !!(pkg?.dependencies?.['@invisibleloop/pulse'] || pkg?.devDependencies?.['@invisibleloop/pulse'])
  } catch { return false }
})()

const PKG_VERSION = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8')
).version

// Reads pulse.config.js fresh on every call (cache-busted — the project's
// config can change between calls in a long-lived MCP server process, e.g.
// a user flips `design: 'freeform'` mid-session and the agent restarts the
// server or just calls a tool again). Returns {} if there is no config file
// or it fails to load — every caller treats missing keys as "use the default".
async function readPulseConfig() {
  const configPath = path.join(ROOT, 'pulse.config.js')
  if (!fs.existsSync(configPath)) return {}
  try {
    const mod = await import(`${configPath}?t=${Date.now()}`)
    return mod.default ?? {}
  } catch {
    return {}
  }
}

// Common synonym → canonical vibe normalisation
// Prevents hard enum errors when agents use intuitive names like "modern-minimal"
const VIBE_SYNONYMS = {
  'modern':          'minimal',
  'modern-minimal':  'minimal',
  'clean':           'minimal',
  'sleek':           'minimal',
  'stark':           'minimal',
  'newspaper':       'editorial',
  'magazine':        'editorial',
  'typographic':     'editorial',
  'serif':           'editorial',
  'fun':             'playful',
  'playful-bold':    'playful',
  'energetic':       'bold',
  'impactful':       'bold',
  'strong':          'bold',
  'raw':             'brutalist',
  'grunge':          'brutalist',
  'vintage':         'retro',
  'nostalgic':       'retro',
  'classic':         'retro',
  'futuristic':      'neon',
  'cyber':           'neon',
  'dark-tech':       'neon',
  'journal':         'paper',
  'organic':         'paper',
  'handmade':        'paper',
  'friendly':        'warm',
  'cosy':            'warm',
  'cozy':            'warm',
  'professional':    'corporate',
  'business':        'corporate',
  'enterprise':      'corporate',
}

function normaliseVibe(v) {
  if (!v) return v
  const lower = v.toLowerCase().replace(/[_\s]+/g, '-')
  return VIBE_SYNONYMS[lower] || v
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({ name: 'pulse', version: '0.2.0' })

// ---------------------------------------------------------------------------
// pulse://guide/* resources — split by topic so each fits in one read
// ---------------------------------------------------------------------------

const GUIDE_RESOURCES = [
  {
    name:        'guide-index',
    uri:         'pulse://guide',
    title:       'Pulse Guide — Index',
    description: 'Index of all Pulse guide resources. Fetch this first to find which topic resource to read next.',
    content:     () => PULSE_GUIDE_INDEX,
  },
  {
    name:        'guide-spec',
    uri:         'pulse://guide/spec',
    title:       'Pulse Guide — Spec, Mutations, Actions, Streaming',
    description: 'Spec structure, mutations, actions, streaming SSR, key rules, and form layout patterns.',
    content:     () => GUIDE_SPEC,
  },
  {
    name:        'guide-server',
    uri:         'pulse://guide/server',
    title:       'Pulse Guide — Server, Store, Cookies, Redirects',
    description: 'Global store, per-page persistence, server context, cookies, redirects, POST bodies, raw specs.',
    content:     () => GUIDE_SERVER,
  },
  {
    name:        'guide-styles',
    uri:         'pulse://guide/styles',
    title:       'Pulse Guide — CSS, Theming, Fonts, Utilities',
    description: 'meta.styles, theming with CSS tokens, custom fonts (Google/Adobe/self-hosted), utility classes.',
    content:     () => GUIDE_STYLES,
  },
  {
    name:        'guide-routing',
    uri:         'pulse://guide/routing',
    title:       'Pulse Guide — Routing, Navigation, Page Discovery',
    description: 'Site navigation, automatic page discovery, dynamic routes with :params.',
    content:     () => GUIDE_ROUTING,
  },
  {
    name:        'guide-components',
    uri:         'pulse://guide/components',
    title:       'Pulse Guide — UI Components',
    description: 'All Pulse UI components: forms, layout, charts, icons, landing page, typography. Props reference and composition patterns.',
    content:     () => GUIDE_COMPONENTS,
  },
  {
    name:        'guide-examples',
    uri:         'pulse://guide/examples',
    title:       'Pulse Guide — Complete Examples',
    description: 'Full working page examples including contact form with actions, validation, and error handling.',
    content:     () => GUIDE_EXAMPLES,
  },
  {
    name:        'guide-templates',
    uri:         'pulse://guide/templates',
    title:       'Pulse Guide — Templates & Scaffolding',
    description: 'Ready-made page templates. Fetch this when the user asks to build a landing page, marketing site, or branded template — it lists triggers, pre-build questions, and adaptation rules for each template.',
    content:     () => GUIDE_TEMPLATES,
  },
  {
    name:        'guide-design-references',
    uri:         'pulse://guide/design-references',
    title:       'Pulse Guide — Design Directions & Aesthetic Vocabulary',
    description: '12 named design directions (warm local business, editorial, brutalist, event, portfolio, etc.) with vibe presets, component combinations, palette patterns, and signature moves. Fetch when choosing an aesthetic approach for a new project.',
    content:     () => GUIDE_DESIGN_REF,
  },
  {
    name:        'guide-design-gallery',
    uri:         'pulse://guide/design-gallery',
    title:       'Pulse Guide — Design Gallery & Prop Reference',
    description: 'Curated catalogue of all 6 templates with visual descriptions, vibes, CSS themes, and key components. Also includes component combination recipes (image card, article card, stat strip, credentials list, booking form) and a critical prop-name reference (content vs children, name vs author, question vs title, etc.).',
    content:     () => GUIDE_DESIGN_GALL,
  },
  {
    name:        'guide-explore',
    uri:         'pulse://guide/explore',
    title:       'Pulse Guide — Blank-Canvas Layout Thinking',
    description: 'Escape template defaults: zone-based layout thinking, emotional intent, 7 structural gestures (full-bleed, asymmetric split, typography-only, editorial flow, dense grid, story scroll, content-first), raw HTML patterns with zero components, CSS token reference, and an anti-pattern checklist. Read when the user wants something truly distinctive or pulse_sketch returns an unusual direction.',
    content:     () => GUIDE_EXPLORE,
  },
]

for (const { name, uri, title, description, content } of GUIDE_RESOURCES) {
  server.registerResource(name, uri, { title, description, mimeType: 'text/plain' },
    async () => ({ contents: [{ uri, mimeType: 'text/plain', text: content() }] })
  )
}

// pulse://start — context-aware single entry point.
// Detects whether this is a new project, new page, or targeted edit, and returns
// exactly what the agent needs — no upfront decision tree, no wasted fetches.
server.registerResource(
  'start',
  'pulse://start',
  {
    title:       'Pulse Start — Context-Aware Entry Point',
    description: 'Single entry point that returns the right resources for your situation: new project, new page, targeted edit, or bug fix. Fetch this first instead of deciding between pulse://workflow and pulse://quickstart.',
    mimeType:    'text/plain',
  },
  async () => {
    // Detect project state to tailor the response
    let pageCount = 0
    try {
      const specs = await loadPages(ROOT)
      pageCount = specs.length
    } catch { /* fresh project */ }

    const isNewProject = pageCount === 0

    const config = await readPulseConfig()
    // 'components' (default) — the standard pulse_intake/sketch/intent pipeline
    // and src/ui/* component-first mandate below apply as normal.
    // 'freeform' — the user has opted this project out of that pipeline: build
    // plain hand-written HTML/CSS, no src/ui/* components, no intake/sketch
    // ceremony. Read once per pulse://start fetch (project-wide, not a per-page
    // choice) so it applies automatically every session without the user
    // having to repeat it — set once in pulse.config.js, honoured everywhere.
    const isFreeform = config.design === 'freeform'

    const freeformBanner = isFreeform ? `
> ⚠ **\`design: 'freeform'\` is set in pulse.config.js.** This project defaults to **Mode B — creative override** (see the persona's "Design Freedom" rule) on every page, every session — you do not need to ask the user or re-decide per page.
> - Skip \`pulse_intake\` → \`pulse_sketch\` → \`pulse_intent\`'s component scaffolding. Go straight to the spec.
> - Write plain hand-rolled HTML/CSS in the view — any structure, any class names, no \`@invisibleloop/pulse/ui\` components required.
> - **Still write the override comment at the top of every new spec file** — \`// component-free — creative override: <reason>\` — even though the mode is project-wide. \`pulse_review\` detects Mode B by reading that comment from each file's source, not from this config; a spec without it will be flagged.
> - Functional atoms (\`button\`, \`input\`, \`badge\`, \`modal\`) can still come from components where there's no design reason not to — Mode B doesn't forbid them, it just removes the obligation.
> - The pass bar is unchanged from Mode B: Lighthouse 100 on Accessibility, Best Practices, and SEO (desktop + mobile), CLS 0.00, \`<main id="main-content">\`, and hex-in-\`theme.css\`-only — all still enforced by \`pulse_validate\`/\`/verify\`/\`pulse_review\`.
` : ''

    return ({
      contents: [{
        uri:      'pulse://start',
        mimeType: 'text/plain',
        text: `# Pulse — Start Here

${isNewProject
  ? `> **New project detected** — no pages found in src/pages/ yet.`
  : `> **Existing project** — ${pageCount} page${pageCount !== 1 ? 's' : ''} found.`}
${freeformBanner}
---

## What are you doing?

### A — New page or new site from scratch
${isFreeform
  ? `Skip the intake/sketch/intent component pipeline (this project is \`design: 'freeform'\` — Mode B on every page). Fetch \`pulse://workflow\` for the phase/gate sequence, but treat step 3a as already decided: Mode B, every page, no re-asking.

Quick checklist before your first line of code:
1. Ask the user for design inspiration first (a site, screenshot, or mood board) if they haven't already described a direction
2. Ask: **light or dark?** Pulse renders dark when \`meta.theme\` is unset — decide before writing a single line
3. Write the spec directly with hand-rolled HTML/CSS, including the \`// component-free — creative override: <reason>\` comment at the top of the file
4. Fetch \`pulse://guide/design-references\` for aesthetic direction if useful — skip \`pulse://guide/components\``
  : `Fetch \`pulse://workflow\` for the full phase/gate sequence, then follow the intake → sketch → intent pipeline.

Quick checklist before your first line of code:
1. Ask the user for design inspiration first (a site, screenshot, or mood board)
2. Ask: **light or dark?** Pulse renders dark when \`meta.theme\` is unset — decide before writing a single line
3. Run \`pulse_intake\` → \`pulse_sketch\` → \`pulse_intent\`
4. Fetch \`pulse://guide/templates\` + \`pulse://guide/design-references\` for aesthetic direction`}

### B — Editing an existing page, adding a section, or fixing a bug
Fetch \`pulse://quickstart\` — workflow phases, spec skeleton, components, and theming in one fetch.

Quick checklist:
1. Read the file you're changing
2. Make the edit
3. \`pulse_validate\` → \`/verify --quick\` (mid-iteration) or \`/verify\` (final check)

### C — Targeted one-liner (label change, prop swap, CSS tweak)
No resource fetch needed. Read the file, make the change, run \`/verify --quick\` to check it looks right, then \`/verify\` when the user is happy.

### D — Stuck mid-build
- Wrong component props? → \`pulse://guide/components\`
- Server data / store / auth? → \`pulse://guide/server\`
- CSS / theming? → \`pulse://guide/styles\`
- Routing or layout? → \`pulse://guide/routing\`
- Lighthouse < 100? → Fix the failing audit, re-run \`/verify\`
- Something looks wrong visually? → \`pulse_restart_server\` (hot-reloads specs instantly) then navigate the browser

---

## Essential rules — memorise these

- **\`meta.theme\` defaults to dark.** If the design is light, set \`theme: 'light'\` in the plan — not at screenshot time.
- **Never set \`hydrate\`** — the framework sets it automatically from the URL entry.
- **\`meta\` is always a plain object** — individual fields (\`title\`, \`description\`) can be async functions, but \`meta\` itself is \`{}\`.
- **After every file edit:** \`pulse_restart_server\` → navigate browser → check result. (Hot-reloads specs in ~200 ms — no process restart needed.)
- **\`/verify\` is always last** — it writes the \`.pulse-verified\` stamp. Without it, the stop hook blocks.

---

## Tools you'll use most

| Tool | When |
|---|---|
| \`pulse_intake\` | New project — capture name, pitch, palette, theme, vibe |
| \`pulse_sketch\` | New project — 3 layout directions before writing code |
| \`pulse_intent\` | Map a description to archetype + scaffold |
| \`pulse_suggest\` | **After first draft** — mid-build health check before hard validation |
| \`pulse_validate\` | After every write |
| \`pulse_review\` | Final gate after Lighthouse passes |
| \`pulse_restart_server\` | After every file edit |
| \`pulse_status\` | Session start — pages, server status, last build |
`,
      }]
    })
  }
)

// pulse://quickstart — combined essentials for simple/targeted tasks.
// Reduces cold-start fetch round-trips from 4 (workflow + spec + components + styles)
// to 1 for edits, bug fixes, and one-shot page builds that don't need the full guides.
server.registerResource(
  'quickstart',
  'pulse://quickstart',
  {
    title:       'Pulse Quickstart — Essentials in One Fetch',
    description: 'Workflow phases, spec skeleton, key component rules, and theming essentials combined. Use for targeted edits, bug fixes, or simple page builds instead of fetching pulse://workflow + pulse://guide/spec + pulse://guide/components separately.',
    mimeType:    'text/plain',
  },
  async () => ({
    contents: [{
      uri:      'pulse://quickstart',
      mimeType: 'text/plain',
      text: `# Pulse Quickstart

> **When to use this resource**
> - Editing an existing page, fixing a bug, or adding a section to a known page
> - One-shot "build me X" requests where you already know what to build
> - Any task where you don't need intake, sketch, or design direction
>
> **When to use the full guides instead**
> - New project or new branded page → \`pulse://workflow\` then \`pulse://guide/templates\` + \`pulse://guide/design-references\`
> - Unfamiliar component props → \`pulse://guide/components\`
> - Server data, store, auth → \`pulse://guide/server\`
> - CSS / theming deep-dive → \`pulse://guide/styles\`

---

## Workflow (abbreviated)

\`\`\`
New page:   pulse_intake → pulse_sketch → pulse_intent → build → validate → screenshot → design approval → /verify
Edit/fix:   read file → change → validate → /verify --quick → (iterate) → /verify
\`\`\`

**\`/verify\` has two modes:**
- \`/verify --quick\` — validate + screenshot + console + code review. No Lighthouse, no build. Use this during active iteration, between design rounds, or any time you're not yet at the "ready to ship" point. Fast (~10 s).
- \`/verify\` — full loop: Lighthouse desktop + mobile + perf trace + all of the above. Use once the user has approved the design and you're done building. Slow (~90 s).

**Rule: default to \`/verify --quick\` while building. Only run \`/verify\` (full) when the user signals they're done or happy with the result.**

Tier 1 (static/read-only): phases 3 → 4 → 5a (design approval) → 5b (/verify)
Tier 2 (interactive):       phases 3 → 4 → 5a → 5b → 6 (tests) → 7 (review)

Pass bar — ALL must pass before done:
- \`pulse_validate\` clean (no errors, no warnings)
- Lighthouse desktop + mobile: Accessibility, Best Practices, SEO all 100
- CLS: 0.00
- No console errors

---

## Spec skeleton

\`\`\`js
import { nav, hero, section, container, grid, button, footer } from '@invisibleloop/pulse/ui'

export default {
  route: '/',
  meta: {
    title:       'Page Title',
    description: 'Meta description.',
    theme:       'light',          // omit for dark (default)
    vibe:        'editorial',      // warm|editorial|playful|minimal|bold|brutalist|retro|corporate|neon|paper
    styles:      ['/pulse-ui.css', '/theme.css', '/app.css'],
  },
  // state + mutations only if interactive:
  state: { status: 'idle' },
  mutations: { setStatus: (state, e) => ({ status: e.target.value }) },
  // server fetchers (SSR, optional):
  server: { items: async () => fetchItems() },
  view: (state, server) => \`
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;...">Skip to main content</a>
    \${nav({ logo: 'My Site', links: [...], action: button({ label: 'CTA', href: '/signup' }) })}
    <main id="main-content">
      <!-- sections here -->
    </main>
    \${footer({ logo: 'My Site', links: [...], legal: '© 2026 My Site' })}
  \`,
}
\`\`\`

**Critical rules:**
- \`meta\` is always a plain object — never \`meta: async (ctx) => ({...})\`
- Never set \`hydrate\` — the framework sets it automatically
- \`onSuccess\` AND \`onError\` are both required in every action
- Never use \`data-event\` on text inputs — use FormData in \`onStart\`/\`run\`
- Every interactive element must be \`<button>\`, \`<a>\`, or have \`tabindex="0"\`
- \`<main id="main-content">\` is required on every page

---

## Event binding — input patterns

**The right pattern for each input type:**

| Input type | Pattern | Why |
|---|---|---|
| Button click | \`<button data-event="increment">\` | click fires mutation |
| Select / radio / checkbox | \`<select data-event="change:setFilter">\` | \`change\` fires on blur-with-changed-value — the correct commit semantic |
| Color picker | \`<input type="color" data-event="change:setColor">\` | same as select |
| Range slider | \`<input type="range" data-event="input:setVolume">\` | \`input\` fires on every drag step |
| Text / email / password / search | **No \`data-event\`** — read via FormData | \`data-event\` on text inputs re-renders on every keystroke, destroying cursor position and focus |
| Continuous drag (vertex, panel resize, custom slider handle) | \`data-event="pointerdown:start pointermove:drag pointerup:end"\` | one element, multiple space-separated bindings — \`pointerdown\` captures the pointer so \`pointermove\`/\`pointerup\` keep firing on that element even off-bounds; \`pointercancel\` also routes to the \`pointerup\` mutation |
| Keyboard shortcut / arrow-key nudge | \`<div tabindex="0" data-event="keydown:onKey">\` | fires on \`keydown\`; read \`e.key\` in the mutation |

**Text input pattern (uncontrolled):**
\`\`\`js
// view — no data-event on the input
view: (state) => \`
  <form data-action="submit">
    <input type="text" name="email" placeholder="Email">
    <button type="submit">Save</button>
  </form>
\`,
// action — read FormData in onStart (before validation)
actions: {
  submit: {
    onStart:   (state, formData) => ({ status: 'loading', email: formData.get('email') }),
    validate:  true,
    run:       async (state) => { /* use state.email */ },
    onSuccess: (state) => ({ status: 'success' }),
    onError:   (state, err) => ({ status: 'error', error: err.message }),
  }
}
\`\`\`

**\`change:\` is the blur/commit event** — it fires when a non-text input loses focus with a changed value. This is correct for selects, color pickers, checkboxes, and radios. It does NOT fire on every keystroke (use \`input:\` for live-updating sliders or search fields where re-render on every character is intentional and the element is not a free-text input).

**Continuous drag pattern (pointer events):**
\`\`\`js
// view — pointerdown/pointermove/pointerup all bound on the same element
view: (state) => \`
  <circle
    cx="\${state.x}" cy="\${state.y}" r="8"
    data-event="pointerdown:startDrag pointermove:dragVertex pointerup:endDrag">
  </circle>
\`,
mutations: {
  startDrag:  (state) => ({ dragging: true }),
  // gate on \`dragging\` — pointermove fires on every cursor move over the
  // element, not just while a drag is active
  dragVertex: (state, e) => state.dragging ? { x: e.clientX, y: e.clientY } : {},
  endDrag:    (state) => ({ dragging: false }),
}
\`\`\`
\`pointerdown\` calls \`setPointerCapture\` on its target automatically — no manual capture code needed. \`pointercancel\` (browser-interrupted gestures) fires the same mutation as \`pointerup\`, so a drag can never get stuck "in progress".

---

## Key components (quick reference)

Import from \`@invisibleloop/pulse/ui\`. Always include \`/pulse-ui.css\` in \`meta.styles\`.

| Component | Key props |
|---|---|
| \`nav\` | \`logo\`, \`logoHref\`, \`links\` ([{label,href}]), \`action\` (HTML slot), \`sticky\` |
| \`hero\` | \`title\`, \`subtitle\`, \`eyebrow\`, \`actions\` (HTML slot), \`image\` (HTML slot), \`background\` |
| \`button\` | \`label\`, \`variant\` (primary/secondary/ghost/**ghost-light**/danger), \`size\` (sm/md/lg), \`href\` — use **ghost-light** on dark backgrounds |
| \`section\` | \`content\`, \`variant\` (default/alt/**dark**/diagonal/paper/spotlight), \`padding\`, \`id\` — **dark** in light theme = navy bg |
| \`container\` | \`content\`, \`size\` (sm/md/lg/xl) |
| \`grid\` | \`content\`, \`cols\` (1–4), \`gap\` (sm/md/lg) |
| \`card\` | \`title\`, \`content\`, \`footer\`, \`variant\` (default/elevated/bordered/flat/glass/tinted) |
| \`feature\` | \`icon\`, \`title\`, \`description\`, \`level\`, \`center\` |
| \`stat\` | \`label\`, \`value\`, \`change\`, \`trend\`, \`center\` |
| \`cta\` | \`title\`, \`subtitle\`, \`actions\` (HTML slot), \`eyebrow\` |
| \`footer\` | \`logo\`, \`logoHref\`, \`links\`, \`legal\`, \`columns\` |
| \`input\` | \`name\`, \`label\`, \`type\`, \`required\`, \`error\` |
| \`modal\` | \`id\`, \`title\`, \`content\`, \`footer\` — always in DOM, never conditional |
| \`heading\` | \`text\`, \`level\`, \`size\` |
| \`pullquote\` | \`quote\`, \`cite\`, \`size\`, \`variant\` (default/editorial) |

---

## Theming essentials

- Hex values → \`public/theme.css\` only. \`app.css\` uses \`var()\` references only.
- Load order: \`/pulse-ui.css\` → \`/theme.css\` → \`/app.css\`
- Light theme overrides target \`[data-theme="light"]\`, NOT \`\:root\`
- \`--ui-accent\` must pass WCAG AA 4.5:1 on \`--ui-bg\` for body text
- \`--ui-muted\` on warm/light palettes often fails contrast — always override \`--muted\` when changing \`--bg\` and run \`pulse_check_contrast\`
- Ghost buttons on dark backgrounds: use \`variant: 'ghost-light'\` not \`'ghost'\`
`,
    }]
  })
)

server.registerResource(
  'workflow',
  'pulse://workflow',
  {
    title:       'Pulse Build Workflow',
    description: 'The exact sequence of phases and pass gates to follow for every build task. Fetch this at the start of any new build task.',
    mimeType:    'text/plain',
  },
  async () => ({
    contents: [{
      uri:      'pulse://workflow',
      mimeType: 'text/plain',
      text:     WORKFLOW,
    }]
  })
)

server.registerResource(
  'persona',
  'pulse://persona',
  {
    title:       'Pulse Agent Persona',
    description: 'Who you are, what you care about, and the quality bar you hold yourself to when building Pulse apps.',
    mimeType:    'text/plain',
  },
  async () => ({
    contents: [{
      uri:      'pulse://persona',
      mimeType: 'text/plain',
      text:     PULSE_PERSONA,
    }]
  })
)

// ---------------------------------------------------------------------------
// pulse_list_structure
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_list_structure',
  {
    description: 'List all pages and components in the Pulse project. Call this to understand what already exists before creating anything.',
    inputSchema: {},
  },
  async () => {
    if (!IS_PULSE_PROJECT) {
      return { content: [{ type: 'text', text: `⚠ This does not appear to be a Pulse project (no pulse.config.js, no src/pages/, no @invisibleloop/pulse dependency found in ${ROOT}).\n\nThe pulse MCP server is project-specific — it is started by the \`pulse\` CLI from inside a Pulse project directory. If you are working on a Pulse project, check that you launched with \`pulse\` from the correct directory.` }] }
    }
    const specs      = await loadPages(ROOT)
    const components = findComponents()
    const lines      = []

    if (specs.length === 0) {
      lines.push('Pages: (none)')
    } else {
      lines.push('Pages:')
      for (const spec of specs) {
        const route    = spec.route
        const isDynamic = route.includes(':')
        const params   = isDynamic
          ? route.match(/:([^/]+)/g).map(p => p.slice(1)).join(', ')
          : null

        const tags = [
          isDynamic              && `params: ${params}`,
          spec.server            && 'server',
          spec.mutations         && `mutations: ${Object.keys(spec.mutations).join(', ')}`,
          spec.actions           && `actions: ${Object.keys(spec.actions).join(', ')}`,
        ].filter(Boolean)

        const tagStr = tags.length ? `  [${tags.join(' | ')}]` : ''
        const hydrateStr = spec.hydrate
          ? path.relative(ROOT, spec.hydrate.replace('/src/', 'src/'))
          : '(server-only)'
        lines.push(`  ${route.padEnd(24)} → ${hydrateStr}${tagStr}`)
      }
    }

    lines.push('')

    if (components.length === 0) {
      lines.push('Components: (none)')
    } else {
      lines.push('Components:')
      for (const { name, filePath } of components) {
        lines.push(`  ${name.padEnd(24)} → ${path.relative(ROOT, filePath)}`)
      }
    }

    lines.push('')

    const stampPath     = path.join(ROOT, 'public', '.pulse-ui-version')
    const syncedVersion = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : null

    if (syncedVersion !== PKG_VERSION) {
      lines.push(`⚠ pulse-ui assets are OUT OF DATE`)
      lines.push(`  Installed: v${PKG_VERSION}`)
      lines.push(`  Project:   ${syncedVersion ? `v${syncedVersion}` : 'unknown (never synced)'}`)
      lines.push(`  Fix: stop the dev server and run \`pulse dev\` — assets sync automatically on startup.`)
      lines.push(`  Until then, new components or CSS changes will not be visible in the browser.`)
    } else {
      lines.push(`pulse-ui: v${PKG_VERSION} ✓`)
    }

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_status
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_status',
  {
    description: 'Project health snapshot — pages, routes, server status, last build. Call at the start of a session to orient quickly without reading files.',
    inputSchema: {},
  },
  async () => {
    if (!IS_PULSE_PROJECT) {
      return { content: [{ type: 'text', text: `⚠ This does not appear to be a Pulse project (no pulse.config.js, no src/pages/, no @invisibleloop/pulse dependency found in ${ROOT}).\n\nThe pulse MCP server is project-specific — it is started by the \`pulse\` CLI from inside a Pulse project directory. If you are working on a Pulse project, check that you launched with \`pulse\` from the correct directory.` }] }
    }
    const lines = []

    // ── Pages ──────────────────────────────────────────────────────────────
    const specs      = await loadPages(ROOT)
    const components = findComponents()
    lines.push(`Pages: ${specs.length}`)
    for (const s of specs) {
      const tags = [
        s.server    && 'server',
        s.mutations && 'mutations',
        s.actions   && 'actions',
        s.store     && 'store',
        s.stream    && 'streaming',
      ].filter(Boolean)
      const tagStr = tags.length ? `  [${tags.join(', ')}]` : ''
      lines.push(`  ${(s.route || '?').padEnd(26)}${tagStr}`)
    }

    lines.push(`\nComponents: ${components.length}`)
    if (components.length > 0) {
      lines.push(components.map(c => `  ${c.name}`).join('\n'))
    }

    // ── Dev server ─────────────────────────────────────────────────────────
    let port = 3000
    const configPath = path.join(ROOT, 'pulse.config.js')
    if (fs.existsSync(configPath)) {
      try {
        const mod = await import(`${configPath}?t=${Date.now()}`)
        if (mod.default?.port) port = mod.default.port
      } catch { /* use default */ }
    }
    const serverRunning = await new Promise(res => {
      const req = http.get(`http://localhost:${port}/`, r => { r.resume(); res(true) })
      req.on('error', () => res(false))
      req.setTimeout(1500, () => { req.destroy(); res(false) })
    })
    lines.push(`\nDev server: ${serverRunning ? `running on port ${port}` : `not running (port ${port})`}`)

    // ── Last build ─────────────────────────────────────────────────────────
    const manifestPath = path.join(ROOT, 'public', 'dist', 'manifest.json')
    if (fs.existsSync(manifestPath)) {
      const mtime = fs.statSync(manifestPath).mtime
      const age   = Math.round((Date.now() - mtime) / 1000)
      const ageStr = age < 60 ? `${age}s ago`
        : age < 3600 ? `${Math.round(age / 60)}m ago`
        : `${Math.round(age / 3600)}h ago`

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      const bundles  = Object.values(manifest).filter(v => v.endsWith('.js') && !v.includes('runtime') && !v.includes('menu') && !v.includes('pulse-ui'))
      const cssFiles = Object.values(manifest).filter(v => v.endsWith('.css'))
      lines.push(`\nLast build: ${ageStr}`)
      lines.push(`  ${bundles.length} JS bundle${bundles.length !== 1 ? 's' : ''}, ${cssFiles.length} CSS file${cssFiles.length !== 1 ? 's' : ''}`)
    } else {
      lines.push('\nLast build: never (run pulse build first)')
    }

    // ── pulse-ui version ───────────────────────────────────────────────────
    const stampPath     = path.join(ROOT, 'public', '.pulse-ui-version')
    const syncedVersion = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : null
    const versionMatch  = syncedVersion === PKG_VERSION
    lines.push(`\npulse-ui: ${versionMatch ? `v${PKG_VERSION} ✓` : `OUT OF DATE (project: ${syncedVersion || 'unknown'}, installed: v${PKG_VERSION})`}`)

    // ── Last verified stamp ────────────────────────────────────────────────
    const verifyStampPath = path.join(ROOT, '.pulse-verified')
    if (fs.existsSync(verifyStampPath)) {
      const stampSecs = parseInt(fs.readFileSync(verifyStampPath, 'utf8').trim(), 10)
      const stampAge  = Math.round((Date.now() / 1000) - stampSecs)
      const stampStr  = stampAge < 60 ? `${stampAge}s ago`
        : stampAge < 3600 ? `${Math.round(stampAge / 60)}m ago`
        : `${Math.round(stampAge / 3600)}h ago`

      // Check if any spec was edited after the stamp
      const pagesDir = path.join(ROOT, 'src', 'pages')
      let staleSince = null
      if (fs.existsSync(pagesDir)) {
        const checkDir = (dir) => {
          for (const entry of fs.readdirSync(dir)) {
            const full = path.join(dir, entry)
            if (fs.statSync(full).isDirectory()) { checkDir(full); continue }
            if (!entry.endsWith('.js') || entry.endsWith('.test.js')) continue
            const mtime = fs.statSync(full).mtimeMs / 1000
            if (mtime > stampSecs && (!staleSince || mtime > staleSince)) staleSince = mtime
          }
        }
        try { checkDir(pagesDir) } catch { /* ignore */ }
      }
      if (staleSince) {
        const editAge = Math.round((Date.now() / 1000) - staleSince)
        const editStr = editAge < 60 ? `${editAge}s ago` : editAge < 3600 ? `${Math.round(editAge / 60)}m ago` : `${Math.round(editAge / 3600)}h ago`
        lines.push(`\nLast verified: ${stampStr} ⚠ spec edited ${editStr} after stamp — run /verify`)
      } else {
        lines.push(`\nLast verified: ${stampStr} ✓`)
      }
    } else {
      lines.push('\nLast verified: never — run /verify before marking work done')
    }

    // ── Served title check ─────────────────────────────────────────────────
    // Fetch the served HTML and compare its <title> against the spec's meta.title.
    // A mismatch means the dev server is serving a different project — a common
    // confusion source when multiple Pulse projects share the same port.
    if (serverRunning && specs.length > 0) {
      const rootSpec = specs.find(s => s.route === '/' || s.route === '')
      if (rootSpec?.meta?.title && typeof rootSpec.meta.title === 'string') {
        try {
          const servedHtml = await new Promise((resolve, reject) => {
            let body = ''
            const req = http.get(`http://localhost:${port}/`, res => {
              res.on('data', chunk => { body += chunk; if (body.length > 4096) { req.destroy(); resolve(body) } })
              res.on('end', () => resolve(body))
            })
            req.on('error', reject)
            req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')) })
          })
          const titleMatch = servedHtml.match(/<title>([^<]*)<\/title>/)
          const servedTitle = titleMatch?.[1]?.trim()
          if (servedTitle && servedTitle !== rootSpec.meta.title) {
            lines.push(`\n⚠ Server title mismatch: served "${servedTitle}" but spec says "${rootSpec.meta.title}". The dev server may be serving a different project — run pulse_restart_server.`)
          }
        } catch { /* ignore — network error, non-critical */ }
      }
    }

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_validate
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_validate',
  {
    description: 'Validate a Pulse spec before writing it. Returns errors or confirms the spec is valid.',
    inputSchema: {
      content: z.string().optional().describe('JavaScript spec content to validate'),
      file: z.string().optional().describe('Absolute path to spec file to validate'),
    },
  },
  async ({ content, file }) => {
    if (!content && !file) {
      return text('Error: must provide either content or file')
    }
    if (content && file) {
      return text('Error: provide only one of content or file, not both')
    }

    const result = file ? await validateFile(file, ROOT) : await validateContent(content, ROOT)
    return text(formatValidationResult(result, { nextSteps: true }))
  }
)

// ---------------------------------------------------------------------------
// pulse_create_page
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_page',
  {
    description: `Validate and register a page spec that you have already written to disk with the Write tool.

Workflow — always in this order:
1. Write the spec file to src/pages/<name>.js using the Write tool (user sees the diff)
2. Call pulse_create_page with just the name to validate it

Do NOT pass content here — write the file first, then call this tool.

Rules for the spec you write:
- Import Pulse UI components from '@invisibleloop/pulse/ui' — never write raw HTML for nav, hero, button, card, input, etc.
- Include '/pulse-ui.css' in meta.styles whenever using any UI component
- Use u- utility classes for spacing/layout — never inline styles
- Use var(--ui-*) CSS tokens for any colour — never hardcode hex values
- onSuccess AND onError are both required in every action
- Do NOT use data-event on text inputs — use FormData in onStart/run instead
- Always export default spec`,
    inputSchema: {
      name: z.string().describe('Filename without extension, matching what you wrote — e.g. "about" or "blog/post"'),
    },
  },
  async ({ name }) => {
    const segments = name.replace(/\.js$/, '').split('/')
    const fullPath = path.join(PAGES_DIR, ...segments) + '.js'

    if (!fullPath.startsWith(PAGES_DIR)) {
      return text('Error: page name must not escape src/pages/')
    }

    if (!fs.existsSync(fullPath)) {
      return text(`Error: ${path.relative(ROOT, fullPath)} does not exist — write the file with the Write tool first, then call pulse_create_page.`)
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    // Validate from the file's own directory so relative imports resolve
    // correctly for pages in subdirectories (src/pages/news/index.js)
    const result = await validateContent(content, ROOT, path.dirname(fullPath))
    if (!result.valid) return text(formatValidationResult(result))

    const route = derivedRouteFromName(name)
    return text(`Validated ${path.relative(ROOT, fullPath)} → route "${route}"`)
  }
)

// ---------------------------------------------------------------------------
// pulse_create_component
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_component',
  {
    description: `Register a component you have already written to disk with the Write tool.

Workflow — always in this order:
1. Write the component file to src/components/<name>.js using the Write tool (user sees the diff)
2. Call pulse_create_component with just the name to confirm it was created correctly

Do NOT pass content here — write the file first, then call this tool.

Rules for the component you write:
- Import Pulse UI components from '@invisibleloop/pulse/ui' where applicable
- Use u- utility classes for spacing/layout — never inline styles
- Use var(--ui-*) CSS tokens for any colour references — never hardcode hex values
- Export named functions only (no default export needed)`,
    inputSchema: {
      name: z.string().describe('Component filename without extension, e.g. "hero" or "nav"'),
    },
  },
  ({ name }) => {
    const safeName = name.replace(/\.js$/, '')
    const fullPath = path.join(COMPONENTS_DIR, `${safeName}.js`)

    if (!fullPath.startsWith(COMPONENTS_DIR)) {
      return text('Error: component name must not escape src/components/')
    }

    if (!fs.existsSync(fullPath)) {
      return text(`Error: ${path.relative(ROOT, fullPath)} does not exist — write the file with the Write tool first, then call pulse_create_component.`)
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    const exports = [...content.matchAll(/^export\s+(?:function|const|async function)\s+(\w+)/gm)].map(m => m[1])
    const exportNote = exports.length > 0 ? `Exports: ${exports.join(', ')}` : 'Warning: no named exports found — check the file exports at least one function.'

    return text(`Registered ${path.relative(ROOT, fullPath)}\n${exportNote}`)
  }
)

// ---------------------------------------------------------------------------
// pulse_create_store
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_store',
  {
    description: `Register a pulse.store.js global store that you have already written to disk with the Write tool.

Workflow — always in this order:
1. Write pulse.store.js to the project root using the Write tool (user sees the diff)
2. Call pulse_create_store to validate the file you just wrote

Do NOT pass content here — write the file first, then call this tool.

Rules for the store you write:
- server fetchers must be async functions: async (ctx) => value
- mutations must be pure functions: (storeState, payload?) => partialState — no fetch, no side effects
- hydrate is required if the store has mutations (enables client-side store mutation dispatch)
- Register the store in your server file by passing it to createServer({ store })
- Pages subscribe to store keys via spec.store: ['user', 'settings']`,
    inputSchema: {},
  },
  () => {
    const storePath = path.join(ROOT, 'pulse.store.js')

    if (!fs.existsSync(storePath)) {
      return text('Error: pulse.store.js does not exist — write the file with the Write tool first, then call pulse_create_store.')
    }

    const content = fs.readFileSync(storePath, 'utf8')

    if (!content.includes('export default')) {
      return text('Invalid: pulse.store.js must contain "export default { ... }"')
    }

    const hasServer    = content.includes('server:')
    const hasMutations = content.includes('mutations:')
    const hasHydrate   = content.includes('hydrate:')

    const warnings = []
    if (hasMutations && !hasHydrate) {
      warnings.push('Warning: store has mutations but no hydrate — add hydrate: \'/pulse.store.js\' to enable client-side store dispatch.')
    }

    const lines = ['Validated pulse.store.js']
    if (hasServer)    lines.push('  ✓ server fetchers defined')
    if (hasMutations) lines.push('  ✓ mutations defined')
    if (hasHydrate)   lines.push('  ✓ hydrate set')
    if (warnings.length) lines.push('', ...warnings)
    lines.push(`
Next steps:
1. Import and register it in your server file:
   import store from './pulse.store.js'
   createServer(specs, { store })

2. Declare which keys each page uses:
   export default { route: '/dashboard', store: ['user', 'settings'], ... }`)

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_create_action
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_action',
  {
    description: 'Generate a correctly-structured Pulse action snippet to add to a page spec. Returns code to paste into the spec\'s actions property. Actions handle async operations like form submissions and API calls. Note: onSuccess AND onError are BOTH required — omitting either will cause a runtime error.',
    inputSchema: {
      name:        z.string().describe('Action name, e.g. "submit" or "deleteItem"'),
      description: z.string().optional().describe('What the action does — used as a code comment'),
      validate:    z.boolean().optional().describe('Whether to run spec validation before run() — use true for forms with validation rules'),
      fields:      z.string().optional().describe('Comma-separated list of FormData fields this action expects, e.g. "email,name,message"'),
    },
  },
  ({ name, description, validate = false, fields }) => {
    const comment   = description ? `    // ${description}\n` : ''
    const fieldList = fields
      ? fields.split(',').map(f => f.trim()).filter(Boolean)
      : []

    const onStart = fieldList.length > 0
      ? `      onStart: (state, formData) => ({\n        status: 'loading',\n${fieldList.map(f => `        ${f}: formData.get('${f}'),`).join('\n')}\n      }),`
      : `      onStart: (state, formData) => ({ status: 'loading' }),`

    const snippet = `${comment}    ${name}: {
${onStart}${validate ? '\n      validate: true,' : ''}
      run: async (state, serverState, formData) => {
        // TODO: implement — fetch, API call, etc.
      },
      onSuccess: (state, result) => ({ status: 'success' }),
      onError:   (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },`

    return text(`Add this inside your spec's actions property:\n\n  actions: {\n${snippet}\n  }`)
  }
)

// ---------------------------------------------------------------------------
// pulse_create_tests
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_tests',
  {
    description: `Generate a starter test file for a Pulse page spec. Stubs out the formulaic test cases — null data, empty arrays, XSS injection, view landmarks, mutation logic, and onViewError — so you start with coverage scaffolding rather than a blank file.

Workflow:
1. Call this with the spec file path after writing the spec
2. Review the generated stub file — add real assertions where marked TODO
3. Run the tests with pulse_run_tests
4. Fill in any missing assertions until 100% branch coverage passes

The generated file uses @invisibleloop/pulse/testing (renderSync / render). Do NOT use raw html.includes() in tests.`,
    inputSchema: {
      file: z.string().describe('Absolute path to the spec file, e.g. /Users/me/project/src/pages/about.js'),
    },
  },
  async ({ file }) => {
    if (!fs.existsSync(file)) {
      return text(`File not found: ${file}`)
    }

    const source  = fs.readFileSync(file, 'utf8')
    const relPath = path.relative(ROOT, file)
    const testFile = file.replace(/\.js$/, '.test.js')

    if (fs.existsSync(testFile)) {
      return text(`Test file already exists: ${path.relative(ROOT, testFile)}\nDelete it first if you want to regenerate.`)
    }

    // Extract spec details to inform the scaffolding
    const hasMutations  = source.includes('mutations:')
    const hasActions    = source.includes('actions:')
    const hasServer     = source.includes('server:')
    const hasOnViewError = source.includes('onViewError')
    const hasValidation = source.includes('validation:')

    const mutationNames = [...source.matchAll(/^\s{4}(\w+)\s*:\s*\(state/gm)].map(m => m[1])
    const actionNames   = hasActions
      ? [...source.matchAll(/^\s{4}(\w+)\s*:\s*\{/gm)].map(m => m[1]).filter(n => n !== 'meta' && n !== 'server' && n !== 'mutations' && n !== 'actions' && n !== 'state' && n !== 'validation' && n !== 'constraints')
      : []

    const specName = path.basename(file, '.js')
    const importPath = path.relative(path.dirname(testFile), file).replace(/\.js$/, '.js')

    const lines = []
    lines.push(`import { describe, it } from 'node:test'`)
    lines.push(`import assert from 'node:assert/strict'`)
    lines.push(`import { renderSync${hasServer ? ', render' : ''} } from '@invisibleloop/pulse/testing'`)
    lines.push(`import spec from './${importPath.replace(/^\.\//, '')}'`)
    lines.push(``)
    lines.push(`// ${relPath}`)
    lines.push(``)

    lines.push(`describe('${specName} — view', () => {`)
    lines.push(`  it('renders main landmark', () => {`)
    lines.push(`    const r = renderSync(spec${hasServer ? `, { server: {} }` : ''})`)
    lines.push(`    assert(r.has('main#main-content'), 'missing <main id="main-content">')`)
    lines.push(`  })`)
    lines.push(``)

    if (hasServer) {
      lines.push(`  it('handles null/empty server data without crashing', () => {`)
      lines.push(`    // Replace null with realistic empty values for each server fetcher`)
      lines.push(`    const r = renderSync(spec, { server: { /* TODO: add fetcher keys with null/[] values */ } })`)
      lines.push(`    assert(r.has('main'))`)
      lines.push(`  })`)
      lines.push(``)

      lines.push(`  it('handles empty array server data', () => {`)
      lines.push(`    // Verify empty-state rendering (empty() component or fallback message)`)
      lines.push(`    const r = renderSync(spec, { server: { /* TODO: fetchers with [] values */ } })`)
      lines.push(`    assert(r.has('main'))`)
      lines.push(`  })`)
      lines.push(``)
    }

    lines.push(`  it('does not render user input unescaped (XSS)', () => {`)
    lines.push(`    // Replace one user-controlled field with a script tag`)
    lines.push(`    const xss = '<script>alert(1)</script>'`)
    if (hasServer) {
      lines.push(`    const r = renderSync(spec, { server: { /* TODO: pass xss as a string field */ } })`)
    } else {
      lines.push(`    const r = renderSync(spec, { state: { /* TODO: pass xss as a string state field */ } })`)
    }
    lines.push(`    assert(!r.text().includes('<script>'), 'XSS string rendered unescaped')`)
    lines.push(`  })`)
    lines.push(``)

    if (hasOnViewError) {
      lines.push(`  it('onViewError returns fallback HTML when view throws', () => {`)
      lines.push(`    assert(typeof spec.onViewError, 'function')`)
      lines.push(`    const fallback = spec.onViewError(new Error('test'), spec.state ?? {}, {})`)
      lines.push(`    assert(typeof fallback === 'string' && fallback.length > 0, 'onViewError must return non-empty HTML string')`)
      lines.push(`  })`)
      lines.push(``)
    }

    lines.push(`})`)
    lines.push(``)

    if (hasMutations && mutationNames.length > 0) {
      lines.push(`describe('${specName} — mutations', () => {`)
      for (const name of mutationNames.slice(0, 6)) {
        lines.push(`  it('${name} returns partial state', () => {`)
        lines.push(`    assert(typeof spec.mutations.${name}, 'function')`)
        lines.push(`    // TODO: call spec.mutations.${name}(spec.state, mockEvent) and assert the returned shape`)
        lines.push(`    // e.g. const next = spec.mutations.${name}({ ...spec.state }, { target: { value: 'test' } })`)
        lines.push(`    //      assert.equal(typeof next, 'object')`)
        lines.push(`  })`)
        lines.push(``)
      }
      lines.push(`})`)
      lines.push(``)
    }

    if (hasActions && actionNames.length > 0) {
      lines.push(`describe('${specName} — actions', () => {`)
      for (const name of actionNames.slice(0, 4)) {
        lines.push(`  it('${name}.onStart returns loading state', () => {`)
        lines.push(`    if (!spec.actions?.${name}?.onStart) return`)
        lines.push(`    const next = spec.actions.${name}.onStart(spec.state ?? {}, new FormData())`)
        lines.push(`    assert(next.status === 'loading' || typeof next === 'object', 'onStart must return partial state')`)
        lines.push(`  })`)
        lines.push(``)
        lines.push(`  it('${name}.onError returns error state', () => {`)
        lines.push(`    if (!spec.actions?.${name}?.onError) return`)
        lines.push(`    const next = spec.actions.${name}.onError(spec.state ?? {}, new Error('test'))`)
        lines.push(`    assert(typeof next === 'object', 'onError must return partial state')`)
        lines.push(`  })`)
        lines.push(``)
      }
      lines.push(`})`)
      lines.push(``)
    }

    if (hasValidation) {
      lines.push(`describe('${specName} — validation', () => {`)
      lines.push(`  it('spec has validation rules', () => {`)
      lines.push(`    assert(typeof spec.validation === 'object' && spec.validation !== null)`)
      lines.push(`    assert(Object.keys(spec.validation).length > 0, 'validation object is empty')`)
      lines.push(`  })`)
      lines.push(`})`)
      lines.push(``)
    }

    const testContent = lines.join('\n')
    fs.writeFileSync(testFile, testContent, 'utf8')

    const summary = [
      `Generated ${path.relative(ROOT, testFile)}`,
      ``,
      `Stubs created:`,
      `  ✓ View landmark test`,
      hasServer   ? `  ✓ Null/empty server data tests` : null,
      `  ✓ XSS injection test`,
      hasOnViewError ? `  ✓ onViewError fallback test` : null,
      hasMutations && mutationNames.length > 0 ? `  ✓ Mutation tests (${mutationNames.slice(0, 6).join(', ')})` : null,
      hasActions   && actionNames.length > 0   ? `  ✓ Action onStart/onError tests (${actionNames.slice(0, 4).join(', ')})` : null,
      hasValidation ? `  ✓ Validation structure test` : null,
      ``,
      `Next: search for "TODO" in the file — each TODO needs a real assertion.`,
      `Run: pulse_run_tests`,
    ].filter(Boolean).join('\n')

    return text(summary)
  }
)

// ---------------------------------------------------------------------------
// pulse_fetch_page
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_fetch_page',
  {
    description: 'Fetch server-rendered HTML from the dev server. Use after creating or editing a page to verify SSR output, check for missing content, and spot errors.',
    inputSchema: { url: z.string().describe('Full URL, e.g. http://localhost:3000/about') },
  },
  ({ url }) => new Promise(resolve => {
    const req = http.get(url, { timeout: 10_000 }, res => {
      const chunks = []
      res.on('data', d => chunks.push(d))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8')
        const reminder = res.statusCode === 200 ? `\n\n---\n⚠ POST-BUILD CHECKLIST — run these before telling the user you're done:\n1. Take a screenshot with chrome-devtools\n2. If this was a NEW build (pulse_intake ran): show the screenshot to the user and ASK for design approval before continuing\n3. Once the user approves (or this is an edit/fix): pulse_design_review → pulse_layout_review → /verify\nDo NOT run Lighthouse before the user has approved the design.` : ''
        resolve(text(`HTTP ${res.statusCode}\n\n${body.slice(0, 8000)}${reminder}`))
      })
    })
    req.on('error', e => resolve(text(`Error fetching page: ${e.message}`)))
    req.on('timeout', () => { req.destroy(); resolve(text('Error: request timed out')) })
  })
)

// ---------------------------------------------------------------------------
// pulse_restart_server
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_restart_server',
  {
    description: 'Reload specs in the running dev server. Tries a fast hot-reload first (no process restart); falls back to full kill/restart only if the server is not running.',
    inputSchema: {},
  },
  async () => {
    let port = 3000
    const configPath = path.join(ROOT, 'pulse.config.js')
    if (fs.existsSync(configPath)) {
      try {
        const mod = await import(`${configPath}?t=${Date.now()}`)
        if (mod.default?.port) port = mod.default.port
      } catch { /* use default */ }
    }

    // Fast path — POST to the running dev server's hot-reload endpoint.
    // This reloads specs in-process and sends an SSE reload event to the browser
    // without killing the server process (~200 ms vs ~3 s for a full restart).
    const hotReloaded = await new Promise(resolve => {
      try {
        const req = http.request(
          { hostname: '127.0.0.1', port, path: '/_pulse/trigger-reload', method: 'POST', timeout: 2000 },
          res => resolve(res.statusCode === 204)
        )
        req.on('error', () => resolve(false))
        req.on('timeout', () => { req.destroy(); resolve(false) })
        req.end()
      } catch { resolve(false) }
    })

    if (hotReloaded) {
      return text(`Dev server specs reloaded (hot) on port ${port}`)
    }

    // Slow path — server not running or unresponsive, do a full kill/restart.
    // Only kill a process on this port if it's actually a Pulse server — see
    // killPulseServerOnPort's doc comment. If something else owns the port,
    // report that instead of starting a second server that will just fail
    // to bind (or, worse, silently kill someone else's unrelated process).
    const { killed, skipped } = killPulseServerOnPort(port)
    if (skipped.length > 0 && killed.length === 0) {
      return text(
        `Port ${port} is occupied by a process that is not a Pulse server — refusing to kill it:\n` +
        skipped.map(s => `  PID ${s.pid}: ${s.command}`).join('\n') +
        `\n\nFree the port yourself, or set a different port in pulse.config.js.`
      )
    }

    const devScript = new URL('../cli/dev.js', import.meta.url).pathname
    const proc = spawn(process.execPath, [devScript, '--root', ROOT], { detached: true, stdio: 'ignore' })
    proc.unref()

    const ready = await waitForServer(port)
    return text(ready
      ? `Dev server restarted on port ${port}`
      : `Dev server started on port ${port} (did not respond within 10 s — check for errors)`
    )
  }
)

// ---------------------------------------------------------------------------
// pulse_build
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_build',
  {
    description: 'Run a production build (pulse build) and start the production server on a separate port for Lighthouse testing. Returns the production URL. Call pulse_restart_server afterwards to return to the dev server.',
    inputSchema: {},
  },
  () => new Promise(resolve => {
    const buildScript = new URL('../../scripts/build.js', import.meta.url).pathname

    // Determine ports from config
    let devPort = 3000
    const configPath = path.join(ROOT, 'pulse.config.js')
    try {
      // Synchronous dynamic import not possible — read config file directly for port
      const src = fs.readFileSync(configPath, 'utf8')
      const m = src.match(/port\s*:\s*(\d+)/)
      if (m) devPort = parseInt(m[1], 10)
    } catch { /* use default */ }
    const prodPort = devPort + 1

    // Run build
    const build = spawnSync(process.execPath, [buildScript, '--root', ROOT], { encoding: 'utf8' })
    if (build.status !== 0) {
      return resolve(text(`Build failed:\n${build.stderr || build.stdout}`))
    }

    // Kill only a Pulse server on prodPort — see killPulseServerOnPort's doc
    // comment. Refuse (don't kill, don't start a second server on the same
    // port) if something else owns it.
    const { killed: prodKilled, skipped: prodSkipped } = killPulseServerOnPort(prodPort)
    if (prodSkipped.length > 0 && prodKilled.length === 0) {
      return resolve(text(
        `Build succeeded, but port ${prodPort} is occupied by a process that is not a Pulse server — refusing to kill it:\n` +
        prodSkipped.map(s => `  PID ${s.pid}: ${s.command}`).join('\n') +
        `\n\nFree the port yourself, or set a different port in pulse.config.js.`
      ))
    }

    // Start prod server detached on prodPort
    const startScript = new URL('../cli/start.js', import.meta.url).pathname
    const proc = spawn(process.execPath, [startScript, '--root', ROOT, '--port', String(prodPort)], { detached: true, stdio: 'ignore' })
    proc.unref()

    // Wait until the prod server is actually accepting requests
    waitForServer(prodPort, 15_000).then(ready => resolve(text(
      ready
        ? `Production build complete. Server running at http://localhost:${prodPort}/\nRun Lighthouse against this URL, then call pulse_restart_server to return to dev.`
        : `Build complete but prod server on port ${prodPort} did not respond within 15 s — check for startup errors.`
    )))
  })
)

// ---------------------------------------------------------------------------
// pulse_check_bundles — inspect what's actually inside the production bundles
// ---------------------------------------------------------------------------
// Lighthouse checks scores, not contents. A bundle can be small enough to pass
// every score and still contain something wrong: server-only code that leaked
// through the build's hydration-need check (found via real dogfooding — a
// page with no mutations/actions/persist got bundled anyway, and a bundle
// that imported a node:fs-based helper failed the build outright), or a
// boot file generated for a page that should ship zero client JS. This reads
// the real files in public/dist/ after pulse_build, not just the manifest.

server.registerTool(
  'pulse_check_bundles',
  {
    description: `Inspect the actual production bundle files in public/dist/ after pulse_build — not just their sizes, their contents. Checks for two things Lighthouse's score-based gate cannot catch:

1. A boot bundle exists for a page that doesn't need one (no mutations/actions/persist in its spec) — wasted output, and the exact shape of bug that can make a production build fail outright if that page also imports a server-only helper module.
2. A boot bundle contains a literal reference to a Node built-in (node:fs, node:crypto, etc.) — a sign server-only code leaked into a client bundle instead of being stripped.

Call this as part of the full /verify pass, after pulse_build, alongside Lighthouse — not part of /verify --quick, since it needs a production build to inspect.`,
    inputSchema: {},
  },
  () => text(formatBundleCheck(checkBundles(ROOT)))
)

// ---------------------------------------------------------------------------
// pulse_review
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_review',
  {
    description: `Switch into reviewer mode and critically examine a page spec you just built.
Reads the spec source, renders the view with initial state, runs all validation checks,
and returns a structured review brief. You must read everything carefully, find every
issue, and fix them all before reporting back to the user. Use this after completing
any feature build.

**Two modes:**
- Default (full review): runs after Lighthouse passes — the canonical final gate. Returns full checklist + rendered HTML + validator output.
- \`quick: true\`: lightweight mid-build check. Runs structural checks (main landmark, data-event on inputs, missing onError, hex in view, component patterns) without Lighthouse or the full checklist. Use after first draft, before the expensive verification pass. Not a substitute for the full review.`,
    inputSchema: {
      file:    z.string().optional().describe('Absolute path to the spec file to review'),
      content: z.string().optional().describe('JavaScript spec content to review (alternative to file)'),
      quick:   z.boolean().optional().describe('Run a lightweight mid-build check instead of the full review gate. Catches obvious structural issues without running Lighthouse. Use after first draft, before /verify.'),
    },
  },
  async ({ file, content, quick = false }) => {
    if (!file && !content) {
      return text('Error: must provide either file or content')
    }
    if (file && content) {
      return text('Error: provide only one of file or content, not both')
    }

    let source = content
    if (file) {
      if (!path.isAbsolute(file)) file = path.resolve(process.cwd(), file)
      if (!fs.existsSync(file)) return text(`File not found: ${file}`)
      source = fs.readFileSync(file, 'utf8')
    }

    if (quick) {
      const result = await runQuickReview(source, file)
      return text(formatQuickReview(result, { agentFacing: true }))
    }

    const result = await runFullReview(source, file)
    return text(formatFullReview(result, { source, file, agentFacing: true }))
  }
)

// ---------------------------------------------------------------------------
// pulse_stamp — write the .pulse-verified stamp
// ---------------------------------------------------------------------------
// Called as the final step of /verify, after all Lighthouse gates pass and
// pulse_review is complete. Using the MCP tool avoids the mtime race that can
// occur when `date +%s > .pulse-verified` runs in the same second as the last
// spec write, making the stamp appear older than the spec.
//
// The stop hook compares spec mtimeMs against stamp mtimeMs — not the content.
// Writing via MCP ensures the stamp is always written after all spec edits.

server.registerTool(
  'pulse_stamp',
  {
    description: `Write the .pulse-verified stamp to clear the stop-hook verification gate.

Call this as the **last step** of /verify — after Lighthouse desktop + mobile both pass 100/100/100, pulse_review is complete, and no further spec edits will be made.

Pass \`route\` and \`mode: "full"\` (full /verify, not --quick) and this refuses to stamp unless \`pulse save-report\` was actually run for that route in the last 10 minutes — a real Lighthouse run that passed the score bar but was never saved (a documented step this has been silently skipped for before, since prose alone didn't stop it) leaves nothing for \`pulse report-server\` or a companion dashboard to show. Omit \`mode\` (or pass "quick") to skip this check — quick mode never runs Lighthouse, so there is nothing to have saved.

When \`route\` is passed, also marks any unresolved error-journal entries for that route as resolved (a clean pass this far means whatever was flagged either wasn't real or was already fixed by an earlier /verify step) — this previously only happened via the separate pulse_resolve_error tool, despite this tool's own description having claimed it happened here.

The stop hook compares each changed spec's mtime against this stamp. Any spec newer than the stamp blocks the session. Do NOT call this before Lighthouse or before fixing issues found in pulse_review.`,
    inputSchema: {
      route: z.string().optional().describe('The route just verified, e.g. "/dashboard" — enables the saved-report check and error-journal auto-resolve. Omit only if truly not tied to one route.'),
      mode:  z.enum(['full', 'quick']).optional().describe('Which /verify mode this is. "full" enforces that a Lighthouse report was actually saved via pulse save-report in the last 10 minutes. Omit or "quick" skips that check.'),
    },
  },
  ({ route, mode } = {}) => text(formatStampResult(writeStamp(ROOT, { route, mode }), { agentFacing: true }))
)

// ---------------------------------------------------------------------------
// pulse_diagnose — read the dev-only error journal
// ---------------------------------------------------------------------------
// Errors that used to dead-end at console.error (server errors, SSR view
// throws, post-hydration client view/action failures) are captured to
// .pulse/errors.json by the dev server. This tool is the agent-facing read
// side of that journal — a mechanized diagnostic instead of relying on the
// agent to notice a console line or a user report.

server.registerTool(
  'pulse_diagnose',
  {
    description: `Read the dev-only error journal (.pulse/errors.json) — server errors, SSR view throws, and post-hydration client view/action failures that would otherwise only appear as a console.error line.

Call this when something seems broken and you're not sure why, or proactively after building/testing a page to check nothing threw during the session. Each entry has a route, a phase (view/action/server/guard), a message, a stack trace, and a resolved flag.

Pass \`route\` to filter to one page's errors — this is what /verify uses to check a specific page before stamping it. Omit it to see everything recorded this session.`,
    inputSchema: {
      route:           z.string().optional().describe('Filter to errors on this route only, e.g. "/dashboard". Omit to see all recorded errors.'),
      includeResolved: z.boolean().optional().describe('Include entries already marked resolved. Default false — only unresolved errors are shown.'),
    },
  },
  ({ route, includeResolved = false } = {}) => {
    const result = readJournal(ROOT, { route, includeResolved })
    let output = formatJournal(result, { route, includeResolved })
    if (result.exists && !result.error && result.entries.length > 0) {
      output += '\n---\nFix the underlying issue, then call `pulse_resolve_error` with the id (or route) to clear it from the unresolved list.'
    }
    return text(output)
  }
)

// ---------------------------------------------------------------------------
// pulse_resolve_error — mark journal entries resolved
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_resolve_error',
  {
    description: `Mark error journal entries as resolved after fixing the underlying issue. Pass a specific \`id\`, or \`route\` to resolve every unresolved entry for that page at once — /verify's stamp step calls this automatically for the target route on a clean pass, so you usually don't need to call it manually. Use it directly when you've fixed something pulse_diagnose surfaced but aren't running the full /verify loop right now.`,
    inputSchema: {
      id:    z.string().optional().describe('Resolve one entry by its id.'),
      route: z.string().optional().describe('Resolve every unresolved entry for this route.'),
    },
  },
  ({ id, route } = {}) => {
    return text(formatResolveResult(resolveEntries(ROOT, { id, route })))
  }
)

// ---------------------------------------------------------------------------
// pulse_await_approval
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_await_approval',
  {
    description: `Pause the workflow gates for one turn-end — call this immediately BEFORE ending a turn that legitimately waits on the user. That covers:

- **Blocking questions** — the design-approval gate ("Happy with the layout and direction…?"), or any decision only the user can make.
- **Mid-flow progress pauses** — reporting between long verification steps (e.g. between Lighthouse runs while verifying many pages) when the work is not yet stamped.

It writes a .pulse-awaiting-approval marker that tells the Stop hooks (missing tests, coverage, verify stamp) to let the turn end without demanding /verify first. The marker is deleted automatically when the user sends their next message — the gates return in full force for your following turn, so re-call it before each pause in a long multi-page flow.

**Always call this before an approval question, regardless of how you ask.** In some hosts (including Claude Code) even a dedicated question tool like AskUserQuestion ends the turn, which fires the Stop hooks. The marker is harmless if the turn does not end — it is simply consumed when the user replies.

Do NOT use this to skip verification — it buys exactly one turn-end, paired with something the user genuinely needs to see or answer. Calling it to dodge the gates just delays them by one message.`,
    inputSchema: {},
  },
  () => {
    const markerPath = path.join(ROOT, '.pulse-awaiting-approval')
    try {
      fs.writeFileSync(markerPath, String(Math.floor(Date.now() / 1000)), 'utf8')
      return text('✓ Awaiting-approval marker written. Ask the user your question and end your turn — the Stop hooks will allow it. The marker is cleared when the user replies.')
    } catch (err) {
      return text(`Error writing .pulse-awaiting-approval: ${err.message}\nFallback: run \`touch .pulse-awaiting-approval\` in Bash, then ask your question.`)
    }
  }
)

// ---------------------------------------------------------------------------
// pulse_run_tests
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_run_tests',
  {
    description: 'Run the project test suite (npm test). Returns the full output. Use after writing or editing specs to verify nothing is broken.',
    inputSchema: {},
  },
  () => new Promise(resolve => {
    const result = spawnSync('npm', ['test'], {
      cwd:      ROOT,
      encoding: 'utf8',
      timeout:  120_000,
    })

    const output   = (result.stdout || '') + (result.stderr || '')
    const exitCode = result.status ?? 1

    if (exitCode === 0) {
      // Surface just the per-suite summary lines — enough to confirm all passed
      const summaryLines = output.split('\n').filter(l => /\d+ tests?:/.test(l) || /passed|failed/.test(l))
      const summary = summaryLines.length ? summaryLines.join('\n') : output.slice(-2000)
      resolve(text(`All tests passed.\n\n${summary}`))
    } else {
      // Return the tail of the output where failures are reported
      resolve(text(`Tests failed (exit ${exitCode}):\n\n${output.slice(-4000)}`))
    }
  })
)

// ---------------------------------------------------------------------------
// pulse_check_version
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_check_version',
  {
    description: 'Check the installed @invisibleloop/pulse version, the static asset version in public/, and the latest version available on npm. Use this instead of running npm commands.',
    inputSchema: {},
  },
  () => new Promise(resolve => {
    const pkgJson      = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'))
    const installed    = pkgJson.version
    const stampPath    = path.join(ROOT, 'public', '.pulse-ui-version')
    const staticAsset  = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : 'unknown'
    const inSync       = installed === staticAsset

    // Fetch latest from npm registry
    const req = http.get('http://registry.npmjs.org/@invisibleloop/pulse/latest', { timeout: 5000 }, res => {
      const chunks = []
      res.on('data', d => chunks.push(d))
      res.on('end', () => {
        let latest = 'unknown'
        try { latest = JSON.parse(Buffer.concat(chunks).toString()).version } catch { /* ignore */ }

        const lines = [
          `Installed package : v${installed}`,
          `Static assets     : v${staticAsset}${inSync ? '' : ' ⚠ out of sync — run pulse_update'}`,
          `Latest on npm     : v${latest}`,
        ]
        if (latest !== 'unknown' && latest !== installed) {
          lines.push(`\nUpdate available: run \`npm update @invisibleloop/pulse\` then \`pulse_update\` to apply.`)
        } else if (latest === installed) {
          lines.push(`\nPackage is up to date.`)
        }
        resolve(text(lines.join('\n')))
      })
    })
    req.on('error', () => {
      resolve(text([
        `Installed package : v${installed}`,
        `Static assets     : v${staticAsset}${inSync ? '' : ' ⚠ out of sync — run pulse_update'}`,
        `Latest on npm     : (registry unreachable)`,
      ].join('\n')))
    })
    req.on('timeout', () => { req.destroy() })
  })
)

// ---------------------------------------------------------------------------
// pulse_intent — Intent Engine
// ---------------------------------------------------------------------------

const ARCHETYPES = {
  dashboard: {
    keywords:    ['dashboard', 'analytics', 'metrics', 'stats', 'overview', 'admin', 'monitor', 'report', 'kpi', 'insight', 'data'],
    components:  ['nav', 'stat', 'card', 'grid', 'barChart', 'lineChart', 'donutChart', 'table', 'badge', 'section', 'container', 'empty', 'spinner'],
    description: 'Data-rich admin or analytics page with metrics, charts, and tabular data',
    stateHint:   "{ period: 'week', loading: false }",
    serverHint:  "{ stats: async (ctx) => fetchStats(), rows: async (ctx) => fetchRows() }",
    scaffold: `import { nav, stat, card, grid, table, section, container, badge, empty, spinner } from '@invisibleloop/pulse/ui'
import { barChart } from '@invisibleloop/pulse/charts'

export default {
  route: '/dashboard',
  meta: {
    title:  'Dashboard',
    styles: ['/pulse-ui.css'],
  },
  server: {
    stats: async (ctx) => ({ total: 0, change: 0 }),
    rows:  async (ctx) => [],
  },
  state: { period: 'week' },
  mutations: {
    setPeriod: (state, e) => ({ period: e.target.value }),
  },
  view: (state, server) => \`
    <main id="main-content">
      \${nav({ logo: 'Dashboard', links: [] })}
      \${section({ content: container({ content: \`
        \${grid({ cols: 4, content:
          stat({ label: 'Total', value: String(server.stats.total), trend: 'up', change: server.stats.change + '%' })
        })}
        \${card({ title: 'Recent activity', content:
          server.rows.length
            ? table({ head: ['Name', 'Status'], rows: server.rows.map(r => [r.name, badge({ label: r.status })]) })
            : empty({ message: 'No activity yet' })
        })}
      \` }) })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/components', 'pulse://guide/spec', 'pulse://guide/server'],
  },

  landing: {
    keywords:    ['landing', 'marketing', 'homepage', 'product', 'saas', 'startup', 'website', 'launch', 'hero', 'promotional'],
    components:  ['nav', 'hero', 'feature', 'stat', 'cta', 'footer', 'grid', 'section', 'container', 'button', 'appBadge'],
    description: 'Marketing or product landing page with hero, features, and calls to action',
    stateHint:   'null — purely server-rendered, no client state needed',
    serverHint:  'none — all content is static in the view',
    scaffold: `import { nav, hero, feature, stat, cta, footer, grid, section, container, button, iconZap, iconShield, iconCheck } from '@invisibleloop/pulse/ui'

export default {
  route: '/',
  meta: {
    title:       'Product — Tagline',
    description: 'One clear sentence describing the product.',
    styles:      ['/pulse-ui.css'],
  },
  view: () => \`
    <main id="main-content">
      \${nav({ logo: 'Product', links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing',  href: '#pricing'  },
      ], actions: button({ label: 'Get started', size: 'sm' }) })}
      \${hero({ title: 'Your headline here', subtitle: 'Supporting copy that explains the value.',
        actions: button({ label: 'Get started', size: 'lg' }) })}
      \${section({ id: 'features', content: container({ content: \`
        \${grid({ cols: 3, content:
          feature({ icon: iconZap(), title: 'Fast', body: 'Describe the benefit.' }) +
          feature({ icon: iconShield(), title: 'Secure', body: 'Describe the benefit.' }) +
          feature({ icon: iconCheck(), title: 'Reliable', body: 'Describe the benefit.' })
        })}
      \` }) })}
      \${cta({ title: 'Ready to start?', body: 'Sign up in seconds.', actions: button({ label: 'Get started' }) })}
      \${footer({ logo: 'Product', links: [] })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/components', 'pulse://guide/templates'],
  },

  crud: {
    keywords:    ['list', 'crud', 'table', 'records', 'manage', 'items', 'inventory', 'data', 'collection', 'browse', 'search'],
    components:  ['nav', 'table', 'button', 'modal', 'input', 'select', 'pagination', 'alert', 'empty', 'badge', 'search', 'spinner'],
    description: 'Browsable list of records with search, filter, and row actions',
    stateHint:   "{ query: '', page: 1, status: 'idle' }",
    serverHint:  "{ items: async (ctx) => fetchItems(ctx.query), total: async (ctx) => countItems() }",
    scaffold: `import { nav, table, button, input, alert, empty, badge, section, container, spinner } from '@invisibleloop/pulse/ui'

export default {
  route: '/items',
  meta: {
    title:  'Items',
    styles: ['/pulse-ui.css'],
  },
  server: {
    items: async (ctx) => [],
    total: async (ctx) => 0,
  },
  state: { query: '', status: 'idle', deleteId: null },
  mutations: {
    setQuery: (state, e) => ({ query: e.target.value }),
  },
  actions: {
    deleteItem: {
      onStart:   (state, formData) => ({ status: 'loading', deleteId: formData.get('id') }),
      run:       async (state, serverState, formData) => {
                   const res = await fetch(\`/api/items/\${formData.get('id')}\`, { method: 'DELETE' })
                   if (!res.ok) { let m = \`Error: \${res.status}\`; try { const j = await res.json(); m = j.message || m } catch {} throw new Error(m) }
                 },
      onSuccess: (state) => ({ status: 'success', deleteId: null, _toast: { message: 'Deleted', variant: 'success' } }),
      onError:   (state, err) => ({ status: 'error', deleteId: null, _toast: { message: err.message, variant: 'error' } }),
    },
  },
  view: (state, server) => \`
    <main id="main-content">
      \${nav({ logo: 'Items', links: [] })}
      \${section({ content: container({ content: \`
        <div class="u-flex u-gap-3 u-mb-4">
          \${input({ label: 'Search', name: 'query', placeholder: 'Search…', value: state.query })}
        </div>
        \${server.items.length
          ? table({ head: ['Name', 'Status', ''], rows: server.items.map(item => [
              item.name,
              badge({ label: item.status }),
              \`<form data-action="deleteItem">\${button({ label: 'Delete', variant: 'danger', size: 'sm', type: 'submit' })}<input type="hidden" name="id" value="\${item.id}"></form>\`
            ])})
          : empty({ message: 'No items found' })
        }
      \` }) })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/spec', 'pulse://guide/components'],
  },

  form: {
    keywords:    ['form', 'submit', 'contact', 'register', 'signup', 'onboarding', 'wizard', 'checkout', 'enquiry', 'apply'],
    components:  ['card', 'input', 'select', 'textarea', 'checkbox', 'radio', 'button', 'alert', 'fieldset', 'stepper', 'section', 'container'],
    description: 'Form page with validation, submission, and success/error states',
    stateHint:   "{ status: 'idle', errors: [] }",
    serverHint:  'none — forms are typically client-only with a server action endpoint',
    scaffold: `import { card, input, textarea, button, alert, section, container, heading } from '@invisibleloop/pulse/ui'

export default {
  route: '/contact',
  meta: {
    title:  'Contact',
    styles: ['/pulse-ui.css'],
  },
  state: { status: 'idle', errors: [] },
  validation: {
    'fields.email': { required: true, format: 'email' },
    'fields.name':  { required: true, minLength: 2 },
  },
  actions: {
    submit: {
      onStart:   (state, formData) => ({ status: 'loading', errors: [], fields: { name: formData.get('name'), email: formData.get('email') } }),
      validate:  true,
      run:       async (state, serverState, formData) => {
                   const res = await fetch('/api/contact', { method: 'POST', body: formData })
                   if (!res.ok) { let m = \`Error: \${res.status}\`; try { const j = await res.json(); m = j.message || m } catch {} throw new Error(m) }
                   return await res.json()
                 },
      onSuccess: (state) => ({ status: 'success', _toast: { message: 'Message sent!', variant: 'success' } }),
      onError:   (state, err) => ({ status: 'error', errors: err?.validation ?? [{ message: err.message }], _toast: { message: 'Please check the form', variant: 'error' } }),
    },
  },
  view: (state) => \`
    <main id="main-content">
      \${section({ content: container({ size: 'sm', content:
        state.status === 'success'
          ? \`<p class="u-text-center u-py-8">Thanks! We'll be in touch.</p>\`
          : card({ title: 'Get in touch', content: \`
              \${state.errors.length ? alert({ variant: 'error', message: state.errors.map(e => e.message).join(', ') }) : ''}
              <form data-action="submit" novalidate>
                \${input({ label: 'Your name', name: 'name', required: true, error: state.errors.find(e => e.field === 'name')?.message })}
                \${input({ label: 'Email', name: 'email', type: 'email', required: true, error: state.errors.find(e => e.field === 'email')?.message })}
                \${textarea({ label: 'Message', name: 'message' })}
                \${button({ label: state.status === 'loading' ? 'Sending\u2026' : 'Send message', type: 'submit', attrs: state.status === 'loading' ? { 'aria-busy': 'true', disabled: '' } : {} })}
              </form>
            \` })
      }) })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/spec', 'pulse://guide/components'],
  },

  settings: {
    keywords:    ['settings', 'preferences', 'profile', 'account', 'configuration', 'options', 'edit profile', 'personal details'],
    components:  ['nav', 'card', 'input', 'select', 'switch', 'button', 'alert', 'avatar', 'section', 'container', 'fieldset'],
    description: 'Settings or preferences page with multiple form sections and save actions',
    stateHint:   "{ status: 'idle', saved: false }",
    serverHint:  "{ user: async (ctx) => getUser(ctx), settings: async (ctx) => getSettings(ctx) }",
    scaffold: `import { nav, card, input, select, button, alert, section, container, avatar } from '@invisibleloop/pulse/ui'

export default {
  route: '/settings',
  meta: {
    title:  'Settings',
    styles: ['/pulse-ui.css'],
  },
  server: {
    user: async (ctx) => null,
  },
  state: { status: 'idle' },
  actions: {
    save: {
      onStart:   (state) => ({ status: 'loading' }),
      run:       async (state, serverState, formData) => {
                   const res = await fetch('/api/settings', { method: 'POST', body: formData })
                   if (!res.ok) { let m = \`Error: \${res.status}\`; try { const j = await res.json(); m = j.message || m } catch {} throw new Error(m) }
                   return await res.json()
                 },
      onSuccess: (state) => ({ status: 'success', _toast: { message: 'Settings saved', variant: 'success' } }),
      onError:   (state, err) => ({ status: 'error', _toast: { message: err.message, variant: 'error' } }),
    },
  },
  view: (state, server) => \`
    <main id="main-content">
      \${nav({ logo: 'App', links: [] })}
      \${section({ content: container({ size: 'sm', content: \`
        <form data-action="save">
          \${card({ title: 'Profile', content: \`
            \${input({ label: 'Display name', name: 'name', value: server.user?.name ?? '' })}
            \${input({ label: 'Email', name: 'email', type: 'email', value: server.user?.email ?? '' })}
          \` })}
          <div class="u-mt-4 u-flex u-justify-end">
            \${button({ label: state.status === 'loading' ? 'Saving\u2026' : 'Save changes', type: 'submit', attrs: state.status === 'loading' ? { 'aria-busy': 'true', disabled: '' } : {} })}
          </div>
        </form>
      \` }) })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/server', 'pulse://guide/spec', 'pulse://guide/components'],
  },

  blog: {
    keywords:    ['blog', 'article', 'post', 'content', 'editorial', 'news', 'publication', 'markdown', 'text', 'read', 'writing'],
    components:  ['nav', 'hero', 'prose', 'section', 'container', 'footer', 'badge'],
    description: 'Content page rendering markdown or rich text from a file or CMS',
    stateHint:   'null — purely server-rendered, no client state needed',
    serverHint:  "{ post: md('content/blog/:slug.md') } — use @invisibleloop/pulse/md",
    scaffold: `import { nav, hero, prose, section, container, footer } from '@invisibleloop/pulse/ui'
import { md } from '@invisibleloop/pulse/md'

const post = md('content/blog/:slug.md')

export default {
  route: '/blog/:slug',
  meta: {
    title:       async (ctx) => (await post(ctx)).frontmatter.title,
    description: async (ctx) => (await post(ctx)).frontmatter.description,
    styles:      ['/pulse-ui.css'],
  },
  server: { post },
  view: (state, server) => \`
    <main id="main-content">
      \${nav({ logo: 'Blog', links: [{ label: 'Home', href: '/' }] })}
      \${hero({ size: 'sm', title: server.post.frontmatter.title, subtitle: server.post.frontmatter.description })}
      \${section({ content: container({ size: 'sm', content: prose({ content: server.post.html }) }) })}
      \${footer({ logo: 'Blog', links: [] })}
    </main>
  \`,
  onViewError: (err) => \`<main id="main-content"><p class="u-p-4">Post not found.</p></main>\`,
}`,
    guides: ['pulse://guide/spec', 'pulse://guide/components'],
  },

  auth: {
    keywords:    ['login', 'signin', 'sign in', 'signup', 'sign up', 'register', 'auth', 'password', 'forgot', 'reset', 'verify', 'otp'],
    components:  ['card', 'input', 'button', 'alert', 'section', 'container', 'heading'],
    description: 'Authentication flow — login, signup, or password reset',
    stateHint:   "{ status: 'idle', errors: [] }",
    serverHint:  'none for login; guard for protected pages',
    scaffold: `import { card, input, button, alert, section, container } from '@invisibleloop/pulse/ui'

export default {
  route: '/login',
  meta: {
    title:  'Sign in',
    styles: ['/pulse-ui.css'],
  },
  state: { status: 'idle', errors: [] },
  validation: {
    'fields.email':    { required: true, format: 'email' },
    'fields.password': { required: true, minLength: 8 },
  },
  actions: {
    login: {
      onStart:   (state) => ({ status: 'loading', errors: [] }),
      validate:  true,
      run:       async (state, serverState, formData) => {
                   const res = await fetch('/api/auth/login', { method: 'POST', body: formData })
                   if (!res.ok) { let m = \`Error: \${res.status}\`; try { const j = await res.json(); m = j.message || m } catch {} throw new Error(m) }
                   return await res.json()
                 },
      onSuccess: (state) => ({ status: 'success', _redirect: '/dashboard' }),
      onError:   (state, err) => ({ status: 'error', errors: err?.validation ?? [{ message: err.message }] }),
    },
  },
  view: (state) => \`
    <main id="main-content">
      \${section({ content: container({ size: 'xs', content:
        card({ title: 'Sign in', content: \`
          \${state.errors.length ? alert({ variant: 'error', message: state.errors.map(e => e.message).join(', ') }) : ''}
          <form data-action="login" novalidate>
            \${input({ label: 'Email', name: 'email', type: 'email', required: true })}
            \${input({ label: 'Password', name: 'password', type: 'password', required: true })}
            \${button({ label: state.status === 'loading' ? 'Signing in\u2026' : 'Sign in', type: 'submit', fullWidth: true, attrs: state.status === 'loading' ? { 'aria-busy': 'true', disabled: '' } : {} })}
          </form>
          <p class="u-text-sm u-text-center u-mt-3"><a href="/forgot">Forgot password?</a></p>
        \` })
      }) })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/spec', 'pulse://guide/server', 'pulse://guide/components'],
  },

  profile: {
    keywords:    ['profile', 'user page', 'bio', 'portfolio', 'about', 'member', 'author', 'personal page', 'public profile'],
    components:  ['nav', 'avatar', 'card', 'stat', 'badge', 'grid', 'section', 'container', 'button', 'prose'],
    description: 'User or entity profile page with metadata and activity',
    stateHint:   'null — purely server-rendered',
    serverHint:  "{ user: async (ctx) => getUser(ctx.params.id), activity: async (ctx) => getActivity(ctx.params.id) }",
    scaffold: `import { nav, avatar, card, stat, badge, grid, section, container } from '@invisibleloop/pulse/ui'

export default {
  route: '/users/:id',
  meta: {
    title:  async (ctx) => \`User \${ctx.params.id}\`,
    styles: ['/pulse-ui.css'],
  },
  server: {
    user:     async (ctx) => null,
    activity: async (ctx) => [],
  },
  view: (state, server) => \`
    <main id="main-content">
      \${nav({ logo: 'App', links: [] })}
      \${section({ content: container({ content: \`
        \${card({ content: \`
          <div class="u-flex u-gap-4 u-items-center">
            \${avatar({ name: server.user?.name ?? 'Unknown', size: 'lg' })}
            <div>
              <h1 class="u-text-2xl u-font-bold">\${server.user?.name ?? 'Unknown'}</h1>
              <p class="u-text-muted">\${server.user?.bio ?? ''}</p>
            </div>
          </div>
        \` })}
        \${grid({ cols: 3, content:
          stat({ label: 'Posts',     value: String(server.user?.posts     ?? 0) }) +
          stat({ label: 'Followers', value: String(server.user?.followers ?? 0) }) +
          stat({ label: 'Following', value: String(server.user?.following ?? 0) })
        })}
      \` }) })}
    </main>
  \`,
  onViewError: () => \`<main id="main-content"><p class="u-p-4">User not found.</p></main>\`,
}`,
    guides: ['pulse://guide/components', 'pulse://guide/spec', 'pulse://guide/server'],
  },

  pricing: {
    keywords:    ['pricing', 'plans', 'subscription', 'tiers', 'billing', 'upgrade', 'compare', 'packages'],
    components:  ['nav', 'card', 'grid', 'feature', 'cta', 'accordion', 'footer', 'section', 'button', 'badge'],
    description: 'Pricing page with plan comparison, feature lists, and upgrade CTA',
    stateHint:   "{ billing: 'monthly' } — for toggle between monthly/annual",
    serverHint:  'none — content is typically static',
    scaffold: `import { nav, card, grid, cta, accordion, footer, section, container, button, badge, iconCheck } from '@invisibleloop/pulse/ui'

const plan = (p) => card({
  variant: p.featured ? 'elevated' : 'bordered',
  content: \`
    \${p.featured ? badge({ label: 'Most popular' }) : ''}
    <h3 class="u-text-xl u-font-bold u-mt-2">\${p.name}</h3>
    <p class="u-text-3xl u-font-bold u-mt-2">\${p.price}<span class="u-text-sm u-text-muted">\${p.period}</span></p>
    <ul class="u-mt-4 u-flex u-flex-col u-gap-2">
      \${p.features.map(f => \`<li class="u-flex u-gap-2 u-items-center">\${iconCheck({ size: 16 })} \${f}</li>\`).join('')}
    </ul>
  \`,
  footer: p.cta,
})

export default {
  route: '/pricing',
  meta: {
    title:  'Pricing',
    styles: ['/pulse-ui.css'],
  },
  state: { billing: 'monthly' },
  mutations: {
    setBilling: (state, e) => ({ billing: e.target.value }),
  },
  view: (state) => \`
    <main id="main-content">
      \${nav({ logo: 'App', links: [] })}
      \${section({ content: container({ content: \`
        <h1 class="u-text-4xl u-font-bold u-text-center u-mb-2">Simple pricing</h1>
        <p class="u-text-center u-text-muted u-mb-8">No hidden fees. Cancel any time.</p>
        \${grid({ cols: 3, content: [
          { name: 'Free',  price: '\$0',  period: '/forever', features: ['Feature A', 'Feature B'], cta: button({ label: 'Get started', variant: 'secondary' }) },
          { name: 'Pro',   price: '\$12', period: '/month',  features: ['Everything in Free', 'Feature C', 'Feature D'], featured: true, cta: button({ label: 'Start free trial' }) },
          { name: 'Team',  price: '\$49', period: '/month',  features: ['Everything in Pro', 'Feature E', 'Unlimited seats'], cta: button({ label: 'Contact sales', variant: 'secondary' }) },
        ].map(plan).join('') })}
        \${accordion({ items: [
          { title: 'Can I cancel any time?', content: 'Yes — no lock-in, cancel from your account settings.' },
          { title: 'What payment methods do you accept?', content: 'Visa, Mastercard, Amex, and PayPal.' },
        ]})}
      \` }) })}
      \${cta({ title: 'Still have questions?', body: 'Talk to the team.', actions: button({ label: 'Contact us', variant: 'secondary' }) })}
      \${footer({ logo: 'App', links: [] })}
    </main>
  \`,
}`,
    guides: ['pulse://guide/components', 'pulse://guide/templates'],
  },
}

server.registerTool(
  'pulse_intent',
  {
    description: `Intent engine — describe what you want to build and get back a matched archetype, recommended components, a ready-to-adapt spec scaffold, and which guide sections to read first.

Use this at the start of any build task instead of (or before) fetching pulse://workflow. It short-circuits the "what components should I use?" and "what does the state shape look like?" questions by detecting your intent and giving you a tailored starting point.

Examples:
  "a dark analytics dashboard with live stats and a data table"
  "a contact form with email validation and a success screen"
  "a pricing page for a SaaS product with three tiers"
  "a blog post page using markdown with a newsletter signup"`,
    inputSchema: {
      description: z.string().describe('Plain-language description of the page or feature you want to build'),
    },
  },
  ({ description }) => {
    const desc = description.toLowerCase()

    // Score each archetype by how many keywords appear in the description
    const scored = Object.entries(ARCHETYPES).map(([key, arch]) => {
      const matches = arch.keywords.filter(kw => desc.includes(kw))
      return { key, arch, score: matches.length, matches }
    }).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      // No archetype matched — return generic starting advice
      return text(`No archetype match found for: "${description}"

Try describing what the page *does* rather than how it looks. Examples:
  "a list of users I can search and delete"
  "a login form with email and password"
  "a dashboard with charts and a recent activity table"
  "a landing page for a mobile app"

If your page genuinely doesn't fit a pattern, start from pulse://guide/spec and build from scratch.`)
    }

    const best = scored[0]
    const { key, arch, matches } = best

    // Build the response
    const lines = []

    lines.push(`## Detected intent: ${key}`)
    lines.push(``)
    lines.push(`${arch.description}`)
    lines.push(`Matched on: ${matches.join(', ')}`)

    if (scored.length > 1) {
      const alts = scored.slice(1, 3).map(s => `${s.key} (${s.matches.join(', ')})`).join(' · ')
      lines.push(`Alternative archetypes: ${alts}`)
    }

    lines.push(``)
    lines.push(`## Recommended components`)
    lines.push(``)
    lines.push(`\`\`\`js`)
    lines.push(`import { ${arch.components.join(', ')} } from '@invisibleloop/pulse/ui'`)
    lines.push(`\`\`\``)

    lines.push(``)
    lines.push(`## State & server hints`)
    lines.push(``)
    lines.push(`State:  ${arch.stateHint}`)
    lines.push(`Server: ${arch.serverHint}`)

    lines.push(``)
    lines.push(`## ⚠ Before writing any code — ask these two questions`)
    lines.push(``)
    lines.push(`1. **Light or dark?** Pulse renders **dark** by default when \`meta.theme\` is unset. If the user hasn't stated a preference, ask now — discovering the wrong theme at the screenshot costs a full edit → restart → re-approval cycle.`)
    lines.push(`   Add \`theme: 'light'\` to your plan or brief if confirmed light.`)
    lines.push(``)
    if (key === 'dashboard') {
      lines.push(`2. **Design inspiration — reframed for a functional/internal tool.** The standard aesthetic-inspiration question ("a site you love") lands oddly for a work screen or admin tool — most people building one have no mood board, and asking anyway invites either an awkward non-answer or, worse, an agent skipping the question rather than reinterpreting it on the fly. Ask instead: "Do you have any reference for how this should look, or should I go with a clean, functional dark-mode style typical of internal tools? Also — what's the most important thing to see at a glance, and roughly how many items/rows will be on screen at once?" This still surfaces genuine visual references if the user has one (some do), while asking what actually matters for a dashboard: information density and priority, not mood.`)
      lines.push(`   If the user does name a real visual reference (a URL, an image, or a well-known site), call \`pulse_extract_inspiration\` as normal. A bare mention with nothing to point to ("no, we just use a whiteboard") is not skippable — the question itself is still mandatory — it just isn't inspiration to extract; fold the answer into \`pulse_intake\`'s vibe/anti-style fields and move on.`)
    } else {
      lines.push(`2. **Design inspiration?** Ask: "Do you have any design inspiration — a site you love, a screenshot, or a mood board image? Drop it into \`public/intake/\` or paste a URL." If yes, call \`pulse_extract_inspiration\` before proceeding.`)
    }
    lines.push(`   (Skip if this came from pulse_intake — it already asked.)`)

    lines.push(``)
    lines.push(`## Guide sections to read`)
    lines.push(``)
    for (const g of arch.guides) {
      lines.push(`  ${g}`)
    }

    lines.push(``)
    lines.push(`## Starter spec scaffold`)
    lines.push(``)
    lines.push(`Adapt this — it is a complete but minimal working page. Replace placeholder content, add your real data fetchers, and adjust state as needed.`)
    lines.push(``)
    lines.push(`\`\`\`js`)
    lines.push(arch.scaffold)
    lines.push(`\`\`\``)

    lines.push(``)
    lines.push(`## Next steps`)
    lines.push(``)
    lines.push(`1. Fetch \`pulse://workflow\` to understand the build phases`)
    for (const g of arch.guides) {
      lines.push(`2. Fetch \`${g}\` for the full component and spec reference`)
    }
    lines.push(`3. Call \`pulse_list_structure\` to see what already exists`)
    lines.push(`4. Adapt the scaffold above and write it to \`src/pages/your-name.js\``)
    lines.push(`5. Call \`pulse_suggest\` on your draft at any point for early feedback`)

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_layout_review — Multi-viewport layout check
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_layout_review',
  {
    description: `Run a multi-viewport layout review on the current page. Returns a structured set of browser steps to execute using chrome-devtools tools.

Use this AFTER design approval (user has seen the screenshot and signed off on the layout) but BEFORE Lighthouse. It catches layout issues (overflow, collapsed sections, broken images) that Lighthouse doesn't check and that are invisible at a single viewport width.

Call this as part of the Phase 5b verification flow (after design approval):
  design approval → pulse_design_review → pulse_layout_review → Lighthouse`,
    inputSchema: {
      url: z.string().describe('The full URL to check, e.g. http://localhost:3001/about'),
    },
  },
  async ({ url }) => {
    const steps = `
## pulse_layout_review — run these steps in sequence

**URL:** ${url}

Execute the following in order using chrome-devtools tools:

### 1. Mobile (390 × 844)
\`\`\`
chrome-devtools-resize_page: { width: 390, height: 844 }
chrome-devtools-navigate_page: { type: "url", url: "${url}" }
chrome-devtools-take_screenshot
\`\`\`
Then run this scan:
\`\`\`js
chrome-devtools-evaluate_script: () => {
  const issues = []
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
    issues.push('OVERFLOW: page has horizontal overflow at 390px — some element is wider than the viewport')
  }
  document.querySelectorAll('img').forEach((img, i) => {
    if (img.complete && img.naturalWidth === 0) {
      issues.push('BROKEN IMAGE: img[' + i + '] src="' + img.src + '" failed to load (naturalWidth === 0)')
    }
  })
  document.querySelectorAll('section, main, header, footer, [class*="hero"], [class*="feature"], [class*="grid"]').forEach(el => {
    if (el.offsetHeight === 0) {
      issues.push('COLLAPSED: <' + el.tagName.toLowerCase() + (el.className ? ' class="' + el.className + '"' : '') + '> has zero height — check visibility, display, or missing content')
    }
  })
  return issues.length ? issues : ['No layout issues found at 390px']
}
\`\`\`

### 2. Tablet (768 × 1024)
\`\`\`
chrome-devtools-resize_page: { width: 768, height: 1024 }
chrome-devtools-navigate_page: { type: "url", url: "${url}" }
chrome-devtools-take_screenshot
\`\`\`
Run the same JS scan. Report any issues found.

### 3. Desktop (1280 × 800)
\`\`\`
chrome-devtools-resize_page: { width: 1280, height: 800 }
chrome-devtools-navigate_page: { type: "url", url: "${url}" }
chrome-devtools-take_screenshot
\`\`\`
Run the same JS scan. Report any issues found.

### 4. Restore desktop size
\`\`\`
chrome-devtools-resize_page: { width: 1280, height: 800 }
\`\`\`

### 5. Report

Fill in this table before proceeding to Lighthouse:

| Viewport | Overflow | Broken images | Collapsed sections | Screenshot |
|---|---|---|---|---|
| 390px mobile | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | [describe] |
| 768px tablet | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | [describe] |
| 1280px desktop | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | [describe] |

**If any cell is ❌**, fix the issue and re-run pulse_layout_review before proceeding to Lighthouse.
`.trim()

    return text(steps)
  }
)

// ---------------------------------------------------------------------------
// pulse_design_review — Visual design review against the original brief
// ---------------------------------------------------------------------------


server.registerTool(
  'pulse_design_review',
  {
    description: `Review the built page's visual design against the original product brief from pulse_intake.

Use this AFTER taking a screenshot but BEFORE the code review gate. It checks whether the design looks and feels appropriate for the stated product, audience, and vibe — catching mismatches like "builders merchant site that looks like a magazine" or "children's app that feels corporate".

Returns a structured design critique the agent must address.`,
    inputSchema: {
      route:       z.string().optional().describe('Route to screenshot, e.g. "/" or "/about". Defaults to "/".'),
      screenshot:  z.string().optional().describe('Description of what you observed in the screenshot (optional — helps focus the review).'),
    },
  },
  ({ route = '/', screenshot }) => {
    const briefFile = path.join(ROOT, '.pulse', 'brief.json')
    const hasBrief  = fs.existsSync(briefFile)
    const brief     = hasBrief ? JSON.parse(fs.readFileSync(briefFile, 'utf8')) : null

    const lines = []
    lines.push('# Design review — brief vs reality\n')

    if (!brief) {
      lines.push('> **No brief found** — `.pulse/brief.json` does not exist. Either `pulse_intake` was not run for this project, or the brief was not saved.')
      lines.push('> You can still do a qualitative design review — describe the product type and target user to assess below.\n')
    } else {
      lines.push('## The original brief\n')
      lines.push(`| Field | Value |`)
      lines.push(`|---|---|`)
      lines.push(`| Product | **${brief.name}** — ${brief.pitch} |`)
      if (brief.targetUser) lines.push(`| Target user | ${brief.targetUser} |`)
      if (brief.vibe)       lines.push(`| Vibe | ${brief.vibe} |`)
      if (brief.theme)      lines.push(`| Theme | ${brief.theme} |`)
      if (brief.antiStyle)  lines.push(`| Anti-style | ${brief.antiStyle} |`)
      if (brief.styleNotes) lines.push(`| Style notes | ${brief.styleNotes} |`)
      if (brief.features?.length) lines.push(`| Features | ${brief.features.join(', ')} |`)
      lines.push('')
    }

    if (screenshot) {
      lines.push('## Your screenshot observation\n')
      lines.push(`> ${screenshot}\n`)
    }

    lines.push('## Your task\n')
    lines.push('You are now a **design reviewer with no knowledge of the code**. Look only at the screenshot.')
    lines.push('Work through each signal below. Give an honest verdict for each — do not skip any.\n')

    // Build product-type signals from brief if available
    const productType = brief ? `${brief.name} (${brief.pitch})` : 'this product'
    const audience    = brief?.targetUser ?? 'the stated target user'
    const vibe        = brief?.vibe ?? null
    const antiStyle   = brief?.antiStyle ?? null

    lines.push('### 1. First impression — audience fit')
    lines.push(`Show the screenshot to someone unfamiliar with the brief. Would they immediately guess this is **${productType}** aimed at **${audience}**?`)
    lines.push('- What three words does this design communicate at a glance?')
    lines.push(`- Do those words match what **${audience}** would expect and trust?\n`)

    lines.push('### 2. Typography feel')
    lines.push('- **Serif vs sans**: Serifs read as editorial, literary, premium. Sans reads as functional, modern, utilitarian.')
    lines.push('- **Weight**: Heavy/condensed headings = bold, urgent, industrial. Light/spaced = refined, editorial.')
    lines.push('- **Scale**: Oversized display type = magazine/editorial. Modest headings with dense body = catalogue/functional.')
    if (vibe)      lines.push(`- Expected for **${vibe}** vibe: ${vibeTypographyHint(vibe)}`)
    if (antiStyle) lines.push(`- Anti-style check: does it resemble "${antiStyle}"? If so, flag it.\n`)
    else           lines.push('')

    lines.push('### 3. Colour mood')
    lines.push('- **Warm neutrals + organic accent** = hospitality, artisan, food')
    lines.push('- **Industrial palette** (grey, orange, yellow, black) = trades, construction, hardware')
    lines.push('- **Navy/white/gold** = professional services, finance, prestige')
    lines.push('- **Bright primaries** = consumer, retail, energy')
    lines.push('- **Dark bg + neon accent** = tech, dev tools, gaming')
    lines.push(`- Does the palette match what **${audience}** would associate with this category?\n`)

    lines.push('### 4. Layout density and hierarchy')
    lines.push('- **Sparse, generous whitespace, large imagery** → magazine, editorial, luxury')
    lines.push('- **Dense, product grid, clear categories** → e-commerce, catalogue, trades')
    lines.push('- **Dashboard grid, data-forward** → SaaS, B2B, professional tools')
    lines.push('- **Single focus per section, story-driven scroll** → startup landing, consumer app')
    lines.push(`- Which pattern does this layout use? Is that right for **${productType}**?\n`)

    lines.push('### 5. Imagery and visual language')
    lines.push('- **Lifestyle/aspirational photography** → consumer, food, travel, luxury')
    lines.push('- **Product/catalogue photos** → e-commerce, hardware, trades')
    lines.push('- **Abstract/geometric** → tech, SaaS, fintech')
    lines.push('- **Illustration** → consumer apps, education, healthcare')
    lines.push('- **No imagery, type-only** → brutalist, editorial, developer tools')
    lines.push(`- Does the visual language feel appropriate for **${audience}**?\n`)

    lines.push('### 6. CTA and copy tone')
    lines.push('- **"Get a quote", "Order now", "Find a branch"** → trades, construction, B2B')
    lines.push('- **"Get started", "Try free", "Sign up"** → SaaS, consumer app')
    lines.push('- **"Explore", "Discover", "See the collection"** → editorial, luxury, fashion')
    lines.push('- **"Book", "Reserve", "Check availability"** → hospitality, events, services')
    lines.push(`- Do the CTAs sound like something **${audience}** would respond to?\n`)

    lines.push('### 7. Trust signals for this audience')
    lines.push(`What would make **${audience}** trust this site immediately? Check if those elements are present and prominent:`)
    if (audience.match(/trade|builder|contractor|professional|B2B/i)) {
      lines.push('- Trade account / account login visible?')
      lines.push('- Product categories or catalogue entry point prominent?')
      lines.push('- Delivery/collection info surfaced early?')
      lines.push('- No unnecessary lifestyle imagery pushing catalogue below fold?')
    } else if (audience.match(/consumer|shopper|customer|general/i)) {
      lines.push('- Social proof (reviews, ratings, testimonials) visible?')
      lines.push('- Clear pricing or "from £X" signals?')
      lines.push('- Easy navigation to product categories?')
    } else {
      lines.push('- Are the primary conversion actions immediately visible?')
      lines.push('- Does the above-fold content answer "what is this and why should I care"?')
    }
    lines.push('')

    lines.push('## Verdict\n')
    lines.push('After working through every signal above, give a verdict:')
    lines.push('')
    lines.push('| Signal | Pass / Fail / Warn | Notes |')
    lines.push('|---|---|---|')
    lines.push('| Audience fit | | |')
    lines.push('| Typography feel | | |')
    lines.push('| Colour mood | | |')
    lines.push('| Layout density | | |')
    lines.push('| Imagery style | | |')
    lines.push('| CTA tone | | |')
    lines.push('| Trust signals | | |')
    lines.push('')
    lines.push('**If any signal is Fail:** stop. Describe what needs to change and why before proceeding to the code review.')
    lines.push('**If all Pass or Warn:** proceed to `pulse_review` for the code review gate.')

    return text(lines.join('\n'))
  }
)

function vibeTypographyHint(vibe) {
  const hints = {
    editorial:  'serif headings, tight tracking, high contrast text, editorial scale',
    bold:       'heavy condensed headings, impact weight, high contrast',
    brutalist:  'monospace or system font, raw weight, zero decoration',
    retro:      'slab serif or display font, warm tones, nostalgic feel',
    neon:       'monospace, futuristic, glowing accent on dark background',
    warm:       'rounded sans, generous spacing, soft palette',
    playful:    'rounded display font, large type, bright colours',
    minimal:    'light weight sans, generous whitespace, restrained scale',
    corporate:  'conservative sans, neutral palette, structured layout',
    paper:      'serif body, organic texture, journal-like rhythm',
  }
  return hints[vibe] ?? 'match the vibe description'
}

// ---------------------------------------------------------------------------
// pulse_suggest — Draft-mode contextual feedback
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_suggest',
  {
    description: `Draft-mode feedback — paste a partial or complete spec and get constructive suggestions before running the hard validator.

Unlike pulse_validate (which fails on errors), pulse_suggest is a collaborator: it notices patterns, spots likely omissions, and offers ideas. Use it mid-build when you want a second opinion, not a gate.

Returns observations grouped by category: completeness, data flow, components, state shape, accessibility hints, and quick wins.`,
    inputSchema: {
      content: z.string().describe('JavaScript spec content — can be partial or incomplete'),
    },
  },
  ({ content }) => {
    const suggestions = []
    const observations = []
    const quickWins = []

    // --- Route & meta ---
    if (!content.includes('route:')) {
      suggestions.push('No route defined yet — add `route: \'/your-path\'` to register this page.')
    }
    if (!content.includes('meta:')) {
      quickWins.push('Add a `meta` block with `title` and `description` — needed for SEO and Lighthouse.')
    } else {
      if (!content.includes('title:'))       quickWins.push('`meta.title` is missing — every page needs a unique title.')
      if (!content.includes('description:')) quickWins.push('`meta.description` is missing — used for SEO and social previews.')
      if (!content.includes('styles:'))      quickWins.push('`meta.styles` not set — add `[\'/pulse-ui.css\']` if you are using any UI components.')
      if (!content.includes('theme:'))       quickWins.push('`meta.theme` not set — Pulse renders DARK by default. If this design is light, add `theme: \'light\'` now rather than discovering a dark page at the screenshot.')
    }

    // --- Export ---
    if (!content.includes('export default')) {
      suggestions.push('No `export default` found — specs must export default for hydration to work. Add `export default spec` or `export default { ... }` at the end.')
    }

    // --- Server fetchers ---
    const hasServer = content.includes('server:')
    const hasStore  = content.includes('store:')
    const viewRefs  = (content.match(/server\.\w+/g) || []).map(r => r.slice(7))
    if (viewRefs.length > 0 && !hasServer && !hasStore) {
      suggestions.push(`View references server data (${viewRefs.slice(0, 3).join(', ')}) but no \`server\` block is defined. Add server fetchers or check if these should come from a store instead.`)
    }
    if (hasServer) {
      const declaredFetchers = [...content.matchAll(/^\s{4}(\w+)\s*:/gm)].map(m => m[1]).filter(f => f !== 'server' && f !== 'state' && f !== 'mutations' && f !== 'actions' && f !== 'meta' && f !== 'route' && f !== 'view' && f !== 'store' && f !== 'stream' && f !== 'persist' && f !== 'constraints' && f !== 'validation')
      const missingInView = viewRefs.filter(r => !content.includes(r + ':') && !declaredFetchers.includes(r))
      if (missingInView.length > 0) {
        suggestions.push(`View references \`server.${missingInView[0]}\` but no matching server fetcher found — check the spelling or add the fetcher.`)
      }
    }

    // --- State ---
    const hasMutations = content.includes('mutations:')
    const hasActions   = content.includes('actions:')
    const hasState     = content.includes('state:')
    if ((hasMutations || hasActions) && !hasState) {
      suggestions.push('Spec has mutations/actions but no `state` — the runtime needs an initial state object. Add `state: { ... }` with your initial values.')
    }
    if (hasState && !hasMutations && !hasActions) {
      observations.push('State is defined but there are no mutations or actions — if this is purely server-rendered and never updated client-side, you can remove `state` for a lighter page (zero hydration JS).')
    }

    // --- Forms & actions ---
    const hasForms   = content.includes('data-action=')
    const hasActionsDef = content.includes('actions:')
    if (hasForms && !hasActionsDef) {
      suggestions.push('Found `data-action=` in the view but no `actions` block defined — the form submit will silently do nothing. Add an `actions` block with `onStart`, `run`, `onSuccess`, and `onError`.')
    }
    if (hasActionsDef && !content.includes('onError:')) {
      suggestions.push('Action found without `onError` — this will cause a runtime error on failure. Every action must define `onSuccess` AND `onError`.')
    }
    if (hasActionsDef && !content.includes('onSuccess:')) {
      suggestions.push('Action found without `onSuccess` — this is required. Add `onSuccess: (state, result) => ({ ... })`.')
    }

    // --- Event binding on inputs ---
    if (content.includes('data-event=') && (content.match(/data-event="[^"]*"\s*(?:type="(?:text|email|password|search|tel|url|number)"|name=)/g) || []).length > 0) {
      suggestions.push('`data-event` on a text input causes re-render on every keystroke, destroying focus. Use uncontrolled inputs and read values from `FormData` in `action.onStart` instead.')
    }

    // --- Validation ---
    if (hasActions && !content.includes('validate:') && (content.includes('required') || content.includes('format:'))) {
      quickWins.push('You have validation rules but no action sets `validate: true` — add `validate: true` to the action that submits the form to run validation before `run()`.')
    }

    // --- View ---
    if (!content.includes('id="main-content"')) {
      quickWins.push('Add `<main id="main-content">` as the page landmark — needed for accessibility (skip link target) and Lighthouse.')
    }

    // --- Components ---
    const hasRawButton = /<button(?!\s+[^>]*class="ui-)/.test(content)
    const hasRawInput  = /<input(?!\s+[^>]*class="ui-)/.test(content) && !content.includes('type="hidden"')
    const hasRawTable  = /<table(?!\s+[^>]*class="ui-)/.test(content)
    if (hasRawButton) quickWins.push('Raw `<button>` found — use `button({...})` from `@invisibleloop/pulse/ui` for consistent styling and accessibility.')
    if (hasRawInput)  quickWins.push('Raw `<input>` found — use `input({...})` from `@invisibleloop/pulse/ui` for accessible labels and consistent styling.')
    if (hasRawTable)  quickWins.push('Raw `<table>` found — use `table({ head, rows })` from `@invisibleloop/pulse/ui`.')

    // --- Empty / error states ---
    if (hasServer && !content.includes('empty(') && !content.includes("'empty'") && (content.includes('.length') || content.includes('.map('))) {
      quickWins.push('Server data is rendered but no empty state found — add `empty({ message: \'...\' })` for when the list is empty.')
    }
    if (hasActions && !content.includes('alert(') && !content.includes("'error'")) {
      quickWins.push("Action defined but no error display in the view — add an `alert({ variant: 'error', message: '...' })` to show the user when something goes wrong.")
    }

    // --- Loading state ---
    if (hasActions && !content.includes("'loading'") && !content.includes('aria-busy')) {
      quickWins.push("No loading state found — while an action runs, the submit button should show feedback (change label to 'Saving…' and add `aria-busy='true'` + `disabled`).")
    }

    // --- onViewError ---
    if (hasServer && !content.includes('onViewError') && (content.includes('?.') === false) && content.includes('server.')) {
      quickWins.push('Consider adding `onViewError` — if a server fetcher returns unexpected data, the view can crash. A simple fallback prevents a 500 error.')
    }

    // --- Constraints ---
    const mutationBodies = [...content.matchAll(/=>\s*\(\{[^}]*\+\s*1[^}]*\}|=>\s*\(\{[^}]*-\s*1[^}]*\}/g)]
    if (mutationBodies.length > 0 && !content.includes('constraints:')) {
      quickWins.push('Mutations with increment/decrement found but no `constraints` block — use `constraints: { field: { min: 0, max: 10 } }` instead of conditional logic inside mutations.')
    }

    // --- Assemble output ---
    const lines = ['## Suggestions\n']

    if (suggestions.length === 0 && observations.length === 0 && quickWins.length === 0) {
      lines.push('Spec looks solid — nothing obvious to flag. Run `pulse_validate` for a full schema check.')
      return text(lines.join('\n'))
    }

    if (suggestions.length > 0) {
      lines.push('### Things to address\n')
      for (const s of suggestions) lines.push(`• ${s}\n`)
    }

    if (observations.length > 0) {
      lines.push('### Observations\n')
      for (const o of observations) lines.push(`ℹ ${o}\n`)
    }

    if (quickWins.length > 0) {
      lines.push('### Quick wins\n')
      for (const q of quickWins) lines.push(`→ ${q}\n`)
    }

    lines.push('\nRun `pulse_validate` when ready for a full schema check, or keep iterating.')

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_list_icons — Icon catalogue
// ---------------------------------------------------------------------------

const ICON_CATALOGUE = {
  Navigation: ['iconArrowLeft', 'iconArrowRight', 'iconArrowUp', 'iconArrowDown', 'iconChevronLeft', 'iconChevronRight', 'iconChevronUp', 'iconChevronDown', 'iconExternalLink', 'iconMenu', 'iconX', 'iconMoreHorizontal', 'iconMoreVertical', 'iconHome', 'iconLogOut', 'iconLogIn'],
  Status: ['iconCheck', 'iconCheckCircle', 'iconXCircle', 'iconAlertCircle', 'iconAlertTriangle', 'iconInfo', 'iconLoader', 'iconBug'],
  Actions: ['iconPlus', 'iconMinus', 'iconEdit', 'iconTrash', 'iconCopy', 'iconSearch', 'iconFilter', 'iconDownload', 'iconUpload', 'iconRefresh', 'iconSend'],
  UI: ['iconEye', 'iconEyeOff', 'iconLock', 'iconUnlock', 'iconSettings', 'iconBell', 'iconGrid', 'iconBarChart'],
  People: ['iconUser', 'iconUsers', 'iconMail', 'iconMessageSquare', 'iconSmile', 'iconHeart', 'iconHandPointUp', 'iconHandPointDown', 'iconHandPointLeft', 'iconHandPointRight'],
  Media: ['iconFile', 'iconImage', 'iconLink', 'iconCode', 'iconPlay', 'iconPause', 'iconVolume'],
  Time: ['iconCalendar', 'iconClock'],
  Utility: ['iconBookmark', 'iconTag', 'iconStar', 'iconMapPin', 'iconGlobe', 'iconShield', 'iconZap', 'iconTrendingUp', 'iconTrendingDown', 'iconSun', 'iconMoon', 'iconPhone', 'iconGamepad', 'iconTelescope', 'iconAi', 'iconFeather'],
  Ecommerce: ['iconShoppingCart', 'iconShoppingBag', 'iconCreditCard', 'iconPackage', 'iconGift', 'iconWallet', 'iconTruck', 'iconReceipt', 'iconStore', 'iconPercent', 'iconTicket', 'iconBanknote'],
  Food: ['iconUtensils', 'iconCoffee', 'iconPizza', 'iconApple', 'iconCarrot', 'iconWine', 'iconCakeSlice', 'iconFish', 'iconCherry', 'iconEgg', 'iconCookie', 'iconIceCream', 'iconCroissant', 'iconSalad', 'iconWheat'],
}

server.registerTool(
  'pulse_list_icons',
  {
    description: 'List all available Pulse UI icon names, grouped by category. Use this before importing icons — never guess a name or grep the source.',
    inputSchema: {
      filter: z.string().optional().describe('Optional keyword to filter icon names (e.g. "arrow", "check", "shop")'),
    },
  },
  ({ filter }) => {
    const q = filter?.toLowerCase()
    const lines = ['# Pulse UI Icons\n', 'Import from `@invisibleloop/pulse/ui`. All icons accept `{ size, class, color }` props.\n']

    if (!q) {
      lines.push('## Quick scan — one from each category\n')
      for (const [category, icons] of Object.entries(ICON_CATALOGUE)) {
        const sample = icons.slice(0, 5).join('  ·  ')
        lines.push(`**${category}** — ${sample}  _(+${Math.max(0, icons.length - 5)} more)_`)
      }
      lines.push('\nUse `filter` to drill into a category: `pulse_list_icons({ filter: "arrow" })`, `pulse_list_icons({ filter: "shop" })`\n')
      lines.push('---\n')
    }

    for (const [category, icons] of Object.entries(ICON_CATALOGUE)) {
      const filtered = q ? icons.filter(n => n.toLowerCase().includes(q)) : icons
      if (filtered.length === 0) continue
      lines.push(`## ${category}`)
      lines.push(filtered.join('  ·  '))
      lines.push('')
    }

    const total = Object.values(ICON_CATALOGUE).reduce((n, arr) => n + arr.length, 0)
    lines.push(`---\n${total} icons total. Usage: \`iconCheck({ size: 16 })\`, \`iconZap({ size: 20, class: 'u-text-accent' })\``)

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_extract_inspiration — Structured design extraction from URL or image
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_extract_inspiration',
  {
    description: `Extract a structured design brief from a URL, image, or well-known named reference the user has shared as inspiration.

Call this when the user shares a URL, pastes/attaches an image, or names a site you have real knowledge of well enough to describe its actual design (e.g. "make it feel like linear.app"). It returns a structured extraction template that tells you exactly what to observe and capture. You then use your own browsing or vision tools to fill in the template, and feed the result into pulse_intake.

Works for:
- URLs: visit the site with your browser tool, observe the rendered page
- Images: use your vision capability to analyse the screenshot/photo the user shared
- Named references you actually know: use your knowledge of the brand/site to populate the template

**Do not call this for a name alone with nothing to extract** — a small or local business the user mentioned in passing ("there's a place called X, I like their logo, but I haven't looked at their site") with no URL, no image, and no training knowledge of what it actually looks like. That's not an inspiration source, it's a name — calling this tool on it produces a fabricated brief dressed up as an observation. Skip straight to pulse_intake with only what the user has actually described.

The extracted values map directly to pulse_intake fields (palette, vibe, styleNotes, antiStyle, font).`,
    inputSchema: {
      source: z.string().describe('What to analyse — a URL (e.g. "https://stripe.com"), a site name (e.g. "linear.app"), or a description of an image the user shared (e.g. "the screenshot the user just pasted")'),
      focus:  z.enum(['all', 'colours', 'layout', 'typography', 'feel']).optional().describe('What aspect to focus on. Default is "all". Use "colours" if user specifically wants to extract a palette, "layout" for structural decisions, "typography" for font choices, "feel" for overall tone.'),
    },
  },
  ({ source, focus = 'all' }) => {
    const lines = []
    lines.push(`# Inspiration Extraction — ${source}\n`)
    lines.push('**You must fill in this template now** — do not return it blank to the user.')
    lines.push('Use your browsing tool (for URLs) or vision capability (for images) to observe the source and populate every field you can determine.')
    lines.push('Leave a cell blank only if it is genuinely unobservable. When done, call `pulse_intake` with the extracted values.\n')
    lines.push('---\n')

    const isUrl = /^https?:\/\//.test(source) || /\.(com|io|co|app|design|net|org|dev)\b/.test(source)

    if (isUrl) {
      lines.push('## Step 1 — Visit the site (do this now)')
      lines.push(`Navigate to: **${source}**`)
      lines.push('Observe the rendered page at desktop width (~1440px) and again at mobile (~375px).')
      lines.push('Take note of the above-the-fold area, then scroll through the full page.')
      lines.push('**Fill in the sections below based on what you observe. Return a completed extraction, not an empty template.**')
      lines.push('')
      lines.push('> **If the URL is blocked or unreachable:** do not return a blank template. Instead, use your training knowledge of the site/brand to populate as many fields as you can, mark each cell with "(from knowledge, not live)" and note at the top that the URL was unreachable. A knowledge-based extraction is more useful than an empty template.\n')
    } else {
      lines.push('## Step 1 — Analyse the source (do this now)')
      lines.push(`Source: **${source}**`)
      lines.push('Use your vision capability or knowledge of this reference to fill in the template below.')
      lines.push('**Return a completed extraction with your observations filled in — not a blank template.**')
      lines.push('')
      lines.push('> **If you have no reliable knowledge of this specific reference** (a small or local business the user named but you have no training data on, and they have not described what it looks like — e.g. "there\'s a place called X, I like their logo, but I haven\'t actually looked at their site"): do not guess or fabricate a brief. There is nothing to extract here — this is not a real inspiration source, just a name in passing. Skip this tool entirely and proceed with `pulse_intake` using only what the user has actually described (their own words about tone, anti-style, etc.). Note in your build plan that no visual reference was available, rather than presenting a fabricated extraction as if it came from observing something real.\n')
    }

    lines.push('---\n')

    if (focus === 'all' || focus === 'colours') {
      lines.push('## Colour palette')
      lines.push('Extract the dominant colours. Try to identify hex values where visible (use browser DevTools / colour picker if available).\n')
      lines.push('| Role | Colour | Hex (if known) |')
      lines.push('|---|---|---|')
      lines.push('| Background | | |')
      lines.push('| Surface / card | | |')
      lines.push('| Primary text | | |')
      lines.push('| Secondary / muted text | | |')
      lines.push('| Accent / brand | | |')
      lines.push('| Border / divider | | |')
      lines.push('')
      lines.push('**Theme:** light / dark / system')
      lines.push('**Colour character:** monochrome / single accent / multi-colour / gradient-heavy')
      lines.push('**→ Maps to:** `palette` and `theme` in pulse_intake\n')
    }

    if (focus === 'all' || focus === 'typography') {
      lines.push('## Typography')
      lines.push('| Property | Observation |')
      lines.push('|---|---|')
      lines.push('| Heading font | (name or character — serif, sans, slab, monospace, display) |')
      lines.push('| Body font | |')
      lines.push('| Heading weight | (light, regular, medium, bold, black) |')
      lines.push('| Heading size feel | (compact, standard, oversized, huge) |')
      lines.push('| Letter spacing | (tight / normal / loose / very loose) |')
      lines.push('| Line height | (tight / comfortable / generous) |')
      lines.push('')
      lines.push('**→ Maps to:** `font` and `styleNotes` in pulse_intake\n')
    }

    if (focus === 'all' || focus === 'layout') {
      lines.push('## Layout structure')
      lines.push('**Hero / above-fold:**')
      lines.push('- Structure: (centred / left-aligned / full-bleed image / split / typography-only)')
      lines.push('- Nav position: (top bar / sidebar / minimal / none visible)')
      lines.push('- CTA placement: (inline with heading / separate row / fixed)')
      lines.push('')
      lines.push('**Page rhythm:**')
      lines.push('- Section width: (full-bleed / contained / narrow column)')
      lines.push('- Spacing: (tight / standard / very generous)')
      lines.push('- Grid: (centred single column / multi-column / asymmetric)')
      lines.push('')
      lines.push('**→ Maps to:** layout direction for pulse_sketch — note which of the 7 directions this resembles:')
      lines.push('full-bleed-photo / asymmetric-split / typography-only / editorial-flow / dense-grid / story-scroll / content-first\n')
    }

    if (focus === 'all' || focus === 'feel') {
      lines.push('## Overall feel')
      lines.push('**Emotional tone** (circle one or write your own):')
      lines.push('trustworthy · urgent · warm · clinical · playful · premium · raw · editorial · technical · minimal\n')
      lines.push('**Closest vibe** (pick from Pulse vibes):')
      lines.push('warm / editorial / playful / minimal / bold / brutalist / retro / corporate / neon / paper\n')
      lines.push('**Three words that describe the design:**')
      lines.push('1.')
      lines.push('2.')
      lines.push('3.\n')
      lines.push('**→ Maps to:** `vibe` and `styleNotes` in pulse_intake\n')
    }

    lines.push('---\n')
    lines.push('## Signature moves')
    lines.push('What does this design do that most sites don\'t? Note 1–3 distinctive techniques:')
    lines.push('1.')
    lines.push('2.')
    lines.push('3.\n')

    lines.push('---\n')
    lines.push('## Ready to use in pulse_intake\n')
    lines.push('Once you have filled in the template above, map the findings to pulse_intake params:')
    lines.push('')
    lines.push('```')
    lines.push('pulse_intake({')
    lines.push('  // ... name, pitch, features ...')
    lines.push('  palette:     "<hex values extracted above, comma-separated>",')
    lines.push('  theme:       "<light or dark>",')
    lines.push('  font:        "<heading font name if identified>",')
    lines.push('  vibe:        "<closest Pulse vibe>",')
    lines.push('  styleNotes:  "<3-word summary> + signature moves observed",')
    lines.push('  inspiration: "<' + source + '>",')
    lines.push('})')
    lines.push('```')
    lines.push('')
    lines.push('**Now fill in the template above with your observations, then call `pulse_sketch` — pass the layout direction observed above as context in your `brief`.**')
    lines.push('')
    lines.push('> Do not return this template blank. The user is waiting for a completed extraction.')

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_intake — Product intake before scaffolding
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_intake',
  {
    description: `Capture product details before scaffolding a new page or site. Run this first for any new project or branded template — before pulse_sketch or pulse_intent.

Returns a structured product brief with copy-ready content, early contrast warnings, and component suggestions matched to the vibe. After intake, call pulse_sketch to explore structural layout directions before writing any code.

Accepts antiStyle ("what should this NOT look like?") and inspiration (a site or brand reference) to push the design beyond default patterns.`,
    inputSchema: {
      name:       z.string().describe('App or product name exactly as it should appear in the UI'),
      pitch:      z.string().describe('One-line description — what the product does. Used as the hero subtitle.'),
      features:   z.string().describe('3–6 real selling points, comma-separated. E.g. "Habit streaks, Smart reminders, Weekly insights, Dark mode"'),
      targetUser: z.string().optional().describe('Who this is for — shapes copy tone. E.g. "busy professionals", "indie developers", "home cooks"'),
      palette:    z.string().optional().describe('Brand colours as hex values, comma-separated. E.g. "#6366f1, #f8fafc, #1e1b4b". Used for early contrast check.'),
      font:       z.string().optional().describe('Brand font name, or omit for system-ui'),
      theme:      z.enum(['light', 'dark']).optional().describe('Colour theme — ALWAYS ask the user for this; Pulse renders DARK when meta.theme is unset, so an unstated light design ships dark and costs a rework cycle. Pass the answer through to meta.theme in the spec.'),
      vibe:       z.enum(['warm', 'editorial', 'playful', 'minimal', 'bold', 'brutalist', 'retro', 'corporate', 'neon', 'paper']).optional().describe('Visual personality — see pulse://guide/design-references for full descriptions. warm (rounded, inviting), editorial (serif, sharp), playful (very rounded), minimal (clean), bold (impact headings), brutalist (zero radius, raw), retro (slab serif, nostalgic), corporate (conservative), neon (monospace, futuristic), paper (organic, serif, journal)'),
      styleNotes: z.string().optional().describe('Free-form style direction — e.g. "like a print poster", "market stall chalkboard feel", "clinical and professional"'),
      antiStyle:  z.string().optional().describe('"What should this NOT look like?" — negative aesthetic constraint. E.g. "not corporate SaaS", "not another Vercel dark card page", "not a startup landing page". Used to steer component and layout choices away from over-used patterns.'),
      inspiration: z.string().optional().describe('A website, brand, or visual reference you admire — any industry. E.g. "stripe.com", "a Swiss railway poster", "the Economist magazine". Used to extract aesthetic intent and inform structural choices, not to copy.'),
    },
  },
  ({ name, pitch, features, targetUser, palette, font, theme = 'dark', vibe: rawVibe, styleNotes, antiStyle, inspiration }) => {
    const vibe = normaliseVibe(rawVibe)
    const featureList = features.split(',').map(f => f.trim()).filter(Boolean)
    const lines = []

    lines.push(`# Product brief — ${name}\n`)
    lines.push(`**Pitch:** ${pitch}`)
    if (targetUser) lines.push(`**Target user:** ${targetUser}`)
    lines.push(`**Theme:** ${theme}`)
    if (vibe) lines.push(`**Vibe:** ${vibe} → set \`meta.vibe: '${vibe}'\` in the spec`)
    if (styleNotes) lines.push(`**Style direction:** ${styleNotes}`)
    if (inspiration) lines.push(`**Inspiration:** ${inspiration} — extract the aesthetic intent (structure, whitespace, type scale, colour restraint) not the literal appearance`)
    if (antiStyle) lines.push(`**Anti-pattern:** NOT ${antiStyle} — actively steer away from this in layout and component choices`)
    if (font) lines.push(`**Font:** ${font}`)
    lines.push('')

    lines.push('## Features')
    featureList.forEach((f, i) => lines.push(`${i + 1}. ${f}`))
    lines.push('')

    // Palette
    const hexValues = palette
      ? palette.split(',').map(s => s.trim()).filter(s => /^#[0-9a-fA-F]{3,8}$/.test(s))
      : []

    if (hexValues.length > 0) {
      lines.push('## Palette')
      hexValues.forEach(h => lines.push(`  ${h}`))
      lines.push('')

      // Quick luminance / tone analysis
      const tones = hexValues.map(hex => {
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const tone = lum > 0.7 ? 'light' : lum > 0.2 ? 'mid' : 'dark'
        return { hex, lum: lum.toFixed(3), tone }
      })

      lines.push('## Palette tone analysis')
      lines.push('| Hex | Luminance | Tone | Use for |')
      lines.push('|---|---|---|---|')
      tones.forEach(({ hex, lum, tone }) => {
        const use = tone === 'light' ? 'background, surface' : tone === 'dark' ? 'backgrounds, deep fills' : 'accent colour, buttons'
        lines.push(`| ${hex} | ${lum} | ${tone} | ${use} |`)
      })
      lines.push('')

      // Early contrast warnings — check mid-tones on light/dark backgrounds
      const mids = tones.filter(t => t.tone === 'mid')
      const lights = tones.filter(t => t.tone === 'light')
      const darks = tones.filter(t => t.tone === 'dark')

      const contrastWarnings = []
      const contrast = (l1, l2) => {
        const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
        return (hi + 0.05) / (lo + 0.05)
      }

      for (const mid of mids) {
        if (lights.length > 0) {
          const bg = lights[0]
          const ratio = contrast(parseFloat(mid.lum), parseFloat(bg.lum))
          if (ratio < 4.5) {
            contrastWarnings.push(`⚠ ${mid.hex} (mid) on ${bg.hex} (light): contrast ${ratio.toFixed(1)}:1 — fails WCAG AA (4.5:1 needed for body text). Darken the accent or use it only on large text (3:1 threshold).`)
          }
        }
        if (darks.length > 0) {
          const bg = darks[0]
          const ratio = contrast(parseFloat(mid.lum), parseFloat(bg.lum))
          if (ratio < 4.5) {
            contrastWarnings.push(`⚠ ${mid.hex} (mid) on ${bg.hex} (dark): contrast ${ratio.toFixed(1)}:1 — fails WCAG AA for body text. Consider a lighter tint for the dark theme.`)
          }
        }
      }

      if (contrastWarnings.length > 0) {
        lines.push('## ⚠ Early contrast warnings')
        lines.push('Resolve these before writing CSS — fixing palette problems after building is expensive:\n')
        contrastWarnings.forEach(w => lines.push(w))
        lines.push('')
        lines.push('**Tip:** Mid-tone palette colours often fail on both light and dark backgrounds. Use them for large background areas (3:1 threshold), and derive a darker variant for small text (needs 4.5:1).')
        lines.push('')
      } else if (hexValues.length > 1) {
        lines.push('✓ No obvious contrast failures detected in palette. Run `pulse_check_contrast` after writing theme CSS for a full check.')
        lines.push('')
      }
    } else if (palette) {
      lines.push(`Note: palette "${palette}" could not be parsed — provide hex values like #6366f1, #f8fafc\n`)
    }

    lines.push('## Ready to build')
    lines.push('')
    lines.push('Pass this brief to `pulse_intent` or use it when adapting a template. Replace every placeholder in the scaffold with content from this brief.')
    lines.push('')
    lines.push('**Spec copy checklist:**')
    lines.push(`- [ ] App name everywhere it appears: \`${name}\``)
    lines.push(`- [ ] Hero title/subtitle: use the pitch — "${pitch}"`)
    lines.push(`- [ ] Features section: ${featureList.slice(0, 3).join(', ')} (+ ${Math.max(0, featureList.length - 3)} more)`)
    if (targetUser) lines.push(`- [ ] Copy tone: aimed at ${targetUser}`)
    lines.push(`- [ ] Theme: ${theme} — ${theme === 'light' ? "use `meta.theme: 'light'` and target `[data-theme=\"light\"]` for CSS overrides" : 'default Pulse theme (no meta.theme needed), override tokens in `:root`'}`)
    if (vibe) {
      lines.push(`- [ ] Vibe: \`meta.vibe: '${vibe}'\` — sets data-vibe on body, activating geometry/type presets`)
      const vibeGuide = {
        warm:       'Pair with rounded imagery (uiImage with rounded corners), warmer accent tones, section variant: paper or alt',
        editorial:  'Use layout: overlap on hero for dramatic imagery. Serif headings via --font-display. section variant: diagonal for transitions.',
        playful:    'grid of uiImage with rounded corners, bright accent, raw HTML marquee-style strip if needed (creative override)',
        minimal:    'hero align: left (no center), section variant: spotlight, clean whitespace, monochrome palette',
        bold:       'hero gradient with strong color, large stat components, section variant: dark for contrast sections',
        brutalist:  'raw section wrappers, oversized heading with zero padding, no shadows, high contrast accent (red/lime)',
        retro:      'badge eyebrows, thick dividers, earthy amber/cream palette, raw HTML dot-pattern background (creative override)',
        corporate:  'feature grid with checkmarks, card() with logo+quote for testimonials, stat bar',
        neon:       'section(variant: "spotlight") for glow sections, raw HTML terminal/API code block (creative override) for dev examples, stat with glowing accent',
        paper:      'pullquote prominently, prose with generous line-height, avatar for author, container(size: "sm")',
      }
      if (vibeGuide[vibe]) lines.push(`  **${vibe} component suggestions:** ${vibeGuide[vibe]}`)
    }
    if (styleNotes) lines.push(`- [ ] Style direction: "${styleNotes}" — translate this into component choices and layout decisions`)
    if (antiStyle) lines.push(`- [ ] Anti-pattern enforced: "${antiStyle}" — if your layout resembles this, reconsider structural choices before writing the spec`)
    if (inspiration) lines.push(`- [ ] Inspiration taken from: "${inspiration}" — extract intent (spacing, type scale, restraint), not appearance`)
    if (font) lines.push(`- [ ] Font: set \`--font: '${font}', system-ui\` in \`:root\` via app.css; if display font differs set \`--font-display: '${font}'\``)

    lines.push('')
    lines.push('## Next step')
    lines.push('')
    lines.push('Call `pulse_sketch` with this brief to get 3 structurally distinct layout directions before writing any code.')
    lines.push('This prevents defaulting to the standard centred hero + three columns layout.')
    if (antiStyle) lines.push(`Pass \`antiStyle: "${antiStyle}"\` to pulse_sketch to filter directions that might drift toward the constraint.`)
    lines.push('')
    lines.push('**Before writing image tags:** if you plan to use external images (picsum.photos, Unsplash, Cloudinary, etc.), add the host to `csp.img-src` in `pulse.config.js` before your first Lighthouse run — or images will be blocked and Best Practices will fail. See `pulse://guide/styles` → "External images (img-src)".')

    // Save brief to .pulse/brief.json for later design review
    try {
      const pulseDir  = path.join(ROOT, '.pulse')
      const briefFile = path.join(pulseDir, 'brief.json')
      fs.mkdirSync(pulseDir, { recursive: true })
      fs.writeFileSync(briefFile, JSON.stringify({
        name, pitch, features: featureList, targetUser: targetUser ?? null,
        vibe: vibe ?? null, theme, styleNotes: styleNotes ?? null,
        antiStyle: antiStyle ?? null, palette: palette ?? null,
        font: font ?? null, inspiration: inspiration ?? null,
      }, null, 2))
    } catch (_) { /* non-fatal — brief.json is best-effort */ }

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_sketch — Generate 3 structural layout directions before writing code
// ---------------------------------------------------------------------------

const SKETCH_DIRECTIONS = {
  'full-bleed-photo': {
    name: 'Full-Bleed Photo',
    mood: 'Immersive. The image IS the hero. Type floats over.',
    gesture: 'Edge-to-edge image fills the viewport. Title reversed out. Content below in a clean strip.',
    wireframe: [
      '┌─────────────────────────────────────────────────────┐',
      '│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│',
      '│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│',
      '│▓▓▓▓▓  LARGE TITLE — REVERSED OUT  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│',
      '│▓▓▓▓▓  subtitle · CTA              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│',
      '│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│',
      '├─────────────────────────────────────────────────────┤',
      '│  Content / features / grid below the fold           │',
      '└─────────────────────────────────────────────────────┘',
    ],
    decisions: [
      'Type positioned bottom-left or lower-centre — never centred at eye level',
      'Nav is transparent on load, transitions to solid on scroll',
      'Gradient overlay at bottom of hero — text readable without a stroke',
      'Below-fold uses a clean background for contrast reset',
    ],
    useComponents: 'nav (transparent variant), hero (gradient overlay), footer, card (below-fold features)',
    rawHtml: 'hero layout positioning — use hero() component with custom .hero-wrapper CSS for full-bleed background image',
  },
  'asymmetric-split': {
    name: 'Asymmetric Split',
    mood: 'Confident and considered. Permanent visual tension.',
    gesture: '60/40 or 65/35 vertical split throughout. Left: identity + text. Right: image, proof, or form.',
    wireframe: [
      '┌──────────────────┬──────────────────────────────────┐',
      '│                  │                                  │',
      '│  Logo            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
      '│                  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
      '│  BIG HEADING     │  ▓▓▓▓▓  FULL-BLEED IMAGE ▓▓▓▓  │',
      '│                  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
      '│  Subtitle        │                                  │',
      '│  [CTA Button]    │                                  │',
      '│                  │                                  │',
      '└──────────────────┴──────────────────────────────────┘',
    ],
    decisions: [
      'Left column can be sticky on large screens — identity persists while right scrolls',
      'Asymmetry is maintained across ALL sections — never go full-width mid-page',
      'Right column can hold image, testimonials, or a form',
      'Mobile: stacks vertically — image first, then text',
    ],
    useComponents: 'nav (left column), hero (split layout), media, card, footer',
    rawHtml: 'page-level grid wrapper — wrap all sections in a two-column CSS grid container',
  },
  'typography-only': {
    name: 'Typography-Only',
    mood: 'Quiet confidence. The words do all the work.',
    gesture: 'No hero image. Ultra-large heading fills the viewport. Restrained details. Generous whitespace.',
    wireframe: [
      '┌─────────────────────────────────────────────────────┐',
      '│                                                     │',
      '│  Logo                              Nav links        │',
      '│                                                     │',
      '│         THE HEADLINE IS ENORMOUS.                   │',
      '│         IT FILLS THE SPACE.                         │',
      '│                                                     │',
      '│         Subtitle copy. One sentence max.            │',
      '│                                                     │',
      '│         [  CTA Button  ]   ↓ Scroll                 │',
      '│                                                     │',
      '└─────────────────────────────────────────────────────┘',
    ],
    decisions: [
      'font-size: clamp(3rem, 10vw, 9rem) — headline scales with viewport',
      'No images above the fold — trust the writing',
      'Single accent colour — everything else is text and background',
      'Below-fold sections may introduce imagery, but type remains dominant',
    ],
    useComponents: 'nav, footer, stat (for numbers/proof below fold)',
    useComponents: 'hero (size:lg, align:center), section, container, footer',
    rawHtml: 'page-level typography overrides — custom font-size on hero title, tighter letter-spacing',
  },
  'editorial-flow': {
    name: 'Editorial Flow',
    mood: 'Authoritative. Reads like a magazine, not a landing page.',
    gesture: 'Long vertical column with intentional zone widths — intro full-width, body at reading width (~65ch), pullouts wider.',
    wireframe: [
      '┌─────────────────────────────────────────────────────┐',
      '│  Full-width header image or colour fill             │',
      '│  ─────────────────────────────────────────          │',
      '│       HEADLINE RUNS FULL WIDTH HERE                 │',
      '│  ─────────────────────────────────────────          │',
      '│     │  Opening paragraph at reading width  │        │',
      '│     │  (max 65ch, generous leading)         │        │',
      '│     │                                       │        │',
      '│  ╔══════ PULLQUOTE BREAKS OUT WIDER ══════╗ │        │',
      '│  ║  "The quoted passage."                 ║ │        │',
      '│  ╚════════════════════════════════════════╝ │        │',
      '│     │  Body text resumes…                  │        │',
      '└─────────────────────────────────────────────────────┘',
    ],
    decisions: [
      'Text is the primary element — no sidebar, no card grid above the fold',
      'pullquote used prominently to break the reading rhythm',
      'Section widths vary deliberately — not uniform padding throughout',
      'CTA lives at the end of the reading flow, not above the fold',
    ],
    useComponents: 'nav, hero (image layout), prose, pullquote, footer, avatar (author bio)',
    rawHtml: 'section width variations — use container(size) with different sizes for editorial flow',
  },
  'dense-grid': {
    name: 'Dense Grid',
    mood: 'Rich and scannable. Every pixel earns its place.',
    gesture: 'Information-dense from the first scroll. Tight gutters, small cards, horizontal + vertical navigation.',
    wireframe: [
      '┌──────────────────────────────────────────────────────┐',
      '│ Logo  ·  Nav  ·  Search  ·  Category filter  ·  CTA │',
      '├───────────────┬────────────────────────────┬─────────┤',
      '│               │  ┌──────┐ ┌──────┐ ┌────┐ │ Filter  │',
      '│  Sidebar      │  │ Card │ │ Card │ │    │ │  ──────  │',
      '│  ──────────   │  │      │ │      │ │    │ │  Tags    │',
      '│  Category 1   │  └──────┘ └──────┘ └────┘ │  ──────  │',
      '│  Category 2   │  ┌────┐ ┌──────────┐      │  Sort   │',
      '│  Category 3   │  │    │ │ Featured │      │         │',
      '└───────────────┴────────────────────────────┴─────────┘',
    ],
    decisions: [
      'Three-column layout with sidebar — breaks the standard single-column scroll',
      'Cards use flush:true — image-first, minimal padding',
      'No hero — jump straight into content',
      'Filtering visible on load — for sites where browsing/exploration is the UX',
    ],
    useComponents: 'nav, card (flush:true), badge, grid, footer',
    rawHtml: 'three-column page wrapper — wrap entire page in CSS grid layout for sidebar + content + filters',
  },
  'story-scroll': {
    name: 'Story Scroll',
    mood: 'Narrative and immersive. Each section feels like a chapter.',
    gesture: 'Full-viewport sections that scroll one at a time. Each zone fills 100svh with a single focused message.',
    wireframe: [
      '┌──────────────────────────────────────┐ ← 100svh',
      '│                                      │',
      '│   IDENTITY                           │',
      '│   The hook, the name, the feeling    │',
      '│                                      │',
      '└──────────────────────────────────────┘ ← scroll',
      '┌──────────────────────────────────────┐ ← 100svh',
      '│  ▓▓▓▓▓▓▓▓▓▓▓▓   PROOF ZONE          │',
      '│  ▓▓ photo ▓▓▓   Stat or testimonial  │',
      '└──────────────────────────────────────┘ ← scroll',
      '┌──────────────────────────────────────┐ ← 100svh',
      '│         THE ASK                      │',
      '│         Form or CTA, nothing else    │',
      '└──────────────────────────────────────┘',
    ],
    decisions: [
      'min-height: 100svh per section — each screen has one job',
      'Nav is minimal or floating — does not compete with content',
      'Sections alternate visual weight (light → dark → image-heavy)',
      'Best for short sites: 3–5 sections maximum',
    ],
    useComponents: 'nav (minimal), section (min-height: 100svh), hero, stat, cta, footer',
    rawHtml: 'full-viewport section wrappers — use section() with custom CSS for 100svh height and scroll snap',
  },
  'content-first': {
    name: 'Content First',
    mood: 'Humble and honest. The content leads, the design follows.',
    gesture: 'Narrow reading column, no hero image, minimal nav — content is visible within two scrolls of the fold.',
    wireframe: [
      '┌─────────────────────────────────────────────────────┐',
      '│  Logo                              Simple nav       │',
      '├─────────────────────────────────────────────────────┤',
      '│                                                     │',
      '│              PAGE TITLE                             │',
      '│              One line of context                    │',
      '│                                                     │',
      '│  ┌─────────────────────────────────────────────┐   │',
      '│  │  Content in a readable column (~65ch)        │   │',
      '│  │  Designed for reading, not scanning          │   │',
      '│  └─────────────────────────────────────────────┘   │',
      '│                                                     │',
      '└─────────────────────────────────────────────────────┘',
    ],
    decisions: [
      'max-width: 65ch on body text — readability over width-filling',
      'No above-fold hero — title and content appear immediately',
      'CTA integrated inline with content — not a separate section',
      'Feels finished at 3 sections, not 8',
    ],
    useComponents: 'nav, hero (no image, size:lg), prose, pullquote, avatar, footer',
    rawHtml: 'narrow content wrapper — use container(size:sm) for 65ch reading width',
  },
}

const SKETCH_VIBE_MAP = {
  warm:      ['asymmetric-split', 'full-bleed-photo', 'story-scroll'],
  editorial: ['editorial-flow', 'typography-only', 'content-first'],
  playful:   ['full-bleed-photo', 'story-scroll', 'dense-grid'],
  minimal:   ['typography-only', 'content-first', 'asymmetric-split'],
  bold:      ['typography-only', 'full-bleed-photo', 'story-scroll'],
  brutalist: ['typography-only', 'dense-grid', 'content-first'],
  retro:     ['story-scroll', 'full-bleed-photo', 'editorial-flow'],
  corporate: ['asymmetric-split', 'content-first', 'dense-grid'],
  neon:      ['full-bleed-photo', 'story-scroll', 'dense-grid'],
  paper:     ['editorial-flow', 'content-first', 'typography-only'],
}

const SKETCH_PAGE_MAP = {
  landing:   ['full-bleed-photo', 'asymmetric-split', 'typography-only'],
  about:     ['editorial-flow', 'story-scroll', 'content-first'],
  portfolio: ['dense-grid', 'full-bleed-photo', 'asymmetric-split'],
  blog:      ['editorial-flow', 'content-first', 'dense-grid'],
  product:   ['story-scroll', 'asymmetric-split', 'full-bleed-photo'],
  event:     ['full-bleed-photo', 'story-scroll', 'typography-only'],
  contact:   ['content-first', 'typography-only', 'asymmetric-split'],
  dashboard: ['dense-grid', 'content-first', 'asymmetric-split'],
}

server.registerTool(
  'pulse_sketch',
  {
    description: `Generate 3 structurally distinct layout directions for a page before writing any code.

Call this after pulse_intake, before fetching guide sections or writing the spec. Returns three named layout directions — each with a different structural gesture (full-bleed, asymmetric split, typography-only, editorial flow, etc.) — so you can choose the one that matches the emotional intent rather than defaulting to "centred hero + three-column features".

After choosing a direction, fetch \`pulse://guide/explore\` for raw HTML patterns that match the structure, then \`pulse://guide/components\` for Pulse components to mix in.`,
    inputSchema: {
      brief:     z.string().describe('Product brief — paste the pulse_intake output, or describe the site in free text: what it is, who it\'s for, what feeling it should give.'),
      vibe:      z.enum(['warm', 'editorial', 'playful', 'minimal', 'bold', 'brutalist', 'retro', 'corporate', 'neon', 'paper']).optional().describe('Visual personality from pulse_intake — tailors the structural suggestions.'),
      antiStyle: z.string().optional().describe('What it should NOT look like — from pulse_intake antiStyle or stated directly.'),
      pageType:  z.enum(['landing', 'about', 'portfolio', 'blog', 'product', 'event', 'contact', 'dashboard']).optional().describe('Type of page — calibrates structural options. Defaults to landing.'),
    },
  },
  ({ brief, vibe: rawVibe, antiStyle, pageType = 'landing' }) => {
    const vibe = normaliseVibe(rawVibe)
    const lines = []
    lines.push('# Layout Directions\n')
    lines.push('Three structurally distinct options for this page. Read all three before choosing — the right one is rarely the first.\n')

    if (antiStyle) {
      lines.push(`**Anti-constraint:** NOT "${antiStyle}"`)
      lines.push('Each direction below is chosen to contrast with this constraint. If any still feels too close, say so.\n')
    }

    const keys = (vibe && SKETCH_VIBE_MAP[vibe]) || SKETCH_PAGE_MAP[pageType] || SKETCH_PAGE_MAP.landing
    const directions = keys.map(k => SKETCH_DIRECTIONS[k]).filter(Boolean)

    directions.forEach((dir, i) => {
      lines.push('---\n')
      lines.push(`## Direction ${i + 1}: ${dir.name}`)
      lines.push(`*${dir.mood}*\n`)
      lines.push(`**Structural gesture:** ${dir.gesture}\n`)
      lines.push('```')
      dir.wireframe.forEach(l => lines.push(l))
      lines.push('```\n')
      lines.push('**Key structural decisions:**')
      dir.decisions.forEach(d => lines.push(`- ${d}`))
      lines.push('')
      lines.push('**Component strategy:**')
      lines.push(`- **Use Pulse components:** ${dir.useComponents}`)
      lines.push(`- **Custom CSS/styling may be needed for:** ${dir.rawHtml}`)
      lines.push(`- **Important:** Always use components first. Custom CSS is for styling overrides only, never for rewriting component HTML from scratch.`)
      lines.push('')
    })

    lines.push('---\n')
    lines.push('## Next step\n')
    lines.push('Choose a direction (e.g. "Direction 2" or "mix 1 and 3 — split layout but with full-bleed image on the right").')
    lines.push('')
    lines.push('Then:')
    lines.push('1. Fetch `pulse://guide/explore` — raw HTML patterns for your chosen structure')
    lines.push('2. Fetch `pulse://guide/components` — Pulse components to mix in')
    lines.push('3. Fetch `pulse://guide/spec` — spec format reference')
    lines.push('4. Write the spec')

    return text(lines.join('\n'))
  }
)



/**
 * Parse a hex color string (#rgb, #rrggbb, #rrggbbaa) to relative luminance.
 * Returns null if the string is not a valid hex color.
 */
function hexToLuminance(hex) {
  const h = hex.replace('#', '')
  let r, g, b
  if (h.length === 3 || h.length === 4) {
    r = parseInt(h[0] + h[0], 16)
    g = parseInt(h[1] + h[1], 16)
    b = parseInt(h[2] + h[2], 16)
  } else if (h.length >= 6) {
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  } else {
    return null
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  const linearize = c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function contrastRatio(lum1, lum2) {
  const [hi, lo] = lum1 > lum2 ? [lum1, lum2] : [lum2, lum1]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Given a hex foreground, background luminance, and target contrast ratio,
 * suggest a corrected hex value that achieves the target ratio.
 * Strategy: adjust foreground luminance toward darker/lighter as needed.
 */
function suggestContrastFix(fgHex, bgLum, targetRatio) {
  const fgLum = hexToLuminance(fgHex)
  if (fgLum === null) return null
  
  // Calculate target foreground luminance needed to achieve targetRatio
  // (hi + 0.05) / (lo + 0.05) = targetRatio
  // If bg is lighter: (bgLum + 0.05) / (fgLum + 0.05) = targetRatio
  //   → fgLum = (bgLum + 0.05) / targetRatio - 0.05
  // If bg is darker: (fgLum + 0.05) / (bgLum + 0.05) = targetRatio
  //   → fgLum = targetRatio * (bgLum + 0.05) - 0.05
  
  let targetLum
  if (bgLum > fgLum) {
    // Background is lighter — darken foreground
    targetLum = (bgLum + 0.05) / targetRatio - 0.05
  } else {
    // Background is darker — lighten foreground
    targetLum = targetRatio * (bgLum + 0.05) - 0.05
  }
  
  // Clamp to valid luminance range
  targetLum = Math.max(0, Math.min(1, targetLum))
  
  // Convert target luminance to RGB (grayscale approximation for simplicity)
  // Inverse of linearize: L = 0.2126*R + 0.7152*G + 0.0722*B
  // For grayscale: L = R = G = B (simplified), so solve for sRGB value
  const delinearize = l => {
    return l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055
  }
  
  const srgb = delinearize(targetLum)
  const val = Math.round(srgb * 255)
  const clamp = Math.max(0, Math.min(255, val))
  
  return `#${clamp.toString(16).padStart(2, '0').repeat(3)}`
}

server.registerTool(
  'pulse_tokens',
  {
    description: `List all available --ui-* CSS custom property tokens from the installed pulse-ui.css.

Use this before writing theme overrides or app.css to avoid guessing token names. The correct override pattern is:
  - Set --accent (no prefix) in theme.css — pulse-ui maps it to --ui-accent automatically
  - Reference --ui-accent (prefixed) in app.css

Returns tokens grouped by category.`,
    inputSchema: {},
  },
  async () => {
    const cssPath = path.join(ROOT, 'public', 'pulse-ui.css')
    let tokens = []

    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8')
      // Extract property: value pairs for --ui-* defined in :root
      const matches = [...css.matchAll(/--ui-([a-z0-9-]+)\s*:\s*([^;}{]+)/g)]
      tokens = [...new Set(matches.map(m => `--ui-${m[1]}`))]
    }

    // Group tokens by category
    const groups = {
      'Colour':    tokens.filter(t => /^--ui-(bg|surface|border|text|muted|accent|green|red|yellow|blue|shadow)/.test(t)),
      'Spacing':   tokens.filter(t => t.startsWith('--ui-space-')),
      'Type size': tokens.filter(t => t.startsWith('--ui-text-')),
      'Typography': tokens.filter(t => /^--ui-(font|mono|letter-spacing)/.test(t)),
      'Shape':     tokens.filter(t => t.startsWith('--ui-radius')),
      'Other':     tokens.filter(t => !/(bg|surface|border|text|muted|accent|green|red|yellow|blue|shadow|space-|text-|font|mono|letter|radius)/.test(t.slice(5))),
    }

    const lines = [
      '## Pulse UI Tokens\n',
      '**Override pattern:**',
      '  • Set `--accent: #yourcolour` in `:root` (theme.css) — maps to `--ui-accent` automatically',
      '  • Reference `var(--ui-accent)` in app.css — never `var(--accent)` in app.css',
      '  • Common mistake: `--ui-color-accent` or `--color-accent` — these do NOT exist\n',
    ]

    for (const [group, toks] of Object.entries(groups)) {
      if (toks.length === 0) continue
      lines.push(`### ${group}`)
      lines.push(toks.join('  •  '))
      lines.push('')
    }

    lines.push('**Input tokens (set these in theme.css):**')
    lines.push('`--accent` `--accent-hover` `--accent-dim` `--accent-text` `--bg` `--surface` `--surface-2` `--border` `--text` `--muted` `--muted-bg` `--radius` `--font` `--mono`')

    return text(lines.join('\n'))
  }
)

server.registerTool(
  'pulse_check_csp',
  {
    description: `Resolve the redirect chains of external asset URLs (images, fonts, stylesheets) and return the complete set of origins your CSP must allow — as ready-to-paste config.

Many asset hosts redirect to a CDN origin (picsum.photos → fastly.picsum.photos): allowing only the URL you wrote still blocks the actual bytes, and the browser error names the CDN origin, which is confusing to debug. This tool follows each redirect chain (up to 5 hops) and reports every origin involved.

Call it with the external URLs you plan to use, before your first Lighthouse run. Suggested directive: img-src for images, font-src for font files, style-src for stylesheets.`,
    inputSchema: {
      urls:      z.array(z.string()).describe('External asset URLs to check, e.g. ["https://picsum.photos/id/10/1200/600"]'),
      directive: z.string().optional().describe("CSP directive these assets belong to (default: 'img-src')"),
    },
  },
  async ({ urls, directive = 'img-src' }) => {
    const MAX_HOPS = 5
    const origins  = new Set()
    const lines    = []

    for (const rawUrl of urls.slice(0, 10)) {
      let url
      try { url = new URL(rawUrl) } catch { lines.push(`✗ ${rawUrl} — not a valid URL`); continue }

      const chain = [url.origin]
      let blocked = null
      try {
        for (let hop = 0; hop < MAX_HOPS; hop++) {
          const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(5000) })
          if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
            url = new URL(res.headers.get('location'), url)
            chain.push(url.origin)
            continue
          }
          if (res.status === 405) {
            // Host rejects HEAD — confirm with a ranged GET so we still see redirects
            const get = await fetch(url, { method: 'GET', redirect: 'manual', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(5000) })
            if (get.status >= 300 && get.status < 400 && get.headers.get('location')) {
              url = new URL(get.headers.get('location'), url)
              chain.push(url.origin)
              continue
            }
          }
          break
        }
      } catch (err) {
        blocked = err?.name === 'TimeoutError' ? 'timed out' : (err?.message || 'request failed')
      }

      const uniqueChain = [...new Set(chain)]
      for (const o of uniqueChain) origins.add(o)
      lines.push(
        blocked
          ? `⚠ ${rawUrl} — ${blocked}; allowing origin from the URL only: ${uniqueChain.join(' → ')}`
          : uniqueChain.length > 1
            ? `↪ ${rawUrl} — redirects: ${uniqueChain.join(' → ')} (allow ALL of these)`
            : `✓ ${rawUrl} — no redirect, origin: ${uniqueChain[0]}`
      )
    }

    const config = [...origins].map(o => `'${o}'`).join(', ')
    lines.push('')
    lines.push('Ready to paste:')
    lines.push('```js')
    lines.push(`csp: {`)
    lines.push(`  '${directive}': [${[...origins].map(o => `'${o}'`).join(', ')}],`)
    lines.push(`}`)
    lines.push('```')
    if (config.includes('http://')) lines.push('⚠ An origin resolved to plain http: — use https URLs in production.')

    return text(lines.join('\n'))
  }
)

server.registerTool(
  'pulse_check_contrast',
  {
    description: `Static WCAG contrast checker. Provide theme CSS content (or a file path) and it extracts all color variable definitions, then checks common foreground/background pairings for WCAG AA compliance (4.5:1 for normal text, 3:1 for large text and UI components).

Run this immediately after writing a theme file — before production build and Lighthouse. It catches palette mistakes in milliseconds instead of after a 90-second build cycle.`,
    inputSchema: {
      css:     z.string().optional().describe('CSS content to analyse — paste the contents of your theme file'),
      file:    z.string().optional().describe('Absolute path to a CSS file to analyse (alternative to css)'),
      theme:   z.enum(['light', 'dark']).optional().describe('Which theme context to analyse — determines which CSS block to parse (default: both)'),
    },
  },
  ({ css, file, theme }) => {
    let source = css || ''

    if (!source && file) {
      if (!fs.existsSync(file)) return text(`File not found: ${file}`)
      source = fs.readFileSync(file, 'utf8')
    }

    if (!source) return text('Provide either css content or a file path.')

    // Extract CSS custom property definitions from all relevant blocks
    // Look in :root, [data-theme="light"], and .ui-theme-light blocks
    const extractVars = (cssText, blockPattern) => {
      const vars = {}
      const blockRegex = new RegExp(blockPattern + '\\s*\\{([^}]+)\\}', 'gi')
      let block
      while ((block = blockRegex.exec(cssText)) !== null) {
        const body = block[1]
        const propRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|var\(--[\w-]+\)|[a-z]+)\s*;/gi
        let prop
        while ((prop = propRegex.exec(body)) !== null) {
          vars[`--${prop[1]}`] = prop[2].trim()
        }
      }
      return vars
    }

    // NOTE: alternations must be wrapped in a non-capturing group. An ungrouped
    // pattern (a|b) followed by '\\s*\\{...' binds the body matcher to the second
    // alternative only — [data-theme="light"] blocks then match the selector
    // alone with no body capture, silently returning zero variables.
    const rootVars  = extractVars(source, ':root')
    const lightVars = extractVars(source, '(?:\\[data-theme=["\']light["\']\\]|[.]ui-theme-light)')

    // pulse-ui.css maps --NAME → --ui-NAME (e.g. --accent → --ui-accent).
    // Theme files written per the guide define bare --* tokens. Synthesize the
    // --ui-* entries so the checker can resolve them without needing pulse-ui.css.
    const UI_ALIASES = ['text','bg','muted','accent','accent-text','surface','surface-2','border','heading']
    const addAliases = (vars) => {
      for (const name of UI_ALIASES) {
        if (vars[`--${name}`] && !vars[`--ui-${name}`]) {
          vars[`--ui-${name}`] = vars[`--${name}`]
        }
      }
    }
    addAliases(rootVars)
    addAliases(lightVars)

    const resolveColor = (value, varMap) => {
      if (!value) return null
      if (value.startsWith('#')) return hexToLuminance(value)
      if (value.startsWith('var(')) {
        const ref = value.match(/var\(--([\w-]+)\)/)?.[1]
        if (ref && varMap[`--${ref}`]) return resolveColor(varMap[`--${ref}`], varMap)
      }
      return null
    }
    
    const resolveToHex = (value, varMap) => {
      if (!value) return null
      if (value.startsWith('#')) return value
      if (value.startsWith('var(')) {
        const ref = value.match(/var\(--([\w-]+)\)/)?.[1]
        if (ref && varMap[`--${ref}`]) return resolveToHex(varMap[`--${ref}`], varMap)
      }
      return null
    }

    // Standard pairings to check — [foreground token, background token, label, isLargeText]
    // isLargeText=true → WCAG AA large text threshold (3:1); isLargeText=false → body text (4.5:1)
    // Muted text is checked at both thresholds: body text pairings always need 4.5:1.
    // When a muted pairing fails 4.5:1 but passes 3:1, the warning distinguishes the two
    // so designers know it can be used for captions/eyebrows (large) but not body copy (small).
    const PAIRINGS = [
      ['--ui-text',         '--ui-bg',       'Body text on page background',                                false],
      ['--ui-muted',        '--ui-bg',       'Muted/secondary text on page background (body size)',        false],
      ['--ui-muted',        '--ui-bg',       'Muted text on page background (large text / captions)',      true],
      ['--ui-accent',       '--ui-bg',       'Accent text on page background',                             false],
      ['--ui-text',         '--ui-surface',  'Body text on card/surface',                                  false],
      ['--ui-muted',        '--ui-surface',  'Muted text on card/surface (body size)',                     false],
      ['--ui-muted',        '--ui-surface',  'Muted text on card/surface (large text / captions)',         true],
      ['--ui-accent-text',  '--ui-accent',   'Button text on accent background',                           false],
      ['--ui-accent',       '--ui-surface',  'Accent text on surface',                                     false],
      ['--ui-text',         '--ui-surface-2','Text on nested surface',                                     false],
    ]

    const checkSet = (vars, context) => {
      const results = []
      for (const [fg, bg, label, isLarge] of PAIRINGS) {
        const fgVal = vars[fg]
        const bgVal = vars[bg]
        if (!fgVal || !bgVal) continue

        const fgLum = resolveColor(fgVal, vars)
        const bgLum = resolveColor(bgVal, vars)
        if (fgLum === null || bgLum === null) continue
        
        const fgHex = resolveToHex(fgVal, vars)
        const bgHex = resolveToHex(bgVal, vars)

        const ratio = contrastRatio(fgLum, bgLum)
        const threshold = isLarge ? 3.0 : 4.5
        const pass = ratio >= threshold
        const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'FAIL'

        results.push({
          context, label,
          fg: fg + ' (' + fgVal + ')',
          bg: bg + ' (' + bgVal + ')',
          fgHex,
          bgHex,
          bgLum,
          ratio: ratio.toFixed(2),
          pass,
          level,
          threshold,
        })
      }
      return results
    }

    const allResults = []

    if (!theme || theme === 'dark') {
      const combined = { ...rootVars }
      allResults.push(...checkSet(combined, 'Dark theme (:root)'))
    }
    if (!theme || theme === 'light') {
      if (Object.keys(lightVars).length > 0) {
        const combined = { ...rootVars, ...lightVars }
        allResults.push(...checkSet(combined, 'Light theme ([data-theme="light"])'))
      }
    }

    if (allResults.length === 0) {
      // Try to cross-reference app.css to extract real-world color pairings
      // (e.g. --color-text on --color-bg used in body { color: var(--color-text); background: var(--color-bg) })
      const appCssPath = path.join(ROOT, 'public', 'app.css')
      let appCssHints = ''
      if (fs.existsSync(appCssPath)) {
        try {
          const appCss = fs.readFileSync(appCssPath, 'utf8')
          const varRefs = [...appCss.matchAll(/var\(--([\w-]+)\)/g)].map(m => `--${m[1]}`)
          const uniqueRefs = [...new Set(varRefs)]
          const unknownToChecker = uniqueRefs.filter(v =>
            !v.startsWith('--ui-') &&
            (Object.keys(rootVars).some(k => k === v) || Object.keys(lightVars).some(k => k === v))
          )
          if (unknownToChecker.length > 0) {
            appCssHints = `\n\napp.css uses these custom tokens that the checker couldn't auto-map to --ui-* pairings:\n  ${unknownToChecker.join(', ')}\n\nTo check these, add explicit --ui-* aliases in your theme file:\n  :root { --ui-text: var(--color-text); --ui-bg: var(--color-bg); }\nOr run this tool with theme.css content that includes --ui-text/--ui-bg definitions.`
          }
        } catch { /* ignore */ }
      }

      return text(`⚠ CHECKED 0 PAIRINGS — this is NOT "all clear". The checker found no colour variable pairs to test.\n\nThis typically means your theme uses custom token names (e.g. --color-text, --color-sunburst) rather than --ui-text / --ui-bg. The checker auto-maps bare tokens (--text, --bg, --accent, --muted, --surface, --border, --heading, --accent-text) but NOT arbitrary custom names.\n\nThe checker looked for --ui-* token pairs (e.g. --ui-text, --ui-bg, --ui-accent). Make sure variables are inside a :root { } or [data-theme="light"] { } block.\n\nYou must check contrast manually (e.g. via WebAIM) or alias your tokens:\n  :root { --ui-text: var(--color-text); --ui-bg: var(--color-bg); }\n\nDo NOT skip contrast checking and proceed to Lighthouse — 11 contrast failures have been caught at Lighthouse stage after a 0-pairing result here.${appCssHints}`)
    }

    const failures = allResults.filter(r => !r.pass)
    const passes   = allResults.filter(r => r.pass)

    const lines = [`# Contrast check — ${failures.length} failure${failures.length !== 1 ? 's' : ''}, ${passes.length} pass${passes.length !== 1 ? 'es' : ''}\n`]

    if (failures.length > 0) {
      lines.push('## ✗ Failures (must fix before shipping)\n')
      for (const r of failures) {
        lines.push(`**${r.label}** — ${r.context}`)
        lines.push(`  ${r.fg}  on  ${r.bg}`)
        lines.push(`  Ratio: ${r.ratio}:1  ·  Needed: ${r.threshold}:1  ·  Level: ${r.level}`)

        // Distinguish between body and large-text failures for --ui-muted
        if (r.label.includes('large text') || r.label.includes('captions')) {
          lines.push(`  Context: large text / captions (3:1 threshold) — fails even the relaxed threshold.`)
        } else if (r.label.includes('body size') || r.threshold === 4.5) {
          lines.push(`  Context: body text (4.5:1 threshold) — only use this colour for large text (≥18pt / ≥14pt bold) or decorative elements, not for body copy or captions.`)
        }

        // Suggest a corrected hex value
        if (r.fgHex && r.bgLum !== null) {
          const suggested = suggestContrastFix(r.fgHex, r.bgLum, r.threshold)
          if (suggested) {
            lines.push(`  Suggested fix: use ${suggested} instead of ${r.fgHex}`)
          }
        }
        lines.push('')
      }
    }

    if (passes.length > 0) {
      lines.push('## ✓ Passing\n')
      for (const r of passes) {
        lines.push(`✓ ${r.level}  ${r.ratio}:1  —  ${r.label} (${r.context})`)
      }
      lines.push('')
    }

    if (failures.length > 0) {
      lines.push('---')
      lines.push('**Fix guidance:**')
      lines.push('• **WCAG AA thresholds:** 4.5:1 for body text (≤18pt regular / ≤14pt bold); 3:1 for large text (≥18pt / ≥14pt bold), UI components, and decorative elements.')
      lines.push('• Mid-tone accents on near-white backgrounds often fail 4.5:1. Darken the accent token or use it only for large text/icons (3:1 threshold).')
      lines.push('• For `--ui-muted` "body size" failures: muted text on `--ui-bg` needs 4.5:1 for body copy. If you only use this colour for eyebrows, captions, or large labels (≥18pt), the 3:1 "large text" row is the relevant gate — check whether that row passes.')
      lines.push('• Light-theme `--ui-accent` must be distinctly darker than the page background — many default accent hues are too light.')
      lines.push('• After fixing, run this tool again before `pulse_build`.')
    }

    return text(lines.join('\n'))
  }
)

// ---------------------------------------------------------------------------
// pulse_update
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_update',
  {
    description: 'Install the latest @invisibleloop/pulse package (skipped if npm-linked), then re-copy pulse-ui.css, pulse-ui.js, and the agent checklist into public/. One command does the full upgrade.',
    inputSchema: {},
  },
  async () => {
    // 1. npm install latest — but only if the package is NOT npm-linked.
    //    An npm link is a symlink in node_modules. Installing @latest over a
    //    link downgrades the project to the published version even when the
    //    developer has a newer local build linked. Detect the symlink and skip.
    const { execSync } = await import('child_process')
    const pkgDir = path.join(ROOT, 'node_modules', '@invisibleloop', 'pulse')
    const isLinked = fs.existsSync(pkgDir) && fs.lstatSync(pkgDir).isSymbolicLink()

    if (!isLinked) {
      try {
        execSync('npm install @invisibleloop/pulse@latest', { cwd: ROOT, stdio: 'pipe' })
      } catch (e) {
        return text(`npm install failed:\n${e.stderr?.toString() || e.message}`)
      }
    }

    // 2. Copy assets from the package in node_modules (installed or linked).
    const pkgPublic  = path.join(ROOT, 'node_modules', '@invisibleloop', 'pulse', 'public')
    const publicDir  = path.join(ROOT, 'public')
    const assets     = ['pulse-ui.css', 'pulse-ui.js', '.pulse-ui-version']
    const updated    = []

    fs.mkdirSync(publicDir, { recursive: true })
    for (const asset of assets) {
      const src = path.join(pkgPublic, asset)
      const dst = path.join(publicDir, asset)
      if (fs.existsSync(src)) { fs.copyFileSync(src, dst); updated.push(`public/${asset}`) }
    }

    const checklistSrc = path.join(ROOT, 'node_modules', '@invisibleloop', 'pulse', 'src', 'agent', 'checklist.md')
    const checklistDst = path.join(ROOT, '.claude', 'pulse-checklist.md')
    if (fs.existsSync(checklistSrc)) {
      fs.mkdirSync(path.dirname(checklistDst), { recursive: true })
      fs.copyFileSync(checklistSrc, checklistDst)
      updated.push('.claude/pulse-checklist.md')
    }

    const versionFile = path.join(publicDir, '.pulse-ui-version')
    const version     = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : '?'
    return text(`Pulse updated to v${version}\n\n${updated.map(f => `✓ ${f}`).join('\n')}`)
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Poll until the HTTP server on the given port accepts a connection, or timeout. */
async function waitForServer(port, maxMs = 10_000) {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const alive = await new Promise(resolve => {
      const req = http.get(`http://localhost:${port}/`, { timeout: 500 }, res => {
        res.resume()
        resolve(true)
      })
      req.on('error',   () => resolve(false))
      req.on('timeout', () => { req.destroy(); resolve(false) })
    })
    if (alive) return true
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

function findComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) return []
  return fs.readdirSync(COMPONENTS_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => ({ name: path.basename(f, '.js'), filePath: path.join(COMPONENTS_DIR, f) }))
}

function derivedRouteFromName(name) {
  const parts = name.replace(/\.js$/, '').split('/')
  const last  = parts[parts.length - 1]
  if (last === 'index' || last === 'home') parts.pop()
  if (parts.length === 0) return '/'
  return '/' + parts.join('/')
}

function text(str) {
  return { content: [{ type: 'text', text: str }] }
}

// ---------------------------------------------------------------------------
// Shared agent files — single source of truth for identity, guide, checklist
// ---------------------------------------------------------------------------

const IDENTITY        = fs.readFileSync(new URL('../agent/identity.md',          import.meta.url), 'utf8')
const WORKFLOW        = fs.readFileSync(new URL('../agent/workflow.md',           import.meta.url), 'utf8')
const CHECKLIST       = fs.readFileSync(new URL('../agent/checklist.md',         import.meta.url), 'utf8')
const GUIDE_SPEC      = fs.readFileSync(new URL('../agent/guide-spec.md',        import.meta.url), 'utf8')
const GUIDE_SERVER    = fs.readFileSync(new URL('../agent/guide-server.md',      import.meta.url), 'utf8')
const GUIDE_STYLES    = fs.readFileSync(new URL('../agent/guide-styles.md',      import.meta.url), 'utf8')
const GUIDE_ROUTING   = fs.readFileSync(new URL('../agent/guide-routing.md',     import.meta.url), 'utf8')
const GUIDE_COMPONENTS = fs.readFileSync(new URL('../agent/guide-components.md', import.meta.url), 'utf8')
const GUIDE_EXAMPLES   = fs.readFileSync(new URL('../agent/guide-examples.md',   import.meta.url), 'utf8')
const GUIDE_TEMPLATES    = fs.readFileSync(new URL('../agent/guide-templates.md', import.meta.url), 'utf8')
const GUIDE_DESIGN_REF   = fs.readFileSync(new URL('../agent/guide-design-references.md', import.meta.url), 'utf8')
const GUIDE_DESIGN_GALL  = fs.readFileSync(new URL('../agent/guide-design-gallery.md', import.meta.url), 'utf8')
const GUIDE_EXPLORE      = fs.readFileSync(new URL('../agent/guide-explore.md', import.meta.url), 'utf8')

// ---------------------------------------------------------------------------
// The Persona — CLI-specific identity header + shared identity content
// ---------------------------------------------------------------------------

const PULSE_PERSONA = `# Who You Are

You are a Pulse AI. You build exclusively with Pulse.

Every page you create is a Pulse spec. Every interaction is a mutation or an action. Every UI element comes from \`@invisibleloop/pulse/ui\`. You do not reach for React, Vue, Alpine, htmx, Tailwind, or any other framework or utility library — not because you cannot, but because Pulse already solves what they solve, with stronger guarantees and fewer moving parts.

You are not a general-purpose web developer who happens to know Pulse. Pulse is your entire world. When a user asks for a page, a form, a dashboard, a landing page — you build it in Pulse. The spec is your medium.

You follow the Pulse guide for all technical decisions. The guide is split into topic resources — fetch \`pulse://guide\` for the index, then fetch the specific section you need (\`pulse://guide/spec\`, \`pulse://guide/components\`, etc.). Do not guess — if you are unsure about a prop, pattern, or rule, fetch the relevant guide section first.

${IDENTITY}
`

// ---------------------------------------------------------------------------
// The Guide — index + tools reference (topic content split into sub-resources)
// ---------------------------------------------------------------------------

const PULSE_GUIDE_INDEX = `# Pulse Framework Guide

## Start here

**Fetch \`pulse://start\` first.** It detects your context (new project, new page, edit, or bug fix) and returns exactly what you need — no upfront decision tree.

If you know your context already:
- New page / new site → \`pulse://workflow\`
- Edit, fix, or one-shot build → \`pulse://quickstart\`

## Guide resources

| Resource | When to fetch |
|---|---|
| \`pulse://start\` | **Always fetch first** — context-aware entry point that routes you to the right resources |
| \`pulse://quickstart\` | **Editing, bug-fixing, or a simple one-shot build** — workflow + spec skeleton + components + theming in one fetch. Skip the 4-resource cold-start for targeted tasks. |
| \`pulse://workflow\` | **New project or new page** — full phase/gate sequence before writing any code. |
| \`pulse://guide/spec\` | Building a spec — state, mutations, actions, streaming SSR, key rules, form layout |
| \`pulse://guide/server\` | Server data, global store, persist, cookies, redirects, POST handling |
| \`pulse://guide/styles\` | CSS tokens, theming, custom fonts, utility classes |
| \`pulse://guide/routing\` | Navigation, page discovery, dynamic routes |
| \`pulse://guide/components\` | All UI components, icons, charts, composition patterns |
| \`pulse://guide/examples\` | Complete working page examples |
| \`pulse://guide/templates\` | **Fetch when asked to build a landing page or branded template.** Pre-build questions, template inventory, adaptation rules, theme CSS patterns. |
| \`pulse://guide/design-references\` | **Fetch when choosing a design aesthetic.** 12 design directions with vibes, component combos, palette patterns, and signature moves. Use at intake time to pick the right direction, not SaaS-by-default. |
| \`pulse://guide/design-gallery\` | **Fetch when adapting a template or combining components.** All 6 templates with visual descriptions + key components. Critical prop-name reference (content vs children, name vs author, etc.). Component recipes: image card, article card, stat strip, booking form. |
| \`pulse://guide/explore\` | **Fetch when you want a distinctive or unusual layout.** Zone-based layout thinking, 7 structural gestures (full-bleed, asymmetric, typography-only, editorial, dense grid, story scroll, content-first), raw HTML patterns with zero components, CSS token reference, anti-pattern checklist. |

## Tools available

**Pulse MCP tools** (always available):
- \`pulse_extract_inspiration(source, focus?)\` — **Extract a structured design brief from a URL, image, or a named site you actually have real knowledge of.** Call this when the user shares a website URL, pastes/attaches an inspiration image, or names a site well-known enough that you can describe its real design (not just its existence). A name alone with no URL, no image, and no genuine knowledge of what it looks like isn't an inspiration source — skip this tool and go straight to \`pulse_intake\` with what the user actually described. Returns a structured extraction template — you fill it in using your browsing or vision tools, then feed the results into pulse_intake. Maps directly to palette, vibe, styleNotes, and font fields. **Always check \`public/intake/\` for images at the start of a new build — if any exist, call this before pulse_intake.**
- \`pulse_intake(name, pitch, features, targetUser?, palette?, font?, theme?, vibe?, styleNotes?, antiStyle?, inspiration?)\` — **Capture product details before scaffolding.** Run this first for any new project or branded template — before pulse_sketch or pulse_intent. **Gather answers by asking the user one free-form question at a time — never use multi-choice lists for open-ended intake questions.** The final intake question must always be: "Do you have any design inspiration — a site you love, a screenshot, or a mood board? Drop images into \`public/intake/\` or share a URL." If the user provides references, call \`pulse_extract_inspiration\` before proceeding. After intake, call pulse_sketch to explore structural directions before writing code.
- \`pulse_sketch(brief, vibe?, antiStyle?, pageType?)\` — **Generate 3 structurally distinct layout directions before writing any code.** Call after pulse_intake. Returns three named directions (full-bleed, asymmetric split, typography-only, editorial flow, dense grid, story scroll, content-first) with wireframes, key decisions, and component strategies. Prevents defaulting to "centred hero + three columns" on every project. After choosing a direction, fetch \`pulse://guide/explore\` for raw HTML patterns.
- \`pulse_intent(description)\` — Describe what you want to build in plain language and get back a matched archetype, component recommendations, a ready-to-adapt spec scaffold, and which guides to read. Use after pulse_intake and pulse_sketch, before fetching guides.
- \`pulse_suggest(content)\` — **Draft-mode feedback.** Paste a partial or complete spec and get constructive, non-blocking suggestions: missing pieces, likely omissions, component upgrades, empty-state reminders. A collaborator, not a gate. **Use after first draft** (after writing, before hard validation) — not just when something feels wrong.
- \`pulse_create_tests(file)\` — **Generate a starter test file** for a spec. Stubs out the formulaic cases: null data, empty arrays, XSS injection, view landmarks, mutations, action onStart/onError, and onViewError. Search for "TODO" in the output and fill in real assertions. Covers 100% branch coverage requirements without hand-writing the boilerplate.
- \`pulse_list_icons(filter?)\` — **List all available icon names grouped by category.** Always call this before importing icons — never guess a name or grep source files. Optional filter keyword narrows results (e.g. filter: "arrow").
- \`pulse_check_contrast(css?, file?, theme?)\` — **Static WCAG contrast check.** Provide theme CSS content or a file path; it checks all token color pairings against WCAG AA thresholds (4.5:1 normal text, 3:1 large text/UI). Run immediately after writing a theme file — before pulse_build and Lighthouse. Catches palette mistakes in milliseconds.
- \`pulse_tokens\` — **List all --ui-* CSS tokens** from the installed pulse-ui.css, grouped by category (colour, spacing, type-size, typography, shape). Call before writing theme overrides to avoid guessing names. Reminder: set \`--accent\` (no prefix) in theme.css — pulse-ui maps it to \`--ui-accent\` automatically.
- \`pulse_status\` — **Project health snapshot.** Returns page count, routes, dev server status, last build age, and pulse-ui version check. Call at the start of a session to orient quickly without reading files.
- \`pulse_list_structure\` — list pages, components, and pulse-ui version. Call at the start of every session.
- \`pulse_validate\` — validate spec content. Call after every write. Fix all errors AND warnings.
- \`pulse_review(file, { quick? })\` — **Two modes.** Default: full review gate (call after Lighthouse + tests pass). Pass \`quick: true\` for a lightweight mid-build structural check — no Lighthouse, just catches obvious issues (missing main landmark, data-event on inputs, missing onError, hex colours, component pattern violations). Use quick mid-build after \`pulse_suggest\`. **Full mode only after validate, Lighthouse (desktop + mobile), and tests all pass.**
- \`pulse_create_page\` — validate a page spec you already wrote to disk. **Always write the file with the Write tool first, then call this.** Never pass content to this tool.
- \`pulse_create_component\` — register a component you wrote with the Write tool. Write the file first, then call this.
- \`pulse_create_store\` — register a pulse.store.js you wrote with the Write tool. Write the file first, then call this.
- \`pulse_create_action\` — generate a correctly-structured action snippet.
- \`pulse_run_tests\` — run the project test suite (npm test). Use after writing or editing specs.
- \`pulse_stamp\` — write the \`.pulse-verified\` stamp. Call as the **last step** of \`/verify\`, after Lighthouse and \`pulse_review\` both pass. Using this MCP tool avoids the mtime race that \`date +%s > .pulse-verified\` can cause when the stamp and the last spec write land in the same filesystem second.
- \`pulse_fetch_page(url)\` — HTTP GET the dev server URL. Use to verify SSR output.
- \`pulse_restart_server\` — hot-reload specs in the running dev server (~200 ms). Falls back to full kill/restart if the server is not running.
- \`pulse_build\` — production build + starts prod server on devPort+1 for Lighthouse. Returns the URL. Call \`pulse_restart_server\` after to return to dev. **Slow — takes 30–60 s. Tell the user before calling.**
- \`pulse_check_bundles\` — inspects what's actually inside the generated \`public/dist/\` bundles after \`pulse_build\`, not just their sizes. Flags a boot bundle that exists for a page with no mutations/actions/persist (should ship zero JS), and a literal Node built-in reference inside a bundle (server-only code that leaked through stripping). Lighthouse checks scores; this checks content — call it as part of the full \`/verify\` pass, right after \`pulse_build\`.
- \`pulse_check_version\` — check installed package version, static asset version, and latest on npm. Use this instead of running npm commands when the user asks about updates.
- \`pulse_update\` — install the latest \`@invisibleloop/pulse\` package and re-copy \`pulse-ui.css\`, \`pulse-ui.js\`, and the agent checklist into \`public/\`. One command does the full upgrade.

**Chrome DevTools MCP tools** (globally available):
- \`mcp__chrome-devtools__take_screenshot\` — visual screenshot of the page.
- \`mcp__chrome-devtools__list_console_messages\` — browser console output including errors.
- \`mcp__chrome-devtools__list_network_requests\` — network requests, including 404s.
- \`mcp__chrome-devtools__lighthouse_audit\` — Lighthouse scores and failing audits. **Slow — takes 30–60 s per run (×2 for desktop + mobile). Tell the user before calling.**
- \`mcp__chrome-devtools__navigate_page\` — navigate the browser to a URL.
- \`mcp__chrome-devtools__list_pages\` — list all open browser pages/tabs. Returns an array of objects each with a numeric \`id\` field.
- \`mcp__chrome-devtools__close_page\` — close a page by its numeric ID. **CRITICAL: \`pageId\` must be a JSON number, not a string. \`{ pageId: 2 }\` is correct. \`{ pageId: "2" }\` will fail with a type error.** Take the \`id\` value from \`list_pages\` and pass it unquoted.

## MANDATORY: Verify every build

**After writing or editing any page spec, you MUST run \`/verify\` or \`/verify --quick\` before declaring done.**

**Choose the right mode:**
- \`/verify --quick\` — use during active building and iteration. Runs: validate → screenshot → console check → code review → stamp. No Lighthouse, no production build. Fast (~10 s). Use this between every round of changes.
- \`/verify\` (full) — use when the user signals they're done or happy with the result. Runs everything: validate → screenshot → production build → Lighthouse desktop → Lighthouse mobile → performance trace → console check → code review → stamp. Slow (~90 s). Run this once at the end.

The stop hook checks the \`.pulse-verified\` stamp — \`/verify --quick\` writes the stamp too, so it satisfies the hook for mid-build turns. The full \`/verify\` is required before the final commit.

**Do not replicate \`/verify\` steps manually.** Running the individual tools yourself does not write the stamp. The agent will be blocked at the end regardless.

**RULE: NEVER run \`lighthouse_audit\` against the dev server.** Dev mode serves unminified source files — scores are meaningless. \`/verify\` handles this correctly by calling \`pulse_build\` first.

**Before calling any slow tool (\`pulse_build\`, \`lighthouse_audit\`), output a short status message to the user.** Example: "Building for production — this takes ~30 s…". Do not call slow tools silently.

${CHECKLIST}`

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
