/**
 * Shared metrics holder. Populated by docs/server.js at startup
 * before createServer() is called. home.js reads from here so
 * the spec file stays free of Node built-ins (safe to bundle for browser).
 */
export const metricsStore = { current: null }
