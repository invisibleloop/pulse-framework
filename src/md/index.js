/**
 * Pulse — Markdown parser + file helper
 *
 * Zero dependencies. CommonMark subset + GFM tables + frontmatter.
 *
 * Exports:
 *   parseMd(source)      → { html, frontmatter }
 *   md(pathPattern)      → async (ctx) => { html, frontmatter }
 */

import fs   from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { highlight } from './highlight.js'

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Frontmatter — --- key: value --- block at top of file
// ---------------------------------------------------------------------------

function extractFrontmatter(source) {
  if (!source.startsWith('---')) return { frontmatter: {}, body: source }
  const end = source.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: {}, body: source }

  const frontmatter = {}
  for (const line of source.slice(3, end).split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    let val    = line.slice(colon + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key) frontmatter[key] = val
  }
  return { frontmatter, body: source.slice(end + 4) }
}

// ---------------------------------------------------------------------------
// Inline rendering
// ---------------------------------------------------------------------------

function renderInline(raw) {
  // 1. Protect inline code from further processing
  const codes = []
  let s = raw.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = codes.length
    codes.push(`<code>${esc(code)}</code>`)
    return `\x00${idx}\x00`
  })

  // 2. Escape HTML in the remaining text. The \x00N\x00 placeholders contain
  //    only digits and the null byte, so esc() leaves them untouched.
  s = esc(s)

  // 3. Images (before links — same syntax with leading !)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, title) =>
      `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''}>`)

  // 4. Links
  s = s.replace(/\[([^\]]+)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href, title) =>
      `<a href="${href}"${title ? ` title="${title}"` : ''}>${label}</a>`)

  // 5. Bold + italic (order: *** before ** before *)
  s = s.replace(/\*{3}([^*\n]+)\*{3}/g, (_, t) => `<strong><em>${t}</em></strong>`)
  s = s.replace(/\*{2}([^*\n]+)\*{2}/g, (_, t) => `<strong>${t}</strong>`)
  s = s.replace(/_{2}([^_\n]+)_{2}/g,   (_, t) => `<strong>${t}</strong>`)
  s = s.replace(/\*([^*\n]+)\*/g,        (_, t) => `<em>${t}</em>`)
  s = s.replace(/_([^_\n]+)_/g,          (_, t) => `<em>${t}</em>`)
  s = s.replace(/~~([^~\n]+)~~/g,        (_, t) => `<del>${t}</del>`)

  // 6. Restore code spans
  s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[+i])

  return s
}

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------

function parseBlocks(text) {
  const lines  = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line
    if (line.trim() === '') { i++; continue }

    // Fenced code block (``` or ~~~)
    const fenceMatch = line.match(/^(`{3,}|~{3,})(\S*)/)
    if (fenceMatch) {
      const fence    = fenceMatch[1]
      const lang     = fenceMatch[2]
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith(fence)) {
        codeLines.push(lines[i]); i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') })
      continue
    }

    // ATX heading  (# through ######)
    const headMatch = line.match(/^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/)
    if (headMatch) {
      blocks.push({ type: 'heading', level: headMatch[1].length, content: headMatch[2] })
      i++; continue
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' }); i++; continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, '')); i++
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const itemLines = [lines[i].replace(/^[-*+]\s/, '')]
        i++
        while (i < lines.length && /^[ \t]{2}/.test(lines[i])) {
          itemLines.push(lines[i].replace(/^[ \t]{2}/, '')); i++
        }
        items.push(itemLines.join('\n'))
      }
      blocks.push({ type: 'ul', items }); continue
    }

    // Ordered list
    if (/^\d+[.)]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
        const itemLines = [lines[i].replace(/^\d+[.)]\s/, '')]
        i++
        while (i < lines.length && /^[ \t]{3}/.test(lines[i])) {
          itemLines.push(lines[i].replace(/^[ \t]{3}/, '')); i++
        }
        items.push(itemLines.join('\n'))
      }
      blocks.push({ type: 'ol', items }); continue
    }

    // Table (GFM) — header row followed by a separator row (|---|---|)
    if (line.includes('|') && /^[\s|:\-]+$/.test(lines[i + 1] || '')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
        tableLines.push(lines[i]); i++
      }
      blocks.push({ type: 'table', lines: tableLines }); continue
    }

    // Paragraph — accumulate until a blank line or the start of a new block
    const paraLines = []
    while (i < lines.length) {
      const l = lines[i]
      if (l.trim() === '')                           break
      if (/^#{1,6}\s/.test(l))                       break
      if (/^(`{3,}|~{3,})/.test(l))                  break
      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(l))       break
      if (/^>\s?/.test(l))                            break
      if (/^[-*+]\s/.test(l))                         break
      if (/^\d+[.)]\s/.test(l))                       break
      paraLines.push(l); i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join(' ') })
    }
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

