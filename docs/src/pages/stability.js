import { renderLayout, h1, lead, section, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import pkg from '../../../packages/pulse/package.json' with { type: 'json' }

const { version } = pkg

const { prev, next } = prevNext('/stability')

export default {
  route: '/stability',
  meta: {
    theme:       'light',
    title:       'Stability & Versioning — Pulse Docs',
    description: 'What Pulse treats as public API, how versions are numbered before and after 1.0, and how removals are announced.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/stability',
    prev,
    next,
    content: `
      ${h1('Stability & Versioning')}
      ${lead('What you can rely on, what may change, and how you will find out. Pulse is currently <code>' + version + '</code>: pre-1.0, so the rules below for 0.x apply.')}

      ${section('public-api', 'What counts as public API')}
      <p>Everything in this table is covered by the versioning rules. Anything else (files under <code>src/</code> that are not reachable through an export, undocumented options, the exact HTML a component renders, the text of warnings and error messages) is internal and can change in any release.</p>
      ${table(['Surface', 'Where it is defined'], [
        ['Spec keys and their behaviour', '<code>spec.js</code> reference, <code>types/schema.d.ts</code>'],
        ['<code>createServer</code> options and the context (<code>ctx</code>) passed to guards, fetchers and <code>render</code>', 'Server API reference, <code>types/server.d.ts</code>'],
        ['The runtime: <code>mount</code>, <code>initNavigation</code>, the <code>data-*</code> attributes the runtime binds (<code>data-event</code>, <code>data-action</code>, <code>data-key</code>, <code>data-preserve</code>, …)', 'Hydration and Navigation guides'],
        ['UI component exports and their props', 'Component pages, <code>@invisibleloop/pulse/ui</code>'],
        ['Package entry points', '<code>.</code>, <code>/server</code>, <code>/runtime</code>, <code>/ssr</code>, <code>/navigate</code>, <code>/schema</code>, <code>/image</code>, <code>/html</code>, <code>/ui</code>, <code>/charts</code>, <code>/testing</code>, <code>/md</code>'],
        ['CLI commands and flags', '<code>pulse --help</code>'],
        ['<code>pulse.config.js</code> fields', 'Configuration'],
        ['MCP tool and resource names, and their arguments', 'Slash Commands and How It Works'],
      ])}

      ${section('versions', 'How versions are numbered')}
      ${table(['Release', 'Before 1.0 (now)', 'From 1.0'], [
        ['Patch (0.22.<b>x</b>)', 'Bug fixes, docs, internal changes. Safe to take.', 'Same.'],
        ['Minor (0.<b>22</b>.0)', 'New features, <b>and may contain breaking changes</b>. Read the release notes before upgrading.', 'New backwards-compatible features only.'],
        ['Major', 'Not used until 1.0.', 'Breaking changes, and only here.'],
      ])}
      <p>New projects depend on <code>^${version}</code>, which before 1.0 accepts patch releases only, so a fresh install cannot silently move to a release with breaking changes. Move up deliberately with <code>pulse update</code>.</p>
      ${callout('note', 'Every merge to <code>main</code> publishes a release, so versions advance quickly. The version number tells you the <em>kind</em> of change (derived from the commit type), not how large it is.')}

      ${section('release-notes', 'Where changes are announced')}
      <p>Release notes are the <a href="https://github.com/invisibleloop/pulse-framework/releases">GitHub Releases</a> for each version, generated from the titles of the merged pull requests. A breaking change is marked as such in its pull request title.</p>

      ${section('deprecation', 'Deprecation and removal')}
      <ul>
        <li><strong>From 1.0:</strong> a public API is deprecated in a minor release (with a warning that names the replacement) and removed no sooner than the next major release.</li>
        <li><strong>Before 1.0:</strong> removals can happen in a minor release. They are listed in the release notes, and where practical the old form keeps working for at least one minor release with a warning.</li>
        <li>Security fixes are the exception: they can change behaviour in a patch release when a vulnerability cannot be fixed compatibly.</li>
      </ul>

      ${section('support', 'Supported versions')}
      <p>Only the latest published version receives fixes, including security fixes (see <a href="https://github.com/invisibleloop/pulse-framework/blob/main/SECURITY.md">SECURITY.md</a>). Node.js 22 and 24 are tested in CI; the supported range is <code>&gt;=22</code>.</p>

      ${section('agents', 'Upgrading with an AI agent')}
      <p>The <code>pulse_update</code> MCP tool does not upgrade on its own: its first call reports the installed and latest versions, the agent asks you, and it installs only after you approve.</p>
    `,
  }),
}
