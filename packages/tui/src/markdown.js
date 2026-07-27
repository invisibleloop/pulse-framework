/**
 * Pulse TUI — lightweight markdown-to-Ink renderer
 *
 * Not a general-purpose markdown parser — deliberately scoped to what
 * Claude's own responses actually use in practice: bold, italic, inline
 * code, fenced code blocks, headers, and bullet/numbered lists. No tables,
 * no images, no links, no nested blockquotes. If Claude's output style
 * changes to lean on something this doesn't cover, extend here rather than
 * reaching for a full markdown library — see the dependency-scope decision
 * in this package's history for why (marked-terminal pulls in ~7 packages
 * for coverage this tool doesn't need).
 *
 * Returns an array of Ink elements (React.createElement calls), one per
 * line/block, ready to spread into a parent Box's children.
 */

import React from 'react'
import { Box, Text } from 'ink'

const h = React.createElement

/**
 * Parse inline markdown (bold, italic, inline code) within a single line
 * into an array of nested <Text> children for use INSIDE one parent <Text>.
 *
 * IMPORTANT — this was the actual cause of a real, confirmed bug (garbled,
 * interleaved output mixing unrelated fragments of adjacent lines): Ink's
 * <Text> is the unit of line-wrapping. Returning sibling <Text> elements and
 * spreading them into a <Box> (the previous approach) makes each fragment
 * wrap independently instead of as one continuous paragraph, and when
 * several such Boxes sit near each other their wrapped output can visually
 * interleave. Ink's own docs are explicit: "<Text> allows only text nodes
 * and nested <Text> components inside of it" — nested Text is the
 * documented, correct way to compose styled inline spans, not sibling Text
 * inside a Box. Every caller of this function must render its result as
 * children of ONE <Text>, never spread into a <Box>.
 *
 * Handles non-overlapping, non-nested spans only — "**bold with `code`**"
 * works, "**bold *and italic***" does not (rare enough in practice not to
 * be worth a real recursive-descent parser).
 */
function renderInline(text, keyPrefix) {
  const parts = []
  // Order matters: match code spans first so ** inside `code` isn't treated
  // as bold — then bold, then italic, on whatever's left between code spans.
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g
  let lastIndex = 0
  let match
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(h(Text, { key: `${keyPrefix}-${i++}` }, text.slice(lastIndex, match.index)))
    }
    const [full, code, bold, italic] = match
    if (code) {
      parts.push(h(Text, { key: `${keyPrefix}-${i++}`, color: '#f5a623' }, code.slice(1, -1)))
    } else if (bold) {
      parts.push(h(Text, { key: `${keyPrefix}-${i++}`, bold: true }, bold.slice(2, -2)))
    } else if (italic) {
      parts.push(h(Text, { key: `${keyPrefix}-${i++}`, italic: true }, italic.slice(1, -1)))
    }
    lastIndex = match.index + full.length
  }
  if (lastIndex < text.length) {
    parts.push(h(Text, { key: `${keyPrefix}-${i++}`, }, text.slice(lastIndex)))
  }
  return parts.length > 0 ? parts : [text]
}

// Matches the fixed-format Lighthouse report line the agent guide
// (src/agent/identity.md) requires Claude to always use instead of
// paraphrasing scores into prose — e.g.
//   "Lighthouse desktop: Accessibility 100, Best Practices 100, SEO 100"
// Score is a number or the em-dash placeholder for "not available".
const LIGHTHOUSE_LINE = /^Lighthouse (\w+): (.+)$/
const LIGHTHOUSE_PAIR = /^(.+?) (\d+|—)$/

function parseLighthouseLine(line) {
  const lineMatch = line.match(LIGHTHOUSE_LINE)
  if (!lineMatch) return null
  const [, device, rest] = lineMatch
  const pairs = rest.split(',').map((s) => s.trim()).map((s) => s.match(LIGHTHOUSE_PAIR))
  if (pairs.some((p) => !p)) return null // doesn't fully match the fixed format — fall through to plain text
  return { device, scores: pairs.map((p) => ({ category: p[1], score: p[2] })) }
}

function lighthouseScoreColor(score, greenColor, yellowColor, redColor, mutedColor) {
  if (score === '—') return mutedColor
  const n = Number(score)
  if (n >= 90) return greenColor
  if (n >= 50) return yellowColor
  return redColor
}

