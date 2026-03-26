import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { modal, modalTrigger, button, cluster } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/modal')

export default {
  route: '/components/modal',
  meta: {
    title: 'Modal — Pulse Docs',
    description: 'Modal dialog component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/modal',
    prev,
    next,
    name: 'modal / modalTrigger',
    description: 'A <code>&lt;dialog&gt;</code>-based modal with backdrop, animated open/close, and keyboard dismiss. The Pulse runtime handles open and close natively — no extra script needed.',
    content: `
      ${demo(
        cluster({ justify: 'center', content:
          modalTrigger({ target: 'demo-modal', label: 'Open modal' }) +
          modal({
            id:      'demo-modal',
            title:   'Confirm action',
            content: '<p style="color:var(--ui-muted);margin:0">Are you sure you want to delete this item? This action cannot be undone.</p>',
            footer:
              button({ label: 'Cancel', variant: 'secondary', type: 'submit' }) +
              button({ label: 'Delete', variant: 'danger' }),
          }),
        }),
        `// Render the dialog somewhere on the page
modal({
  id:      'confirm-delete',
  title:   'Confirm action',
  content: '<p>Are you sure? This cannot be undone.</p>',
  footer:
    button({ label: 'Cancel', variant: 'secondary' }) +
    button({ label: 'Delete', variant: 'danger' }),
})

// Open it with a trigger button (or any element with data-dialog-open)
modalTrigger({ target: 'confirm-delete', label: 'Delete item', variant: 'danger' })`
      )}

      <h2 class="doc-h2" id="sizes"><a href="#sizes" class="heading-anchor">Sizes</a></h2>
      ${demo(
        cluster({ gap: 'sm', justify: 'center', content:
          modalTrigger({ target: 'demo-sm', label: 'Small',  variant: 'secondary', size: 'sm' }) +
          modalTrigger({ target: 'demo-lg', label: 'Large',  variant: 'secondary', size: 'sm' }) +
          modal({ id: 'demo-sm', title: 'Small modal',  size: 'sm',  content: '<p style="color:var(--ui-muted);margin:0">A compact dialog for quick confirmations.</p>' }) +
          modal({ id: 'demo-lg', title: 'Large modal',  size: 'lg',  content: '<p style="color:var(--ui-muted);margin:0">Use large modals for forms, rich content, or detail views that need more space.</p>' }),
        }),
        `modal({ id: 'my-modal', title: 'Large modal', size: 'lg', content: '...' })`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>id</code>',      'string',                        '—',              'Unique ID — required for triggers to target this dialog'],
          ['<code>title</code>',   'string',                        '—',              ''],
          ['<code>level</code>',   'number',                        '2',              'Heading tag for the title (1–6). Visual style is unchanged.'],
          ['<code>content</code>', 'string (HTML)',                  '—',              'Body HTML'],
          ['<code>footer</code>',  'string (HTML)',                  '—',              'Footer HTML — typically button() calls'],
          ['<code>size</code>',    '<code>sm | md | lg | xl</code>', '<code>md</code>', ''],
          ['<code>class</code>',   'string',                        '—',              ''],
        ]
      )}

      <h2 class="doc-h2" id="trigger-props"><a href="#trigger-props" class="heading-anchor">modalTrigger props</a></h2>

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>target</code>',  'string',                                          '—',                 "The modal's <code>id</code>"],
          ['<code>label</code>',   'string',                                          '<code>Open</code>', ''],
          ['<code>variant</code>', '<code>primary | secondary | ghost | danger</code>', '<code>primary</code>', ''],
          ['<code>size</code>',    '<code>sm | md | lg</code>',                        '<code>md</code>',   ''],
          ['<code>class</code>',   'string',                                          '—',                 ''],
        ]
      )}

      <h2 class="doc-h2" id="custom-trigger"><a href="#custom-trigger" class="heading-anchor">Custom triggers</a></h2>
      <p class="doc-body">Any element with <code>data-dialog-open="&lt;id&gt;"</code> opens the dialog when clicked. Use <code>data-dialog-close</code> on any element inside or outside the dialog to close it programmatically:</p>
      <pre class="code-block"><code>&lt;button data-dialog-open="my-modal"&gt;Open&lt;/button&gt;
&lt;button data-dialog-close&gt;Cancel&lt;/button&gt;</code></pre>
      ${callout('tip', 'The dialog also closes on ESC, backdrop click, and <code>&lt;form method="dialog"&gt;</code> submit — all native browser behaviour, no JavaScript needed.')}

      <h2 class="doc-h2" id="forms-inside"><a href="#forms-inside" class="heading-anchor">Forms inside a modal</a></h2>
      <p class="doc-body"><code>modal()</code> wraps all content in <code>&lt;form method="dialog"&gt;</code> for native close behaviour. You <strong>cannot nest a <code>&lt;form data-action="..."&gt;</code> inside it</strong> — browsers silently discard nested forms, so the action will never fire.</p>
      <p class="doc-body">When a modal button needs to trigger a Pulse action, place the form <em>outside</em> the modal and use the HTML <code>form</code> attribute to associate the button with it:</p>
      <pre class="code-block"><code>// The action form lives outside the modal — hidden, no visible fields needed
&lt;form id="delete-form" data-action="deleteAccount" style="display:none"&gt;&lt;/form&gt;

\${modal({
  id:      'confirm-delete',
  title:   'Delete account?',
  content: '&lt;p&gt;This cannot be undone.&lt;/p&gt;',
  footer:
    // type="submit" with no form= closes the modal natively (submits &lt;form method="dialog"&gt;)
    button({ label: 'Cancel',         variant: 'secondary', type: 'submit' }) +
    // form="delete-form" associates this button with the external form → fires the action
    button({ label: 'Confirm delete', variant: 'danger', attrs: { form: 'delete-form', type: 'submit' } }),
})}</code></pre>
      ${callout('note', 'The hidden form needs no visible fields. <code>onStart</code> receives <code>state</code> and <code>formData</code> — read anything you need from state directly.')}
    `,
  }),
}
