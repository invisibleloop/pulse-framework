import{a as o,b as s}from"./runtime-ZJ4FXT5O.js";import{rb as t}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as c,h as r}from"./runtime-L2HNXIHW.js";import{a as i,b as d}from"./runtime-B73WLANC.js";var{prev:n,next:p}=c("/components/image"),a={route:"/components/image",meta:{title:"Image \u2014 Pulse Docs",description:"Responsive image component with optional aspect-ratio crop and caption for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>s({currentHref:"/components/image",prev:n,next:p,name:"uiImage",description:'Responsive image component. Supports aspect-ratio cropping with <code>object-fit: cover</code>, optional caption, and rounded corners. Always uses <code>loading="lazy"</code> and <code>decoding="async"</code>.',content:`

      <h2 class="doc-h2" id="ratio">With aspect ratio</h2>
      <p>Set <code>ratio</code> to constrain the image to a fixed aspect ratio. The image fills the crop area with <code>object-fit: cover</code>.</p>
      ${o(t({src:"https://picsum.photos/seed/pulse1/800/450",alt:"Mountain landscape at dusk",ratio:"16/9"}),"uiImage({ src: '/img/photo.jpg', alt: 'Mountain landscape at dusk', ratio: '16/9' })",{col:!0})}

      <h2 class="doc-h2" id="rounded">Square and rounded</h2>
      ${o(`<div style="max-width:200px;margin:0 auto">${t({src:"https://picsum.photos/seed/pulse2/400/400",alt:"Profile photo",ratio:"1/1",rounded:!0})}</div>`,"uiImage({ src: '/img/avatar.jpg', alt: 'Profile photo', ratio: '1/1', rounded: true })",{col:!0})}

      <h2 class="doc-h2" id="caption">With caption</h2>
      ${o(t({src:"https://picsum.photos/seed/pulse3/800/600",alt:"Aerial view of a coastal town",ratio:"4/3",caption:"Aerial view of Porto, Portugal. Photo by Jo\xE3o Silva."}),`uiImage({
  src:     '/img/photo.jpg',
  alt:     'Aerial view of a coastal town',
  ratio:   '4/3',
  caption: 'Aerial view of Porto, Portugal. Photo by Jo\xE3o Silva.',
})`,{col:!0})}

      ${r(["Prop","Type","Default",""],[["<code>src</code>","string","\u2014","Image source URL"],["<code>alt</code>","string","\u2014","Alt text \u2014 required for accessibility"],["<code>caption</code>","string","\u2014","Renders a <code>&lt;figcaption&gt;</code> below the image"],["<code>ratio</code>","string","\u2014","CSS aspect-ratio string e.g. <code>'16/9'</code>, <code>'4/3'</code>, <code>'1/1'</code>. When set, the image fills the crop area with <code>object-fit: cover</code>."],["<code>rounded</code>","boolean","false","Applies full border-radius to the image wrap"],["<code>width</code>","number","\u2014","Sets the <code>width</code> attribute on the <code>&lt;img&gt;</code>"],["<code>height</code>","number","\u2014","Sets the <code>height</code> attribute on the <code>&lt;img&gt;</code>"],["<code>class</code>","string","\u2014",""]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",i(a,e,window.__PULSE_SERVER__||{},{ssr:!0}),d(e,i));var b=a;export{b as default};