function renderListItem(content) {
  const lines = content.split('\n')
  // Single-line item → inline only
  if (lines.length === 1) return renderInline(lines[0])
  // Multi-line item (nested list or block content) → recurse
  return markdownToHtml(content)
}

function renderTable(tableLines) {
  const rows = tableLines.map(l =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
  )
  // rows[0] = header, rows[1] = separator, rows[2..] = body
  const [header, , ...body] = rows
  const thead = header.map(h => `<th>${renderInline(h)}</th>`).join('')
  const tbody = body.map(row =>
    `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join('')}</tr>`
  ).join('')
  return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
}

function renderBlocks(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading': {
        const id = block.content
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
        return `<h${block.level} id="${id}">${renderInline(block.content)}</h${block.level}>`
      }
      case 'code': {
        const hi = highlight(block.content, block.lang)
        const cls = block.lang ? ` class="language-${esc(block.lang)}"` : ''
        return `<pre><code${cls}>${hi}</code></pre>`
      }
      case 'hr':
        return '<hr>'
      case 'blockquote':
        return `<blockquote>${markdownToHtml(block.content)}</blockquote>`
      case 'ul':
        return `<ul>\n${block.items.map(item => `<li>${renderListItem(item)}</li>`).join('\n')}\n</ul>`
      case 'ol':
        return `<ol>\n${block.items.map(item => `<li>${renderListItem(item)}</li>`).join('\n')}\n</ol>`
      case 'table':
        return renderTable(block.lines)
      case 'paragraph':
        return `<p>${renderInline(block.content)}</p>`
      default:
        return ''
    }
  }).join('\n')
}

function markdownToHtml(text) {
  return renderBlocks(parseBlocks(text))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a markdown string into HTML + frontmatter.
 *
 * @param   {string} source - Raw markdown text
 * @returns {{ html: string, frontmatter: Record<string, string> }}
 */
export function parseMd(source) {
  const { frontmatter, body } = extractFrontmatter(source)
  return { html: markdownToHtml(body), frontmatter }
}

/**
 * Create a server fetcher that reads and parses a markdown file.
 * Use in spec.server — the result ({ html, frontmatter }) is passed to view.
 *
 * Path patterns support :param placeholders resolved from ctx.params:
 *   md('content/blog/:slug.md')
 *
 * The result is cached per request on ctx._mdCache so meta + server can
 * both call the same fetcher without reading the file twice.
 *
 * @param   {string | URL} pathPattern - File path or URL, supports :param segments
 * @returns {(ctx?: object) => Promise<{ html: string, frontmatter: Record<string, string> }>}
 */
export function md(pathPattern) {
  const pattern = pathPattern instanceof URL
    ? fileURLToPath(pathPattern)
    : String(pathPattern)

  const isAbsolute = path.isAbsolute(pattern)

  return async function mdFetcher(ctx) {
    // Resolve :param placeholders — strip any path-traversal chars from values
    let resolved = pattern
    if (ctx?.params) {
      for (const [k, v] of Object.entries(ctx.params)) {
        const safe = String(v).replace(/\.\.|[/\\]/g, '')
        resolved = resolved.replace(`:${k}`, safe)
      }
    }

    const absPath = isAbsolute
      ? path.normalize(resolved)
      : path.join(process.cwd(), resolved)

    // Request-scoped cache — avoid reading the same file twice per request
    if (ctx) {
      ctx._mdCache ??= {}
      if (ctx._mdCache[absPath]) return ctx._mdCache[absPath]
    }

    let source
    try {
      source = await fs.readFile(absPath, 'utf8')
    } catch (err) {
      if (err.code === 'ENOENT') {
        const e = new Error(`Markdown file not found: ${absPath}`)
        e.status = 404
        throw e
      }
      throw err
    }

    const result = parseMd(source)
    if (ctx) ctx._mdCache[absPath] = result
    return result
  }
}
