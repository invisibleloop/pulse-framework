/**
 * Pulse Testing — Minimal HTML tokenizer and CSS selector engine
 *
 * No dependencies. Handles common HTML patterns well enough for test assertions.
 * Supports: tag, .class, #id, [attr], [attr="value"] and combinations thereof.
 * Does NOT support descendant combinators (div p) — match within el.findAll() instead.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set([
  'area','base','br','col','embed','hr','img','input',
  'link','meta','param','source','track','wbr',
])

// These tags contain raw text — don't parse their content as HTML
const RAW_TAGS = new Set(['script','style','noscript'])

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

/**
 * Find the position of the closing > of a tag, respecting quoted attribute values.
 * @param {string} html
 * @param {number} from  Index just after the opening <
 */
function findTagEnd(html, from) {
  let i = from
  let inSingle = false, inDouble = false
  while (i < html.length) {
    const c = html[i]
    if      (c === '"' && !inSingle) inDouble = !inDouble
    else if (c === "'" && !inDouble) inSingle = !inSingle
    else if (c === '>'  && !inSingle && !inDouble) return i
    i++
  }
  return -1
}

/**
 * Parse an attribute string into a plain object.
 * Boolean attributes (no value) are stored as true.
 *
 * @param {string} str
 * @returns {Record<string, string|true>}
 */
