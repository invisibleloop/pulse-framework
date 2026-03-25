import{a as t,b as d}from"./runtime-ZJ4FXT5O.js";import{sb as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n,h as l}from"./runtime-L2HNXIHW.js";import{a as i,b as c}from"./runtime-B73WLANC.js";var{prev:u,next:r}=n("/components/pullquote"),s={route:"/components/pullquote",meta:{title:"Pullquote \u2014 Pulse Docs",description:"Styled blockquote component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/pullquote",prev:u,next:r,name:"pullquote",description:"Styled blockquote with an accent left border and optional attribution. Use it to highlight key quotes or testimonials within body content.",content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      ${t(o({quote:"Design is not just what it looks like and feels like. Design is how it works.",cite:"Steve Jobs, co-founder of Apple"}),`pullquote({
  quote: 'Design is not just what it looks like and feels like. Design is how it works.',
  cite:  'Steve Jobs, co-founder of Apple',
})`)}

      <h2 class="doc-h2" id="large">Large</h2>
      ${t(o({quote:"Simplicity is the ultimate sophistication.",cite:"Leonardo da Vinci",size:"lg"}),`pullquote({
  quote: 'Simplicity is the ultimate sophistication.',
  cite:  'Leonardo da Vinci',
  size:  'lg',
})`)}

      <h2 class="doc-h2" id="no-cite">Without attribution</h2>
      ${t(o({quote:"Good design makes a product understandable."}),`pullquote({
  quote: 'Good design makes a product understandable.',
})`)}

      ${l(["Prop","Type","Default",""],[["<code>quote</code>","string","\u2014","The quote text \u2014 escaped automatically"],["<code>cite</code>","string","\u2014","Attribution text \u2014 rendered in a <code>&lt;figcaption&gt;</code>"],["<code>size</code>","<code>md | lg</code>","<code>md</code>","Controls the font size of the quote text"],["<code>class</code>","string","\u2014",""]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",i(s,e,window.__PULSE_SERVER__||{},{ssr:!0}),c(e,i));var k=s;export{k as default};
