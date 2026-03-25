import{a as r,b as c}from"./runtime-O3PCG43G.js";import"./runtime-UVPXO4IR.js";import{b as i}from"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n,h as a}from"./runtime-OFZXJMSU.js";import{a as t,b as s}from"./runtime-B73WLANC.js";var{prev:l,next:p}=n("/components/code-window"),o={route:"/components/code-window",meta:{title:"Code Window \u2014 Pulse Docs",description:"macOS-style window chrome around a code block. Accepts pre-highlighted HTML as the content slot.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>c({currentHref:"/components/code-window",prev:l,next:p,name:"codeWindow",description:"macOS-style window chrome around a code block. Accepts pre-highlighted HTML as the content slot \u2014 the component handles all the chrome, layout, scrolling, and monospace typography.",content:`
      ${r(i({filename:"home.js",lang:"JavaScript",content:`<span style="color:var(--ui-accent)">export default</span> {
  <span style="color:var(--ui-text)">state</span>: { count: <span style="color:var(--ui-green)">0</span> },

  <span style="color:var(--ui-text)">view</span>: (state) =&gt; \`
    &lt;h1&gt;\${state.count}&lt;/h1&gt;
    &lt;button data-event=<span style="color:var(--ui-yellow)">"inc"</span>&gt;+&lt;/button&gt;
  \`,

  <span style="color:var(--ui-text)">mutations</span>: {
    inc: (state) =&gt; ({ count: state.count + <span style="color:var(--ui-green)">1</span> }),
  },
}`}),`codeWindow({
  filename: 'home.js',
  lang:     'JavaScript',
  content:  highlightedHtml, // pre-rendered HTML with syntax token spans
})`)}

      ${a(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML slot \u2014 pre-highlighted code HTML or plain text"],["<code>filename</code>","string","\u2014","Filename shown in the chrome bar (e.g. 'home.js')"],["<code>lang</code>","string","\u2014","Language label shown on the right of the chrome (e.g. 'JavaScript')"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(o,e,window.__PULSE_SERVER__||{},{ssr:!0}),s(e,t));var v=o;export{v as default};
