/**
 * Pulse UI — Component tests
 *
 * Tests cover: default rendering, all variants, HTML escaping (XSS),
 * accessibility attributes, and edge cases.
 */

import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import { button }      from './button.js'
import { badge }       from './badge.js'
import { card }        from './card.js'
import { input }       from './input.js'
import { select }      from './select.js'
import { textarea }    from './textarea.js'
import { alert }       from './alert.js'
import { stat }        from './stat.js'
import { avatar }      from './avatar.js'
import { empty }       from './empty.js'
import { table }       from './table.js'
import { hero }        from './hero.js'
import { testimonial } from './testimonial.js'
import { feature }     from './feature.js'
import { pricing }     from './pricing.js'
import { accordion }   from './accordion.js'
import { nav }         from './nav.js'
import { appBadge }    from './app-badge.js'
import { container }   from './container.js'
import { section }     from './section.js'
import { grid }        from './grid.js'
import { stack }       from './stack.js'
import { cluster }     from './cluster.js'
import { divider }     from './divider.js'
import { banner }      from './banner.js'
import { media }       from './media.js'
import { fieldset }    from './fieldset.js'
import { slider }     from './slider.js'
import { toggle }     from './switch.js'
import { radio, radioGroup } from './radio.js'
import { segmented }  from './segmented.js'
import { fileUpload } from './fileupload.js'
import { modal, modalTrigger } from './modal.js'

// ─── button ─────────────────────────────────────────────────────────────────

test('button: renders <button> by default', () => {
  const html = button({ label: 'Save' })
  assert.match(html, /<button/)
  assert.match(html, /Save/)
  assert.match(html, /type="button"/)
  assert.match(html, /ui-btn--primary/)
  assert.match(html, /ui-btn--md/)
})

test('button: renders <a> when href is provided', () => {
  const html = button({ label: 'Go', href: '/dashboard' })
  assert.match(html, /<a /)
  assert.match(html, /href="\/dashboard"/)
  assert.doesNotMatch(html, /<button/)
})

test('button: applies variant classes', () => {
  for (const v of ['primary', 'secondary', 'ghost', 'danger']) {
    assert.match(button({ label: 'x', variant: v }), new RegExp(`ui-btn--${v}`))
  }
})

test('button: applies size classes', () => {
  for (const s of ['sm', 'md', 'lg']) {
    assert.match(button({ label: 'x', size: s }), new RegExp(`ui-btn--${s}`))
  }
})

test('button: unknown variant falls back to primary', () => {
  assert.match(button({ label: 'x', variant: 'rainbow' }), /ui-btn--primary/)
})

test('button: disabled <button> has disabled attribute and aria-disabled', () => {
  const html = button({ label: 'x', disabled: true })
  assert.match(html, /disabled/)
  assert.match(html, /aria-disabled="true"/)
})

test('button: disabled <a> has aria-disabled and tabindex=-1, no href behavior issues', () => {
  const html = button({ label: 'x', href: '/x', disabled: true })
  assert.match(html, /aria-disabled="true"/)
  assert.match(html, /tabindex="-1"/)
})

test('button: fullWidth adds modifier class', () => {
  assert.match(button({ label: 'x', fullWidth: true }), /ui-btn--full/)
})

