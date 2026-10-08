import { readFileSync } from 'node:fs'

const INSTALL = 'npm install -g @invisibleloop/pulse'
const PROMPT  = 'Build this with Pulse. Read https://pulseframework.dev/agent first.'

export default {
  route: '/',

  meta: {
    title:       'Pulse — The spec-first web framework for AI agents',
    description: 'One plain JavaScript object per page. Zero runtime dependencies. Server data, state, mutations, view. Built for AI agents to write production web apps.',
    theme:       'light',
    styles: [
      '/fonts.css',
      '/phosphor/style.css',
      '/pulse-home.css',
    ],
  },

  server: {
    version: () => JSON.parse(readFileSync(new URL('../../../packages/pulse/package.json', import.meta.url), 'utf8')).version,
  },

  state: {
    audience: 'agent',
    demo:     'broken',
    copied:   false,
  },

  mutations: {
    setAgent:  () => ({ audience: 'agent', copied: false }),
    setHuman:  () => ({ audience: 'human', copied: false }),
    setBroken: () => ({ demo: 'broken' }),
    setFixed:  () => ({ demo: 'fixed' }),
  },

  actions: {
    copy: {
      onStart:   () => ({ copied: true }),
      run:       async (state) => {
        await navigator.clipboard.writeText(state.audience === 'agent' ? INSTALL : PROMPT)
        await new Promise(resolve => setTimeout(resolve, 1600))
      },
      onSuccess: () => ({ copied: false }),
      onError:   () => ({ copied: false }),
    },
  },

  view: (state, server) => {
    const { version } = server
    const { audience, demo, copied } = state
    const isAgent  = audience === 'agent'
    const isHuman  = !isAgent
    const isBroken = demo === 'broken'
    const isFixed  = !isBroken

    const on = 'oklch(0.2 0.012 260)', off = 'transparent'
    const onFg = 'oklch(0.985 0.004 90)', offFg = 'oklch(0.45 0.012 260)'

    const agentBg  = isAgent  ? on : off, agentFg  = isAgent  ? onFg : offFg
    const humanBg  = isAgent  ? off : on, humanFg  = isAgent  ? offFg : onFg
    const brokenBg = isBroken ? on : off, brokenFg = isBroken ? onFg : offFg
    const fixedBg  = isBroken ? off : on, fixedFg  = isBroken ? offFg : onFg

    const cmdLabel    = isAgent ? 'Install, then run pulse' : 'Paste into your agent'
    const cmdPrefix   = isAgent ? '$' : '›'
    const cmdText     = isAgent ? INSTALL : PROMPT
    const reviewCount = isBroken ? '7 passed · 1 failed' : '8 passed'

    return `
      <div style="background:oklch(0.985 0.004 90);min-height:100vh">
<header style="max-width:1240px;margin:0 auto;padding:24px clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap">
  <a href="/" style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:19px;letter-spacing:-0.02em">
    <span style="width:28px;height:28px;border-radius:7px;border:1px solid oklch(0.86 0.006 90);background:oklch(0.995 0.002 90);display:grid;place-items:center;font-size:17px;color:oklch(0.5 0.13 160)"><i aria-hidden="true" class="ph-light ph-wave-sine"></i></span>
    <span>Pulse</span>
  </a>
  <nav style="display:flex;align-items:center;gap:28px;font-size:15px;flex-wrap:wrap">
    <a href="/getting-started" style="color:oklch(0.45 0.012 260)">Docs</a>
    <a href="/spec" style="color:oklch(0.45 0.012 260)">Spec</a>
    <a href="/agent" style="color:oklch(0.45 0.012 260)">Agent docs</a>
    <a href="https://github.com/invisibleloop/pulse-framework" style="color:oklch(0.45 0.012 260);display:flex;align-items:center;gap:6px"><i aria-hidden="true" class="ph-light ph-github-logo" style="font-size:18px"></i>GitHub</a>
    <a href="/getting-started" style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;background:oklch(0.2 0.012 260);color:oklch(0.985 0.004 90);font-weight:500">Get started<i aria-hidden="true" class="ph-light ph-arrow-right"></i></a>
  </nav>
</header>
<main id="main-content">
<section style="max-width:1240px;margin:0 auto;padding:clamp(48px,8vw,112px) clamp(20px,4vw,56px) clamp(72px,9vw,128px)">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:clamp(36px,5vw,56px)">
    <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
      <span>v${version}</span><span style="width:20px;height:1px;background:oklch(0.86 0.006 90)"></span><span>Early access</span><span style="width:20px;height:1px;background:oklch(0.86 0.006 90)"></span><span>MIT</span>
    </div>
    <div role="group" aria-label="Reading as" style="display:flex;align-items:center;gap:4px;padding:4px;border:1px solid oklch(0.9 0.006 90);border-radius:999px;background:oklch(0.995 0.002 90);font-size:14px">
      <span style="padding:0 10px 0 8px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.55 0.01 260)">Reading as</span>
      <button data-event="setAgent" aria-pressed="${isAgent}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${agentBg};color:${agentFg}"><i aria-hidden="true" class="ph-light ph-robot" style="font-size:16px"></i>Agent</button>
      <button data-event="setHuman" aria-pressed="${isHuman}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:${humanBg};color:${humanFg}"><i aria-hidden="true" class="ph-light ph-user" style="font-size:16px"></i>Human</button>
    </div>
  </div>

  ${isAgent ? `
    <h1 style="margin:0;font-size:clamp(54px,8.6vw,124px);line-height:0.94;letter-spacing:-0.048em;font-weight:500;max-width:11ch;text-wrap:balance">One spec per page. <span style="color:oklch(0.62 0.01 260)">Nothing to guess.</span></h1>
  ` : ''}
  ${isHuman ? `
    <h1 style="margin:0;font-size:clamp(54px,8.6vw,124px);line-height:0.94;letter-spacing:-0.048em;font-weight:500;max-width:12ch;text-wrap:balance">The web framework <span style="color:oklch(0.62 0.01 260)">your agents write.</span></h1>
  ` : ''}

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(48px,7vw,112px);margin-top:clamp(48px,6vw,80px);align-items:start">
    <div style="display:flex;flex-direction:column;gap:36px">
      ${isAgent ? `
        <p style="margin:0;font-size:clamp(19px,1.55vw,22px);line-height:1.55;color:oklch(0.42 0.012 260);max-width:36ch;text-wrap:pretty">Each page is one plain JavaScript object: server data, state, mutations, view. Pulse validates it against a schema before it runs and tells you exactly what to fix. There is one correct way to build a page, and the validator knows it.</p>
      ` : ''}
      ${isHuman ? `
        <p style="margin:0;font-size:clamp(19px,1.55vw,22px);line-height:1.55;color:oklch(0.42 0.012 260);max-width:36ch;text-wrap:pretty">Pulse gives your agent one format, one set of rules, and a validator that checks its work on every change. You describe the product. Streaming SSR, security headers and caching come from the architecture.</p>
      ` : ''}

      <div style="display:flex;flex-direction:column;gap:10px;max-width:480px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.55 0.01 260)">${cmdLabel}</span>
        <div style="display:flex;align-items:center;gap:12px;padding:6px 6px 6px 18px;border:1px solid oklch(0.88 0.006 90);border-radius:12px;background:oklch(0.995 0.002 90);font-family:'IBM Plex Mono',monospace;font-size:14.5px">
          <span style="color:oklch(0.5 0.13 160)">${cmdPrefix}</span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cmdText}</span>
          <form data-action="copy" style="margin:0;display:flex"><button type="submit" aria-label="${copied ? 'Copied' : 'Copy'}" style="all:unset;cursor:pointer;width:38px;height:38px;display:grid;place-items:center;border-radius:8px;font-size:18px;color:oklch(0.45 0.012 260)" class="hv-1"><i class="${copied ? 'ph-light ph-check' : 'ph-light ph-copy'}"></i></button></form>
        </div>
      </div>

      <div style="display:flex;gap:28px;flex-wrap:wrap;font-size:15px;font-weight:500">
        <a href="/getting-started" style="display:flex;align-items:center;gap:6px">Get started<i aria-hidden="true" class="ph-light ph-arrow-right"></i></a>
        <a href="/spec" style="display:flex;align-items:center;gap:6px;color:oklch(0.45 0.012 260)">Read the spec<i aria-hidden="true" class="ph-light ph-arrow-up-right"></i></a>
      </div>
    </div>

    <div style="border:1px solid oklch(0.9 0.006 90);border-radius:18px;background:oklch(0.995 0.002 90);overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid oklch(0.92 0.006 90)">
        <span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500"><i aria-hidden="true" class="ph-light ph-robot" style="font-size:19px;color:oklch(0.5 0.13 160)"></i>Machine entrypoints</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.55 0.01 260)">no HTML required</span>
      </div>
      <a href="/how-it-works" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90)" class="hv-2">
        <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.025 160);color:oklch(0.45 0.12 160);display:grid;place-items:center;font-size:20px"><i aria-hidden="true" class="ph-light ph-plugs-connected"></i></span>
        <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">MCP server</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Connected by <code style="font-family:'IBM Plex Mono',monospace">pulse</code>. Guide, project structure, tools.</span></span>
        <i aria-hidden="true" class="ph-light ph-arrow-up-right" style="font-size:16px;color:oklch(0.6 0.01 260)"></i>
      </a>
      <a href="/llms.txt" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90)" class="hv-2">
        <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px"><i aria-hidden="true" class="ph-light ph-file-text"></i></span>
        <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px">/llms.txt</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Plain-text index of every doc page.</span></span>
        <i aria-hidden="true" class="ph-light ph-arrow-up-right" style="font-size:16px;color:oklch(0.6 0.01 260)"></i>
      </a>
      <a href="/api/framework" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90)" class="hv-2">
        <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px"><i aria-hidden="true" class="ph-light ph-brackets-curly"></i></span>
        <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px"><span style="color:oklch(0.5 0.13 160)">GET</span> /api/framework</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">The full specification as JSON.</span></span>
        <i aria-hidden="true" class="ph-light ph-arrow-up-right" style="font-size:16px;color:oklch(0.6 0.01 260)"></i>
      </a>
      <a href="/agent" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid oklch(0.94 0.005 90)" class="hv-2">
        <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px"><i aria-hidden="true" class="ph-light ph-seal-check"></i></span>
        <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px"><span style="color:oklch(0.5 0.13 160)">POST</span> /api/validate-spec</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Send a spec. Get errors, or OK.</span></span>
        <i aria-hidden="true" class="ph-light ph-arrow-up-right" style="font-size:16px;color:oklch(0.6 0.01 260)"></i>
      </a>
      <a href="/agent" style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 22px" class="hv-2">
        <span style="width:40px;height:40px;border-radius:10px;background:oklch(0.96 0.006 90);color:oklch(0.4 0.012 260);display:grid;place-items:center;font-size:20px"><i aria-hidden="true" class="ph-light ph-git-fork"></i></span>
        <span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px"><span style="color:oklch(0.5 0.13 160)">POST</span> /api/evaluate</span><span style="font-size:14px;color:oklch(0.5 0.012 260)">Send requirements. Get a fit score and gotchas.</span></span>
        <i aria-hidden="true" class="ph-light ph-arrow-up-right" style="font-size:16px;color:oklch(0.6 0.01 260)"></i>
      </a>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px)">
    <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">01</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>The spec</span></div>
    <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:16ch;text-wrap:balance">One object holds everything a page needs.</h2>
    <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:52ch;text-wrap:pretty">Server fetchers, client state, mutations and view, co-located. No split files, no folder conventions to infer, no hidden config.</p>

    <div class="spec-grid" style="display:grid;gap:clamp(32px,5vw,72px);margin-top:clamp(48px,6vw,72px);align-items:start">
      <div style="min-width:0;border:1px solid oklch(0.9 0.006 90);border-radius:16px;background:oklch(0.995 0.002 90);overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid oklch(0.93 0.005 90);font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
          <span style="display:flex;align-items:center;gap:8px"><i aria-hidden="true" class="ph-light ph-file-js" style="font-size:17px"></i>src/pages/dashboard.js</span>
          <span>JavaScript</span>
        </div>
        <div style="padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.55 0.01 260);overflow-x:auto;white-space:normal">
          <div style="white-space:pre">export default {</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">route</span>: '/dashboard',</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">meta</span>: { title: 'Dashboard — My App', styles: ['/app.css'] },</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">server</span>: {</div>
          <div style="white-space:pre;padding-left:4ch">data: async (ctx) =&gt; {</div>
          <div style="white-space:pre;padding-left:6ch">const user = await db.users.find(ctx.cookies.userId)</div>
          <div style="white-space:pre;padding-left:6ch">return { user, stats: await db.stats.forUser(user.id) }</div>
          <div style="white-space:pre;padding-left:4ch">},</div>
          <div style="white-space:pre;padding-left:2ch">},</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">state</span>: { filter: 'all' },</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">mutations</span>: {</div>
          <div style="white-space:pre;padding-left:4ch">setFilter: (state, event) =&gt; ({ filter: event.target.value }),</div>
          <div style="white-space:pre;padding-left:2ch">},</div>
          <div style="white-space:pre;padding-left:2ch"><span style="color:oklch(0.2 0.012 260);font-weight:500">view</span>: (state, server) =&gt; \`</div>
          <div style="white-space:pre;padding-left:4ch">&lt;main id="main-content"&gt;</div>
          <div style="white-space:pre;padding-left:6ch">&lt;h1&gt;Hello, \${server.data.user.name}&lt;/h1&gt;</div>
          <div style="white-space:pre;padding-left:6ch">&lt;select data-event="change:setFilter"&gt;</div>
          <div style="white-space:pre;padding-left:8ch">&lt;option value="all"&gt;All time&lt;/option&gt;</div>
          <div style="white-space:pre;padding-left:8ch">&lt;option value="week"&gt;This week&lt;/option&gt;</div>
          <div style="white-space:pre;padding-left:6ch">&lt;/select&gt;</div>
          <div style="white-space:pre;padding-left:6ch">&lt;p&gt;\${server.data.stats[state.filter].total} requests&lt;/p&gt;</div>
          <div style="white-space:pre;padding-left:4ch">&lt;/main&gt;</div>
          <div style="white-space:pre;padding-left:2ch">\`,</div>
          <div style="white-space:pre">}</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column">
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;padding:0 0 22px;border-bottom:1px solid oklch(0.92 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-signpost" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <div style="display:flex;flex-direction:column;gap:4px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:500">route · meta</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Where the page lives and what goes in its head.</span></div>
        </div>
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;padding:22px 0;border-bottom:1px solid oklch(0.92 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-database" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <div style="display:flex;flex-direction:column;gap:4px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:500">server</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Fetched on the server. HTML streams before slow data resolves.</span></div>
        </div>
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;padding:22px 0;border-bottom:1px solid oklch(0.92 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-toggle-left" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <div style="display:flex;flex-direction:column;gap:4px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:500">state</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Client state, with optional min/max constraints.</span></div>
        </div>
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;padding:22px 0;border-bottom:1px solid oklch(0.92 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-function" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <div style="display:flex;flex-direction:column;gap:4px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:500">mutations</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Synchronous, pure functions. State in, state out.</span></div>
        </div>
        <div style="display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;padding:22px 0 0">
          <i aria-hidden="true" class="ph-light ph-browser" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <div style="display:flex;flex-direction:column;gap:4px"><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:500">view</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">A function that returns HTML. Any markup, any CSS.</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:clamp(40px,6vw,96px);align-items:start">
    <div>
      <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">02</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>Constraints</span></div>
      <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:10ch;text-wrap:balance">Rules that can’t be skipped.</h2>
      <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:34ch;text-wrap:pretty">Each rule is enforced by the schema, the runtime or the server. Break one and validation fails with the rule’s name and the fix.</p>
    </div>
    <div style="display:flex;flex-direction:column;border-top:1px solid oklch(0.9 0.006 90)">
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
        <i aria-hidden="true" class="ph-light ph-cube" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
        <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:18px;font-weight:500">Every page is exactly one plain object</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Data can’t be split from view or spread across files.</span></div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">schema</span>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
        <i aria-hidden="true" class="ph-light ph-function" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
        <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:18px;font-weight:500">Mutations are synchronous and pure</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">State changes are predictable and testable.</span></div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">runtime</span>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
        <i aria-hidden="true" class="ph-light ph-app-window" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
        <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:18px;font-weight:500">Dialogs always render</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Opened with <code style="font-family:'IBM Plex Mono',monospace;font-size:14px">data-dialog-open</code>, never conditionally mounted.</span></div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">runtime</span>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
        <i aria-hidden="true" class="ph-light ph-ruler" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
        <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:18px;font-weight:500">Constraints hold after every mutation</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">State can’t leave its declared min/max bounds.</span></div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">runtime</span>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:18px;align-items:start;padding:24px 0;border-bottom:1px solid oklch(0.9 0.006 90)">
        <i aria-hidden="true" class="ph-light ph-shield-check" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
        <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:18px;font-weight:500">Forms carry CSRF tokens</span><span style="font-size:15px;line-height:1.5;color:oklch(0.5 0.012 260)">Added automatically. Unprotected submissions are rejected.</span></div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.5 0.012 260);padding:4px 9px;border:1px solid oklch(0.9 0.006 90);border-radius:6px;white-space:nowrap">server</span>
      </div>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90);background:oklch(0.975 0.005 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px)">
    <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">03</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>pulse_review</span></div>
    <div style="display:flex;align-items:end;justify-content:space-between;gap:32px;flex-wrap:wrap">
      <div>
        <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:15ch;text-wrap:balance">A real check, catching a real mistake.</h2>
        <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:50ch;text-wrap:pretty">A common agent-shaped mistake: a modal whose visibility is driven by state instead of always being in the DOM. This is the actual output of <code style="font-family:'IBM Plex Mono',monospace;font-size:17px">pulse_review</code> against it.</p>
      </div>
      <div style="display:flex;align-items:center;gap:4px;padding:4px;border:1px solid oklch(0.9 0.006 90);border-radius:999px;background:oklch(0.995 0.002 90);font-size:14px">
        <button data-event="setBroken" aria-pressed="${isBroken}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:${brokenBg};color:${brokenFg}"><i aria-hidden="true" class="ph-light ph-x-circle" style="font-size:16px"></i>As written</button>
        <button data-event="setFixed" aria-pressed="${isFixed}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:${fixedBg};color:${fixedFg}"><i aria-hidden="true" class="ph-light ph-check-circle" style="font-size:16px"></i>After fix</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:20px;margin-top:clamp(40px,5vw,64px)">
      <div style="min-width:0;border:1px solid oklch(0.9 0.006 90);border-radius:16px;background:oklch(0.995 0.002 90);overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid oklch(0.93 0.005 90);font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
          <span style="display:flex;align-items:center;gap:8px"><i aria-hidden="true" class="ph-light ph-file-js" style="font-size:17px"></i>src/pages/settings.js</span>
          <span>JavaScript</span>
        </div>
        ${isBroken ? `
          <div style="padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.5 0.01 260);overflow-x:auto;white-space:normal">
            <div style="white-space:pre">export default {</div>
            <div style="white-space:pre;padding-left:2ch">route: '/settings',</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 2ch);background:oklch(0.965 0.025 25);color:oklch(0.42 0.14 25)">state: { modalOpen: false },</div>
            <div style="white-space:pre;padding-left:2ch">mutations: {</div>
            <div style="white-space:pre;padding-left:4ch">openModal:  (state) =&gt; ({ modalOpen: true }),</div>
            <div style="white-space:pre;padding-left:4ch">closeModal: (state) =&gt; ({ modalOpen: false }),</div>
            <div style="white-space:pre;padding-left:2ch">},</div>
            <div style="white-space:pre;padding-left:2ch">view: (state) =&gt; \`</div>
            <div style="white-space:pre;padding-left:4ch">&lt;main id="main-content"&gt;</div>
            <div style="white-space:pre;padding-left:6ch">&lt;button data-event="openModal"&gt;Edit profile&lt;/button&gt;</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 6ch);background:oklch(0.965 0.025 25);color:oklch(0.42 0.14 25)">\${state.modalOpen ? \`</div>
            <div style="white-space:pre;padding-left:8ch">&lt;dialog open&gt;</div>
            <div style="white-space:pre;padding-left:10ch">&lt;p&gt;Edit your profile&lt;/p&gt;</div>
            <div style="white-space:pre;padding-left:10ch">&lt;button data-event="closeModal"&gt;Close&lt;/button&gt;</div>
            <div style="white-space:pre;padding-left:8ch">&lt;/dialog&gt;</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 6ch);background:oklch(0.965 0.025 25);color:oklch(0.42 0.14 25)">\` : ''}</div>
            <div style="white-space:pre;padding-left:4ch">&lt;/main&gt;</div>
            <div style="white-space:pre;padding-left:2ch">\`,</div>
            <div style="white-space:pre">}</div>
          </div>
        ` : ''}
        ${isFixed ? `
          <div style="white-space:pre;padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.5 0.01 260);overflow-x:auto;white-space:normal">
            <div style="white-space:pre">export default {</div>
            <div style="white-space:pre;padding-left:2ch">route: '/settings',</div>
            <div style="white-space:pre;padding-left:2ch">view: () =&gt; \`</div>
            <div style="white-space:pre;padding-left:4ch">&lt;main id="main-content"&gt;</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 6ch);background:oklch(0.96 0.03 160);color:oklch(0.4 0.11 160)">&lt;button data-dialog-open="edit-profile"&gt;Edit profile&lt;/button&gt;</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 6ch);background:oklch(0.96 0.03 160);color:oklch(0.4 0.11 160)">&lt;dialog id="edit-profile"&gt;</div>
            <div style="white-space:pre;padding-left:8ch">&lt;p&gt;Edit your profile&lt;/p&gt;</div>
            <div style="white-space:pre;padding-left:8ch">&lt;form method="dialog"&gt;</div>
            <div style="white-space:pre;padding-left:10ch">&lt;button&gt;Close&lt;/button&gt;</div>
            <div style="white-space:pre;padding-left:8ch">&lt;/form&gt;</div>
            <div style="white-space:pre;margin:0 -24px;padding:0 24px 0 calc(24px + 6ch);background:oklch(0.96 0.03 160);color:oklch(0.4 0.11 160)">&lt;/dialog&gt;</div>
            <div style="white-space:pre;padding-left:4ch">&lt;/main&gt;</div>
            <div style="white-space:pre;padding-left:2ch">\`,</div>
            <div style="white-space:pre">}</div>
          </div>
        ` : ''}
      </div>

      <div style="min-width:0;border:1px solid oklch(0.9 0.006 90);border-radius:16px;background:oklch(0.995 0.002 90);overflow:hidden;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid oklch(0.93 0.005 90);font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260)">
          <span style="display:flex;align-items:center;gap:8px"><i aria-hidden="true" class="ph-light ph-terminal-window" style="font-size:17px"></i>pulse_review output</span>
          <span>${reviewCount}</span>
        </div>
        <div style="padding:22px 24px;font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.75;color:oklch(0.35 0.012 260);display:flex;flex-direction:column;gap:2px">
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No positive tabindex</span></div>
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No data-event on text inputs</span></div>
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No React patterns (className/htmlFor/onClick)</span></div>
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No emoji in view HTML</span></div>
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>&lt;main id="main-content"&gt; present</span></div>
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No obvious hex colours in view</span></div>
          ${isBroken ? `
            <div style="display:flex;gap:12px;margin:8px -12px;padding:12px;border-radius:10px;background:oklch(0.965 0.025 25);color:oklch(0.42 0.14 25)"><span>✗</span><span>modalOpen-style state found — never conditionally render a &lt;dialog&gt;; always render it unconditionally and open it with data-dialog-open</span></div>
          ` : ''}
          ${isFixed ? `
            <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No conditionally rendered &lt;dialog&gt;</span></div>
          ` : ''}
          <div style="display:flex;gap:12px"><span style="color:oklch(0.5 0.13 160)">✓</span><span>No malformed _storeUpdate found</span></div>
          ${isBroken ? `
            <div style="margin-top:18px;padding-top:18px;border-top:1px solid oklch(0.93 0.005 90);color:oklch(0.2 0.012 260)">Fix before proceeding, then run pulse validate again.</div>
          ` : ''}
          ${isFixed ? `
            <div style="margin-top:18px;padding-top:18px;border-top:1px solid oklch(0.93 0.005 90);color:oklch(0.4 0.11 160)">All checks passed.</div>
          ` : ''}
        </div>
      </div>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px)">
    <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">04</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>Structure and design</span></div>
    <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:17ch;text-wrap:balance">Strict about structure. <span style="color:oklch(0.62 0.01 260)">Silent about style.</span></h2>
    <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:54ch;text-wrap:pretty">The spec tells an agent exactly how to wire up data, state and behaviour. Layout, typography and CSS remain real decisions, and the agent makes them.</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:clamp(40px,6vw,96px);margin-top:clamp(48px,6vw,72px)">
      <div style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid oklch(0.86 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-lock-simple" style="font-size:24px;color:oklch(0.5 0.13 160)"></i>
          <span style="font-size:22px;font-weight:500;letter-spacing:-0.01em">The structure is fixed</span>
        </div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">One spec format. No ambiguity about how a page should be built.</div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">Schema validation at startup. Bad output is rejected before it ships.</div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">Security, SSR and caching are part of the architecture.</div>
        <div style="padding:18px 0;font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">Consistent, reviewable output across every agent and every session.</div>
      </div>
      <div style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid oklch(0.86 0.006 90)">
          <i aria-hidden="true" class="ph-light ph-paint-brush-broad" style="font-size:24px;color:oklch(0.4 0.012 260)"></i>
          <span style="font-size:22px;font-weight:500;letter-spacing:-0.01em">The design is not</span>
        </div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">The view is a plain JS function. The agent writes whatever HTML it wants.</div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">CSS, layout and typography are entirely up to the agent.</div>
        <div style="padding:18px 0;border-bottom:1px solid oklch(0.92 0.006 90);font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">A component library is there when needed. Custom HTML when it isn’t.</div>
        <div style="padding:18px 0;font-size:17px;line-height:1.5;color:oklch(0.38 0.012 260)">The result looks considered because the agent had room to make it so.</div>
      </div>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px)">
    <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">05</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>Measured</span></div>
    <div style="display:flex;align-items:end;justify-content:space-between;gap:32px;flex-wrap:wrap">
      <h2 style="margin:0;font-size:clamp(40px,5.4vw,76px);line-height:1;letter-spacing:-0.04em;font-weight:500;max-width:14ch;text-wrap:balance">Not claimed. Measured.</h2>
      <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.5;color:oklch(0.5 0.012 260);max-width:40ch">
        <i aria-hidden="true" class="ph-light ph-clock-counter-clockwise" style="font-size:18px;color:oklch(0.5 0.13 160);flex-shrink:0"></i>
        <span>Report generated 6 Oct 2026, 21:26 from a build on this deploy. Recomputed on every server start.</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));margin-top:clamp(48px,6vw,72px);border-top:1px solid oklch(0.9 0.006 90);border-left:1px solid oklch(0.9 0.006 90)">
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-file" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0 kB</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Static page. No JS shipped.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-lightning" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">&lt; 6 kB</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Single-page app. Runtime and page, brotli.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-ruler" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0.00</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Cumulative Layout Shift.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-package" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">0</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Runtime dependencies. No production build step.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-person-arms-spread" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">100</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Lighthouse Accessibility.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-seal-check" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">100</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Lighthouse Best Practices.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-magnifying-glass" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">100</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Lighthouse SEO.</span>
      </div>
      <div style="padding:28px 26px;border-right:1px solid oklch(0.9 0.006 90);border-bottom:1px solid oklch(0.9 0.006 90);display:flex;flex-direction:column;gap:14px">
        <i aria-hidden="true" class="ph-light ph-stack" style="font-size:20px;color:oklch(0.55 0.01 260)"></i>
        <span style="font-size:clamp(40px,4.2vw,56px);line-height:1;letter-spacing:-0.04em;font-weight:500">&lt; 2 kB</span>
        <span style="font-size:15px;line-height:1.45;color:oklch(0.5 0.012 260)">Multi-page shared runtime, cached, brotli.</span>
      </div>
    </div>
  </div>
