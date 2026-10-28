/**
 * Agent-optimized homepage
 * Structured data first, no marketing copy
 * Machine-readable decision trees and capability matrix
 */

const frameworkData = {
  name: 'Pulse',
  type: 'server-first web framework',
  language: 'Node.js ≥ 22',
  dependencies: 0,
  unit: 'one-spec-per-page',
  spec_components: ['server', 'state', 'mutations', 'view'],
  format: 'plain JavaScript object',
  guarantees: [
    'schema-validation-at-startup',
    'streaming-ssr-by-default',
    'security-headers-automatic',
    'zero-client-dependencies',
    'production-caching-built-in'
  ],
  constraints: [
    {
      name: 'one-spec-per-page',
      rule: 'Every page is exactly ONE plain JavaScript object',
      enforced_by: 'schema validation at startup',
      consequence: 'impossible to split spec across files or accidentally decouple data from view'
    },
    {
      name: 'pure-mutations',
      rule: 'Mutations must be synchronous, pure functions',
      enforced_by: 'runtime',
      consequence: 'state changes are predictable and testable'
    },
    {
      name: 'no-conditional-dialogs',
      rule: 'Dialogs must always render in DOM, opened with data-dialog-open',
      enforced_by: 'runtime checks',
      consequence: 'avoids common agent mistake of conditionally rendering modals'
    },
    {
      name: 'constraints-always-enforced',
      rule: 'min/max bounds enforced after every mutation',
      enforced_by: 'runtime',
      consequence: 'state cannot violate declared constraints'
    },
    {
      name: 'csrf-protection-mandatory',
      rule: 'Form submissions include CSRF tokens automatically',
      enforced_by: 'server',
      consequence: 'forms cannot be submitted without protection'
    }
  ],
  metrics: {
    js_bundle_size: '5.8 kB',
    css_overhead: '31 kB (all pages)',
    runtime_dependencies: 0,
    lighthouse_accessibility: 100,
    lighthouse_best_practices: 100,
    lighthouse_seo: 100,
    lighthouse_performance: 94,
    cumulative_layout_shift: 0,
    largest_contentful_paint: '1-2 seconds'
  }
}

const decisionTree = {
  root: 'is-this-a-web-application',
  nodes: {
    'is-this-a-web-application': {
      question: 'Is this a web application (not a CLI, desktop app, or library)?',
      yes: 'needs-streaming-ssr',
      no: 'not-a-fit',
      reasoning: 'Pulse is server-rendered HTML only'
    },
    'needs-streaming-ssr': {
      question: 'Do you want streaming SSR (send HTML before data resolves)?',
      yes: 'needs-client-state',
      no: 'still-works-but-suboptimal',
      reasoning: 'Pulse is built for streaming, but static pages work too'
    },
    'needs-client-state': {
      question: 'Do you need client-side state, mutations, and interactivity?',
      yes: 'needs-validation',
      no: 'static-page-perfect',
      reasoning: 'Pulse handles both static and interactive pages'
    },
    'needs-validation': {
      question: 'Do you want schema validation before deployment?',
      yes: 'perfect-fit',
      no: 'good-fit',
      reasoning: 'Pulse validates specs at startup, but you can skip it'
    },
    'perfect-fit': {
      verdict: 'EXCELLENT FIT',
      score: 0.95,
      reason: 'Pulse is built exactly for this use case',
      next_steps: 'Read /getting-started, then /spec'
    },
    'good-fit': {
      verdict: 'GOOD FIT',
      score: 0.8,
      reason: 'Pulse works well, validation is optional',
      next_steps: 'Read /spec'
    },
    'static-page-perfect': {
      verdict: 'PERFECT FOR STATIC',
      score: 0.9,
      reason: 'Pulse ships zero JavaScript for static pages',
      gotcha: 'No client-side interactivity, but that\'s the point',
      next_steps: 'Read /getting-started'
    },
    'still-works-but-suboptimal': {
      verdict: 'WORKS, NOT OPTIMAL',
      score: 0.7,
      reason: 'Pulse can do non-streaming, but it\'s not its strength',
      note: 'Consider Next.js or SvelteKit for pure static-gen',
      next_steps: 'GET /docs/comparison'
    },
    'not-a-fit': {
      verdict: 'NOT A FIT',
      score: 0,
      reason: 'Pulse is for web applications only',
      consider: 'Deno, Node.js frameworks, or other platforms'
    }
  }
}

