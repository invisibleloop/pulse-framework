/**
 * Pulse — Markdown parser types
 * @invisibleloop/pulse/md
 */

/** Parsed frontmatter key/value pairs from the --- block */
export type Frontmatter = Record<string, string>

/** Result of parsing a markdown string */
export interface MdResult {
  /** HTML string ready to pass to prose({ content }) */
  html:         string
  /** Key/value pairs parsed from the --- frontmatter block */
  frontmatter:  Frontmatter
}

/** Request context passed to server fetchers */
export interface MdContext {
  params?: Record<string, string>
  [key: string]: unknown
}

/** Async server fetcher returned by md() */
export type MdFetcher = (ctx?: MdContext) => Promise<MdResult>

/**
 * Create a server fetcher that reads and parses a markdown file.
 *
 * Path patterns support :param placeholders resolved from ctx.params:
 *   md('content/blog/:slug.md')
 *
 * The result is cached per request on ctx._mdCache so meta and server
 * can both call the same fetcher without reading the file twice.
 *
 * Missing files throw an error with status 404 — add onViewError on
 * dynamic routes to handle this gracefully.
 *
 * @example
 * import { md }    from '@invisibleloop/pulse/md'
 * import { prose } from '@invisibleloop/pulse/ui'
 *
 * const post = md('content/blog/:slug.md')
 *
 * export default {
 *   route: '/blog/:slug',
 *   meta: {
 *     title:       async (ctx) => (await post(ctx)).frontmatter.title,
 *     description: async (ctx) => (await post(ctx)).frontmatter.description,
 *   },
 *   server: { post },
 *   view: (state, { post }) => prose({ content: post.html }),
 *   onViewError: () => '<p>Post not found.</p>',
 * }
 */
export function md(pathPattern: string | URL): MdFetcher

/**
 * Parse a markdown string into HTML and frontmatter.
 * Use this when markdown comes from a database or API rather than a file.
 *
 * @example
 * import { parseMd } from '@invisibleloop/pulse/md'
 *
 * const { html, frontmatter } = parseMd(record.body)
 */
export function parseMd(source: string): MdResult
