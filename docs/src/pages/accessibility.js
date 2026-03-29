import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/accessibility')

export default {
  route: '/accessibility',
  meta: {
    title: 'Accessibility — Pulse Docs',
    description: 'Keyboard navigation, focus management, semantic HTML, and ARIA patterns in Pulse.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/accessibility',
    prev,
    next,
    content: `
      ${h1('Accessibility')}
      ${lead('Pulse enforces a 100 Lighthouse Accessibility score as the baseline. The foundations — skip link, focus styles, and focus management on navigation — are provided by the framework on every page. There is nothing to configure and nothing to forget.')}

      ${section('built-in', 'What the framework provides')}
      ${table(
        ['Feature', 'How'],
        [
          ['Skip link', 'Injected on every page as the first focusable element. Targets <code>#main-content</code>. Visible only on focus.'],
          ['Focus styles', '<code>:focus-visible</code> outline applied globally — purple, 3px, offset 2px. Suppressed for mouse users via <code>:focus:not(:focus-visible)</code>.'],
          ['Navigation focus', 'After client-side navigation, focus moves to <code>#main-content</code>, <code>&lt;main&gt;</code>, or <code>&lt;h1&gt;</code> — whichever is found first. Screen reader users hear the new page heading without a full reload.'],
        ]
      )}
      ${callout('note', 'The skip link targets <code>#main-content</code>. Pages use <code>&lt;main id="main-content"&gt;</code> as the content wrapper so the link resolves correctly.')}

      ${section('structure', 'Page structure')}
      <p>Each page view is wrapped in <code>&lt;main id="main-content"&gt;</code> with a single <code>&lt;h1&gt;</code> that describes the current page. Landmark elements communicate structure to assistive technology:</p>
      ${codeBlock(highlight(`view: (state) => \`
  <main id="main-content">
    <h1>Page title</h1>
    <!-- page content -->
  </main>
\``, 'js'))}
      ${table(
        ['Element', 'Purpose'],
        [
          ['<code>&lt;header&gt;</code>', 'Site header, logo, primary nav'],
          ['<code>&lt;nav&gt;</code>', 'Navigation links — <code>aria-label</code> distinguishes multiple navs'],
          ['<code>&lt;main id="main-content"&gt;</code>', 'Primary page content — one per page'],
          ['<code>&lt;aside&gt;</code>', 'Supplementary content (sidebars, related links)'],
          ['<code>&lt;footer&gt;</code>', 'Site footer'],
        ]
      )}

      ${section('interactive', 'Interactive elements')}
      <p>Actions are expressed as <code>&lt;button&gt;</code> elements, navigation as <code>&lt;a href&gt;</code> links. Both are keyboard-accessible by default. <code>&lt;div&gt;</code> and <code>&lt;span&gt;</code> elements with click handlers are not reachable by keyboard:</p>
      ${codeBlock(highlight(`<!-- Keyboard accessible -->
<button data-event="toggle">Open menu</button>
<a href="/about">About</a>

<!-- Not keyboard accessible — avoid -->
<div data-event="toggle">Open menu</div>
<span onclick="...">About</span>`, 'html'))}
      <p>Buttons that toggle state carry <code>aria-expanded</code> or <code>aria-pressed</code> to communicate the current state to screen readers:</p>
      ${codeBlock(highlight(`view: (state) => \`
  <button data-event="toggleMenu" aria-expanded="\${state.menuOpen}">
    Menu
  </button>
  \${state.menuOpen ? \`<nav>...</nav>\` : ''}
\``, 'js'))}

      ${section('focus', 'Focus management')}
      <p>When a modal or dialog opens, focus moves inside it. When it closes, focus returns to the element that opened it. Since Pulse updates the DOM via morphing rather than a full replacement, the triggering element stays in the DOM and receives focus back naturally.</p>
      <p>The <code>autofocus</code> attribute on the first interactive element inside newly revealed content moves focus there after the DOM update — no JavaScript required:</p>
      ${codeBlock(highlight(`view: (state) => \`
  <button data-event="openDialog">Delete item</button>

  \${state.dialogOpen ? \`
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <h2 id="dialog-title">Confirm deletion</h2>
      <p>This cannot be undone.</p>
      <button autofocus data-event="confirmDelete">Delete</button>
      <button data-event="closeDialog">Cancel</button>
    </div>
  \` : ''}
\``, 'js'))}

      ${section('live-regions', 'Dynamic content announcements')}
      <p>State changes that produce status messages — loading indicators, confirmations, validation errors — are wrapped in live regions so screen readers announce them without a page reload:</p>
      ${table(
        ['Role', 'Politeness', 'Used for'],
        [
          ['<code>role="status"</code>', 'Polite — waits for the user to finish', 'Loading states, success messages, counts'],
          ['<code>role="alert"</code>', 'Assertive — interrupts immediately', 'Validation errors, destructive confirmations'],
        ]
      )}
      ${codeBlock(highlight(`view: (state) => \`
  <form data-action="submit">
    <!-- fields -->
    <button type="submit" \${state.status === 'loading' ? 'disabled' : ''}>
      \${state.status === 'loading' ? 'Saving…' : 'Save'}
    </button>
  </form>

  \${state.status === 'loading' ? \`
    <p role="status">Saving…</p>
  \` : ''}

  \${state.errors.length ? \`
    <div role="alert">
      \${state.errors.map(e => \`<p>\${e.message}</p>\`).join('')}
    </div>
  \` : ''}
\``, 'js'))}

      ${section('forms', 'Forms')}
      <p>Form controls are paired with <code>&lt;label&gt;</code> elements. Error messages are linked to their input via <code>aria-describedby</code> so screen readers announce them when the field receives focus:</p>
      ${codeBlock(highlight(`<form data-action="submit">
  <div class="field">
    <label for="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      required
      aria-describedby="\${state.emailError ? 'email-error' : ''}"
    >
    \${state.emailError
      ? \`<p id="email-error" role="alert">\${state.emailError}</p>\`
      : ''}
  </div>

  <fieldset>
    <legend>Notification preferences</legend>
    <label><input type="checkbox" name="email-notifs"> Email</label>
    <label><input type="checkbox" name="sms-notifs"> SMS</label>
  </fieldset>

  <button type="submit">Submit</button>
</form>`, 'html'))}

      ${section('images', 'Images')}
      <p>Decorative images carry <code>alt=""</code> so screen readers skip them. Informative images have descriptive alt text. Icon-only buttons are labelled with <code>aria-label</code>, with the icon marked <code>aria-hidden="true"</code>:</p>
      ${codeBlock(highlight(`<!-- Informative image -->
<img src="/team.jpg" alt="The Pulse team at the 2025 offsite" width="800" height="450">

<!-- Decorative image -->
<img src="/divider.svg" alt="" width="600" height="4">

<!-- Icon-only button -->
<button aria-label="Close">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>`, 'html'))}

      ${section('lighthouse', 'Lighthouse score')}
      <p>Every page is expected to score 100 on Lighthouse Accessibility. Run <code>/pulse-report</code> after every new page or significant change. Regressions — contrast failures, missing labels, unreachable controls — are caught before they reach users.</p>
    `,
  }),
}
