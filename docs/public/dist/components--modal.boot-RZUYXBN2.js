import{a as i,b as g}from"./runtime-ZJ4FXT5O.js";import{Ra as l,Wa as o,Xa as t,a as r}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as c,h as a,i as d}from"./runtime-L2HNXIHW.js";import{a as n,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:u}=c("/components/modal"),s={route:"/components/modal",meta:{title:"Modal \u2014 Pulse Docs",description:"Modal dialog component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>g({currentHref:"/components/modal",prev:p,next:u,name:"modal / modalTrigger",description:"A <code>&lt;dialog&gt;</code>-based modal with backdrop, animated open/close, and keyboard dismiss. The Pulse runtime handles open and close natively \u2014 no extra script needed.",content:`
      ${i(l({justify:"center",content:t({target:"demo-modal",label:"Open modal"})+o({id:"demo-modal",title:"Confirm action",content:'<p style="color:var(--ui-muted);margin:0">Are you sure you want to delete this item? This action cannot be undone.</p>',footer:r({label:"Cancel",variant:"secondary",type:"submit"})+r({label:"Delete",variant:"danger"})})}),`// Render the dialog somewhere on the page
modal({
  id:      'confirm-delete',
  title:   'Confirm action',
  content: '<p>Are you sure? This cannot be undone.</p>',
  footer:
    button({ label: 'Cancel', variant: 'secondary' }) +
    button({ label: 'Delete', variant: 'danger' }),
})

// Open it with a trigger button (or any element with data-dialog-open)
modalTrigger({ target: 'confirm-delete', label: 'Delete item', variant: 'danger' })`)}

      <h3 class="doc-h3" id="sizes"><a href="#sizes" class="heading-anchor">Sizes</a></h3>
      ${i(l({gap:"sm",justify:"center",content:t({target:"demo-sm",label:"Small",variant:"secondary",size:"sm"})+t({target:"demo-lg",label:"Large",variant:"secondary",size:"sm"})+o({id:"demo-sm",title:"Small modal",size:"sm",content:'<p style="color:var(--ui-muted);margin:0">A compact dialog for quick confirmations.</p>'})+o({id:"demo-lg",title:"Large modal",size:"lg",content:'<p style="color:var(--ui-muted);margin:0">Use large modals for forms, rich content, or detail views that need more space.</p>'})}),"modal({ id: 'my-modal', title: 'Large modal', size: 'lg', content: '...' })")}

      ${a(["Prop","Type","Default",""],[["<code>id</code>","string","\u2014","Unique ID \u2014 required for triggers to target this dialog"],["<code>title</code>","string","\u2014",""],["<code>level</code>","number","2","Heading tag for the title (1\u20136). Visual style is unchanged."],["<code>content</code>","string (HTML)","\u2014","Body HTML"],["<code>footer</code>","string (HTML)","\u2014","Footer HTML \u2014 typically button() calls"],["<code>size</code>","<code>sm | md | lg | xl</code>","<code>md</code>",""],["<code>class</code>","string","\u2014",""]])}

      <h3 class="doc-h3" id="trigger-props"><a href="#trigger-props" class="heading-anchor">modalTrigger props</a></h3>

      ${a(["Prop","Type","Default",""],[["<code>target</code>","string","\u2014","The modal's <code>id</code>"],["<code>label</code>","string","<code>Open</code>",""],["<code>variant</code>","<code>primary | secondary | ghost | danger</code>","<code>primary</code>",""],["<code>size</code>","<code>sm | md | lg</code>","<code>md</code>",""],["<code>class</code>","string","\u2014",""]])}

      <h3 class="doc-h3" id="custom-trigger"><a href="#custom-trigger" class="heading-anchor">Custom triggers</a></h3>
      <p class="doc-body">Any element with <code>data-dialog-open="&lt;id&gt;"</code> opens the dialog when clicked. Use <code>data-dialog-close</code> on any element inside or outside the dialog to close it programmatically:</p>
      <pre class="code-block"><code>&lt;button data-dialog-open="my-modal"&gt;Open&lt;/button&gt;
&lt;button data-dialog-close&gt;Cancel&lt;/button&gt;</code></pre>
      ${d("tip",'The dialog also closes on ESC, backdrop click, and <code>&lt;form method="dialog"&gt;</code> submit \u2014 all native browser behaviour, no JavaScript needed.')}

      <h3 class="doc-h3" id="forms-inside"><a href="#forms-inside" class="heading-anchor">Forms inside a modal</a></h3>
      <p class="doc-body"><code>modal()</code> wraps all content in <code>&lt;form method="dialog"&gt;</code> for native close behaviour. You <strong>cannot nest a <code>&lt;form data-action="..."&gt;</code> inside it</strong> \u2014 browsers silently discard nested forms, so the action will never fire.</p>
      <p class="doc-body">When a modal button needs to trigger a Pulse action, place the form <em>outside</em> the modal and use the HTML <code>form</code> attribute to associate the button with it:</p>
      <pre class="code-block"><code>// The action form lives outside the modal \u2014 hidden, no visible fields needed
&lt;form id="delete-form" data-action="deleteAccount" style="display:none"&gt;&lt;/form&gt;

\${modal({
  id:      'confirm-delete',
  title:   'Delete account?',
  content: '&lt;p&gt;This cannot be undone.&lt;/p&gt;',
  footer:
    // type="submit" with no form= closes the modal natively (submits &lt;form method="dialog"&gt;)
    button({ label: 'Cancel',         variant: 'secondary', type: 'submit' }) +
    // form="delete-form" associates this button with the external form \u2192 fires the action
    button({ label: 'Confirm delete', variant: 'danger', attrs: { form: 'delete-form', type: 'submit' } }),
})}</code></pre>
      ${d("note","The hidden form needs no visible fields. <code>onStart</code> receives <code>state</code> and <code>formData</code> \u2014 read anything you need from state directly.")}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",n(s,e,window.__PULSE_SERVER__||{},{ssr:!0}),m(e,n));var C=s;export{C as default};
