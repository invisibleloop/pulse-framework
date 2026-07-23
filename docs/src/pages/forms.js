import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/forms')

export default {
  route: '/forms',
  meta: {
    theme:       'light',
    title: 'Forms — Pulse Docs',
    description: 'Server-side form handling in Pulse. spec.submit processes POST requests without client JavaScript, with automatic CSRF protection and POST-redirect-GET.',
    styles: ['/theme.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/forms',
    prev,
    next,
    content: `
      ${h1('Forms')}
      ${lead('A spec with a <code>submit</code> handler accepts POST requests on its own route — the form works with JavaScript disabled. CSRF protection is automatic, and successful submissions follow POST-redirect-GET. Client-side <code>actions</code> become an enhancement, not a requirement.')}

      ${section('basics', 'Basic usage')}
      <p>Add a <code>submit</code> function to the spec and render a plain <code>&lt;form method="POST"&gt;</code>. The route accepts POST automatically — no <code>methods</code> declaration needed.</p>
      ${codeBlock(highlight(`export default {
  route: '/contact',

  submit: async (ctx) => {
    const data = await ctx.formData()
    if (!data?.email) return { errors: { email: 'Email is required' }, values: data ?? {} }
    await sendMessage(data)
    return { redirect: '/contact?sent=1' }   // 303 POST-redirect-GET
  },

  view: (state, server) => \`
    <main id="main-content">
      \${server.form?.errors?.email ? \`<p class="error">\${escHtml(server.form.errors.email)}</p>\` : ''}
      <form method="POST">
        \${server.csrf}
        \${input({ label: 'Email', name: 'email', type: 'email', required: true,
                   value: server.form?.values?.email ?? '' })}
        \${button({ label: 'Send', type: 'submit' })}
      </form>
    </main>
  \`,
}`, 'js'))}
      <p>The flow: the browser POSTs the form, <code>submit(ctx)</code> runs server-side, and either redirects (success) or re-renders the page with the returned value available to the view as <code>server.form</code> (validation failure).</p>

      ${callout('warning', '<strong><code>\${server.csrf}</code> must be inside every POST form.</strong> It renders the hidden CSRF token input — submissions without a valid token are rejected with <strong>403</strong> before <code>submit</code> runs.')}

      ${section('return-values', 'Return values')}
      ${table(
        ['Return', 'Response', 'Use for'],
        [
          ['<code>{ redirect: \'/path\' }</code>', '<strong>303 See Other</strong>', 'Successful submissions — POST-redirect-GET means refresh never resubmits'],
          ['<code>{ errors, values, … }</code>',  'Page re-renders (200), value exposed as <code>server.form</code>', 'Validation failures — show errors, echo values back into inputs'],
          ['<code>{ status: 422, errors, … }</code>', 'Same re-render with status <strong>422</strong>', 'Validation failures where the status code matters (API clients, tests)'],
          ['<code>undefined</code>', 'Page re-renders (200), <code>server.form</code> is <code>{}</code>', 'Fire-and-forget side effects'],
        ]
      )}
      <p><strong>Always redirect after a successful mutation.</strong> Rendering a success message directly from the POST means a browser refresh resubmits the form. Redirect to a URL that shows the confirmation instead (e.g. <code>/contact?sent=1</code>).</p>

      ${section('server-form', 'server.form — errors and echoed values')}
      <p>On a re-render, whatever <code>submit</code> returned is available to the view as <code>server.form</code>. On a plain GET it is <code>undefined</code> — always use optional chaining.</p>
      ${codeBlock(highlight(`// In submit — return errors AND the submitted values:
return { errors: { email: 'Invalid email' }, values: data }

// In the view — show the error, echo the value back so the form isn't wiped:
\${server.form?.errors?.email ? \`<p class="error">\${escHtml(server.form.errors.email)}</p>\` : ''}
\${input({ name: 'email', label: 'Email', value: server.form?.values?.email ?? '' })}`, 'js'))}
      ${callout('warning', 'Escape user-submitted values before interpolating them into HTML — <code>server.form.values</code> is raw user input. Component props like <code>input({ value })</code> are auto-escaped; manual interpolation needs <code>escHtml()</code>.')}

      ${section('csrf', 'CSRF protection')}
      <p>Every <code>submit</code> spec gets CSRF protection automatically — there is nothing to configure. Under the hood Pulse uses an HMAC double-submit pattern:</p>
      ${table(
        ['Piece', 'Where it lives', 'What it does'],
        [
          ['Random id', '<code>pulse_csrf</code> cookie (HttpOnly, SameSite=Lax)', 'Set on the first GET of the form page'],
          ['Token', 'Hidden <code>_csrf</code> input via <code>\${server.csrf}</code>', '<code>HMAC-SHA256(secret, id)</code> — embedded into the form server-side'],
          ['Verification', 'On every POST, before <code>submit</code> runs', 'Recomputes the HMAC from the cookie and compares in constant time — mismatch is 403'],
        ]
      )}
      <p>An attacker on another origin can cause the cookie to be sent, but cannot read it or compute the HMAC — so they cannot forge the pair.</p>

      ${sub('multi-instance', 'Multiple server instances')}
      <p>The HMAC secret defaults to a random value per server boot. Behind a load balancer, pin it so tokens issued by one instance validate on another:</p>
      ${codeBlock(highlight(`await createServer(pages, {
  secret: process.env.PULSE_SECRET,   // stable across instances and restarts
})`, 'js'))}

      ${sub('opt-out', 'Opting out')}
      <p>Set <code>csrf: false</code> on the spec to disable protection — only for endpoints with their own authentication, such as signed webhooks:</p>
      ${codeBlock(highlight(`export default {
  route: '/webhooks/stripe',
  csrf: false,                       // Stripe signs its requests — verify the signature instead
  submit: async (ctx) => {
    verifyStripeSignature(ctx.headers['stripe-signature'], await ctx.text())
    // ...
  },
  view: () => '<main id="main-content">ok</main>',
}`, 'js'))}
      ${callout('warning', 'Never set <code>csrf: false</code> to "fix" a 403. The 403 means the form is missing <code>\${server.csrf}</code> — add the field, don\'t remove the protection.')}

      ${section('progressive-enhancement', 'Progressive enhancement')}
      <p>The same form can serve both worlds: <code>method="POST"</code> is the no-JS fallback, <code>data-action</code> is the hydrated path. With JavaScript enabled the runtime intercepts the submit and runs the async action (no page reload); without it the browser POSTs to <code>submit</code>.</p>
      ${codeBlock(highlight(`<form method="POST" data-action="send">
  \${server.csrf}
  \${input({ label: 'Email', name: 'email', type: 'email', required: true })}
  \${button({ label: 'Send', type: 'submit' })}
</form>`, 'html'))}
      <p>Keep the two paths consistent: <code>submit</code> and the action's <code>run</code> should call the same underlying function so validation and side effects cannot drift apart.</p>

      ${section('caching', 'Interaction with caching')}
      <p>Pages with <code>submit</code> are automatically excluded from the in-process page cache — the CSRF token is per-visitor, and a cached page would serve one visitor's token to everyone. POST responses are never cached.</p>

      ${section('reference', 'Reference')}
      ${table(
        ['Property', 'Type', 'Notes'],
        [
          ['<code>submit</code>', '<code>async (ctx) =&gt; { redirect } | object | void</code>', 'Handles POST on the route. Guard runs first.'],
          ['<code>csrf</code>', '<code>boolean</code>', 'Default <code>true</code>. Set <code>false</code> only for self-authenticated endpoints.'],
          ['<code>server.csrf</code>', 'string (view)', 'Hidden <code>_csrf</code> input — required inside every POST form.'],
          ['<code>server.form</code>', 'object | undefined (view)', 'Return value of <code>submit</code> on a re-render; <code>undefined</code> on GET.'],
          ['<code>secret</code>', 'string (createServer option)', 'Stable HMAC secret for multi-instance deployments.'],
        ]
      )}
    `,
  }),
}
