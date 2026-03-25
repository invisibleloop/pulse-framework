/**
 * Pulse UI — List
 *
 * Styled ordered or unordered list. Use this instead of raw <ul>/<ol> to get
 * consistent spacing, bullets, and colour tokens.
 *
 * Items are HTML strings — escape user data before passing them in.
 *
 * @param {object}   opts
 * @param {string[]} opts.items   - Array of HTML strings for each list item
 * @param {boolean}  [opts.ordered] - true for <ol>, false for <ul> (default: false)
 * @param {string}   [opts.gap]     - Item spacing: 'xs'|'sm'|'md' (default: 'sm')
 * @param {string}   [opts.class]   - Extra classes on the list element
 */

export function list({
  items      = [],
  ordered    = false,
  gap        = 'sm',
  class: cls = '',
} = {}) {
  if (!items.length) return ''

  const tag     = ordered ? 'ol' : 'ul'
  const gapMap  = { xs: 'u-gap-1', sm: 'u-gap-2', md: 'u-gap-3' }
  const classes = [
    'ui-list',
    ordered ? 'ui-list--ordered' : 'ui-list--unordered',
    gapMap[gap] || 'u-gap-2',
    cls,
  ].filter(Boolean).join(' ')

  const itemsHtml = items.map(item => `<li class="ui-list-item">${item}</li>`).join('')

  return `<${tag} class="${classes}">${itemsHtml}</${tag}>`
}
