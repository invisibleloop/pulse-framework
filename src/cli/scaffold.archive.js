/**
 * Pulse — Project scaffolding
 *
 * Creates a minimal Pulse project in the target directory.
 * Includes a working home page with a counter to prove the app runs.
 */

import fs   from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PULSE_PKG = '@invisibleloop/pulse'

/**
 * Scaffold a new Pulse project.
 *
 * @param {string} targetDir - Absolute path to the project directory
 * @param {Object} options
 * @param {string} [options.name]  - Project name (defaults to directory name)
 * @param {number} [options.port]  - Dev server port (defaults to 3000)
 */
export async function scaffold(targetDir, options = {}) {
  const name = options.name || path.basename(targetDir)
  const port = options.port || 3000

  fs.mkdirSync(path.join(targetDir, 'src', 'pages'),      { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'src', 'components'), { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'public'),             { recursive: true })
  fs.mkdirSync(path.join(targetDir, '.claude', 'commands'), { recursive: true })

  // package.json
  write(targetDir, 'package.json', JSON.stringify({
    name,
    version: '0.1.0',
    type:    'module',
    scripts: {
      dev:   'pulse dev',
      build: 'pulse build',
      start: 'pulse start',
    },
    engines: {
      node: '>=22',
    },
    dependencies: {
      [PULSE_PKG]: 'latest',
    }
  }, null, 2))

  // pulse.config.js
  write(targetDir, 'pulse.config.js',
    `export default {
${port !== 3000 ? `  port: ${port},\n` : ''}  // Load test config — all fields optional, shown with defaults.
  // load: {
  //   duration:    10,   // seconds per test run
  //   connections: 10,   // concurrent request chains
  //   thresholds: {
  //     rps:    undefined, // minimum requests/sec (optional)
  //     p99:    undefined, // maximum p99 latency ms (optional)
  //     errors: 0,         // maximum error count
  //   },
  // },

  // Lighthouse & CWV thresholds — all fields optional, shown with defaults.
  // lighthouse: {
  //   performance:   100,
  //   accessibility: 100,
  //   bestPractices: 100,
  //   seo:           100,
  //   lcp:  2500,   // ms
  //   cls:  0.1,
  //   tbt:  200,    // ms
  //   fcp:  1800,   // ms
  //   si:   3400,   // ms
  //   inp:  200,    // ms
  // },

  // Per-route overrides — merged on top of global lighthouse/load config.
  // routes: {
  //   '/dashboard': {
  //     lighthouse: { performance: 85, lcp: 4000 },
  //     load:       { connections: 5, thresholds: { rps: 20 } },
  //   },
  // },

  // Named environments — for running tests and audits against different targets.
  // Environment names are bespoke — choose whatever suits your project.
  // environments: {
  //   local:      { url: 'http://localhost:3000', default: true },
  //   staging:    {
  //     url:     'https://staging.myapp.com',
  //     headers: { Authorization: \`Bearer \${process.env.STAGING_TOKEN}\` },
  //     load:       { duration: 30, connections: 50 },
  //     lighthouse: { performance: 90 },
  //   },
  //   production: { url: 'https://myapp.com' },
  // },
}
`
  )

  // Home page — working counter proves the app runs
  write(targetDir, 'src/pages/home.js', homePage(name))

  // Minimal stylesheet
  write(targetDir, 'public/app.css', baseCSS())

  // Consumer-facing CLAUDE.md
  write(targetDir, 'CLAUDE.md', claudeMd(name))

  // Slash commands
  write(targetDir, '.claude/commands/pulse-dev.md',    devCmd())
  write(targetDir, '.claude/commands/pulse-stop.md',   stopCmd())
  write(targetDir, '.claude/commands/pulse-build.md',  buildCmd())
  write(targetDir, '.claude/commands/pulse-start.md',  startCmd())
  write(targetDir, '.claude/commands/pulse-report.md',     reportCmd())
  write(targetDir, '.claude/commands/pulse-load.md',        loadCmd())
  write(targetDir, '.claude/commands/pulse-contribute.md',  contributeCmd())

  // .gitignore
  write(targetDir, '.gitignore', [
    'node_modules',
    'public/dist',
    '.pulse-build',
    '.DS_Store',
  ].join('\n') + '\n')

  console.log('  ✓ Project files created')

  // Install dependencies
  console.log('  ✓ Installing dependencies...\n')
  try {
    // Use the globally linked package if available (local dev), otherwise npm install
    execSync(`npm link ${PULSE_PKG}`, { cwd: targetDir, stdio: 'inherit' })
  } catch {
    execSync('npm install', { cwd: targetDir, stdio: 'inherit' })
  }
}

// ---------------------------------------------------------------------------
// File templates
// ---------------------------------------------------------------------------

function homePage(appName) {
  return `\
export default {
  meta: {
    title:       '${appName}',
    description: 'Built with Pulse',
    styles:      ['/app.css'],
  },

  state: {
    count: 0,
  },

  constraints: {
    count: { min: 0, max: 10 },
  },

  view: (state) => \`
    <main id="main-content" class="page">
      <h1>${appName}</h1>
      <p>Your Pulse app is running.</p>

      <div class="counter">
        <button data-event="decrement" \${state.count === 0 ? 'disabled' : ''}>−</button>
        <span class="count">\${state.count}</span>
        <button data-event="increment" \${state.count === 10 ? 'disabled' : ''}>+</button>
      </div>
    </main>
  \`,

  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
}
`
}

function baseCSS() {
  return `\
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:         #111;
  --surface:    #1a1a1a;
  --text:       #f0f0f0;
  --muted:      #888;
  --accent:     #9b8dff;
  --accent-btn: #5c4de3;
  --radius:     8px;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

h1 { font-size: 2rem; margin-bottom: 1.5rem; }
p  { color: var(--muted); margin-bottom: 2rem; }
a  { color: var(--accent); }

.counter {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count {
  font-size: 2rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: center;
}

button {
  background: var(--accent-btn);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.5rem 1.25rem;
  font-size: 1.25rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

a:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
`
}

