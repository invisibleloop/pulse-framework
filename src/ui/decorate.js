/**
 * Pulse UI — Decorate
 *
 * Inline SVG background pattern element. Drop it inside any container as an
 * absolute overlay to add texture — dots, grid, diagonal lines, or zigzag.
 * The SVG is positioned absolute so it doesn't affect layout; the parent must
 * have position: relative (or use a `u-relative` class).
 *
 * @param {object}  opts
 * @param {'dots'|'grid'|'lines'|'zigzag'|'cross'} opts.pattern - Pattern type (default: 'dots')
 * @param {string}  opts.color   - Stroke/fill color, any CSS value (default: var(--ui-border))
 * @param {number}  opts.opacity - Opacity 0–1 (default: 0.4)
 * @param {number}  opts.size    - Pattern tile size in px (default: 20)
 * @param {string}  opts.class
 */

const PATTERNS = new Set(['dots', 'grid', 'lines', 'zigzag', 'cross'])

let _uid = 0

export function decorate({
  pattern = 'dots',
  color   = 'var(--ui-border)',
  opacity = 0.4,
  size    = 20,
  class: cls = '',
} = {}) {
  if (!PATTERNS.has(pattern)) pattern = 'dots'
  const s         = Math.max(4, parseInt(size) || 20)
  const safeOpac  = Math.min(1, Math.max(0, parseFloat(opacity) || 0.4))
  // Use a color we can reference in the SVG — replace var() with currentColor trick
  const useColor  = color.startsWith('var(') ? 'currentColor' : color
  const style     = color.startsWith('var(') ? ` style="color:${color}"` : ''

  const classes = ['ui-decorate', cls].filter(Boolean).join(' ')

  const pid = `dp${++_uid}`
  let patternSvg
  const half = s / 2

  if (pattern === 'dots') {
    patternSvg = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><circle cx="${half}" cy="${half}" r="1" fill="${useColor}"/></pattern>`
  } else if (pattern === 'grid') {
    patternSvg = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${useColor}" stroke-width="0.5"/></pattern>`
  } else if (pattern === 'lines') {
    patternSvg = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${s}" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${s}" stroke="${useColor}" stroke-width="0.75"/></pattern>`
  } else if (pattern === 'zigzag') {
    const q = s / 4
    patternSvg = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${half}"><polyline points="0,${half} ${q},0 ${half},${half} ${s - q},0 ${s},${half}" fill="none" stroke="${useColor}" stroke-width="0.75"/></pattern>`
  } else { // cross
    patternSvg = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><line x1="${half}" y1="0" x2="${half}" y2="${s}" stroke="${useColor}" stroke-width="0.5"/><line x1="0" y1="${half}" x2="${s}" y2="${half}" stroke="${useColor}" stroke-width="0.5"/><circle cx="${half}" cy="${half}" r="1.5" fill="${useColor}"/></pattern>`
  }

  return `<svg class="${classes}"${style} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;opacity:${safeOpac}" aria-hidden="true"><defs>${patternSvg}</defs><rect width="100%" height="100%" fill="url(#${pid})"/></svg>`
}
