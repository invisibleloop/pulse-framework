#!/usr/bin/env node
/**
 * Pulse MCP Server
 *
 * Provides tools and resources for an AI agent working inside a Pulse project.
 *
 * Resources:
 *   pulse://guide   — complete guide: spec format, UI components, CSS rules, patterns
 *
 * Tools:
 *   pulse_intent         — intent engine: describe what to build, get archetype + scaffold
 *   pulse_suggest        — draft-mode contextual feedback on partial specs
 *   pulse_intake         — product intake: capture app details before scaffolding
 *   pulse_sketch         — generate 3 structural layout directions before writing code
 *   pulse_list_icons     — list all available icon names, grouped by category
 *   pulse_check_contrast — static WCAG contrast check on theme CSS colors
 *   pulse_list_structure — list all pages and components
 *   pulse_create_page    — create a new page spec with proper template
 *   pulse_create_component — create a reusable component
 *   pulse_validate       — validate a spec against the schema
 *   pulse_check_version  — installed vs static vs npm latest
 *   pulse_update         — re-copy pulse-ui assets from package → public/
 */

import { McpServer }           from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z }                   from 'zod'

import path                      from 'path'
import fs                        from 'fs'
import http                      from 'http'
import { execFileSync, spawn, spawnSync } from 'child_process'

import { loadPages } from '../cli/discover.js'

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

const rootArg = process.argv.indexOf('--root')
const ROOT    = rootArg !== -1
  ? path.resolve(process.argv[rootArg + 1])
  : process.cwd()

const PAGES_DIR      = path.join(ROOT, 'src', 'pages')
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components')