function claudeMd(appName) {
  return `\
# ${appName} — Pulse App

Built with [Pulse](https://github.com/invisibleloop/pulse) — a spec-first, AI-native framework.

## Philosophy

**The spec is the source of truth.** You write a plain JS object that describes what a page does — its data, state, mutations, and view. The framework handles routing, SSR, hydration, compression, security headers, and client-side navigation automatically. You never touch any of that.

**Performance is non-negotiable.** Every page must meet these targets:

| Metric | Target |
|--------|--------|
| LCP | < 100ms (localhost) |
| CLS | 0.00 |
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |

These are achieved automatically by the framework (streaming SSR, immutable asset caching, zero layout shift). Do not make changes that compromise them.

**No external JavaScript dependencies.** Pulse has no client-side dependencies. Do not install or import React, Vue, Alpine, jQuery, or any other JS library. If you need UI behaviour, express it as mutations and actions in the spec.

## Commands

\`\`\`bash
pulse dev    # dev server (port from pulse.config.js, default 3000)
pulse stop   # stop the dev server
pulse build  # production build → public/dist/
pulse start  # production server
\`\`\`

## Project structure

\`\`\`
src/
  pages/       ← one file per page, auto-discovered
  components/  ← reusable view fragments (JS functions returning HTML strings)
public/
  app.css      ← global stylesheet
\`\`\`

## Pages

Files in \`src/pages/\` are automatically registered as routes.

| File | Route |
|------|-------|
| \`home.js\` | \`/\` |
| \`about.js\` | \`/about\` |
| \`blog/post.js\` | \`/blog/post\` |

For dynamic segments, set \`route\` explicitly in the spec:

\`\`\`js
// src/pages/blog/show.js → set route: '/blog/:slug'
export default {
  route: '/blog/:slug',
  server: {
    post: async (ctx) => fetchPost(ctx.params.slug),
  },
  // ...
}
\`\`\`

## The spec

\`\`\`js
export default {
  // route: '/path'  — omit to derive from filename. Required for dynamic segments.

  meta: {
    title:       'Page title',
    description: 'Meta description',
    styles:      ['/app.css'],

    // Structured data — injected as <script type="application/ld+json"> in <head>
    schema: {
      '@context': 'https://schema.org',
      '@type':    'WebPage',
      name:       'Page title',
    },
  },

  // Server data — resolved before render, passed to view as second arg.
  // ctx: { params, query, headers, cookies }
  server: {
    items: async (ctx) => fetchItems(ctx.query),
  },

  // Guard — runs before server fetchers on every request to this route.
  // Return { redirect: '/path' } to deny access, or nothing to allow.
  // ctx: { params, query, headers, cookies, pathname, method }
  guard: async (ctx) => {
    if (!ctx.cookies.session) return { redirect: '/login' }
  },

  // Initial client state
  state: { count: 0 },

  // Min/max bounds — always enforced after every mutation
  constraints: {
    count: { min: 0, max: 10 },
  },

  // Persist state keys to localStorage — restored on next visit
  persist: ['count'],

  // Validation rules — checked when action.validate === true
  validation: {
    'fields.email': { required: true, format: 'email' },
    'fields.name':  { required: true, minLength: 2 },
  },

  // Pure function — returns an HTML string
  view: (state, server) => \`<main>...</main>\`,

  // Synchronous state changes — return partial state to merge
  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
  },

  // Async operations — form submissions, API calls
  actions: {
    submit: {
      onStart:   (state, formData) => ({ status: 'loading' }),
      validate:  true,
      run:       async (state, serverState, formData) => {
        const res = await fetch('/api/endpoint', { method: 'POST', body: formData })
        return res.json()  // returned value is passed to onSuccess as second arg
      },
      onSuccess: (state, result) => ({ status: 'success', data: result }),
      onError:   (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },
  },
}
\`\`\`

## HTML event binding

\`\`\`html
<button data-event="increment">+</button>       <!-- click → mutation -->
<input  data-event="change:update">             <!-- change event → mutation -->
<form   data-action="submit">...</form>         <!-- submit → action, passes FormData -->
\`\`\`

## Images

Never write a bare \`<img>\` tag. Always use the \`img()\` or \`picture()\` helpers — they prevent CLS and handle loading priority correctly.

\`\`\`js
import { img, picture } from '@invisibleloop/pulse/image'

// Simple image — lazy loaded, prevents CLS
img({ src: '/photo.jpg', alt: 'A photo', width: 800, height: 600 })

// LCP hero image — eager + high fetchpriority
img({ src: '/hero.jpg', alt: 'Hero', width: 1200, height: 630, priority: true })

// With modern format sources (AVIF/WebP)
picture({
  src:     '/hero.jpg',
  alt:     'Hero',
  width:   1200,
  height:  630,
  priority: true,
  sources: [
    { src: '/hero.avif', type: 'image/avif' },
    { src: '/hero.webp', type: 'image/webp' },
  ]
})
\`\`\`

Rules:
- **Always provide \`width\` and \`height\`** — without them the browser can't reserve space and CLS is non-zero
- **Use \`priority: true\` for the first visible image** (hero, above-fold card) — sets \`loading="eager"\` and \`fetchpriority="high"\` for LCP
- **All other images** default to \`loading="lazy"\`
- **Use \`picture()\` when you have AVIF/WebP variants** — AVIF is typically 50% smaller than JPEG

## Embedding videos (oEmbed / YouTube)

Never drop a bare YouTube \`<iframe>\` into the view — it loads ~500 KB of scripts immediately and kills LCP. Use the **facade pattern**: fetch oEmbed data in \`server\`, SSR the thumbnail as a priority \`<img>\`, and swap to the real \`youtube-nocookie.com\` iframe only on click via an inline \`<script nonce="\${server.meta.nonce}">\`. Always \`escapeHtml\` oEmbed title/URL values before injecting into HTML attributes.

## Guard (route authorization)

\`guard\` runs on every request to a route, before server data is fetched. Returning \`{ redirect: '/path' }\` sends a 302 and skips all fetchers. Returning nothing allows the request to proceed.

\`\`\`js
export default {
  route: '/dashboard',

  guard: async (ctx) => {
    if (!ctx.cookies.session) return { redirect: '/login' }
    // Role check example:
    // const user = await getUserFromSession(ctx.cookies.session)
    // if (!user?.isAdmin) return { redirect: '/403' }
  },

  server: {
    profile: async (ctx) => getProfile(ctx.cookies.session),
  },

  state: {},
  view: (state, server) => \`<main id="main-content"><h1>Welcome, \${server.profile.name}</h1></main>\`,
}
\`\`\`

Guard also works in reverse — redirect already-authenticated users away from login pages:

\`\`\`js
guard: async (ctx) => {
  if (ctx.cookies.session) return { redirect: '/dashboard' }
},
\`\`\`

## ctx methods — setHeader and setCookie

Available inside \`guard\`, \`server\` fetchers, and \`render\`. Changes are included in the response automatically.

\`\`\`js
// Set an arbitrary response header
ctx.setHeader('X-Custom-Header', 'value')

// Set a cookie
ctx.setCookie('session', token, {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge:   86400,  // seconds — omit for session cookie
  path:     '/',    // default
})
\`\`\`

\`setCookie\` options: \`httpOnly\` (boolean), \`secure\` (boolean), \`sameSite\` ('Lax'|'Strict'|'None'), \`maxAge\` (number), \`path\` (string), \`domain\` (string).

Use \`render\` returning \`{ redirect: '/path' }\` for raw response specs that need to redirect (e.g. OAuth callbacks):

\`\`\`js
render: (ctx, server) => {
  if (!server.session) return { redirect: '/auth/login' }
  return { redirect: '/' }
}
\`\`\`

## Canonical URLs and trailing slashes

A \`<link rel="canonical">\` is injected into every page \`<head>\` automatically. Trailing slash behaviour is controlled by the \`trailingSlash\` option in \`createServer\`:

| Value | Behaviour | Canonical form |
|-------|-----------|----------------|
| \`"remove"\` (default) | 301 \`/about/\` → \`/about\` | no-slash |
| \`"add"\` | 301 \`/about\` → \`/about/\` | slash |
| \`"allow"\` | serve both, no redirect | no-slash |

\`\`\`js
createServer(specs, {
  trailingSlash: 'add',   // slash is canonical for this project
})
\`\`\`

Override the canonical URL for a specific page with \`meta.canonical\`:

\`\`\`js
meta: {
  title:     'My Page',
  canonical: 'https://example.com/my-page',
}
\`\`\`

## Raw content responses (RSS, sitemaps, JSON APIs)

For non-HTML routes, use \`contentType\` + \`render\` instead of \`view\`. The HTML pipeline is bypassed entirely — no document wrapper, no hydration.

\`\`\`js
// src/pages/feed.js
export default {
  route: '/feed.xml',

  // Fetch data server-side — same caching options as pages
  server: {
    posts: async () => fetchRecentPosts(),
  },

  // Tell the server to serve raw content with this MIME type
  contentType: 'application/rss+xml; charset=utf-8',

  // Pure function — (ctx, serverData) => string
  render: (ctx, server) => \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>Latest posts</description>
    \${server.posts.map(p => \`
    <item>
      <title>\${escXml(p.title)}</title>
      <link>https://example.com/blog/\${p.slug}</link>
      <pubDate>\${new Date(p.date).toUTCString()}</pubDate>
      <description>\${escXml(p.excerpt)}</description>
    </item>\`).join('')}
  </channel>
</rss>\`,

  // Cache the rendered XML for 1 hour in HTTP caches
  cache: { public: true, maxAge: 3600, staleWhileRevalidate: 86400 },

  // Also cache the server data fetch in-process for 5 minutes
  serverTtl: 300,
}
\`\`\`

Rules:
- **\`render(ctx, server)\`** is synchronous — do all async work in \`spec.server\`, same as \`view\`
- **\`state\`, \`view\`, \`mutations\`, \`actions\`** are not used and should be omitted
- **Always escape special characters** in XML output (\`&\` → \`&amp;\`, \`<\` → \`&lt;\`, \`>\` → \`&gt;\`)
- **Text, XML, and JSON** responses are compressed automatically (brotli/gzip)
- Common content types: \`application/rss+xml; charset=utf-8\`, \`application/xml\`, \`application/json\`, \`text/plain\`

## Caching

By default HTML responses are served with \`Cache-Control: no-store\`. To enable caching on a route, add \`cache\` and/or \`serverTtl\` to the spec:

\`\`\`js
export default {
  route: '/blog/:slug',

  // In-process server data cache — fetchers are not called again until TTL expires.
  // The cached result is reused to re-render the page on each request within the window.
  serverTtl: 60,  // seconds

  // HTTP cache headers sent with the HTML response (prod only — dev always sends no-store)
  cache: {
    public:               true,   // use 'public' (CDN-cacheable); omit or false for 'private'
    maxAge:               60,     // max-age in seconds
    staleWhileRevalidate: 3600,   // stale-while-revalidate in seconds (optional)
  },

  // ...
}
\`\`\`

Rules:
- **\`serverTtl\`** caches the server data fetch result in-process — not the HTML. The page is re-rendered from cached data on every request, so the response is still dynamic (state, params etc. are live).
- **\`cache.public\`** marks the response as CDN-cacheable. Only use this on routes where the HTML is safe to share across users.
- Both settings are **ignored in dev mode** — dev always returns \`Cache-Control: no-store\`.
- Static assets under \`/dist/\` are always \`immutable, max-age=31536000\` — never override this.

## Keyboard accessibility

Every page must be fully navigable by keyboard alone.

**Structure**
- Wrap page content in \`<main id="main-content">\` — the skip link injected by the framework targets this id
- Use semantic elements: \`<nav>\`, \`<main>\`, \`<header>\`, \`<footer>\`, \`<section>\`, \`<article>\`, \`<aside>\`
- One \`<h1>\` per page — the primary heading that describes the current page

**Interactive elements**
- Only use \`<button>\` for actions and \`<a href>\` for navigation — never a \`<div>\` or \`<span>\` with a click handler
- All interactive elements must be reachable by Tab and operable by Enter/Space
- Buttons that toggle state must have an \`aria-expanded\` or \`aria-pressed\` attribute when appropriate
- Disabled buttons must use the HTML \`disabled\` attribute — not just a visual style

**Focus management**
- After client-side navigation, focus is moved automatically by the framework (to \`#main-content\`, \`<main>\`, or \`<h1>\`)
- After a mutation that opens a modal or drawer, move focus to the first interactive element inside it
- When a modal closes, return focus to the element that opened it
- Never trap focus outside of intentional modal/dialog patterns (and always provide a close path)

**Dynamic content**
- Status messages (loading, success, error) must use \`role="status"\` or \`role="alert"\` so screen readers announce them
- Use \`role="alert"\` for errors (assertive) and \`role="status"\` for non-urgent updates (polite)
- Example: \`<p role="alert">\${state.error}</p>\`

**Forms**
- Every \`<input>\`, \`<select>\`, and \`<textarea>\` must have an associated \`<label>\` (via \`for\`/\`id\` or wrapping)
- Error messages must be linked to their input using \`aria-describedby\`
- Required fields must have \`required\` (or \`aria-required="true"\`)
- Group related inputs with \`<fieldset>\` and \`<legend>\`

**Images and icons**
- Decorative images: \`alt=""\`
- Informative images: meaningful \`alt\` text
- Icon-only buttons: \`aria-label\` on the button, \`aria-hidden="true"\` on the icon

## Security defaults

Pulse applies the following security measures automatically — no configuration needed:

| Feature | Behaviour |
|---|---|
| Security headers | Sent on every response: \`X-Content-Type-Options\`, \`X-Frame-Options\`, \`Referrer-Policy\`, \`Permissions-Policy\`, \`Cross-Origin-Opener-Policy\`, \`Cross-Origin-Resource-Policy\` |
| CSP with nonce | Every HTML response includes a \`Content-Security-Policy\` header with a per-request cryptographic nonce. All inline scripts injected by the framework carry a matching \`nonce\` attribute |
| HSTS | When a request arrives with \`x-forwarded-proto: https\` or over a TLS socket, \`Strict-Transport-Security: max-age=31536000; includeSubDomains\` is added automatically |
| SameSite=Lax cookies | Cookies set via \`ctx.setCookie()\` default to \`SameSite=Lax\` — CSRF protection without explicit opt-in |
| POST gating | POST/PUT/DELETE to a page spec returns 405. Raw response specs (\`contentType\` + \`render\`) accept any method — use these for webhooks |

### Escaping user data in views

Import \`escHtml\` to safely embed untrusted data in HTML strings:

\`\`\`js
import { escHtml } from '@invisibleloop/pulse/html'

view: (state) => \`
  <p>Hello, \${escHtml(state.username)}</p>
\`
\`\`\`

**Always use \`escHtml\`** around any value that originates from user input, URL params, or external APIs. Omitting it is an XSS vulnerability.

### Using ctx.nonce in view functions

The per-request nonce is available as \`ctx.nonce\` inside \`server\` fetchers and \`guard\`. If a view needs to emit its own inline \`<script>\`, pass the nonce through server data:

\`\`\`js
server: {
  meta: async (ctx) => ({ nonce: ctx.nonce }),
},

view: (state, server) => \`
  <script nonce="\${server.meta.nonce}">console.log('inline ok')</script>
\`
\`\`\`

Inline scripts without the matching nonce are blocked by the CSP.

## Testing

Tests use Node's built-in test runner — no test framework, no extra dependencies. Run with:

\`\`\`bash
node src/pages/home.test.js       # single file
node --test src/**/*.test.js      # all tests
\`\`\`

Place test files alongside the spec they test: \`src/pages/home.test.js\` next to \`src/pages/home.js\`.

### Minimal test harness

Each test file uses a minimal inline harness (no imports) — \`async function test(label, fn)\` + \`function assert(condition, msg)\`. Call spec functions directly: mutations/view/action stages are pure functions, pass mocks for \`ctx\`. For HTTP tests use \`createServer\` with an incrementing port counter.

### What to test

| Thing | Test it? | How |
|---|---|---|
| Mutations | Yes — always | Call directly, assert returned state |
| View functions | Yes — key states | Call directly, assert HTML contains expected content |
| Server fetchers | Yes — happy path + errors | Mock ctx, assert return shape |
| Action lifecycles | Yes — each stage | Call onStart/onSuccess/onError directly |
| Full page HTTP | Yes — smoke test each page | \`withServer\` + \`get()\` |
| CSS / visual output | No | Covered by Lighthouse audits |

## CSS conventions

All styles live in \`public/app.css\`. There is no CSS-in-JS, no scoped styles, no Tailwind.

**Token-first** — every colour, radius, and spacing value must come from a CSS custom property defined in \`:root\`. Never write raw hex values or magic numbers in component rules.

\`\`\`css
/* wrong */
.card { background: #1a1a1a; border-radius: 8px; color: #888; }

/* right */
.card { background: var(--surface); border-radius: var(--radius); color: var(--muted); }
\`\`\`

**Modifier pattern** — write one base class and extend it with modifiers. Never create two parallel classes that do the same thing with different values.

\`\`\`css
/* wrong — two separate button classes */
.btn-primary { display: inline-flex; padding: .65rem 1.4rem; background: var(--accent); ... }
.btn-ghost   { display: inline-flex; padding: .65rem 1.4rem; background: transparent; ... }

/* right — shared base, modifier overrides only what changes */
.btn          { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.4rem; border-radius: var(--radius); font-weight: 600; text-decoration: none; transition: all .15s; }
.btn--primary { background: var(--accent); color: var(--bg); }
.btn--ghost   { background: transparent; color: var(--text); border: 1px solid var(--border); }
\`\`\`

**Utility classes for repeated patterns** — if the same combination of properties appears on three or more elements, extract it into a named utility. Common candidates:

\`\`\`css
/* label utility — uppercase, small, muted, tracked */
.label { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
\`\`\`

**No duplication** — before writing a new class, check \`app.css\` for an existing one that covers it. If a class already exists, use it. If it almost fits, extend it with a modifier — never copy-paste and rename.

**Dead code** — if a class is no longer referenced in any component, remove it from \`app.css\`.

## Development workflow

Follow these steps in order. Do not skip steps or reorder them.

### Creating a new page

1. **Inventory** — run \`pulse_list_structure\` to see what pages and components already exist. Reuse anything that fits rather than creating from scratch.
2. **Plan** — draft the spec mentally. If the user asked to preview first, output it as a code block and wait for confirmation before continuing.
3. **Validate** — run \`pulse_validate\` on the spec before writing any file. Fix all validation errors before proceeding.
4. **Write the spec** — call \`pulse_create_page\`. Register it in \`server.js\`.
5. **Write tests** — create \`src/pages/[name].test.js\`. Cover: all mutations, view output for key states, server fetcher shape, action lifecycle stages, and an HTTP smoke test.
6. **Run tests** — \`node src/pages/[name].test.js\`. All must pass before continuing.
7. **Restart the dev server** — run \`/pulse-dev\` (new files require a restart; hot reload only covers edits to existing files).
8. **Lighthouse audit** — run a full audit on the new route. All four scores must be **100**. Fix any failures before marking the task done.
9. **Save the report** — save Lighthouse results to the report store via \`pulse save-report\`.

### Creating a new component

1. **Inventory** — run \`pulse_list_structure\`. If a similar component exists, extend it rather than creating a new one.
2. **Plan** — if the user asked to preview, show the component as a code block and wait for confirmation.
3. **Write the component** — call \`pulse_create_component\`.
4. **Write tests** — create \`src/components/[name].test.js\`. Test the render function output for all meaningful states.
5. **Run tests** — \`node src/components/[name].test.js\`. All must pass.
6. **Restart the dev server** — run \`/pulse-dev\`.
7. **Lighthouse audit** — audit every page that uses the component. All scores must remain **100**.
8. **Save the report** — save results for each audited route.

### Editing an existing page or component

1. **Read first** — read the current file before making any changes. Never edit blind.
2. **Check tests** — read the existing test file to understand what is already covered.
3. **Edit** — make the change.
4. **Run tests** — run the test file for the changed spec. All must pass.
5. **Lighthouse audit** — if the change affects rendered output, run a full audit. All scores must remain **100**.
6. **Save the report** — if an audit was run, save the results.

### Adding CSS

1. **Read \`public/app.css\` first** — check for an existing class or token that covers the need.
2. **Extend before adding** — use a modifier on an existing class if possible.
3. **Tokens only** — never write raw hex values or magic numbers. Use \`var(--token)\`.
4. **Add the class** — write it in \`app.css\`, not inline in the component.
5. **Check for dead code** — if a class was replaced or renamed, remove the old one.

## Component library

Import from \`@invisibleloop/pulse/ui\`. Add \`pulse-ui.css\` to \`meta.styles\`.

\`\`\`js
import { button, card, input, alert, badge, stat, avatar, empty, table, select, textarea } from '@invisibleloop/pulse/ui'

meta: { styles: ['/pulse-ui.css', '/app.css'] }
\`\`\`

### Components

| Component | Props | Notes |
|---|---|---|
| \`button\` | \`label\`, \`variant\` (primary/secondary/ghost/danger), \`size\` (sm/md/lg), \`href\`, \`disabled\`, \`type\`, \`icon\`, \`iconAfter\`, \`fullWidth\`, \`class\`, \`attrs\` | Renders \`<a>\` when \`href\` set, \`<button>\` otherwise |
| \`badge\` | \`label\`, \`variant\` (default/success/warning/error/info), \`class\` | Inline status label |
| \`card\` | \`title\`, \`content\`, \`footer\`, \`flush\`, \`class\` | \`content\` and \`footer\` are HTML strings — escape user data before passing |
| \`input\` | \`name\`, \`label\`, \`type\`, \`placeholder\`, \`value\`, \`error\`, \`hint\`, \`required\`, \`disabled\`, \`id\`, \`class\`, \`attrs\` | Label/error wired via \`for\`/\`aria-describedby\` automatically |
| \`select\` | \`name\`, \`label\`, \`options\` (strings or \`{value,label}\`), \`value\`, \`error\`, \`hint\`, \`required\`, \`disabled\`, \`id\`, \`class\` | |
| \`textarea\` | \`name\`, \`label\`, \`placeholder\`, \`value\`, \`rows\`, \`error\`, \`hint\`, \`required\`, \`disabled\`, \`id\`, \`class\`, \`attrs\` | |
| \`alert\` | \`variant\` (info/success/warning/error), \`title\`, \`content\`, \`class\` | \`error\`/\`warning\` use \`role="alert"\`; \`info\`/\`success\` use \`role="status"\` |
| \`stat\` | \`label\`, \`value\`, \`change\`, \`trend\` (up/down/neutral), \`class\` | |
| \`avatar\` | \`src\`, \`alt\`, \`size\` (sm/md/lg/xl), \`initials\`, \`class\` | Renders \`<img>\` with src, \`<span>\` with initials fallback |
| \`empty\` | \`title\`, \`description\`, \`action\` (\`{label,href,variant}\`), \`class\` | |
| \`table\` | \`headers\`, \`rows\` (2D array of HTML strings), \`caption\`, \`class\` | Scroll wrapper has \`role="region"\` + \`tabindex="0"\` |

### Rules

- **Check for an existing component first.** Run \`pulse_list_structure\` before creating a new UI element. If a component covers the need, use it — do not recreate it inline.
- **Theming is CSS-only.** Override \`--ui-*\` custom properties in \`:root\` in \`app.css\`. Never pass \`style=""\` to a component.
- **Extension is modifier classes.** Add new variants with a CSS class (e.g. \`.ui-btn--brand\`). Never fork or modify a component source file.
- **User data must be escaped before passing.** \`content\`, \`footer\`, and \`rows\` in \`card\`/\`table\` accept HTML strings — they are not automatically escaped. Use \`escHtml()\` from \`@invisibleloop/pulse/html\` on any user-supplied content before passing it.
- **Missing variant → safe fallback.** All components fall back to their default variant when an unknown value is passed — they never throw.

## When Pulse doesn't have a built-in pattern

If asked to implement something with no direct Pulse equivalent, identify which escape hatch fits before reaching for an external library:

| Need | Approach |
|---|---|
| Middleware — logging, rate limiting, IP blocking, custom headers | \`onRequest\` hook in \`createServer\` |
| Non-HTML responses — JSON APIs, webhooks, RSS | Raw response spec (\`contentType\` + \`render\`) |
| WebSockets | \`server.on('upgrade')\` on the instance returned by \`createServer\` |
| Server-Sent Events | \`onRequest\` — write \`text/event-stream\` response and return \`false\` |
| Custom error pages | \`onError\` hook in \`createServer\` |
| Browser-only behaviour | Inline \`<script nonce="\${server.meta.nonce}">\` in the view |

If none of these cover the requirement, explain the limitation honestly. Do not introduce client-side JS frameworks or npm packages to work around a missing Pulse feature.

## Environments

\`pulse.config.js\` supports named environments for running tests and audits against different targets:

\`\`\`js
environments: {
  local:      { url: 'http://localhost:3000', default: true },
  staging:    {
    url:     'https://staging.myapp.com',
    headers: { Authorization: \`Bearer \${process.env.STAGING_TOKEN}\` },
    load:       { duration: 30, connections: 50 },
    lighthouse: { performance: 90 },
  },
  production: { url: 'https://myapp.com' },
}
\`\`\`

- **Environment names are bespoke** — choose names that fit the project (e.g. \`local\`, \`staging\`, \`prod\`, \`preview\`)
- **\`url\`** — base URL to test against; if it contains \`localhost\` or \`127.0.0.1\`, a local production build and temporary server are used automatically; remote URLs are tested directly
- **\`default: true\`** — the environment used when none is specified; if no default is set the agent asks the user to choose
- **\`headers\`** — HTTP headers sent with every request (useful for auth tokens on protected environments); always read values from \`process.env\` — never hardcode credentials
- **\`load\`** and **\`lighthouse\`** — per-environment threshold overrides; merged on top of global config and below per-route overrides

Threshold merge order: **global config → environment override → per-route override**

## Edge cases

### Routing
- **Static vs dynamic route conflicts** — if \`/blog/new\` and \`/blog/:slug\` both exist, the static route wins. Register static routes before dynamic ones in \`server.js\`.
- **Route params vs query params** — \`:param\` segments are in \`ctx.params\`; \`?key=value\` strings are in \`ctx.query\`. Never mix them.
- **Trailing slashes** — the default \`trailingSlash: 'remove'\` setting 301-redirects \`/about/\` → \`/about\`. Do not create routes with trailing slashes.

### State & mutations
- **Shallow merge** — mutations return a partial state object that is shallow-merged. To update a nested field, spread the parent: \`{ form: { ...state.form, email } }\`.
- **Mutation returning undefined** — a mutation that falls through without returning silently skips the state update. Every code path must return a partial state object.
- **Constraints apply after every mutation** — transient out-of-bounds values between two mutations are not possible. Constraints clamp immediately after each one.

### Actions
- **FormData in run()** — fields are available in both \`onStart\` and \`run\`. However, read \`File\` entries to \`ArrayBuffer\` at the start of \`run\` before any \`await\` — file references can be dropped across async boundaries in some environments.
- **run() return value** — whatever \`run()\` returns is passed as the second argument to \`onSuccess\`. If \`run()\` returns nothing, \`onSuccess\` receives \`undefined\`. Always \`return\` the response.
- **Redirect after action** — return \`{ redirect: '/path' }\` from \`onSuccess\` to navigate without a full page reload.
- **Validation error shape** — \`onError\` receives either an error with \`err.validation\` (array of \`{ field, message }\`) when validation fails, or a plain \`Error\` at runtime. Always handle both: \`err?.validation ?? [{ message: err.message }]\`.

### Server fetchers
- **\`cache.public\` on user-specific routes** — a CDN will cache one user's response and serve it to everyone. Only use \`cache.public: true\` on routes where the HTML is identical for all visitors.
- **Parallel fetchers** — multiple keys in \`server:\` run in parallel. If one fetcher depends on another's result, combine them into a single fetcher using \`Promise.all\`.
- **Fetcher throwing** — an unhandled throw goes to \`onError\` in \`createServer\`. Catch expected errors inside the fetcher and return a meaningful value (\`null\`, empty array) rather than throwing.

### Streaming
- **Segment names must match exactly** — if \`stream.deferred\` lists \`['feed']\`, the \`view\` object must have a key \`feed\`. A mismatch means the segment never resolves.
- **Shell is already sent when a deferred segment throws** — wrap deferred segment logic in try/catch and render a graceful error state rather than throwing.
- **Shell-only streaming** — \`stream: { shell: ['header'], deferred: [] }\` is valid. The shell streams immediately; the rest renders normally.

### Security
- **Inline \`style=""\` attributes are blocked by the default CSP** — \`style-src 'self'\` blocks all inline style attributes. Use CSS classes. If dynamic inline styles are genuinely needed, use a \`<style nonce="...">\` block and pass \`ctx.nonce\` through a server fetcher.
- **\`SameSite=None\` requires \`Secure\`** — browsers silently ignore \`SameSite=None\` cookies without \`Secure: true\`. Only use \`None\` for cross-site embedding, and only in production over HTTPS.
- **\`guard\` throwing vs returning** — a throw inside \`guard\` goes to \`onError\`. A returned \`{ redirect }\` sends a clean 302. Always catch auth/database errors inside guard and return a redirect rather than rethrowing.
- **Redirect loops** — if \`/dashboard\` guards redirect to \`/login\`, and \`/login\` guards redirect authenticated users to \`/dashboard\`, test both directions to confirm there is no loop.

### Performance & Lighthouse
- **Missing \`<main id="main-content">\`** — the framework injects a skip link targeting \`#main-content\` on every page. A missing element breaks the skip link and fails Lighthouse Accessibility.
- **Multiple \`<h1>\` elements** — one \`<h1>\` per page. Multiple at the same level fail Lighthouse Accessibility.
- **Images without \`width\` and \`height\`** — omitting dimensions prevents the browser from reserving space, causing layout shift and a non-zero CLS. Always provide both.
- **Colour contrast** — \`#888\` on \`#111\` is the practical minimum for muted text that passes WCAG AA. Lighter greys will fail. Check new colour tokens before committing.
- **Missing \`meta.description\`** — every page needs one. Omitting it fails Lighthouse SEO.

### Raw response specs
- **\`state\`, \`view\`, \`mutations\`, \`actions\` are ignored** on raw response specs (\`contentType\` + \`render\`). Do not include them.
- **\`render\` is synchronous** — all async work must happen in \`server\` fetchers. \`render(ctx, server)\` receives already-resolved data.

## Rules the agent must follow

- **Never set \`hydrate\`** — the framework sets it automatically.
- **Always wrap page content in \`<main id="main-content">\`** — the framework injects a skip link targeting this id on every page.
- **Never use \`data-event\` on text inputs** to mirror value into state. It destroys focus on every keystroke. Use uncontrolled inputs and read values from \`FormData\` in \`action.onStart\` instead. For client-side filtering/search, render all items in the HTML and use an inline \`<script>\` to show/hide elements — no state or re-render needed.
- **Never add \`<script>\` tags manually** — hydration is handled by the framework.
- **Never add external npm packages** for client-side behaviour — express it in the spec.
- **Always use \`pulse_list_structure\`** before creating pages or components to avoid duplicating what already exists.
- **Always validate with \`pulse_validate\`** before writing a spec file.
- **Preview on request** — if the user says "preview", "show me first", "draft the spec", or similar, generate the full spec as a code block and ask "Shall I write this?" before calling any \`pulse_create_*\` tool. Do not write any files until the user confirms.
- **Never edit \`pulse.config.js\` without explicit permission.** When a change to \`pulse.config.js\` is needed, show the exact proposed diff or updated block as a code snippet and ask "Shall I apply this?" before writing. Do not assume that asking to run a report or load test implies permission to change the config.
- **Never read or write \`.env\` files.** If an environment variable needs to be added or changed, tell the developer the variable name and value to set — do not touch the file. Credentials and secrets belong in the developer's environment, not in the agent's context.
- **Restart the dev server with \`/pulse-dev\`** after creating or renaming files (hot reload handles edits to existing files).
- **Always run a Lighthouse audit** after creating or significantly changing a page. Before checking results, read \`pulse.config.js\` and resolve the effective thresholds: start with global \`lighthouse\` config (defaults: all category scores 100; LCP 2500ms, CLS 0.1, TBT 200ms, FCP 1800ms, SI 3400ms, INP 200ms), merge selected environment's \`lighthouse\` overrides (if any), then merge \`routes['/path'].lighthouse\` on top. All scores and metrics must meet their effective threshold. Fix any failures before considering the task done. Common failures to watch for: colour contrast (use \`#888\` minimum for muted text on \`#111\` backgrounds), missing alt text, missing meta description.
- **Load testing is opt-in** — run \`/pulse-load\` when the user asks, or before shipping a page that fetches server data or handles significant traffic. Read \`pulse.config.js\` for \`load\` thresholds and environment/route overrides before checking results. Results are saved to the same report dashboard under the Load Tests tab.
- **Environments** — when \`environments\` is configured in \`pulse.config.js\`, select the environment before running \`/pulse-load\` or \`/pulse-report\`: use the \`default: true\` entry automatically (telling the user which one), or ask the user to choose if no default is set. Localhost environments follow the standard local build approach; remote environments are tested directly against their URL.
- **Always save Lighthouse results** to the report store immediately after every audit — even routine ones run during development. Run Lighthouse via \`npx --yes lighthouse <url> --output json --output-path /tmp/pulse-lhr.json --chrome-flags="--headless=new" --quiet 2>/dev/null\`, then extract all metrics with the node script in \`/pulse-report\` step 4, then run \`pulse save-report --url <url> --data '<extracted json>'\`. This builds the historical record used by \`/pulse-report\`. Do not use \`mcp__chrome-devtools__lighthouse_audit\` for saving reports — it does not return Performance scores or web vitals.
`
}

