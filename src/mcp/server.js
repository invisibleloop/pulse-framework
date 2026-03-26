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
 *   pulse_list_structure   — list all pages and components
 *   pulse_create_page      — create a new page spec with proper template
 *   pulse_create_component — create a reusable component
 *   pulse_validate         — validate a spec against the schema
 *   pulse_check_version    — installed vs static vs npm latest
 *   pulse_update           — re-copy pulse-ui assets from package → public/
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
        lines.push(`  ${route.padEnd(24)} → ${path.relative(ROOT, spec.hydrate.replace('/src/', 'src/'))}${tagStr}`)
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
// pulse_validate
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_validate',
  {
    description: 'Validate a Pulse spec before writing it. Returns errors or confirms the spec is valid.',
    inputSchema: { content: z.string().describe('JavaScript spec content to validate') },
  },
  async ({ content }) => validateContent(content)
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
    description: `Create a reusable view component in src/components/. Components export named functions that return HTML strings.

IMPORTANT rules for component content:
- Import Pulse UI components from '@invisibleloop/pulse/ui' where applicable
- Use u- utility classes for spacing/layout — never inline styles
- Use var(--ui-*) CSS tokens for any colour references — never hardcode hex values
- Export named functions only (no default export needed)`,
    inputSchema: {
      name:    z.string().describe('Component name, e.g. "hero" or "nav"'),
      content: z.string().describe('JS — export named functions that return HTML strings'),
    },
  },
  async ({ name, content }) => {
    const safeName = name.replace(/\.js$/, '')
    const fullPath = path.join(COMPONENTS_DIR, `${safeName}.js`)

    if (!fullPath.startsWith(COMPONENTS_DIR)) {
      return text('Error: component name must not escape src/components/')
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, content, 'utf8')

    return text(`Created ${path.relative(ROOT, fullPath)}`)
  }
)

