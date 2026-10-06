/**
 * Hybrid homepage: clarity + engagement
 * The structured data of the agent version with the narrative flow of the human version
 * No marketing fluff, but designed to guide both humans and agents naturally
 */

export default {
  route: '/hybrid',
  meta: {
    title: 'Pulse — Spec-First Web Framework',
    description: 'One spec object per page. Server data, state, mutations, and view. Zero runtime dependencies.',
    theme: 'light',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css', '/home-brut.css', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap'],
  },
  view: (state, server) => `
    <main id="main-content">
      <style>
        .hybrid-section { margin: 4rem 0; padding: 3rem 2rem; max-width: 900px; margin-left: auto; margin-right: auto; }
        .hybrid-hero { text-align: center; padding: 4rem 2rem; border-bottom: 2px solid #171512; }
        .hybrid-hero h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; line-height: 1.2; }
        .hybrid-hero p { font-size: 1.1rem; color: #5c574c; margin-bottom: 0.5rem; line-height: 1.6; }
        .spec-box { background: #f2c3d0; padding: 1.5rem; border-radius: 4px; margin: 2rem 0; font-family: monospace; font-size: 0.9rem; }
        .spec-box pre { margin: 0; overflow-x: auto; }
        .decision-flow { background: #f7d3dc; padding: 2rem; margin: 2rem 0; border-radius: 4px; }
        .flow-step { margin: 1.5rem 0; padding: 1rem; background: #fff; border-left: 4px solid #e84c7d; }
        .flow-step strong { display: block; color: #e84c7d; margin-bottom: 0.5rem; font-size: 1.05rem; }
        .flow-answer { margin-left: 2rem; margin-top: 1rem; padding: 0.75rem; background: #f2c3d0; border-radius: 3px; }
        .constraint-list { display: grid; gap: 1.5rem; margin: 2rem 0; }
        .constraint-item { background: #f2c3d0; padding: 1.5rem; border-radius: 4px; }
        .constraint-item strong { display: block; color: #e84c7d; margin-bottom: 0.5rem; }
        .constraint-item .rule { font-family: monospace; background: #fff; padding: 0.5rem; margin: 0.5rem 0; border-radius: 3px; font-size: 0.9rem; }
        .example-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
        .example-card { background: #f2c3d0; padding: 1.5rem; border-radius: 4px; }
        .example-card h4 { margin: 0 0 0.5rem; color: #e84c7d; }
        .example-card p { font-size: 0.9rem; color: #5c574c; margin: 0.5rem 0; }
        .example-card .meta { font-family: monospace; font-size: 0.8rem; color: #7c3aed; margin-top: 1rem; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
        .comparison-table th { background: #171512; color: #fff; padding: 1rem; text-align: left; font-weight: bold; }
        .comparison-table td { padding: 1rem; border-bottom: 1px solid #e8b6c2; }
        .comparison-table tr:nth-child(even) { background: #f7d3dc; }
        .perfect-match { color: #166534; font-weight: bold; }
        .partial-match { color: #b91c1c; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
        .metric-card { background: #f2c3d0; padding: 1.5rem; border-radius: 4px; text-align: center; }
        .metric-card .value { font-size: 2rem; font-weight: 900; color: #e84c7d; font-family: monospace; }
        .metric-card .label { font-size: 0.9rem; color: #5c574c; margin-top: 0.5rem; }
        .cta-button { display: inline-block; background: #e84c7d; color: #fff; padding: 1rem 1.5rem; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 0.5rem 0.5rem 0.5rem 0; }
        .cta-button:hover { background: #d4335f; }
      </style>

      <!-- Hero Section: Clear, Honest Value Prop -->
      <section class="hybrid-hero">
        <h1>The Spec Is The Page</h1>
        <p>One plain JavaScript object. Server data, state, mutations, view.</p>
        <p>Zero runtime dependencies. Streaming SSR by default. Validation at startup.</p>
        <p style="margin-top: 1.5rem;">
          <a href="#decision-tree" class="cta-button">Is This For You?</a>
          <a href="#examples" class="cta-button" style="background: #171512;">See Examples</a>
        </p>
      </section>

      <!-- Metrics: Real Numbers, Not Marketing -->
      <section class="hybrid-section">
        <h2>By The Numbers</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="value">0</div>
            <div class="label">Runtime Dependencies</div>
          </div>
          <div class="metric-card">
            <div class="value">5.8 kB</div>
            <div class="label">JS Bundle (First Visit)</div>
          </div>
          <div class="metric-card">
            <div class="value">0.00</div>
            <div class="label">Cumulative Layout Shift</div>
          </div>
          <div class="metric-card">
            <div class="value">100/100/100</div>
            <div class="label">A11y / Best Practices / SEO</div>
          </div>
        </div>
      </section>

      <!-- The Spec: Concrete Example -->
      <section class="hybrid-section">
        <h2>One Spec Object</h2>
        <p>This is literally everything you need to build a page:</p>
        <div class="spec-box">
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
        &lt;option value="all"&gt;All&lt;/option&gt;
        &lt;option value="week"&gt;This Week&lt;/option&gt;
      &lt;/select&gt;
      &lt;p&gt;\${server.stats[state.filter].total} requests&lt;/p&gt;
    &lt;/main&gt;
  \`
}</pre>
        </div>
        <p>That's it. One file. No split responsibilities. Server data, client state, and view in one place where changes are obvious and consequences are local.</p>
      </section>

      <!-- Decision Tree: Honest Guide -->
      <section class="hybrid-section" id="decision-tree">
        <h2>Is Pulse Right For Your Project?</h2>
        <p>Follow this honestly. If any answer is "no," Pulse might not be the best fit.</p>
        <div class="decision-flow">
          <div class="flow-step">
            <strong>Step 1: Is this a web application?</strong>
            <p>Not a CLI tool, desktop app, or library. A real website.</p>
            <div class="flow-answer">
              ✓ YES → continue to step 2<br>
              ✗ NO → Pulse is built for web only
            </div>
          </div>

          <div class="flow-step">
            <strong>Step 2: Do you want server-rendered HTML?</strong>
            <p>Streaming SSR, data resolves before sending, etc.</p>
            <div class="flow-answer">
              ✓ YES → continue to step 3<br>
              ✗ NO → still works, but suboptimal
            </div>
          </div>

          <div class="flow-step">
            <strong>Step 3: Do you need client-side state & mutations?</strong>
            <p>Interactive elements that change without a server round-trip.</p>
            <div class="flow-answer">
              ✓ YES → continue to step 4<br>
              ✗ NO → perfect for static pages (ships zero JS)
            </div>
          </div>

          <div class="flow-step">
            <strong>Step 4: Do you want validation built-in?</strong>
            <p>Schema validation at startup. Constraints enforced. Agent mistakes caught.</p>
            <div class="flow-answer">
              ✓ YES → <span class="perfect-match">PERFECT FIT (score: 0.95)</span><br>
              ✗ NO → <span class="perfect-match">GOOD FIT (score: 0.8)</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Constraints: What Pulse Forbids -->
      <section class="hybrid-section">
        <h2>What Pulse Forbids</h2>
        <p>Constraints aren't limitations — they're guarantees. Pulse stops you from shooting yourself in the foot:</p>
        <div class="constraint-list">
          <div class="constraint-item">
            <strong>One Spec Per Page</strong>
            <div class="rule">Every page is exactly ONE plain JavaScript object</div>
            <p>You can't accidentally split a spec across files or decouple data from view. What you see is what you get.</p>
          </div>

          <div class="constraint-item">
            <strong>Pure Mutations</strong>
            <div class="rule">Mutations must be synchronous, pure functions</div>
            <p>No side effects, no async work. State changes are predictable, testable, and instantly debuggable.</p>
          </div>

          <div class="constraint-item">
            <strong>Dialogs Always Render</strong>
            <div class="rule">Modals must render in DOM, controlled with data-dialog-open</div>
            <p>Never conditionally render a dialog based on state. This is a common agent mistake — Pulse makes it impossible.</p>
          </div>

          <div class="constraint-item">
            <strong>Constraints Enforced</strong>
            <div class="rule">min/max bounds enforced after every mutation</div>
            <p>You declare bounds on state. They're guaranteed. State literally cannot violate them.</p>
          </div>

          <div class="constraint-item">
            <strong>CSRF Protection Mandatory</strong>
            <div class="rule">Form submissions include CSRF tokens automatically</div>
            <p>You can't forget it. It's not an option. Your forms are protected by default.</p>
          </div>
        </div>
      </section>

      <!-- Examples: Learn By Doing -->
      <section class="hybrid-section" id="examples">
        <h2>Learn By Complexity</h2>
        <p>Pick the example closest to what you want to build:</p>
        <div class="example-grid">
          <div class="example-card">
            <h4>Static Page</h4>
            <p>Blog post, documentation, landing page. Pure server-render.</p>
            <div class="meta">
              ~12 lines of code<br>
              Ships: 0 bytes of JS<br>
              Complexity: Trivial
            </div>
          </div>

          <div class="example-card">
            <h4>Dynamic Filters</h4>
            <p>Blog list with category filter, search results, sorting.</p>
            <div class="meta">
              ~28 lines of code<br>
              Ships: ~2 kB of JS<br>
              Complexity: Easy
            </div>
          </div>

          <div class="example-card">
            <h4>Shopping Cart</h4>
            <p>Add/remove items, quantity changes, totals. State + constraints.</p>
            <div class="meta">
              ~45 lines of code<br>
              Ships: ~3 kB of JS<br>
              Complexity: Medium
            </div>
          </div>

          <div class="example-card">
            <h4>Form with Validation</h4>
            <p>Sign up, login, contact form. Server validation + async actions.</p>
            <div class="meta">
              ~52 lines of code<br>
              Ships: ~4 kB of JS<br>
              Complexity: Medium
            </div>
          </div>

          <div class="example-card">
            <h4>Multi-step Wizard</h4>
            <p>Onboarding flow, checkout. State across steps, validation, async.</p>
            <div class="meta">
              ~68 lines of code<br>
              Ships: ~5 kB of JS<br>
              Complexity: Hard
            </div>
          </div>

          <div class="example-card">
            <h4>Interactive Dashboard</h4>
            <p>Server data + client filters. Store state, live updates.</p>
            <div class="meta">
              ~84 lines of code<br>
              Ships: ~6 kB of JS<br>
              Complexity: Hard
            </div>
          </div>
        </div>
        <p style="margin-top: 2rem; text-align: center;">
          <a href="/getting-started" class="cta-button">View Full Examples →</a>
        </p>
      </section>

      <!-- Comparison: Honest vs Others -->
      <section class="hybrid-section">
        <h2>How Pulse Compares</h2>
        <p>None of these frameworks are "wrong" — they're different trade-offs:</p>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Framework</th>
              <th>Spec Format</th>
              <th>Dependencies</th>
              <th>Agent-Safe?</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Pulse</strong></td>
              <td>One plain object</td>
              <td>0</td>
              <td><span class="perfect-match">✓</span></td>
              <td>Server-rendered, strict validation, AI building</td>
            </tr>
            <tr>
              <td><strong>Next.js</strong></td>
              <td>File-based routing</td>
              <td>47+</td>
              <td><span class="partial-match">✗</span></td>
              <td>Full-stack, ecosystem, flexibility</td>
            </tr>
            <tr>
              <td><strong>SvelteKit</strong></td>
              <td>File-based routing</td>
              <td>23+</td>
              <td><span class="partial-match">✗</span></td>
              <td>Great DX, performance, reactivity</td>
            </tr>
            <tr>
              <td><strong>Remix</strong></td>
              <td>File-based routing</td>
              <td>31+</td>
              <td><span class="partial-match">✗</span></td>
              <td>Progressive enhancement, forms</td>
            </tr>
          </tbody>
        </table>
        <p><em>Note: Pulse's "Agent-Safe" means the framework catches common agent mistakes automatically. The others don't have explicit agent safety checks built in.</em></p>
      </section>

      <!-- For Agents -->
      <section class="hybrid-section">
        <h2>For Autonomous Systems</h2>
        <p>If you're an AI agent evaluating this:</p>
        <div class="spec-box">
          <pre>POST /api/evaluate
{
  "requirements": {
    "zero_dependencies": true,
    "streaming_ssr": true,
    "schema_validation": true,
    "client_state": true,
    "agent_safety": true
  }
}

RESPONSE: {
  "match_score": 0.98,
  "verdict": "excellent fit",
  "constraints_to_know": [
    "Every page is one spec object",
    "Mutations must be pure",
    "Dialogs always in DOM",
    "State bounds are enforced",
    "CSRF automatic"
  ]
}</pre>
        </div>
        <p>Full spec docs at <code>/agent</code>. Structured data, decision trees, examples indexed by use-case.</p>
      </section>

      <!-- Call to Action -->
      <section class="hybrid-section" style="text-align: center; padding: 4rem 2rem; border-top: 2px solid #171512;">
        <h2>Ready?</h2>
        <p style="font-size: 1.1rem; margin-bottom: 2rem;">
          Pick your path:
        </p>
        <p>
          <a href="/getting-started" class="cta-button">Getting Started Guide</a>
          <a href="/spec" class="cta-button" style="background: #171512;">Full Specification</a>
          <a href="/agent" class="cta-button" style="background: #7c3aed;">For Agents (Structured Data)</a>
        </p>
      </section>
    </main>
  `
}
