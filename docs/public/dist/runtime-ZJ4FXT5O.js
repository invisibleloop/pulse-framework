import{a as c}from"./runtime-QFURDKA2.js";import{b as d,c as n,d as s,g as a}from"./runtime-L2HNXIHW.js";function v(e,o,{col:t=!1,scroll:l=!1}={}){return`<div class="component-demo">
  <div class="${["demo-preview",t?"demo-preview--col":"",l?"demo-preview--scroll":""].filter(Boolean).join(" ")}"><button class="demo-theme-toggle" aria-label="Toggle light/dark theme" title="Toggle theme">
    <svg class="demo-theme-toggle__dark" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
    <svg class="demo-theme-toggle__light" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button><div class="demo-preview-inner">${e}</div></div>
  <div class="demo-code">${a(c(o,"js"))}</div>
</div>`}function m({currentHref:e,name:o,description:t,content:l,prev:r=null,next:i=null}){return d({currentHref:e,prev:r,next:i,content:`
      ${n(o)}
      ${s(t)}
      ${l}
    `})}export{v as a,m as b};
