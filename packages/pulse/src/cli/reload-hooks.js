/**
 * Pulse — module-loader hook for dev hot reload
 *
 * `pulse dev` re-imports each page with `?t=<stamp>` to dodge Node's ESM cache, but that
 * only refreshes the page file: everything the page imports (src/lib, src/components, ...)
 * resolves to the same URL as before and comes back stale from the cache. This hook gives
 * a project module imported by a stamped module the same stamp, so the whole project
 * graph is re-evaluated on a reload.
 *
 * Only the project's own files are stamped. Anything in node_modules, the framework
 * itself, and `node:` builtins keep their URL, so packages (and framework singletons)
 * are evaluated once rather than once per edit.
 *
 * Limits: CommonJS files (.cjs) are cached by path, so the stamp cannot refresh them, and
 * modules outside the project root (e.g. a sibling workspace package) are neither stamped
 * nor watched.
 */

let rootUrl = ''

export function initialize(data) {
  rootUrl = data.rootUrl
}

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context)
  const url = result.url
  if (!rootUrl || !url.startsWith(rootUrl) || url.includes('?')) return result
  if (url.slice(rootUrl.length).includes('node_modules/')) return result // below the root: a project may itself live under a node_modules folder
  if (!context.parentURL?.startsWith(rootUrl)) return result

  const stamp = new URL(context.parentURL).searchParams.get('t')
  if (!stamp || !/^\d+$/.test(stamp)) return result
  return { ...result, url: `${url}?t=${stamp}` }
}
