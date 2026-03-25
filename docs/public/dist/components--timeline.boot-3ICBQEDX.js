import{a as e,b as m}from"./runtime-O3PCG43G.js";import{$a as o,Ca as r,a as u,ab as t,b as a,c as l}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as d,h as i}from"./runtime-OFZXJMSU.js";import{a as s,b as p}from"./runtime-B73WLANC.js";var{prev:g,next:v}=d("/components/timeline"),b='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',h='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',y='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',c={route:"/components/timeline",meta:{title:"Timeline \u2014 Pulse Docs",description:"Timeline component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>m({currentHref:"/components/timeline",prev:g,next:v,name:"timeline",description:"Ordered sequence of events or steps connected by a line. Supports vertical (default) and horizontal orientations. Each item accepts a raw HTML content slot \u2014 pass any text, component, or markup.",content:`

      <h2 class="doc-h2" id="vertical">Vertical (default)</h2>
      <p>Steps flow downward. The connector line links each dot to the next.</p>
      ${e(t({items:[{label:"Jan 2023",content:'<strong style="color:var(--ui-text)">Project kicked off</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Initial scope agreed with stakeholders. Repository created.</p>'},{label:"Mar 2023",content:'<strong style="color:var(--ui-text)">Alpha release</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Internal testing with 12 pilot users. Core features stable.</p>'},{label:"Jun 2023",content:'<strong style="color:var(--ui-text)">Public beta</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Open sign-up enabled. 400 users in first week.</p>'},{label:"Sep 2023",content:'<strong style="color:var(--ui-text)">v1.0 launched</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Billing live, docs published, ProductHunt launch.</p>'}]}),`timeline({
  items: [
    { label: 'Jan 2023', content: '<strong>Project kicked off</strong><p>Initial scope agreed.</p>' },
    { label: 'Mar 2023', content: '<strong>Alpha release</strong><p>Internal testing with 12 pilot users.</p>' },
    { label: 'Jun 2023', content: '<strong>Public beta</strong><p>Open sign-up enabled. 400 users in first week.</p>' },
    { label: 'Sep 2023', content: '<strong>v1.0 launched</strong><p>Billing live, docs published.</p>' },
  ],
})`)}

      <h2 class="doc-h2" id="horizontal">Horizontal</h2>
      <p>Steps flow left to right \u2014 good for process flows or numbered stages.</p>
      ${e(t({direction:"horizontal",items:[{label:"Step 1",content:'<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Sign up</p>'},{label:"Step 2",content:'<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Connect data</p>'},{label:"Step 3",content:'<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Invite team</p>'},{label:"Step 4",content:'<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Go live</p>'}]}),`timeline({
  direction: 'horizontal',
  items: [
    { label: 'Step 1', content: '<p>Sign up</p>'      },
    { label: 'Step 2', content: '<p>Connect data</p>' },
    { label: 'Step 3', content: '<p>Invite team</p>'  },
    { label: 'Step 4', content: '<p>Go live</p>'      },
  ],
})`)}

      <h2 class="doc-h2" id="dot-colors">Dot colours</h2>
      <p>Use <code>dotColor</code> to convey status: <code>'accent'</code> \xB7 <code>'success'</code> \xB7 <code>'warning'</code> \xB7 <code>'error'</code> \xB7 <code>'muted'</code>.</p>
      ${e(t({items:[{dotColor:"success",label:"Deployed",content:'<p style="color:var(--ui-muted);margin:0">Production deploy completed successfully.</p>'},{dotColor:"success",label:"Tested",content:'<p style="color:var(--ui-muted);margin:0">All 92 tests passed. Coverage 98%.</p>'},{dotColor:"warning",label:"Review",content:'<p style="color:var(--ui-muted);margin:0">Awaiting sign-off from design lead.</p>'},{dotColor:"error",label:"Blocked",content:'<p style="color:var(--ui-muted);margin:0">Dependency on payment API not yet ready.</p>'},{dotColor:"muted",label:"Planned",content:'<p style="color:var(--ui-muted);margin:0">Mobile app release \u2014 Q1 2025.</p>'}]}),`timeline({
  items: [
    { dotColor: 'success', label: 'Deployed', content: '...' },
    { dotColor: 'success', label: 'Tested',   content: '...' },
    { dotColor: 'warning', label: 'Review',   content: '...' },
    { dotColor: 'error',   label: 'Blocked',  content: '...' },
    { dotColor: 'muted',   label: 'Planned',  content: '...' },
  ],
})`)}

      <h2 class="doc-h2" id="icon-dots">Icon dots</h2>
      <p>Pass any SVG or emoji as <code>dot</code>. The dot grows to accommodate the content and uses a tinted background matching its colour variant.</p>
      ${e(t({items:[{dot:b,dotColor:"success",label:"Completed",content:'<strong style="color:var(--ui-text)">Onboarding</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">Profile set up, preferences saved.</p>'},{dot:h,dotColor:"accent",label:"Milestone",content:'<strong style="color:var(--ui-text)">First 1,000 users</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">Reached organically in 18 days.</p>'},{dot:y,dotColor:"warning",label:"Incident",content:'<strong style="color:var(--ui-text)">Partial outage</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">CDN edge node failed \u2014 resolved in 4 minutes.</p>'}]}),`timeline({
  items: [
    {
      dot:      checkSvg,
      dotColor: 'success',
      label:    'Completed',
      content:  '<strong>Onboarding</strong><p>Profile set up, preferences saved.</p>',
    },
    {
      dot:      starSvg,
      dotColor: 'accent',
      label:    'Milestone',
      content:  '<strong>First 1,000 users</strong>',
    },
  ],
})`)}

      <h2 class="doc-h2" id="rich-content">Rich content slot</h2>
      <p>The <code>content</code> slot accepts any HTML \u2014 including other Pulse components like <code>card()</code>, <code>badge()</code>, or <code>stat()</code>.</p>
      ${e(t({items:[{dotColor:"success",label:"Q1 2024",content:l({title:"Series A closed",content:'<div style="display:flex;gap:1.5rem;flex-wrap:wrap">'+r({label:"Raised",value:"$4.2M"})+r({label:"Valuation",value:"$18M"})+r({label:"Investors",value:"6"})+"</div>"})},{dotColor:"accent",label:"Q3 2024",content:l({title:"Product launch",content:'<p style="color:var(--ui-muted);margin:0 0 .75rem">Shipped v1.0 to general availability. Three tiers, 14-day trial.</p><div style="display:flex;gap:.5rem;flex-wrap:wrap">'+a({label:"Launch",variant:"info"})+a({label:"Billing live",variant:"success"})+"</div>"})},{dotColor:"muted",label:"Q1 2025 (planned)",content:l({title:"Mobile apps",content:'<p style="color:var(--ui-muted);margin:0 0 .75rem">iOS and Android apps in development. Public beta planned.</p>'+u({label:"Join waitlist",size:"sm",variant:"secondary"})})}]}),`timeline({
  items: [
    {
      dotColor: 'success',
      label:    'Q1 2024',
      content:  card({
        title:   'Series A closed',
        content: stat({ label: 'Raised', value: '$4.2M' }) + ...,
      }),
    },
    {
      dotColor: 'accent',
      label:    'Q3 2024',
      content:  card({
        title:   'Product launch',
        content: '<p>Shipped v1.0 to general availability.</p>' +
                 badge({ label: 'Billing live', variant: 'success' }),
      }),
    },
  ],
})`)}

      <h2 class="doc-h2" id="item-fn">Using timelineItem()</h2>
      <p>Build items individually with <code>timelineItem()</code> and pass the joined HTML as <code>content</code>. Useful for dynamic or conditional lists.</p>
      ${e(t({content:o({dotColor:"success",label:"Done",content:'<p style="color:var(--ui-muted);margin:0">Design system tokens agreed</p>'})+o({dotColor:"success",label:"Done",content:'<p style="color:var(--ui-muted);margin:0">Component library built</p>'})+o({dotColor:"accent",label:"Current",content:'<p style="color:var(--ui-muted);margin:0">Documentation in progress</p>'})+o({dotColor:"muted",label:"Next",content:'<p style="color:var(--ui-muted);margin:0">Public launch</p>'})}),`timeline({
  content:
    timelineItem({ dotColor: 'success', label: 'Done',    content: '...' }) +
    timelineItem({ dotColor: 'success', label: 'Done',    content: '...' }) +
    timelineItem({ dotColor: 'accent',  label: 'Current', content: '...' }) +
    timelineItem({ dotColor: 'muted',   label: 'Next',    content: '...' }),
})`)}

      ${i(["Prop","Type","Default",""],[["<code>direction</code>","string","'vertical'","'vertical' \xB7 'horizontal'"],["<code>items</code>","array","[]","Array of <code>timelineItem</code> option objects"],["<code>content</code>","string (HTML)","\u2014","Raw HTML alternative to <code>items</code> \u2014 use with <code>timelineItem()</code>"]])}

      <h3 class="doc-h3" style="margin-top:2rem">timelineItem() props</h3>
      ${i(["Prop","Type","Default",""],[["<code>content</code>","string (HTML)","\u2014","Raw HTML body \u2014 accepts any component output"],["<code>label</code>","string","\u2014","Timestamp or step label (escaped)"],["<code>dot</code>","string (HTML)","\u2014","Raw HTML inside the dot \u2014 SVG or emoji; grows the dot to 2rem"],["<code>dotColor</code>","string","'accent'","'accent' \xB7 'success' \xB7 'warning' \xB7 'error' \xB7 'muted'"]])}
    `})};var n=document.getElementById("pulse-root");n&&!n.dataset.pulseMounted&&(n.dataset.pulseMounted="1",s(c,n,window.__PULSE_SERVER__||{},{ssr:!0}),p(n,s));var M=c;export{M as default};
