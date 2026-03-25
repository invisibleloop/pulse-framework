import{a as i,b as d}from"./runtime-ZJ4FXT5O.js";import{Aa as c,Pa as m,a as u,d as t,ya as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as s,h as l}from"./runtime-L2HNXIHW.js";import{a as r,b as n}from"./runtime-B73WLANC.js";var{prev:p,next:f}=s("/components/fieldset"),a={route:"/components/fieldset",meta:{title:"Fieldset \u2014 Pulse Docs",description:"Semantic grouping of related form fields with an accessible legend.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/fieldset",prev:p,next:f,name:"fieldset",description:'Wraps related fields in a semantic <code>&lt;fieldset&gt;</code> with a styled <code>&lt;legend&gt;</code>. Screen readers announce the legend when focus enters the group \u2014 use it whenever fields belong together (address, card details, contact info). Works naturally inside a <code>&lt;form data-action="..."&gt;</code>.',content:`
      ${i('<form class="u-flex u-flex-col u-gap-4">'+o({legend:"Your details",content:m({cols:2,gap:"md",content:t({name:"first",label:"First name",required:!0})+t({name:"last",label:"Last name",required:!0})})+t({name:"email",label:"Email address",type:"email",required:!0})})+o({legend:"Message",content:c({name:"message",label:"Tell us about your project",rows:4,required:!0})})+u({label:"Send message",type:"submit",variant:"primary",fullWidth:!0})+"</form>",`import { fieldset, grid, input, textarea, button } from '@invisibleloop/pulse/ui'

\`<form data-action="submit" class="u-flex u-flex-col u-gap-4">
  \${fieldset({ legend: 'Your details', content: \`
    \${grid({ cols: 2, gap: 'md', content: \`
      \${input({ name: 'first', label: 'First name', required: true })}
      \${input({ name: 'last',  label: 'Last name',  required: true })}
    \` })}
    \${input({ name: 'email', label: 'Email address', type: 'email', required: true })}
  \` })}
  \${fieldset({ legend: 'Message', content: \`
    \${textarea({ name: 'message', label: 'Tell us about your project', rows: 4, required: true })}
  \` })}
  \${button({ label: 'Send message', type: 'submit', variant: 'primary', fullWidth: true })}
</form>\``)}

      ${l(["Prop","Type","Default",""],[["<code>legend</code>","string","\u2014","Group label \u2014 rendered as <code>&lt;legend&gt;</code>, announced by screen readers on focus"],["<code>content</code>","string","\u2014","Raw HTML slot \u2014 input(), select(), textarea(), grid(), etc."],["<code>gap</code>","string","md","Vertical gap between fields: xs / sm / md / lg"],["<code>class</code>","string","\u2014","Extra classes on the <code>&lt;fieldset&gt;</code> element"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",r(a,e,window.__PULSE_SERVER__||{},{ssr:!0}),n(e,r));var v=a;export{v as default};
