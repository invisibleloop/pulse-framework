/**
 * Pulse UI — Display Heading
 *
 * Large typographic heading for editorial moments. Controls line-break,
 * tracking, max-width in ch. Use for hero titles, chapter openings,
 * section leads.
 *
 * @param {object} opts
 * @param {string} opts.text - Heading text (HTML entities supported)
 * @param {number} opts.level - Heading level 1–6 (default 1)
 * @param {number} opts.maxWidth - Max width in ch units (default 20)
 * @param {boolean} opts.balance - Use text-wrap: balance (default true)
 * @param {string} opts.tracking - Letter-spacing: 'tight' | 'normal' | 'wide' (default 'tight')
 * @param {string} opts.class
 */

import { escHtml as e } from '../html.js'

const TRACKING = {
  tight:  '-0.02em',
  normal: '0',
  wide:   '0.05em',
}

export function displayHeading({
  text       = '',
  level      = 1,
  maxWidth   = 20,
  balance    = true,
  tracking   = 'tight',
  class: cls = '',
} = {}) {
  const tag = `h${Math.min(Math.max(Math.floor(level), 1), 6)}`
  const classes = ['ui-display-heading', cls].filter(Boolean).join(' ')
  
  const letterSpacing = TRACKING[tracking] || TRACKING.tight
  const styles = [
    `max-width:${maxWidth}ch`,
    `letter-spacing:${letterSpacing}`,
    balance && 'text-wrap:balance',
  ].filter(Boolean).join(';')

  return `<${tag} class="${e(classes)}" style="${styles}">${e(text)}</${tag}>`
}
