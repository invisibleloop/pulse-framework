# Pulse Companion

A local dashboard that watches a Pulse project's `.pulse/` telemetry — the dev
error journal, Lighthouse reports, and load test reports — and shows it live
in the browser. No refresh, no polling: every change is pushed to open tabs
over the same SSE store-push mechanism (`createServer({ live: true })` +
`pushStore()`) ordinary Pulse specs use for any other live data.

This is a proof-of-concept for a hosted companion product — the same
architecture (agent/CLI writes structured data locally → server watches and
broadcasts → browser tab updates live) is what a real hosted version would
use, just pointed at a remote API instead of a local filesystem watcher.

## Run it

```bash
# From the monorepo root:
node packages/pulse/scripts/build.js --root companion   # production build
node companion/server.js --project /path/to/your/pulse/project --port 5500
```

Then open `http://localhost:5500`. Point `--project` at any Pulse project
that has (or will have) a `.pulse/` directory — the dashboard starts empty
and fills in as errors are logged, Lighthouse audits run, or load tests
complete in that project.

Rebuild after editing `src/pages/home.js`, `pulse.store.js`, or the CSS —
this app is served from its production build (`public/dist/`), not the dev
source-serving path, so `server.js` (a bare `createServer` entry) doesn't
pick up source edits automatically the way `pulse dev` does.

## How it works

- **`watcher.js`** — `fs.watch`es the target project's `.pulse/` directory
  (recursive, debounced) and reads a fresh snapshot on every change: the
  error journal via the real shared `readJournal()` (the same function
  `pulse_diagnose`/`pulse diagnose` use, so the dashboard never drifts from
  what the CLI/agent actually see), plus Lighthouse and load-test reports
  via plain `fs` + `JSON.parse`.
- **`server.js`** — a `createServer({ live: true })` entry that seeds the
  store's initial state from a synchronous snapshot (so first paint isn't
  empty) and calls `pushStore(snapshot)` on every watcher change.
- **`pulse.store.js`** — the shared store shape (`errors`, `lighthouse`,
  `loadTests`, `lastUpdated`).
- **`src/pages/home.js`** — a single `store: [...]`-subscribing page that
  renders all three panels from whatever's currently in the store.

## Known limitations (proof-of-concept scope)

- Single project, no auth, local only — this proves the live-update
  pipeline works end to end, not a multi-tenant hosted product.
- `.pulse/load-reports/` and `.pulse/reports/` entries older than 30 days
  are filtered out, matching the existing `report-server.js` window.
- The error journal is dev-only and ring-buffered at 50 entries (see
  `@invisibleloop/pulse`'s own `server/index.js`) — this dashboard shows
  whatever's currently in `.pulse/errors.json`, nothing more.
