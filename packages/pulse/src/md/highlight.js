/**
 * Pulse — Server-side syntax highlighter
 *
 * Character-by-character tokeniser. Zero dependencies, zero client JS.
 * Returns an HTML string of <span class="tok-*"> elements ready to drop
 * inside a <code> element.
 *
 * Supported languages: js, ts, jsx, tsx, html, xml, css, bash/sh, json
 * Unknown languages: plain-text escape (no colour tokens).
 */

const JS_KEYWORDS = new Set([
  'export', 'default', 'import', 'from', 'as',
  'async', 'await', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'of', 'in', 'do', 'break', 'continue',
  'true', 'false', 'null', 'undefined', 'void', 'NaN', 'Infinity',
  'function', 'class', 'new', 'this', 'super', 'typeof', 'instanceof', 'delete',
  'try', 'catch', 'finally', 'throw', 'switch', 'case',
  'type', 'interface', 'enum', 'extends', 'implements', 'static', 'abstract',
])

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function span(cls, text) {
  return `<span class="${cls}">${esc(text)}</span>`
}

export function highlight(code, lang = '') {
  const l = (lang || '').toLowerCase()
  if (l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript' || l === 'jsx' || l === 'tsx' || l === 'mjs' || l === 'cjs')
    return highlightJs(code)
  if (l === 'html' || l === 'xml' || l === 'svg' || l === 'vue' || l === 'svelte')
    return highlightHtml(code)
  if (l === 'css' || l === 'scss' || l === 'less')
    return highlightCss(code)
  if (l === 'bash' || l === 'sh' || l === 'shell' || l === 'zsh')
    return highlightBash(code)
  if (l === 'json' || l === 'jsonc')
    return highlightJson(code)
  // Unknown language — escape only, no colour tokens
  return esc(code)
}

// ---------------------------------------------------------------------------
// JavaScript / TypeScript
// ---------------------------------------------------------------------------

function highlightJs(code) {
  let out = ''
  let i = 0
  const n = code.length

  while (i < n) {
    const ch  = code[i]
    const ch2 = code[i + 1]

    // Single-line comment
    if (ch === '/' && ch2 === '/') {
      const end = code.indexOf('\n', i)
      const tok = end === -1 ? code.slice(i) : code.slice(i, end)
      out += span('tok-cmt', tok)
      i += tok.length
      continue
    }

    // Block comment
    if (ch === '/' && ch2 === '*') {
      const end = code.indexOf('*/', i + 2)
      const tok = end === -1 ? code.slice(i) : code.slice(i, end + 2)
      out += span('tok-cmt', tok)
      i += tok.length
      continue
    }

    // Template literal
    if (ch === '`') {
      let tok = '`'
      i++
      let depth = 0
      while (i < n) {
        if (code[i] === '\\') { tok += code[i] + (code[i + 1] || ''); i += 2; continue }
        if (code[i] === '$' && code[i + 1] === '{') { tok += '${'; i += 2; depth++; continue }
        if (code[i] === '}' && depth > 0) { tok += '}'; i++; depth--; continue }
        if (code[i] === '`' && depth === 0) { tok += '`'; i++; break }
        tok += code[i++]
      }
      out += span('tok-str', tok)
      continue
    }

    // String
    if (ch === '"' || ch === "'") {
      let tok = ch; i++
      while (i < n && code[i] !== ch && code[i] !== '\n') {
        if (code[i] === '\\') { tok += code[i] + (code[i + 1] || ''); i += 2; continue }
        tok += code[i++]
      }
      if (i < n && code[i] === ch) tok += code[i++]
      out += span('tok-str', tok)
      continue
    }

    // Number
    if (/\d/.test(ch) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let tok = ''
      while (i < n && /[\d.xXa-fA-F_nN]/.test(code[i])) tok += code[i++]
      out += span('tok-num', tok)
      continue
    }

    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let tok = ''
      while (i < n && /[\w$]/.test(code[i])) tok += code[i++]
      if (JS_KEYWORDS.has(tok)) {
        out += span('tok-kw', tok)
      } else {
        let j = i
        while (j < n && code[j] === ' ') j++
        out += code[j] === '(' ? span('tok-fn', tok) : esc(tok)
      }
      continue
    }

    // Operators
    if (/[=!<>|&?+\-*/^%~]/.test(ch)) {
      let tok = ch
      if (/[=!<>|&?]/.test(ch) && /[=|&>?]/.test(ch2)) {
        tok = code.slice(i, i + 2)
        if (code[i + 2] === '=') tok = code.slice(i, i + 3)
      }
      out += span('tok-op', tok)
      i += tok.length
      continue
    }

    // Punctuation
    if (/[{}()[\],;:.]/.test(ch)) { out += span('tok-punct', ch); i++; continue }

    out += esc(ch); i++
  }

  return out
}

