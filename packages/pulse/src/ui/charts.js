/**
 * Pulse UI — Charts
 *
 * Server-rendered SVG charts. Pure functions, no client JS, no dependencies.
 * All charts use CSS custom properties for colours and scale to 100% width
 * (except sparkline and donutChart which have explicit dimensions).
 *
 * @exports barChart   - Vertical bar chart
 * @exports lineChart  - Line chart with optional area fill
 * @exports donutChart - Donut / pie chart
 * @exports sparkline  - Minimal inline line for stat tiles
 */

import { escHtml as e } from '../html.js'

// ─── Internal constants ───────────────────────────────────────────────────────

const IW = 500 // internal viewBox width for bar / line charts

const COLOR_MAP = {
  accent:  'var(--ui-accent)',
  success: 'var(--ui-green)',
  warning: 'var(--ui-yellow)',
  error:   'var(--ui-red)',
  blue:    'var(--ui-blue)',
  muted:   'var(--ui-muted)',
}

const PALETTE = ['accent', 'blue', 'success', 'warning', 'error', 'muted']

// ─── Internal helpers ─────────────────────────────────────────────────────────

function col(c)  { return COLOR_MAP[c] ?? COLOR_MAP.accent }
function r1(n)   { return Math.round(n * 10) / 10 }         // 1 decimal place
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function fmt(n) {
  const abs = Math.abs(n)
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

/**
 * Vertical bar chart.
 *
 * @param {object}  opts
 * @param {Array<{label:string, value:number}>} opts.data
 * @param {number}  opts.height     - SVG height in px (default: 220)
 * @param {'accent'|'success'|'warning'|'error'|'blue'|'muted'} opts.color
 * @param {boolean} opts.showValues - Show value labels above each bar
 * @param {boolean} opts.showGrid   - Show horizontal grid lines (default: true)
 * @param {number}  opts.gap        - Gap between bars as fraction 0–0.9 (default: 0.25)
 * @param {string}  opts.class
 */
export function barChart({
  data       = [],
  height     = 220,
  color      = 'accent',
  showValues = false,
  showGrid   = true,
  gap        = 0.25,
  class: cls = '',
} = {}) {
  if (!data.length) return ''

  const pad   = { top: showValues ? 28 : 16, right: 16, bottom: 40, left: 44 }
  const plotW = IW - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const values = data.map(d => Number(d.value) || 0)
  const maxVal = Math.max(...values, 0)
  const minVal = Math.min(...values, 0)
  const range  = maxVal - minVal || 1
  const c      = col(color)

  const yFor  = v => r1(pad.top + plotH - ((v - minVal) / range) * plotH)
  const zeroY = yFor(0)

  // Grid lines + Y-axis labels
  let grid = ''
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (i / 4) * range
      const y = yFor(v)
      grid += `<line x1="${pad.left}" y1="${r1(y)}" x2="${IW - pad.right}" y2="${r1(y)}" stroke="var(--ui-border)" stroke-width="1"/>`
      grid += `<text x="${pad.left - 6}" y="${r1(y + 4)}" text-anchor="end" font-size="11" fill="var(--ui-muted)" font-family="var(--ui-font)">${e(fmt(v))}</text>`
    }
  }

  // Zero baseline
  const baseline = `<line x1="${pad.left}" y1="${zeroY}" x2="${IW - pad.right}" y2="${zeroY}" stroke="var(--ui-border)" stroke-width="1.5"/>`

  // Bars + labels
  const slotW = plotW / data.length
  const barW  = r1(slotW * (1 - clamp(gap, 0.05, 0.9)))

  const bars = data.map((d, i) => {
    const v  = Number(d.value) || 0
    const bx = r1(pad.left + i * slotW + (slotW - barW) / 2)
    const by = r1(Math.min(yFor(v), zeroY))
    const bh = r1(Math.max(Math.abs(yFor(v) - zeroY), 1))
    const mx = r1(bx + barW / 2)

    let out = `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" fill="${c}" rx="2"/>`
    if (showValues) {
      out += `<text x="${mx}" y="${r1(by - 5)}" text-anchor="middle" font-size="11" font-weight="600" fill="${c}" font-family="var(--ui-font)">${e(fmt(v))}</text>`
    }
    if (d.label != null) {
      out += `<text x="${mx}" y="${height - 8}" text-anchor="middle" font-size="11" fill="var(--ui-muted)" font-family="var(--ui-font)">${e(String(d.label))}</text>`
    }
    return out
  }).join('')

  const ariaLabel = `Bar chart: ${data.map(d => `${d.label ?? ''} ${d.value}`).join(', ')}`
  const clsAttr   = cls ? ` class="${e(cls)}"` : ''

  return `<div${clsAttr} style="width:100%;aspect-ratio:${IW}/${height}"><svg viewBox="0 0 ${IW} ${height}" width="100%" height="100%" style="display:block" role="img" aria-label="${e(ariaLabel)}">${grid}${baseline}${bars}</svg></div>`
}

