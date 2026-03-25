import{a as s}from"./runtime-QFURDKA2.js";import{a as n,b as l,c as d,d as c,e,g as t,i as a}from"./runtime-OFZXJMSU.js";import{a as r,b as u}from"./runtime-B73WLANC.js";var{prev:p,next:h}=n("/getting-started"),i={route:"/getting-started",meta:{title:"Getting Started \u2014 Pulse Docs",description:"Install Pulse and build your first page with an AI agent in minutes.",styles:["/docs.css"]},state:{},view:()=>l({currentHref:"/getting-started",prev:p,next:h,content:`
      ${d("Getting Started")}
      ${c("Install Pulse, run one command, and have Claude building your first page \u2014 with streaming SSR, security headers, and a 100 Lighthouse score already in place.")}

      ${e("requirements","Requirements")}
      <ul>
        <li><strong>Node.js 22 or later</strong> \u2014 <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a></li>
        <li><strong>Claude Code</strong> \u2014 the CLI for Claude, installed and authenticated \u2014 <a href="https://docs.anthropic.com/en/docs/claude-code/getting-started" target="_blank" rel="noopener">installation guide</a></li>
      </ul>
      <p>Claude Code provides the <code>claude</code> command. Pulse launches it automatically with the Pulse MCP server wired in \u2014 so the agent has instant access to the framework reference, your project structure, and all Pulse tools without any manual configuration.</p>
      ${a("note","GitHub Copilot integration is coming soon. For now, Pulse works exclusively with Claude Code.")}

      ${e("install","Install Pulse")}
      <p>Install the Pulse CLI globally:</p>
      ${t(s("npm install -g @invisibleloop/pulse","bash"))}

      ${e("create","Create your project")}
      <p>Run <code>pulse</code> in any empty directory:</p>
      ${t(s(`mkdir my-app
cd my-app
pulse`,"bash"))}
      <p>Pulse detects the directory is empty and scaffolds a project there. It creates the project files, installs dependencies, and exits with:</p>
      ${t(s("\u2713 Project ready. Run `pulse` again to start your AI session.","bash"))}
      ${a("tip","Running <code>pulse</code> in a non-empty directory prompts for a project name, then creates and scaffolds a subdirectory with that name \u2014 so you can run it from anywhere.")}

      ${e("session","Start a session")}
      <p>Run <code>pulse</code> again from inside your project directory:</p>
      ${t(s("pulse","bash"))}
      <p>This time, Pulse detects the existing project and launches Claude Code with the Pulse MCP server already connected. Claude opens with the complete framework guide loaded, your project structure visible, and all Pulse tools available \u2014 ready to build immediately.</p>
      ${a("note","Run <code>pulse</code> every time you open a working session. It handles starting Claude and wiring up the MCP server. Once Claude is open, use <code>/pulse-dev</code> to start the dev server.")}

      ${e("first-build","Build your first page")}
      <p>Once Claude opens, start the dev server and ask for something:</p>
      ${t(s(`/pulse-dev

"Create a contact form with name, email, and message fields.
Validate the email format before submitting."`,"bash"))}
      <p>The agent will:</p>
      <ol>
        <li>Fetch the Pulse guide from the MCP server \u2014 spec format, component library, quality rules</li>
        <li>Check what pages already exist in your project</li>
        <li>Write the spec \u2014 route, state, validation, action lifecycle, view</li>
        <li>Validate it against the schema and fix every error and warning</li>
        <li>Open the page in the browser and confirm it looks right</li>
      </ol>
      <p>You do not need to explain Pulse to the agent. The MCP server supplies the reference. Just describe what you want.</p>

      ${e("what-was-created","What got created")}
      <p>When you ran <code>pulse</code> in step 2, these files were written to your directory:</p>
      ${t(s(`my-app/
\u251C\u2500\u2500 src/
\u2502   \u251C\u2500\u2500 pages/
\u2502   \u2502   \u2514\u2500\u2500 home.js          \u2190 your first page spec (a working counter)
\u2502   \u2514\u2500\u2500 components/          \u2190 shared view components go here
\u251C\u2500\u2500 public/
\u2502   \u251C\u2500\u2500 app.css              \u2190 global stylesheet
\u2502   \u251C\u2500\u2500 pulse-ui.css         \u2190 Pulse component library styles
\u2502   \u2514\u2500\u2500 pulse-ui.js          \u2190 Pulse component library behaviour
\u251C\u2500\u2500 .claude/
\u2502   \u251C\u2500\u2500 CLAUDE.md            \u2190 session instructions Claude reads on startup
\u2502   \u251C\u2500\u2500 settings.json        \u2190 hooks: syntax checks, colour guards, package blocklist
\u2502   \u2514\u2500\u2500 pulse-checklist.md   \u2190 spec review checklist, kept in sync by Pulse
\u251C\u2500\u2500 package.json
\u2514\u2500\u2500 pulse.config.js          \u2190 port and project settings`,"bash"))}
      <p><code>src/pages/home.js</code> is a complete working spec \u2014 a counter with increment and decrement buttons. Open <a href="http://localhost:3000">localhost:3000</a> after running <code>/pulse-dev</code> to see it. Every new page you create goes into <code>src/pages/</code> and is discovered automatically.</p>
      <p>The <code>.claude/</code> directory contains the agent's operating context. <code>CLAUDE.md</code> tells Claude how the project is structured, <code>settings.json</code> configures hooks that catch common mistakes before they reach you \u2014 hardcoded hex colours, emoji in UI output, and installing client-side rendering libraries are all flagged or blocked automatically.</p>

      ${e("commands","Agent commands")}
      <p>These slash commands are available once Claude is open:</p>
      ${t(s(`/pulse-dev     # start (or restart) the dev server
/pulse-stop    # stop the dev server
/pulse-build   # production build \u2192 public/dist/
/pulse-start   # run the production server
/pulse-report  # Lighthouse audit + performance report`,"bash"))}
      <p>You can also skip the commands entirely \u2014 just describe what you want and the agent handles the rest, including starting the dev server when needed.</p>

      ${e("next-steps","Next steps")}
      <ul>
        <li><a href="/how-it-works">How It Works</a> \u2014 the MCP server, what the agent knows, and the full build cycle</li>
        <li><a href="/project-structure">Project Structure</a> \u2014 where files live and how pages are discovered</li>
        <li><a href="/spec">Spec Reference</a> \u2014 every field the spec supports</li>
        <li><a href="/state">State</a> \u2014 client state and mutations</li>
        <li><a href="/server-data">Server Data</a> \u2014 fetch data on the server before the page renders</li>
        <li><a href="/prompt-examples">Prompt Examples</a> \u2014 real prompts with the output they produce</li>
      </ul>
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",r(i,o,window.__PULSE_SERVER__||{},{ssr:!0}),u(o,r));var C=i;export{C as default};