// ---------------------------------------------------------------------------
// HTML / XML
// ---------------------------------------------------------------------------

function highlightHtmlTag(tag) {
  let out = ''
  let i = 0
  out += '&lt;'; i++
  if (tag[i] === '/') { out += '/'; i++ }

  let name = ''
  while (i < tag.length && /[\w:-]/.test(tag[i])) name += tag[i++]
  if (name) out += span('tok-kw', name)

  while (i < tag.length) {
    const ch = tag[i]
    if (ch === '>') { out += '&gt;'; i++; break }
    if (ch === '/') { out += '/'; i++; continue }
    if (/[\w-]/.test(ch)) {
      let attr = ''
      while (i < tag.length && /[\w:-]/.test(tag[i])) attr += tag[i++]
      if (tag[i] === '=') {
        out += span('tok-fn', attr) + esc('='); i++
        const q = tag[i]
        if (q === '"' || q === "'") {
          let val = q; i++
          while (i < tag.length && tag[i] !== q) {
            if (tag[i] === '\\') { val += tag[i] + (tag[i + 1] || ''); i += 2; continue }
            val += tag[i++]
          }
          if (i < tag.length) val += tag[i++]
          out += span('tok-str', val)
        }
      } else {
        out += esc(attr)
      }
      continue
    }
    out += esc(ch); i++
  }
  return out
}

function highlightHtml(code) {
  let out = ''
  let i = 0
  const n = code.length
  while (i < n) {
    if (code.slice(i, i + 4) === '<!--') {
      const end = code.indexOf('-->', i + 4)
      const tok = end === -1 ? code.slice(i) : code.slice(i, end + 3)
      out += span('tok-cmt', tok); i += tok.length; continue
    }
    if (code[i] === '<') {
      const end = code.indexOf('>', i)
      if (end === -1) { out += esc(code[i++]); continue }
      out += highlightHtmlTag(code.slice(i, end + 1)); i = end + 1; continue
    }
    out += esc(code[i++])
  }
  return out
}

// ---------------------------------------------------------------------------
// CSS / SCSS
// ---------------------------------------------------------------------------

