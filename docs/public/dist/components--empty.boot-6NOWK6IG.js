import{a as s,b as i}from"./runtime-O3PCG43G.js";import{Ea as a}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as r}from"./runtime-OFZXJMSU.js";import{a as e,b as n}from"./runtime-B73WLANC.js";var{prev:p,next:l}=r("/components/empty"),o={route:"/components/empty",meta:{title:"Empty \u2014 Pulse Docs",description:"Empty state component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/components/empty",prev:p,next:l,name:"empty",description:"Empty state placeholder. Shows a centred title, optional description, and an optional call-to-action when there is nothing to display.",content:`
      ${s(a({title:"No results found",description:"Try adjusting your search or clearing the filters.",action:{label:"Clear filters",href:"#",variant:"secondary"}}),`empty({
  title:       'No results found',
  description: 'Try adjusting your search or clearing the filters.',
  action:      { label: 'Clear filters', href: '/products', variant: 'secondary' },
})`)}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",e(o,t,window.__PULSE_SERVER__||{},{ssr:!0}),n(t,e));var g=o;export{g as default};
