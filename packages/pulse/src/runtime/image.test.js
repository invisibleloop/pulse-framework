/**
 * Pulse — Image helper tests
 * run: node src/runtime/image.test.js
 */

import { img, picture } from './image.js'

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${label}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

// ---------------------------------------------------------------------------

console.log('\nimg()\n')

test('renders src and alt', () => {
  const out = img({ src: '/photo.jpg', alt: 'A photo' })
  assert(out.includes('src="/photo.jpg"'), `Missing src: ${out}`)
  assert(out.includes('alt="A photo"'),    `Missing alt: ${out}`)
})

test('renders width and height', () => {
  const out = img({ src: '/x.jpg', alt: '', width: 800, height: 600 })
  assert(out.includes('width="800"'),  `Missing width: ${out}`)
  assert(out.includes('height="600"'), `Missing height: ${out}`)
})

test('defaults to lazy loading', () => {
  const out = img({ src: '/x.jpg', alt: '' })
  assert(out.includes('loading="lazy"'), `Expected lazy: ${out}`)
  assert(!out.includes('fetchpriority="high"'), `Should not have high priority: ${out}`)
})

test('priority sets eager loading and high fetchpriority', () => {
  const out = img({ src: '/hero.jpg', alt: 'Hero', priority: true })
  assert(out.includes('loading="eager"'),       `Expected eager: ${out}`)
  assert(out.includes('fetchpriority="high"'),  `Expected high fetchpriority: ${out}`)
})

test('always includes decoding="async"', () => {
  const out = img({ src: '/x.jpg', alt: '' })
  assert(out.includes('decoding="async"'), `Missing decoding: ${out}`)
})

test('applies class attribute', () => {
  const out = img({ src: '/x.jpg', alt: '', class: 'card-img' })
  assert(out.includes('class="card-img"'), `Missing class: ${out}`)
})

test('escapes alt text', () => {
  const out = img({ src: '/x.jpg', alt: 'A "quoted" & <tagged> image' })
  assert(!out.includes('"quoted"'),  `Should escape quotes in alt: ${out}`)
  assert(out.includes('&amp;'),      `Should escape & in alt: ${out}`)
})

// ---------------------------------------------------------------------------

console.log('\npicture()\n')

test('wraps img in picture element', () => {
  const out = picture({ src: '/x.jpg', alt: 'test', width: 100, height: 100 })
  assert(out.includes('<picture>'),  `Missing <picture>: ${out}`)
  assert(out.includes('</picture>'), `Missing </picture>: ${out}`)
  assert(out.includes('<img '),      `Missing <img>: ${out}`)
})

test('includes source elements for each format', () => {
  const out = picture({
    src: '/x.jpg', alt: '',
    sources: [
      { src: '/x.avif', type: 'image/avif' },
      { src: '/x.webp', type: 'image/webp' },
    ]
  })
  assert(out.includes('image/avif'), `Missing avif source: ${out}`)
  assert(out.includes('image/webp'), `Missing webp source: ${out}`)
  assert(out.includes('srcset="/x.avif"'), `Missing avif srcset: ${out}`)
})

test('sources appear before fallback img', () => {
  const out = picture({
    src: '/x.jpg', alt: '',
    sources: [{ src: '/x.webp', type: 'image/webp' }]
  })
  assert(out.indexOf('<source') < out.indexOf('<img'), `source must precede img: ${out}`)
})

test('priority propagates to inner img', () => {
  const out = picture({ src: '/x.jpg', alt: 'Hero', priority: true, sources: [] })
  assert(out.includes('fetchpriority="high"'), `Expected high priority in picture: ${out}`)
})

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
