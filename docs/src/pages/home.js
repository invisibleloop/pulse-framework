export default {
  route: '/',
  meta: {
    title: 'Pulse — The spec-first web framework for AI agents',
    description: 'One plain JavaScript object per page. Zero runtime dependencies. Server data, state, mutations, view. Built for AI agents to write production web apps.',
    styles: ['/pulse-ui.css'],
  },

  state: {
    audience: 'agent',
    copied: false,
  },

  mutations: {
    setAudience: (state, event) => {
      const audience = event.currentTarget.dataset.audience
      return { audience, copied: false }
    },
    copyCommand: (state) => {
      return { copied: true }
    },
  },

  view: (state) => {
    const isAgent = state.audience === 'agent'
    const installCmd = 'npm install -g @invisibleloop/pulse'
    const agentPrompt = 'Build this with Pulse. Read https://pulseframework.dev/agent first.'

    return `
      <main id="main-content" style="background:oklch(0.985 0.004 90);color:oklch(0.2 0.012 260);font-family:'Hanken Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased">

        <!-- Header -->
        <header style="max-width:1240px;margin:0 auto;padding:24px clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap" role="banner">
          <a href="/" style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:19px;letter-spacing:-0.02em;color:oklch(0.2 0.012 260);text-decoration:none">
            <span style="width:28px;height:28px;border-radius:7px;border:1px solid oklch(0.86 0.006 90);background:oklch(0.995 0.002 90);display:grid;place-items:center;font-size:17px;color:oklch(0.5 0.13 160)">⚡</span>
            <span>Pulse</span>
          </a>
          <nav style="display:flex;align-items:center;gap:28px;font-size:15px;flex-wrap:wrap">
            <a href="/getting-started" style="color:oklch(0.45 0.012 260);text-decoration:none">Docs</a>
            <a href="/spec" style="color:oklch(0.45 0.012 260);text-decoration:none">Spec</a>
            <a href="/agent" style="color:oklch(0.45 0.012 260);text-decoration:none">Agent docs</a>
            <a href="https://github.com/invisibleloop/pulse-framework" target="_blank" rel="noopener" style="color:oklch(0.45 0.012 260);text-decoration:none">GitHub</a>
            <a href="/getting-started" style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;background:oklch(0.2 0.012 260);color:oklch(0.985 0.004 90);font-weight:500;text-decoration:none">Get started</a>
          </nav>
        </header>

        <!-- Hero Section -->
        <section style="max-width:1240px;margin:0 auto;padding:clamp(48px,8vw,112px) clamp(20px,4vw,56px) clamp(72px,9vw,128px);width:100%">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:clamp(36px,5vw,56px)">
            <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
              <span>v0.20.17</span>
              <span style="width:20px;height:1px;background:oklch(0.86 0.006 90)"></span>
              <span>Early access</span>
              <span style="width:20px;height:1px;background:oklch(0.86 0.006 90)"></span>
              <span>MIT</span>
            </div>
            <fieldset style="display:flex;align-items:center;gap:4px;padding:4px;border:1px solid oklch(0.9 0.006 90);border-radius:999px;background:oklch(0.995 0.002 90);font-size:14px;border-style:none;margin:0">
              <legend style="padding:0 10px 0 8px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.58 0.01 260)">Reading as</legend>
              <button data-event="click:setAudience" data-audience="agent" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${isAgent ? 'oklch(0.2 0.012 260)' : 'transparent'};color:${isAgent ? 'oklch(0.985 0.004 90)' : 'oklch(0.45 0.012 260)'};font-weight:500;border:1px solid ${isAgent ? 'oklch(0.2 0.012 260)' : 'transparent'};transition:all 0.1s">
                🤖 Agent
              </button>
              <button data-event="click:setAudience" data-audience="human" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${!isAgent ? 'oklch(0.2 0.012 260)' : 'transparent'};color:${!isAgent ? 'oklch(0.985 0.004 90)' : 'oklch(0.45 0.012 260)'};font-weight:500;border:1px solid ${!isAgent ? 'oklch(0.2 0.012 260)' : 'transparent'};transition:all 0.1s">
                👤 Human
              </button>
            </fieldset>
          </div>

          <h1 style="margin:0;font-size:clamp(54px,8.6vw,124px);line-height:0.94;letter-spacing:-0.048em;font-weight:600;max-width:${isAgent ? '11ch' : '12ch'};text-wrap:balance">
            ${isAgent ? 'One spec per page. <span style="color:oklch(0.5 0.13 160)">Nothing to guess.</span>' : 'The web framework <span style="color:oklch(0.5 0.13 160)">your agents write.</span>'}
          </h1>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(48px,7vw,112px);margin-top:clamp(48px,6vw,80px);align-items:start">
            <div style="display:flex;flex-direction:column;gap:36px">
              <p style="margin:0;font-size:clamp(19px,1.55vw,22px);line-height:1.55;color:oklch(0.42 0.012 260);max-width:36ch;text-wrap:pretty">
                ${isAgent ? 'Each page is one plain JavaScript object: server data, state, mutations, view. Pulse validates it against a schema before it runs and tells you exactly what to fix. There is one correct way to build a page, and the validator knows it.' : 'Pulse gives your agent one format, one set of rules, and a validator that checks its work on every change. You describe the product. Streaming SSR, security headers and caching come from the architecture.'}
              </p>

              <div style="display:flex;flex-direction:column;gap:10px;max-width:480px">
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.55 0.01 260)">${isAgent ? 'Install, then run pulse' : 'Paste into your agent'}</span>
                <div style="display:flex;align-items:center;gap:12px;padding:6px 6px 6px 18px;border:1px solid oklch(0.88 0.006 90);border-radius:12px;background:oklch(0.995 0.002 90);font-family:'IBM Plex Mono',monospace;font-size:14.5px">
                  <span style="color:oklch(0.5 0.13 160)">$</span>
                  <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:oklch(0.2 0.012 260)">${isAgent ? installCmd : agentPrompt}</span>
                  <button data-event="click:copyCommand" aria-label="Copy" style="all:unset;cursor:pointer;width:38px;height:38px;display:grid;place-items:center;border-radius:8px;font-size:18px;color:oklch(0.45 0.012 260);transition:background 0.1s">
                    ${state.copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              <div style="display:flex;gap:28px;flex-wrap:wrap;font-size:15px;font-weight:500">
                <a href="/getting-started" style="display:flex;align-items:center;gap:6px;color:oklch(0.2 0.012 260);text-decoration:none">Get started →</a>
                <a href="/spec" style="display:flex;align-items:center;gap:6px;color:oklch(0.45 0.012 260);text-decoration:none">Read the spec →</a>
              </div>
            </div>

            <div style="border:1px solid oklch(0.9 0.006 90);border-radius:18px;background:oklch(0.995 0.002 90);overflow:hidden">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid oklch(0.92 0.006 90)">
                <span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500">🤖 Machine entrypoints</span>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.58 0.01 260)">no HTML required</span>
              </div>
              <a href="/how-it-works" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90);text-decoration:none;color:oklch(0.2 0.012 260)">
                <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.025 160);color:oklch(0.45 0.12 160);display:grid;place-items:center;font-size:20px">🔌</span>
                <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">MCP server</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Connected by <code style="font-family:'IBM Plex Mono',monospace">pulse</code>. Guide, project structure, tools.</span></span>
                <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
              </a>
              <a href="/llms.txt" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90);text-decoration:none;color:oklch(0.2 0.012 260)">
                <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px">📄</span>
                <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">/llms.txt</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Plain-text index of every doc page.</span></span>
                <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
              </a>
              <a href="/agent" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;text-decoration:none;color:oklch(0.2 0.012 260)">
                <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px">✅</span>
                <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">Agent guide</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Everything an agent needs to know.</span></span>
                <span style="font-size:16px;color:oklch(0.6 0.01 260)">↗</span>
              </a>
            </div>
          </div>
        </section>

        <!-- The Spec Section -->
        <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%">
          <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
            <span style="color:oklch(0.5 0.13 160)">01</span>
            <span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span>
            <span>The spec</span>
          </div>
          <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:600;max-width:16ch;text-wrap:balance">One object holds everything a page needs.</h2>
          <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:52ch;text-wrap:pretty">Server fetchers, client state, mutations and view, co-located. No split files, no folder conventions to infer, no hidden config.</p>
        </section>

        <!-- Constraints Section -->
        <section style="border-top:1px solid oklch(0.91 0.006 90);max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:clamp(40px,6vw,96px)">
          <div>
            <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px">
              <span style="color:oklch(0.5 0.13 160)">02</span>
              <span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span>
              <span>Constraints</span>
            </div>
            <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:600;max-width:10ch;text-wrap:balance">Rules that can't be skipped.</h2>
            <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:34ch;text-wrap:pretty">Each rule is enforced by the schema, the runtime or the server. Break one and validation fails with the rule's name and the fix.</p>
          </div>
          <div style="display:flex;flex-direction:column;border-top:1px solid oklch(0.9 0.006 90)">
            <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
              <div style="font-size:24px">📦</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <span style="font-size:18px;font-weight:600">Every page is exactly one plain object</span>
                <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Data can't be split from view or spread across files.</span>
              </div>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">schema</span>
            </div>
            <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
              <div style="font-size:24px">ƒ</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <span style="font-size:18px;font-weight:600">Mutations are synchronous and pure</span>
                <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">State changes are predictable and testable.</span>
              </div>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">runtime</span>
            </div>
            <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0">
              <div style="font-size:24px">🔒</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <span style="font-size:18px;font-weight:600">Forms carry CSRF tokens</span>
                <span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Added automatically. Unprotected submissions are rejected.</span>
              </div>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">server</span>
            </div>
          </div>
        </section>

      </main>
    `
  }
}
