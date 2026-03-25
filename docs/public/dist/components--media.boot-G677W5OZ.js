import{a as i,b as s}from"./runtime-O3PCG43G.js";import{Qa as d,Ua as m,a as c}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as r,h as n}from"./runtime-OFZXJMSU.js";import{a as t,b as a}from"./runtime-B73WLANC.js";var{prev:l,next:p}=r("/components/media"),o={route:"/components/media",meta:{title:"Media \u2014 Pulse Docs",description:"Media component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>s({currentHref:"/components/media",prev:l,next:p,name:"media",description:"Two-column image + text layout. Stacks vertically on mobile. Set <code>reverse</code> to alternate image position for multi-block feature sections.",content:`
      ${i(m({image:'<div style="background:var(--ui-surface-2);border:1px solid var(--ui-border);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--ui-muted);font-size:.875rem">Screenshot</div>',content:d({gap:"md",content:'<h3 style="font-size:1.25rem;font-weight:700;color:var(--ui-text);margin:0">One-tap controls</h3><p style="color:var(--ui-muted);margin:0">Tap to flap. Chippy Bird takes seconds to learn and a lifetime to conquer.</p>'+c({label:"Download",href:"#"})})}),`media({
  image:   \`<img src="\${screenshot}" alt="App screenshot">\`,
  content: stack({ gap: 'md', content:
    '<h3>One-tap controls</h3>' +
    '<p>Tap to flap.</p>' +
    button({ label: 'Download', href: appStoreUrl })
  }),
  reverse: false,
})`)}

      ${n(["Prop","Type","Default",""],[["<code>image</code>","string (HTML)","\u2014","Raw HTML slot \u2014 img, figure, SVG, or styled div"],["<code>content</code>","string (HTML)","\u2014","Raw HTML slot"],["<code>reverse</code>","boolean","false","Puts text left, image right"],["<code>align</code>","string","'center'","'center' \xB7 'start'"],["<code>gap</code>","string","'md'","'sm' \xB7 'md' \xB7 'lg'"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(o,e,window.__PULSE_SERVER__||{},{ssr:!0}),a(e,t));var w=o;export{w as default};
