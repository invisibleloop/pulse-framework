export default {
  route: '/static',
  meta: { title: 'Static', description: 'E2E fixture', theme: 'light', styles: ['/pulse-ui.css'] },
  view: () => `<a href="#main-content" class="pulse-skip-link">Skip to main content</a>
  <main id="main-content">
    <h1>Static</h1>
    <a id="back-home" href="/">Home</a>
    <!-- A probe: this page has no client bundle, so nothing should answer this click. If the
         previous page's mount were still alive it would run its "inc" mutation and re-render
         its own view over this one. -->
    <button id="stale-probe" data-event="inc">probe</button>
  </main>`,
}
