import{a as s,b as d}from"./runtime-O3PCG43G.js";import{Na as o,Oa as n}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as r,h as c}from"./runtime-OFZXJMSU.js";import{a as t,b as a}from"./runtime-B73WLANC.js";var{prev:l,next:p}=r("/components/section"),i={route:"/components/section",meta:{title:"Section \u2014 Pulse Docs",description:"Vertical padding wrapper with optional background. Compose with container() for full-width background with constrained content.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/section",prev:l,next:p,name:"section",description:"Vertical padding wrapper with optional background. Compose with <code>container()</code> for full-width background with constrained content.",content:`
      ${s(n({eyebrow:"Why Pulse",title:"Built for speed.",subtitle:"Every page scores 100 on Lighthouse by design, not by optimisation.",align:"center",variant:"alt",content:o({size:"md",content:'<p style="text-align:center;color:var(--ui-muted)">Content goes here</p>'})})+n({variant:"dark",content:o({size:"md",content:'<p style="text-align:center;color:var(--ui-muted)">Dark background \xB7 no header</p>'})}),`section({
  eyebrow:  'Why Pulse',
  title:    'Built for speed.',
  subtitle: 'Every page scores 100 on Lighthouse by design.',
  align:    'center',
  variant:  'alt',
  content:  container({ size: 'lg', content: featureGrid }),
})`)}

      ${c(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML slot"],["<code>variant</code>","string","'default'","'default' \xB7 'alt' \xB7 'dark'"],["<code>padding</code>","string","'md'","'sm' \xB7 'md' \xB7 'lg'"],["<code>id</code>","string","\u2014","Anchor id for nav links"],["<code>eyebrow</code>","string","\u2014","Small label above the title"],["<code>title</code>","string","\u2014","Section heading"],["<code>level</code>","number","2","Heading tag for the title (1\u20136). Visual style is unchanged."],["<code>subtitle</code>","string","\u2014","Supporting text beneath the heading"],["<code>align</code>","string","'left'","'left' \xB7 'center'"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(i,e,window.__PULSE_SERVER__||{},{ssr:!0}),a(e,t));var v=i;export{v as default};