function devCmd() {
  return `Start (or restart) the Pulse dev server for this project.

\`\`\`bash
pulse stop; pulse dev
\`\`\`

The server port is read from \`pulse.config.js\` (defaults to 3000).
`
}

function stopCmd() {
  return `Stop the Pulse dev server for this project.

\`\`\`bash
pulse stop
\`\`\`
`
}

function reportCmd() {
  return `Run a Lighthouse audit on a page, save the results, and open the report dashboard.

## Steps

1. Read \`pulse.config.js\` to find the dev port (default 3000), Lighthouse thresholds, and environments.

   **Resolve the effective environment:**
   - Check if \`environments\` is defined in \`pulse.config.js\`
   - If it is: use the entry marked \`default: true\` automatically (tell the user which one); if no default is set, list all environment names and ask the user to choose
   - If \`environments\` is not defined, no selection is needed — local build approach is used

   **Resolve effective Lighthouse thresholds** (apply in order, later values win):
   1. Global \`lighthouse\` config (defaults: all category scores 100; LCP 2500ms, CLS 0.1, TBT 200ms, FCP 1800ms, SI 3400ms, INP 200ms)
   2. Selected environment's \`lighthouse\` overrides (if any)
   3. \`routes['/path'].lighthouse\` overrides (if any)

2. List available routes by reading \`src/pages/\` filenames. Present them to the user and ask which page to audit — e.g. \`/about\`. If only one page exists, proceed with it automatically.

3. **If the target URL is localhost** (environment \`url\` contains \`localhost\` or \`127.0.0.1\`, or no environment is configured):

   a. Check the dev server is running:
   \`\`\`bash
   lsof -ti:<port> > /dev/null 2>&1 && echo "running" || echo "stopped"
   \`\`\`
   If it is not running, start it first with \`/pulse-dev\` and wait for it to be ready.

   b. Build the project (required for accurate scores — dev mode inflates bundle sizes and skips compression):
   \`\`\`bash
   pulse build
   \`\`\`

   c. Start a temporary production server on \`devPort + 2\` (keeps the dev server untouched):
   \`\`\`bash
   pulse start --port <devPort+2> &
   \`\`\`
   Wait for it to be ready:
   \`\`\`bash
   node -e "
   const http = require('http')
   const port = <devPort+2>
   const poll = (n) => {
     if (n <= 0) { console.error('prod server did not start'); process.exit(1) }
     http.get('http://localhost:' + port, () => process.exit(0))
       .on('error', () => setTimeout(() => poll(n - 1), 300))
   }
   poll(20)
   "
   \`\`\`

   d. The audit URL is \`http://localhost:<devPort+2>/<path>\`

4. **If the target URL is remote** (e.g. staging or production environment):

   a. The audit URL is \`<envUrl>/<path>\` — use the environment URL directly
   b. No build or local server steps needed

5. Run Lighthouse against the audit URL. If the environment has \`headers\`, pass them via \`--extra-headers\`:
   \`\`\`bash
   # No headers:
   npx --yes lighthouse <auditUrl> --output json --output-path /tmp/pulse-lhr.json --chrome-flags="--headless=new" --quiet 2>/dev/null

   # With headers (JSON object):
   npx --yes lighthouse <auditUrl> --output json --output-path /tmp/pulse-lhr.json --extra-headers='{"Key":"Value"}' --chrome-flags="--headless=new" --quiet 2>/dev/null
   \`\`\`

6. **If localhost target:** Kill the temporary production server:
   \`\`\`bash
   lsof -ti:<devPort+2> | xargs kill -9 2>/dev/null; true
   \`\`\`

7. Parse the Lighthouse JSON and extract all metrics:
   \`\`\`bash
   node -e "
   const lhr = JSON.parse(require('fs').readFileSync('/tmp/pulse-lhr.json', 'utf8'))
   const s = lhr.categories
   const a = lhr.audits
   const rs = (a['resource-summary']?.details?.items) || []
   const total = rs.find(i => i.resourceType === 'total')
   const js    = rs.find(i => i.resourceType === 'script')
   const css   = rs.find(i => i.resourceType === 'stylesheet')
   const d = {
     scores: {
       performance:   Math.round(s.performance.score * 100),
       accessibility: Math.round(s.accessibility.score * 100),
       bestPractices: Math.round(s['best-practices'].score * 100),
       seo:           Math.round(s.seo.score * 100),
     },
     metrics: {
       lcp:        Math.round(a['largest-contentful-paint'].numericValue),
       cls:        parseFloat(a['cumulative-layout-shift'].numericValue.toFixed(2)),
       fcp:        Math.round(a['first-contentful-paint'].numericValue),
       tbt:        Math.round(a['total-blocking-time'].numericValue),
       ttfb:       Math.round(a['server-response-time'].numericValue),
       si:         Math.round(a['speed-index'].numericValue),
       pageWeight: total ? parseFloat((total.transferSize/1024).toFixed(1)) : undefined,
       jsBytes:    js    ? parseFloat((js.transferSize/1024).toFixed(1))    : undefined,
       cssBytes:   css   ? parseFloat((css.transferSize/1024).toFixed(1))   : undefined,
       requests:   total ? total.requestCount : undefined,
     }
   }
   Object.keys(d.metrics).forEach(k => { if (d.metrics[k] === undefined || (typeof d.metrics[k] === 'number' && isNaN(d.metrics[k]))) delete d.metrics[k] })
   console.log(JSON.stringify(d))
   "
   \`\`\`

8. Check results against effective thresholds (from step 1). Fail and report any score or metric that falls outside its threshold.

9. Save the report — always use the **dev server URL** (\`http://localhost:<devPort>/<path>\`) as the canonical URL so reports are grouped by page, not by environment:
   \`\`\`bash
   pulse save-report --url http://localhost:<devPort>/<path> --data '<json from step 7>'
   \`\`\`

10. Start (or restart) the report server and wait until it is ready:
    \`\`\`bash
    node -e "
    import('./pulse.config.js').then(m => {
      const port = (m.default?.reportPort) || (m.default?.port || 3000) + 1
      process.stdout.write(String(port))
    }).catch(() => process.stdout.write('3001'))
    " | xargs -I{} sh -c '
      lsof -ti:{} | xargs kill -9 2>/dev/null
      pulse report-server --port {} &
      node -e "
        const http = require(\\"http\\")
        const port = {}
        const poll = (n) => {
          if (n <= 0) process.exit(1)
          http.get(\\"http://localhost:\\" + port, () => process.exit(0))
            .on(\\"error\\", () => setTimeout(() => poll(n - 1), 300))
        }
        poll(20)
      "
    '
    \`\`\`

11. Tell the user their report is ready at \`http://localhost:[devPort+1]\` (e.g. \`http://localhost:3001\`). Include which environment was audited.
`
}

