/**
 * Pulse CLI — terminal formatting helpers
 *
 * Respects NO_COLOR and CI env vars — falls back to plain text automatically.
 * Zero dependencies, Node built-ins only.
 */

const USE_COLOR = !process.env.NO_COLOR && !process.env.CI && process.stdout.isTTY

// ANSI escape helpers — no-ops when colour is disabled
const c = {
  reset:  s => USE_COLOR ? `\x1b[0m${s}\x1b[0m`  : s,
  bold:   s => USE_COLOR ? `\x1b[1m${s}\x1b[0m`   : s,
  dim:    s => USE_COLOR ? `\x1b[2m${s}\x1b[0m`   : s,
  green:  s => USE_COLOR ? `\x1b[32m${s}\x1b[0m`  : s,
  yellow: s => USE_COLOR ? `\x1b[33m${s}\x1b[0m`  : s,
  blue:   s => USE_COLOR ? `\x1b[34m${s}\x1b[0m`  : s,
  cyan:   s => USE_COLOR ? `\x1b[36m${s}\x1b[0m`  : s,
  white:  s => USE_COLOR ? `\x1b[97m${s}\x1b[0m`  : s,
  red:    s => USE_COLOR ? `\x1b[31m${s}\x1b[0m`  : s,
  purple: s => USE_COLOR ? `\x1b[35m${s}\x1b[0m`  : s,
}

// Strip ANSI codes to measure true visual width
function visLen(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').length
}

// Pad a string to a visual width (accounting for ANSI codes)
function pad(s, width, align = 'left') {
  const len  = visLen(s)
  const fill = Math.max(0, width - len)
  return align === 'right' ? ' '.repeat(fill) + s : s + ' '.repeat(fill)
}

// ─── Box ─────────────────────────────────────────────────────────────────────

export function box(lines, opts = {}) {
  const { title = '', style = 'single' } = opts
  const chars = style === 'double'
    ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' }
    : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }

  const inner = Array.isArray(lines) ? lines : [lines]
  const maxW  = Math.max(...inner.map(visLen), title ? visLen(title) + 2 : 0)
  const bar   = chars.h.repeat(maxW + 2)

  const top = title
    ? `${chars.tl}${chars.h} ${c.bold(title)} ${chars.h.repeat(maxW - visLen(title) - 1)}${chars.tr}`
    : `${chars.tl}${bar}${chars.tr}`

  const rows = inner.map(l => `${chars.v} ${pad(l, maxW)} ${chars.v}`)
  return [top, ...rows, `${chars.bl}${bar}${chars.br}`].join('\n')
}

// ─── Header (branded section label) ──────────────────────────────────────────

export function header(text) {
  const line = `${c.purple('⚡')} ${c.bold(c.white(text))}`
  return `\n${line}\n${c.dim('─'.repeat(visLen('⚡ ' + text) - (USE_COLOR ? 0 : 0)))}`
}

// ─── Table ───────────────────────────────────────────────────────────────────

/**
 * Render an aligned table.
 * @param {string[]}   cols    - Column headers
 * @param {string[][]} rows    - Data rows (array of arrays)
 * @param {{align?: ('left'|'right')[]}} opts
 */
export function table(cols, rows, opts = {}) {
  const aligns  = opts.align || cols.map(() => 'left')
  const allRows = [cols, ...rows]
  const widths  = cols.map((_, i) => Math.max(...allRows.map(r => visLen(r[i] ?? ''))))

  const sep = '  '

  const headerRow = cols.map((h, i) => pad(c.dim(h), widths[i], aligns[i])).join(sep)
  const divider   = c.dim('─'.repeat(widths.reduce((s, w, i) => s + w + (i < widths.length - 1 ? sep.length : 0), 0)))
  const body      = rows.map(row =>
    row.map((cell, i) => pad(cell ?? '', widths[i], aligns[i])).join(sep)
  )

  return [headerRow, divider, ...body].join('\n')
}

// ─── Status line helpers ──────────────────────────────────────────────────────

export const icon = {
  ok:   () => c.green('✓'),
  fail: () => c.red('✗'),
  warn: () => c.yellow('⚠'),
  info: () => c.cyan('·'),
  run:  () => c.yellow('›'),
  bolt: () => c.purple('⚡'),
}

export function ok(msg)   { return `  ${icon.ok()}  ${msg}` }
export function fail(msg) { return `  ${icon.fail()}  ${c.red(msg)}` }
export function warn(msg) { return `  ${icon.warn()}  ${c.yellow(msg)}` }
export function info(msg) { return `  ${icon.info()}  ${c.dim(msg)}` }

// ─── Timing ───────────────────────────────────────────────────────────────────

export function elapsed(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { c, pad, visLen }