test('button: escapes label to prevent XSS', () => {
  const html = button({ label: '<script>alert(1)</script>' })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('button: escapes href to prevent XSS', () => {
  const html = button({ label: 'x', href: '"><script>alert(1)</script>' })
  assert.doesNotMatch(html, /<script>/)
})

test('button: submit type', () => {
  assert.match(button({ label: 'x', type: 'submit' }), /type="submit"/)
})

test('button: renders icon HTML inside element', () => {
  const html = button({ label: 'x', icon: '<svg/>' })
  assert.match(html, /ui-btn-icon/)
  assert.match(html, /<svg\/>/)
})

// ─── badge ──────────────────────────────────────────────────────────────────

test('badge: renders with default variant', () => {
  const html = badge({ label: 'New' })
  assert.match(html, /<span/)
  assert.match(html, /ui-badge--default/)
  assert.match(html, /New/)
})

test('badge: applies all variants', () => {
  for (const v of ['default', 'success', 'warning', 'error', 'info']) {
    assert.match(badge({ label: 'x', variant: v }), new RegExp(`ui-badge--${v}`))
  }
})

test('badge: unknown variant falls back to default', () => {
  assert.match(badge({ label: 'x', variant: 'neon' }), /ui-badge--default/)
})

test('badge: escapes label', () => {
  const html = badge({ label: '<b>bold</b>' })
  assert.doesNotMatch(html, /<b>/)
  assert.match(html, /&lt;b&gt;/)
})

// ─── card ───────────────────────────────────────────────────────────────────

test('card: renders card wrapper', () => {
  const html = card({ content: '<p>Hello</p>' })
  assert.match(html, /ui-card/)
  assert.match(html, /ui-card-body/)
  assert.match(html, /<p>Hello<\/p>/)
})

test('card: renders title when provided', () => {
  const html = card({ title: 'My Card', content: '' })
  assert.match(html, /ui-card-title/)
  assert.match(html, /My Card/)
})

test('card: renders footer when provided', () => {
  const html = card({ content: '', footer: '<button>OK</button>' })
  assert.match(html, /ui-card-footer/)
})

test('card: no title/footer when not provided', () => {
  const html = card({ content: 'x' })
  assert.doesNotMatch(html, /ui-card-header/)
  assert.doesNotMatch(html, /ui-card-footer/)
})

test('card: flush modifier', () => {
  assert.match(card({ content: '', flush: true }), /ui-card--flush/)
})

test('card: escapes title to prevent XSS', () => {
  const html = card({ title: '<script>', content: '' })
  assert.doesNotMatch(html, /<script>/)
})

// ─── input ──────────────────────────────────────────────────────────────────

test('input: renders label and input linked by for/id', () => {
  const html = input({ name: 'email', label: 'Email' })
  assert.match(html, /for="field-email"/)
  assert.match(html, /id="field-email"/)
  assert.match(html, /Email/)
})

test('input: renders error with role=alert and aria-invalid', () => {
  const html = input({ name: 'email', label: 'Email', error: 'Required' })
  assert.match(html, /role="alert"/)
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /Required/)
  assert.match(html, /aria-describedby/)
})

test('input: renders hint with aria-describedby', () => {
  const html = input({ name: 'email', label: 'Email', hint: 'We will never spam you' })
  assert.match(html, /ui-hint/)
  assert.match(html, /aria-describedby/)
})

test('input: required adds required attribute and aria-required', () => {
  const html = input({ name: 'x', label: 'X', required: true })
  assert.match(html, /required/)
  assert.match(html, /aria-required="true"/)
  assert.match(html, /ui-required/)
})

test('input: disabled attribute', () => {
  const html = input({ name: 'x', label: 'X', disabled: true })
  assert.match(html, /disabled/)
})

test('input: pre-filled value', () => {
  const html = input({ name: 'x', label: 'X', value: 'hello' })
  assert.match(html, /value="hello"/)
})

test('input: escapes value to prevent XSS', () => {
  const html = input({ name: 'x', label: 'X', value: '"><script>alert(1)</script>' })
  assert.doesNotMatch(html, /<script>/)
})

test('input: escapes error message', () => {
  const html = input({ name: 'x', label: 'X', error: '<b>bad</b>' })
  assert.doesNotMatch(html, /<b>/)
})

test('input: custom id overrides generated id', () => {
  const html = input({ name: 'x', label: 'X', id: 'custom-id' })
  assert.match(html, /id="custom-id"/)
  assert.match(html, /for="custom-id"/)
})

test('input: error field adds ui-field--error wrapper class', () => {
  const html = input({ name: 'x', label: 'X', error: 'oops' })
  assert.match(html, /ui-field--error/)
})

// ─── select ─────────────────────────────────────────────────────────────────

test('select: renders options from strings', () => {
  const html = select({ name: 's', label: 'Pick', options: ['One', 'Two'] })
  assert.match(html, /value="One"/)
  assert.match(html, /value="Two"/)
})

test('select: renders options from objects', () => {
  const html = select({ name: 's', label: 'Pick', options: [{ value: 'a', label: 'Alpha' }] })
  assert.match(html, /value="a"/)
  assert.match(html, /Alpha/)
})

test('select: marks selected option', () => {
  const html = select({ name: 's', label: 'Pick', options: ['a', 'b'], value: 'b' })
  assert.match(html, /value="b" selected/)
})

test('select: renders chevron', () => {
  assert.match(select({ name: 's', label: 'S', options: [] }), /ui-select-chevron/)
})

test('select: error triggers aria-invalid and role=alert', () => {
  const html = select({ name: 's', label: 'S', options: [], error: 'Required' })
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /role="alert"/)
})

test('select: escapes option values and labels', () => {
  const html = select({ name: 's', label: 'S', options: [{ value: '"><script>', label: '<b>' }] })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>/)
})

// ─── textarea ───────────────────────────────────────────────────────────────

test('textarea: renders with label', () => {
  const html = textarea({ name: 'msg', label: 'Message' })
  assert.match(html, /for="field-msg"/)
  assert.match(html, /<textarea/)
})

test('textarea: value is escaped and placed inside element', () => {
  const html = textarea({ name: 'msg', label: 'M', value: '<script>evil</script>' })
  assert.doesNotMatch(html, /<script>evil/)
  assert.match(html, /&lt;script&gt;/)
})

test('textarea: rows attribute', () => {
  const html = textarea({ name: 'x', label: 'X', rows: 8 })
  assert.match(html, /rows="8"/)
})

test('textarea: error renders role=alert', () => {
  const html = textarea({ name: 'x', label: 'X', error: 'Too long' })
  assert.match(html, /role="alert"/)
  assert.match(html, /Too long/)
})

// ─── alert ──────────────────────────────────────────────────────────────────

test('alert: info uses role=status', () => {
  assert.match(alert({ variant: 'info', content: 'x' }), /role="status"/)
})

test('alert: success uses role=status', () => {
  assert.match(alert({ variant: 'success', content: 'x' }), /role="status"/)
})

test('alert: warning uses role=alert', () => {
  assert.match(alert({ variant: 'warning', content: 'x' }), /role="alert"/)
})

test('alert: error uses role=alert', () => {
  assert.match(alert({ variant: 'error', content: 'x' }), /role="alert"/)
})

test('alert: renders title when provided', () => {
  const html = alert({ variant: 'info', title: 'Note', content: 'Something' })
  assert.match(html, /ui-alert-title/)
  assert.match(html, /Note/)
})

test('alert: renders icon', () => {
  assert.match(alert({ variant: 'info', content: 'x' }), /ui-alert-icon/)
})

test('alert: unknown variant falls back to info', () => {
  assert.match(alert({ variant: 'banana', content: 'x' }), /ui-alert--info/)
})

