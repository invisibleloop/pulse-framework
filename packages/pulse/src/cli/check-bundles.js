/**
 * Pulse — Bundle content inspection (shared logic)
 *
 * The single source of truth behind pulse_check_bundles (MCP tool, for an
 * agent) and `pulse check-bundles` (CLI command, for a human). Lighthouse
 * checks scores; this checks what's actually inside the generated
 * public/dist/ bundle files after a production build — a boot bundle
 * generated for a page that doesn't need one, or server-only code that
 * leaked through stripping. Neither of those shows up as a score failure.
 */

import fs   from 'fs'
import path from 'path'
import { discoverPages } from './discover.js'

const NODE_BUILTINS = ['node:fs', 'node:path', 'node:crypto', 'node:os', 'node:child_process', 'node:http', 'node:https', 'node:net', 'node:dns']

/**
 * Inspect public/dist/ after a production build.
 *
 * @param {string} root - project root
 * @returns {{
 *   error: string|null,
 *   issues: string[],
 *   confirms: string[],
 * }}
 */
export function checkBundles(root) {
  const distDir = path.join(root, 'public', 'dist')
  const manifestPath = path.join(distDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    return { error: 'No public/dist/manifest.json found — run a production build first.', issues: [], confirms: [] }
  }

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    return { error: `Could not parse manifest.json: ${err.message}`, issues: [], confirms: [] }
  }

  const issues = []
  const confirms = []

  // Read each page's raw source directly rather than importing the module —
  // no need to re-execute project code just to check for hydration need.
  // needsHydration mirrors discover.js's own check exactly: mutations ||
  // actions || persist. The manifest key for a page is always
  // /src/pages/<relative path> — that's how loadPages/build.js both derive
  // it, so no fuzzy route matching is needed.
  let pageFiles = []
  try {
    pageFiles = discoverPages(root)
  } catch { /* fall through — bundle-content checks below still run */ }

  for (const { filePath, derivedRoute } of pageFiles) {
    const source = fs.readFileSync(filePath, 'utf8')
    const needsHydration = /\b(mutations|actions|persist)\s*:/.test(source) || /\bhydrate\s*:/.test(source)
    if (needsHydration) continue // genuinely needs hydration — nothing to flag
    const manifestKey = '/src/pages/' + path.relative(path.join(root, 'src', 'pages'), filePath)
    const bundled = manifest[manifestKey]
    if (bundled) {
      // discoverPages' derivedRoute is a filename-based fallback (spec.route
      // wins at runtime, e.g. for a dynamic /:code route on a file literally
      // named redirect.js) — read the spec's real declared route from source
      // when present, so the message names the route that's actually
      // registered, not just what the filename implies.
      const routeMatch = source.match(/\broute\s*:\s*['"]([^'"]+)['"]/)
      const route = routeMatch ? routeMatch[1] : derivedRoute
      issues.push(`✗ Route "${route}" (${manifestKey}) has no mutations/actions/persist but a boot bundle exists (${bundled}) — should ship zero client JS. If this page imports a local server-only helper (e.g. using node:fs), the build may be one dependency away from failing outright.`)
    }
  }

  // Scan every generated boot file for a literal Node built-in reference —
  // the strongest, cheapest signal that server-only code leaked through.
  let bootFiles = []
  try {
    bootFiles = fs.readdirSync(distDir).filter(f => f.includes('.boot-') && f.endsWith('.js'))
  } catch { /* dist dir read failure — nothing more to check */ }

  for (const file of bootFiles) {
    const content = fs.readFileSync(path.join(distDir, file), 'utf8')
    const leaked = NODE_BUILTINS.filter(b => content.includes(b))
    if (leaked.length > 0) {
      issues.push(`✗ ${file} contains a literal reference to ${leaked.join(', ')} — server-only code leaked into a client bundle. This will throw at runtime in the browser (these modules don't exist there) even if the build itself succeeded.`)
    } else {
      confirms.push(`✓ ${file} — no Node built-in references found`)
    }
  }

  if (bootFiles.length === 0) confirms.push('✓ No boot bundles generated — consistent with a purely server-rendered project, if that\'s expected')

  return { error: null, issues, confirms }
}

export function formatBundleCheck(result) {
  if (result.error) return result.error

  const lines = ['## Bundle content check\n']
  if (result.issues.length === 0) {
    lines.push('✓ All clear — no unnecessary bundles, no leaked server-only code.\n')
  } else {
    lines.push('### Issues found\n')
    for (const i of result.issues) lines.push(i)
    lines.push('')
  }
  if (result.confirms.length > 0) {
    lines.push('### Checked\n')
    for (const c of result.confirms) lines.push(c)
  }

  return lines.join('\n')
}
