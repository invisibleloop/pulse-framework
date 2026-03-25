import{a as s,b as i}from"./runtime-O3PCG43G.js";import{b as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n}from"./runtime-OFZXJMSU.js";import{a as t,b as o}from"./runtime-B73WLANC.js";var{prev:l,next:d}=n("/components/badge"),r={route:"/components/badge",meta:{title:"Badge \u2014 Pulse Docs",description:"Badge component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/components/badge",prev:l,next:d,name:"badge",description:"Inline status and label indicator. Five semantic variants cover the most common states.",content:`
      ${s(e({label:"Default",variant:"default"})+" "+e({label:"Info",variant:"info"})+" "+e({label:"Success",variant:"success"})+" "+e({label:"Warning",variant:"warning"})+" "+e({label:"Error",variant:"error"}),`badge({ label: 'Default', variant: 'default' })
badge({ label: 'Info',    variant: 'info'    })
badge({ label: 'Success', variant: 'success' })
badge({ label: 'Warning', variant: 'warning' })
badge({ label: 'Error',   variant: 'error'   })`)}
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",t(r,a,window.__PULSE_SERVER__||{},{ssr:!0}),o(a,t));var v=r;export{v as default};
