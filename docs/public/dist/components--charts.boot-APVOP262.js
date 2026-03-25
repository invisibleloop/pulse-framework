import{a as e,b as m}from"./runtime-O3PCG43G.js";import{Ca as n,Pa as i,c as l,ib as t,jb as r,kb as u,lb as a}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as p,h as o}from"./runtime-OFZXJMSU.js";import{a as d,b as v}from"./runtime-B73WLANC.js";var{prev:g,next:f}=p("/components/charts"),c=[{label:"Jan",value:42},{label:"Feb",value:78},{label:"Mar",value:55},{label:"Apr",value:91},{label:"May",value:63},{label:"Jun",value:84}],h=[{label:"Mon",value:1200},{label:"Tue",value:1850},{label:"Wed",value:1540},{label:"Thu",value:2100},{label:"Fri",value:1760},{label:"Sat",value:890},{label:"Sun",value:720}],b={route:"/components/charts",meta:{title:"Charts \u2014 Pulse Docs",description:"Server-rendered SVG charts for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>m({currentHref:"/components/charts",prev:g,next:f,name:"charts",description:"Server-rendered SVG charts \u2014 no JavaScript, no external library. Pure functions that return SVG strings, composable with any layout component. All colours use design tokens and respond to light/dark theme.",content:`

      <h2 class="doc-h2" id="bar">Bar chart</h2>
      <p>Vertical bars with optional grid, value labels, and a zero baseline. All colour variants available.</p>
      ${e(t({data:c,color:"accent"}),`barChart({
  data: [
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 78 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 91 },
    { label: 'May', value: 63 },
    { label: 'Jun', value: 84 },
  ],
  color: 'accent',
})`)}

      <h3 class="doc-h3">With value labels</h3>
      ${e(t({data:c,color:"success",showValues:!0}),"barChart({ data, color: 'success', showValues: true })")}

      <h3 class="doc-h3">Large dataset with tight gap</h3>
      ${e(t({data:h,color:"blue",gap:.15}),"barChart({ data: traffic, color: 'blue', gap: 0.15 })")}

      <h3 class="doc-h3">Negative values</h3>
      ${e(t({data:[{label:"Q1",value:24},{label:"Q2",value:-8},{label:"Q3",value:41},{label:"Q4",value:-15}],color:"warning",showValues:!0}),`barChart({
  data: [
    { label: 'Q1', value:  24 },
    { label: 'Q2', value: -8  },
    { label: 'Q3', value:  41 },
    { label: 'Q4', value: -15 },
  ],
  color: 'warning',
  showValues: true,
})`)}

      <h2 class="doc-h2" id="line">Line chart</h2>
      <p>Connected data points with optional dots, area fill, and grid lines.</p>
      ${e(r({data:c,color:"accent"}),`lineChart({
  data: [
    { label: 'Jan', value: 42 },
    ...
  ],
  color: 'accent',
})`)}

      <h3 class="doc-h3">With area fill</h3>
      ${e(r({data:c,color:"accent",area:!0}),"lineChart({ data, color: 'accent', area: true })")}

      <h3 class="doc-h3">No dots, area fill, success colour</h3>
      ${e(r({data:h,color:"success",area:!0,showDots:!1}),"lineChart({ data, color: 'success', area: true, showDots: false })")}

      <h2 class="doc-h2" id="donut">Donut chart</h2>
      <p>Ring chart with multiple segments. Each item can override its colour. Pass <code>label</code> and <code>sublabel</code> for a centred annotation.</p>
      ${e('<div style="display:flex;justify-content:center">'+u({label:"73%",sublabel:"satisfied",data:[{label:"Satisfied",value:73,color:"success"},{label:"Neutral",value:18,color:"muted"},{label:"Unsatisfied",value:9,color:"error"}]})+"</div>",`donutChart({
  label:    '73%',
  sublabel: 'satisfied',
  data: [
    { label: 'Satisfied',   value: 73, color: 'success' },
    { label: 'Neutral',     value: 18, color: 'muted'   },
    { label: 'Unsatisfied', value: 9,  color: 'error'   },
  ],
})`)}

      <h3 class="doc-h3">Thinner ring</h3>
      ${e('<div style="display:flex;justify-content:center">'+u({size:180,thickness:22,label:"4",sublabel:"segments",data:[{label:"A",value:40,color:"accent"},{label:"B",value:30,color:"blue"},{label:"C",value:20,color:"success"},{label:"D",value:10,color:"warning"}]})+"</div>",`donutChart({
  size: 180, thickness: 22,
  label: '4', sublabel: 'segments',
  data: [
    { label: 'A', value: 40, color: 'accent'  },
    { label: 'B', value: 30, color: 'blue'    },
    { label: 'C', value: 20, color: 'success' },
    { label: 'D', value: 10, color: 'warning' },
  ],
})`)}

      <h2 class="doc-h2" id="sparkline">Sparkline</h2>
      <p>Minimal inline trend line \u2014 pass a plain array of numbers. Designed to sit alongside <code>stat()</code> tiles or inside table cells.</p>
      ${e('<div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">'+a({data:[12,18,14,22,19,28,24,31],color:"accent",area:!0})+a({data:[31,24,28,19,22,14,18,12],color:"error",area:!0})+a({data:[12,18,14,22,19,28,24,31],color:"success",area:!1})+"</div>",`sparkline({ data: [12,18,14,22,19,28,24,31], color: 'accent', area: true })
sparkline({ data: [31,24,28,19,22,14,18,12], color: 'error',  area: true })`)}

      <h2 class="doc-h2" id="composition">Composition</h2>
      <p>Charts compose with <code>card()</code>, <code>stat()</code>, <code>grid()</code> \u2014 drop any chart into any content slot.</p>
      ${e(i({cols:2,gap:"md",content:l({title:"Monthly signups",content:t({data:c,color:"accent",height:180})})+l({title:"Daily traffic",content:r({data:h,color:"blue",area:!0,height:180})})}),`grid({
  cols: 2,
  content:
    card({ title: 'Monthly signups', content: barChart({ data, height: 180 }) }) +
    card({ title: 'Daily traffic',   content: lineChart({ data, color: 'blue', area: true, height: 180 }) }),
})`)}

      <h3 class="doc-h3">Sparkline in stat tiles</h3>
      ${e(i({cols:3,gap:"md",content:l({content:n({label:"Revenue",value:"$18.2k",change:"+12%",trend:"up"})+`<div style="margin-top:.75rem">${a({data:[8,11,9,14,12,16,15,18],width:"100%",color:"success",area:!0})}</div>`})+l({content:n({label:"Users",value:"4,821",change:"+8.4%",trend:"up"})+`<div style="margin-top:.75rem">${a({data:[22,28,24,31,27,34,30,38],width:"100%",color:"accent",area:!0})}</div>`})+l({content:n({label:"Churn",value:"2.1%",change:"\u22120.3%",trend:"down"})+`<div style="margin-top:.75rem">${a({data:[8,6,7,5,6,4,5,3],width:"100%",color:"error",area:!0})}</div>`})}),`card({
  content: stat({ label: 'Revenue', value: '$18.2k', change: '+12%', trend: 'up' }) +
    \`<div style="margin-top:.75rem">\${sparkline({ data, color: 'success', area: true })}</div>\`,
})`)}

      <h2 class="doc-h2" id="props">Props</h2>

      <h3 class="doc-h3">barChart()</h3>
      ${o(["Prop","Type","Default",""],[["<code>data</code>","array","\u2014","<code>{ label, value }[]</code>"],["<code>height</code>","number","220","SVG height in px"],["<code>color</code>","string","'accent'","accent \xB7 success \xB7 warning \xB7 error \xB7 blue \xB7 muted"],["<code>showValues</code>","boolean","false","Value labels above each bar"],["<code>showGrid</code>","boolean","true","Horizontal grid lines"],["<code>gap</code>","number","0.25","Gap between bars as fraction 0\u20130.9"]])}

      <h3 class="doc-h3" style="margin-top:2rem">lineChart()</h3>
      ${o(["Prop","Type","Default",""],[["<code>data</code>","array","\u2014","<code>{ label, value }[]</code>"],["<code>height</code>","number","220","SVG height in px"],["<code>color</code>","string","'accent'","accent \xB7 success \xB7 warning \xB7 error \xB7 blue \xB7 muted"],["<code>area</code>","boolean","false","Fill area under the line"],["<code>showDots</code>","boolean","true","Dots at each data point"],["<code>showGrid</code>","boolean","true","Horizontal grid lines"]])}

      <h3 class="doc-h3" style="margin-top:2rem">donutChart()</h3>
      ${o(["Prop","Type","Default",""],[["<code>data</code>","array","\u2014","<code>{ label, value, color? }[]</code> \u2014 color per segment"],["<code>size</code>","number","200","Diameter in px"],["<code>thickness</code>","number","40","Ring thickness in px"],["<code>label</code>","string","\u2014","Large centre text"],["<code>sublabel</code>","string","\u2014","Smaller text below centre label"]])}

      <h3 class="doc-h3" style="margin-top:2rem">sparkline()</h3>
      ${o(["Prop","Type","Default",""],[["<code>data</code>","number[]","\u2014","Plain array of numbers"],["<code>width</code>","number","80","SVG width in px"],["<code>height</code>","number","32","SVG height in px"],["<code>color</code>","string","'accent'","accent \xB7 success \xB7 warning \xB7 error \xB7 blue \xB7 muted"],["<code>area</code>","boolean","false","Fill area under the line"]])}
    `})};var s=document.getElementById("pulse-root");s&&!s.dataset.pulseMounted&&(s.dataset.pulseMounted="1",d(b,s,window.__PULSE_SERVER__||{},{ssr:!0}),v(s,d));var V=b;export{V as default};
