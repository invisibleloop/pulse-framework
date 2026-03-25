import{a as t,b as c}from"./runtime-O3PCG43G.js";import{vb as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as d,h as i}from"./runtime-OFZXJMSU.js";import{a as o,b as n}from"./runtime-B73WLANC.js";var{prev:a,next:p}=d("/components/list"),r={route:"/components/list",meta:{title:"List \u2014 Pulse Docs",description:"Styled ordered and unordered list component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>c({currentHref:"/components/list",prev:a,next:p,name:"list",description:"Styled unordered or ordered list with consistent spacing and colour tokens. Use this instead of raw <code>&lt;ul&gt;</code> / <code>&lt;ol&gt;</code>. Items are HTML strings \u2014 other components can be passed as items.",content:`

      <h2 class="doc-h2" id="unordered">Unordered</h2>
      ${t(e({items:["Streaming SSR on every page","Security headers by default","Zero client-side dependencies","Lighthouse 100 out of the box"]}),`list({
  items: [
    'Streaming SSR on every page',
    'Security headers by default',
    'Zero client-side dependencies',
    'Lighthouse 100 out of the box',
  ],
})`,{col:!0})}

      <h2 class="doc-h2" id="ordered">Ordered</h2>
      ${t(e({ordered:!0,items:["Create a new Pulse project","Add your pages to <code>src/pages/</code>","Run <code>pulse dev</code> to start the server","Deploy when ready"]}),`list({
  ordered: true,
  items: [
    'Create a new Pulse project',
    'Add your pages to src/pages/',
    'Run pulse dev to start the server',
    'Deploy when ready',
  ],
})`,{col:!0})}

      <h2 class="doc-h2" id="gap">Gap</h2>
      <p>Control vertical spacing between items with the <code>gap</code> prop.</p>
      ${t(`<div class="u-flex u-gap-8">
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">xs</p>
            ${e({gap:"xs",items:["Design","Build","Ship"]})}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">sm (default)</p>
            ${e({gap:"sm",items:["Design","Build","Ship"]})}
          </div>
          <div>
            <p class="u-text-muted u-text-sm u-mb-2">md</p>
            ${e({gap:"md",items:["Design","Build","Ship"]})}
          </div>
        </div>`,`list({ gap: 'xs', items: [...] })
list({ gap: 'sm', items: [...] })  // default
list({ gap: 'md', items: [...] })`,{col:!0})}

      <h2 class="doc-h2" id="rich-items">Items with markup</h2>
      <p>Items are HTML strings \u2014 pass any markup including other components. Always escape user data before including it in item strings.</p>
      ${t(e({items:["<strong>spec.state</strong> \u2014 initial client state, deep-cloned on mount","<strong>spec.mutations</strong> \u2014 synchronous state updates","<strong>spec.actions</strong> \u2014 async operations with lifecycle hooks","<strong>spec.server</strong> \u2014 server-side data fetchers"]}),`list({
  items: [
    '<strong>spec.state</strong> \u2014 initial client state',
    '<strong>spec.mutations</strong> \u2014 synchronous state updates',
    '<strong>spec.actions</strong> \u2014 async operations with lifecycle hooks',
    '<strong>spec.server</strong> \u2014 server-side data fetchers',
  ],
})`,{col:!0})}

      ${i(["Prop","Type","Default",""],[["<code>items</code>","string[]","\u2014","Array of HTML strings for each list item \u2014 escape user data before passing"],["<code>ordered</code>","boolean","<code>false</code>","<code>false</code> renders <code>&lt;ul&gt;</code>, <code>true</code> renders <code>&lt;ol&gt;</code>"],["<code>gap</code>","<code>xs | sm | md</code>","<code>sm</code>","Vertical spacing between items"],["<code>class</code>","string","\u2014","Extra classes on the list element"]])}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",o(r,s,window.__PULSE_SERVER__||{},{ssr:!0}),n(s,o));var x=r;export{x as default};
