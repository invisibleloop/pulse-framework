/**
 * Browser stub for @invisibleloop/pulse/md
 *
 * In dev mode, spec files are served raw to the browser for hydration. Any
 * top-level import of @invisibleloop/pulse/md must resolve to something — but
 * the server fetchers that actually call md()/parseMd() never run in the
 * browser. This stub satisfies the import without pulling in node:fs/path/url.
 */

export const md      = () => async () => ({ html: '', frontmatter: {} })
export const parseMd = ()       =>       ({ html: '', frontmatter: {} })