/**
 * One bordered box per category, laid out in a row — "4 boxes across" per
 * the design request, each showing the category name and its score colored
 * by pass/warn/fail threshold (same 90/50 cutoffs Lighthouse itself uses).
 */
function renderLighthouseRow({ device, scores }, key, colors) {
  return h(Box, { key, flexDirection: 'column', marginBottom: 1 },
    h(Text, { bold: true, color: colors.accent }, `Lighthouse — ${device}`),
    h(Box, { gap: 1 },
      ...scores.map(({ category, score }, i) =>
        h(Box, {
          key: i,
          flexDirection: 'column',
          alignItems: 'center',
          borderStyle: 'round',
          borderColor: lighthouseScoreColor(score, colors.green, colors.yellow, colors.red, colors.muted),
          paddingX: 1,
          width: 20,
        },
          h(Text, {
            bold: true,
            color: lighthouseScoreColor(score, colors.green, colors.yellow, colors.red, colors.muted),
          }, score),
          h(Text, { color: colors.muted, wrap: 'truncate' }, category),
        )
      ),
    ),
  )
}

/**
 * @param {string} markdown
 * @param {object} [opts]
 * @param {string} [opts.accentColor] - Color for headers/list bullets
 * @param {string} [opts.mutedColor]
 * @param {string} [opts.greenColor] - Lighthouse score >= 90
 * @param {string} [opts.yellowColor] - Lighthouse score 50-89
 * @param {string} [opts.redColor] - Lighthouse score < 50
 * @returns {React.ReactElement[]}
 */
export function renderMarkdown(markdown, {
  accentColor = '#5b8def',
  mutedColor = 'gray',
  greenColor = '#3ecf8e',
  yellowColor = '#f5a623',
  redColor = '#f75656',
} = {}) {
  const lighthouseColors = { accent: accentColor, muted: mutedColor, green: greenColor, yellow: yellowColor, red: redColor }
  const lines = markdown.split('\n')
  const blocks = []
  let inCodeBlock = false
  let codeBlockLines = []
  let codeBlockLang = ''

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const fenceMatch = line.match(/^```(\w*)\s*$/)

    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockLang = fenceMatch[1]
        codeBlockLines = []
      } else {
        inCodeBlock = false
        blocks.push(h(Box, {
          key: `code-${idx}`,
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: mutedColor,
          paddingX: 1,
          marginY: 1,
        },
          codeBlockLang ? h(Text, { key: 'lang', color: mutedColor, dimColor: true }, codeBlockLang) : null,
          ...codeBlockLines.map((codeLine, i) =>
            h(Text, { key: `line-${i}`, color: '#f5a623' }, codeLine || ' ')
          ),
        ))
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headerMatch) {
      blocks.push(h(Text, { key: `h-${idx}`, bold: true, color: accentColor }, headerMatch[2]))
      continue
    }

    // Bullet/numbered marker and its content are nested inside ONE <Text>
    // (not a <Box> with the marker and content as separate siblings) so the
    // whole line wraps as a single unit — see the note on renderInline above.
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/)
    if (bulletMatch) {
      const indent = ' '.repeat(bulletMatch[1].length)
      blocks.push(h(Text, { key: `li-${idx}` },
        h(Text, { color: accentColor }, `${indent}• `),
        ...renderInline(bulletMatch[2], `li-${idx}`),
      ))
      continue
    }

    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
    if (numberedMatch) {
      const indent = ' '.repeat(numberedMatch[1].length)
      blocks.push(h(Text, { key: `ol-${idx}` },
        h(Text, { color: accentColor }, `${indent}${numberedMatch[2]}. `),
        ...renderInline(numberedMatch[3], `ol-${idx}`),
      ))
      continue
    }

    if (line.trim() === '') {
      blocks.push(h(Text, { key: `blank-${idx}` }, ' '))
      continue
    }

    const lighthouseMatch = parseLighthouseLine(line)
    if (lighthouseMatch) {
      blocks.push(renderLighthouseRow(lighthouseMatch, `lh-${idx}`, lighthouseColors))
      continue
    }

    blocks.push(h(Text, { key: `p-${idx}` }, ...renderInline(line, `p-${idx}`)))
  }

  return blocks
}
