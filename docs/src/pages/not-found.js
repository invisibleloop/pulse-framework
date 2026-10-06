export default {
  route: '*',
  meta: {
    title: 'Page not found',
    theme: 'light',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  view: () => `
    <main id="main-content">
      <style>
        .not-found { text-align: center; padding: 6rem 2rem; max-width: 600px; margin: 0 auto; }
        .not-found h1 { font-size: 3rem; font-weight: 900; margin: 0 0 1rem; }
        .not-found p { font-size: 1.1rem; color: var(--muted); line-height: 1.6; margin: 1rem 0; }
        .not-found a { display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: var(--accent); color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; }
        .not-found a:hover { background: var(--accent-hover); }
      </style>

      <div class="not-found">
        <h1>404</h1>
        <p>This page doesn't exist.</p>
        <p>The route you're looking for isn't in our spec.</p>
        <a href="/">Back to home</a>
      </div>
    </main>
  `,
}
