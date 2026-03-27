import{a as n,b as u}from"./runtime-5Y7ESAIB.js";var o={route:"/counter",hydrate:"/src/pages/counter.js",meta:{title:"Counter \u2014 Pulse Benchmark",styles:["/pulse.css"]},state:{count:0},constraints:{count:{min:0,max:10}},mutations:{increment:t=>({count:t.count+1}),decrement:t=>({count:t.count-1})},view:(t,r)=>`
    <main id="main-content">
      <p>${r.greeting}</p>
      <p>Count: ${t.count}</p>
      <button data-event="decrement">\u2212</button>
      <button data-event="increment">+</button>
    </main>
  `};var e=document.getElementById("pulse-root");e&&!e.dataset.pulseMounted&&(e.dataset.pulseMounted="1",n(o,e,window.__PULSE_SERVER__||{},{ssr:!0}),u(e,n));var m=o;export{m as default};