function parseAttrs(str) {
  const attrs = {}
  // Matches: name  name="val"  name='val'  name=val
  const re = /([a-zA-Z_][\w\-:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g
  let m
  while ((m = re.exec(str)) !== null) {
    const name = m[1].toLowerCase()
    const val  = m[2] !== undefined ? m[2]
               : m[3] !== undefined ? m[3]
               : m[4] !== undefined ? m[4]
               : true
    attrs[name] = val
  }
  return attrs
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * Tokenize an HTML string into a flat array of tokens.
 *
 * Token shapes:
 *   { type: 'open',  tag, attrs, selfClose }
 *   { type: 'close', tag }
 *   { type: 'text',  text }
 *
 * @param {string} html
 * @returns {Array}
 */
export function tokenize(html) {
  const tokens = []
  let i = 0

  while (i < html.length) {
    // Text node
    if (html[i] !== '<') {
      const next  = html.indexOf('<', i)
      const slice = next === -1 ? html.slice(i) : html.slice(i, next)
      const text  = decodeEntities(slice.trim())
      if (text) tokens.push({ type: 'text', text })
      i = next === -1 ? html.length : next
      continue
    }

    const tagEnd = findTagEnd(html, i + 1)
    if (tagEnd === -1) break

    const raw = html.slice(i + 1, tagEnd).trim()

    // Skip doctype, comments, CDATA, processing instructions
    if (raw.startsWith('!') || raw.startsWith('?')) {
      i = tagEnd + 1
      continue
    }

    // Closing tag
    if (raw.startsWith('/')) {
      const tag = raw.slice(1).trim().split(/\s/)[0].toLowerCase()
      tokens.push({ type: 'close', tag })
      i = tagEnd + 1
      continue
    }

    // Opening tag (possibly self-closing)
    const hasSelfSlash = raw.endsWith('/')
    const content   = hasSelfSlash ? raw.slice(0, -1).trimEnd() : raw
    const spaceIdx  = content.search(/\s/)
    const tag       = (spaceIdx === -1 ? content : content.slice(0, spaceIdx)).toLowerCase()
    const attrsStr  = spaceIdx === -1 ? '' : content.slice(spaceIdx)
    const attrs     = parseAttrs(attrsStr)
    const selfClose = hasSelfSlash || VOID_TAGS.has(tag)

    tokens.push({ type: 'open', tag, attrs, selfClose })
    if (selfClose) tokens.push({ type: 'close', tag })

    i = tagEnd + 1

    // Skip raw content of script/style
    if (RAW_TAGS.has(tag) && !selfClose) {
      const closeTag = `</${tag}`
      const closeIdx = html.toLowerCase().indexOf(closeTag, i)
      if (closeIdx !== -1) {
        const closeTagEnd = html.indexOf('>', closeIdx)
        tokens.push({ type: 'close', tag })
        i = closeTagEnd === -1 ? html.length : closeTagEnd + 1
      }
    }
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Selector parsing
// ---------------------------------------------------------------------------

/**
 * Parse a simple CSS selector string.
 * Supports: tag  .class  #id  [attr]  [attr="value"]  and combinations.
 *
 * @param {string} selector
 * @returns {{ tag: string|null, id: string|null, classes: string[], attrs: Array<{name,value}> }}
 */
export function parseSelector(selector) {
  const result = { tag: null, id: null, classes: [], attrs: [] }
  let s = selector.trim()

  // Optional leading tag name
  const tagMatch = s.match(/^([a-zA-Z][a-zA-Z0-9]*)/)
  if (tagMatch) {
    result.tag = tagMatch[1].toLowerCase()
    s = s.slice(tagMatch[0].length)
  }

  // .class, #id, [attr], [attr="value"]
  const partRe = /([.#[])([^\s.[#\]"'=]+)(?:="([^"]*)")?]?/g
  let m
  while ((m = partRe.exec(s)) !== null) {
    const prefix = m[1]
    if      (prefix === '.') result.classes.push(m[2])
    else if (prefix === '#') result.id = m[2]
    else if (prefix === '[') result.attrs.push({ name: m[2].toLowerCase(), value: m[3] ?? null })
  }

  return result
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Test whether an 'open' token matches a parsed selector.
 *
 * @param {{ type, tag, attrs }} token
 * @param {{ tag, id, classes, attrs }} sel
 */
export function matchesToken(token, sel) {
  if (token.type !== 'open') return false
  if (sel.tag  !== null && token.tag !== sel.tag)   return false
  if (sel.id   !== null && token.attrs['id'] !== sel.id) return false
  if (sel.classes.length) {
    const cls = String(token.attrs['class'] || '').split(/\s+/)
    if (!sel.classes.every(c => cls.includes(c))) return false
  }
  for (const { name, value } of sel.attrs) {
    if (!(name in token.attrs)) return false
    if (value !== null && token.attrs[name] !== value) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Tree navigation
// ---------------------------------------------------------------------------

/**
 * Return the slice of tokens representing the inner content of an open element.
 * Handles nested same-tag elements correctly.
 *
 * @param {Array}  tokens
 * @param {number} openIdx  Index of the 'open' token
 * @returns {Array}
 */
export function getInnerTokens(tokens, openIdx) {
  if (tokens[openIdx].selfClose) return []
  const tag = tokens[openIdx].tag
  let depth = 1
  let i = openIdx + 1
  while (i < tokens.length && depth > 0) {
    const tok = tokens[i]
    if (tok.type === 'open'  && tok.tag === tag && !tok.selfClose) depth++
    else if (tok.type === 'close' && tok.tag === tag)              depth--
    i++
  }
  return tokens.slice(openIdx + 1, depth === 0 ? i - 1 : i)
}

/**
 * Extract all text content from a token list, space-separated.
 *
 * @param {Array} tokens
 * @returns {string}
 */
export function extractText(tokens) {
  return tokens
    .filter(t => t.type === 'text')
    .map(t => t.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Query API
// ---------------------------------------------------------------------------

/**
 * Find the first token matching selector.
 * @param {Array}  tokens
 * @param {string} selector
 * @returns {{ token, index } | null}
 */
export function findFirst(tokens, selector) {
  const sel = parseSelector(selector)
  for (let i = 0; i < tokens.length; i++) {
    if (matchesToken(tokens[i], sel)) return { token: tokens[i], index: i }
  }
  return null
}

/**
 * Find all tokens matching selector.
 * @param {Array}  tokens
 * @param {string} selector
 * @returns {Array<{ token, index }>}
 */
export function findAll(tokens, selector) {
  const sel = parseSelector(selector)
  const results = []
  for (let i = 0; i < tokens.length; i++) {
    if (matchesToken(tokens[i], sel)) results.push({ token: tokens[i], index: i })
  }
  return results
}
