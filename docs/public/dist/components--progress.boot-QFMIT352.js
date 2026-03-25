import{a as o,b as d}from"./runtime-O3PCG43G.js";import{Qa as a,hb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as l,h as n}from"./runtime-OFZXJMSU.js";import{a as t,b as c}from"./runtime-B73WLANC.js";var{prev:u,next:i}=l("/components/progress"),s={route:"/components/progress",meta:{title:"Progress \u2014 Pulse Docs",description:"Progress bar component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/progress",prev:u,next:i,name:"progress",description:'Horizontal progress bar with determinate and indeterminate states. Correct <code>role="progressbar"</code> and ARIA attributes are set automatically.',content:`

      <h2 class="doc-h2" id="default">Default</h2>
      ${o(a({gap:"md",content:e({value:25})+e({value:50})+e({value:75})+e({value:100})}),`progress({ value: 25  })
progress({ value: 50  })
progress({ value: 75  })
progress({ value: 100 })`,{col:!0})}

      <h2 class="doc-h2" id="label">With label and value</h2>
      <p>Set <code>showLabel</code> and <code>showValue</code> to render text above the bar.</p>
      ${o(a({gap:"lg",content:e({value:68,label:"Storage used",showLabel:!0,showValue:!0})+e({value:32,label:"Upload complete",showLabel:!0,showValue:!0})}),`progress({ value: 68, label: 'Storage used',    showLabel: true, showValue: true })
progress({ value: 32, label: 'Upload complete', showLabel: true, showValue: true })`,{col:!0})}

      <h2 class="doc-h2" id="variants">Variants</h2>
      ${o(a({gap:"md",content:e({value:80,variant:"accent"})+e({value:80,variant:"success"})+e({value:80,variant:"warning"})+e({value:80,variant:"error"})}),`progress({ value: 80, variant: 'accent'  })
progress({ value: 80, variant: 'success' })
progress({ value: 80, variant: 'warning' })
progress({ value: 80, variant: 'error'   })`,{col:!0})}

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${o(a({gap:"md",content:e({value:60,size:"sm"})+e({value:60,size:"md"})+e({value:60,size:"lg"})}),`progress({ value: 60, size: 'sm' })
progress({ value: 60, size: 'md' })
progress({ value: 60, size: 'lg' })`,{col:!0})}

      <h2 class="doc-h2" id="indeterminate">Indeterminate</h2>
      <p>Omit <code>value</code> when the total duration is unknown \u2014 the bar animates continuously.</p>
      ${o(e({label:"Loading\u2026"}),"progress({ label: 'Loading\u2026' })   // no value = indeterminate",{col:!0})}

      ${n(["Prop","Type","Default",""],[["<code>value</code>","number","\u2014","Current value. Omit for indeterminate."],["<code>max</code>","number","100",""],["<code>label</code>","string","\u2014","Sets <code>aria-label</code> and the visible label when <code>showLabel</code> is true"],["<code>showLabel</code>","boolean","false","Render label text above the bar"],["<code>showValue</code>","boolean","false","Render percentage above the bar (right-aligned)"],["<code>variant</code>","<code>accent | success | warning | error</code>","<code>accent</code>",""],["<code>size</code>","<code>sm | md | lg</code>","<code>md</code>",".25rem / .5rem / 1rem"],["<code>class</code>","string","\u2014",""]])}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",t(s,r,window.__PULSE_SERVER__||{},{ssr:!0}),c(r,t));var z=s;export{z as default};
