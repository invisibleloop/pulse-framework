import{a as c,b as i}from"./runtime-ZJ4FXT5O.js";import{Qa as m,a as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a,h as r}from"./runtime-L2HNXIHW.js";import{a as o,b as s}from"./runtime-B73WLANC.js";var{prev:l,next:d}=a("/components/stack"),n={route:"/components/stack",meta:{title:"Stack \u2014 Pulse Docs",description:"Stack component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/components/stack",prev:l,next:d,name:"stack",description:"Flex column with consistent vertical gap. Replaces the common pattern of adding <code>margin-bottom</code> to every child element.",content:`
      ${c(m({gap:"sm",content:e({label:"Primary action"})+e({label:"Secondary action",variant:"secondary"})+e({label:"Ghost action",variant:"ghost"})}),`stack({ gap: 'sm', align: 'start', content:
  button({ label: 'Primary action' }) +
  button({ label: 'Secondary action', variant: 'secondary' }) +
  button({ label: 'Ghost', variant: 'ghost' })
})`)}

      ${r(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML slot"],["<code>gap</code>","string","'md'","'xs' \xB7 'sm' \xB7 'md' \xB7 'lg' \xB7 'xl'"],["<code>align</code>","string","'stretch'","'stretch' \xB7 'start' \xB7 'center' \xB7 'end'"]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",o(n,t,window.__PULSE_SERVER__||{},{ssr:!0}),s(t,o));var k=n;export{k as default};
