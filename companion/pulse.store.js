/**
 * Companion dashboard — global store.
 *
 * Holds the aggregated view of a target project's .pulse/ telemetry:
 *   - errors        — .pulse/errors.json            (dev-only error journal)
 *   - lighthouse     — .pulse/reports/<slug>/*.json   (Lighthouse audit history)
 *   - loadTests       — .pulse/load-reports/<slug>/*.json (load test history)
 *
 * watcher.js populates this by calling pushStore() whenever it detects a
 * change under the target project's .pulse/ directory — every browser tab
 * with the dashboard open re-renders live via the existing SSE mechanism
 * (createServer({ live: true })), the same primitive spec.store pages use
 * for any other live-pushed data.
 */
export default {
  state: {
    projectRoot: null,
    errors:      [],
    lighthouse:  {},   // { [slug]: report[] }
    loadTests:   {},   // { [slug]: report[] }
    lastUpdated: null,
  },
}