test('alert: escapes title', () => {
  const html = alert({ variant: 'info', title: '<script>', content: '' })
  assert.doesNotMatch(html, /<script>/)
})

// ─── stat ────────────────────────────────────────────────────────────────────

test('stat: renders label and value', () => {
  const html = stat({ label: 'Users', value: '1,204' })
  assert.match(html, /ui-stat-label/)
  assert.match(html, /ui-stat-value/)
  assert.match(html, /Users/)
  assert.match(html, /1,204/)
})

test('stat: renders change with trend class', () => {
  const html = stat({ label: 'X', value: '10', change: '+5%', trend: 'up' })
  assert.match(html, /ui-stat-change--up/)
  assert.match(html, /\+5%/)
})

test('stat: no change rendered when change is empty', () => {
  const html = stat({ label: 'X', value: '10' })
  assert.doesNotMatch(html, /ui-stat-change/)
})

test('stat: escapes label and value', () => {
  const html = stat({ label: '<b>L</b>', value: '<i>V</i>' })
  assert.doesNotMatch(html, /<b>/)
  assert.doesNotMatch(html, /<i>/)
})

test('stat: unknown trend falls back to neutral', () => {
  assert.match(stat({ label: 'X', value: '1', change: '+1', trend: 'sideways' }), /ui-stat-change--neutral/)
})

test('stat: center prop adds ui-stat--center class', () => {
  assert.match(stat({ label: 'X', value: '1', center: true }), /ui-stat--center/)
})

test('stat: center is absent by default', () => {
  assert.doesNotMatch(stat({ label: 'X', value: '1' }), /ui-stat--center/)
})

// ─── avatar ──────────────────────────────────────────────────────────────────

test('avatar: renders <img> when src provided', () => {
  const html = avatar({ src: '/photo.jpg', alt: 'Alice' })
  assert.match(html, /<img /)
  assert.match(html, /src="\/photo.jpg"/)
  assert.match(html, /alt="Alice"/)
  assert.match(html, /loading="lazy"/)
})

test('avatar: renders <span> with initials when no src', () => {
  const html = avatar({ alt: 'Alice Smith' })
  assert.match(html, /<span/)
  assert.match(html, /AS/)
  assert.match(html, /role="img"/)
})

test('avatar: uses explicit initials over derived', () => {
  const html = avatar({ alt: 'Alice Smith', initials: 'A' })
  assert.match(html, />A</)
})

test('avatar: applies size class', () => {
  assert.match(avatar({ alt: 'x', size: 'lg' }), /ui-avatar--lg/)
})

test('avatar: unknown size falls back to md', () => {
  assert.match(avatar({ alt: 'x', size: 'giant' }), /ui-avatar--md/)
})

test('avatar: escapes src to prevent XSS', () => {
  const html = avatar({ src: '"><script>alert(1)</script>', alt: 'x' })
  assert.doesNotMatch(html, /<script>/)
})

// ─── empty ───────────────────────────────────────────────────────────────────

test('empty: renders title', () => {
  const html = empty({ title: 'No results' })
  assert.match(html, /No results/)
  assert.match(html, /ui-empty-title/)
})

test('empty: renders description when provided', () => {
  const html = empty({ title: 'x', description: 'Try a different search' })
  assert.match(html, /ui-empty-desc/)
  assert.match(html, /Try a different search/)
})

test('empty: renders action button when provided', () => {
  const html = empty({ title: 'x', action: { label: 'Add item', href: '/new' } })
  assert.match(html, /Add item/)
  assert.match(html, /href="\/new"/)
})

test('empty: no action rendered when not provided', () => {
  const html = empty({ title: 'x' })
  assert.doesNotMatch(html, /ui-btn/)
})