const PKG_VERSION = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8')
).version

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
    
    if (file) {
      if (!fs.existsSync(file)) {
        return text(`File not found: ${file}`)
      }
      content = fs.readFileSync(file, 'utf8')
    }
    
    return validateContent(content)
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
    const validation = await validateContent(content)
    if (validation.content[0].text.startsWith('Invalid')) return validation

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
        resolve(text(`HTTP ${res.statusCode}\n\n${body.slice(0, 8000)}`))
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
    description: 'Stop and restart the Pulse dev server. Use after adding new pages or making changes that require a restart.',
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

    // Kill any process on the port
    try { execFileSync('sh', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null; true`]) } catch { /* nothing running */ }

    // Start fresh dev server detached so it outlives the MCP tool call
    const devScript = new URL('../cli/dev.js', import.meta.url).pathname
    const proc = spawn(process.execPath, [devScript, '--root', ROOT], { detached: true, stdio: 'ignore' })
    proc.unref()

    // Wait until the server is actually accepting requests
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

    // Kill anything on prodPort
    try { execFileSync('sh', ['-c', `lsof -ti:${prodPort} | xargs kill -9 2>/dev/null; true`]) } catch { /* ok */ }

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
// pulse_review
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_review',
  {
    description: `Switch into reviewer mode and critically examine a page spec you just built.
Reads the spec source, renders the view with initial state, runs all validation checks,
and returns a structured review brief. You must read everything carefully, find every
issue, and fix them all before reporting back to the user. Use this after completing
any feature build.`,
    inputSchema: {
      file: z.string().optional().describe('Absolute path to the spec file to review'),
      content: z.string().optional().describe('JavaScript spec content to review (alternative to file)'),
    },
  },
  async ({ file, content }) => {
    if (!file && !content) {
      return text('Error: must provide either file or content')
    }
    if (file && content) {
      return text('Error: provide only one of file or content, not both')
    }

    let source = content
    if (file) {
      if (!fs.existsSync(file)) return text(`File not found: ${file}`)
      source = fs.readFileSync(file, 'utf8')
    }

    // Run the validator in a child process (same as pulse_validate)
    let validationResult = '(could not run validator)'
    if (file) {
      const validatorScript = new URL('./validate-worker.js', import.meta.url).pathname
      try {
        validationResult = execFileSync(process.execPath, [validatorScript, file], {
          timeout: 10_000,
          encoding: 'utf8',
        }).trim()
      } catch (err) {
        validationResult = err.stdout?.trim() || err.message
      }
    } else {
      // Content-only mode — write to temp file and validate
      const tmpFile = path.join(os.tmpdir(), `pulse-review-${Date.now()}.js`)
      fs.writeFileSync(tmpFile, source, 'utf8')
      const validatorScript = new URL('./validate-worker.js', import.meta.url).pathname
      try {
        validationResult = execFileSync(process.execPath, [validatorScript, tmpFile], {
          timeout: 10_000,
          encoding: 'utf8',
        }).trim()
      } catch (err) {
        validationResult = err.stdout?.trim() || err.message
      } finally {
        try { fs.unlinkSync(tmpFile) } catch {}
      }
    }

    // Try to render the view with initial state
    let renderedHtml = ''
    let renderNote = ''
    try {
      const mod  = await import(`${file}?review=${Date.now()}`)
      const spec = mod.default
      if (spec && typeof spec.view === 'function') {
        renderedHtml = spec.view(spec.state || {}, {})
      } else if (spec && typeof spec.view === 'object') {
        const segments = Object.entries(spec.view)
          .map(([k, fn]) => `<!-- segment: ${k} -->\n${typeof fn === 'function' ? fn(spec.state || {}, {}) : ''}`)
          .join('\n')
        renderedHtml = segments
        renderNote = '(streamed spec — segments rendered individually)'
      }
    } catch {
      renderNote = '(view could not be rendered — may depend on server data)'
    }

    return text(`# Pulse Code Review

You are now a **senior code reviewer**. Read the spec, find every problem, and fix them all before reporting back.

---

## Validator output

${validationResult}

${validationResult.includes('✓') ? '' : `
## Spec source (validation failed — showing for debugging)

\`\`\`js
${source}
\`\`\`
`}

${renderNote.includes('could not') ? `
## Render error

${renderNote}

\`\`\`js
${source}
\`\`\`
` : ''}

---

## Auto-checked items

${(() => {
  const checks = []
  
  // Check rendered HTML
  if (renderedHtml) {
    // Positive tabindex
    const posTabindex = /tabindex=["']?([1-9]\d*)/.test(renderedHtml)
    checks.push(posTabindex ? '✗ **Positive tabindex found** — remove tabindex > 0, reorder DOM instead' : '✓ No positive tabindex')
    
    // data-event on input
    const dataEventInput = /<input[^>]*data-event/.test(renderedHtml)
    checks.push(dataEventInput ? '✗ **data-event on <input>** — this destroys focus on every keystroke' : '✓ No data-event on text inputs')
    
    // React patterns
    const reactPatterns = /(className|htmlFor|onClick)=/.test(renderedHtml)
    checks.push(reactPatterns ? '✗ **React patterns found** — use class, for, data-event instead' : '✓ No React patterns (className/htmlFor/onClick)')
    
    // Emoji in HTML
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    const hasEmoji = emojiRegex.test(renderedHtml)
    checks.push(hasEmoji ? '✗ **Emoji in HTML** — use icon components or aria-label instead' : '✓ No emoji in view HTML')
    
    // Main landmark
    const hasMain = /<main[^>]*id=["']?main-content/.test(renderedHtml)
    checks.push(hasMain ? '✓ <main id="main-content"> present' : '✗ **Missing main landmark** — add <main id="main-content">')
  }
  
  // Check spec source
  // Hex colours in view (rough check — may have false positives from comments)
  const hexInView = /#[0-9a-fA-F]{3,6}/.test(source) && source.includes('view:')
  if (hexInView) {
    checks.push('⚠ **Possible hex colour in view** — use var(--ui-*) tokens only')
  } else {
    checks.push('✓ No obvious hex colours in view')
  }
  
  return checks.join('\n')
})()}

---

## Review checklist

Work through every item. Fix anything that fails. Refer to the spec source at ${file} as needed — do not ask me to paste it.

### Structure
- [ ] \`route\` is set explicitly — not left to auto-discovery
- [ ] \`hydrate\` is NOT set manually — the framework injects it automatically. Remove it if present.
- [ ] \`state\` shape is consistent — no fields that flip between null/string/boolean
- [ ] \`meta.title\` is meaningful and unique to this page
- [ ] \`meta.description\` is a real description, not "Built with Pulse"

### Mutations & actions
- [ ] Every mutation returns a plain partial object — no side effects, no fetch, no DOM access
- [ ] \`constraints\` are used for bounds instead of conditional logic inside mutations
- [ ] \`disabled\` in the view matches the constraint bounds — but check: is it redundant with the constraint, or does it serve a UX purpose?
- [ ] Actions read user input from FormData in \`onStart\`, not from mirrored state
- [ ] \`onStart\` sets a loading status, \`onSuccess\`/\`onError\` resolve it
- [ ] A single \`status\` field is used instead of multiple boolean flags

### Components & HTML
- [ ] Components from the UI library are used — no hand-written \`<button>\`, \`<input>\`, \`<table>\` etc where a component exists
- [ ] **No reinvented component patterns** — if the view contains any of these class names, you MUST refactor to use the component:
  - \`.hero\`, \`.-hero\`, \`__hero\` → use \`hero()\` component
  - \`.card\`, \`.product-card\`, \`.service-card\` → use \`card()\` component  
  - Any two-column image + text layout → use \`media()\` component
  - \`.banner\`, \`.strip\`, \`.bar\` → use \`banner()\` component
  - \`.feature\`, \`.feature-card\` → use \`feature()\` component
  - \`.testimonial\` → use \`testimonial()\` component
  
  Grep the rendered HTML for these patterns. If found, rewrite using the component. Custom utility classes on top of components are fine (\`hero({ ... })\` + override CSS) — but do not write the entire structure from scratch.
- [ ] No \`data-event\` on text inputs — this destroys focus on every keystroke
- [ ] No \`className\`, \`htmlFor\`, \`onClick=\`, or other React patterns
- [ ] No hardcoded hex colours — only \`var(--ui-*)\` tokens
- [ ] No emoji in the view HTML
- [ ] **CTA must be wrapped in section/container** — grep the rendered HTML for \`<div class="ui-cta"\`. If it appears as a direct child of \`<main>\` or \`<div id="app">\` without a section or container wrapper, wrap it. CTA has no padding of its own.

### Accessibility
- [ ] \`<main id="main-content">\` is present
- [ ] Icon-only buttons have \`aria-label\`
- [ ] \`aria-live\` and \`aria-label\` are NOT on the same element
- [ ] Heading hierarchy is correct — no skipped levels, starts at h1
- [ ] Disabled state uses the \`disabled\` attribute, not just CSS or opacity
- [ ] **Keyboard focusability** — every element carrying \`data-event\`, \`data-store-event\`, \`data-dialog-open\`, or \`data-dialog-close\` is either a natively interactive element (\`button\`, \`a\`, \`input\`, \`select\`, \`textarea\`, \`summary\`) or has \`tabindex="0"\`. Scan the rendered HTML above — a \`<div>\`, \`<span>\`, \`<li>\`, or any other non-interactive tag with one of these attributes is a keyboard accessibility failure. Prefer \`<button>\` over a div + tabindex.
- [ ] **Purpose** — every interactive element has a clear accessible name. Buttons have visible text or \`aria-label\`. Links use descriptive text — flag generic labels ("click here", "here", "read more", "more"). Form inputs have an associated \`<label for="id">\` or \`aria-label\` — \`placeholder\` alone is not a label (it disappears on focus and is not read by all screen readers).
- [ ] **State** — interactive elements communicate their current state via ARIA:
  - Toggle controls (open/close, show/hide, expand/collapse) have \`aria-expanded="true|false"\` or \`aria-pressed="true|false"\`
  - While an action is running, the trigger button has \`aria-busy="true"\` or its visible label changes (e.g. "Saving…") — a spinner alone is not sufficient
  - Active navigation items have \`aria-current="page"\`
  - Selected items in a list, tab set, or option group have \`aria-selected="true"\`
- [ ] **Tab order** — scan the rendered HTML for these failures:
  - No \`tabindex\` value greater than 0. \`tabindex="1"\` and above override the natural DOM order and almost always create a broken, unpredictable tab sequence. The only valid values are \`0\` (add to natural order) and \`-1\` (remove from order). If you find a positive tabindex, remove it and reorder the DOM instead.
  - Off-screen or visually hidden interactive content is removed from the tab order. Elements that are hidden via CSS alone (e.g. \`opacity:0\`, \`visibility:hidden\` without \`display:none\`, off-canvas menus, collapsed panels) but remain in the DOM must have \`tabindex="-1"\` or \`inert\` so keyboard users cannot tab into invisible controls.
  - DOM order matches the visual reading order. When CSS flexbox \`order\` or grid placement is used to visually reposition elements, the tab sequence follows the DOM — not the visual layout. Ensure the DOM is authored in the order a sighted user would read and interact with the page.

### Defensive coding
- [ ] Any \`fetch\` in actions or server fetchers checks \`res.ok\` before calling \`.json()\`
- [ ] Fetch errors use the safe pattern — NOT \`throw new Error(await res.text())\` which exposes raw HTML in toasts:
  \`\`\`js
  if (!res.ok) {
    let message = \`Request failed: \${res.status}\`
    try { const j = await res.json(); message = j.message || j.error || message } catch {}
    throw new Error(message)
  }
  \`\`\`
- [ ] Optional chaining used for any data from external sources
- [ ] URL params validated before use
- [ ] \`onViewError\` defined if the view could crash on bad or missing data

---

Fix every issue you find. Then confirm what was changed.

**After confirming fixes: you are back in builder mode. Continue to the verification workflow — navigate to the page in the browser, take a screenshot, run Lighthouse desktop audit, run Lighthouse mobile audit. Do not stop at the review.**`)
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
    scaffold: `import { nav, stat, card, grid, barChart, table, section, container, badge, empty, spinner } from '@invisibleloop/pulse/ui'

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
    components:  ['nav', 'hero', 'feature', 'stat', 'pricing', 'testimonial', 'cta', 'footer', 'grid', 'section', 'container', 'button', 'appBadge'],
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
      \${hero({ title: 'Your headline here', subtitle: 'Supporting copy that explains the value.', gradient: 'purple',
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
    components:  ['nav', 'avatar', 'card', 'stat', 'badge', 'grid', 'section', 'container', 'button', 'timeline', 'prose'],
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
    components:  ['nav', 'pricing', 'feature', 'cta', 'accordion', 'footer', 'section', 'grid', 'button', 'badge'],
    description: 'Pricing page with plan comparison, feature lists, and upgrade CTA',
    stateHint:   "{ billing: 'monthly' } — for toggle between monthly/annual",
    serverHint:  'none — content is typically static',
    scaffold: `import { nav, pricing, cta, accordion, footer, section, container, button } from '@invisibleloop/pulse/ui'

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
        \${pricing({
          plans: [
            { name: 'Free',  price: '\$0',  period: 'forever', features: ['Feature A', 'Feature B'], cta: button({ label: 'Get started', variant: 'secondary' }) },
            { name: 'Pro',   price: '\$12', period: '/month',  features: ['Everything in Free', 'Feature C', 'Feature D'], featured: true, cta: button({ label: 'Start free trial' }) },
            { name: 'Team',  price: '\$49', period: '/month',  features: ['Everything in Pro', 'Feature E', 'Unlimited seats'], cta: button({ label: 'Contact sales', variant: 'secondary' }) },
          ]
        })}
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

Use this AFTER the initial screenshot but BEFORE Lighthouse. It catches layout issues (overflow, collapsed sections, broken images) that Lighthouse doesn't check and that are invisible at a single viewport width.

Call this as part of the Phase 5 browser check:
  screenshot → pulse_design_review → pulse_layout_review → Lighthouse`,
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
    description: `Extract a structured design brief from a URL or image the user has shared as inspiration.

Call this when the user says "I like the design of X", shares a URL, or pastes/attaches an image. It returns a structured extraction template that tells you exactly what to observe and capture. You then use your own browsing or vision tools to fill in the template, and feed the result into pulse_intake.

Works for:
- URLs: visit the site with your browser tool, observe the rendered page
- Images: use your vision capability to analyse the screenshot/photo the user shared
- Named references: use your knowledge of the brand/site to populate the template

The extracted values map directly to pulse_intake fields (palette, vibe, styleNotes, antiStyle, font).`,
    inputSchema: {
      source: z.string().describe('What to analyse — a URL (e.g. "https://stripe.com"), a site name (e.g. "linear.app"), or a description of an image the user shared (e.g. "the screenshot the user just pasted")'),
      focus:  z.enum(['all', 'colours', 'layout', 'typography', 'feel']).optional().describe('What aspect to focus on. Default is "all". Use "colours" if user specifically wants to extract a palette, "layout" for structural decisions, "typography" for font choices, "feel" for overall tone.'),
    },
  },
  ({ source, focus = 'all' }) => {
    const lines = []
    lines.push(`# Inspiration Extraction — ${source}\n`)
    lines.push('Use this template to systematically observe and capture design decisions from the inspiration source.')
    lines.push('Fill in every section you can observe. Leave a field blank if it cannot be determined.\n')
    lines.push('---\n')

    const isUrl = /^https?:\/\//.test(source) || /\.(com|io|co|app|design|net|org|dev)\b/.test(source)

    if (isUrl) {
      lines.push('## Step 1 — Visit the site')
      lines.push(`Navigate to: **${source}**`)
      lines.push('Observe the rendered page at desktop width (~1440px) and again at mobile (~375px).')
      lines.push('Take note of the above-the-fold area, then scroll through the full page.\n')
    } else {
      lines.push('## Step 1 — Analyse the source')
      lines.push(`Source: **${source}**`)
      lines.push('Use your vision capability or knowledge of this reference to fill in the template below.\n')
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
    lines.push('Then call `pulse_sketch` — pass the layout direction observed above as context in your `brief`.')

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
      theme:      z.enum(['light', 'dark']).optional().describe('Colour theme preference'),
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
        warm:       'Pair with rounded imagery (photoCard with tilt), warmer accent tones, section variant: paper or alt',
        editorial:  'Use layout: overlap on hero for dramatic imagery. Serif headings via --font-display. section variant: diagonal for transitions.',
        playful:    'gallery with rounded images, photoCard with tilt, marquee for social proof, bright accent',
        minimal:    'hero align: left (no center), section variant: spotlight, clean whitespace, monochrome palette',
        bold:       'hero gradient with strong color, large stat components, section variant: dark for contrast sections',
        brutalist:  'raw section wrappers, oversized heading with zero padding, no shadows, high contrast accent (red/lime)',
        retro:      'decorate(pattern: "dots") backgrounds, badge eyebrows, thick dividers, earthy amber/cream palette',
        corporate:  'feature grid with checkmarks, testimonial with company name+logo, trust logo marquee, stat bar',
        neon:       'section(variant: "spotlight") for glow sections, codeWindow for terminal/API examples, stat with glowing accent',
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

    const rootVars  = extractVars(source, ':root')
    const lightVars = extractVars(source, '\\[data-theme=["\']light["\']\\]|[.]ui-theme-light')

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
    const PAIRINGS = [
      ['--ui-text',         '--ui-bg',       'Body text on page background',        false],
      ['--ui-muted',        '--ui-bg',       'Muted text on page background',        false],
      ['--ui-accent',       '--ui-bg',       'Accent text on page background',       false],
      ['--ui-text',         '--ui-surface',  'Body text on card/surface',            false],
      ['--ui-muted',        '--ui-surface',  'Muted text on card/surface',           false],
      ['--ui-accent-text',  '--ui-accent',   'Button text on accent background',     false],
      ['--ui-accent',       '--ui-surface',  'Accent text on surface',               false],
      ['--ui-text',         '--ui-surface-2','Text on nested surface',               false],
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
      return text(`No color variable pairs found to check.\n\nThe checker looks for --ui-* token pairs (e.g. --ui-text, --ui-bg, --ui-accent).\n\nIf your theme.css defines bare tokens like --accent or --bg, that is correct — the checker will auto-map them. Make sure the variables are inside a :root { } or [data-theme="light"] { } block:\n\n  :root {\n    --text: #e2e2ea;\n    --bg:   #0d0d10;\n  }\n  [data-theme="light"] {\n    --text: #111;\n    --bg:   #fff;\n  }`)
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
        
        // Suggest a corrected hex value
        if (r.fgHex && r.bgLum !== null) {
          const suggested = suggestContrastFix(r.fgHex, r.bgLum, r.threshold)
          if (suggested) {
            lines.push(`  💡 Suggested fix: use ${suggested} instead of ${r.fgHex}`)
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
      lines.push('• Mid-tone accents on near-white backgrounds often fail 4.5:1. Darken the accent token or use it only for large text/icons (3:1 threshold).')
      lines.push('• For `--ui-muted` failures: muted text on `--ui-bg` needs at minimum a 4.5:1 ratio. Adjust the muted tone.')
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

// Common prop aliases that agents and developers pass by mistake.
// Maps wrong name → { correct, component } for each well-known component.
const PROP_ALIASES = [
  { component: 'nav()',    wrong: 'brand',   correct: 'logo',    note: 'The nav logo is set with the `logo` prop, not `brand`.' },
  { component: 'nav()',    wrong: 'actions', correct: 'action',  note: 'nav() takes a single `action` string (HTML), not an array.' },
  { component: 'footer()', wrong: 'items',  correct: 'links',   note: 'footer() top-level links use `links: [{ label, href }]`, not `items`.' },
  { component: 'footer()', wrong: 'nav',    correct: 'links',   note: 'footer() links prop is `links`, not `nav`.' },
]

async function validateContent(content) {
  // Source-level checks — run before the worker so errors are caught without importing
  const sourceWarnings = []

  // Component prop alias checks — flag known wrong prop names
  for (const { component, wrong, correct, note } of PROP_ALIASES) {
    // Match: nav({ ...wrong: or footer({ ...wrong: (within the call args)
    const fnName = component.replace('()', '')
    const re = new RegExp(`${fnName}\\s*\\(\\s*\\{[^}]*\\b${wrong}\\s*:`, 'g')
    if (re.test(content)) {
      sourceWarnings.push(`"${wrong}" is not a recognised prop for ${component} — did you mean "${correct}"? ${note}`)
    }
  }

  // Write into PAGES_DIR so relative imports (e.g. '../components/nav.js') resolve correctly
  fs.mkdirSync(PAGES_DIR, { recursive: true })
  const tmpFile = path.join(PAGES_DIR, `.pulse-validate-${Date.now()}.mjs`)
  try {
    fs.writeFileSync(tmpFile, content, 'utf8')

    // Run validation in a child process with a hard timeout so a hanging import
    // (slow module, circular dep, network call) cannot block the MCP server.
    const validatorScript = new URL('./validate-worker.js', import.meta.url).pathname
    let output
    try {
      output = execFileSync(process.execPath, [validatorScript, tmpFile], {
        timeout: 10_000,
        encoding: 'utf8',
      })
    } catch (err) {
      const msg = err.killed || err.signal === 'SIGTERM'
        ? 'Invalid: validation timed out — spec may have a hanging import or infinite loop'
        : `Invalid: could not parse — ${err.stdout || err.message}`
      return text(msg)
    }

    let finalOutput = output.trim()
    // Merge source-level prop warnings into the worker output
    if (sourceWarnings.length > 0) {
      const propNotes = sourceWarnings.map(w => `  ⚠ ${w}`).join('\n')
      if (finalOutput.startsWith('Valid ✓')) {
        finalOutput = finalOutput.replace('Valid ✓', 'Valid ✓ — but fix these issues:').replace(' — but fix these issues: — but fix these issues:', ' — but fix these issues:')
        finalOutput = finalOutput + '\n' + propNotes
      } else {
        finalOutput = finalOutput + '\n' + propNotes
      }
    }

    return text(finalOutput)
  } finally {
    try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
  }
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

**Fetch \`pulse://workflow\` before anything else.** It defines the exact sequence of phases and pass gates for every build task. Do not fetch guide sections or start writing code until you have read it. Skipping it means you will run steps in the wrong order.

## Guide resources

| Resource | When to fetch |
|---|---|
| \`pulse://workflow\` | **First. Always. Before any guide sections or code.** |
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
- \`pulse_extract_inspiration(source, focus?)\` — **Extract a structured design brief from a URL or image.** Call this when the user shares a website URL, a site name they admire, or pastes an inspiration image. Returns a structured extraction template — you fill it in using your browsing or vision tools, then feed the results into pulse_intake. Maps directly to palette, vibe, styleNotes, and font fields.
- \`pulse_intake(name, pitch, features, targetUser?, palette?, font?, theme?, vibe?, styleNotes?, antiStyle?, inspiration?)\` — **Capture product details before scaffolding.** Run this first for any new project or branded template — before pulse_sketch or pulse_intent. **Gather answers by asking the user one free-form question at a time — never use multi-choice lists for open-ended intake questions.** After intake, call pulse_sketch to explore structural directions before writing code.
- \`pulse_sketch(brief, vibe?, antiStyle?, pageType?)\` — **Generate 3 structurally distinct layout directions before writing any code.** Call after pulse_intake. Returns three named directions (full-bleed, asymmetric split, typography-only, editorial flow, dense grid, story scroll, content-first) with wireframes, key decisions, and component strategies. Prevents defaulting to "centred hero + three columns" on every project. After choosing a direction, fetch \`pulse://guide/explore\` for raw HTML patterns.
- \`pulse_intent(description)\` — Describe what you want to build in plain language and get back a matched archetype, component recommendations, a ready-to-adapt spec scaffold, and which guides to read. Use after pulse_intake and pulse_sketch, before fetching guides.
- \`pulse_suggest(content)\` — **Draft-mode feedback.** Paste a partial or complete spec and get constructive, non-blocking suggestions: missing pieces, likely omissions, component upgrades, empty-state reminders. A collaborator, not a gate. Use mid-build before running the hard validator.
- \`pulse_list_icons(filter?)\` — **List all available icon names grouped by category.** Always call this before importing icons — never guess a name or grep source files. Optional filter keyword narrows results (e.g. filter: "arrow").
- \`pulse_check_contrast(css?, file?, theme?)\` — **Static WCAG contrast check.** Provide theme CSS content or a file path; it checks all token color pairings against WCAG AA thresholds (4.5:1 normal text, 3:1 large text/UI). Run immediately after writing a theme file — before pulse_build and Lighthouse. Catches palette mistakes in milliseconds.
- \`pulse_status\` — **Project health snapshot.** Returns page count, routes, dev server status, last build age, and pulse-ui version check. Call at the start of a session to orient quickly without reading files.
- \`pulse_list_structure\` — list pages, components, and pulse-ui version. Call at the start of every session.
- \`pulse_validate\` — validate spec content. Call after every write. Fix all errors AND warnings.
- \`pulse_review\` — switch into reviewer mode and critically examine a spec you just built. Returns the source, rendered HTML, validator output, and a full review checklist. **Call this only after validate, Lighthouse (desktop + mobile), and tests all pass — it is the final phase before declaring done.**
- \`pulse_create_page\` — validate a page spec you already wrote to disk. **Always write the file with the Write tool first, then call this.** Never pass content to this tool.
- \`pulse_create_component\` — register a component you wrote with the Write tool. Write the file first, then call this.
- \`pulse_create_store\` — register a pulse.store.js you wrote with the Write tool. Write the file first, then call this.
- \`pulse_create_action\` — generate a correctly-structured action snippet.
- \`pulse_run_tests\` — run the project test suite (npm test). Use after writing or editing specs.
- \`pulse_fetch_page(url)\` — HTTP GET the dev server URL. Use to verify SSR output.
- \`pulse_restart_server\` — stop and restart the dev server.
- \`pulse_build\` — production build + starts prod server on devPort+1 for Lighthouse. Returns the URL. Call \`pulse_restart_server\` after to return to dev. **Slow — takes 30–60 s. Tell the user before calling.**
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

**After writing or editing any page spec, you MUST run \`/verify\` before declaring done.**

\`/verify\` is the single canonical verification workflow. It runs: validate → screenshot → console check → network check → SSR check → production build → Lighthouse desktop → Lighthouse mobile → performance trace → code review → writes the \`.pulse-verified\` stamp. The stop hook checks this stamp — if it is missing or older than the last spec edit, the hook will block and make you run verification again.

**Do not replicate \`/verify\` steps manually.** Running the individual tools yourself does not write the stamp. The agent will be blocked at the end regardless.

**RULE: NEVER run \`lighthouse_audit\` against the dev server.** Dev mode serves unminified source files — scores are meaningless. \`/verify\` handles this correctly by calling \`pulse_build\` first.

**Before calling any slow tool (\`pulse_build\`, \`lighthouse_audit\`), output a short status message to the user.** Example: "Building for production — this takes ~30 s…". Do not call slow tools silently.

${CHECKLIST}`

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