function loadCmd() {
  return `Run a load test, save the results, and open the load report tab.

## Steps

1. Read \`pulse.config.js\` to find the dev port (default 3000), load config, and environments.

   **Resolve the effective environment:**
   - Check if \`environments\` is defined in \`pulse.config.js\`
   - If it is: use the entry marked \`default: true\` automatically (tell the user which one); if no default is set, list all environment names and ask the user to choose
   - If \`environments\` is not defined, no selection is needed — local build approach is used

   **Merge load config** (apply in order, later values win):
   \`\`\`js
   // Defaults:
   // load.duration    = 10   (seconds)
   // load.connections = 10   (concurrent)
   // load.thresholds  = { rps: undefined, p99: undefined, errors: 0 }
   \`\`\`
   Global \`load\` → selected environment's \`load\` overrides → \`routes['/path'].load\` overrides.

2. List available routes from \`src/pages/\` and ask the user which route to test. If only one route exists, proceed automatically.

3. **If the target URL is localhost** (environment \`url\` contains \`localhost\` or \`127.0.0.1\`, or no environment is configured):

   a. Build the project:
   \`\`\`bash
   pulse build
   \`\`\`

   b. Start a temporary production server on \`devPort + 2\` (keeps the dev server untouched):
   \`\`\`bash
   pulse start --port <devPort+2> &
   \`\`\`
   Wait for it to be ready:
   \`\`\`bash
   node -e "
   const http = require('http')
   const port = <devPort+2>
   const poll = (n) => {
     if (n <= 0) { console.error('prod server did not start'); process.exit(1) }
     http.get('http://localhost:' + port, () => process.exit(0))
       .on('error', () => setTimeout(() => poll(n - 1), 300))
   }
   poll(20)
   "
   \`\`\`

   c. The test URL is \`http://localhost:<devPort+2>/<path>\`

4. **If the target URL is remote** (e.g. staging or production environment):

   a. The test URL is \`<envUrl>/<path>\` — use the environment URL directly
   b. No build or local server steps needed

5. Run the load test. Pass each header from the environment's \`headers\` object as a separate \`--header "Key: Value"\` argument:
   \`\`\`bash
   pulse load-test --url <testUrl> --duration <duration> --connections <connections> [--header "Key: Value" ...]
   \`\`\`
   This prints a JSON result to stdout. Capture it.

6. **If localhost target:** Kill the temporary production server:
   \`\`\`bash
   lsof -ti:<devPort+2> | xargs kill -9 2>/dev/null; true
   \`\`\`

7. Check results against effective thresholds (from step 1). Fail and report if:
   - \`rps\` is below \`thresholds.rps\` (if set)
   - \`latency.p99\` exceeds \`thresholds.p99\` (if set)
   - \`requests.errors\` exceeds \`thresholds.errors\` (default: 0)

8. Save the result — always use the **dev server URL** (\`http://localhost:<devPort>/<path>\`) as the canonical URL so reports are grouped by page, not by environment:
   \`\`\`bash
   pulse save-load-report --url http://localhost:<devPort>/<path> --data '<json from step 5>'
   \`\`\`

9. Start (or restart) the report server and wait until ready:
   \`\`\`bash
   node -e "
   import('./pulse.config.js').then(m => {
     const port = (m.default?.reportPort) || (m.default?.port || 3000) + 1
     process.stdout.write(String(port))
   }).catch(() => process.stdout.write('3001'))
   " | xargs -I{} sh -c '
     lsof -ti:{} | xargs kill -9 2>/dev/null
     pulse report-server --port {} &
     node -e "
       const http = require(\\"http\\")
       const port = {}
       const poll = (n) => {
         if (n <= 0) process.exit(1)
         http.get(\\"http://localhost:\\" + port, () => process.exit(0))
           .on(\\"error\\", () => setTimeout(() => poll(n - 1), 300))
       }
       poll(20)
     "
   '
   \`\`\`

10. Tell the user the load report is ready at \`http://localhost:[reportPort]/[slug]/load\` (e.g. \`http://localhost:3001/home/load\`). Include which environment was tested. For localhost results, remind them that numbers are useful for relative comparison across runs — not as production capacity estimates.
`
}

