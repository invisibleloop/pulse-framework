import{a as n,b as i}from"./runtime-O3PCG43G.js";import{Fa as c,b as e}from"./runtime-UVPXO4IR.js";import{a}from"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s}from"./runtime-OFZXJMSU.js";import{a as o,b as l}from"./runtime-B73WLANC.js";var{prev:m,next:u}=s("/components/table"),r={route:"/components/table",meta:{title:"Table \u2014 Pulse Docs",description:"Table component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>i({currentHref:"/components/table",prev:m,next:u,name:"table",description:'The scroll wrapper has <code>role="region"</code> and <code>tabindex="0"</code> so keyboard users can scroll horizontally on narrow screens. Row cells are raw HTML slots \u2014 wrap user-supplied values in <code>escHtml()</code> when building them.',content:`
      ${n(c({caption:"Team members",headers:["Name","Role","Status"],rows:[[a("Alice Smith"),e({label:"Admin",variant:"info"}),e({label:"Active",variant:"success"})],[a("Bob Jones"),e({label:"Editor",variant:"default"}),e({label:"Active",variant:"success"})],[a("Carol White"),e({label:"Viewer",variant:"default"}),e({label:"Inactive",variant:"default"})]]}),`table({
  caption: 'Team members',
  headers: ['Name', 'Role', 'Status'],
  rows: server.users.map(u => [
    escHtml(u.name),
    badge({ label: u.role,   variant: u.role === 'admin' ? 'info' : 'default' }),
    badge({ label: u.status, variant: u.active ? 'success' : 'default'        }),
  ]),
})`)}
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",o(r,t,window.__PULSE_SERVER__||{},{ssr:!0}),l(t,o));var T=r;export{T as default};
