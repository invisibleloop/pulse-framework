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
    description: 'Pulse is a server-first Node.js framework with zero runtime dependencies. One spec object per page — server data, state, mutations, and view in plain JS. Streaming SSR, security headers, and production caching are enforced by the architecture.',
    styles: ['/pulse-ui.css', '/docs.css'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Pulse',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js ≥ 22',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://opensource.org/licenses/MIT',
      description: 'Spec-first Node.js web framework. Zero runtime dependencies. Streaming SSR, built-in security headers, and production caching enforced by the architecture.',
      url: 'https://pulse.invisibleloop.com',
      codeRepository: 'https://github.com/invisibleloop/pulse-framework',
    },
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
        <p class="hero-kicker">A server-first Node.js framework. Zero runtime dependencies.</p>
        <h1 class="hero-title">One spec. One way to build. Production quality by design.</h1>
        <p class="hero-subtitle">Each page is a single plain JS object — server data, client state, mutations, and view co-located in one place. Streaming SSR, security headers, and production caching are enforced by the framework, not left to configuration.<br><strong>Designed for AI agents. Simple enough to write yourself.</strong></p>
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
          <span class="home-stat-label">Lighthouse score, by design</span>
        </div>
      </section>

      <section class="how">
        <div class="how-inner">
        <h2 class="section-label">The idea</h2>
        <div class="how-steps">
          <div class="how-step">
            <div class="how-step-num">1</div>
            <h3>The spec is the page</h3>
            <p>Everything a page needs lives in one plain JS object — server data, client state, mutations, and view. One format, no split files, no hidden conventions.</p>
          </div>
          <div class="how-connector" aria-hidden="true"></div>
          <div class="how-step">
            <div class="how-step-num">2</div>
            <h3>The schema is the contract</h3>
            <p>Every spec is validated at startup. Either it's correct or it's rejected — no ambiguity, no misconfiguration that surfaces later in production.</p>
          </div>
          <div class="how-connector" aria-hidden="true"></div>
          <div class="how-step">
            <div class="how-step-num">3</div>
            <h3>The framework is the guarantee</h3>
            <p>Streaming SSR, security headers, and production caching come from the architecture. You write the product logic. The framework ships the quality.</p>
          </div>
        </div>
        </div>
      </section>

      <section class="home-code">
        <div class="home-code-inner">
          <div class="home-code-header">
            <h2>Everything a page needs. Nothing it doesn't.</h2>
            <p>Server fetchers, client state, mutations, and view are co-located in one object. No split files. No magic exports. The spec <strong>is</strong> the page — readable, predictable, complete.</p>
          </div>
          <div class="home-code-block">
            ${codeWindow({ content: exampleSpec, filename: 'src/pages/dashboard.js', lang: 'JavaScript' })}
          </div>
        </div>
      </section>

      <section class="ai-first">
        <div class="section-label">AI + Pulse</div>
        <h2 class="ai-first-title">The constraint is the point. For humans and agents&nbsp;alike.</h2>
        <p class="ai-first-lead">Pulse was designed around a simple observation: when there is only one correct way to build a page, every page is built correctly — whether you wrote it or an AI did. The spec format is the advantage. The schema is the enforcement.</p>
        <div class="ai-cols">
          <div class="ai-col">
            <h3 class="ai-col-title">For developers</h3>
            <ul class="ai-col-list">
              <li>One format to learn — server, state, mutations, view in one place.</li>
              <li>Production quality is the starting point, not a final audit.</li>
              <li>Specs are short, self-contained, and easy to review.</li>
              <li>Nothing to misconfigure — the framework doesn't give you the choice.</li>
            </ul>
          </div>
          <div class="ai-col ai-col--pulse">
            <h3 class="ai-col-title ai-col-title--good">For AI agents</h3>
            <ul class="ai-col-list">
              <li>One valid structure per page — agents can't pick the wrong pattern.</li>
              <li>The schema rejects bad output at startup, not in production.</li>
              <li>Security, SSR, and caching can't be accidentally omitted.</li>
              <li>Consistent output across agents, sessions, and team members.</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="versus">
        <div class="section-label">How Pulse compares</div>
        <h2 class="versus-title">Constraints enforced. Not recommended.</h2>
        <p class="versus-sub">Pulse enforces correctness out of the box. Other frameworks leave production quality to the developer.</p>
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
                <td class="v-partial">Yes, but client hydration adds JS on every page</td>
                <td class="v-partial">Yes, but requires an adapter and client runtime on every page</td>
              </tr>
              <tr>
                <th scope="row">Client JS shipped</th>
                <td class="v-yes">~4 kB brotli on first visit; 0 kB on static pages</td>
                <td class="v-no">50–200 kB+ depending on features used</td>
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
                <td class="v-yes">Server needs none — <code>node server.js</code> is production. Client bundles are optional.</td>
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
            <p>Performance is not a Pulse feature — it is a structural outcome. A high Lighthouse score is the baseline. There is nothing to configure because the architecture makes the right choices automatically.</p>
          </div>
          <ul class="usp-points">
            <li>
              <strong>Fast LCP by design.</strong>
              The shell streams to the browser instantly. Deferred segments arrive as data resolves — no blocking, no flash, no placeholder juggling.
            </li>
            <li>
              <strong>~4 kB of JS on first visit.</strong>
              The shared runtime is brotli-compressed and cached across all navigations. Subsequent pages cost 0.4–0.9 kB. Static pages ship zero JS.
            </li>
            <li>
              <strong>Zero CLS.</strong>
              The shell occupies the correct layout before data arrives. No layout shift because there is no placeholder to replace.
            </li>
            <li>
              <strong>Immutable bundle caching.</strong>
              Production bundles are content-hashed and served with <code>immutable, max-age=31536000</code>. Returning visitors pay no JS cost on deploy.
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
            <p>Security is not a plugin in Pulse — it is part of the response pipeline. Every response ships the headers most frameworks leave to the developer to remember to add.</p>
          </div>
          <ul class="usp-points">
            <li>
              <strong>Security headers on every response.</strong>
              <code>X-Frame-Options</code>, <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code>, <code>Permissions-Policy</code>, <code>Cross-Origin-Opener-Policy</code> — set automatically, including on 404 and 500 pages.
            </li>
            <li>
              <strong>Declarative state constraints.</strong>
              <code>constraints</code> enforce min/max bounds on state after every mutation. Values can never go out of range regardless of what the client sends.
            </li>
            <li>
              <strong>Co-located validation.</strong>
              Validation rules live next to the state they guard. Easy to read, easy to review, impossible to misplace.
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
              <strong>No server build step.</strong>
              <code>node server.js</code> is production. The optional build step generates content-hashed client bundles — the server runs without it.
            </li>
            <li>
              <strong>esbuild only in development.</strong>
              The one dev dependency that compiles client bundles is esbuild. Fast, zero plugins to configure, never part of the production runtime.
            </li>
            <li>
              <strong>No breaking upgrades.</strong>
              Page files have no framework imports. The spec is a plain JS object. There is no framework API surface in your code to break across versions.
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
        <h2>One format. Every page. Production ready.</h2>
        <ul class="home-cta-checks">
          <li>One spec object per page — always valid, always readable</li>
          <li>Streaming SSR and security headers, zero configuration</li>
          <li>100 Lighthouse built into the architecture</li>
          <li>Works with AI agents — and without them</li>
          <li>MIT licensed, zero runtime dependencies</li>
        </ul>
        <p>Pulse is in early access. The goal is not to compete on features — it is to eliminate the class of problems that come from having too many of them.</p>
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
