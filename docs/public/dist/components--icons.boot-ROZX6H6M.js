import{a as n,b as x}from"./runtime-O3PCG43G.js";import{$ as ln,A as b,B as X,C as l,D as V,E as C,F as N,G as O,H as Z,I as _,Ia as o,J as W,K as j,L as J,M as t,N as K,O as z,P as Q,Q as Y,R as nn,S as en,T as on,U as cn,V as an,W as rn,X as tn,Y as d,Z as sn,_ as S,a as i,aa as dn,ba as pn,ca as mn,da as un,e as P,ea as p,f as U,fa as gn,g as $,ga as fn,h as D,ha as hn,i as M,ia as bn,j as L,ja as Cn,k as A,ka as zn,l as q,la as Sn,m as E,ma as wn,n as H,na as vn,o as T,oa as yn,p as I,pa as m,q as R,qa as e,r as c,ra as kn,s as g,sa as xn,t as a,ta as Pn,u as B,ua as Un,v as r,va as $n,w as f,wa as Dn,x as F,y as G,z as h}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as v,h as y}from"./runtime-OFZXJMSU.js";import{a as u,b as k}from"./runtime-B73WLANC.js";var{prev:En,next:Hn}=v("/components/icons"),Tn=[{group:"Navigation & Direction",icons:[{name:"iconArrowLeft",fn:P},{name:"iconArrowRight",fn:U},{name:"iconArrowUp",fn:$},{name:"iconArrowDown",fn:D},{name:"iconChevronLeft",fn:M},{name:"iconChevronRight",fn:L},{name:"iconChevronUp",fn:A},{name:"iconChevronDown",fn:q},{name:"iconExternalLink",fn:E},{name:"iconMenu",fn:H},{name:"iconX",fn:T},{name:"iconMoreHorizontal",fn:I},{name:"iconMoreVertical",fn:R}]},{group:"Status",icons:[{name:"iconCheck",fn:c},{name:"iconCheckCircle",fn:g},{name:"iconXCircle",fn:a},{name:"iconAlertCircle",fn:B},{name:"iconAlertTriangle",fn:r},{name:"iconInfo",fn:f}]},{group:"Actions",icons:[{name:"iconPlus",fn:F},{name:"iconMinus",fn:G},{name:"iconEdit",fn:h},{name:"iconTrash",fn:b},{name:"iconCopy",fn:X},{name:"iconSearch",fn:l},{name:"iconFilter",fn:V},{name:"iconDownload",fn:C},{name:"iconUpload",fn:N},{name:"iconRefresh",fn:O},{name:"iconSend",fn:Z}]},{group:"UI Controls",icons:[{name:"iconEye",fn:_},{name:"iconEyeOff",fn:W},{name:"iconLock",fn:j},{name:"iconUnlock",fn:J},{name:"iconSettings",fn:t},{name:"iconBell",fn:K}]},{group:"People & Communication",icons:[{name:"iconUser",fn:z},{name:"iconUsers",fn:Q},{name:"iconMail",fn:Y},{name:"iconMessageSquare",fn:nn}]},{group:"Navigation & Pages",icons:[{name:"iconHome",fn:en},{name:"iconMapPin",fn:Dn},{name:"iconLogOut",fn:on},{name:"iconLogIn",fn:cn}]},{group:"Content & Files",icons:[{name:"iconFile",fn:an},{name:"iconImage",fn:rn},{name:"iconLink",fn:tn},{name:"iconCode",fn:d},{name:"iconCalendar",fn:sn},{name:"iconClock",fn:S},{name:"iconBookmark",fn:ln},{name:"iconTag",fn:dn}]},{group:"Media & Rating",icons:[{name:"iconPlay",fn:pn},{name:"iconPause",fn:mn},{name:"iconVolume",fn:un},{name:"iconStar",fn:p},{name:"iconHeart",fn:gn}]},{group:"Devices",icons:[{name:"iconPhone",fn},{name:"iconGamepad",fn:hn}]},{group:"Hand Pointers",icons:[{name:"iconHandPointUp",fn:bn},{name:"iconHandPointDown",fn:Cn},{name:"iconHandPointLeft",fn:zn},{name:"iconHandPointRight",fn:Sn}]},{group:"Misc",icons:[{name:"iconGlobe",fn:yn},{name:"iconShield",fn:m},{name:"iconZap",fn:e},{name:"iconTrendingUp",fn:kn},{name:"iconTrendingDown",fn:xn},{name:"iconLoader",fn:Pn},{name:"iconGrid",fn:Un},{name:"iconBug",fn:$n}]},{group:"Theme",icons:[{name:"iconSun",fn:wn},{name:"iconMoon",fn:vn}]}];function In(){return Tn.map(({group:Mn,icons:Ln})=>`
    <h3 class="doc-h3" style="margin-top:2rem">${Mn}</h3>
    <div class="icon-grid">
      ${Ln.map(({name:An,fn:qn})=>`
        <div class="icon-grid-item">
          <div class="icon-grid-preview">${qn({size:20})}</div>
          <span class="icon-grid-name">${An}</span>
        </div>
      `).join("")}
    </div>
  `).join("")}var w={route:"/components/icons",meta:{title:"Icons \u2014 Pulse Docs",description:"Built-in icon set for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>x({currentHref:"/components/icons",prev:En,next:Hn,name:"icons",description:'55 curated icons. All are pure functions returning an SVG string \u2014 no external library, no DOM dependency, tree-shakeable. Style: 24\xD724 viewBox, <code>stroke="currentColor"</code>, compatible with any colour token.',content:`

      <h2 class="doc-h2" id="usage">Usage</h2>
      <p>Import the icon functions you need alongside other components. Call each as a function \u2014 optionally pass <code>size</code> and <code>class</code>.</p>
      ${n('<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">'+c({size:20})+l({size:20})+z({size:20})+p({size:20})+e({size:20})+t({size:20})+"</div>",`import { iconCheck, iconSearch, iconUser } from '@invisibleloop/pulse/ui'

// Default size (16px)
iconCheck()

// Custom size
iconSearch({ size: 20 })

// With extra class
iconUser({ size: 20, class: 'u-text-accent' })`)}

      <h2 class="doc-h2" id="with-button">With button</h2>
      <p>Pass an icon into the <code>icon</code> prop of <code>button()</code>.</p>
      ${n('<div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center">'+i({label:"Download",variant:"primary",icon:C({size:14})})+i({label:"Edit",variant:"secondary",icon:h({size:14})})+i({label:"Delete",variant:"danger",icon:b({size:14})})+i({label:"Search",variant:"ghost",icon:l({size:14})})+"</div>",`button({ label: 'Download', variant: 'primary',   icon: iconDownload({ size: 14 }) })
button({ label: 'Edit',     variant: 'secondary', icon: iconEdit({ size: 14 }) })
button({ label: 'Delete',   variant: 'danger',    icon: iconTrash({ size: 14 }) })
button({ label: 'Search',   variant: 'ghost',     icon: iconSearch({ size: 14 }) })`)}

      <h2 class="doc-h2" id="with-feature">With feature</h2>
      <p>Icons compose naturally into the <code>feature()</code> icon slot.</p>
      ${n('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">'+o({icon:e({size:20}),title:"Fast",description:"Streaming SSR. No build step."})+o({icon:m({size:20}),title:"Secure",description:"Security headers on every response."})+o({icon:d({size:20}),title:"Simple",description:"Plain JS objects, no JSX."})+"</div>",`feature({ icon: iconZap({ size: 20 }),    title: 'Fast',   description: '...' })
feature({ icon: iconShield({ size: 20 }), title: 'Secure', description: '...' })
feature({ icon: iconCode({ size: 20 }),   title: 'Simple', description: '...' })`)}

      <h2 class="doc-h2" id="background">Background</h2>
      <p>Add <code>bg: 'circle'</code> or <code>bg: 'square'</code> to wrap the icon in a tinted background. Use <code>bgColor</code> to pick the colour \u2014 defaults to <code>'accent'</code>.</p>

      <h3 class="doc-h3">Circle</h3>
      ${n('<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">'+e({size:20,bg:"circle",bgColor:"accent"})+c({size:20,bg:"circle",bgColor:"success"})+r({size:20,bg:"circle",bgColor:"warning"})+a({size:20,bg:"circle",bgColor:"error"})+t({size:20,bg:"circle",bgColor:"muted"})+"</div>",`iconZap({          size: 20, bg: 'circle', bgColor: 'accent'  })
iconCheck({        size: 20, bg: 'circle', bgColor: 'success' })
iconAlertTriangle({ size: 20, bg: 'circle', bgColor: 'warning' })
iconXCircle({      size: 20, bg: 'circle', bgColor: 'error'   })
iconSettings({     size: 20, bg: 'circle', bgColor: 'muted'   })`)}

      <h3 class="doc-h3">Square (rounded)</h3>
      ${n('<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">'+e({size:20,bg:"square",bgColor:"accent"})+c({size:20,bg:"square",bgColor:"success"})+r({size:20,bg:"square",bgColor:"warning"})+a({size:20,bg:"square",bgColor:"error"})+t({size:20,bg:"square",bgColor:"muted"})+"</div>","iconZap({ size: 20, bg: 'square', bgColor: 'accent' })")}

      <h3 class="doc-h3">With feature()</h3>
      <p>Pairs naturally with the <code>feature()</code> icon slot at larger sizes.</p>
      ${n('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">'+o({icon:e({size:22,bg:"square",bgColor:"accent"}),title:"Fast",description:"Streaming SSR, zero config."})+o({icon:m({size:22,bg:"square",bgColor:"success"}),title:"Secure",description:"Security headers by default."})+o({icon:d({size:22,bg:"square",bgColor:"muted"}),title:"Simple",description:"Plain JS objects, no JSX."})+"</div>",`feature({ icon: iconZap({    size: 22, bg: 'square', bgColor: 'accent'  }), title: 'Fast',   description: '...' })
feature({ icon: iconShield({ size: 22, bg: 'square', bgColor: 'success' }), title: 'Secure', description: '...' })
feature({ icon: iconCode({   size: 22, bg: 'square', bgColor: 'muted'   }), title: 'Simple', description: '...' })`)}

      <h2 class="doc-h2" id="colour">Colour</h2>
      <p>Icons inherit <code>color</code> from their parent \u2014 use utility classes or CSS tokens to tint them.</p>
      ${n(`<div style="display:flex;gap:1.25rem;align-items:center"><span class="u-text-accent">${p({size:20})}</span><span class="u-text-green">${g({size:20})}</span><span class="u-text-red">${a({size:20})}</span><span class="u-text-yellow">${r({size:20})}</span><span class="u-text-blue">${f({size:20})}</span><span class="u-text-muted">${S({size:20})}</span></div>`,'<span class="u-text-accent">${iconStar({ size: 20 })}</span>\n<span class="u-text-green">${iconCheckCircle({ size: 20 })}</span>\n<span class="u-text-red">${iconXCircle({ size: 20 })}</span>\n<span class="u-text-yellow">${iconAlertTriangle({ size: 20 })}</span>')}

      <h2 class="doc-h2" id="all-icons">All icons</h2>
      <p>Click any icon name to copy the import.</p>

      ${In()}

      ${y(["Prop","Type","Default",""],[["<code>size</code>","number","16","Width and height in px"],["<code>class</code>","string","\u2014","Extra CSS classes (on wrapper when <code>bg</code> is set, otherwise on the SVG)"],["<code>bg</code>","string","\u2014","'circle' \xB7 'square' \u2014 wraps the icon in a tinted background"],["<code>bgColor</code>","string","'accent'","'accent' \xB7 'success' \xB7 'warning' \xB7 'error' \xB7 'muted'"]])}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",u(w,s,window.__PULSE_SERVER__||{},{ssr:!0}),k(s,u));var Zn=w;export{Zn as default};
