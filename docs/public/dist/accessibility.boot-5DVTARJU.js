import{a}from"./runtime-QFURDKA2.js";import{a as r,b as c,c as l,d,e,g as t,h as i,i as u}from"./runtime-L2HNXIHW.js";import{a as s,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:g}=r("/accessibility"),n={route:"/accessibility",meta:{title:"Accessibility \u2014 Pulse Docs",description:"Keyboard navigation, focus management, semantic HTML, and ARIA patterns in Pulse.",styles:["/docs.css"]},state:{},view:()=>c({currentHref:"/accessibility",prev:p,next:g,content:`
      ${l("Accessibility")}
      ${d("Pulse enforces a 100 Lighthouse Accessibility score as the baseline. The foundations \u2014 skip link, focus styles, and focus management on navigation \u2014 are provided by the framework on every page. There is nothing to configure and nothing to forget.")}

      ${e("built-in","What the framework provides")}
      ${i(["Feature","How"],[["Skip link","Injected on every page as the first focusable element. Targets <code>#main-content</code>. Visible only on focus."],["Focus styles","<code>:focus-visible</code> outline applied globally \u2014 purple, 3px, offset 2px. Suppressed for mouse users via <code>:focus:not(:focus-visible)</code>."],["Navigation focus","After client-side navigation, focus moves to <code>#main-content</code>, <code>&lt;main&gt;</code>, or <code>&lt;h1&gt;</code> \u2014 whichever is found first. Screen reader users hear the new page heading without a full reload."]])}
      ${u("note",'The skip link targets <code>#main-content</code>. Pages use <code>&lt;main id="main-content"&gt;</code> as the content wrapper so the link resolves correctly.')}

      ${e("structure","Page structure")}
      <p>Each page view is wrapped in <code>&lt;main id="main-content"&gt;</code> with a single <code>&lt;h1&gt;</code> that describes the current page. Landmark elements communicate structure to assistive technology:</p>
      ${t(a(`view: (state) => \`
  <main id="main-content">
    <h1>Page title</h1>
    <!-- page content -->
  </main>
\``,"js"))}
      ${i(["Element","Purpose"],[["<code>&lt;header&gt;</code>","Site header, logo, primary nav"],["<code>&lt;nav&gt;</code>","Navigation links \u2014 <code>aria-label</code> distinguishes multiple navs"],['<code>&lt;main id="main-content"&gt;</code>',"Primary page content \u2014 one per page"],["<code>&lt;aside&gt;</code>","Supplementary content (sidebars, related links)"],["<code>&lt;footer&gt;</code>","Site footer"]])}

      ${e("interactive","Interactive elements")}
      <p>Actions are expressed as <code>&lt;button&gt;</code> elements, navigation as <code>&lt;a href&gt;</code> links. Both are keyboard-accessible by default. <code>&lt;div&gt;</code> and <code>&lt;span&gt;</code> elements with click handlers are not reachable by keyboard:</p>
      ${t(a(`<!-- Keyboard accessible -->
<button data-event="toggle">Open menu</button>
<a href="/about">About</a>

<!-- Not keyboard accessible \u2014 avoid -->
<div data-event="toggle">Open menu</div>
<span onclick="...">About</span>`,"html"))}
      <p>Buttons that toggle state carry <code>aria-expanded</code> or <code>aria-pressed</code> to communicate the current state to screen readers:</p>
      ${t(a(`view: (state) => \`
  <button data-event="toggleMenu" aria-expanded="\${state.menuOpen}">
    Menu
  </button>
  \${state.menuOpen ? \`<nav>...</nav>\` : ''}
\``,"js"))}

      ${e("focus","Focus management")}
      <p>When a modal or dialog opens, focus moves inside it. When it closes, focus returns to the element that opened it. Since Pulse updates the DOM via morphing rather than a full replacement, the triggering element stays in the DOM and receives focus back naturally.</p>
      <p>The <code>autofocus</code> attribute on the first interactive element inside newly revealed content moves focus there after the DOM update \u2014 no JavaScript required:</p>
      ${t(a(`view: (state) => \`
  <button data-event="openDialog">Delete item</button>

  \${state.dialogOpen ? \`
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <h2 id="dialog-title">Confirm deletion</h2>
      <p>This cannot be undone.</p>
      <button autofocus data-event="confirmDelete">Delete</button>
      <button data-event="closeDialog">Cancel</button>
    </div>
  \` : ''}
\``,"js"))}

      ${e("live-regions","Dynamic content announcements")}
      <p>State changes that produce status messages \u2014 loading indicators, confirmations, validation errors \u2014 are wrapped in live regions so screen readers announce them without a page reload:</p>
      ${i(["Role","Politeness","Used for"],[['<code>role="status"</code>',"Polite \u2014 waits for the user to finish","Loading states, success messages, counts"],['<code>role="alert"</code>',"Assertive \u2014 interrupts immediately","Validation errors, destructive confirmations"]])}
      ${t(a(`view: (state) => \`
  <form data-action="submit">
    <!-- fields -->
    <button type="submit" \${state.status === 'loading' ? 'disabled' : ''}>
      \${state.status === 'loading' ? 'Saving\u2026' : 'Save'}
    </button>
  </form>

  \${state.status === 'loading' ? \`
    <p role="status">Saving\u2026</p>
  \` : ''}

  \${state.errors.length ? \`
    <div role="alert">
      \${state.errors.map(e => \`<p>\${e.message}</p>\`).join('')}
    </div>
  \` : ''}
\``,"js"))}

      ${e("forms","Forms")}
      <p>Form controls are paired with <code>&lt;label&gt;</code> elements. Error messages are linked to their input via <code>aria-describedby</code> so screen readers announce them when the field receives focus:</p>
      ${t(a(`<form data-action="submit">
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
</form>`,"html"))}

      ${e("images","Images")}
      <p>Decorative images carry <code>alt=""</code> so screen readers skip them. Informative images have descriptive alt text. Icon-only buttons are labelled with <code>aria-label</code>, with the icon marked <code>aria-hidden="true"</code>:</p>
      ${t(a(`<!-- Informative image -->
<img src="/team.jpg" alt="The Pulse team at the 2025 offsite" width="800" height="450">

<!-- Decorative image -->
<img src="/divider.svg" alt="" width="600" height="4">

<!-- Icon-only button -->
<button aria-label="Close">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>`,"html"))}

      ${e("lighthouse","Lighthouse score")}
      <p>Every page is expected to score 100 on Lighthouse Accessibility. Run <code>/pulse-report</code> after every new page or significant change. Regressions \u2014 contrast failures, missing labels, unreachable controls \u2014 are caught before they reach users.</p>
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",s(n,o,window.__PULSE_SERVER__||{},{ssr:!0}),m(o,s));var k=n;export{k as default};
