import{a as s,b as d}from"./runtime-ZJ4FXT5O.js";import{La as t,a as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as i,h as a}from"./runtime-L2HNXIHW.js";import{a as l,b as r}from"./runtime-B73WLANC.js";var{prev:c,next:p}=i("/components/nav"),n={route:"/components/nav",meta:{title:"Nav \u2014 Pulse Docs",description:"Nav component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/nav",prev:c,next:p,name:"nav",description:"Sticky-capable site header with logo, navigation links, and an optional CTA button. On mobile (&lt; 640px) links collapse behind a burger button \u2014 clicking it reveals an overlay panel that sits on top of page content without pushing it down. Wired automatically by <code>pulse-ui.js</code>.",content:`
      ${s(t({logo:"<strong>MyApp</strong>",logoHref:"/",links:[{label:"Features",href:"#features"},{label:"Pricing",href:"#pricing"},{label:"FAQ",href:"#faq"}],action:o({label:"Download",size:"sm"}),sticky:!1}),`nav({
  logo:     '<strong>MyApp</strong>',
  logoHref: '/',
  links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing',  href: '#pricing'  },
    { label: 'FAQ',      href: '#faq'      },
  ],
  action: button({ label: 'Download', size: 'sm' }),
  sticky: true,
})`)}

      <h2 class="doc-h2" id="mobile">Mobile view</h2>
      <p>At &lt; 640px the links and action are hidden and replaced with a burger button. The panel opens as an overlay \u2014 no layout shift.</p>

      <div class="demo-phone demo-mobile-nav">
        <div class="demo-phone-statusbar"><div class="demo-phone-pill"></div></div>
        ${t({logo:"<strong>MyApp</strong>",logoHref:"/",links:[{label:"Features",href:"#features"},{label:"Pricing",href:"#pricing"},{label:"FAQ",href:"#faq"}],action:o({label:"Download",size:"sm"})})}
        <div class="demo-phone-content"><p>Tap the burger to open the overlay</p></div>
      </div>

      <h2 class="doc-h2" id="burger-left">Burger on the left</h2>
      <p>Set <code>burgerAlign: 'left'</code> to place the burger before the logo \u2014 common in app-style layouts.</p>

      <div class="demo-phone demo-mobile-nav">
        <div class="demo-phone-statusbar"><div class="demo-phone-pill"></div></div>
        ${t({logo:"<strong>MyApp</strong>",logoHref:"/",links:[{label:"Features",href:"#features"},{label:"Pricing",href:"#pricing"},{label:"FAQ",href:"#faq"}],action:o({label:"Download",size:"sm"}),burgerAlign:"left"})}
        <div class="demo-phone-content"><p>Burger on the left \u2014 logo stays right</p></div>
      </div>

      ${a(["Prop","Type","Default",""],[["<code>logo</code>","string (HTML)","\u2014","Raw HTML slot \u2014 SVG, img, or text"],["<code>logoHref</code>","string","'/'",""],["<code>links</code>","array","[]","<code>{ label, href }[]</code>"],["<code>action</code>","string (HTML)","\u2014","Raw HTML slot \u2014 shown in desktop bar and mobile menu"],["<code>sticky</code>","boolean","false","position: sticky with backdrop blur"],["<code>burgerAlign</code>","string","'right'","'right' or 'left' \u2014 mobile burger position"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",l(n,e,window.__PULSE_SERVER__||{},{ssr:!0}),r(e,l));var k=n;export{k as default};
