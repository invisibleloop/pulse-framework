export default {
  route: '/static',
  meta: { title: 'Static', description: 'E2E fixture', theme: 'light', styles: ['/pulse-ui.css'] },
  view: () => `<a href="#main-content" class="pulse-skip-link">Skip to main content</a>
  <main id="main-content">
    <h1>Static</h1>
    <a id="back-home" href="/">Home</a>
  </main>`,
}
