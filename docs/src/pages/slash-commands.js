import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/slash-commands')

export default {
  route: '/slash-commands',
  meta: {
    theme:       'light',
    title: 'Slash Commands — Pulse Docs',
    description: 'The built-in slash commands available in the Pulse AI agent session.',
    styles: ['/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/slash-commands',
    prev,
    next,
    content: `
      ${h1('Slash Commands')}
      ${lead('Slash commands close the development loop inside the agent session. Building, auditing, and verifying performance happen without leaving the conversation — and every audit is checked against the thresholds you have declared in config.')}

      ${section('commands', 'Available commands')}
      ${table(
        ['Command', 'What it does'],
        [
          ['<code>/pulse-dev</code>',    'Starts (or restarts) the development server. The server watches for file changes and reloads automatically.'],
          ['<code>/pulse-stop</code>',   'Stops the running development server.'],
          ['<code>/pulse-build</code>',  'Runs a production build. Bundles all specs via esbuild into <code>public/dist/</code> with content-hashed filenames.'],
          ['<code>/pulse-start</code>',  'Starts the production server against the built output. Used to verify production behaviour before deploying.'],
          ['<code>/verify</code>',       'Runs the full verification loop: validate, screenshot, Lighthouse desktop + mobile (pass bar: 100 on Accessibility, Best Practices, and SEO), a mobile layout check, a performance trace, and <code>pulse_review</code> — then writes the verification stamp. <code>/verify --quick</code> skips Lighthouse and the perf trace for fast mid-build checkpoints.'],
        ]
      )}

      ${section('usage', 'Using commands')}
      <p>Commands are typed directly into the agent chat:</p>
      ${codeBlock(highlight(`/pulse-dev
/verify`, 'bash'))}
      <p>The agent executes the relevant CLI steps and reports back with results, including whether any Lighthouse score fell short of the pass bar.</p>

      ${callout('note', '<code>/verify</code> runs Lighthouse against a full production build (<code>pulse_build</code>, then the production server on port 3001) — never against the dev server. Development builds are unminified and report misleading scores.')}

      ${section('plain-language', 'Plain language prompts')}
      <p>Slash commands cover the most common operations. For everything else, describe the goal — the agent handles the implementation within Pulse's spec structure:</p>
      ${codeBlock(highlight(`"Create a blog index page that fetches posts from an API"
"Add email validation to the contact form"
"Build a checkout flow with a Stripe payment step"
"Add a guard to the dashboard so unauthenticated users are redirected to /login"`, 'bash'))}
      <p>The agent produces spec files that conform to Pulse's structure — the framework enforces correctness, so there is no manual wiring to verify.</p>
    `,
  }),
}
