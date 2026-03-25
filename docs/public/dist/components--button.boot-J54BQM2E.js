import{a as t,b as s}from"./runtime-ZJ4FXT5O.js";import{E as b,H as u,a as e,f as d,x as c}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as i,h as r}from"./runtime-L2HNXIHW.js";import{a as n,b as l}from"./runtime-B73WLANC.js";var{prev:m,next:p}=i("/components/button"),a={route:"/components/button",meta:{title:"Button \u2014 Pulse Docs",description:"Button component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>s({currentHref:"/components/button",prev:m,next:p,name:"button",description:"Renders as <code>&lt;button&gt;</code> by default. Pass <code>href</code> to get an <code>&lt;a&gt;</code> that looks identical. All four variants are shown below.",content:`
      ${t(e({label:"Primary",variant:"primary"})+e({label:"Secondary",variant:"secondary"})+e({label:"Ghost",variant:"ghost"})+e({label:"Danger",variant:"danger"}),`button({ label: 'Primary',   variant: 'primary'   })
button({ label: 'Secondary', variant: 'secondary' })
button({ label: 'Ghost',     variant: 'ghost'     })
button({ label: 'Danger',    variant: 'danger'    })`)}

      ${t(e({label:"Small",size:"sm"})+e({label:"Medium",size:"md"})+e({label:"Large",size:"lg"}),`button({ label: 'Small',  size: 'sm' })
button({ label: 'Medium', size: 'md' })
button({ label: 'Large',  size: 'lg' })`)}

      ${t(e({label:"Download",icon:b({size:14})})+e({label:"New item",icon:c({size:14}),variant:"secondary"})+e({label:"Continue",iconAfter:d({size:14})})+e({label:"Send",iconAfter:u({size:14}),variant:"ghost"}),`import { iconDownload, iconPlus, iconArrowRight, iconSend } from '@invisibleloop/pulse/ui'

button({ label: 'Download', icon: iconDownload({ size: 14 }) })
button({ label: 'New item', icon: iconPlus({ size: 14 }),           variant: 'secondary' })
button({ label: 'Continue', iconAfter: iconArrowRight({ size: 14 }) })
button({ label: 'Send',     iconAfter: iconSend({ size: 14 }),      variant: 'ghost' })`)}

      ${t(e({label:"Disabled",disabled:!0})+e({label:"Link",href:"/docs"})+e({label:"Submit",type:"submit",variant:"primary"}),`button({ label: 'Disabled', disabled: true })
button({ label: 'Link',    href: '/docs'   })
button({ label: 'Submit',  type: 'submit', variant: 'primary' })`)}

      ${r(["Prop","Type","Default",""],[["<code>label</code>","string","\u2014","Visible text"],["<code>variant</code>","string","primary","primary \xB7 secondary \xB7 ghost \xB7 danger"],["<code>size</code>","string","md","sm \xB7 md \xB7 lg"],["<code>href</code>","string","\u2014","Renders <code>&lt;a&gt;</code> instead of <code>&lt;button&gt;</code>"],["<code>disabled</code>","boolean","false",""],["<code>type</code>","string","button","button \xB7 submit \xB7 reset"],["<code>icon</code>","string","\u2014","SVG HTML prepended inside"],["<code>iconAfter</code>","string","\u2014","SVG HTML appended inside"],["<code>fullWidth</code>","boolean","false",""],["<code>class</code>","string","\u2014","Extra classes appended to the element"],["<code>attrs</code>","object","{}","Extra HTML attributes (button only)"]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",n(a,o,window.__PULSE_SERVER__||{},{ssr:!0}),l(o,n));var P=a;export{P as default};
