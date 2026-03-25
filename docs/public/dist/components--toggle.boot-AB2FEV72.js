import{a as o,b as r}from"./runtime-O3PCG43G.js";import{Qa as a,bb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n,h as s,i as c}from"./runtime-OFZXJMSU.js";import{a as i,b as l}from"./runtime-B73WLANC.js";var{prev:m,next:u}=n("/components/toggle"),d={route:"/components/toggle",meta:{title:"Toggle \u2014 Pulse Docs",description:"iOS-style switch toggle component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>r({currentHref:"/components/toggle",prev:m,next:u,name:"toggle",description:'iOS-style switch that renders a visually hidden <code>&lt;input type="checkbox"&gt;</code> with a custom track and thumb. No JavaScript required \u2014 state is read from FormData on submission.',content:`

      <h2 class="doc-h2" id="default">Default</h2>
      ${o(a({gap:"md",content:e({name:"notifications",label:"Email notifications"})+e({name:"updates",label:"Product updates",checked:!0})}),`toggle({ name: 'notifications', label: 'Email notifications' })
toggle({ name: 'updates',       label: 'Product updates', checked: true })`,{col:!0})}

      <h2 class="doc-h2" id="hint">With hint</h2>
      <p>Use <code>hint</code> to add supporting text below the switch.</p>
      ${o(a({gap:"lg",content:e({name:"marketing",label:"Marketing emails",hint:"Receive tips, product news, and special offers."})+e({name:"digest",label:"Weekly digest",hint:"A summary of activity sent every Monday morning.",checked:!0})}),`toggle({
  name:    'marketing',
  label:   'Marketing emails',
  hint:    'Receive tips, product news, and special offers.',
})
toggle({
  name:    'digest',
  label:   'Weekly digest',
  hint:    'A summary of activity sent every Monday morning.',
  checked: true,
})`,{col:!0})}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${o(a({gap:"md",content:e({name:"a",label:"Off and disabled",disabled:!0})+e({name:"b",label:"On and disabled",disabled:!0,checked:!0})}),`toggle({ name: 'a', label: 'Off and disabled', disabled: true })
toggle({ name: 'b', label: 'On and disabled',  disabled: true, checked: true })`,{col:!0})}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${c("note","The switch submits as <code>'on'</code> under its <code>name</code> when checked. When unchecked, the field is absent from FormData entirely \u2014 the same behaviour as a native checkbox. Read it with <code>formData.get('name') === 'on'</code>.")}

      ${s(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name \u2014 submitted in FormData"],["<code>label</code>","string","\u2014","Visible label text"],["<code>checked</code>","boolean","false","Initial on/off state"],["<code>disabled</code>","boolean","false",""],["<code>hint</code>","string","\u2014","Helper text below the switch"],["<code>id</code>","string","\u2014","Override the generated <code>id</code>"],["<code>class</code>","string","\u2014",""]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",i(d,t,window.__PULSE_SERVER__||{},{ssr:!0}),l(t,i));var w=d;export{w as default};
