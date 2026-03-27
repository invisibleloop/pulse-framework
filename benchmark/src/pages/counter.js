/**
 * Benchmark page — interactive counter with server data.
 * Represents a typical SPA page: runtime + mutations + server fetcher.
 */
export default {
  route: '/counter',
  hydrate: '/src/pages/counter.js',

  meta: {
    title: 'Counter — Pulse Benchmark',
    styles: ['/pulse.css'],
  },

  state: { count: 0 },

  constraints: {
    count: { min: 0, max: 10 },
  },

  server: {
    greeting: async () => 'Hello from the server',
  },

  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },

  view: (state, server) => `
    <main id="main-content">
      <p>${server.greeting}</p>
      <p>Count: ${state.count}</p>
      <button data-event="decrement">−</button>
      <button data-event="increment">+</button>
    </main>
  `,
}
