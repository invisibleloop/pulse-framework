/**
 * Pulse — load and check pulse.config.js.
 *
 * A config that cannot be loaded used to be ignored silently: a syntax error made `pulse dev`
 * fall back to the defaults (a different port, no csp, no redirects) with no hint why. It is an
 * error now, and a few values are checked so a typo fails here, with the file named, instead of
 * starting a server on "localhost:abc".
 */

import fs   from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

export class ConfigError extends Error {
  constructor(message) { super(message); this.name = 'ConfigError' }
}

/** Check the values that would otherwise fail confusingly later. Throws ConfigError. */
export function checkConfig(cfg, file = 'pulse.config.js') {
  if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new ConfigError(`${file} must export an object as its default export (export default { ... }).`)
  }
  if (cfg.port !== undefined && !(Number.isInteger(cfg.port) && cfg.port >= 1 && cfg.port <= 65535)) {
    throw new ConfigError(`${file}: port must be a whole number from 1 to 65535 (got ${JSON.stringify(cfg.port)}).`)
  }
  if (cfg.agent !== undefined && !['claude', 'copilot'].includes(cfg.agent)) {
    throw new ConfigError(`${file}: agent must be 'claude' or 'copilot' (got ${JSON.stringify(cfg.agent)}).`)
  }
  return cfg
}

/**
 * The project's pulse.config.js default export, or {} when there is no such file.
 * Throws ConfigError when the file exists but cannot be loaded or has an invalid value.
 * @param {string} root - project root
 * @param {{ bust?: boolean }} [opts] - bust: bypass the module cache (hot reload)
 */
export async function loadConfig(root, { bust = false } = {}) {
  const file = path.join(root, 'pulse.config.js')
  if (!fs.existsSync(file)) return {}
  let mod
  try {
    mod = await import(pathToFileURL(file).href + (bust ? `?t=${Date.now()}` : ''))
  } catch (err) {
    throw new ConfigError(`pulse.config.js could not be loaded: ${err?.message ?? err}\n  (${file})`)
  }
  return checkConfig(mod.default ?? {})
}

/** For the CLI: load the config, or print the problem without a stack trace and exit 1. */
export async function loadConfigOrExit(root, opts) {
  try {
    return await loadConfig(root, opts)
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err
    console.error(`\n  ${err.message}\n`)
    process.exit(1)
  }
}

/**
 * For `.catch()` on createServer in the CLI entry points: an invalid spec is the user's to fix, so
 * print the message (it names the route and the file) and exit 1, with no stack trace. Anything
 * else is rethrown unchanged.
 */
export function failStartup(err) {
  if (err?.code === 'PULSE_INVALID_SPEC') {
    console.error(`\n  ${err.message}\n`)
    process.exit(1)
  }
  throw err
}
