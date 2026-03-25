/**
 * Pulse UI — Code Window
 *
 * A code block with macOS-style window chrome — three coloured dots and an
 * optional filename label. The content slot accepts pre-highlighted HTML
 * (spans with syntax-token classes) or plain text.
 *
 * Interactive syntax highlighting is out of scope — pass pre-rendered HTML
 * or plain text. The component handles all the chrome, layout, scroll, and
 * monospace typography.
 *
 * @param {object} opts
 * @param {string} opts.content   - Raw HTML slot — highlighted code HTML or plain text
 * @param {string} opts.filename  - Filename shown in the chrome bar (e.g. 'home.js')
 * @param {string} opts.lang      - Language label shown on the right of the chrome (e.g. 'JavaScript')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function codeWindow({
  content    = '',
  filename   = '',
  lang       = '',
  class: cls = '',
} = {}) {
  const classes = ['ui-code-window', cls].filter(Boolean).join(' ')

  return `<div class="${e(classes)}" role="region"${filename ? ` aria-label="${e(filename)}"` : ''}>
  <div class="ui-code-window-chrome" aria-hidden="true">
    <span class="ui-code-window-dot"></span>
    <span class="ui-code-window-dot"></span>
    <span class="ui-code-window-dot"></span>
    ${filename ? `<span class="ui-code-window-filename">${e(filename)}</span>` : ''}
    ${lang     ? `<span class="ui-code-window-lang">${e(lang)}</span>` : ''}
  </div>
  <pre class="ui-code-window-pre"><code class="ui-code-window-code">${content}</code></pre>
</div>`
}
