export default {
  route: '/',
  meta: {
    title: 'Pulse — The spec-first web framework for AI agents',
    description: 'One plain JavaScript object per page. Zero runtime dependencies. Server data, state, mutations, view. Built for AI agents to write production web apps.',
    styles: ['/pulse-ui.css', '/home.css'],
  },

  state: {
    audience: 'agent',
    demoMode: 'broken',
    copied: false,
  },

  mutations: {
    setAudience: (state, event) => {
      const audience = event.currentTarget.dataset.audience
      return { audience, copied: false }
    },
    setDemoMode: (state, event) => {
      return { demoMode: event.currentTarget.dataset.mode }
    },
    copyCommand: (state) => {
      return { copied: true }
    },
    clearCopy: (state) => {
      return { copied: false }
    },
  },

  view: (state) => {
    const isAgent = state.audience === 'agent'
    const isBroken = state.demoMode === 'broken'

    const installCmd = 'npm install -g @invisibleloop/pulse'
    const agentPrompt = 'Build this with Pulse. Read https://pulseframework.dev/agent first.'

    return `
      <main id="main-content">
        <div style="background:#fafaf9;min-height:100vh;display:flex;flex-direction:column">

          <!-- Header -->
          <header style="max-width:1240px;margin:0 auto;padding:24px clamp(20px,4vw,56px);width:100%;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap" role="banner">
            <a href="/" style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:19px;letter-spacing:-0.02em;color:#0f172a;text-decoration:none">
              <span style="width:28px;height:28px;border-radius:7px;border:1px solid #e2e8f0;background:#ffffff;display:grid;place-items:center;font-size:17px;color:#0f766e">⚡</span>
              <span>Pulse</span>
            </a>
            <nav style="display:flex;align-items:center;gap:28px;font-size:15px;flex-wrap:wrap">
              <a href="/getting-started" style="color:#475569;text-decoration:none">Docs</a>
              <a href="/spec" style="color:#475569;text-decoration:none">Spec</a>
              <a href="/agent" style="color:#475569;text-decoration:none">Agent docs</a>
              <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" style="color:#475569;text-decoration:none;display:flex;align-items:center;gap:6px">GitHub</a>
              <a href="/getting-started" style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;background:#0f172a;color:#fafaf9;font-weight:500;text-decoration:none">Get started</a>
            </nav>
          </header>

          <!-- Hero Section -->
          <section style="max-width:1240px;margin:0 auto;padding:clamp(48px,8vw,112px) clamp(20px,4vw,56px) clamp(72px,9vw,128px);width:100%">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:clamp(36px,5vw,56px)">
              <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:#64748b">
                <span>v0.20.17</span>
                <span style="width:20px;height:1px;background:#e2e8f0"></span>
                <span>Early access</span>
                <span style="width:20px;height:1px;background:#e2e8f0"></span>
                <span>MIT</span>
              </div>
              <fieldset style="display:flex;align-items:center;gap:4px;padding:4px;border:1px solid #cbd5e1;border-radius:999px;background:#ffffff;font-size:14px;border-style:none">
                <legend style="padding:0 10px 0 8px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#64748b">Reading as:</legend>
                <button data-event="click:setAudience" data-audience="agent" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${isAgent ? '#0f172a' : 'transparent'};color:${isAgent ? '#fafaf9' : '#475569'};font-weight:500;border:1px solid ${isAgent ? '#0f172a' : 'transparent'};transition:all 0.1s">
                  🤖 Agent
                </button>
                <button data-event="click:setAudience" data-audience="human" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${!isAgent ? '#0f172a' : 'transparent'};color:${!isAgent ? '#fafaf9' : '#475569'};font-weight:500;border:1px solid ${!isAgent ? '#0f172a' : 'transparent'};transition:all 0.1s">
                  👤 Human
                </button>
              </fieldset>
            </div>

            <h1 style="margin:0;font-size:clamp(54px,8.6vw,124px);line-height:0.94;letter-spacing:-0.048em;font-weight:500;max-width:${isAgent ? '11ch' : '12ch'};text-wrap:balance">
              ${isAgent ? 'One spec per page. <span style="color:#0f766e">Nothing to guess.</span>' : 'The web framework <span style="color:#0f766e">your agents write.</span>'}
            </h1>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(48px,7vw,112px);margin-top:clamp(48px,6vw,80px);align-items:start">
              <div style="display:flex;flex-direction:column;gap:36px">
                <p style="margin:0;font-size:clamp(19px,1.55vw,22px);line-height:1.55;color:oklch(0.42 0.012 260);max-width:36ch;text-wrap:pretty">
                  ${isAgent ? 'Each page is one plain JavaScript object: server data, state, mutations, view. Pulse validates it against a schema before it runs and tells you exactly what to fix. There is one correct way to build a page, and the validator knows it.' : 'Pulse gives your agent one format, one set of rules, and a validator that checks its work on every change. You describe the product. Streaming SSR, security headers and caching come from the architecture.'}
                </p>

                <div style="display:flex;flex-direction:column;gap:10px;max-width:480px">
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.55 0.01 260)">${isAgent ? 'Install, then run pulse' : 'Paste into your agent'}</span>
                  <div style="display:flex;align-items:center;gap:12px;padding:6px 6px 6px 18px;border:1px solid oklch(0.88 0.006 90);border-radius:12px;background:#ffffff;font-family:'IBM Plex Mono',monospace;font-size:14.5px">
                    <span style="color:#0f766e">$</span>
                    <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isAgent ? installCmd : agentPrompt}</span>
                    <button data-event="click:copyCommand" aria-label="Copy" style="all:unset;cursor:pointer;width:38px;height:38px;display:grid;place-items:center;border-radius:8px;font-size:18px;color:#475569;transition:background 0.1s" data-hover="background:oklch(0.95 0.005 90)">
                      ${state.copied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                <div style="display:flex;gap:28px;flex-wrap:wrap;font-size:15px;font-weight:500">
                  <a href="/getting-started" style="display:flex;align-items:center;gap:6px;color:#0f172a;text-decoration:none">Get started →</a>
                  <a href="/spec" style="display:flex;align-items:center;gap:6px;color:#475569;text-decoration:none">Read the spec ↗</a>
                </div>
              </div>

              <div style="border:1px solid #cbd5e1;border-radius:18px;background:#ffffff;overflow:hidden">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid oklch(0.92 0.006 90)">
                  <span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500">🤖 Machine entrypoints</span>
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#64748b">no HTML required</span>
                </div>
                <a href="/agent" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90);text-decoration:none;color:#0f172a">
                  <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.025 160);color:oklch(0.45 0.12 160);display:grid;place-items:center;font-size:20px">🔌</span>
                  <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">MCP server</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Connected by <code style="font-family:'IBM Plex Mono',monospace">pulse</code>. Guide, project structure, tools.</span></span>
                  <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
                </a>
                <a href="/llms.txt" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90);text-decoration:none;color:#0f172a">
                  <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px">📄</span>
                  <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">/llms.txt</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Plain-text index of every doc page.</span></span>
                  <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
                </a>
                <a href="/api/framework" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;text-decoration:none;color:#0f172a">
                  <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px">{ }</span>
                  <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px"><span style="color:#0f766e">GET</span> /api/framework</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">The full specification as JSON.</span></span>
                  <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
                </a>
              </div>
            </div>
          </section>

          <!-- The Spec Section -->
          <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%">
            <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
              <span style="color:#0f766e">01</span>
              <span style="width:24px;height:1px;background:#e2e8f0"></span>
              <span>The spec</span>
            </div>
            <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:16ch;text-wrap:balance">One object holds everything a page needs.</h2>
            <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:#475569;max-width:52ch;text-wrap:pretty">Server fetchers, client state, mutations and view, co-located. No split files, no folder conventions to infer, no hidden config.</p>
          </section>

          <!-- Constraints Section -->
          <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:clamp(40px,6vw,96px)">
            <div>
              <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
                <span style="color:#0f766e">02</span>
                <span style="width:24px;height:1px;background:#e2e8f0"></span>
                <span>Constraints</span>
              </div>
              <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:10ch;text-wrap:balance">Rules that can't be skipped.</h2>
              <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:#475569;max-width:34ch;text-wrap:pretty">Each rule is enforced by the schema, the runtime or the server. Break one and validation fails with the rule's name and the fix.</p>
            </div>
            <div style="display:flex;flex-direction:column;border-top:1px solid #cbd5e1">
              <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid #cbd5e1">
                <div style="font-size:24px;color:#0f766e">📦</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  <span style="font-size:18px;font-weight:500">Every page is exactly one plain object</span>
                  <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Data can't be split from view or spread across files.</span>
                </div>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid #cbd5e1;border-radius:6px;white-space:nowrap">schema</span>
              </div>
              <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid #cbd5e1">
                <div style="font-size:24px;color:#0f766e">ƒ</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  <span style="font-size:18px;font-weight:500">Mutations are synchronous and pure</span>
                  <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">State changes are predictable and testable.</span>
                </div>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid #cbd5e1;border-radius:6px;white-space:nowrap">runtime</span>
              </div>
              <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0">
                <div style="font-size:24px;color:#0f766e">🔒</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  <span style="font-size:18px;font-weight:500">Forms carry CSRF tokens</span>
                  <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Added automatically. Unprotected submissions are rejected.</span>
                </div>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid #cbd5e1;border-radius:6px;white-space:nowrap">server</span>
              </div>
            </div>
          </section>

          <!-- Review Demo Section -->
          <section style="border-top:1px solid oklch(0.91 0.006 90);background:oklch(0.975 0.005 90);max-width:100%;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px)">
            <div style="max-width:1240px;margin:0 auto">
              <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
                <span style="color:#0f766e">03</span>
                <span style="width:24px;height:1px;background:#e2e8f0"></span>
                <span>pulse_review</span>
              </div>
              <div style="display:flex;align-items:end;justify-content:space-between;gap:32px;flex-wrap:wrap;margin-bottom:clamp(40px,5vw,64px)">
                <div>
                  <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:15ch;text-wrap:balance">A real check, catching a real mistake.</h2>
                  <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:#475569;max-width:50ch;text-wrap:pretty">A common agent-shaped mistake: a modal whose visibility is driven by state instead of always being in the DOM. This is the actual output of <code style="font-family:'IBM Plex Mono',monospace;font-size:17px">pulse_review</code> against it.</p>
                </div>
                <div style="display:flex;align-items:center;gap:4px;padding:4px;border:1px solid #cbd5e1;border-radius:999px;background:#ffffff;font-size:14px;flex-shrink:0">
                  <button data-event="click:setDemoMode" data-mode="broken" title="Show broken code example" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:${isBroken ? '#0f172a' : 'transparent'};color:${isBroken ? '#fafaf9' : '#475569'};font-weight:500;border:1px solid ${isBroken ? '#0f172a' : 'transparent'};transition:all 0.1s">❌ As written</button>
                  <button data-event="click:setDemoMode" data-mode="fixed" title="Show fixed code example" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:${!isBroken ? '#0f172a' : 'transparent'};color:${!isBroken ? '#fafaf9' : '#475569'};font-weight:500;border:1px solid ${!isBroken ? '#0f172a' : 'transparent'};transition:all 0.1s">✅ After fix</button>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:20px">
                <div style="min-width:0;border:1px solid #cbd5e1;border-radius:16px;background:#ffffff;overflow:hidden">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid oklch(0.93 0.005 90);font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
                    <span style="display:flex;align-items:center;gap:8px">📄 src/pages/settings.js</span>
                    <span>JavaScript</span>
                  </div>
                  <div style="padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.55 0.01 260);overflow-x:auto;white-space:pre;background:${isBroken ? '#ffffff' : 'oklch(0.97 0.004 90)'}">export default {
  route: '/settings',
  state: { modalOpen: false },
  mutations: {
    openModal:  (state) => ({ modalOpen: true }),
    closeModal: (state) => ({ modalOpen: false }),
  },
  view: (state) => \`
    &lt;main id="main-content"&gt;
      &lt;button data-event="openModal"&gt;Edit profile&lt;/button&gt;
      \${state.modalOpen ? \`
        &lt;dialog open&gt;
          &lt;p&gt;Edit your profile&lt;/p&gt;
          &lt;button data-event="closeModal"&gt;Close&lt;/button&gt;
        &lt;/dialog&gt;
      \` : ''}
    &lt;/main&gt;
  \`,
}</div>
                </div>

                <div style="min-width:0;border:1px solid #cbd5e1;border-radius:16px;background:#ffffff;overflow:hidden;display:flex;flex-direction:column">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid oklch(0.93 0.005 90);font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
                    <span style="display:flex;align-items:center;gap:8px">💻 pulse_review output</span>
                    <span>${isBroken ? '7 passed · 1 failed' : '8 passed'}</span>
                  </div>
                  <div style="padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.35 0.012 260);display:flex;flex-direction:column;gap:2px;flex:1">
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No positive tabindex</span></div>
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No data-event on text inputs</span></div>
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No React patterns (className/htmlFor/onClick)</span></div>
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No emoji in view HTML</span></div>
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>&lt;main id="main-content"&gt; present</span></div>
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No obvious hex colours in view</span></div>
                    ${isBroken ? '<div style="display:flex;gap:12px;margin:8px -12px;padding:12px;border-radius:10px;background:oklch(0.965 0.025 25);color:oklch(0.42 0.14 25)"><span>✗</span><span>modalOpen-style state found — never conditionally render a &lt;dialog&gt;; always render it unconditionally and open it with data-dialog-open</span></div>' : '<div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No conditionally rendered &lt;dialog&gt;</span></div>'}
                    <div style="display:flex;gap:12px"><span style="color:#0f766e">✓</span><span>No malformed _storeUpdate found</span></div>
                    <div style="margin-top:18px;padding-top:18px;border-top:1px solid oklch(0.93 0.005 90);color:#0f172a">
                      ${isBroken ? 'Fix before proceeding, then run pulse validate again.' : 'All checks passed.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Measured Section -->
          <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%">
            <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
              <span style="color:#0f766e">04</span>
              <span style="width:24px;height:1px;background:#e2e8f0"></span>
              <span>Measured</span>
            </div>
            <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:14ch;text-wrap:balance">Not claimed. Measured.</h2>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));margin-top:clamp(48px,6vw,72px);border-top:1px solid #cbd5e1;border-left:1px solid #cbd5e1">
              <div style="padding:28px 26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:14px">
                <div style="font-size:20px">📄</div>
                <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0 kB</span>
                <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Static page. No JS shipped.</span>
              </div>
              <div style="padding:28px 26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:14px">
                <div style="font-size:20px">⚡</div>
                <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">&lt; 6 kB</span>
                <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Single-page app. Runtime and page, brotli.</span>
              </div>
              <div style="padding:28px 26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:14px">
                <div style="font-size:20px">📏</div>
                <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0.00</span>
                <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Cumulative Layout Shift.</span>
              </div>
              <div style="padding:28px 26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:14px">
                <div style="font-size:20px">0️⃣</div>
                <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0</span>
                <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Runtime dependencies.</span>
              </div>
              <div style="padding:28px 26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:14px">
                <div style="font-size:20px">💯</div>
                <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">100</span>
                <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Lighthouse.</span>
              </div>
            </div>
          </section>

          <!-- Get Started Section -->
          <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(48px,7vw,112px)">
            <div>
              <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
                <span style="color:#0f766e">05</span>
                <span style="width:24px;height:1px;background:#e2e8f0"></span>
                <span>Get started</span>
              </div>
              <h2 style="margin:0;font-size:clamp(44px,6.4vw,92px);line-height:0.98;letter-spacing:-0.045em;font-weight:500;max-width:10ch;text-wrap:balance">Your first page in two minutes.</h2>
              <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:#475569;max-width:40ch;text-wrap:pretty">Pulse is in early access. The goal is not to compete on features. It is to eliminate the class of problems that come from having too many of them.</p>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:40px;font-size:15px;font-weight:500">
                <a href="/getting-started" style="display:flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:#0f172a;color:#fafaf9;text-decoration:none">Get started →</a>
                <a href="/spec" style="display:flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;border:1px solid #e2e8f0;background:#ffffff;color:#0f172a;text-decoration:none">Read the spec</a>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <footer style="border-top:1px solid oklch(0.91 0.006 90);margin-top:auto" role="contentinfo">
            <div style="max-width:1240px;margin:0 auto;padding:32px clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:14px;color:oklch(0.5 0.012 260)">
              <span style="display:flex;align-items:center;gap:8px">⚡ Pulse · MIT License · v0.20.17</span>
              <div style="display:flex;gap:24px;flex-wrap:wrap">
                <a href="/getting-started" style="color:#475569;text-decoration:none">Docs</a>
                <a href="/agent" style="color:#475569;text-decoration:none">Agent docs</a>
                <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" style="color:#475569;text-decoration:none">GitHub</a>
              </div>
            </div>
          </footer>

        </div>
      </main>
    `
  },
}
