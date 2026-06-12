Start the Pulse production server for this project — **locally, on the production port (dev port + 1, normally 3001)** so it can run alongside the dev server on 3000.

First ensure a build exists (`public/dist/` — run `pulse build` if not). Then:

```bash
pulse start --port 3001
```

If `pulse.config.js` sets a custom `port`, use that value + 1 instead.

> **Why the flag:** plain `pulse start` binds the configured port (3000) because in real deployment it is the only server and platforms inject `PORT`. Locally that collides with the dev server and breaks the convention used by `pulse_build`, Lighthouse, and the performance trace — production is always dev port + 1. Never use `--port` in actual deployment.