</section>

<section style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:clamp(72px,9vw,128px) clamp(20px,4vw,56px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(48px,7vw,112px);align-items:start">
    <div>
      <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:oklch(0.5 0.012 260);margin-bottom:28px"><span style="color:oklch(0.5 0.13 160)">06</span><span style="width:24px;height:1px;background:oklch(0.86 0.006 90)"></span><span>Get started</span></div>
      <h2 style="margin:0;font-size:clamp(44px,6.4vw,92px);line-height:0.98;letter-spacing:-0.045em;font-weight:500;max-width:10ch;text-wrap:balance">Your first page in two minutes.</h2>
      <p style="margin:28px 0 0;font-size:20px;line-height:1.55;color:oklch(0.45 0.012 260);max-width:40ch;text-wrap:pretty">Pulse is in early access. The goal is not to compete on features. It is to eliminate the class of problems that come from having too many of them.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:40px;font-size:15px;font-weight:500">
        <a href="/getting-started" style="display:flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:oklch(0.2 0.012 260);color:oklch(0.985 0.004 90)">Get started<i aria-hidden="true" class="ph-light ph-arrow-right"></i></a>
        <a href="/spec" style="display:flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;border:1px solid oklch(0.86 0.006 90);background:oklch(0.995 0.002 90)">Read the spec</a>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;border:1px solid oklch(0.9 0.006 90);border-radius:18px;background:oklch(0.995 0.002 90);overflow:hidden">
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr);gap:16px;padding:24px;border-bottom:1px solid oklch(0.93 0.005 90)">
        <span style="width:28px;height:28px;border-radius:50%;border:1px solid oklch(0.86 0.006 90);display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.45 0.012 260)">1</span>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0"><span style="font-size:16px;font-weight:500">Install the CLI</span><code style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:oklch(0.35 0.012 260);overflow-x:auto;white-space:nowrap"><span style="color:oklch(0.5 0.13 160)">$ </span>npm install -g @invisibleloop/pulse</code></div>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr);gap:16px;padding:24px;border-bottom:1px solid oklch(0.93 0.005 90)">
        <span style="width:28px;height:28px;border-radius:50%;border:1px solid oklch(0.86 0.006 90);display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.45 0.012 260)">2</span>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0"><span style="font-size:16px;font-weight:500">Scaffold in an empty directory</span><code style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:oklch(0.35 0.012 260)"><span style="color:oklch(0.5 0.13 160)">$ </span>pulse</code></div>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr);gap:16px;padding:24px;border-bottom:1px solid oklch(0.93 0.005 90)">
        <span style="width:28px;height:28px;border-radius:50%;border:1px solid oklch(0.86 0.006 90);display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(0.45 0.012 260)">3</span>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0"><span style="font-size:16px;font-weight:500">Run it again to open your agent</span><code style="font-family:'IBM Plex Mono',monospace;font-size:14px;color:oklch(0.35 0.012 260)"><span style="color:oklch(0.5 0.13 160)">$ </span>pulse</code><span style="font-size:14px;line-height:1.5;color:oklch(0.5 0.012 260)">Claude Code or GitHub Copilot CLI, with the Pulse MCP server already connected.</span></div>
      </div>
      <div style="display:grid;grid-template-columns:32px minmax(0,1fr);gap:16px;padding:24px;background:oklch(0.98 0.004 90)">
        <i aria-hidden="true" class="ph-light ph-chat-text" style="font-size:22px;color:oklch(0.5 0.13 160);padding-left:3px"></i>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0"><span style="font-size:16px;font-weight:500">Describe what you want</span><span style="font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.6;color:oklch(0.35 0.012 260);text-wrap:pretty">“Create a contact form with name, email, and message fields. Validate the email format before submitting.”</span></div>
      </div>
    </div>
  </div>
</section>
</main>
<footer style="border-top:1px solid oklch(0.91 0.006 90)">
  <div style="max-width:1240px;margin:0 auto;padding:32px clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:14px;color:oklch(0.5 0.012 260)">
    <span style="display:flex;align-items:center;gap:8px"><i aria-hidden="true" class="ph-light ph-wave-sine" style="font-size:18px;color:oklch(0.5 0.13 160)"></i>Pulse · MIT License · v${version}</span>
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <a href="/getting-started" style="color:oklch(0.45 0.012 260)">Docs</a>
      <a href="/agent" style="color:oklch(0.45 0.012 260)">Agent docs</a>
      <a href="https://github.com/invisibleloop/pulse-framework" style="color:oklch(0.45 0.012 260)">GitHub</a>
    </div>
  </div>
</footer>
</div>
    `
  },
}
