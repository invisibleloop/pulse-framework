import{a as t,b as d}from"./runtime-ZJ4FXT5O.js";import{c as r,ub as e}from"./runtime-UVPXO4IR.js";import"./runtime-VMJA3Z4N.js";import"./runtime-QFURDKA2.js";import{a as n,h as i}from"./runtime-L2HNXIHW.js";import{a as l,b as c}from"./runtime-B73WLANC.js";var{prev:h,next:u}=n("/components/heading"),a={route:"/components/heading",meta:{title:"Heading \u2014 Pulse Docs",description:"Styled semantic heading component for Pulse UI.",styles:["/pulse-ui.css","/docs.css"]},state:{},view:()=>d({currentHref:"/components/heading",prev:h,next:u,name:"heading",description:"Styled semantic heading. Renders the correct HTML tag (<code>h1</code>\u2013<code>h6</code>) with consistent typography tokens. Use this instead of raw heading tags so you get the right visual style without remembering utility classes.",content:`

      <h2 class="doc-h2" id="levels">All levels</h2>
      <p>Each level has a default visual size. The semantic tag and visual size are independent \u2014 see <a href="#size-override">size override</a> below.</p>
      ${t([1,2,3,4,5,6].map(s=>e({level:s,text:`Heading level ${s}`})).join(""),`heading({ level: 1, text: 'Page title' })
heading({ level: 2, text: 'Section title' })
heading({ level: 3, text: 'Subsection' })
heading({ level: 4, text: 'Card heading' })
heading({ level: 5, text: 'Label' })
heading({ level: 6, text: 'Caption' })`,{col:!0})}

      <h2 class="doc-h2" id="size-override">Size override</h2>
      <p>The <code>size</code> prop lets you use a different visual scale than the default for that level. Useful when you need the correct semantic structure for SEO or accessibility but want a different visual weight.</p>
      ${t([e({level:2,text:"Semantic h2, looks like h4",size:"xl"}),e({level:3,text:"Semantic h3, extra large",size:"4xl"})].join(""),`// h2 for structure, but visually smaller
heading({ level: 2, text: 'Related articles', size: 'xl' })

// h3 that needs to be visually prominent
heading({ level: 3, text: 'Featured', size: '4xl' })`,{col:!0})}

      <h2 class="doc-h2" id="color">Color</h2>
      ${t([e({level:3,text:"Default colour"}),e({level:3,text:"Muted \u2014 for secondary labels",color:"muted"}),e({level:3,text:"Accent \u2014 for highlights",color:"accent"})].join(""),`heading({ level: 3, text: 'Default colour' })
heading({ level: 3, text: 'Muted \u2014 for secondary labels', color: 'muted' })
heading({ level: 3, text: 'Accent \u2014 for highlights', color: 'accent' })`,{col:!0})}

      <h2 class="doc-h2" id="spacing">Spacing</h2>
      <p><code>heading()</code> adds no margin. Use <code>u-mt-*</code> and <code>u-mb-*</code> utility classes to control spacing in context.</p>
      ${t(r({content:`
          ${e({level:2,text:"Account settings",class:"u-mb-2"})}
          <p class="u-text-muted u-text-sm">Manage your profile and preferences.</p>
        `}),`card({ content: \`
  \${heading({ level: 2, text: 'Account settings', class: 'u-mb-2' })}
  <p class="u-text-muted u-text-sm">Manage your profile and preferences.</p>
\`})`,{col:!0})}

      <h2 class="doc-h2" id="balance">Preventing orphans</h2>
      <p>When a heading wraps across lines, the last line can be left with a single short word \u2014 an orphan. The <code>balance</code> prop adds <code>text-wrap: balance</code>, which distributes text evenly across all lines so no word is stranded.</p>
      ${t([e({level:2,text:"The quick brown fox jumps over the lazy dog tonight"}),e({level:2,text:"The quick brown fox jumps over the lazy dog tonight",balance:!0})].join('<p class="u-text-muted u-text-sm u-mt-2 u-mb-4">\u2191 without balance \u2014 \u2193 with balance: true</p>'),`// Without \u2014 last line may have a single word
heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight' })

// With \u2014 text distributed evenly across lines
heading({ level: 2, text: 'The quick brown fox jumps over the lazy dog tonight', balance: true })`,{col:!0})}

      ${i(["Prop","Type","Default",""],[["<code>level</code>","number (1\u20136)","2","Controls both the HTML tag and the default visual size"],["<code>text</code>","string","\u2014","Heading text \u2014 escaped automatically"],["<code>size</code>","<code>xs | sm | base | lg | xl | 2xl | 3xl | 4xl</code>","\u2014","Override the visual font size independently of the semantic level. Defaults: h1=4xl, h2=3xl, h3=2xl, h4=xl, h5=base, h6=sm"],["<code>color</code>","<code>default | muted | accent</code>","<code>default</code>","Text colour token"],["<code>balance</code>","boolean","<code>false</code>","Adds <code>text-wrap: balance</code> \u2014 prevents orphaned words on the last line when the heading wraps"],["<code>class</code>","string","\u2014","Extra classes \u2014 use for spacing utilities such as <code>u-mb-4</code>"]])}
    `})};var o=document.getElementById("pulse-root");o&&!o.dataset.pulseMounted&&(o.dataset.pulseMounted="1",l(a,o,window.__PULSE_SERVER__||{},{ssr:!0}),c(o,l));var w=a;export{w as default};
