import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/persist')

export default {
  route: '/persist',
  meta: {
    title: 'Persist — Pulse Docs',
    description: 'Persist client state across page refreshes using localStorage.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/persist',
    prev,
    next,
    content: `
      ${h1('Persist')}
      ${lead('The <code>persist</code> field declares which state keys survive page refreshes. Everything else resets. The list is explicit — nothing is persisted unless it is named here, and sensitive data should never appear in it.')}

      ${section('declaring', 'Declaring persistence')}
      <p><code>persist</code> is an array of dot-path strings. Each path points to a key in state that should be saved:</p>
      ${codeBlock(highlight(`export default {
  route: '/settings',
  state: {
    theme:       'light',
    fontSize:    16,
    sidebarOpen: true,
    user: {
      name:        '',
      preferences: { notifications: true, newsletter: false },
    },
  },
  persist: [
    'theme',
    'fontSize',
    'user.preferences',
  ],
  // ...
}`, 'js'))}
      <p>In this example, <code>theme</code>, <code>fontSize</code>, and the entire <code>user.preferences</code> sub-object are saved to <code>localStorage</code>. The <code>sidebarOpen</code> key and <code>user.name</code> are session-only — they reset on each visit.</p>

      ${section('how-it-works', 'How it works')}
      <p>On every state update, Pulse serialises the persisted keys and writes them to <code>localStorage</code> under a key derived from the page route. On the next mount, persisted values are read back and merged over the spec's initial state before the view renders.</p>

      ${table(
        ['Step', 'What happens'],
        [
          ['First visit', 'State initialised from <code>spec.state</code>. Nothing in storage yet.'],
          ['User interacts', 'Mutations update state. Persisted keys are written to <code>localStorage</code>.'],
          ['Page refresh / return visit', 'Persisted values loaded from storage and merged over initial state. View renders with restored state.'],
        ]
      )}

      ${section('dot-paths', 'Dot-path notation')}
      <p>Persist keys use the same dot-path notation as <a href="/validation">validation</a>. Entire top-level keys or specific nested sub-objects can be persisted:</p>
      ${codeBlock(highlight(`persist: [
  'theme',                    // top-level key
  'user.preferences',         // nested sub-object (entire object is saved)
  'cart.items',               // array of cart items
]`, 'js'))}
      ${callout('note', 'When persisting a nested path like <code>user.preferences</code>, the <em>entire value at that path</em> is saved and restored — not individual sub-keys within it.')}

      ${section('storage-key', 'Storage key')}
      <p>Pulse stores persisted state under <code>pulse:[route]</code> in <code>localStorage</code>. For example, a spec with <code>route: \'/settings\'</code> uses the key <code>pulse:/settings</code>. This namespacing prevents collisions between pages.</p>

      ${section('ssr', 'SSR and persistence')}
      <p>On the server, <code>localStorage</code> does not exist. The server always renders with the spec's initial state. Persisted values are applied on the client after hydration — before the first mutation, after mount.</p>
      ${callout('warning', 'If SSR and client state diverge significantly due to persisted values, a content flash may occur. Best practice: keep persisted state to preferences and settings that do not affect the main page content.')}

      ${section('clearing', 'Clearing persisted state')}
      <p>To clear persisted state programmatically, remove the relevant key from <code>localStorage</code>:</p>
      ${codeBlock(highlight(`localStorage.removeItem('pulse:/settings')`, 'js'))}
      <p>Or use a mutation that resets the persisted fields to their initial values — Pulse will save the reset values on the next update.</p>

      ${section('best-practices', 'Best practices')}
      <ul>
        <li>Persist preferences and settings (theme, language, layout choices)</li>
        <li>Persist shopping cart contents or draft form data</li>
        <li>Never persist sensitive data (tokens, passwords, PII) — <code>localStorage</code> is not secure storage</li>
        <li>Never persist data that must be authoritative — use <a href="/server-data">server data</a> for anything that should be fresh from the server</li>
        <li>Keep persisted payloads small — <code>localStorage</code> has a ~5 MB limit and blocks the main thread if abused</li>
      </ul>
    `,
  }),
}
