function o(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function r({content:e="",filename:s="",lang:c="",class:d=""}={}){let a=["ui-code-window",d].filter(Boolean).join(" ");return`<div class="${o(a)}" role="region"${s?` aria-label="${o(s)}"`:""}>
  <div class="ui-code-window-chrome" aria-hidden="true">
    <span class="ui-code-window-dot"></span>
    <span class="ui-code-window-dot"></span>
    <span class="ui-code-window-dot"></span>
    ${s?`<span class="ui-code-window-filename">${o(s)}</span>`:""}
    ${c?`<span class="ui-code-window-lang">${o(c)}</span>`:""}
  </div>
  <pre class="ui-code-window-pre"><code class="ui-code-window-code">${e}</code></pre>
</div>`}export{o as a,r as b};
