/**
 * Pulse — Client-side navigation types
 * @invisibleloop/pulse/navigate
 */

import type { MountResult } from './runtime.js'
import type { PulseSpec } from './schema.js'

/**
 * Initialise client-side navigation for a Pulse app.
 *
 * Intercepts same-origin <a> clicks and browser back/forward events.
 * Fetches new pages as JSON fragments (via X-Pulse-Navigate header),
 * swaps #pulse-root, and re-mounts the new spec without a full page reload.
 * Falls back to location.href on any fetch or import error.
 *
 * Call once after the initial mount().
 *
 * @param root    The #pulse-root element
 * @param mountFn The mount() function from @invisibleloop/pulse/runtime
 *
 * @example
 * import { mount }          from '@invisibleloop/pulse/runtime'
 * import { initNavigation } from '@invisibleloop/pulse/navigate'
 *
 * const root = document.getElementById('pulse-root')
 * const m = mount(spec, root, window.__PULSE_SERVER__ ?? {}, { ssr: true })
 * initNavigation(root, mount)
 */
export function initNavigation(
  root:    HTMLElement,
  mountFn: (
    spec:        PulseSpec,
    el:          HTMLElement,
    serverState?: Record<string, unknown>,
    options?:    { ssr?: boolean; store?: unknown }
  ) => MountResult
): void
