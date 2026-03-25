import{a as o,b as p}from"./runtime-O3PCG43G.js";import{Ja as t,a as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a,e as d,h as c}from"./runtime-OFZXJMSU.js";import{a as r,b as s}from"./runtime-B73WLANC.js";var{prev:l,next:g}=a("/components/pricing"),n={route:"/components/pricing",meta:{title:"Pricing \u2014 Pulse Docs",description:"Pricing component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>p({currentHref:"/components/pricing",prev:l,next:g,name:"pricing",description:"Single plan card with a feature list and CTA. Set <code>highlighted: true</code> on the recommended plan \u2014 it gets an accent border and a floating <code>badge</code> label.",content:`
      ${o(t({name:"Pro",price:"$9",period:"/month",description:"For growing teams",features:["Unlimited pages","Priority support","Custom domain"],highlighted:!0,badge:"Most popular",action:e({label:"Get started",fullWidth:!0})}),`pricing({
  name:        'Pro',
  price:       '$9',
  period:      '/month',
  description: 'For growing teams',
  features:    ['Unlimited pages', 'Priority support', 'Custom domain'],
  highlighted: true,
  badge:       'Most popular',
  action:      button({ label: 'Get started', fullWidth: true }),
})`,{col:!0})}

      ${d("multi-plan","Multi-plan layout")}
      ${o('<div class="ui-pricing-grid ui-pricing-grid--cols-3">'+t({name:"Free",price:"$0",period:"/month",description:"For personal projects",features:["3 pages","Community support"],action:e({label:"Get started",variant:"secondary",fullWidth:!0})})+t({name:"Pro",price:"$9",period:"/month",description:"For growing teams",features:["Unlimited pages","Priority support","Custom domain"],highlighted:!0,badge:"Most popular",action:e({label:"Get started",fullWidth:!0})})+t({name:"Team",price:"$29",period:"/month",description:"For large organisations",features:["Everything in Pro","SSO","SLA"],action:e({label:"Get started",variant:"secondary",fullWidth:!0})})+"</div>",`<div class="ui-pricing-grid ui-pricing-grid--cols-3">
  \${pricing({ name: 'Free',  price: '$0',  ... })}
  \${pricing({ name: 'Pro',   price: '$9',  highlighted: true, badge: 'Most popular', ... })}
  \${pricing({ name: 'Team',  price: '$29', ... })}
</div>`)}

      ${c(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014",""],["<code>level</code>","number","3","Heading tag for the plan name (1\u20136). Visual style is unchanged."],["<code>price</code>","string","\u2014",'Formatted string \u2014 e.g. "$9", "Free"'],["<code>period</code>","string","\u2014",'e.g. "/month", "/year"'],["<code>description</code>","string","\u2014",""],["<code>features</code>","string[]","[]","List of feature strings"],["<code>action</code>","string (HTML)","\u2014","Raw HTML slot \u2014 typically a button()"],["<code>highlighted</code>","boolean","false","Accent border + elevated appearance"],["<code>badge</code>","string","\u2014","Floating label above the card"]])}
    `})};var i=document.getElementById("pulse-root");i&&!i.dataset.pulseMounted&&(i.dataset.pulseMounted="1",r(n,i,window.__PULSE_SERVER__||{},{ssr:!0}),s(i,r));var v=n;export{v as default};
