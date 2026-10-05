/**
 * Pulse Companion — local dashboard server.
 *
 * Watches a target Pulse project's .pulse/ directory (errors.json, Lighthouse
 * reports, load-test reports) and shows it live in a browser — no refresh,
 * no polling. Every change is pushed to open tabs via the same SSE
 * store-push mechanism ordinary Pulse specs use for any live data.
 *
 * Usage:
 *   node server.js --project /path/to/your/pulse/project [--port 5500]
 */
import path from 'path'
import { createServer } from '../packages/pulse/src/server/index.js'
import { watchProject, readSnapshot } from './watcher.js'
import storeDef from './pulse.store.js'

const args       = process.argv.slice(2)
const projectArg = args.indexOf('--project')
const portArg    = args.indexOf('--port')

if (projectArg === -1) {
  console.error('Usage: node server.js --project /path/to/your/pulse/project [--port 5500]')
  process.exit(1)
}

const PROJECT_ROOT = path.resolve(args[projectArg + 1])
const PORT          = portArg !== -1 ? parseInt(args[portArg + 1], 10) : 5500

// Seed the store's initial state with a real snapshot so the very first
// server-rendered paint already shows current data, instead of the empty
// pulse.store.js default and a flash-of-empty until the first SSE push
// (~150ms later, see watcher.js's debounce) fills it in. createServer takes
// `store` as an explicit option — pulse.store.js auto-discovery is a `pulse
// dev`/`pulse start` CLI behaviour, not something createServer itself does,
// so a custom server entry like this one has to pass it in directly.
const seededStore = {
  ...storeDef,
  state: { ...storeDef.state, ...readSnapshot(PROJECT_ROOT) },
}

const { pushStore } = await createServer(
  [new URL('./src/pages/home.js', import.meta.url)],
  {
    port:      PORT,
    staticDir: new URL('./public', import.meta.url).pathname,
    root:      new URL('.', import.meta.url),
    store:     seededStore,
    live:      true,
  }
)

console.log(`⚡ Pulse Companion → http://localhost:${PORT}`)
console.log(`   watching: ${PROJECT_ROOT}/.pulse/`)

const stopWatching = watchProject(PROJECT_ROOT, (snapshot) => {
  pushStore(snapshot)
})

process.on('SIGINT', () => { stopWatching(); process.exit(0) })
process.on('SIGTERM', () => { stopWatching(); process.exit(0) })
