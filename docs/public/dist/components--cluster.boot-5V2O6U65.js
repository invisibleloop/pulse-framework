import{a as c,b as l}from"./runtime-O3PCG43G.js";import{Ra as i,b as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as n}from"./runtime-OFZXJMSU.js";import{a as o,b as a}from"./runtime-B73WLANC.js";var{prev:p,next:d}=s("/components/cluster"),r={route:"/components/cluster",meta:{title:"Cluster \u2014 Pulse Docs",description:"Cluster component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/cluster",prev:p,next:d,name:"cluster",description:"Flex row with wrapping. Groups inline elements horizontally \u2014 action buttons, badges, app store badges, stat rows.",content:`
      ${c(i({gap:"sm",content:e({label:"Performance"})+e({label:"Accessibility"})+e({label:"Zero JS",variant:"success"})+e({label:"SSR",variant:"info"})}),`cluster({ gap: 'sm', justify: 'center', content:
  badge({ label: 'Performance' }) +
  badge({ label: 'Zero JS', variant: 'success' }) +
  appBadge({ store: 'apple', href: url })
})`)}

      ${n(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML slot"],["<code>gap</code>","string","'md'","'xs' \xB7 'sm' \xB7 'md' \xB7 'lg'"],["<code>justify</code>","string","'start'","'start' \xB7 'center' \xB7 'end' \xB7 'between'"],["<code>align</code>","string","'center'","'start' \xB7 'center' \xB7 'end'"],["<code>wrap</code>","boolean","true","Set false to prevent wrapping"]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",o(r,t,window.__PULSE_SERVER__||{},{ssr:!0}),a(t,o));var P=r;export{P as default};
