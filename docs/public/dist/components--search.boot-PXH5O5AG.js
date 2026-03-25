import{a as d,b as l}from"./runtime-ZJ4FXT5O.js";import{xa as o}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as c,h as n}from"./runtime-L2HNXIHW.js";import{a as t,b as r}from"./runtime-B73WLANC.js";var{prev:s,next:i}=c("/components/search"),a={route:"/components/search",meta:{title:"Search \u2014 Pulse Docs",description:"Search input component with icon, debounce binding, and clear button.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>l({currentHref:"/components/search",prev:s,next:i,name:"search",description:"A search input with a built-in icon and optional clear button. Handles the native browser cancel button, <code>data-event</code> binding, and debounce in one component. Use this instead of <code>input({ type: 'search' })</code>.",content:`
      ${d(o({name:"q",label:"Search",placeholder:"Search products\u2026"})+o({name:"q2",label:"Search",placeholder:"Search\u2026",value:"lamp",clearEvent:"clearSearch",labelHidden:!0}),`search({ name: 'q', label: 'Search', placeholder: 'Search products\u2026' })

// With value, clear button, and hidden label:
search({
  name:        'q',
  label:       'Search',
  labelHidden: true,
  placeholder: 'Search\u2026',
  value:       state.search,
  event:       'input:setSearch',
  debounce:    200,
  clearEvent:  'clearSearch',
})`,{col:!0})}

      ${n(["Prop","Type","Default",""],[["<code>name</code>","string","\u2014","Field name and id base"],["<code>label</code>","string","\u2014","Label text \u2014 always provide for accessibility"],["<code>labelHidden</code>","boolean","false","Hides label visually; still read by screen readers"],["<code>placeholder</code>","string","\u2014",""],["<code>value</code>","string","\u2014","Current value \u2014 controls clear button visibility"],["<code>event</code>","string","\u2014","<code>data-event</code> binding, e.g. <code>'input:setSearch'</code>"],["<code>debounce</code>","number","200","Debounce delay in ms \u2014 only applied when <code>event</code> is set"],["<code>clearEvent</code>","string","\u2014","Click event for the \xD7 button \u2014 only shown when <code>value</code> is non-empty"],["<code>disabled</code>","boolean","false",""],["<code>id</code>","string","\u2014","Override generated id"],["<code>class</code>","string","\u2014","Extra classes on the wrapper"],["<code>attrs</code>","object","{}","Extra attributes on the <code>&lt;input&gt;</code>"]])}
    `})};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",t(a,e,window.__PULSE_SERVER__||{},{ssr:!0}),r(e,t));var S=a;export{S as default};
