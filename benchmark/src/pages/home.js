/**
 * Benchmark page — static page, no client JS.
 * Represents a content page with no hydration.
 */
export default {
  route: '/home',

  meta: {
    title: 'Home — Pulse Benchmark',
    styles: ['/pulse.css'],
  },

  state: {},

  view: () => `
    <main id="main-content">
      <h1>Pulse Benchmark</h1>
      <p>Static page — no client-side interactivity.</p>
    </main>
  `,
}
