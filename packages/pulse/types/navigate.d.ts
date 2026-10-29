/**
 * Pulse — Client-side navigation types
 * @invisibleloop/pulse/navigate
 */

import type { MountResult, MountOptions } from './runtime.js'
import type { PulseSpec } from './schema.js'

/**
 * Initialise client-side navigation for a Pulse app.
 *
 * Intercepts same-origin <a> clicks and browser back/forward events.
 * Fetches new pages as JSON fragments (via X-Pulse-Navigate header),
 * swaps #pulse-root, and re-mounts the new spec without a full page reload.
 * Falls back to location.href on any fetch or import error.
 *
 * Call once after the initial mount(), and pass that instance to the returned
 * `setMount` so the first navigation destroys it. Without it the first page's
 * listeners stay alive and every handler present on both pages runs twice.
 *
 * @param root    The #pulse-root element
 * @param mountFn The mount() function from @invisibleloop/pulse/runtime
 *
 * @example
 * import { mount }          from '@invisibleloop/pulse/runtime'
 * import { initNavigation } from '@invisibleloop/pulse/navigate'
 *
 * const root = document.getElementById('pulse-root')
 * const instance = mount(spec, root, window.__PULSE_SERVER__ ?? {}, { ssr: true })
 * initNavigation(root, mount).setMount(instance)
 */
export function initNavigation(
  root:    HTMLElement,
  mountFn: (
    spec:        PulseSpec<any, any>,
    el:          HTMLElement,
    serverState?: Record<string, unknown>,
    options?:    MountOptions
  ) => MountResult
): {
  /** Register the first page's mount so the first navigation destroys it. */
  setMount(instance: MountResult | null | undefined): void
}
