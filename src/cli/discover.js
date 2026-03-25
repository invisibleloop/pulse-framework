/**
 * Pulse — Page discovery
 *
 * Scans src/pages/ and derives routes from filenames.
 * Convention:
 *   home.js        → /
 *   about.js       → /about
 *   products.js    → /products
 *   blog/index.js  → /blog
 *   blog/post.js   → /blog/post
 *
 * The spec's route property overrides the filename-derived route.
 */

import fs   from 'fs'
import path from 'path'

/**
 * Derive a route from a file path relative to the pages directory.
 *
 * @param {string} relPath - e.g. 'home.js', 'blog/post.js'
 * @returns {string} - e.g. '/', '/blog/post'
 */
export function deriveRoute(relPath) {
  const withoutExt = relPath.replace(/\.js$/, '')
  const parts      = withoutExt.split(path.sep)

  // index.js or home.js at any level maps to the parent route
  const last = parts[parts.length - 1]
  if (last === 'index' || last === 'home') parts.pop()

  if (parts.length === 0) return '/'
  return '/' + parts.join('/')
}

/**
 * Recursively find all .js files under a directory.
 *
 * @param {string} dir
 * @param {string} [base] - used internally for recursion
 * @returns {string[]} - paths relative to dir
 */
function findFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry)
    const rel  = path.relative(base, full)
    if (fs.statSync(full).isDirectory()) return findFiles(full, base)
    if (entry.endsWith('.js') && !entry.endsWith('.test.js')) return [rel]
    return []
  })
}

/**
 * Discover all pages in the project's src/pages directory.
 * Returns an array of { filePath, derivedRoute } objects.
 * The caller is responsible for importing the specs.
 *
 * @param {string} projectRoot
 * @returns {{ filePath: string, derivedRoute: string }[]}
 */
export function discoverPages(projectRoot) {
  const pagesDir = path.join(projectRoot, 'src', 'pages')
  const files    = findFiles(pagesDir)

  return files.map(relPath => ({
    filePath:     path.join(pagesDir, relPath),
    derivedRoute: deriveRoute(relPath),
  }))
}

/**
 * Load all page specs from src/pages/, applying derived routes
 * where the spec doesn't declare its own.
 *
 * @param {string} projectRoot
 * @returns {Promise<import('../spec/schema.js').PulseSpec[]>}
 */
export async function loadPages(projectRoot, bust = 0) {
  const pages = discoverPages(projectRoot)

  const specs = await Promise.all(
    pages.map(async ({ filePath, derivedRoute }) => {
      const url  = bust ? `${filePath}?t=${bust}` : filePath
      const mod  = await import(url)
      const spec = mod.default

      if (!spec || typeof spec !== 'object') {
        throw new Error(`Page file must export a default spec object: ${filePath}`)
      }

      // Auto-set hydrate only for pages that need client-side JS.
      // Purely SSR pages (no mutations, actions, persist) ship zero JS.
      // spec.hydrate wins if explicitly provided.
      const needsHydration = spec.hydrate || spec.mutations || spec.actions || spec.persist
      const hydrateUrl = needsHydration
        ? spec.hydrate || ('/src/pages/' + path.relative(
            path.join(projectRoot, 'src', 'pages'),
            filePath
          ))
        : null

      return {
        ...spec,
        route:   spec.route || derivedRoute,
        ...(hydrateUrl ? { hydrate: hydrateUrl } : {}),
      }
    })
  )

  return specs
}
