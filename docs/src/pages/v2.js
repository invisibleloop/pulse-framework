export default {
  route: '/v2',
  meta: {
    title: 'Pulse — The spec-first web framework',
    description: 'One plain JavaScript object per page. Server data, state, mutations, view. Zero runtime dependencies.',
    theme: 'light',
    styles: ['/pulse-ui.css', '/theme.css', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'],
  },
  view: () => `
    <main id="main-content">
      <style>
        * { box-sizing: border-box; }
        body { background: #ffffff; color: #171512; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif; line-height: 1.6; }

        .v2-container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }
        .v2-header { padding: 3rem 2rem; text-align: center; border-bottom: 1px solid #e8e8e8; }
        .v2-nav { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0; }
        .v2-nav-logo { font-weight: 800; font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; color: #171512; }
        .v2-nav-links { display: flex; gap: 2rem; }
        .v2-nav-links a { text-decoration: none; color: #5c574c; font-size: 0.9rem; font-weight: 500; transition: color 0.1s; }
        .v2-nav-links a:hover { color: #171512; }

        .v2-hero { padding: 5rem 2rem; text-align: center; }
        .v2-hero h1 { font-size: clamp(2.5rem, 8vw, 4rem); font-weight: 900; margin: 0 0 1rem; line-height: 1.1; letter-spacing: -0.02em; }
        .v2-hero .tagline { font-size: 1.25rem; color: #5c574c; margin: 2rem 0; max-width: 600px; margin-left: auto; margin-right: auto; font-weight: 500; line-height: 1.5; }
        .v2-cta { display: inline-flex; gap: 1rem; margin-top: 2.5rem; }
        .v2-btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 3px; text-decoration: none; font-weight: 600; font-size: 0.95rem; transition: background 0.1s, color 0.1s; }
        .v2-btn-primary { background: #1a1a1a; color: #ffffff; }
        .v2-btn-primary:hover { background: #2d2d2d; }
        .v2-btn-secondary { background: transparent; color: #171512; border: 2px solid #e8e8e8; }
        .v2-btn-secondary:hover { border-color: #171512; background: #f9f9f9; }

        .v2-section { padding: 4rem 2rem; border-bottom: 1px solid #f0f0f0; }
        .v2-section-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 1.5rem; }
        .v2-section-intro { font-size: 1.05rem; color: #5c574c; margin-bottom: 2rem; max-width: 700px; }

        .v2-code-block { background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 6px; padding: 2rem; margin: 2rem 0; overflow-x: auto; }
        .v2-code-block pre { margin: 0; font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 0.85rem; line-height: 1.6; }

        .v2-decision-tree { background: #f9f9f9; border-radius: 6px; padding: 2rem; margin: 2rem 0; }
        .v2-tree-step { margin-bottom: 1.5rem; }
        .v2-tree-step:last-child { margin-bottom: 0; }
        .v2-tree-q { font-weight: 700; display: block; margin-bottom: 0.75rem; }
        .v2-tree-answer { font-size: 0.95rem; color: #5c574c; margin-left: 1.5rem; }
        .v2-tree-answer strong { color: #1a1a1a; }

        .v2-constraint-list { display: flex; flex-direction: column; gap: 1.5rem; margin: 2rem 0; }
        .v2-constraint-item { border-left: 3px solid #508991; padding-left: 1.5rem; }
        .v2-constraint-item h3 { margin: 0 0 0.5rem; font-size: 1.05rem; }
        .v2-constraint-item p { margin: 0; color: #5c574c; font-size: 0.95rem; }

        .v2-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin: 2rem 0; }
        .v2-metric { text-align: center; }
        .v2-metric-val { font-size: 2.5rem; font-weight: 900; color: #1a1a1a; }
        .v2-metric-label { font-size: 0.9rem; color: #5c574c; margin-top: 0.5rem; }

        .v2-footer { padding: 3rem 2rem; text-align: center; border-top: 1px solid #f0f0f0; color: #5c574c; font-size: 0.9rem; }
        .v2-footer a { color: #5c574c; text-decoration: none; }
        .v2-footer a:hover { text-decoration: underline; }
      </style>

      <nav class="v2-nav">
        <a href="/v2" class="v2-nav-logo">⚡ Pulse</a>
        <div class="v2-nav-links">
          <a href="/getting-started">Docs</a>
          <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener">GitHub</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="v2-hero">
        <h1>The spec is the page.</h1>
        <p class="tagline">One plain JavaScript object. Server data, client state, mutations, and view. Everything a page needs, nothing it doesn't.</p>
        <div class="v2-cta">
          <a href="/getting-started" class="v2-btn v2-btn-primary">Get Started</a>
          <a href="/spec" class="v2-btn v2-btn-secondary">Read the Spec</a>
          <a href="/agent" class="v2-btn v2-btn-secondary">For Agents</a>
        </div>
      </section>

      <!-- One Spec -->
      <section class="v2-section">
        <h2 class="v2-section-title">One Spec, Complete</h2>
        <p class="v2-section-intro">No split files. No hidden conventions. Server data, state, mutations, and view in one verifiable object:</p>
        <div class="v2-code-block">
          <pre>export default {
  route: '/dashboard',
  meta: { title: 'Dashboard', styles: ['/app.css'] },
  server: {
    data: async (ctx) => ({
      user: await db.users.find(ctx.cookies.userId),
      stats: await db.stats.forUser(ctx.cookies.userId)
    })
  },
  state: { filter: 'all' },
  mutations: {
    setFilter: (state, event) => ({ filter: event.target.value })
  },
  view: (state, server) => \`
    &lt;main id="main-content"&gt;
      &lt;h1&gt;Hello, \${server.user.name}&lt;/h1&gt;
      &lt;select data-event="change:setFilter"&gt;
        &lt;option&gt;All&lt;/option&gt;
        &lt;option&gt;This week&lt;/option&gt;
      &lt;/select&gt;
      &lt;p&gt;\${server.stats[state.filter].total} requests&lt;/p&gt;
    &lt;/main&gt;
  \`
}</pre>
        </div>
      </section>

      <!-- Decision Tree -->
      <section class="v2-section">
        <h2 class="v2-section-title">Is Pulse Right For You?</h2>
        <p class="v2-section-intro">Answer honestly. If any is "no," another framework might fit better:</p>
        <div class="v2-decision-tree">
          <div class="v2-tree-step">
            <span class="v2-tree-q">Is this a web application?</span>
            <div class="v2-tree-answer">
              <strong>YES</strong> → continue<br>
              <strong>NO</strong> → Pulse is web-only
            </div>
          </div>
          <div class="v2-tree-step">
            <span class="v2-tree-q">Do you want server-rendered HTML with streaming?</span>
            <div class="v2-tree-answer">
              <strong>YES</strong> → continue<br>
              <strong>NO</strong> → still works, but suboptimal
            </div>
          </div>
          <div class="v2-tree-step">
            <span class="v2-tree-q">Do you want schema validation at startup?</span>
            <div class="v2-tree-answer">
              <strong>YES</strong> → <strong style="color: #1a1a1a;">PERFECT FIT (score: 0.95)</strong><br>
              <strong>NO</strong> → <strong style="color: #1a1a1a;">GOOD FIT (score: 0.8)</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- Constraints -->
      <section class="v2-section">
        <h2 class="v2-section-title">What Pulse Forbids</h2>
        <p class="v2-section-intro">Constraints aren't limitations — they're guarantees. Pulse stops you from shipping broken code:</p>
        <div class="v2-constraint-list">
          <div class="v2-constraint-item">
            <h3>One Spec Per Page</h3>
            <p>Every page is exactly one plain JS object. You can't accidentally split it across files or decouple data from view.</p>
          </div>
          <div class="v2-constraint-item">
            <h3>Pure Mutations</h3>
            <p>State changes must be synchronous, side-effect-free functions. State is predictable, testable, instantly debuggable.</p>
          </div>
          <div class="v2-constraint-item">
            <h3>Dialogs Always Render</h3>
            <p>Modals must be in the DOM unconditionally. Opened with data-dialog-open, never conditionally rendered based on state. Avoids a common agent mistake.</p>
          </div>
          <div class="v2-constraint-item">
            <h3>Constraints Always Enforced</h3>
            <p>min/max bounds on state are guaranteed after every mutation. State literally cannot violate them.</p>
          </div>
          <div class="v2-constraint-item">
            <h3>CSRF Protection Mandatory</h3>
            <p>Form submissions are protected by default. No opt-out. You can't forget it.</p>
          </div>
        </div>
      </section>

      <!-- Metrics -->
      <section class="v2-section">
        <h2 class="v2-section-title">Built For Production</h2>
        <div class="v2-metrics">
          <div class="v2-metric">
            <div class="v2-metric-val">0</div>
            <div class="v2-metric-label">Runtime dependencies</div>
          </div>
          <div class="v2-metric">
            <div class="v2-metric-val">< 6 kB</div>
            <div class="v2-metric-label">JS bundle (first visit, brotli)</div>
          </div>
          <div class="v2-metric">
            <div class="v2-metric-val">0.00</div>
            <div class="v2-metric-label">Cumulative layout shift</div>
          </div>
          <div class="v2-metric">
            <div class="v2-metric-val">100/100/100</div>
            <div class="v2-metric-label">Lighthouse (A11y / Best Practices / SEO)</div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="v2-section" style="text-align: center; padding: 5rem 2rem;">
        <h2 class="v2-section-title">Ready?</h2>
        <p style="font-size: 1.1rem; color: #5c574c; margin-bottom: 2rem;">Pick your path:</p>
        <div class="v2-cta">
          <a href="/getting-started" class="v2-btn v2-btn-primary">Getting Started</a>
          <a href="/spec" class="v2-btn v2-btn-secondary">Full Specification</a>
          <a href="/agent" class="v2-btn v2-btn-secondary">For Agents</a>
        </div>
      </section>

      <footer class="v2-footer">
        <p>MIT License · <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener">GitHub</a> · <a href="/getting-started">Get started in 2 minutes</a></p>
      </footer>
    </main>
  `,
}
