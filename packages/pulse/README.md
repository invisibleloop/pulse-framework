# Pulse

**A spec-first, AI-native web framework.** Early access.

Write a plain JavaScript object that describes what a page does. Pulse handles routing, SSR, hydration, client-side navigation, compression, security headers, and caching automatically.

```js
export default {
  route: '/counter',
  meta: {
    title: 'Counter',
    styles: ['/app.css'],
  },

  state: { count: 0 },

  constraints: {
    count: { min: 0, max: 10 },
  },

  view: (state) => `
    <main id="main-content">
      <p>${state.count}</p>
      <button data-event="decrement">−</button>
      <button data-event="increment">+</button>
    </main>
  `,

  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
}
```

## Requirements

Node.js 22 or later (tested on 22 and 24). Browsers: pages with no client JavaScript work anywhere; interactive pages need Chrome/Edge 98, Firefox 94 or Safari 15.4 (March 2022) or later — see [browser support](https://pulseframework.dev/performance#browser-support).

## Getting started

```bash
npm install -g @invisibleloop/pulse
mkdir my-project && cd my-project
pulse
```

Running `pulse` in an empty directory scaffolds a new project. Run `pulse` again inside it to start an AI coding session; your agent has MCP tools and slash commands available from the first prompt.

Full documentation: **[pulseframework.dev](https://pulseframework.dev)**

## Key ideas

**The spec is the source of truth.** Every page is a single JS object — data fetching, state, mutations, async actions, and view all in one place. No separate files for routes, controllers, or templates.

**Performance is built in.** Streaming SSR, immutable asset caching, and zero layout shift are automatic. Every scaffolded project targets Lighthouse 100 for Accessibility, Best Practices, and SEO — and is fast by design (streaming HTML before data resolves, CLS 0.00).

**No client-side dependencies.** Pulse ships no runtime framework to the browser — only a small hydration bundle that binds your spec's mutations and actions to the DOM (pages with no client behaviour ship none).

**Forms work without JavaScript.** A spec with a `submit` function accepts a plain HTML form POST, with CSRF protection and a redirect after success. Hydrated visitors get the same form without a page reload.

**Shared view code is plain functions.** A long view splits into component functions in `src/components/` that pages import. There is no template language to learn.

**Live updates are built in.** The server can push shared data (stock, scores, announcements) to every open page over server-sent events, with `live: true` and `pushStore`. Per-user streaming, such as chat text token by token, is not built in yet.

**AI-native.** The CLI starts an MCP server alongside the dev server, giving the coding agent tools to create pages, validate specs, and run Lighthouse audits — all without leaving the editor. The agent tools run on the MCP SDK, which is a development dependency of your project (new projects include it), so a production install does not carry it.

## CLI

```bash
pulse              # scaffold a new project or start AI session
pulse dev          # dev server (port 3000, or the next free port)
pulse build        # production build → public/dist/
pulse start        # production server
pulse update       # upgrade Pulse to the latest version and refresh copied assets
pulse init-ai <client>  # MCP config for Cursor, Windsurf or Claude Desktop (add --write to merge it in)
```

## Docs

Full reference at [pulseframework.dev](https://pulseframework.dev):

- **Getting started** — install, scaffold, first page
- **The spec** — full reference for every property
- **State, mutations, actions** — client interactivity
- **Server data** — async data fetching before render
- **Routing** — dynamic routes and URL params
- **Streaming SSR** — shell + deferred segments
- **Global store and live updates** — state shared between pages, and server-pushed updates over SSE
- **Forms** — server-side forms that work with JavaScript off, with CSRF protection
- **Project structure** — folders, and shared components in `src/components/`
- **Testing** — render a page's view in plain Node, with no browser
- **Caching** — per-page TTL and HTTP cache headers
- **Guard** — authentication and authorisation before data fetches
- **Validation & constraints** — declarative form validation and state bounds
- **Raw responses** — RSS feeds, sitemaps, JSON APIs
- **Markdown** — built-in parser for blog posts and docs pages, zero browser JS
- **Performance** — how the framework hits Lighthouse 100
- **Configuration and deployment** — `pulse.config.js`, `createServer` options and hosting
- **UI components** — 40+ built-in components

## For coding agents

The guides an agent needs are Markdown files in this package. After `npm install` they are in `node_modules/@invisibleloop/pulse/src/agent/`. You do not need to read the framework source. Read only the guides your task needs. Each one costs tokens on every later step.

| File | Covers | Read it |
| --- | --- | --- |
| `guide-spec.md` | the spec object, state, the query string and page cache, a 404 for an unknown id, code that reaches the browser | for every task |
| `guide-styles.md` | CSS, tokens, images, accessibility in CSS, and the build's removal of unused CSS | for every task that has styles |
| `guide-routing.md` | routes, params, redirects and the 404 page | when the site has more than one page, or dynamic routes |
| `guide-server.md` | server data, forms, cookies, caching, the store, `pulse start` and what `pulse build` runs | when a page loads data or has a form, or when you build and serve the site |
| `guide-components.md` | the `@invisibleloop/pulse/ui` components | when you use those components |
| `guide-ops.md` | running in production: reverse proxy, health check, graceful shutdown, error journal, third-party scripts, markdown pages | only when you deploy, or use markdown pages or third-party scripts |
| `workflow.md` | how to plan and check a page | when you plan a new page |
| `checklist.md` | the accessibility, image, security and form rules to check against | once the page works, before you finish |

The other files in that folder (`guide-examples.md`, `guide-templates.md`, `guide-design-references.md`, `guide-design-gallery.md`, `guide-explore.md`) are for landing pages, design work and worked examples. Skip them when you build an app.

Read the guides with your file-reading tool when you have one: it returns a whole file. Shell output above about 30,000 characters is cut to a short preview, and several guides joined with `cat` go over that. If you use the shell, read one guide per command. A preview ends with `<persisted-output>`. When you see it, read the saved file with your file-reading tool, in pieces if needed. Do not work from the preview.

Running `pulse` in a project serves the same files as MCP resources (`pulse://guide`).

## Reporting framework bugs

If your coding agent hits what looks like a bug in Pulse itself, it can file a report through the `pulse_report_issue` MCP tool. It is always a two-step process: the tool first returns a redacted preview (local paths, tokens, secrets and emails stripped), and nothing is sent until the agent confirms that exact payload. Reports become GitHub issues on [invisibleloop/pulse-framework](https://github.com/invisibleloop/pulse-framework).

To turn it off, set `reportFeedback: false` in `pulse.config.js`.

## Status

This is an early-access release. The core architecture is stable and production-quality, but the API may evolve before v1: a minor release (0.x.0) can contain breaking changes, patch releases will not. See [Stability & Versioning](https://pulseframework.dev/stability). Feedback and issues welcome on [GitHub](https://github.com/invisibleloop/pulse-framework).

## License

MIT, see [LICENSE](LICENSE). Contributions: see [CONTRIBUTING.md](https://github.com/invisibleloop/pulse-framework/blob/main/CONTRIBUTING.md).
