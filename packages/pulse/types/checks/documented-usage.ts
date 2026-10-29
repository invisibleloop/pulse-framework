/**
 * Type tests: compiled by `npm run typecheck`, never run. Each block is usage the docs and
 * CLAUDE.md teach; before these existed the declarations rejected most of it (state required, async
 * meta refused, no stream.scope, createServer typed synchronous, hero typed with props it does not
 * read), and `npm run typecheck` could not notice because it only checked that the .d.ts parse.
 */
import { createServer } from '../index.js'
import type { PulseSpec, FormValue, SubmitResult, SitemapEntry, PulseStoreDefinition, ServerState } from '../index.js'
import { hero, card, cta, feature, media, grid, stat, alert, checkbox, iconSun, select, type SelectOption } from '../ui.js'
import { barChart, type ChartDataPoint } from '../charts.js'
import { mount } from '../runtime.js'
import { initNavigation } from '../navigate.js'

// A purely server-rendered page: no state, and a view that destructures the fetchers it asked for
export const post: PulseSpec = {
  route: '/blog/:slug',
  meta: {
    title:       async (ctx) => `${ctx.params.slug} — Blog`,
    description: (ctx) => `Post ${ctx.params.slug}`,
    styles:      (ctx) => ['/pulse-ui.css', `/themes/${ctx.params.slug}.css`],
    theme:       'light',
  },
  server: { post: async (ctx) => ({ title: ctx.params.slug, html: '<p>x</p>' }) },
  view: (state, { post }) => `<main id="main-content"><h1>${post.title}</h1></main>`,
}

// Streaming with a scope per segment
export const dashboard: PulseSpec = {
  route: '/dashboard',
  server: { user: async () => 'a', feed: async () => ['b'] },
  stream: { shell: ['header'], deferred: ['feed'], scope: { header: ['user'], feed: ['feed'] } },
  view: { header: (state, server) => `<h1>${server.user}</h1>`, feed: (state, server) => `<ul>${server.feed.length}</ul>` },
}

// A form page: the view reads the submit result and the CSRF field from server state
export const contact: PulseSpec = {
  route: '/contact',
  submit: async (ctx): Promise<SubmitResult> => {
    const data = await ctx.formData()
    const email: FormValue | undefined = data?.email
    return typeof email === 'string' ? { redirect: '/thanks' } : { errors: { email: 'Required' }, values: data ?? {} }
  },
  sitemap: async (): Promise<SitemapEntry[]> => ['/contact'],
  view: (state, server: ServerState) => `<form method="POST">${server.csrf}</form>`,
}

// createServer is async, and takes spec objects or URLs of spec files
export async function start(store: PulseStoreDefinition) {
  const { server, shutdown, pushStore } = await createServer([post, dashboard, new URL('./other.js', import.meta.url)], { port: 3000, store, live: true })
  server.address()
  shutdown()
  pushStore({ stock: 1 })
}

// The dev/prod bootstrap
export function boot(root: HTMLElement, spec: PulseSpec) {
  const instance = mount(spec, root, {}, { ssr: true })
  initNavigation(root, mount).setMount(instance)
}

// Components take the props they read
export const html = [
  hero({ eyebrow: 'New', title: 'T', subtitle: 'S', actions: '', image: '', layout: 'split' }),
  card({ title: 'T', content: '<p>x</p>' }),
  cta({ title: 'T', subtitle: 'S', actions: '' }),
  feature({ icon: iconSun(), title: 'T', description: 'D' }),
  media({ image: '<img>', content: '<p>x</p>', reverse: true }),
  grid({ cols: 3, content: '<p>x</p>' }),
  stat({ label: 'L', value: '1', change: '+1%' }),
  alert({ variant: 'info', message: 'hi' }),
  checkbox({ name: 'a', label: 'A' }),
  iconSun({ size: 20, bg: 'circle', bgColor: 'accent' }),
  select({ name: 'n', options: ['a', { value: 'b', label: 'B' }] satisfies SelectOption[] }),
  barChart({ data: [{ label: 'a', value: 1 }] satisfies ChartDataPoint[] }),
]

// ...and the names the old hand-written declarations (and the docs of a previous era) used are errors,
// because passing them rendered an empty component with no warning
// @ts-expect-error hero reads `title`, not `heading`
hero({ heading: 'T' })
// @ts-expect-error grid reads `content`, not `items`
grid({ items: ['<p>x</p>'] })
// @ts-expect-error media reads `image`, not `src`
media({ src: 'a.jpg' })
