import{a as t,b as i}from"./runtime-O3PCG43G.js";import{qb as s}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as c,h as n}from"./runtime-OFZXJMSU.js";import{a as r,b as a}from"./runtime-B73WLANC.js";var{prev:l,next:m}=c("/components/stepper"),o=["Account","Details","Payment","Review"],p={route:"/components/stepper",meta:{title:"Stepper \u2014 Pulse Docs",description:"Horizontal step progress indicator component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/components/stepper",prev:l,next:m,name:"stepper",description:"Horizontal step progress indicator. Completed steps show a check icon; the active step has an accent border; upcoming steps are muted. A connector line between steps fills with accent colour as progress advances.",content:`

      <h2 class="doc-h2" id="step1">Step 1 active</h2>
      ${t(s({steps:o,current:0}),`stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: 0,
})`,{col:!0})}

      <h2 class="doc-h2" id="step2">Step 2 active</h2>
      ${t(s({steps:o,current:1}),`stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: 1,
})`,{col:!0})}

      <h2 class="doc-h2" id="complete">All complete</h2>
      ${t(s({steps:o,current:o.length}),`stepper({
  steps:   ['Account', 'Details', 'Payment', 'Review'],
  current: steps.length,   // past the last index = all complete
})`,{col:!0})}

      ${n(["Prop","Type","Default",""],[["<code>steps</code>","string[]","[]","Array of step label strings"],["<code>current</code>","number","0","0-based index of the active step. Pass <code>steps.length</code> to mark all steps complete."],["<code>class</code>","string","\u2014",""]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",r(p,e,window.__PULSE_SERVER__||{},{ssr:!0}),a(e,r));var y=p;export{y as default};
