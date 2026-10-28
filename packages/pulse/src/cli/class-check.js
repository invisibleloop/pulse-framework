/**
 * Pulse — the dev server's "classes used but not defined" check, as pure functions.
 *
 * Every stylesheet in public/ counts as a definition, pulse-ui.css included, because its `u-*`
 * utilities are classes a page may use. (An earlier version skipped pulse-ui.css to avoid noise,
 * so the scaffolded page's own `u-*` utilities were reported as undefined.) The `ui-*` component
 * classes stay exempt: some are structural hooks with no rule of their own.
 */

/** Class names a stylesheet defines (a selector of the form `.name` followed by `{ , : [`). */
export function definedClasses(css) {
  const out = new Set()
  for (const [, cls] of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)\s*[{,:\[]/g)) out.add(cls)
  return out
}

/** Class names used in rendered HTML that no stylesheet defines. */
export function undefinedClasses(html, defined) {
  const used = new Set()
  for (const [, classes] of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of classes.trim().split(/\s+/)) if (cls && !cls.startsWith('ui-')) used.add(cls)
  }
  return [...used].filter(cls => !defined.has(cls))
}
