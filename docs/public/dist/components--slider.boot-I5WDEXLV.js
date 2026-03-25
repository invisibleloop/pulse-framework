import{a as e,b as u}from"./runtime-O3PCG43G.js";import{mb as t}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as r,h as l,i as s}from"./runtime-OFZXJMSU.js";import{a as i,b as d}from"./runtime-B73WLANC.js";var{prev:m,next:h}=r("/components/slider"),n={route:"/components/slider",meta:{title:"Slider \u2014 Pulse Docs",description:"Styled range input slider component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{brightness:100},mutations:{setBrightness:(o,c)=>({brightness:Number(c.target.value)})},view:o=>u({currentHref:"/components/slider",prev:m,next:h,name:"slider",description:"Styled range input with label, hint, and a CSS-driven fill gradient that tracks the thumb live as you drag.",content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${e(t({name:"volume",label:"Volume",showValue:!0}),"slider({ name: 'volume', label: 'Volume', showValue: true })",{col:!0})}

      <h2 class="doc-h2" id="min-max-step">Min, max, step, and hint</h2>
      ${e(t({name:"brightness",label:"Brightness",min:0,max:200,step:10,value:100,showValue:!0,hint:"Adjust display brightness (0\u2013200)"}),`slider({
  name:      'brightness',
  label:     'Brightness',
  min:       0,
  max:       200,
  step:      10,
  value:     100,
  showValue: true,
  hint:      'Adjust display brightness (0\u2013200)',
})`,{col:!0})}

      <h2 class="doc-h2" id="live-value">Live value in state</h2>
      <p class="u-mb-4 u-text-sm u-color-muted">Use <code>data-event="change:mutationName"</code> to capture the value when the user releases the handle. The fill gradient always updates live \u2014 no mutation needed for that.</p>
      ${e(`<div>
          ${t({name:"brightness",label:"Brightness",value:o.brightness,min:0,max:200,step:10,showValue:!0,event:"change:setBrightness"})}
        </div>`,`// state
{ brightness: 100 }

// mutation
setBrightness: (state, e) => ({ brightness: Number(e.target.value) })

// view
slider({
  name:      'brightness',
  label:     'Brightness',
  min:       0,
  max:       200,
  step:      10,
  value:     state.brightness,
  showValue: true,
  event:     'change:setBrightness',
})`,{col:!0})}

      <h2 class="doc-h2" id="disabled">Disabled</h2>
      ${e(t({name:"opacity",label:"Opacity",value:30,disabled:!0}),"slider({ name: 'opacity', label: 'Opacity', value: 30, disabled: true })",{col:!0})}

      ${s("note",'The fill gradient updates live during drag automatically. To read the final value, either use <code>data-event="change:mutationName"</code> on the slider or submit it as part of a form \u2014 the value is available in FormData as a number string under <code>name</code>.')}
      ${s("warning",'Do not use <code>data-event="input:mutationName"</code> on a slider. Pulse replaces <code>innerHTML</code> on every mutation, which interrupts the drag mid-gesture. Use <code>change</code> instead \u2014 it fires once when the user releases the handle.')}

      ${l(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name \u2014 submitted in FormData"],["<code>label</code>","string","\u2014","Visible label text"],["<code>min</code>","number","0","Minimum value"],["<code>max</code>","number","100","Maximum value"],["<code>step</code>","number","1","Step increment"],["<code>value</code>","number","50","Current value"],["<code>showValue</code>","boolean","false","Show current value live beside the label as you drag"],["<code>disabled</code>","boolean","false",""],["<code>hint</code>","string","\u2014","Helper text below the slider"],["<code>event</code>","string","\u2014","<code>data-event</code> binding, e.g. <code>change:mutationName</code>"],["<code>id</code>","string","\u2014","Override the generated <code>id</code>"],["<code>class</code>","string","\u2014",""]])}
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",i(n,a,window.__PULSE_SERVER__||{},{ssr:!0}),d(a,i));var V=n;export{V as default};
