/**
 * Pulse Docs — Server-side syntax highlighter
 *
 * Character-by-character tokeniser. No dependencies, no client JS.
 * Returns an HTML string of <span> elements ready to drop inside <code>.
 */

const KEYWORDS = new Set([
  'export', 'default', 'import', 'from', 'as',
  'async', 'await', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'of', 'in',
  'true', 'false', 'null', 'undefined',
  'function', 'class', 'new', 'this', 'typeof', 'instanceof',
  'try', 'catch', 'finally', 'throw',
])

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function span(cls, text) {
  return `<span class="${cls}">${esc(text)}</span>`
}

export function highlight(code, lang = 'js') {
  if (lang === 'bash') return highlightBash(code)
  if (lang === 'html') return highlightHtml(code)
  return highlightJs(code)
}

// ---------------------------------------------------------------------------
// JavaScript tokeniser
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
        if (code[i] === '\\') {
          tok += code[i] + (code[i + 1] || '')
          i += 2
          continue
        }
        if (code[i] === '$' && code[i + 1] === '{') {
          tok += '${'
          i += 2
          depth++
          continue
        }
        if (code[i] === '}' && depth > 0) {
          tok += '}'
          i++
          depth--
          continue
        }
        if (code[i] === '`' && depth === 0) {
          tok += '`'
          i++
          break
        }
        tok += code[i++]
      }
      out += span('tok-str', tok)
      continue
    }

    // Single or double quoted string
    if (ch === '"' || ch === "'") {
      let tok = ch
      i++
      while (i < n && code[i] !== ch && code[i] !== '\n') {
        if (code[i] === '\\') {
          tok += code[i] + (code[i + 1] || '')
          i += 2
          continue
        }
        tok += code[i++]
      }
      if (i < n && code[i] === ch) tok += code[i++]
      out += span('tok-str', tok)
      continue
    }

    // Number
    if (/\d/.test(ch) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let tok = ''
      while (i < n && /[\d.xXa-fA-F]/.test(code[i])) tok += code[i++]
      out += span('tok-num', tok)
      continue
    }

    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let tok = ''
      while (i < n && /[\w$]/.test(code[i])) tok += code[i++]

      if (KEYWORDS.has(tok)) {
        out += span('tok-kw', tok)
      } else {
        // Look ahead: followed by ( → function call
        let j = i
        while (j < n && code[j] === ' ') j++
        if (code[j] === '(') {
          out += span('tok-fn', tok)
        } else {
          out += esc(tok)
        }
      }
      continue
    }

    // Operators
    if (/[=!<>|&?.]/.test(ch)) {
      let tok = ch
      // Grab two-char operators
      if (/[=!<>|&?]/.test(ch) && /[=|&>?]/.test(ch2)) {
        tok = code.slice(i, i + 2)
        // Three-char: ===, !==, ...
        if (code[i + 2] === '=') tok = code.slice(i, i + 3)
      }
      out += span('tok-op', tok)
      i += tok.length
      continue
    }

    // Punctuation
    if (/[{}()[\],;:]/.test(ch)) {
      out += span('tok-punct', ch)
      i++
      continue
    }

    // Everything else (whitespace, newlines, etc.)
    out += esc(ch)
    i++
  }

  return out
}

// ---------------------------------------------------------------------------
// Bash tokeniser (minimal)
// ---------------------------------------------------------------------------

function highlightBash(code) {
  return code.split('\n').map(line => {
    // Comment line
    if (/^\s*#/.test(line)) return span('tok-cmt', line)

    let out = ''
    let i = 0
    while (i < line.length) {
      // Inline comment
      if (line[i] === '#') {
        out += span('tok-cmt', line.slice(i))
        break
      }
      // String
      if (line[i] === '"' || line[i] === "'") {
        const q = line[i]
        let tok = q
        i++
        while (i < line.length && line[i] !== q) tok += line[i++]
        tok += line[i] === q ? line[i++] : ''
        out += span('tok-str', tok)
        continue
      }
      // Flag/option
      if (line[i] === '-' && /\w/.test(line[i + 1] || '')) {
        let tok = '-'
        i++
        while (i < line.length && /[-\w]/.test(line[i])) tok += line[i++]
        out += span('tok-op', tok)
        continue
      }
      out += esc(line[i++])
    }
    return out
  }).join('\n')
}

// ---------------------------------------------------------------------------
// HTML tokeniser (minimal)
// ---------------------------------------------------------------------------

function highlightHtmlTag(tag) {
  // Single-pass tag highlighter — avoids the chained .replace() trap where a
  // later pass re-processes class="tok-fn" strings already injected by an
  // earlier pass, producing broken HTML like <span class=<span …>"tok-fn"</span>>.
  let out = ''
  let i = 0

  // Opening < or </
  out += '&lt;'
  i++ // skip <
  if (tag[i] === '/') { out += '/'; i++ }

  // Tag name
  let name = ''
  while (i < tag.length && /[\w-]/.test(tag[i])) name += tag[i++]
  if (name) out += span('tok-kw', name)

  // Attributes and remainder up to >
  while (i < tag.length) {
    const ch = tag[i]
    if (ch === '>') { out += '&gt;'; i++; break }
    if (ch === '/') { out += '/'; i++; continue }

    if (/[\w-]/.test(ch)) {
      // Attribute name
      let attr = ''
      while (i < tag.length && /[\w-]/.test(tag[i])) attr += tag[i++]

      if (tag[i] === '=') {
        out += span('tok-fn', attr) + esc('=')
        i++ // skip =
        // Attribute value
        const q = tag[i]
        if (q === '"' || q === "'") {
          let val = q
          i++
          while (i < tag.length && tag[i] !== q) {
            if (tag[i] === '\\') { val += tag[i] + (tag[i + 1] || ''); i += 2; continue }
            val += tag[i++]
          }
          if (i < tag.length) val += tag[i++] // closing quote
          out += span('tok-str', val)
        }
      } else {
        out += esc(attr)
      }
      continue
    }

    out += esc(ch)
    i++
  }

  return out
}

function highlightHtml(code) {
  let out = ''
  let i = 0
  const n = code.length

  while (i < n) {
    // Comment
    if (code.slice(i, i + 4) === '<!--') {
      const end = code.indexOf('-->', i + 4)
      const tok = end === -1 ? code.slice(i) : code.slice(i, end + 3)
      out += span('tok-cmt', tok)
      i += tok.length
      continue
    }

    // Tag
    if (code[i] === '<') {
      const end = code.indexOf('>', i)
      if (end === -1) { out += esc(code[i++]); continue }
      out += highlightHtmlTag(code.slice(i, end + 1))
      i = end + 1
      continue
    }

    out += esc(code[i++])
  }

  return out
}
