import{a as n,b as d}from"./runtime-O3PCG43G.js";import{Ha as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as r,h as a}from"./runtime-OFZXJMSU.js";import{a as t,b as s}from"./runtime-B73WLANC.js";var{prev:m,next:c}=r("/components/testimonial"),i={route:"/components/testimonial",meta:{title:"Testimonial \u2014 Pulse Docs",description:"Testimonial component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/testimonial",prev:m,next:c,name:"testimonial",description:"Customer quote card with star rating, avatar, and attribution. When <code>src</code> is omitted the avatar shows initials derived from <code>name</code>.",content:`
      ${n('<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">'+o({quote:"This is the fastest app I have ever used. It replaced three tools I was paying for.",name:"Alice Marsh",role:"Head of Product, Stride",rating:5})+o({quote:"Switched from the competition six months ago and have not looked back once.",name:"Ben Carter",role:"Founder, Loopback",rating:5})+"</div>",`testimonial({
  quote:  'This is the fastest app I have ever used.',
  name:   'Alice Marsh',
  role:   'Head of Product, Stride',
  rating: 5,
  src:    user.avatarUrl,  // optional \u2014 falls back to initials
})`)}

      ${a(["Prop","Type","Default",""],[["<code>quote</code>","string","\u2014",""],["<code>name</code>","string","\u2014","Author name \u2014 also used for avatar initials"],["<code>role</code>","string","\u2014",""],["<code>src</code>","string","\u2014","Avatar image URL; omit to show initials"],["<code>rating</code>","number","0","1\u20135 stars; omit or set 0 to hide"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(i,e,window.__PULSE_SERVER__||{},{ssr:!0}),s(e,t));var P=i;export{P as default};
