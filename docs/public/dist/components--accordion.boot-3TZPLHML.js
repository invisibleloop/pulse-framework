import{a as i,b as a}from"./runtime-O3PCG43G.js";import{Ka as c}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n,h as r}from"./runtime-OFZXJMSU.js";import{a as o,b as s}from"./runtime-B73WLANC.js";var{prev:d,next:p}=n("/components/accordion"),t={route:"/components/accordion",meta:{title:"Accordion \u2014 Pulse Docs",description:"Accordion component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>a({currentHref:"/components/accordion",prev:d,next:p,name:"accordion",description:"Collapsible FAQ items built on native <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> \u2014 no JavaScript required. The open/close animation is handled entirely by the browser.",content:`
      ${i(c({items:[{question:"Is there a free plan?",answer:"Yes \u2014 the free plan includes up to 3 pages and community support, with no credit card required."},{question:"Can I cancel anytime?",answer:"Absolutely. There are no contracts or lock-in periods. Cancel from your account settings at any time."},{question:"Does it work on older devices?",answer:"The app supports iOS 14+ and Android 8+, covering over 97% of active devices."}]}),`accordion({
  items: [
    { question: 'Is there a free plan?',     answer: 'Yes \u2014 up to 3 pages, no card required.' },
    { question: 'Can I cancel anytime?',     answer: 'No contracts. Cancel from your account.' },
    { question: 'Works on older devices?',   answer: 'iOS 14+ and Android 8+.' },
  ],
})`)}

      ${r(["Prop","Type","Default",""],[["<code>items</code>","array","[]","<code>{ question: string, answer: string }[]</code>"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",o(t,e,window.__PULSE_SERVER__||{},{ssr:!0}),s(e,o));var q=t;export{q as default};
