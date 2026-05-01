import { renderLayout, h1, lead, section, codeBlock, callout } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/getting-started')

export default {
  route: '/getting-started',
  meta: {
    title: 'Getting Started — Pulse Docs',
    description: 'Install Pulse and build your first page with an AI agent in minutes.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/getting-started',
    prev,
    next,
    content: `
      ${h1('Getting Started')}
      ${lead('Install Pulse, run one command, and have an AI agent building your first page — with streaming SSR, security headers, and a 100 Lighthouse score already in place.')}

      ${section('requirements', 'Requirements')}
      <ul>
        <li><strong>Node.js 22 or later</strong> — <a href="https://nodejs.org" target="_blank" rel="noopener" aria-label="nodejs.org (opens in new tab)">nodejs.org</a></li>
        <li><strong>Google Chrome</strong> — used by the agent for screenshots and Lighthouse audits — <a href="https://www.google.com/chrome" target="_blank" rel="noopener" aria-label="Download Google Chrome (opens in new tab)">google.com/chrome</a></li>
        <li><strong>An AI agent</strong> — Claude Code or GitHub Copilot CLI (pick one):</li>
      </ul>
      <ul>
        <li><strong>Claude Code</strong> — <a href="https://docs.anthropic.com/en/docs/claude-code/getting-started" target="_blank" rel="noopener" aria-label="Claude Code installation guide (opens in new tab)">installation guide</a> — the default; no extra config needed</li>
        <li><strong>GitHub Copilot CLI</strong> — <a href="https://docs.github.com/copilot/concepts/agents/about-copilot-cli" target="_blank" rel="noopener" aria-label="GitHub Copilot CLI documentation (opens in new tab)">documentation</a> — use with the <code>--agent copilot</code> flag</li>
      </ul>
      <p>Pulse launches your chosen agent automatically with the Pulse MCP server wired in — so the agent has instant access to the framework reference, your project structure, and all Pulse tools without any manual configuration.</p>

      ${section('install', 'Install Pulse')}
      <p>Install the Pulse CLI globally:</p>
      ${codeBlock(highlight('npm install -g @invisibleloop/pulse', 'bash'))}

      ${section('create', 'Create your project')}
      <p>Run <code>pulse</code> in any empty directory:</p>
      ${codeBlock(highlight(`mkdir my-app
cd my-app
pulse`, 'bash'))}
      <p>Pulse detects the directory is empty and scaffolds a project there. It creates the project files, installs dependencies, and exits with:</p>
      ${codeBlock(highlight('✓ Project ready. Run `pulse` again to start your AI session.', 'bash'))}
      ${callout('tip', 'Running <code>pulse</code> in a non-empty directory prompts for a project name, then creates and scaffolds a subdirectory with that name — so you can run it from anywhere.')}

      ${section('session', 'Start a session')}
      <p>Run <code>pulse</code> again from inside your project directory:</p>
      ${codeBlock(highlight('pulse', 'bash'))}
      <p>Pulse detects the existing project and launches Claude Code with the Pulse MCP server already connected. Claude opens with the complete framework guide loaded, your project structure visible, and all Pulse tools available — ready to build immediately.</p>
      ${callout('note', 'Run <code>pulse</code> every time you open a working session. It handles starting the agent and wiring up the MCP server. Once the agent is open, use <code>/pulse-dev</code> (Claude) or the <code>build-page</code> skill (Copilot) to start the dev server.')}

      ${section('copilot', 'Using GitHub Copilot')}
      <p>To use GitHub Copilot CLI instead of Claude, pass the <code>--agent</code> flag when scaffolding:</p>
      ${codeBlock(highlight('pulse --agent copilot', 'bash'))}
      <p>This scaffolds the project and writes <code>agent: \'copilot\'</code> into <code>pulse.config.js</code> — so subsequent <code>pulse</code> runs pick up the preference automatically. You can also set it manually in <code>pulse.config.js</code> at any time:</p>
      ${codeBlock(highlight(`export default {
  agent: 'copilot',
}`, 'js'))}
      <p>When using Copilot, project skills (<code>build-page</code>, <code>verify</code>, <code>new-doc-page</code>) are available via the <code>/skills</code> command inside the Copilot CLI session. The Pulse MCP server is automatically injected into your Copilot MCP config for the duration of the session and removed cleanly on exit.</p>

      ${section('first-build', 'Build your first page')}
      <p>Once Claude opens, start the dev server and ask for something:</p>
      ${codeBlock(highlight(`/pulse-dev

"Create a contact form with name, email, and message fields.
Validate the email format before submitting."`, 'bash'))}
      <p>The agent will:</p>
      <ol>
        <li>Fetch the Pulse guide from the MCP server — spec format, component library, quality rules</li>
        <li>Check what pages already exist in your project</li>
        <li>Write the spec — route, state, validation, action lifecycle, view</li>
        <li>Validate it against the schema and fix every error and warning</li>
        <li>Open the page in the browser and confirm it looks right</li>
      </ol>
      <p>You do not need to explain Pulse to the agent. The MCP server supplies the reference. Just describe what you want.</p>

      ${section('what-was-created', 'What got created')}
      <p>When you ran <code>pulse</code> in step 2, these files were written to your directory:</p>
      ${codeBlock(highlight(`my-app/
├── src/
│   ├── pages/
│   │   └── home.js          ← your first page spec (a working counter)
│   └── components/          ← shared view components go here
├── public/
│   ├── app.css              ← global stylesheet
│   ├── pulse-ui.css         ← Pulse component library styles
│   └── pulse-ui.js          ← Pulse component library behaviour
├── .claude/                 ← Claude Code agent context
│   ├── CLAUDE.md            ← session instructions Claude reads on startup
│   ├── settings.json        ← hooks: syntax checks, colour guards, package blocklist
│   ├── pulse-checklist.md   ← spec review checklist, kept in sync by Pulse
│   └── commands/            ← slash commands available inside Claude
│       ├── pulse-dev.md
│       ├── pulse-stop.md
│       ├── pulse-build.md
│       └── pulse-start.md
├── .copilot/                ← GitHub Copilot CLI agent context
│   └── skills/              ← project skills available inside Copilot
│       ├── build-page/
│       ├── verify/
│       └── new-doc-page/
├── .github/
│   ├── copilot-instructions.md          ← session instructions for Copilot
│   └── instructions/
│       └── pulse-checklist.instructions.md
├── package.json
└── pulse.config.js          ← port, agent, and project settings`, 'bash'))}
      <p><code>src/pages/home.js</code> is a complete working spec — a counter with increment and decrement buttons. Open <a href="http://localhost:3000">localhost:3000</a> after starting the dev server to see it. Every new page you create goes into <code>src/pages/</code> and is discovered automatically.</p>
      <p>The <code>.claude/</code> directory contains the Claude agent's operating context. The <code>.copilot/</code> directory contains the equivalent context for GitHub Copilot — project skills and instructions. Both are scaffolded by default so you can switch agents at any time.</p>

      ${section('commands', 'Agent commands')}
      <p>These slash commands are available once Claude is open:</p>
      ${codeBlock(highlight(`/pulse-dev     # start (or restart) the dev server
/pulse-stop    # stop the dev server
/pulse-build   # production build → public/dist/
/pulse-start   # run the production server
/pulse-report  # Lighthouse audit + performance report`, 'bash'))}
      <p>When using GitHub Copilot CLI, the equivalent capabilities are available as project skills. Type <code>/skills</code> inside Copilot to browse them — <code>build-page</code>, <code>verify</code>, and <code>new-doc-page</code> are all pre-installed.</p>
      <p>You can also skip commands and skills entirely — just describe what you want and the agent handles the rest.</p>

      ${section('update', 'Keeping up to date')}
      <p>When a new version of Pulse is released, update the package and then run <code>pulse update</code> from your project root:</p>
      ${codeBlock(highlight(`npm update @invisibleloop/pulse
pulse update`, 'bash'))}
      <p><code>pulse update</code> copies the latest UI assets and agent files into your project:</p>
      <ul>
        <li><code>public/pulse-ui.css</code> and <code>public/pulse-ui.js</code> — component library styles and behaviour</li>
        <li><code>.claude/pulse-checklist.md</code> and <code>.claude/commands/</code> — Claude agent files</li>
        <li><code>.copilot/skills/</code> — Copilot project skills</li>
        <li><code>.github/instructions/pulse-checklist.instructions.md</code> — Copilot checklist</li>
      </ul>
      <p>Your own source files, <code>CLAUDE.md</code>, <code>.github/copilot-instructions.md</code>, and <code>pulse.config.js</code> are never touched.</p>

      ${section('next-steps', 'Next steps')}
      <ul>
        <li><a href="/how-it-works">How It Works</a> — the MCP server, what the agent knows, and the full build cycle</li>
        <li><a href="/project-structure">Project Structure</a> — where files live and how pages are discovered</li>
        <li><a href="/spec">Spec Reference</a> — every field the spec supports</li>
        <li><a href="/state">State</a> — client state and mutations</li>
        <li><a href="/server-data">Server Data</a> — fetch data on the server before the page renders</li>
        <li><a href="/prompt-examples">Prompt Examples</a> — real prompts with the output they produce</li>
      </ul>
    `,
  }),
}