// ─── Line chart ───────────────────────────────────────────────────────────────

/**
 * Line chart with optional area fill.
 *
 * @param {object}  opts
 * @param {Array<{label:string, value:number}>} opts.data
 * @param {number}  opts.height   - SVG height in px (default: 220)
 * @param {'accent'|'success'|'warning'|'error'|'blue'|'muted'} opts.color
 * @param {boolean} opts.area     - Fill the area under the line
 * @param {boolean} opts.showDots - Show dots at each data point (default: true)
 * @param {boolean} opts.showGrid - Show horizontal grid lines (default: true)
 * @param {string}  opts.class
 */
export function lineChart({
  data       = [],
  height     = 220,
  color      = 'accent',
  area       = false,
  showDots   = true,
  showGrid   = true,
  class: cls = '',
} = {}) {
  if (data.length < 2) return ''

  const pad   = { top: 16, right: 16, bottom: 40, left: 44 }
  const plotW = IW - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const values = data.map(d => Number(d.value) || 0)
  const maxVal = Math.max(...values)
  const minVal = Math.min(...values)
  const range  = maxVal - minVal || 1
  const c      = col(color)

  const xFor = i => r1(pad.left + (i / (data.length - 1)) * plotW)
  const yFor = v => r1(pad.top + plotH - ((v - minVal) / range) * plotH)

  // Grid lines + Y-axis labels
  let grid = ''
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (i / 4) * range
      const y = yFor(v)
      grid += `<line x1="${pad.left}" y1="${r1(y)}" x2="${IW - pad.right}" y2="${r1(y)}" stroke="var(--ui-border)" stroke-width="1"/>`
      grid += `<text x="${pad.left - 6}" y="${r1(y + 4)}" text-anchor="end" font-size="11" fill="var(--ui-muted)" font-family="var(--ui-font)">${e(fmt(v))}</text>`
    }
  }

  const pts    = data.map((d, i) => [xFor(i), yFor(Number(d.value) || 0)])
  const points = pts.map(([x, y]) => `${x},${y}`).join(' ')

  // Area fill
  let areaPath = ''
  if (area) {
    const bottom = r1(pad.top + plotH)
    const d = `M${pts[0][0]},${bottom} ` + pts.map(([x, y]) => `L${x},${y}`).join(' ') + ` L${pts.at(-1)[0]},${bottom} Z`
    areaPath = `<path d="${d}" fill="${c}" fill-opacity="0.12"/>`
  }

  const line = `<polyline points="${points}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  const dots = showDots ? pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}"/>`).join('') : ''

  // X-axis labels
  const xlabels = data.map((d, i) =>
    d.label != null
      ? `<text x="${xFor(i)}" y="${height - 8}" text-anchor="middle" font-size="11" fill="var(--ui-muted)" font-family="var(--ui-font)">${e(String(d.label))}</text>`
      : ''
  ).join('')

  const ariaLabel = `Line chart: ${data.map(d => `${d.label ?? ''} ${d.value}`).join(', ')}`
  const clsAttr   = cls ? ` class="${e(cls)}"` : ''

  return `<div${clsAttr} style="width:100%;aspect-ratio:${IW}/${height}"><svg viewBox="0 0 ${IW} ${height}" width="100%" height="100%" style="display:block" role="img" aria-label="${e(ariaLabel)}">${grid}${areaPath}${line}${dots}${xlabels}</svg></div>`
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

/**
 * Donut (ring) chart. Each segment can have its own colour.
 *
 * @param {object}  opts
 * @param {Array<{label:string, value:number, color?:string}>} opts.data
 * @param {number}  opts.size      - Diameter in px (default: 200)
 * @param {number}  opts.thickness - Ring thickness in px (default: 40)
 * @param {string}  opts.label     - Large text in the centre
 * @param {string}  opts.sublabel  - Smaller text below the centre label
 * @param {boolean} opts.fluid     - Expand to parent width (preserves aspect ratio)
 * @param {string}  opts.class
 */