function buildCmd() {
  return `Build this Pulse project for production.

Run:

\`\`\`bash
pulse build
\`\`\`

This bundles all pages into \`public/dist/\`. When complete, confirm the build succeeded and list the generated files.
`
}

function startCmd() {
  return `Start the Pulse production server for this project.

First ensure a build exists (\`public/dist/\`). Then run:

\`\`\`bash
pulse start
\`\`\`

The production server starts at http://localhost:3000.
`
}

function contributeCmd() {
  return `Implement a Pulse framework-level feature and open a pull request to the main repository.

Use this when the current project needs something Pulse does not yet support, and the right fix is to add it to the framework itself rather than work around it.

## Step 1 — Describe and scope the change

Before touching any code, write a one-paragraph description of:
- What the feature does
- Which part of the framework needs to change (spec schema, server, SSR, client runtime, CLI, or build)
- Why it cannot be done with existing escape hatches (\`onRequest\`, raw response spec, \`onError\`, inline \`<script nonce>\`)

Show this to the developer and confirm before proceeding.

## Step 2 — Locate the framework source

Check for the framework repo in this order:

\`\`\`bash
# 1. Already cloned alongside this project?
ls ../pulse2/src 2>/dev/null && echo "found at ../pulse2"

# 2. Available elsewhere on disk?
find ~ -maxdepth 5 -name "pulse2" -type d 2>/dev/null | head -3

# 3. Clone it if not found
gh repo clone invisibleloop/pulse /tmp/pulse-contrib
\`\`\`

Use whichever path is found. All subsequent steps run from that directory.

## Step 3 — Read before writing

Read the files relevant to your change. Match the existing patterns exactly — do not introduce new patterns without a strong reason.

| Adding | Read first |
|--------|-----------|
| New spec property | \`src/spec/schema.js\`, \`src/server/index.js\`, \`src/runtime/ssr.js\` |
| New server behaviour | \`src/server/index.js\` |
| New client behaviour | \`src/runtime/index.js\`, \`src/runtime/navigate.js\` |
| New CLI command | \`src/cli/index.js\` and one existing command file for style reference |
| New build option | \`scripts/build.js\` |
| Scaffold change | \`src/cli/scaffold.js\` |

Also read the existing test file(s) for each file you will change, so your tests follow the same style.

## Step 4 — Create a branch

\`\`\`bash
cd <framework-path>
git checkout main
git pull origin main
git checkout -b feat/<short-description>
\`\`\`

Use \`feat/\`, \`fix/\`, \`docs/\` prefixes matching the change type.

## Step 5 — Implement

Make the smallest change that fully implements the feature. Constraints:

- **Match the existing code style exactly** — spacing, naming, comment style, error message format.
- **No new runtime dependencies.** The server and client runtime are zero-dependency. esbuild is the only dev dependency.
- **Schema changes must be backward-compatible.** New spec properties must be optional.
- **Error messages must be actionable.** Say what was wrong and what to provide instead.
- **Security headers are on by default.** Any new HTTP response path must include the full security header set.

### Checklist for adding a spec property

- [ ] \`src/spec/schema.js\` — add property definition, type check, and validation error message
- [ ] \`src/server/index.js\` — read the property and pass it to the renderer
- [ ] \`src/runtime/ssr.js\` — render it into the HTML output
- [ ] \`src/runtime/index.js\` — handle on the client if there is client-side behaviour
- [ ] All relevant test files updated

## Step 6 — Write tests

Add tests in the \`.test.js\` file alongside each file changed. Use Node's built-in test runner:

\`\`\`js
import { test } from 'node:test'
import assert from 'node:assert/strict'
\`\`\`

Cover the happy path, invalid input with the correct error message, and edge cases. Do not delete or modify existing tests unless the change intentionally breaks backward compatibility (confirm with the developer first).

## Step 7 — Run all tests

\`\`\`bash
cd <framework-path>
npm test
\`\`\`

All tests must pass. Fix any failures before continuing.

## Step 8 — Commit

\`\`\`bash
git add -p
git commit -m "feat: <short description>

<one or two sentences on what was added and why>"
\`\`\`

## Step 9 — Push and open a PR

\`\`\`bash
git push origin feat/<short-description>

gh pr create \\
  --title "feat: <short description>" \\
  --body "$(cat <<'EOF'
## What

<1–3 sentences describing what this adds or fixes.>

## Why

<1–2 sentences on the motivation — what could not be done before, or what was broken.>

## Changes

- \`src/spec/schema.js\` — <what changed>
- \`src/server/index.js\` — <what changed>

## Tests

- [ ] All existing tests pass (\`npm test\`)
- [ ] New tests added for the happy path
- [ ] New tests added for invalid input
- [ ] Manually tested in a Pulse project

## Notes

<Any tradeoffs, limitations, or follow-up work worth flagging.>
EOF
)"
\`\`\`

## Step 10 — Report back

Tell the developer the PR URL, a plain-English summary of what changed and which files, and any limitations or follow-up work they should know about.
`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function write(dir, relPath, content) {
  const filePath = path.join(dir, relPath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}
