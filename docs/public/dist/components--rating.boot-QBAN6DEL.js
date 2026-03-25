import{a,b as l}from"./runtime-ZJ4FXT5O.js";import{c,fb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as r,i as n}from"./runtime-L2HNXIHW.js";import{a as i,b as d}from"./runtime-B73WLANC.js";var{prev:m,next:u}=s("/components/rating"),o={route:"/components/rating",meta:{title:"Rating \u2014 Pulse Docs",description:"Star rating display and interactive input component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/rating",prev:m,next:u,name:"rating",description:"Star rating component with two modes. Without <code>name</code>: a read-only display that supports half-star values. With <code>name</code>: an interactive radio group that submits the selected value in FormData \u2014 no JavaScript required.",content:`

      <h2 class="doc-h2" id="display">Display (read-only)</h2>
      <p>Omit <code>name</code> to render a read-only display. Pass <code>value</code> as a number \u2014 halves are supported.</p>
      ${a('<div style="display:flex;flex-direction:column;gap:1rem;align-items:flex-start">'+e({value:5})+e({value:3.5})+e({value:2})+e({value:0})+"</div>",`rating({ value: 5   })   // 5 stars
rating({ value: 3.5 })   // 3\xBD stars
rating({ value: 2   })   // 2 stars
rating({ value: 0   })   // empty`)}

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      <p><code>'sm'</code> \xB7 <code>'md'</code> (default) \xB7 <code>'lg'</code></p>
      ${a('<div style="display:flex;flex-direction:column;gap:1rem;align-items:flex-start">'+e({value:4,size:"sm"})+e({value:4,size:"md"})+e({value:4,size:"lg"})+"</div>",`rating({ value: 4, size: 'sm' })
rating({ value: 4, size: 'md' })
rating({ value: 4, size: 'lg' })`)}

      <h2 class="doc-h2" id="interactive">Interactive</h2>
      <p>Add <code>name</code> to render radio inputs. Hovering a star previews the selection; clicking locks it. The selected value is submitted in FormData.</p>
      ${a(e({name:"score",label:"Your rating",value:3,size:"lg"}),"rating({ name: 'score', label: 'Your rating', value: state.score, size: 'lg' })")}

      <h2 class="doc-h2" id="in-card">In a card</h2>
      ${a('<div style="max-width:320px">'+c({title:"Noise-Cancelling Headphones",content:'<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">'+e({value:4.5})+'<span style="color:var(--ui-muted);font-size:.85rem">4.5 \xB7 1,284 reviews</span></div><p style="color:var(--ui-muted);margin:0;font-size:.9rem">Crystal-clear audio with 40-hour battery life and adaptive noise cancellation.</p>'})+"</div>",`card({
  title:   'Noise-Cancelling Headphones',
  content:
    '<div style="display:flex;align-items:center;gap:.75rem">' +
      rating({ value: 4.5 }) +
      '<span>4.5 \xB7 1,284 reviews</span>' +
    '</div>' +
    '<p>Crystal-clear audio...</p>',
})`)}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${a(e({name:"locked",value:4,disabled:!0}),"rating({ name: 'locked', value: 4, disabled: true })")}

      <h2 class="doc-h2" id="in-forms">In forms</h2>
      ${n("note","The interactive rating submits the selected star count as a number string under <code>name</code> in FormData. Read it with <code>Number(formData.get('score'))</code>. If nothing is selected, the field is absent from FormData.")}

      ${r(["Prop","Type","Default",""],[["<code>value</code>","number","0","Current rating. Supports 0.5 steps in display mode."],["<code>max</code>","number","5","Total number of stars"],["<code>name</code>","string","\u2014","Field name \u2014 enables interactive radio mode"],["<code>label</code>","string","\u2014","Accessible group label (interactive mode only)"],["<code>size</code>","<code>sm | md | lg</code>","<code>md</code>","1rem / 1.5rem / 2rem"],["<code>disabled</code>","boolean","false","Interactive mode only"],["<code>class</code>","string","\u2014",""]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",i(o,t,window.__PULSE_SERVER__||{},{ssr:!0}),d(t,i));var z=o;export{z as default};
