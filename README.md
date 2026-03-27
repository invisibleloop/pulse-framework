# Pulse

**A spec-first, AI-native web framework.** Early access.

Write a plain JavaScript object that describes what a page does. Pulse handles routing, SSR, hydration, client-side navigation, compression, security headers, and caching automatically.

```js
export default {
  route: '/counter',
  hydrate: '/src/pages/counter.js',
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

Node.js 22 or later.

## Getting started

```bash
npm install -g @invisibleloop/pulse
mkdir my-project && cd my-project
pulse
```

Running `pulse` in an empty directory scaffolds a new project and starts an AI coding session. Your agent has MCP tools and slash commands available from the first prompt.

Full documentation: **[pulseframework.dev](https://pulseframework.dev)**

## Key ideas

**The spec is the source of truth.** Every page is a single JS object — data fetching, state, mutations, async actions, and view all in one place. No separate files for routes, controllers, or templates.

**Performance is built in.** Streaming SSR, immutable asset caching, and zero layout shift are automatic. Every scaffolded project targets Lighthouse 100 across all four categories.

**No client-side dependencies.** Pulse ships no runtime framework to the browser — only a small hydration bundle (~2 kB brotli) that binds your spec's mutations and actions to the DOM.

**AI-native.** The CLI starts an MCP server alongside the dev server, giving the coding agent tools to create pages, validate specs, and run Lighthouse audits — all without leaving the editor.

## CLI

```bash
pulse              # scaffold a new project or start AI session
pulse dev          # dev server (default port 3000)
pulse build        # production build → public/dist/
pulse start        # production server
```

## Docs

Full reference at [pulseframework.dev](https://pulseframework.dev):

- **Getting started** — install, scaffold, first page
- **The spec** — full reference for every property
- **State, mutations, actions** — client interactivity
- **Server data** — async data fetching before render
- **Routing** — dynamic routes and URL params
- **Streaming SSR** — shell + deferred segments
- **Caching** — per-page TTL and HTTP cache headers
- **Guard** — authentication and authorisation before data fetches
- **Validation & constraints** — declarative form validation and state bounds
- **Raw responses** — RSS feeds, sitemaps, JSON APIs
- **Performance** — how the framework hits Lighthouse 100
- **UI components** — 50+ built-in components

## Status

This is an early-access release. The core architecture is stable and production-quality, but the API may evolve before v1. Feedback and issues welcome on [GitHub](https://github.com/invisibleloop/pulse).

## License

MIT
