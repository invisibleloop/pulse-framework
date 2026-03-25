import{a as o,b as r}from"./runtime-O3PCG43G.js";import{cb as e,ya as i}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as d,i as l}from"./runtime-OFZXJMSU.js";import{a,b as n}from"./runtime-B73WLANC.js";var{prev:m,next:h}=s("/components/checkbox"),c={route:"/components/checkbox",meta:{title:"Checkbox \u2014 Pulse Docs",description:"Custom-styled checkbox component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>r({currentHref:"/components/checkbox",prev:m,next:h,name:"checkbox",description:'Custom-styled checkbox with animated check mark, full keyboard and screen-reader support. Pairs with <a href="/components/fieldset">fieldset</a> for labelled groups.',content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      <p>Pass <code>label</code> for the visible text. The <code>id</code> is auto-generated from <code>name</code> and <code>value</code>.</p>
      ${o(e({name:"agree",label:"I agree to the terms"}),"checkbox({ name: 'agree', label: 'I agree to the terms' })",{col:!0})}

      <h2 class="doc-h2" id="checked">Checked</h2>
      ${o(e({name:"newsletter",label:"Send me updates",checked:!0}),"checkbox({ name: 'newsletter', label: 'Send me updates', checked: state.newsletter })",{col:!0})}

      <h2 class="doc-h2" id="hint">Hint</h2>
      <p>A <code>hint</code> string renders below the label as supporting copy.</p>
      ${o(e({name:"marketing",label:"Marketing emails",hint:"Product news and tips. Unsubscribe any time.",checked:!0}),`checkbox({
  name:    'marketing',
  label:   'Marketing emails',
  hint:    'Product news and tips. Unsubscribe any time.',
  checked: state.marketing,
})`,{col:!0})}

      <h2 class="doc-h2" id="error">Error state</h2>
      <p>Pass <code>error</code> to show a validation message. The error is announced via <code>role="alert"</code>.</p>
      ${o(e({name:"terms",label:"I accept the terms and conditions",error:"You must accept the terms to continue."}),`checkbox({
  name:  'terms',
  label: 'I accept the terms and conditions',
  error: server.errors.terms,
})`,{col:!0})}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${o(e({name:"feature",label:"Enable beta features",disabled:!0})+" "+e({name:"feature2",label:"Beta feature (on)",disabled:!0,checked:!0}),"checkbox({ name: 'feature', label: 'Enable beta features', disabled: true })",{col:!0})}

      <h2 class="doc-h2" id="group">Group in a fieldset</h2>
      <p>Compose multiple checkboxes inside a <a href="/components/fieldset">fieldset</a> for a semantic group.</p>
      ${o(i({legend:"Notifications",content:e({name:"notif",value:"email",label:"Email",checked:!0})+e({name:"notif",value:"sms",label:"SMS"})+e({name:"notif",value:"browser",label:"Browser push",checked:!0})+e({name:"notif",value:"weekly",label:"Weekly digest",disabled:!0})}),`fieldset({
  legend:  'Notifications',
  content:
    checkbox({ name: 'notif', value: 'email',   label: 'Email',         checked: true }) +
    checkbox({ name: 'notif', value: 'sms',     label: 'SMS'                          }) +
    checkbox({ name: 'notif', value: 'browser', label: 'Browser push',  checked: true }) +
    checkbox({ name: 'notif', value: 'weekly',  label: 'Weekly digest', disabled: true }),
})`,{col:!0})}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${l("note",`Checkboxes submit their <code>value</code> string (defaulting to <code>"on"</code>) under <code>name</code> in FormData only when checked. Unchecked checkboxes are absent from FormData. Read them in <code>action.onStart</code> via <code>formData.get('agree')</code> \u2014 a <code>null</code> result means unchecked.`)}

      <h2 class="doc-h2" id="labelhtml">Custom label HTML</h2>
      <p>When the label needs inline styling \u2014 for example a strikethrough on a completed todo \u2014 use <code>labelHtml</code> instead of <code>label</code>. The value is inserted as raw HTML so you are responsible for escaping any user content.</p>
      ${o(e({name:"task",labelHtml:'<span style="text-decoration:line-through;opacity:.5">Buy milk</span>',checked:!0}),`checkbox({
  name:      'task',
  checked:   todo.done,
  labelHtml: \`<span class="\${todo.done ? 'u-text-muted' : ''}">\${esc(todo.text)}</span>\`,
})`,{col:!0})}

      <h2 class="doc-h2" id="props">Props</h2>
      ${d(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name"],["<code>value</code>","string","\u2014",'Submitted value when checked (defaults to browser default <code>"on"</code>)'],["<code>label</code>","string","\u2014","Visible label text \u2014 escaped"],["<code>labelHtml</code>","string","\u2014","Raw HTML label slot \u2014 not escaped, use for styled spans"],["<code>checked</code>","boolean","false",""],["<code>disabled</code>","boolean","false",""],["<code>id</code>","string","\u2014","Override the auto-generated <code>id</code>"],["<code>event</code>","string","\u2014",'<code>data-event</code> binding, e.g. <code>"change:toggle"</code>'],["<code>hint</code>","string","\u2014","Helper text below the label"],["<code>error</code>","string","\u2014",'Validation error \u2014 announced via <code>role="alert"</code>'],["<code>class</code>","string","\u2014",""]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",a(c,t,window.__PULSE_SERVER__||{},{ssr:!0}),n(t,a));var w=c;export{w as default};
