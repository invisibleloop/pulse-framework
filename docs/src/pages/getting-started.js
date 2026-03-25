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
  state: {},
  view: () => renderLayout({
    currentHref: '/getting-started',
    prev,
    next,
    content: `
      ${h1('Getting Started')}
      ${lead('Install Pulse, run one command, and have Claude building your first page — with streaming SSR, security headers, and a 100 Lighthouse score already in place.')}

      ${section('requirements', 'Requirements')}
      <ul>
        <li><strong>Node.js 22 or later</strong> — <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a></li>
        <li><strong>Claude Code</strong> — the CLI for Claude, installed and authenticated — <a href="https://docs.anthropic.com/en/docs/claude-code/getting-started" target="_blank" rel="noopener">installation guide</a></li>
      </ul>
      <p>Claude Code provides the <code>claude</code> command. Pulse launches it automatically with the Pulse MCP server wired in — so the agent has instant access to the framework reference, your project structure, and all Pulse tools without any manual configuration.</p>
      ${callout('note', 'GitHub Copilot integration is coming soon. For now, Pulse works exclusively with Claude Code.')}

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
      <p>This time, Pulse detects the existing project and launches Claude Code with the Pulse MCP server already connected. Claude opens with the complete framework guide loaded, your project structure visible, and all Pulse tools available — ready to build immediately.</p>
      ${callout('note', 'Run <code>pulse</code> every time you open a working session. It handles starting Claude and wiring up the MCP server. Once Claude is open, use <code>/pulse-dev</code> to start the dev server.')}

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
├── .claude/
│   ├── CLAUDE.md            ← session instructions Claude reads on startup
│   ├── settings.json        ← hooks: syntax checks, colour guards, package blocklist
│   └── pulse-checklist.md   ← spec review checklist, kept in sync by Pulse
├── package.json
└── pulse.config.js          ← port and project settings`, 'bash'))}
      <p><code>src/pages/home.js</code> is a complete working spec — a counter with increment and decrement buttons. Open <a href="http://localhost:3000">localhost:3000</a> after running <code>/pulse-dev</code> to see it. Every new page you create goes into <code>src/pages/</code> and is discovered automatically.</p>
      <p>The <code>.claude/</code> directory contains the agent's operating context. <code>CLAUDE.md</code> tells Claude how the project is structured, <code>settings.json</code> configures hooks that catch common mistakes before they reach you — hardcoded hex colours, emoji in UI output, and installing client-side rendering libraries are all flagged or blocked automatically.</p>

      ${section('commands', 'Agent commands')}
      <p>These slash commands are available once Claude is open:</p>
      ${codeBlock(highlight(`/pulse-dev     # start (or restart) the dev server
/pulse-stop    # stop the dev server
/pulse-build   # production build → public/dist/
/pulse-start   # run the production server
/pulse-report  # Lighthouse audit + performance report`, 'bash'))}
      <p>You can also skip the commands entirely — just describe what you want and the agent handles the rest, including starting the dev server when needed.</p>

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
