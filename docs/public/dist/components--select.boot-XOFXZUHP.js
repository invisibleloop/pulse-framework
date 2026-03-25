import{a as n,b as a}from"./runtime-O3PCG43G.js";import{za as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as l}from"./runtime-OFZXJMSU.js";import{a as t,b as r}from"./runtime-B73WLANC.js";var{prev:i,next:c}=l("/components/select"),s={route:"/components/select",meta:{title:"Select \u2014 Pulse Docs",description:"Select component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>a({currentHref:"/components/select",prev:i,next:c,name:"select",description:"Options can be plain strings or <code>{ value, label }</code> objects. Pass <code>value</code> to mark the current selection.",content:`
      ${n(o({name:"role",label:"Role",options:["Admin","Editor","Viewer"],value:"Editor"})+o({name:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"}],error:"Please select a status"}),`select({ name: 'role', label: 'Role', options: ['Admin', 'Editor', 'Viewer'], value: state.role })
select({
  name:    'country',
  label:   'Country',
  options: [{ value: 'gb', label: 'United Kingdom' }, { value: 'us', label: 'United States' }],
  value:   state.country,
  required: true,
})`,{col:!0})}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(s,e,window.__PULSE_SERVER__||{},{ssr:!0}),r(e,t));var E=s;export{E as default};
