import{a as t,b as u}from"./runtime-ZJ4FXT5O.js";import{Ca as n,Ha as r,Ia as c,Pa as o,c as i}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as d,h as p}from"./runtime-L2HNXIHW.js";import{a,b as m}from"./runtime-B73WLANC.js";var{prev:h,next:f}=d("/components/grid"),e=g=>`<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:1.25rem;text-align:center;color:var(--muted)">${g}</div>`,l={route:"/components/grid",meta:{title:"Grid \u2014 Pulse Docs",description:"Grid component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>u({currentHref:"/components/grid",prev:h,next:f,name:"grid",description:"Responsive CSS grid. Collapses to a single column on mobile. Direct children of the content slot become grid items \u2014 no wrapper needed.",content:`
      <h2 class="doc-h2" id="cols">Column counts</h2>
      <p>Use <code>cols</code> to set the number of columns. All layouts collapse to one column on mobile.</p>

      <h3 class="doc-h3">2 columns</h3>
      ${t(o({cols:2,content:e("Left")+e("Right")}),"grid({ cols: 2, content: left + right })")}

      <h3 class="doc-h3">3 columns (default)</h3>
      ${t(o({cols:3,content:e("One")+e("Two")+e("Three")}),"grid({ cols: 3, content: items.join('') })")}

      <h3 class="doc-h3">4 columns</h3>
      ${t(o({cols:4,content:e("A")+e("B")+e("C")+e("D")}),"grid({ cols: 4, content: items.join('') })")}

      <h2 class="doc-h2" id="gap">Gap sizes</h2>
      <p>Control spacing between items with <code>gap: 'sm' | 'md' | 'lg'</code>. Default is <code>'md'</code>.</p>

      <h3 class="doc-h3">Small gap</h3>
      ${t(o({cols:3,gap:"sm",content:e("One")+e("Two")+e("Three")}),"grid({ cols: 3, gap: 'sm', content: items.join('') })")}

      <h3 class="doc-h3">Large gap</h3>
      ${t(o({cols:3,gap:"lg",content:e("One")+e("Two")+e("Three")}),"grid({ cols: 3, gap: 'lg', content: items.join('') })")}

      <h2 class="doc-h2" id="with-components">With components</h2>
      <p>Grid accepts any HTML string as content \u2014 pass other component outputs directly.</p>

      <h3 class="doc-h3">Feature grid</h3>
      ${t(o({cols:3,content:[c({icon:"\u26A1",title:"Fast",description:"Sub-100ms server responses with streaming SSR."}),c({icon:"\u{1F512}",title:"Secure",description:"Security headers on every response, including errors."}),c({icon:"\u{1F3AF}",title:"Simple",description:"No build step, no virtual DOM, no dependencies."})].join("")}),`grid({
  cols: 3,
  content: features.map(f => feature(f)).join(''),
})`)}

      <h3 class="doc-h3">Stat grid</h3>
      ${t(o({cols:4,content:[n({label:"Monthly users",value:"24.8k",change:"+12%",trend:"up"}),n({label:"Revenue",value:"$18.2k",change:"+8.4%",trend:"up"}),n({label:"Churn rate",value:"2.1%",change:"\u22120.3%",trend:"down"}),n({label:"Uptime",value:"99.98%",change:"0.0%",trend:"neutral"})].join("")}),`grid({
  cols: 4,
  content: stats.map(s => stat(s)).join(''),
})`)}

      <h3 class="doc-h3">Testimonial grid</h3>
      ${t(o({cols:3,content:[r({quote:"Shipped our redesign in a weekend. No boilerplate, no config hell.",name:"Alex Morgan",role:"CTO at Launchpad",rating:5}),r({quote:"The streaming SSR makes our pages feel instant. Lighthouse is happy.",name:"Sara Kim",role:"Lead Engineer, Orbit",rating:5}),r({quote:"Finally a UI kit that doesn't fight the platform. Just HTML.",name:"Dan Okafor",role:"Founder, Stackly",rating:5})].join("")}),`grid({
  cols: 3,
  content: testimonials.map(t => testimonial(t)).join(''),
})`)}

      <h3 class="doc-h3">Card grid</h3>
      ${t(o({cols:3,gap:"md",content:[i({title:"Getting started",content:'<p style="color:var(--muted);margin:0">Install and run your first Pulse app in under five minutes.</p>',footer:'<span class="ui-badge">Guide</span>'}),i({title:"Components",content:'<p style="color:var(--muted);margin:0">30+ accessible, composable UI primitives ready to drop in.</p>',footer:'<span class="ui-badge">Reference</span>'}),i({title:"Deployment",content:'<p style="color:var(--muted);margin:0">Static hosting, Node servers, or edge runtimes \u2014 one build.</p>',footer:'<span class="ui-badge">Deploy</span>'})].join("")}),`grid({
  cols: 3,
  content: docs.map(d => card({
    title:   d.title,
    content: \`<p>\${d.summary}</p>\`,
    footer:  badge({ label: d.tag }),
  })).join(''),
})`)}

      <h2 class="doc-h2" id="1col">Single column</h2>
      <p>Use <code>cols: 1</code> for a stacked list with consistent spacing \u2014 useful for form sections or timelines.</p>
      ${t(o({cols:1,gap:"sm",content:e("Step one")+e("Step two")+e("Step three")}),"grid({ cols: 1, gap: 'sm', content: steps.join('') })")}

      ${p(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML slot \u2014 direct children are grid items"],["<code>cols</code>","number","3","1 \xB7 2 \xB7 3 \xB7 4"],["<code>gap</code>","string","'md'","'sm' \xB7 'md' \xB7 'lg'"]])}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",a(l,s,window.__PULSE_SERVER__||{},{ssr:!0}),m(s,a));var C=l;export{C as default};
