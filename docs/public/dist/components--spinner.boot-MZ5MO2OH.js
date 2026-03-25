import{a as n,b as l}from"./runtime-ZJ4FXT5O.js";import{Ra as i,a as s,gb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as c,h as d}from"./runtime-L2HNXIHW.js";import{a as t,b as a}from"./runtime-B73WLANC.js";var{prev:p,next:m}=c("/components/spinner"),r={route:"/components/spinner",meta:{title:"Spinner \u2014 Pulse Docs",description:"Loading spinner component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/spinner",prev:p,next:m,name:"spinner",description:"CSS-animated loading ring. No JavaScript required. Use to indicate background activity \u2014 inside buttons, next to labels, or as a full-area overlay.",content:`

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${n(i({gap:"lg",align:"center",content:e({size:"sm"})+e({size:"md"})+e({size:"lg"})}),`spinner({ size: 'sm' })
spinner({ size: 'md' })
spinner({ size: 'lg' })`)}

      <h2 class="doc-h2" id="colors">Colours</h2>
      ${n(i({gap:"lg",align:"center",content:e({color:"accent"})+e({color:"muted"})+'<span style="background:var(--ui-accent);padding:.75rem;border-radius:var(--ui-radius);display:inline-flex">'+e({color:"white"})+"</span>"}),`spinner({ color: 'accent' })
spinner({ color: 'muted'  })
spinner({ color: 'white'  })`)}

      <h2 class="doc-h2" id="in-button">Inside a button</h2>
      <p>Pair with a <code>button()</code> to show loading state. Pass the spinner as the button's <code>icon</code> prop.</p>
      ${n(s({label:"Saving",icon:e({size:"sm",color:"white"}),disabled:!0})+" "+s({label:"Loading",icon:e({size:"sm"}),variant:"secondary",disabled:!0}),`button({
  label:    'Saving',
  icon:     spinner({ size: 'sm', color: 'white' }),
  disabled: state.loading,
})`)}

      ${d(["Prop","Type","Default",""],[["<code>size</code>","<code>sm | md | lg</code>","<code>md</code>","1rem / 1.5rem / 2.5rem"],["<code>color</code>","<code>accent | muted | white</code>","<code>accent</code>",""],["<code>label</code>","string","<code>Loading\u2026</code>",'Sets <code>aria-label</code> on the <code>role="status"</code> element'],["<code>class</code>","string","\u2014",""]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",t(r,o,window.__PULSE_SERVER__||{},{ssr:!0}),a(o,t));var S=r;export{S as default};
