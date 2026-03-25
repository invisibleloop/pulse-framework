import{a as o,b as d}from"./runtime-ZJ4FXT5O.js";import{tb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as i,h as n,i as l}from"./runtime-L2HNXIHW.js";import{a as s,b as a}from"./runtime-B73WLANC.js";var{prev:c,next:p}=i("/components/prose"),u=`<h2>Why great coffee starts with water</h2>
<p>Most home baristas obsess over beans and grinders, but water quality is the single biggest variable in your cup. Tap water that is too hard leaves bitter, chalky espresso. Too soft and your shots taste flat and lifeless.</p>
<h3>The ideal mineral balance</h3>
<p>Speciality roasters recommend water with a total dissolved solids (TDS) between <strong>75\u2013150 mg/L</strong> and a magnesium content of at least 10 mg/L. Magnesium is the mineral most responsible for extracting the fruity, floral notes from light roasts.</p>
<h3>What to do if your tap water is off</h3>
<ul>
  <li>Use a filter jug \u2014 Brita Maxtra+ reduces hardness and chlorine</li>
  <li>Try third-wave water sachets \u2014 add to distilled water for precise control</li>
  <li>Blend tap with still mineral water to hit the right TDS range</li>
</ul>
<blockquote>Water is the ingredient you can control most precisely, yet almost nobody does.</blockquote>
<p>Once your water is dialled in, even a modest grinder will produce noticeably better results. <a href="#">Read our water guide</a> for a full breakdown by region.</p>`,r={route:"/components/prose",meta:{title:"Prose \u2014 Pulse Docs",description:"Typography wrapper for CMS output and rich text content in Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/prose",prev:c,next:p,name:"prose",description:"Typography wrapper for rich text you don't control: CMS output, markdown-rendered HTML, database content, blog posts. Styles all descendant elements \u2014 headings, paragraphs, lists, blockquotes, code, tables \u2014 using <code>--ui-*</code> tokens. No classes needed on individual elements.",content:`

      <h2 class="doc-h2" id="basic">Basic</h2>
      <p>Pass any HTML string to <code>content</code>. All elements inside are styled automatically.</p>
      ${o(e({content:u}),`import { prose } from '@invisibleloop/pulse/ui'

// CMS rich text field \u2014 output directly, fully styled
prose({ content: server.article.bodyHtml })

// Markdown rendered to HTML
prose({ content: renderMarkdown(server.post.body) })`,{col:!0})}

      <h2 class="doc-h2" id="size">Size</h2>
      <p>Scale the base font size for different contexts.</p>
      ${o(`<div class="u-flex u-flex-col u-gap-8">
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">sm \u2014 footnotes, sidebars</p>
            ${e({content:"<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Smaller text</li><li>Tighter line height</li></ul>",size:"sm"})}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">base (default)</p>
            ${e({content:"<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Default size</li><li>Standard line height</li></ul>"})}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-3">lg \u2014 hero intro, feature descriptions</p>
            ${e({content:"<p>The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p><ul><li>Larger text</li><li>More generous spacing</li></ul>",size:"lg"})}
          </div>
        </div>`,`prose({ content: cms.body, size: 'sm' })   // footnotes, sidebars
prose({ content: cms.body })               // default
prose({ content: cms.intro, size: 'lg' }) // hero intro`,{col:!0})}

      <h2 class="doc-h2" id="elements">Styled elements</h2>
      <p>Every common HTML element rendered inside <code>prose()</code> is styled using <code>--ui-*</code> tokens:</p>
      ${o(e({content:`
          <h2>h2 heading</h2>
          <h3>h3 heading</h3>
          <p>A paragraph with <strong>bold</strong>, <em>italic</em>, and <a href="#">a link</a>. Also <code>inline code</code>.</p>
          <ul><li>Unordered item one</li><li>Unordered item two</li></ul>
          <ol><li>Ordered item one</li><li>Ordered item two</li></ol>
          <blockquote>A blockquote with an accent left border.</blockquote>
          <pre><code>// A code block
const x = 1 + 2</code></pre>
          <hr>
          <p class="u-text-sm u-text-muted">End of content.</p>
        `}),`prose({ content: \`
  <h2>Section heading</h2>
  <p>Paragraph with <strong>bold</strong> and <a href="#">a link</a>.</p>
  <ul><li>List item</li></ul>
  <blockquote>A quote.</blockquote>
  <pre><code>const x = 1</code></pre>
\` })`,{col:!0})}

      ${l("warning","<strong>Do not escape the content prop.</strong> <code>prose()</code> renders raw HTML \u2014 it is designed for trusted server-side content only. Never pass unescaped user input directly. Sanitise CMS output before rendering if your CMS allows arbitrary HTML.")}

      ${n(["Prop","Type","Default",""],[["<code>content</code>","string","\u2014","Raw HTML string \u2014 rendered as-is, not escaped. Use for server-side content only."],["<code>size</code>","<code>sm | base | lg</code>","<code>base</code>","Base font size scale. <code>sm</code>=0.875rem, <code>base</code>=1rem, <code>lg</code>=1.125rem"],["<code>class</code>","string","\u2014","Extra classes on the wrapper <code>&lt;div&gt;</code>"]])}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",s(r,t,window.__PULSE_SERVER__||{},{ssr:!0}),a(t,s));var x=r;export{x as default};