// ---------------------------------------------------------------------------
// pulse_create_store
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_create_store',
  {
    description: `Create a pulse.store.js global store at the project root. The store defines server fetchers and client mutations that are shared across pages.

IMPORTANT rules:
- server fetchers must be async functions: async (ctx) => value
- mutations must be pure functions: (storeState, payload?) => partialState — no fetch, no side effects
- hydrate is required if the store has mutations (enables client-side store mutation dispatch)
- Register the store in your server file by passing it to createServer({ store })
- Pages subscribe to store keys via spec.store: ['user', 'settings']`,
    inputSchema: {
      content: z.string().describe('Complete pulse.store.js content — must export default a valid store object'),
    },
  },
  async ({ content }) => {
    const storePath = path.join(ROOT, 'pulse.store.js')

    // Basic structure check before writing
    if (!content.includes('export default')) {
      return text('Invalid: store must contain "export default { ... }"')
    }

    fs.writeFileSync(storePath, content, 'utf8')

    return text(`Created pulse.store.js

Next steps:
1. Import and register it in your server file:
   import store from './pulse.store.js'
   createServer(specs, { store })

2. Declare which keys each page uses:
   export default { route: '/dashboard', store: ['user', 'settings'], ... }

3. If you added mutations, set hydrate in pulse.store.js:
   hydrate: '/pulse.store.js'

Store data is available in the view as the second argument alongside page server data.`)
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

    // Give it a moment to bind the port
    await new Promise(r => setTimeout(r, 1500))
    return text(`Dev server restarted on port ${port}`)
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

    // Wait for it to bind
    setTimeout(() => resolve(text(
      `Production build complete. Server running at http://localhost:${prodPort}/\n` +
      `Run Lighthouse against this URL, then call pulse_restart_server to return to dev.`
    )), 2000)
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
      file: z.string().describe('Absolute path to the spec file to review'),
    },
  },
  async ({ file }) => {
    if (!fs.existsSync(file)) return text(`File not found: ${file}`)

    const source = fs.readFileSync(file, 'utf8')

    // Run the validator in a child process (same as pulse_validate)
    const validatorScript = new URL('./validate-worker.js', import.meta.url).pathname
    let validationResult = '(could not run validator)'
    try {
      validationResult = execFileSync(process.execPath, [validatorScript, file], {
        timeout: 10_000,
        encoding: 'utf8',
      }).trim()
    } catch (err) {
      validationResult = err.stdout?.trim() || err.message
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

You are now a **senior code reviewer**. You did not write this code. Read it with fresh eyes and find every problem — no matter how small.

Work through each section of the checklist below. For every issue you find, fix it immediately before moving on. Do not report issues without fixing them. When you have fixed everything, confirm what you changed.

---

## Spec source

\`\`\`js
${source}
\`\`\`

---

## Rendered HTML (initial state) ${renderNote}

\`\`\`html
${renderedHtml || '(empty)'}
\`\`\`

---

## Validator output

${validationResult}

---

## Review checklist

Work through every item. Fix anything that fails.

### Structure
- [ ] \`route\` is set explicitly — not left to auto-discovery
- [ ] \`hydrate\` is set if the page has mutations, actions, or persist
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
- [ ] No \`data-event\` on text inputs — this destroys focus on every keystroke
- [ ] No \`className\`, \`htmlFor\`, \`onClick=\`, or other React patterns
- [ ] No hardcoded hex colours — only \`var(--ui-*)\` tokens
- [ ] No emoji in the view HTML

### Accessibility
- [ ] \`<main id="main-content">\` is present
- [ ] Icon-only buttons have \`aria-label\`
- [ ] \`aria-live\` and \`aria-label\` are NOT on the same element
- [ ] Heading hierarchy is correct — no skipped levels, starts at h1
- [ ] Disabled state uses the \`disabled\` attribute, not just CSS or opacity

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
// pulse_update
// ---------------------------------------------------------------------------

server.registerTool(
  'pulse_update',
  {
    description: 'Re-copy pulse-ui.css, pulse-ui.js, and the agent checklist from the installed package into public/. Run after npm update @invisibleloop/pulse, or when visual output looks wrong and you suspect stale CSS.',
    inputSchema: {},
  },
  () => {
    const pkgPublic  = new URL('../../public', import.meta.url).pathname
    const publicDir  = path.join(ROOT, 'public')
    const assets     = ['pulse-ui.css', 'pulse-ui.js', '.pulse-ui-version']
    const updated    = []

    fs.mkdirSync(publicDir, { recursive: true })
    for (const asset of assets) {
      const src = path.join(pkgPublic, asset)
      const dst = path.join(publicDir, asset)
      if (fs.existsSync(src)) { fs.copyFileSync(src, dst); updated.push(`public/${asset}`) }
    }

    const checklistSrc = new URL('../agent/checklist.md', import.meta.url).pathname
    const checklistDst = path.join(ROOT, '.claude', 'pulse-checklist.md')
    if (fs.existsSync(checklistSrc)) {
      fs.mkdirSync(path.dirname(checklistDst), { recursive: true })
      fs.copyFileSync(checklistSrc, checklistDst)
      updated.push('.claude/pulse-checklist.md')
    }

    const versionFile = path.join(publicDir, '.pulse-ui-version')
    const version     = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : '?'
    return text(`pulse-ui updated to v${version}\n\n${updated.map(f => `✓ ${f}`).join('\n')}`)
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function validateContent(content) {
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

    return text(output.trim())
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
const GUIDE_EXAMPLES  = fs.readFileSync(new URL('../agent/guide-examples.md',    import.meta.url), 'utf8')

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

## Tools available

**Pulse MCP tools** (always available):
- \`pulse_list_structure\` — list pages, components, and pulse-ui version. Call at the start of every session.
- \`pulse_validate\` — validate spec content. Call after every write. Fix all errors AND warnings.
- \`pulse_review\` — switch into reviewer mode and critically examine a spec you just built. Returns the source, rendered HTML, validator output, and a full review checklist. **Call this only after validate, Lighthouse (desktop + mobile), and tests all pass — it is the final phase before declaring done.**
- \`pulse_create_page\` — validate a page spec you already wrote to disk. **Always write the file with the Write tool first, then call this.** Never pass content to this tool.
- \`pulse_create_component\` — create a reusable component.
- \`pulse_create_store\` — create the pulse.store.js global store.
- \`pulse_create_action\` — generate a correctly-structured action snippet.
- \`pulse_fetch_page(url)\` — HTTP GET the dev server URL. Use to verify SSR output.
- \`pulse_restart_server\` — stop and restart the dev server.
- \`pulse_build\` — production build + starts prod server on devPort+1 for Lighthouse. Returns the URL. Call \`pulse_restart_server\` after to return to dev. **Slow — takes 30–60 s. Tell the user before calling.**
- \`pulse_check_version\` — check installed package version, static asset version, and latest on npm. Use this instead of running npm commands when the user asks about updates.
- \`pulse_update\` — re-copy \`pulse-ui.css\`, \`pulse-ui.js\`, and the agent checklist from the installed package into \`public/\`. Run this after \`npm update @invisibleloop/pulse\`, or whenever visual output looks wrong and you suspect stale CSS.

**Chrome DevTools MCP tools** (globally available):
- \`mcp__chrome-devtools__take_screenshot\` — visual screenshot of the page.
- \`mcp__chrome-devtools__list_console_messages\` — browser console output including errors.
- \`mcp__chrome-devtools__list_network_requests\` — network requests, including 404s.
- \`mcp__chrome-devtools__lighthouse_audit\` — Lighthouse scores and failing audits. **Slow — takes 30–60 s per run (×2 for desktop + mobile). Tell the user before calling.**
- \`mcp__chrome-devtools__navigate_page\` — navigate the browser to a URL.
- \`mcp__chrome-devtools__list_pages\` — list all open browser pages/tabs. Returns an array of objects each with a numeric \`id\` field.
- \`mcp__chrome-devtools__close_page\` — close a page by its numeric ID. **CRITICAL: \`pageId\` must be a JSON number, not a string. \`{ pageId: 2 }\` is correct. \`{ pageId: "2" }\` will fail with a type error.** Take the \`id\` value from \`list_pages\` and pass it unquoted.

## MANDATORY: Verify every build

**RULE: NEVER run \`lighthouse_audit\` against the dev server. Dev mode serves unminified source files — scores are meaningless. Lighthouse MUST always run against the production build.**

**Before calling any slow tool (\`pulse_build\`, \`lighthouse_audit\`), output a short status message to the user explaining what you are about to do and that it may take a moment.** Example: "Building for production — this takes ~30 s…" or "Running Lighthouse desktop audit — may take up to a minute…". Do not call the tool silently.

After writing or editing any page, run ALL of the following steps in order before telling the user you are done:

1. \`pulse_validate\` — validate the spec. Fix all errors and warnings before continuing.
2. \`pulse_review\` — **switch into reviewer mode**. Read the source, rendered HTML, and checklist returned by the tool. Fix every issue found before moving on. This is mandatory — do not skip it.
3. \`pulse_restart_server\` — only if you added a new page or changed imports.
2. \`mcp__chrome-devtools__navigate_page\` — navigate to the dev server URL. After any CSS or asset change, follow immediately with \`mcp__chrome-devtools__evaluate_script\` running \`location.reload(true)\` to force a hard refresh.
3. \`mcp__chrome-devtools__take_screenshot\` — check layout, spacing, content visibility, no overflow. Also check headings for orphans (a single short word stranded on the last line). To detect them programmatically, run \`mcp__chrome-devtools__evaluate_script\` with:
   \`\`\`js
   Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(h=>{const r=document.createRange();r.selectNodeContents(h);const rects=r.getClientRects();if(rects.length<2)return false;const last=rects[rects.length-1];return last.width/h.getBoundingClientRect().width<0.4;}).map(h=>h.tagName+': '+h.textContent.trim())
   \`\`\`
   Any heading returned has a last line shorter than 40% of its width — fix it with \`balance: true\` on the \`heading()\` component.
4. \`mcp__chrome-devtools__list_console_messages\` (errors) — fix every JS error.
5. \`mcp__chrome-devtools__list_network_requests\` (failed) — fix every 404 or failed fetch.
6. \`pulse_fetch_page\` — pass the full URL e.g. \`{ url: "http://localhost:3000/" }\`. Confirm SSR renders expected content, no blank body.
7. \`pulse_build\` — this builds for production AND starts a prod server on devPort+1. Wait for it to return the prod URL.
8. \`mcp__chrome-devtools__navigate_page\` — navigate to the production URL returned by \`pulse_build\` (e.g. \`http://localhost:3001/\`).
9. \`mcp__chrome-devtools__lighthouse_audit\` with \`{ "strategy": "desktop" }\` — run against the production URL. All four scores (Performance, Accessibility, Best Practices, SEO) must be 100. Report the actual scores and fix every failing audit before continuing.
10. \`mcp__chrome-devtools__lighthouse_audit\` with \`{ "strategy": "mobile" }\` — run the same audit for mobile. All four scores must also be 100. Fix any failures before continuing.
11. \`pulse_restart_server\` — shut down the prod server and return to dev.
12. \`mcp__chrome-devtools__list_pages\` then \`mcp__chrome-devtools__close_page\` — close **every** page returned by \`list_pages\` to shut the browser down entirely. \`pageId\` must be a number: \`{ pageId: 2 }\` ✓ — NOT \`{ pageId: "2" }\` ✗ (string will fail). Loop through all page IDs and close each one.

Do not declare success until all steps pass (step 12 is cleanup — always run it). If any step reveals a problem, fix it and repeat from step 2.

${CHECKLIST}`

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
