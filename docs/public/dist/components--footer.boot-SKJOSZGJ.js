import{a as s,b as n}from"./runtime-O3PCG43G.js";import{_a as a}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as l,h as r}from"./runtime-OFZXJMSU.js";import{a as e,b as i}from"./runtime-B73WLANC.js";var{prev:c,next:p}=l("/components/footer"),t={route:"/components/footer",meta:{title:"Footer \u2014 Pulse Docs",description:"Accessible site footer with logo slot, navigation links, and legal text.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>n({currentHref:"/components/footer",prev:c,next:p,name:"footer",description:"Accessible site footer with logo slot, navigation links, and legal text. Handles responsive stacking, hover states, and focus styles automatically.",content:`
      ${s(a({logo:"MyApp",logoHref:"/",links:[{label:"Docs",href:"/docs"},{label:"Pricing",href:"/pricing"},{label:"Blog",href:"/blog"},{label:"GitHub",href:"https://github.com"}],legal:"\xA9 2026 MyApp Ltd."}),`footer({
  logo:     'MyApp',
  logoHref: '/',
  links: [
    { label: 'Docs',    href: '/docs'    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'GitHub',  href: 'https://github.com' },
  ],
  legal: '\xA9 2026 MyApp Ltd.',
})`)}

      ${r(["Prop","Type","Default",""],[["<code>logo</code>","string (HTML)","\u2014","Raw HTML slot \u2014 SVG, img, or text"],["<code>logoHref</code>","string","'/'","Logo link destination"],["<code>links</code>","array","[]","[{label, href}] \u2014 footer navigation links"],["<code>legal</code>","string","\u2014","Copyright / legal text"]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",e(t,o,window.__PULSE_SERVER__||{},{ssr:!0}),i(o,e));var v=t;export{v as default};
