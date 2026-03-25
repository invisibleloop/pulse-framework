import{a as s,b as l}from"./runtime-ZJ4FXT5O.js";import{Za as c,a as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a,h as n}from"./runtime-L2HNXIHW.js";import{a as e,b as r}from"./runtime-B73WLANC.js";var{prev:d,next:p}=a("/components/cta"),i={route:"/components/cta",meta:{title:"CTA \u2014 Pulse Docs",description:"Call-to-action block with eyebrow, heading, body text, and an actions slot.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/cta",prev:d,next:p,name:"cta",description:"Call-to-action block with eyebrow, heading, body text, and an actions slot. Sits inside <code>section()</code> + <code>container()</code> \u2014 adds no padding of its own.",content:`
      ${s(c({eyebrow:"Get started today",title:"Ready to build?",subtitle:"One spec file per page. SSR always on. Lighthouse 100 out of the box.",actions:o({label:"Start building \u2192",href:"#",variant:"primary",size:"lg"})+o({label:"View on GitHub",href:"#",variant:"ghost",size:"lg"})}),`cta({
  eyebrow:  'Get started today',
  title:    'Ready to build?',
  subtitle: 'One spec file per page. SSR always on. Lighthouse 100 out of the box.',
  actions:  button({ label: 'Start building \u2192', href: '/docs', variant: 'primary', size: 'lg' }) +
            button({ label: 'View on GitHub',    href: 'https://github.com/...', variant: 'ghost', size: 'lg' }),
})`)}

      ${n(["Prop","Type","Default",""],[["<code>eyebrow</code>","string","\u2014","Small label above the heading"],["<code>title</code>","string","\u2014","Main heading"],["<code>level</code>","number","2","Heading tag for the title (1\u20136). Visual style is unchanged."],["<code>subtitle</code>","string","\u2014","Supporting paragraph"],["<code>actions</code>","string (HTML)","\u2014","Raw HTML slot \u2014 typically button() calls"],["<code>align</code>","string","'center'","'center' \xB7 'left'"]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",e(i,t,window.__PULSE_SERVER__||{},{ssr:!0}),r(t,e));var S=i;export{S as default};
