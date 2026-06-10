/**
 * Pulse UI — Drop Cap
 *
 * First-letter drop cap for editorial openings. Wraps the first
 * letter or word of a paragraph.
 *
 * @param {object} opts
 * @param {string} opts.letter - The drop cap letter or word
 * @param {string} opts.content - The rest of the paragraph text
 * @param {number} opts.lines - How many lines tall (default 3)
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

export function dropCap({
  letter     = '',
  content    = '',
  lines      = 3,
  class: cls = '',
} = {}) {
  if (!letter) return content ? `<p>${e(content)}</p>` : ''

  const classes = ['ui-drop-cap', cls].filter(Boolean).join(' ')
  
  return `<p class="${e(classes)}">
  <span class="ui-drop-cap-letter" style="font-size:${+(lines * 1.2).toFixed(2)}em" aria-hidden="true">${e(letter)}</span>${e(content)}
</p>`
}