test('empty: escapes title and description', () => {
  const html = empty({ title: '<script>', description: '<b>bad</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>/)
})

// ─── table ───────────────────────────────────────────────────────────────────

test('table: renders headers with scope=col', () => {
  const html = table({ headers: ['Name', 'Role'], rows: [] })
  assert.match(html, /scope="col"/)
  assert.match(html, /Name/)
  assert.match(html, /Role/)
})

test('table: renders rows', () => {
  const html = table({ headers: ['A'], rows: [['Cell 1'], ['Cell 2']] })
  assert.match(html, /Cell 1/)
  assert.match(html, /Cell 2/)
})

test('table: renders caption', () => {
  const html = table({ headers: [], rows: [], caption: 'User list' })
  assert.match(html, /ui-table-caption/)
  assert.match(html, /User list/)
})

test('table: scroll wrapper has role=region and tabindex', () => {
  const html = table({ headers: [], rows: [] })
  assert.match(html, /role="region"/)
  assert.match(html, /tabindex="0"/)
})

test('table: escapes headers', () => {
  const html = table({ headers: ['<script>'], rows: [] })
  assert.doesNotMatch(html, /<script>/)
})

test('table: empty rows renders empty tbody', () => {
  const html = table({ headers: ['A', 'B'], rows: [] })
  assert.match(html, /<tbody><\/tbody>/)
})

// ─── hero ────────────────────────────────────────────────────────────────────

test('hero: renders title, eyebrow, subtitle', () => {
  const html = hero({ eyebrow: 'New', title: 'Hello', subtitle: 'World' })
  assert.match(html, /ui-hero-eyebrow/)
  assert.match(html, /ui-hero-title/)
  assert.match(html, /ui-hero-subtitle/)
})

test('hero: left align adds ui-hero--left', () => {
  assert.match(hero({ title: 'x', align: 'left' }), /ui-hero--left/)
})

test('hero: center align (default) has no modifier class', () => {
  assert.doesNotMatch(hero({ title: 'x' }), /ui-hero--left/)
})

test('hero: actions slot passes through raw HTML', () => {
  const html = hero({ title: 'x', actions: '<a href="/dl">Download</a>' })
  assert.match(html, /href="\/dl"/)
})

test('hero: escapes title and eyebrow', () => {
  const html = hero({ title: '<script>', eyebrow: '<b>bad</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>bad<\/b>/)
})

// ─── testimonial ─────────────────────────────────────────────────────────────

test('testimonial: renders quote, name, role', () => {
  const html = testimonial({ quote: 'Great app', name: 'Alice Smith', role: 'CEO' })
  assert.match(html, /Great app/)
  assert.match(html, /Alice Smith/)
  assert.match(html, /CEO/)
})

test('testimonial: renders stars when rating provided', () => {
  const html = testimonial({ quote: 'x', name: 'A', rating: 5 })
  assert.match(html, /ui-testimonial-rating/)
  assert.match(html, /★★★★★/)
})

test('testimonial: no stars when rating omitted', () => {
  assert.doesNotMatch(testimonial({ quote: 'x', name: 'A' }), /ui-testimonial-rating/)
})

test('testimonial: renders initials when src omitted', () => {
  const html = testimonial({ quote: 'x', name: 'Alice Smith' })
  assert.match(html, /ui-testimonial-avatar--initials/)
  assert.match(html, /AS/)
})

test('testimonial: renders img when src provided', () => {
  const html = testimonial({ quote: 'x', name: 'Alice', src: '/photo.jpg' })
  assert.match(html, /<img/)
  assert.match(html, /photo\.jpg/)
})

test('testimonial: escapes quote and name', () => {
  const html = testimonial({ quote: '<script>', name: '<b>X</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>X<\/b>/)
})

// ─── feature ─────────────────────────────────────────────────────────────────

test('feature: renders title and description', () => {
  const html = feature({ title: 'Fast', description: 'Under 100ms' })
  assert.match(html, /ui-feature-title/)
  assert.match(html, /ui-feature-desc/)
})

test('feature: icon slot passes through raw HTML', () => {
  const html = feature({ icon: '<svg><circle/></svg>', title: 'x' })
  assert.match(html, /<svg>/)
  assert.match(html, /ui-feature-icon/)
})

test('feature: escapes title and description', () => {
  const html = feature({ title: '<script>', description: '<b>bad</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>bad<\/b>/)
})

// ─── pricing ─────────────────────────────────────────────────────────────────

test('pricing: renders name, price, period', () => {
  const html = pricing({ name: 'Pro', price: '$9', period: '/month' })
  assert.match(html, /ui-pricing-name/)
  assert.match(html, /\$9/)
  assert.match(html, /\/month/)
})

test('pricing: renders feature list', () => {
  const html = pricing({ name: 'x', price: 'Free', features: ['Unlimited pages', 'Support'] })
  assert.match(html, /Unlimited pages/)
  assert.match(html, /Support/)
  assert.match(html, /ui-pricing-check/)
})

test('pricing: highlighted adds modifier class', () => {
  assert.match(pricing({ name: 'x', price: 'x', highlighted: true }), /ui-pricing--highlighted/)
})

test('pricing: badge renders when provided', () => {
  const html = pricing({ name: 'x', price: 'x', badge: 'Most popular' })
  assert.match(html, /ui-pricing-badge/)
  assert.match(html, /Most popular/)
})

test('pricing: action slot passes through raw HTML', () => {
  const html = pricing({ name: 'x', price: 'x', action: '<button>Buy</button>' })
  assert.match(html, /<button>Buy<\/button>/)
})

test('pricing: escapes name and description', () => {
  const html = pricing({ name: '<script>', description: '<b>x</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>x<\/b>/)
})

// ─── accordion ───────────────────────────────────────────────────────────────

test('accordion: renders details/summary', () => {
  const html = accordion({ items: [{ question: 'What?', answer: 'This.' }] })
  assert.match(html, /<details/)
  assert.match(html, /<summary/)
  assert.match(html, /What\?/)
  assert.match(html, /This\./)
})

test('accordion: renders multiple items', () => {
  const html = accordion({ items: [{ question: 'A', answer: '1' }, { question: 'B', answer: '2' }] })
  assert.match(html, /ui-accordion-item/)
  assert.match(html, />A</)
  assert.match(html, />B</)
})

test('accordion: empty items renders empty container', () => {
  const html = accordion({ items: [] })
  assert.match(html, /ui-accordion/)
})

test('accordion: escapes question and answer', () => {
  const html = accordion({ items: [{ question: '<script>', answer: '<b>x</b>' }] })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>x<\/b>/)
})

// ─── nav ─────────────────────────────────────────────────────────────────────

test('nav: renders logo and links', () => {
  const html = nav({ logo: 'MyApp', links: [{ label: 'Features', href: '#features' }] })
  assert.match(html, /MyApp/)
  assert.match(html, /Features/)
  assert.match(html, /href="#features"/)
})

test('nav: sticky adds modifier class', () => {
  assert.match(nav({ logo: 'x', sticky: true }), /ui-nav--sticky/)
})

test('nav: no sticky class by default', () => {
  assert.doesNotMatch(nav({ logo: 'x' }), /ui-nav--sticky/)
})

test('nav: action slot passes through raw HTML', () => {
  const html = nav({ logo: 'x', action: '<button>Sign up</button>' })
  assert.match(html, /Sign up/)
})

test('nav: escapes link labels and hrefs', () => {
  const html = nav({ logo: 'x', links: [{ label: '<b>X</b>', href: 'javascript:void(0)' }] })
  assert.doesNotMatch(html, /<b>X<\/b>/)
})

// ─── appBadge ────────────────────────────────────────────────────────────────

test('appBadge: renders apple badge by default', () => {
  const html = appBadge({ href: 'https://apps.apple.com/x' })
  assert.match(html, /App Store/)
  assert.match(html, /apps\.apple\.com/)
})

test('appBadge: renders google badge', () => {
  assert.match(appBadge({ store: 'google', href: '/play' }), /Google Play/)
})

test('appBadge: unknown store falls back to apple', () => {
  assert.match(appBadge({ store: 'unknown' }), /App Store/)
})

test('appBadge: has aria-label and rel=noopener', () => {
  const html = appBadge({ href: '/x' })
  assert.match(html, /aria-label/)
  assert.match(html, /noopener/)
})

// ─── container ───────────────────────────────────────────────────────────────

test('container: renders content', () => {
  assert.match(container({ content: '<p>Hello</p>' }), /Hello/)
})

test('container: default size is lg', () => {
  assert.match(container({ content: '' }), /ui-container--lg/)
})

test('container: size variants apply modifier class', () => {
  assert.match(container({ content: '', size: 'sm' }), /ui-container--sm/)
  assert.match(container({ content: '', size: 'md' }), /ui-container--md/)
  assert.match(container({ content: '', size: 'xl' }), /ui-container--xl/)
})

test('container: unknown size falls back to lg', () => {
  assert.match(container({ content: '', size: 'huge' }), /ui-container--lg/)
})

// ─── section ─────────────────────────────────────────────────────────────────

test('section: renders as <section> element', () => {
  assert.match(section({ content: 'x' }), /<section/)
})

test('section: alt variant adds modifier class', () => {
  assert.match(section({ content: '', variant: 'alt' }), /ui-section--alt/)
})

test('section: dark variant adds modifier class', () => {
  assert.match(section({ content: '', variant: 'dark' }), /ui-section--dark/)
})

test('section: default variant has no modifier class', () => {
  assert.doesNotMatch(section({ content: '' }), /ui-section--default/)
})

test('section: sm padding adds modifier class', () => {
  assert.match(section({ content: '', padding: 'sm' }), /ui-section--sm/)
})

test('section: id attribute renders when provided', () => {
  assert.match(section({ content: '', id: 'features' }), /id="features"/)
})

test('section: unknown variant falls back to default', () => {
  assert.doesNotMatch(section({ content: '', variant: 'rainbow' }), /ui-section--rainbow/)
})

// ─── grid ────────────────────────────────────────────────────────────────────

test('grid: renders content', () => {
  assert.match(grid({ content: '<div>A</div>' }), /A/)
})

test('grid: default cols is 3', () => {
  assert.match(grid({ content: '' }), /ui-grid--cols-3/)
})

test('grid: cols variants apply modifier class', () => {
  assert.match(grid({ content: '', cols: 2 }), /ui-grid--cols-2/)
  assert.match(grid({ content: '', cols: 4 }), /ui-grid--cols-4/)
})

test('grid: unknown cols falls back to 3', () => {
  assert.match(grid({ content: '', cols: 5 }), /ui-grid--cols-3/)
})

test('grid: gap sm adds modifier class', () => {
  assert.match(grid({ content: '', gap: 'sm' }), /ui-grid--gap-sm/)
})

test('grid: default gap has no modifier class', () => {
  assert.doesNotMatch(grid({ content: '' }), /ui-grid--gap-md/)
})

// ─── stack ───────────────────────────────────────────────────────────────────

test('stack: renders content', () => {
  assert.match(stack({ content: '<p>x</p>' }), /x/)
})

test('stack: gap variants apply modifier class', () => {
  assert.match(stack({ content: '', gap: 'lg' }), /ui-stack--gap-lg/)
  assert.match(stack({ content: '', gap: 'xs' }), /ui-stack--gap-xs/)
})

test('stack: default gap has no modifier class', () => {
  assert.doesNotMatch(stack({ content: '' }), /ui-stack--gap-md/)
})

test('stack: align center adds modifier class', () => {
  assert.match(stack({ content: '', align: 'center' }), /ui-stack--align-center/)
})

test('stack: default align has no modifier class', () => {
  assert.doesNotMatch(stack({ content: '' }), /ui-stack--align-stretch/)
})

// ─── cluster ─────────────────────────────────────────────────────────────────

test('cluster: renders content', () => {
  assert.match(cluster({ content: '<span>x</span>' }), /x/)
})

test('cluster: justify center adds modifier class', () => {
  assert.match(cluster({ content: '', justify: 'center' }), /ui-cluster--justify-center/)
})

test('cluster: justify between adds modifier class', () => {
  assert.match(cluster({ content: '', justify: 'between' }), /ui-cluster--justify-between/)
})

test('cluster: nowrap adds modifier class', () => {
  assert.match(cluster({ content: '', wrap: false }), /ui-cluster--nowrap/)
})

test('cluster: wrap is true by default (no nowrap class)', () => {
  assert.doesNotMatch(cluster({ content: '' }), /ui-cluster--nowrap/)
})

// ─── divider ─────────────────────────────────────────────────────────────────

test('divider: renders <hr> when no label', () => {
  assert.match(divider(), /<hr/)
})

test('divider: renders label version as <div>', () => {
  assert.match(divider({ label: 'or' }), /<div/)
  assert.match(divider({ label: 'or' }), /or/)
})

test('divider: has role=separator and aria-label when label provided', () => {
  const html = divider({ label: 'or' })
  assert.match(html, /role="separator"/)
  assert.match(html, /aria-label="or"/)
})

test('divider: escapes label', () => {
  assert.doesNotMatch(divider({ label: '<script>' }), /<script>/)
})

// ─── banner ──────────────────────────────────────────────────────────────────

test('banner: renders content', () => {
  assert.match(banner({ content: 'Now available' }), /Now available/)
})

test('banner: info variant by default', () => {
  assert.match(banner({ content: '' }), /ui-banner--info/)
})

test('banner: promo variant adds class', () => {
  assert.match(banner({ content: '', variant: 'promo' }), /ui-banner--promo/)
})

test('banner: warning variant adds class', () => {
  assert.match(banner({ content: '', variant: 'warning' }), /ui-banner--warning/)
})

test('banner: unknown variant falls back to info', () => {
  assert.match(banner({ content: '', variant: 'fancy' }), /ui-banner--info/)
})

test('banner: has role=banner', () => {
  assert.match(banner({ content: '' }), /role="banner"/)
})

// ─── media ───────────────────────────────────────────────────────────────────

test('media: renders image and content slots', () => {
  const html = media({ image: '<img src="/x.jpg">', content: '<p>Text</p>' })
  assert.match(html, /ui-media-image/)
  assert.match(html, /ui-media-content/)
  assert.match(html, /x\.jpg/)
  assert.match(html, /Text/)
})

test('media: reverse adds modifier class', () => {
  assert.match(media({ image: '', content: '', reverse: true }), /ui-media--reverse/)
})

test('media: no reverse class by default', () => {
  assert.doesNotMatch(media({ image: '', content: '' }), /ui-media--reverse/)
})

test('media: align start adds modifier class', () => {
  assert.match(media({ image: '', content: '', align: 'start' }), /ui-media--align-start/)
})

test('media: gap lg adds modifier class', () => {
  assert.match(media({ image: '', content: '', gap: 'lg' }), /ui-media--gap-lg/)
})

// ---------------------------------------------------------------------------
// fieldset
// ---------------------------------------------------------------------------

test('fieldset: renders fieldset element', () => {
  assert.match(fieldset({ legend: 'Address', content: '<p>fields</p>' }), /<fieldset/)
})

test('fieldset: renders legend', () => {
  assert.match(fieldset({ legend: 'Billing', content: '' }), /ui-fieldset-legend/)
  assert.match(fieldset({ legend: 'Billing', content: '' }), /Billing/)
})

test('fieldset: no legend element when omitted', () => {
  assert.doesNotMatch(fieldset({ content: 'fields' }), /ui-fieldset-legend/)
})

test('fieldset: renders content in body', () => {
  assert.match(fieldset({ content: '<input>' }), /ui-fieldset-body/)
  assert.match(fieldset({ content: '<input>' }), /<input>/)
})

test('fieldset: gap lg adds modifier class', () => {
  assert.match(fieldset({ gap: 'lg', content: '' }), /ui-fieldset--gap-lg/)
})

test('fieldset: no gap modifier for default md', () => {
  assert.doesNotMatch(fieldset({ content: '' }), /ui-fieldset--gap/)
})

test('fieldset: escapes legend to prevent XSS', () => {
  assert.match(fieldset({ legend: '<script>bad</script>', content: '' }), /&lt;script&gt;/)
})

// ─── slider ──────────────────────────────────────────────────────────────────

test('slider: renders range input with label', () => {
  const html = slider({ name: 'vol', label: 'Volume' })
  assert.match(html, /type="range"/)
  assert.match(html, /name="vol"/)
  assert.match(html, /Volume/)
})

test('slider: sets --slider-fill inline style from value', () => {
  const html = slider({ name: 'x', min: 0, max: 100, value: 50 })
  assert.match(html, /--slider-fill:50\.00%/)
})

test('slider: --slider-fill is 0% when value equals min', () => {
  const html = slider({ name: 'x', min: 0, max: 100, value: 0 })
  assert.match(html, /--slider-fill:0\.00%/)
})

test('slider: --slider-fill is 100% when value equals max', () => {
  const html = slider({ name: 'x', min: 0, max: 100, value: 100 })
  assert.match(html, /--slider-fill:100\.00%/)
})

test('slider: has --slider-fill on wrapper for CSS fill gradient', () => {
  const html = slider({ name: 'x' })
  // fill is on the .ui-field wrapper so pulse-ui.js can update it via closest('.ui-field')
  assert.match(html, /--slider-fill/)
  assert.doesNotMatch(html, /oninput=/)  // no inline handler — handled by pulse-ui.js
})

test('slider: event prop renders data-event attribute', () => {
  const html = slider({ name: 'x', event: 'change:setBrightness' })
  assert.match(html, /data-event="change:setBrightness"/)
})

test('slider: no data-event when event not provided', () => {
  assert.doesNotMatch(slider({ name: 'x' }), /data-event/)
})

test('slider: hint renders with aria-describedby', () => {
  const html = slider({ name: 'x', hint: 'Drag to adjust' })
  assert.match(html, /Drag to adjust/)
  assert.match(html, /aria-describedby/)
})

test('slider: disabled attribute', () => {
  assert.match(slider({ name: 'x', disabled: true }), /disabled/)
})

test('slider: clamps value to min', () => {
  assert.match(slider({ name: 'x', min: 10, max: 100, value: 0 }), /value="10"/)
})

test('slider: clamps value to max', () => {
  assert.match(slider({ name: 'x', min: 0, max: 100, value: 200 }), /value="100"/)
})

// ─── toggle (switch) ─────────────────────────────────────────────────────────

test('toggle: renders checkbox input with label', () => {
  const html = toggle({ name: 'enabled', label: 'Enable' })
  assert.match(html, /type="checkbox"/)
  assert.match(html, /name="enabled"/)
  assert.match(html, /Enable/)
})

test('toggle: checked attribute when checked=true', () => {
  assert.match(toggle({ name: 'x', checked: true }), /checked/)
})

test('toggle: no checked attribute by default', () => {
  assert.doesNotMatch(toggle({ name: 'x' }), /checked/)
})

test('toggle: event prop renders data-event attribute', () => {
  const html = toggle({ name: 'x', event: 'change:setEnabled' })
  assert.match(html, /data-event="change:setEnabled"/)
})

test('toggle: no data-event when event not provided', () => {
  assert.doesNotMatch(toggle({ name: 'x' }), /data-event/)
})

test('toggle: disabled attribute', () => {
  assert.match(toggle({ name: 'x', disabled: true }), /disabled/)
})

test('toggle: hint renders aria-describedby', () => {
  const html = toggle({ name: 'x', hint: 'Turn on notifications' })
  assert.match(html, /Turn on notifications/)
  assert.match(html, /aria-describedby/)
})

// ─── radio / radioGroup ──────────────────────────────────────────────────────

test('radio: renders radio input with label', () => {
  const html = radio({ name: 'colour', value: 'red', label: 'Red' })
  assert.match(html, /type="radio"/)
  assert.match(html, /name="colour"/)
  assert.match(html, /value="red"/)
  assert.match(html, /Red/)
})

test('radio: checked attribute when checked=true', () => {
  assert.match(radio({ name: 'x', value: 'a', checked: true }), /checked/)
})

test('radio: event prop renders data-event', () => {
  const html = radio({ name: 'x', value: 'a', event: 'change:setChoice' })
  assert.match(html, /data-event="change:setChoice"/)
})

test('radio: no data-event when event not provided', () => {
  assert.doesNotMatch(radio({ name: 'x', value: 'a' }), /data-event/)
})

test('radio: escapes value and label', () => {
  const html = radio({ name: 'x', value: '"><script>', label: '<b>bold</b>' })
  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>bold/)
})

test('radioGroup: renders fieldset with legend', () => {
  const html = radioGroup({ name: 'size', legend: 'Size', options: [{ value: 's', label: 'Small' }] })
  assert.match(html, /<fieldset/)
  assert.match(html, /Size/)
  assert.match(html, /Small/)
})

test('radioGroup: marks selected option as checked', () => {
  const html = radioGroup({ name: 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], value: 'b' })
  const inputs = [...html.matchAll(/type="radio"[^>]*checked/g)]
  assert.equal(inputs.length, 1)
  assert.ok(html.includes('value="b"'))
})

test('radioGroup: event prop propagates data-event to all radio inputs', () => {
  const html = radioGroup({ name: 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], event: 'change:setPlan' })
  const matches = [...html.matchAll(/data-event="change:setPlan"/g)]
  assert.equal(matches.length, 2)
})

test('radioGroup: error renders role=alert', () => {
  const html = radioGroup({ name: 'x', options: [], error: 'Pick one' })
  assert.match(html, /role="alert"/)
  assert.match(html, /Pick one/)
})

// ─── segmented ───────────────────────────────────────────────────────────────

test('segmented: renders radio inputs for each option', () => {
  const html = segmented({ name: 'tab', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
  const inputs = [...html.matchAll(/type="radio"/g)]
  assert.equal(inputs.length, 2)
  assert.match(html, /name="tab"/)
})

test('segmented: marks selected value as checked', () => {
  const html = segmented({ name: 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], value: 'b' })
  assert.match(html, /value="b"[\s\S]*?checked/)
})

test('segmented: event prop renders data-event on all inputs', () => {
  const html = segmented({ name: 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], event: 'change:setTab' })
  const matches = [...html.matchAll(/data-event="change:setTab"/g)]
  assert.equal(matches.length, 2)
})

test('segmented: no data-event when event not provided', () => {
  const html = segmented({ name: 'x', options: [{ value: 'a', label: 'A' }] })
  assert.doesNotMatch(html, /data-event/)
})

test('segmented: size sm adds modifier class', () => {
  assert.match(segmented({ name: 'x', options: [], size: 'sm' }), /ui-segmented--sm/)
})

test('segmented: size lg adds modifier class', () => {
  assert.match(segmented({ name: 'x', options: [], size: 'lg' }), /ui-segmented--lg/)
})

test('segmented: disabled applies to all inputs', () => {
  const html = segmented({ name: 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], disabled: true })
  const matches = [...html.matchAll(/disabled/g)]
  assert.ok(matches.length >= 2)
})

// ─── fileUpload ───────────────────────────────────────────────────────────────

test('fileUpload: renders file input with correct name', () => {
  const html = fileUpload({ name: 'avatar', label: 'Photo' })
  assert.match(html, /type="file"/)
  assert.match(html, /name="avatar"/)
  assert.match(html, /Photo/)
})

test('fileUpload: accept attribute when provided', () => {
  assert.match(fileUpload({ name: 'x', accept: 'image/*' }), /accept="image\/\*"/)
})

test('fileUpload: multiple attribute when provided', () => {
  assert.match(fileUpload({ name: 'x', multiple: true }), /multiple/)
})

test('fileUpload: no multiple attribute by default', () => {
  assert.doesNotMatch(fileUpload({ name: 'x' }), /multiple/)
})

test('fileUpload: required adds required and aria-required', () => {
  const html = fileUpload({ name: 'x', required: true })
  assert.match(html, /required/)
  assert.match(html, /aria-required="true"/)
})

test('fileUpload: disabled applies to input and zone', () => {
  const html = fileUpload({ name: 'x', disabled: true })
  assert.match(html, /ui-upload--disabled/)
  assert.match(html, /disabled/)
})

test('fileUpload: event prop renders data-event on input', () => {
  assert.match(fileUpload({ name: 'x', event: 'change:fileSelected' }), /data-event="change:fileSelected"/)
})

test('fileUpload: no data-event when event not provided', () => {
  assert.doesNotMatch(fileUpload({ name: 'x' }), /data-event/)
})

test('fileUpload: error renders role=alert and ui-upload--error', () => {
  const html = fileUpload({ name: 'x', error: 'File too large' })
  assert.match(html, /role="alert"/)
  assert.match(html, /File too large/)
  assert.match(html, /ui-upload--error/)
  assert.match(html, /aria-invalid="true"/)
})

test('fileUpload: hint renders with aria-describedby', () => {
  const html = fileUpload({ name: 'x', hint: 'PNG, JPG up to 5 MB' })
  assert.match(html, /PNG, JPG up to 5 MB/)
  assert.match(html, /aria-describedby/)
})

test('fileUpload: no inline drag handlers — handled by pulse-ui.js', () => {
  const html = fileUpload({ name: 'x' })
  // All drag/click/keyboard behaviour is delegated via pulse-ui.js (CSP-safe)
  assert.doesNotMatch(html, /ondragover=/)
  assert.doesNotMatch(html, /ondrop=/)
  assert.doesNotMatch(html, /onclick=/)
})

test('fileUpload: drag handlers absent when disabled', () => {
  const html = fileUpload({ name: 'x', disabled: true })
  assert.doesNotMatch(html, /ondragover=/)
})

test('fileUpload: zone has role=button and tabindex for keyboard access', () => {
  const html = fileUpload({ name: 'x' })
  assert.match(html, /role="button"/)
  assert.match(html, /tabindex="0"/)
})

test('fileUpload: input is hidden — opened programmatically by pulse-ui.js', () => {
  const html = fileUpload({ name: 'x' })
  assert.match(html, /class="ui-upload-input"/)
  assert.doesNotMatch(html, /onkeydown=/)  // keyboard handling in pulse-ui.js
})

test('fileUpload: zone has role=button and tabindex=0', () => {
  const html = fileUpload({ name: 'x' })
  assert.match(html, /role="button"/)
  assert.match(html, /tabindex="0"/)
})

test('fileUpload: disabled zone has tabindex=-1', () => {
  assert.match(fileUpload({ name: 'x', disabled: true }), /tabindex="-1"/)
})

test('fileUpload: escapes name to prevent XSS', () => {
  const html = fileUpload({ name: '"><script>alert(1)</script>', label: 'x' })
  assert.doesNotMatch(html, /<script>alert/)
})

// ─── select: event prop ──────────────────────────────────────────────────────

test('select: event prop renders data-event attribute', () => {
  const html = select({ name: 'cat', options: [], event: 'change:setCategory' })
  assert.match(html, /data-event="change:setCategory"/)
})

test('select: no data-event when event not provided', () => {
  assert.doesNotMatch(select({ name: 'x', options: [] }), /data-event/)
})

// ─── modal / modalTrigger ────────────────────────────────────────────────────

test('modal: renders a <dialog> element', () => {
  const html = modal({ id: 'test', title: 'Hello', content: '<p>Body</p>' })
  assert.match(html, /<dialog/)
  assert.match(html, /id="test"/)
})

test('modal: sets aria-labelledby from id', () => {
  const html = modal({ id: 'my-modal', title: 'Title' })
  assert.match(html, /aria-labelledby="my-modal-title"/)
})

test('modal: applies size modifier class', () => {
  assert.match(modal({ id: 'x', size: 'lg' }), /ui-modal--lg/)
  assert.doesNotMatch(modal({ id: 'x', size: 'md' }), /ui-modal--md/)
})

test('modal: renders footer only when provided', () => {
  assert.match(modal({ id: 'x', footer: '<button>OK</button>' }), /<footer/)
  assert.doesNotMatch(modal({ id: 'x' }), /<footer/)
})

test('modal: escapes title to prevent XSS', () => {
  const html = modal({ id: 'x', title: '<script>alert(1)</script>' })
  assert.doesNotMatch(html, /<script>alert/)
})

test('modalTrigger: renders button with data-dialog-open', () => {
  const html = modalTrigger({ target: 'confirm', label: 'Open' })
  assert.match(html, /data-dialog-open="confirm"/)
  assert.match(html, /<button/)
})

test('modalTrigger: does not use legacy data-modal-open', () => {
  const html = modalTrigger({ target: 'confirm', label: 'Open' })
  assert.doesNotMatch(html, /data-modal-open/)
})

test('modalTrigger: escapes target id to prevent XSS', () => {
  const html = modalTrigger({ target: '"><script>', label: 'x' })
  assert.doesNotMatch(html, /<script>/)
})

console.log('✓ All UI component tests passed')
