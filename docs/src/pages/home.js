// component-free — creative override: brutalist design intent; asymmetric typography-driven layout with exposed grid structure, raw borders, and oversized type that component patterns cannot express
import { highlight }                                        from '../lib/highlight.js'
import { iconZap, iconShield, iconSettings }               from '../../../src/ui/icons.js'
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
    description: 'Pulse is a server-first Node.js framework with zero runtime dependencies. One spec object per page: server data, state, mutations, and view in plain JS. Streaming SSR, security headers, and production caching are enforced by the architecture.',
    styles: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap', '/pulse-ui.css', '/theme.css', '/docs.css', '/home-brut.css'],
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
    <div class="brut">

      <nav class="brut-nav" aria-label="Site navigation">
        <a href="/" class="brut-nav-logo" aria-label="Pulse home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#f0e642" stroke="#f0e642" stroke-width="1" stroke-linejoin="round"/>
          </svg>
          <span>PULSE</span>
        </a>
        <div class="brut-nav-links">
          <a href="/getting-started">Docs</a>
          <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" aria-label="GitHub (opens in new tab)">GitHub</a>
          <a href="/getting-started" class="brut-nav-cta">Get Started</a>
        </div>
      </nav>

      <main id="main-content">

        <section class="brut-hero">
          <div class="brut-hero-tag">v${version} — EARLY ACCESS</div>
          <h1 class="brut-hero-h1">
            <span class="brut-hero-kicker">with Pulse</span>
            <span class="brut-hero-line1">YOU CAN'T</span>
            <span class="brut-hero-line2" role="img" aria-label="SHIP">
              <svg class="brut-hero-svg" aria-hidden="true">
                <text class="brut-hero-svg-text" y="0.82em" dominant-baseline="auto"
                  font-family="Inter, system-ui, sans-serif" font-weight="900"
                  fill="var(--brut-yellow)" stroke="var(--brut-ink)" stroke-width="0.055em" paint-order="stroke fill">SHIP</text>
              </svg>
            </span>
            <span class="brut-hero-line3">A BAD PAGE.</span>
          </h1>
          <div class="brut-hero-aside">
            <p class="brut-hero-tag-inline">ONE SPEC. ONE WAY TO BUILD.</p>
            <p class="brut-hero-desc">A server-first Node.js framework. Streaming SSR, security headers, and production caching are enforced by the architecture, not left to configuration.</p>
            <p class="brut-hero-sub"><strong>So constrained that doing it wrong isn't an option. Whether you write it or an AI does.</strong></p>
            <div class="brut-hero-ctas">
              <a href="/getting-started" class="brut-btn-primary">Get Started</a>
              <a href="/spec" class="brut-btn-ghost">Read the Spec</a>
            </div>
          </div>
        </section>

        <div class="brut-stats-bar">
          <div class="brut-stat">
            <span class="brut-stat-val">4 kB</span>
            <span class="brut-stat-lbl">Runtime JS · first visit</span>
          </div>
          <div class="brut-stat">
            <span class="brut-stat-val">0.00</span>
            <span class="brut-stat-lbl">Cumulative Layout Shift</span>
          </div>
          <div class="brut-stat">
            <span class="brut-stat-val">100</span>
            <span class="brut-stat-lbl">Lighthouse · by design</span>
          </div>
          <div class="brut-stat">
            <span class="brut-stat-val">0</span>
            <span class="brut-stat-lbl">Runtime dependencies</span>
          </div>
        </div>

        <section class="brut-idea">
          <div class="brut-idea-label">THE IDEA</div>
          <div class="brut-idea-grid">
            <div class="brut-idea-step">
              <div class="brut-idea-num" aria-hidden="true">01</div>
              <h2>The spec is the page</h2>
              <p>Everything a page needs lives in one plain JS object: server data, client state, mutations, and view. One format. No split files. No hidden conventions.</p>
            </div>
            <div class="brut-idea-step">
              <div class="brut-idea-num" aria-hidden="true">02</div>
              <h2>The schema is the contract</h2>
              <p>Every spec is validated at startup. Either it's correct or it's rejected. No ambiguity, no misconfiguration that surfaces later in production.</p>
            </div>
            <div class="brut-idea-step">
              <div class="brut-idea-num" aria-hidden="true">03</div>
              <h2>The framework is the guarantee</h2>
              <p>Streaming SSR, security headers, and production caching come from the architecture. You write the product logic. The framework ships the quality.</p>
            </div>
          </div>
        </section>

        <section class="brut-code-section">
          <div class="brut-code-header">
            <h2>Everything a page needs.<br>Nothing it doesn't.</h2>
            <p>Server fetchers, client state, mutations, and view. All co-located in one object. The spec <em>is</em> the page.</p>
          </div>
          <div class="brut-code-block">
            ${codeWindow({ content: exampleSpec, filename: 'src/pages/dashboard.js', lang: 'JavaScript' })}
          </div>
        </section>

        <section class="brut-constraint">
          <div class="brut-constraint-inner">
            <div class="brut-constraint-label">AI + PULSE</div>
            <h2 class="brut-constraint-h2">Constrained enough<br>to be trusted.<br>Free enough<br>to be creative.</h2>
            <p class="brut-constraint-lead">The spec format tells an agent exactly how to wire up data, state, and behaviour. What it doesn't do is dictate the design. Layout, typography, CSS — those are still real decisions. The agent makes them. Pulse just makes sure the page it builds actually works.</p>
            <div class="brut-constraint-cols">
              <div class="brut-col">
                <div class="brut-col-head">The structure is fixed</div>
                <ul class="brut-col-list">
                  <li>One spec format. No ambiguity about how a page should be built</li>
                  <li>Schema validation at startup. Bad output is rejected before it ships</li>
                  <li>Security, SSR, and caching are part of the architecture. Not optional</li>
                  <li>Consistent, reviewable output across every agent and every session</li>
                </ul>
              </div>
              <div class="brut-col brut-col--hi">
                <div class="brut-col-head brut-col-head--hi">The design is not</div>
                <ul class="brut-col-list">
                  <li>The view is a plain JS function. The agent writes whatever HTML it wants</li>
                  <li>CSS, layout, and typography are entirely up to the agent</li>
                  <li>A component library is there when needed. Custom HTML when it isn't</li>
                  <li>The result looks considered because the agent had room to make it so</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section class="brut-versus">
          <div class="brut-versus-header">
            <div class="brut-versus-label">HOW PULSE COMPARES</div>
            <h2 class="brut-versus-h2">Constraints enforced.<br>Not recommended.</h2>
          </div>
          <div class="versus-table-wrap table-sticky-col">
            <table class="brut-table">
              <thead>
                <tr>
                  <th></th>
                  <th class="brut-th-pulse">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="vertical-align:middle;margin-right:.3rem">
                      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#f0e642" stroke="#f0e642" stroke-width="1" stroke-linejoin="round"/>
                    </svg>PULSE
                  </th>
                  <th>Next.js / Remix</th>
                  <th>SvelteKit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Ways to write a page</th>
                  <td class="v-yes">One: the spec schema</td>
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
                  <th scope="row">Runtime dependencies</th>
                  <td class="v-yes">Zero. Pure Node.js HTTP</td>
                  <td class="v-no">React, 50+ transitive packages</td>
                  <td class="v-no">Svelte runtime + adapters</td>
                </tr>
                <tr>
                  <th scope="row">Production build step</th>
                  <td class="v-yes">Server needs none. <code>node server.js</code> is production</td>
                  <td class="v-no">Required: <code>next build</code></td>
                  <td class="v-no">Required: <code>vite build</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="brut-pillars">
          <div class="brut-pillar">
            <div class="brut-pillar-icon">${iconZap({ size: 36 })}</div>
            <div class="brut-pillar-body">
              <h3>Performance by design</h3>
              <p>The shell streams to the browser instantly. Deferred segments arrive as data resolves. ~4 kB of JS on first visit. Zero CLS. Immutable bundle caching on deploy. Not configured. Structural.</p>
            </div>
          </div>
          <div class="brut-pillar brut-pillar--alt">
            <div class="brut-pillar-icon">${iconShield({ size: 36 })}</div>
            <div class="brut-pillar-body">
              <h3>Safe by design</h3>
              <p>Security headers on every response, including 404 and 500. Declarative constraints enforce state bounds after every mutation. Guard runs before any server fetcher. Not a plugin. Part of the pipeline.</p>
            </div>
          </div>
          <div class="brut-pillar">
            <div class="brut-pillar-icon">${iconSettings({ size: 36 })}</div>
            <div class="brut-pillar-body">
              <h3>Nothing to configure</h3>
              <p>No bundler config. No runtime dependencies to install, audit, or upgrade. <code>node server.js</code> is production. No breaking upgrades. Page files have no framework imports to version.</p>
            </div>
          </div>
        </section>

        ${server.metrics ? `<section class="brut-metrics">
          <div class="brut-metrics-label">BY THE NUMBERS</div>
          <h2 class="brut-metrics-h2">Performance you can measure.</h2>
          <p class="brut-metrics-sub">Report generated ${server.metrics.generatedAt} · measured from a real Pulse build</p>
          <div class="brut-metrics-grid">
            <div class="brut-metrics-group">
              <div class="brut-metrics-group-label">Lighthouse</div>
              ${server.metrics.lighthouse.map(m => `
                <div class="brut-metric">
                  <span class="brut-metric-val brut-metric-val--hi">${m.value}</span>
                  <span class="brut-metric-lbl">${m.label}</span>
                </div>`).join('')}
            </div>
            <div class="brut-metrics-group">
              <div class="brut-metrics-group-label">Bundle sizes</div>
              ${server.metrics.bundles.map(m => `
                <div class="brut-metric">
                  <span class="brut-metric-val">${m.value}</span>
                  <span class="brut-metric-lbl">${m.label}</span>
                </div>`).join('')}
            </div>
            <div class="brut-metrics-group">
              <div class="brut-metrics-group-label">Web Vitals</div>
              ${server.metrics.vitals.map(m => `
                <div class="brut-metric">
                  <span class="brut-metric-val brut-metric-val--hi">${m.value}</span>
                  <span class="brut-metric-lbl">${m.label}</span>
                </div>`).join('')}
            </div>
            <div class="brut-metrics-group">
              <div class="brut-metrics-group-label">Architecture</div>
              ${server.metrics.architecture.map(m => `
                <div class="brut-metric">
                  <span class="brut-metric-val brut-metric-val--accent">${m.value}</span>
                  <span class="brut-metric-lbl">${m.label}</span>
                </div>`).join('')}
            </div>
          </div>
        </section>` : ''}

        <section class="brut-cta">
          <h2 class="brut-cta-h2">Your first page<br>in under<br>2 minutes.</h2>
          <p class="brut-cta-lead">One spec object. Server data, client state, mutations, and view. In one place. Streaming SSR, security headers, and 100 Lighthouse scores come with it. Nothing to configure.</p>
          <p class="brut-cta-note">Pulse is in early access. The goal is not to compete on features. It is to eliminate the class of problems that come from having too many of them.</p>
          <div class="brut-cta-actions">
            <a href="/getting-started" class="brut-btn-primary brut-btn-primary--inv">Get Started</a>
            <a href="/spec" class="brut-btn-ghost brut-btn-ghost--light">Read the Spec</a>
          </div>
        </section>

      </main>

      <footer class="brut-footer">
        <span>MIT License</span>
        <span class="brut-footer-sep">·</span>
        <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" aria-label="GitHub (opens in new tab)">GitHub</a>
        <span class="brut-footer-sep">·</span>
        <a href="/getting-started">Get started in 2 minutes</a>
      </footer>

    </div>
  `,
}
