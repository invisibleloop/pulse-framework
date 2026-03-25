import{a as t,b as m}from"./runtime-ZJ4FXT5O.js";import{Qa as c,nb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as i,i as n}from"./runtime-L2HNXIHW.js";import{a,b as d}from"./runtime-B73WLANC.js";var{prev:r,next:u}=s("/components/segmented"),l={route:"/components/segmented",meta:{title:"Segmented \u2014 Pulse Docs",description:"iOS-style segmented control component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>m({currentHref:"/components/segmented",prev:r,next:u,name:"segmented",description:"iOS-style segmented control built from hidden radio inputs. The selected segment is highlighted via CSS \u2014 no JavaScript required.",content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${t(e({name:"period",value:"week",options:[{value:"day",label:"Day"},{value:"week",label:"Week"},{value:"month",label:"Month"}]}),`segmented({
  name:  'period',
  value: state.period,
  options: [
    { value: 'day',   label: 'Day'   },
    { value: 'week',  label: 'Week'  },
    { value: 'month', label: 'Month' },
  ],
})`)}

      <h2 class="doc-h2" id="sizes">Sizes</h2>
      ${t(c({gap:"md",content:e({name:"size-sm",value:"b",size:"sm",options:[{value:"a",label:"Small"},{value:"b",label:"Sizes"},{value:"c",label:"Here"}]})+e({name:"size-md",value:"b",size:"md",options:[{value:"a",label:"Medium"},{value:"b",label:"Default"},{value:"c",label:"Size"}]})+e({name:"size-lg",value:"b",size:"lg",options:[{value:"a",label:"Large"},{value:"b",label:"Size"},{value:"c",label:"Here"}]})}),`segmented({ name: 'view', value: 'b', size: 'sm', options: [...] })
segmented({ name: 'view', value: 'b', size: 'md', options: [...] })
segmented({ name: 'view', value: 'b', size: 'lg', options: [...] })`)}

      <h2 class="doc-h2" id="ui-context">View toggle</h2>
      <p>A common use case \u2014 toggling between Grid and List views.</p>
      ${t(e({name:"layout",value:"grid",options:[{value:"grid",label:"Grid"},{value:"list",label:"List"}]}),`segmented({
  name:    'layout',
  value:   state.layout,
  options: [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
  ],
})`)}

      ${n("note","The segmented control submits the selected <code>value</code> string under <code>name</code> in FormData. Read it via <code>formData.get('period')</code> in <code>action.onStart</code> or <code>action.run</code>.")}

      ${i(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name \u2014 submitted in FormData"],["<code>options</code>","array","[]","Array of <code>{ value, label }</code>"],["<code>value</code>","string","\u2014","The currently selected value"],["<code>size</code>","<code>sm | md | lg</code>","<code>md</code>",""],["<code>disabled</code>","boolean","false","Disables all options"],["<code>class</code>","string","\u2014",""]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",a(l,o,window.__PULSE_SERVER__||{},{ssr:!0}),d(o,a));var w=l;export{w as default};