export function donutChart({
  data       = [],
  size       = 200,
  thickness  = 40,
  label      = '',
  sublabel   = '',
  fluid      = false,
  class: cls = '',
} = {}) {
  if (!data.length) return ''

  const cx     = size / 2
  const cy     = size / 2
  const r      = cx - 8
  const innerR = r - clamp(thickness, 4, r - 4)
  const total  = data.reduce((s, d) => s + Math.max(0, Number(d.value) || 0), 0)
  if (!total) return ''

  let angle = -Math.PI / 2 // start at 12 o'clock

  const segments = data.map((d, i) => {
    const v     = Math.max(0, Number(d.value) || 0)
    const frac  = v / total
    const sweep = frac * 2 * Math.PI
    const start = angle
    const end   = angle + sweep
    angle       = end

    const c     = col(d.color || PALETTE[i % PALETTE.length])

    // Full circle edge case
    if (frac >= 1 - 1e-10) {
      const mid = r1((r + innerR) / 2)
      return `<circle cx="${cx}" cy="${cy}" r="${mid}" fill="none" stroke="${c}" stroke-width="${thickness}"/>`
    }

    const x1 = r1(cx + r      * Math.cos(start))
    const y1 = r1(cy + r      * Math.sin(start))
    const x2 = r1(cx + r      * Math.cos(end))
    const y2 = r1(cy + r      * Math.sin(end))
    const x3 = r1(cx + innerR * Math.cos(end))
    const y3 = r1(cy + innerR * Math.sin(end))
    const x4 = r1(cx + innerR * Math.cos(start))
    const y4 = r1(cy + innerR * Math.sin(start))
    const lg  = sweep > Math.PI ? 1 : 0

    const path = `M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${lg} 0 ${x4},${y4} Z`
    return `<path d="${path}" fill="${c}"/>`
  }).join('')

  // Centre text
  const hasTwo  = label && sublabel
  const labelY  = r1(cy + (hasTwo ? -6 : 6))
  const subY    = r1(cy + 16)
  const labelEl = label    ? `<text x="${cx}" y="${labelY}" text-anchor="middle" font-size="${thickness > 30 ? 22 : 16}" font-weight="700" fill="var(--ui-text)" font-family="var(--ui-font)">${e(label)}</text>` : ''
  const subEl   = sublabel ? `<text x="${cx}" y="${subY}"   text-anchor="middle" font-size="12" fill="var(--ui-muted)" font-family="var(--ui-font)">${e(sublabel)}</text>` : ''

  const ariaLabel = `Donut chart: ${data.map(d => `${d.label ?? ''} ${d.value}`).join(', ')}`
  const clsAttr   = cls ? ` class="${e(cls)}"` : ''
  const dims      = fluid ? `style="display:block;width:100%"` : `width="${size}" height="${size}"`

  return `<svg${clsAttr} viewBox="0 0 ${size} ${size}" ${dims} role="img" aria-label="${e(ariaLabel)}">${segments}${labelEl}${subEl}</svg>`
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

/**
 * Minimal inline line chart for use inside stat tiles or table cells.
 * Accepts a plain array of numbers.
 *
 * @param {object}   opts
 * @param {number[]} opts.data   - Array of numeric values
 * @param {number}   opts.width  - SVG width in px (default: 80)
 * @param {number}   opts.height - SVG height in px (default: 32)
 * @param {'accent'|'success'|'warning'|'error'|'blue'|'muted'} opts.color
 * @param {boolean}  opts.area   - Fill area under the line
 * @param {boolean}  opts.fluid  - Expand to parent width (preserves aspect ratio)
 * @param {string}   opts.class
 */
export function sparkline({
  data       = [],
  width      = 80,
  height     = 32,
  color      = 'accent',
  area       = false,
  fluid      = false,
  class: cls = '',
} = {}) {
  if (data.length < 2) return ''

  const values = data.map(v => Number(v) || 0)
  const min    = Math.min(...values)
  const max    = Math.max(...values)
  const range  = max - min || 1
  const pad    = 2
  const c      = col(color)

  const xFor = i => r1(i * (width / (data.length - 1)))
  const yFor = v => r1(height - pad - ((v - min) / range) * (height - pad * 2))

  const pts    = values.map((v, i) => [xFor(i), yFor(v)])
  const points = pts.map(([x, y]) => `${x},${y}`).join(' ')

  let areaPath = ''
  if (area) {
    const bottom = height - pad
    const d = `M${pts[0][0]},${bottom} ` + pts.map(([x, y]) => `L${x},${y}`).join(' ') + ` L${pts.at(-1)[0]},${bottom} Z`
    areaPath = `<path d="${d}" fill="${c}" fill-opacity="0.15"/>`
  }

  const clsAttr = cls ? ` class="${e(cls)}"` : ''
  if (fluid) {
    return `<div${clsAttr} style="width:100%;aspect-ratio:${width}/${height}"><svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="display:block" aria-hidden="true">${areaPath}<polyline points="${points}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
  }

  return `<svg${clsAttr} viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">${areaPath}<polyline points="${points}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}