function highlightCss(code) {
  let out = ''
  let i = 0
  const n = code.length

  while (i < n) {
    // Block comment
    if (code[i] === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      const tok = end === -1 ? code.slice(i) : code.slice(i, end + 2)
      out += span('tok-cmt', tok); i += tok.length; continue
    }

    // String
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; let tok = q; i++
      while (i < n && code[i] !== q && code[i] !== '\n') {
        if (code[i] === '\\') { tok += code[i] + (code[i + 1] || ''); i += 2; continue }
        tok += code[i++]
      }
      if (i < n && code[i] === q) tok += code[i++]
      out += span('tok-str', tok); continue
    }

    // At-rule
    if (code[i] === '@') {
      let tok = '@'; i++
      while (i < n && /[\w-]/.test(code[i])) tok += code[i++]
      out += span('tok-kw', tok); continue
    }

    // Hex colour
    if (code[i] === '#' && /[0-9a-fA-F]/.test(code[i + 1] || '')) {
      let tok = '#'; i++
      while (i < n && /[0-9a-fA-F]/.test(code[i])) tok += code[i++]
      out += span('tok-num', tok); continue
    }

    // Number + optional unit
    if (/\d/.test(code[i]) || (code[i] === '-' && /\d/.test(code[i + 1] || ''))) {
      let tok = ''
      if (code[i] === '-') tok += code[i++]
      while (i < n && /[\d.]/.test(code[i])) tok += code[i++]
      while (i < n && /[a-z%]/.test(code[i])) tok += code[i++]
      out += span('tok-num', tok); continue
    }

    // Property name or keyword
    if (/[a-zA-Z_-]/.test(code[i])) {
      let tok = ''
      while (i < n && /[\w-]/.test(code[i])) tok += code[i++]
      let j = i
      while (j < n && code[j] === ' ') j++
      if (code[j] === ':' && code[j + 1] !== ':') {
        out += span('tok-fn', tok)
      } else {
        out += esc(tok)
      }
      continue
    }

    // Punctuation
    if (/[{}();:,]/.test(code[i])) { out += span('tok-punct', code[i++]); continue }

    out += esc(code[i++])
  }
  return out
}

// ---------------------------------------------------------------------------
// Bash / Shell
// ---------------------------------------------------------------------------

function highlightBash(code) {
  return code.split('\n').map(line => {
    if (/^\s*#/.test(line)) return span('tok-cmt', line)
    let out = ''; let i = 0
    while (i < line.length) {
      if (line[i] === '#') { out += span('tok-cmt', line.slice(i)); break }
      if (line[i] === '"' || line[i] === "'") {
        const q = line[i]; let tok = q; i++
        while (i < line.length && line[i] !== q) tok += line[i++]
        tok += line[i] === q ? line[i++] : ''
        out += span('tok-str', tok); continue
      }
      if (line[i] === '$') {
        let tok = '$'; i++
        if (line[i] === '{') {
          while (i < line.length && line[i] !== '}') tok += line[i++]
          tok += line[i] === '}' ? line[i++] : ''
        } else {
          while (i < line.length && /[\w]/.test(line[i])) tok += line[i++]
        }
        out += span('tok-kw', tok); continue
      }
      if (line[i] === '-' && /\w/.test(line[i + 1] || '')) {
        let tok = '-'; i++
        while (i < line.length && /[-\w]/.test(line[i])) tok += line[i++]
        out += span('tok-op', tok); continue
      }
      out += esc(line[i++])
    }
    return out
  }).join('\n')
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

function highlightJson(code) {
  let out = ''
  let i = 0
  const n = code.length

  while (i < n) {
    // String (key or value)
    if (code[i] === '"') {
      let tok = '"'; i++
      while (i < n && code[i] !== '"') {
        if (code[i] === '\\') { tok += code[i] + (code[i + 1] || ''); i += 2; continue }
        tok += code[i++]
      }
      tok += code[i] === '"' ? code[i++] : ''
      // Key: followed (after whitespace) by ':'
      let j = i
      while (j < n && /\s/.test(code[j])) j++
      out += code[j] === ':' ? span('tok-fn', tok) : span('tok-str', tok)
      continue
    }

    // Number
    if (/[-\d]/.test(code[i])) {
      let tok = ''
      while (i < n && /[-\d.eE+]/.test(code[i])) tok += code[i++]
      out += span('tok-num', tok); continue
    }

    // Keywords: true, false, null
    if (/[a-z]/.test(code[i])) {
      let tok = ''
      while (i < n && /[a-z]/.test(code[i])) tok += code[i++]
      out += span('tok-kw', tok); continue
    }

    // Punctuation
    if (/[{}[\],:]/.test(code[i])) { out += span('tok-punct', code[i++]); continue }

    out += esc(code[i++])
  }
  return out
}
