import{a as r,b as d}from"./runtime-O3PCG43G.js";import{pb as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as t,h as c}from"./runtime-OFZXJMSU.js";import{a as s,b as l}from"./runtime-B73WLANC.js";var{prev:n,next:m}=t("/components/breadcrumbs"),a={route:"/components/breadcrumbs",meta:{title:"Breadcrumbs \u2014 Pulse Docs",description:"Accessible breadcrumb navigation component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/breadcrumbs",prev:n,next:m,name:"breadcrumbs",description:'Accessible breadcrumb navigation. The current page item renders as a <code>&lt;span&gt;</code> with <code>aria-current="page"</code>; all preceding items render as links.',content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${r(o({items:[{label:"Home",href:"/"},{label:"Products",href:"/products"},{label:"Sneakers"}]}),`breadcrumbs({
  items: [
    { label: 'Home',     href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Sneakers' },
  ],
})`)}

      <h2 class="doc-h2" id="longer">Longer trail</h2>
      ${r(o({items:[{label:"Home",href:"/"},{label:"Shop",href:"/shop"},{label:"Footwear",href:"/shop/footwear"},{label:"Sneakers",href:"/shop/footwear/sneakers"},{label:"Air Max 90"}]}),`breadcrumbs({
  items: [
    { label: 'Home',     href: '/' },
    { label: 'Shop',     href: '/shop' },
    { label: 'Footwear', href: '/shop/footwear' },
    { label: 'Sneakers', href: '/shop/footwear/sneakers' },
    { label: 'Air Max 90' },
  ],
})`)}

      <h2 class="doc-h2" id="separator">Custom separator</h2>
      ${r(o({separator:"\u203A",items:[{label:"Docs",href:"/docs"},{label:"Components",href:"/docs/components"},{label:"Breadcrumbs"}]}),`breadcrumbs({
  separator: '\u203A',
  items: [
    { label: 'Docs',       href: '/docs' },
    { label: 'Components', href: '/docs/components' },
    { label: 'Breadcrumbs' },
  ],
})`)}

      ${c(["Prop","Type","Default",""],[["<code>items</code>","array","[]","Array of <code>{ label, href }</code>. The last item should have no <code>href</code> \u2014 it becomes the current page."],["<code>separator</code>","string","'/'","Character rendered between items"],["<code>class</code>","string","\u2014",""]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",s(a,e,window.__PULSE_SERVER__||{},{ssr:!0}),l(e,s));var S=a;export{S as default};