const examples = [
  {
    id: 'static-page',
    name: 'Static Documentation Page',
    use_case: 'Blog post, docs page, landing page with no interactivity',
    spec_lines: 12,
    complexity: 'trivial',
    key_features: ['server-data', 'pure-render'],
    ships_javascript: false,
    learns: ['basic-spec-structure', 'server-data-pattern']
  },
  {
    id: 'dynamic-filters',
    name: 'Page with Dynamic Filters',
    use_case: 'Blog list with category filter, search results',
    spec_lines: 28,
    complexity: 'easy',
    key_features: ['state', 'mutations', 'server-data'],
    ships_javascript: true,
    learns: ['state-management', 'mutations', 'client-server-split']
  },
  {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    use_case: 'Add/remove items, quantity adjustments, totals',
    spec_lines: 45,
    complexity: 'medium',
    key_features: ['state', 'mutations', 'constraints', 'validation'],
    ships_javascript: true,
    learns: ['constraints-and-bounds', 'validation-rules', 'state-mutations']
  },
  {
    id: 'form-submission',
    name: 'Form with Server Submission',
    use_case: 'Sign up, login, contact form with server-side validation',
    spec_lines: 52,
    complexity: 'medium',
    key_features: ['submit', 'validation', 'csrf-protection', 'async-actions'],
    ships_javascript: true,
    learns: ['form-handling', 'server-validation', 'error-handling']
  },
  {
    id: 'multi-step-form',
    name: 'Multi-step Wizard',
    use_case: 'Onboarding flow, checkout flow with steps',
    spec_lines: 68,
    complexity: 'hard',
    key_features: ['state', 'constraints', 'validation', 'async-actions'],
    ships_javascript: true,
    learns: ['complex-state-patterns', 'validation-across-steps']
  },
  {
    id: 'dashboard',
    name: 'Interactive Dashboard',
    use_case: 'Server-rendered data with client filters and charts',
    spec_lines: 84,
    complexity: 'hard',
    key_features: ['server-data', 'state', 'mutations', 'store-integration'],
    ships_javascript: true,
    learns: ['server-data-hydration', 'store-state', 'live-updates']
  }
]

const comparison = {
  frameworks: [
    {
      name: 'Pulse',
      spec_format: 'one-plain-object',
      validation: 'startup + runtime',
      dependencies: 0,
      agent_safety_checks: ['conditional-dialog', 'malformed-store', 'missing-csrf', 'constraint-violations'],
      shipping_strategy: 'zero-js-for-static-pages',
      suitable_for_agents: true,
      key_strength: 'strictness-by-design'
    },
    {
      name: 'Next.js',
      spec_format: 'implicit-files-and-folders',
      validation: 'typescript-optional',
      dependencies: 47,
      agent_safety_checks: [],
      shipping_strategy: 'streaming-or-static',
      suitable_for_agents: false,
      key_strength: 'ecosystem-and-flexibility'
    },
    {
      name: 'SvelteKit',
      spec_format: 'implicit-conventions',
      validation: 'typescript-optional',
      dependencies: 23,
      agent_safety_checks: [],
      shipping_strategy: 'streaming-or-static',
      suitable_for_agents: false,
      key_strength: 'performance-and-developer-experience'
    },
    {
      name: 'Remix',
      spec_format: 'file-based-routing',
      validation: 'typescript-optional',
      dependencies: 31,
      agent_safety_checks: [],
      shipping_strategy: 'progressive-enhancement',
      suitable_for_agents: false,
      key_strength: 'form-handling-and-progresss-enhancement'
    }
  ]
}

