/**
 * Source of the production boot bundle entry generated for each hydrated page by
 * scripts/build.js. Its own module (build.js runs the whole build when imported) so the
 * generated code can be unit-tested.
 *
 * The first page's mount() instance is handed to initNavigation so the first client
 * navigation destroys it; without that its listeners outlive the page (#168).
 */
export function buildBootstrapSource({ relSpec, relRuntime, relNavigate, storeImport = '', mountOpts = '{ ssr: true }' }) {
  return `\
import spec from '${relSpec}'
import { mount } from '${relRuntime}'
import { initNavigation } from '${relNavigate}'${storeImport}

const root = document.getElementById('pulse-root')
if (root && !root.dataset.pulseMounted) {
  root.dataset.pulseMounted = '1'
  const instance = mount(spec, root, window.__PULSE_SERVER__ || {}, ${mountOpts})
  // Register the first page's instance so the first client navigation destroys it
  initNavigation(root, mount).setMount(instance)
}

export default spec
`
}
