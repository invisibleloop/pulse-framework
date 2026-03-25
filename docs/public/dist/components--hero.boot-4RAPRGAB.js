import{a as t,b as d}from"./runtime-ZJ4FXT5O.js";import{Ga as r,Ma as s}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as l,h as a}from"./runtime-L2HNXIHW.js";import{a as o,b as n}from"./runtime-B73WLANC.js";var{prev:p,next:c}=l("/components/hero"),i={route:"/components/hero",meta:{title:"Hero \u2014 Pulse Docs",description:"Hero component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/hero",prev:p,next:c,name:"hero",description:"Full-width hero section. The <code>actions</code> slot accepts any combination of <code>button()</code> and <code>appBadge()</code> calls. Set <code>align: 'left'</code> for a split-layout hero. Use <code>size: 'sm'</code> for inner-page headers that don't need the full vertical padding.",content:`
      ${t(r({eyebrow:"Now available",title:"The app your phone deserves",subtitle:"Beautifully simple. Ridiculously fast. Available on iOS and Android.",actions:s({store:"apple",href:"#"})+" "+s({store:"google",href:"#"})}),`hero({
  eyebrow:  'Now available',
  title:    'The app your phone deserves',
  subtitle: 'Beautifully simple. Ridiculously fast.',
  actions:  appBadge({ store: 'apple',  href: appStoreUrl }) +
            appBadge({ store: 'google', href: playStoreUrl }),
})`)}

      ${t(r({title:"Blog",subtitle:"Thoughts on building for the web.",size:"sm"}),`hero({
  title:    'Blog',
  subtitle: 'Thoughts on building for the web.',
  size:     'sm',
})`)}

      ${a(["Prop","Type","Default",""],[["<code>eyebrow</code>","string","\u2014","Small label above the title"],["<code>title</code>","string","\u2014",""],["<code>subtitle</code>","string","\u2014",""],["<code>actions</code>","string (HTML)","\u2014","Raw HTML slot"],["<code>align</code>","string","'center'","'center' or 'left'"],["<code>size</code>","string","'md'","'md' (5rem padding) or 'sm' (2.5rem top, no bottom) \u2014 use sm for inner-page headers"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",o(i,e,window.__PULSE_SERVER__||{},{ssr:!0}),n(e,o));var v=i;export{v as default};
