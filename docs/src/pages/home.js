import { highlight }     from '../lib/highlight.js'
import { metricsStore }  from '../lib/metrics-store.js'
import { codeWindow }    from '../../../src/ui/code-window.js'
import pkg from '../../../package.json' with { type: 'json' }

const { version } = pkg

const exampleSpec = highlight(`export default {
  route: '/dashboard',
  meta: {
    title: 'Dashboard — My App',
    styles: ['/app.css'],
  },
  server: {
    data: async (ctx) => {
      const user = await db.users.find(ctx.cookies.userId)
      return { user, stats: await db.stats.forUser(user.id) }
    },
  },
  state: { filter: 'all' },
  mutations: {
    setFilter: (state, event) => ({ filter: event.target.value }),
  },
  view: (state, server) => \`
    <main id="main-content">
      <h1>Hello, \${server.data.user.name}</h1>
      <select data-event="change:setFilter">
        <option value="all">All time</option>
        <option value="week">This week</option>
      </select>
      <p>\${server.data.stats[state.filter].total} requests</p>
    </main>
  \`,
}`, 'js')

export default {
  route: '/',
  meta: {
    title: 'Pulse — The spec-first web framework',
    description: 'Pulse is a server-first web framework with streaming SSR, zero client JS by default, and Lighthouse 100 built into the architecture. One spec format. One way to build. Production quality by design.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  server: {
    metrics: () => metricsStore.current,
  },
  view: (state, server) => `
    <div class="home">
      <nav class="home-nav" aria-label="Site navigation">
        <a href="/" class="logo-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
          Pulse
        </a>
        <div class="home-nav-links">
          <a href="/getting-started">Docs</a>
          <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" aria-label="GitHub (opens in new tab)">GitHub</a>
        </div>
      </nav>

      <main id="main-content">
      <section class="hero">
        <div class="hero-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="hero-badge">v${version} — EARLY ACCESS</div>
        <p class="hero-kicker">A Node.js framework for building server-rendered web apps</p>
        <h1 class="hero-title">Describe the outcome. Pulse guarantees it.</h1>
        <p class="hero-subtitle">One spec object per page — server data, state, mutations, and view in plain JS. Streaming SSR, security headers, and production caching are enforced by the framework, not left to configuration.<br><strong>Designed for AI agents.</strong></p>
        <div class="hero-ctas">
          <a href="/getting-started" class="btn-primary">Get Started</a>
          <a href="/spec" class="btn-secondary">Read the Spec</a>
        </div>
      </section>

      <section class="home-stats">
        <div class="home-stat">
          <span class="home-stat-value">Fast LCP</span>
          <span class="home-stat-label">SSR-first architecture</span>
        </div>
        <div class="home-stat-divider"></div>
        <div class="home-stat">
          <span class="home-stat-value">4 kB</span>
          <span class="home-stat-label">Runtime JS, first visit (brotli)</span>
        </div>
        <div class="home-stat-divider"></div>
        <div class="home-stat">
          <span class="home-stat-value">0.00</span>
          <span class="home-stat-label">Cumulative Layout Shift</span>
        </div>
        <div class="home-stat-divider"></div>
        <div class="home-stat">
          <span class="home-stat-value">100</span>
          <span class="home-stat-label">Lighthouse score</span>
        </div>
      </section>

      <section class="how">
        <div class="how-inner">
        <h2 class="section-label">How it works</h2>
        <div class="how-steps">
          <div class="how-step">
            <div class="how-step-num">1</div>
            <h3>Write a spec</h3>
            <p>Everything for a page lives in one object: server data, state, mutations, view. One format, no conventions to learn.</p>
          </div>
          <div class="how-connector" aria-hidden="true"></div>
          <div class="how-step">
            <div class="how-step-num">2</div>
            <h3>Validate automatically</h3>
            <p>The schema enforces a single, correct structure. Either the spec is valid, or it’s rejected — no ambiguity, no runtime surprises.</p>
          </div>
          <div class="how-connector" aria-hidden="true"></div>
          <div class="how-step">
            <div class="how-step-num">3</div>
            <h3>Production quality, built in</h3>
            <p>Streaming SSR, security headers, and immutable caching come from the framework — not your config. Follow the spec, and the results follow.</p>
          </div>
        </div>
        </div>
      </section>

      <section class="home-code">
        <div class="home-code-inner">
          <div class="home-code-header">
            <h2>Everything in one object</h2>
            <p>Server data, state, mutations, and view are co-located. No split files. No hidden conventions. The spec <strong>is</strong> the page.</p>
          </div>
          <div class="home-code-block">
            ${codeWindow({ content: exampleSpec, filename: 'src/pages/dashboard.js', lang: 'JavaScript' })}
          </div>
        </div>
      </section>

      <section class="ai-first">
        <div class="section-label">Why Pulse + AI</div>
        <h2 class="ai-first-title">Designed for AI agents. Enforced by the framework.</h2>
        <p class="ai-first-lead"><strong>Traditional frameworks</strong> were built for humans — multiple valid patterns, optional decisions, enough surface area for output to drift. Pulse is different.</p>
        <div class="ai-cols">
          <div class="ai-col">
            <h3 class="ai-col-title ai-col-title--bad">AI + existing frameworks</h3>
            <ul class="ai-col-list">
              <li>Multiple valid patterns per page — the agent picks one, the next picks another.</li>
              <li>Security headers, SSR config, and caching are optional decisions the agent can miss.</li>
              <li>Output drifts over time as different agents make different choices.</li>
              <li>Reviewing AI output requires knowing every pattern it could have used.</li>
            </ul>
          </div>
          <div class="ai-col ai-col--pulse">
            <h3 class="ai-col-title ai-col-title--good">Pulse + AI enforces structure</h3>
            <ul class="ai-col-list">
              <li>One spec format per page.</li>
              <li>Architecture enforces SSR, security, and caching.</li>
              <li>Agents fill in the contract, never off-pattern.</li>
              <li>Reading AI output means reading one JS object — nothing hidden.</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="versus">
        <div class="section-label">How Pulse compares</div>
        <h2 class="versus-title">Constraints enforced. Not recommended.</h2>
        <p class="versus-sub">Pulse enforces constraints and correctness out of the box; other frameworks leave it to the developer.</p>
        <div class="versus-table-wrap table-sticky-col">
          <table class="versus-table">
            <thead>
              <tr>
                <th></th>
                <th>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="vertical-align:middle;margin-right:.35rem">
                    <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>
                  </svg>Pulse
                </th>
                <th>Next.js / Remix</th>
                <th>SvelteKit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Ways to write a page</th>
                <td class="v-yes">One — the spec schema</td>
                <td class="v-no">App Router, Pages Router, RSC, client components, loaders…</td>
                <td class="v-no">+page.svelte, +page.server.js, load(), form actions…</td>
              </tr>
              <tr>
                <th scope="row">Agent-readable structure</th>
                <td class="v-yes">One JS object per page</td>
                <td class="v-no">Files, folders, magic exports spread across dirs</td>
                <td class="v-no">Files, folders, Svelte syntax</td>
              </tr>
              <tr>
                <th scope="row">SSR out of the box</th>
                <td class="v-yes">Streaming SSR, zero config</td>
                <td class="v-partial">Yes, but client hydration adds JS overhead on every page</td>
                <td class="v-partial">Yes, but requires an adapter and client runtime on every page</td>
              </tr>
              <tr>
                <th scope="row">Client JS shipped</th>
                <td class="v-yes">~4 kB brotli (shared runtime, first visit)</td>
                <td class="v-no">50-200 kB+ depending on features</td>
                <td class="v-partial">~15 kB brotli</td>
              </tr>
              <tr>
                <th scope="row">Security headers</th>
                <td class="v-yes">On every response, built in</td>
                <td class="v-no">Manual middleware or plugin</td>
                <td class="v-no">Manual hooks setup</td>
              </tr>
              <tr>
                <th scope="row">CLS</th>
                <td class="v-yes">Targets 0.00 — shell renders before data arrives</td>
                <td class="v-partial">Depends on implementation</td>
                <td class="v-partial">Depends on implementation</td>
              </tr>
              <tr>
                <th scope="row">Runtime dependencies</th>
                <td class="v-yes">Zero — pure Node.js HTTP</td>
                <td class="v-no">React, 50+ transitive packages</td>
                <td class="v-no">Svelte runtime + adapters</td>
              </tr>
              <tr>
                <th scope="row">Production build step</th>
                <td class="v-yes">None — <code>node server.js</code> is production</td>
                <td class="v-no">Required — <code>next build</code></td>
                <td class="v-no">Required — <code>vite build</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="usp-blocks">

        <div class="usp-block">
          <div class="usp-block-aside">
            <div class="usp-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2>Performance by design</h2>
            <p>Pulse does not offer performance as an option — it enforces it structurally. A high Lighthouse score is the baseline. There is nothing to configure because there is nothing to get wrong.</p>
          </div>
          <ul class="usp-points">
            <li>
              <strong>Fast LCP by design.</strong>
              The shell renders and streams instantly. Deferred segments arrive as data resolves — no blocking, no flash.
            </li>
            <li>
              <strong>~4 kB of JS on first visit.</strong>
              The shared runtime is brotli-compressed and cached across all navigations. Subsequent pages cost 0.4–0.9 kB.
            </li>
            <li>
              <strong>Zero CLS.</strong>
              The shell occupies the correct layout before data arrives. No placeholder juggling, no layout shift.
            </li>
            <li>
              <strong>Immutable bundle caching.</strong>
              Production bundles are content-hashed and served with <code>immutable, max-age=31536000</code>. Browsers cache them forever — deploys are instant for returning visitors.
            </li>
          </ul>
        </div>

        <div class="usp-block usp-block-alt">
          <div class="usp-block-aside">
            <div class="usp-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2>Safe by design</h2>
            <p>Security is not a plugin or a checklist in Pulse — it is part of the response pipeline. Every page ships the headers most frameworks leave to the developer to remember.</p>
          </div>
          <ul class="usp-points">
            <li>
              <strong>Security headers on every response.</strong>
              <code>X-Frame-Options</code>, <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code>, <code>Permissions-Policy</code>, <code>Cross-Origin-Opener-Policy</code> — all set automatically, including on 404 and 500 pages.
            </li>
            <li>
              <strong>Declarative state constraints.</strong>
              <code>constraints</code> enforce min/max bounds on state after every mutation. The value can never go out of range regardless of what the client sends.
            </li>
            <li>
              <strong>Co-located validation.</strong>
              Validation rules live next to the state they guard. The agent can see what is being validated and why, in one place.
            </li>
            <li>
              <strong>Guard before data.</strong>
              The <code>guard</code> function runs before any server fetcher executes — authentication and authorisation checks cannot be accidentally bypassed.
            </li>
          </ul>
        </div>

        <div class="usp-block">
          <div class="usp-block-aside">
            <div class="usp-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Nothing to configure</h2>
            <p>No bundler config. No framework boilerplate. No runtime dependencies to install, audit, or upgrade. Pulse eliminates the category of problems that come from misconfiguration.</p>
          </div>
          <ul class="usp-points">
            <li>
              <strong>Zero runtime dependencies.</strong>
              The server is pure Node.js HTTP. No Express, no Fastify, no React. Nothing to add to <code>package.json</code> to run a production server.
            </li>
            <li>
              <strong>No production build step.</strong>
              <code>node server.js</code> is production. The build step is only needed to generate content-hashed client bundles — the server runs without it in dev.
            </li>
            <li>
              <strong>esbuild only in development.</strong>
              The one dev dependency that compiles client bundles is esbuild. Fast, no plugins to configure, never part of the production runtime.
            </li>
            <li>
              <strong>No framework upgrades breaking your app.</strong>
              Because the spec is a plain JS object with no framework imports in page files, there is no framework API surface to break across versions.
            </li>
          </ul>
        </div>

      </section>

      ${server.metrics ? `<section class="metrics-report" aria-labelledby="metrics-title">
        <div class="metrics-header">
          <div class="section-label">By the numbers</div>
          <h2 id="metrics-title" class="metrics-title">Performance you can measure.</h2>
          <p class="metrics-generated">Report generated ${server.metrics.generatedAt} · measured from a real Pulse build</p>
        </div>
        <div class="metrics-groups">
          <div class="metrics-group">
            <div class="metrics-group-label">Lighthouse</div>
            <div class="metrics-items">
              ${server.metrics.lighthouse.map(m => `
                <div class="metric-item">
                  <span class="metric-val metric-val--green">${m.value}</span>
                  <span class="metric-label">${m.label}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="metrics-group">
            <div class="metrics-group-label">Bundle sizes</div>
            <div class="metrics-items">
              ${server.metrics.bundles.map(m => `
                <div class="metric-item">
                  <span class="metric-val">${m.value}</span>
                  <span class="metric-label">${m.label}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="metrics-group">
            <div class="metrics-group-label">Web Vitals</div>
            <div class="metrics-items">
              ${server.metrics.vitals.map(m => `
                <div class="metric-item">
                  <span class="metric-val metric-val--green">${m.value}</span>
                  <span class="metric-label">${m.label}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="metrics-group">
            <div class="metrics-group-label">Architecture</div>
            <div class="metrics-items">
              ${server.metrics.architecture.map(m => `
                <div class="metric-item">
                  <span class="metric-val metric-val--accent">${m.value}</span>
                  <span class="metric-label">${m.label}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </section>` : ''}

      <section class="home-cta">
        <h2>The spec is the contract.<br>Your agent fills it in.</h2>
        <ul class="home-cta-checks">
          <li>Writes the spec</li>
          <li>Validates against the schema</li>
          <li>Checks Lighthouse — desktop and mobile</li>
          <li>Runs the tests</li>
          <li>Ships production quality</li>
        </ul>
        <p>MIT licensed and available now. Production quality is not the goal. It is the starting point.</p>
        <div class="home-cta-actions">
          <a href="/getting-started" class="btn-primary">Get Started</a>
          <a href="/spec" class="btn-secondary">Read the Spec</a>
        </div>
      </section>

      </main>
      <footer class="home-footer">
        <p>MIT License · <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" aria-label="GitHub (opens in new tab)">GitHub</a> · <a href="/getting-started">Get started in 2 minutes</a></p>
      </footer>
    </div>
  `,
}
