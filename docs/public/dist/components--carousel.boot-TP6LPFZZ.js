import{a as r,b as l}from"./runtime-ZJ4FXT5O.js";import{Ya as t}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as d,h as a}from"./runtime-L2HNXIHW.js";import{a as s,b as n}from"./runtime-B73WLANC.js";var{prev:p,next:f}=d("/components/carousel");function e(c,u){return`<div style="height:220px;display:flex;align-items:center;justify-content:center;background:${c};border-radius:10px;font-size:1.1rem;font-weight:700;color:var(--ui-text)">${u}</div>`}var i={route:"/components/carousel",meta:{title:"Carousel \u2014 Pulse Docs",description:"Carousel / slider component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/carousel",prev:p,next:f,name:"carousel",description:"CSS scroll-snap carousel with optional prev/next arrows and dot navigation. Touch / swipe friendly out of the box. Requires <code>pulse-ui.js</code> for button and dot interactivity.",content:`
      ${r(t({slides:[e("var(--ui-surface-2)","Slide 1"),e("var(--ui-surface)","Slide 2"),e("var(--ui-surface-2)","Slide 3")]}),'carousel({\n  slides: [\n    `<div class="slide">Slide 1</div>`,\n    `<div class="slide">Slide 2</div>`,\n    `<div class="slide">Slide 3</div>`,\n  ],\n})')}

      <h3 class="doc-h3" id="arrows-dots"><a href="#arrows-dots" class="heading-anchor">Arrows and dots</a></h3>
      ${r(t({arrows:!0,dots:!1,slides:[e("var(--ui-surface-2)","Arrows only \u2014 Slide 1"),e("var(--ui-surface)","Arrows only \u2014 Slide 2")]}),`carousel({
  slides: [ /* ... */ ],
  arrows: true,
  dots:   false,   // hide dot navigation
})`)}

      ${a(["Prop","Type","Default",""],[["<code>slides</code>","string[] (HTML)","[]","Array of raw HTML strings \u2014 one per slide"],["<code>arrows</code>","boolean","<code>true</code>","Show prev/next arrow buttons"],["<code>dots</code>","boolean","<code>true</code>","Show dot navigation (hidden when only one slide)"],["<code>class</code>","string","\u2014",""]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",s(i,o,window.__PULSE_SERVER__||{},{ssr:!0}),n(o,s));var b=i;export{b as default};