export default {
  route: '/agent',
  meta: {
    title: 'Pulse — Agent-Optimized Documentation',
    description: 'Structured data, decision trees, and APIs for agent integration',
    theme: 'light',
    styles: ['/pulse-ui.css', '/theme.css'],
  },
  view: (state, server) => `
    <main id="main-content">
      <style>
        body { font-family: monospace; background: #fff; color: #171512; }
        pre { background: #cffafe; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.85rem; line-height: 1.5; }
        .section { margin-bottom: 3rem; border-bottom: 2px solid #171512; padding-bottom: 2rem; }
        .section h2 { font-size: 1.5rem; margin-bottom: 1rem; }
        .tree { margin: 1rem 0; padding: 1rem; background: #a5f3fc; }
        .tree-node { margin: 0.5rem 0; padding: 0.5rem; background: #fff; border-left: 3px solid #0891b2; }
        .example { margin: 0.5rem 0; padding: 0.75rem; background: #a5f3fc; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #171512; }
        th { background: #171512; color: #fff; font-weight: bold; }
        .perfect { color: #166534; font-weight: bold; }
        .warning { color: #b91c1c; font-weight: bold; }
        .code-block { background: #a5f3fc; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
      </style>

      <section class="section">
        <h1>Pulse Framework — Agent Integration Guide</h1>
        <p>Structured data, APIs, and decision trees for autonomous systems.</p>
      </section>

      <section class="section">
        <h2>1. Framework Specification</h2>
        <pre>${JSON.stringify(frameworkData, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>2. Decision Tree: Is Pulse Right for Your Task?</h2>
        <p>Start at root, follow yes/no branches to verdict:</p>
        <div class="tree">
          <div class="tree-node">
            <strong>→ is-this-a-web-application?</strong><br>
            Question: Is this a web application (not CLI, desktop, library)?<br>
            YES: needs-streaming-ssr | NO: not-a-fit
          </div>
          <div class="tree-node">
            <strong>→ needs-streaming-ssr?</strong><br>
            Question: Do you want streaming SSR?<br>
            YES: needs-client-state | NO: still-works-but-suboptimal
          </div>
          <div class="tree-node">
            <strong>→ needs-client-state?</strong><br>
            Question: Do you need client-side state &amp; mutations?<br>
            YES: needs-validation | NO: static-page-perfect
          </div>
          <div class="tree-node">
            <strong>→ needs-validation?</strong><br>
            Question: Do you want schema validation at startup?<br>
            YES: <span class="perfect">perfect-fit (score: 0.95)</span> | NO: <span class="perfect">good-fit (score: 0.8)</span>
          </div>
        </div>
        <pre>${JSON.stringify(decisionTree, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>3. Examples Indexed by Complexity</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Use Case</th>
              <th>Lines</th>
              <th>Complexity</th>
              <th>Learns</th>
              <th>JS?</th>
            </tr>
          </thead>
          <tbody>
            ${examples.map(ex => `
              <tr>
                <td><strong>${ex.name}</strong></td>
                <td>${ex.use_case}</td>
                <td>${ex.spec_lines}</td>
                <td>${ex.complexity}</td>
                <td>${ex.learns.join(', ')}</td>
                <td>${ex.ships_javascript ? 'yes' : '✓ zero'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <pre>${JSON.stringify(examples, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>4. Framework Comparison Matrix</h2>
        <table>
          <thead>
            <tr>
              <th>Framework</th>
              <th>Spec Format</th>
              <th>Validation</th>
              <th>Dependencies</th>
              <th>Agent-Safe?</th>
              <th>Key Strength</th>
            </tr>
          </thead>
          <tbody>
            ${comparison.frameworks.map(f => `
              <tr>
                <td><strong>${f.name}</strong></td>
                <td>${f.spec_format}</td>
                <td>${f.validation}</td>
                <td>${f.dependencies}</td>
                <td>${f.suitable_for_agents ? '<span class="perfect">✓ yes</span>' : '<span class="warning">no</span>'}</td>
                <td>${f.key_strength}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <pre>${JSON.stringify(comparison, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>5. Agent Evaluation Checklist</h2>
        <p>Check a task against these before choosing Pulse. Each line is a requirement and what Pulse does about it:</p>
        <ul>
          <li><strong>No dependencies in served code:</strong> the server and browser code import only Node built-ins. The package has one dependency, esbuild, used by <code>pulse build</code>.</li>
          <li><strong>Streaming SSR:</strong> the default. Pages are sent in chunks, and deferred segments arrive as their data resolves.</li>
          <li><strong>Validation:</strong> every spec is validated at startup, and <code>pulse validate</code> runs the same check on one file.</li>
          <li><strong>Client state:</strong> <code>state</code>, <code>mutations</code> and <code>actions</code>, on pages that need them. Pages that do not ship no JavaScript.</li>
          <li><strong>Agent safety:</strong> the MCP server validates, reviews and builds, and an agent can read the dev error journal with <code>pulse_diagnose</code>.</li>
        </ul>
        <p>Gotchas: streaming is the default, there is no virtual DOM (so mutations must be pure), and pages with no client behaviour ship no JavaScript.</p>
      </section>

      <section class="section">
        <h2>6. Machine-readable entrypoints</h2>
        <pre>${JSON.stringify({
          entrypoints: {
            "MCP server": "Started by `pulse` in a project. Resources: pulse://guide and the topic guides. Tools: pulse_validate, pulse_review, pulse_build, pulse_diagnose and others.",
            "GET /llms.txt": "Plain-text index of every docs page",
            "pulse validate <file>": "The same spec check the MCP tool runs, from the command line"
          }
        }, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>7. Constraint Enforcement</h2>
        <p>These are enforced automatically. Violating them will fail validation:</p>
        <pre>${JSON.stringify(frameworkData.constraints, null, 2)}</pre>
      </section>

      <section class="section">
        <h2>8. Quick Start for Agents</h2>
        <ol>
          <li><strong>Understand:</strong> read the <code>pulse://guide</code> resources from the MCP server, or the pages listed in <a href="/llms.txt">/llms.txt</a></li>
          <li><strong>Learn:</strong> read <a href="/prompt-examples">Prompt Examples</a> and <a href="/spec">Spec Reference</a></li>
          <li><strong>Validate:</strong> run <code>pulse_validate</code> on your first spec</li>
          <li><strong>Iterate:</strong> fix validation errors and run it again</li>
          <li><strong>Verify:</strong> run <code>/verify</code> before calling a page done</li>
        </ol>
      </section>

      <section class="section">
        <h2>9. No Navigation — Just Data</h2>
        <p>This page is a spec. There are no buttons, no marketing copy, no visual design decisions.</p>
        <p>Agents consume this as JSON. Humans read the same data, just formatted for readability.</p>
        <p><strong>Next step:</strong> Choose your path:</p>
        <ul>
          <li>Still unsure? Start with the decision tree above</li>
          <li>Want examples? <a href="/prompt-examples">Prompt Examples</a></li>
          <li>Need the full spec? <a href="/spec">Spec Reference</a></li>
        </ul>
      </section>
    </main>
  `
}
