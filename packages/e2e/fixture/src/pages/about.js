export default {
  route: '/about',
  meta: { title: 'About', description: 'E2E fixture', theme: 'light', styles: ['/pulse-ui.css'] },
  state: { count: 0 },
  mutations: { inc: (s) => ({ count: s.count + 1 }) },
  view: (s) => `<main id="main-content">
    <h1>About</h1>
    <a id="back-home" href="/">Home</a>
    <button id="inc" data-event="inc">count ${s.count}</button>
    <div style="height:2400px">spacer</div>
    <h2 id="part-two" tabindex="-1">Part two</h2>
    <div style="height:2400px">spacer</div>
  </main>`,
}
