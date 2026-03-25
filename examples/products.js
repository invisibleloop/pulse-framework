/**
 * Pulse — Product catalog example
 *
 * Demonstrates:
 *   - Server data (20 mock products fetched before render)
 *   - Client-side search, category filter, and sort — all via mutations
 *   - Streaming SSR (shell instant, product grid deferred)
 *   - Empty state when no results match
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/products
 */

import { badge, button, empty, card, heading, search, select, uiImage } from '../src/ui/index.js'
import { examplesNav } from './shared.js'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1,  name: 'Arc Desk Lamp',          category: 'Lighting',    price: 89,  rating: 4.8, reviews: 312, img: 'https://picsum.photos/seed/desklamp/400/280',     featured: true  },
  { id: 2,  name: 'Walnut Desk Tray',        category: 'Storage',     price: 45,  rating: 4.7, reviews: 189, img: 'https://picsum.photos/seed/desktray/400/280',     featured: false },
  { id: 3,  name: 'Linen Desk Pad',          category: 'Accessories', price: 32,  rating: 4.6, reviews: 445, img: 'https://picsum.photos/seed/deskpad/400/280',      featured: false },
  { id: 4,  name: 'Cable Management Kit',    category: 'Accessories', price: 24,  rating: 4.5, reviews: 678, img: 'https://picsum.photos/seed/cables/400/280',       featured: false },
  { id: 5,  name: 'Monitor Riser',           category: 'Furniture',   price: 65,  rating: 4.9, reviews: 521, img: 'https://picsum.photos/seed/monitorriser/400/280', featured: true  },
  { id: 6,  name: 'Ergonomic Chair Cushion', category: 'Furniture',   price: 79,  rating: 4.4, reviews: 234, img: 'https://picsum.photos/seed/cushion/400/280',      featured: false },
  { id: 7,  name: 'Wireless Charger Pad',    category: 'Accessories', price: 38,  rating: 4.3, reviews: 390, img: 'https://picsum.photos/seed/charger/400/280',      featured: false },
  { id: 8,  name: 'Bamboo Shelf Organiser',  category: 'Storage',     price: 55,  rating: 4.6, reviews: 167, img: 'https://picsum.photos/seed/bamboo/400/280',       featured: false },
  { id: 9,  name: 'Mechanical Keyboard',     category: 'Peripherals', price: 129, rating: 4.9, reviews: 891, img: 'https://picsum.photos/seed/keyboard/400/280',     featured: true  },
  { id: 10, name: 'Wrist Rest Pad',          category: 'Accessories', price: 29,  rating: 4.2, reviews: 276, img: 'https://picsum.photos/seed/wristrest/400/280',    featured: false },
  { id: 11, name: 'Desk Plant Pot',          category: 'Decor',       price: 22,  rating: 4.7, reviews: 152, img: 'https://picsum.photos/seed/plantpot/400/280',     featured: false },
  { id: 12, name: 'Anti-Fatigue Mat',        category: 'Furniture',   price: 94,  rating: 4.5, reviews: 308, img: 'https://picsum.photos/seed/floormat/400/280',     featured: false },
  { id: 13, name: 'USB-C Hub 7-in-1',        category: 'Peripherals', price: 69,  rating: 4.8, reviews: 622, img: 'https://picsum.photos/seed/usbhub/400/280',       featured: false },
  { id: 14, name: 'Sticky Note Dispenser',   category: 'Storage',     price: 18,  rating: 4.1, reviews: 99,  img: 'https://picsum.photos/seed/stickynote/400/280',   featured: false },
  { id: 15, name: 'LED Bias Light Strip',    category: 'Lighting',    price: 42,  rating: 4.6, reviews: 287, img: 'https://picsum.photos/seed/ledstrip/400/280',     featured: false },
  { id: 16, name: 'Laptop Stand',            category: 'Furniture',   price: 58,  rating: 4.7, reviews: 734, img: 'https://picsum.photos/seed/laptopstand/400/280',  featured: true  },
  { id: 17, name: 'Noise Cancelling Muffs',  category: 'Peripherals', price: 49,  rating: 4.4, reviews: 213, img: 'https://picsum.photos/seed/headphones/400/280',   featured: false },
  { id: 18, name: 'Desktop Calendar',        category: 'Decor',       price: 16,  rating: 4.3, reviews: 88,  img: 'https://picsum.photos/seed/calendar/400/280',     featured: false },
  { id: 19, name: 'Document Scanner',        category: 'Peripherals', price: 149, rating: 4.8, reviews: 445, img: 'https://picsum.photos/seed/scanner/400/280',      featured: false },
  { id: 20, name: 'Velvet Pen Cup',          category: 'Decor',       price: 19,  rating: 4.5, reviews: 131, img: 'https://picsum.photos/seed/pencup/400/280',       featured: false },
]

export const CATEGORIES = ['All', ...new Set(PRODUCTS.map(p => p.category))].sort((a, b) =>
  a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
)

export function applyFilters(products, search, category, sort) {
  let out = products

  if (category && category !== 'All') {
    out = out.filter(p => p.category === category)
  }

  if (search) {
    const q = search.toLowerCase()
    out = out.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }

  if (sort === 'price-asc')    out = [...out].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc')   out = [...out].sort((a, b) => b.price - a.price)
  if (sort === 'rating')       out = [...out].sort((a, b) => b.rating - a.rating)
  if (sort === 'reviews')      out = [...out].sort((a, b) => b.reviews - a.reviews)

  return out
}

// ─── Spec ────────────────────────────────────────────────────────────────────

export default {
  route:   '/products',
  hydrate: '/examples/products.js',

  meta: {
    title:       'Products — Pulse',
    description: 'A product catalog built with Pulse. Demonstrates server data, client-side filtering, search, and sort.',
    styles:      ['/pulse-ui.css', '/examples/products.css'],
    theme:       'light',
  },

  server: {
    products: async () => PRODUCTS,
  },

  stream: {
    shell:    ['header', 'filters'],
    deferred: ['grid'],
  },

  state: {
    search:   '',
    category: 'All',
    sort:     'featured',
  },

  mutations: {
    setSearch:   (_state, e) => ({ search:   e.target.value }),
    setCategory: (_state, e) => ({ category: e.target.closest('[data-cat]')?.dataset.cat || 'All' }),
    setSort:     (_state, e) => ({ sort:     e.target.value }),
    clearSearch: () => ({ search: '' }),
  },

  view: {
    header: (state, server) => {
      const total    = server.products?.length ?? 0
      const filtered = applyFilters(server.products ?? [], state.search, state.category, state.sort)

      return `<div class="pd-root">
  ${examplesNav('<span class="pd-logo-text">🛍 Products</span>', '/products')}

  <main id="main-content" class="pd-main">

    <div class="pd-page-header">
      <div>
        ${heading({ level: 1, text: 'Home Office', size: '2xl' })}
        <p class="pd-subtitle">Showing <strong>${filtered.length}</strong> of <strong>${total}</strong> products</p>
      </div>
      <div class="pd-sort-wrap">
        ${select({ name: 'sort', label: 'Sort by', event: 'change:setSort', value: state.sort, options: [
          { value: 'featured',   label: 'Featured'           },
          { value: 'price-asc',  label: 'Price: low to high' },
          { value: 'price-desc', label: 'Price: high to low' },
          { value: 'rating',     label: 'Top rated'          },
          { value: 'reviews',    label: 'Most reviewed'      },
        ]})}
      </div>
    </div>`
    },

    filters: (state) => {
      return `
    <div class="pd-sidebar">

      ${search({ name: 'search', label: 'Search', placeholder: 'Search products…', value: state.search, event: 'input:setSearch', debounce: 200, clearEvent: 'clearSearch' })}

      <div class="pd-category-wrap">
        <p class="pd-sidebar-label">Category</p>
        <ul class="pd-categories" role="list">
          ${CATEGORIES.map(cat => `<li>
            ${button({ label: cat, variant: state.category === cat ? 'primary' : 'secondary', size: 'sm', class: 'pd-cat-pill', attrs: { 'data-event': 'setCategory', 'data-cat': cat, 'aria-pressed': String(state.category === cat) } })}
          </li>`).join('')}
        </ul>
      </div>

    </div>`
    },

    grid: (state, server) => {
      const filtered = applyFilters(server.products ?? [], state.search, state.category, state.sort)

      const gridContent = filtered.length === 0
        ? empty({
            title:       'No products found',
            description: state.search ? `No results for "${esc(state.search)}".` : 'Try a different category.',
          })
        : `<ul class="pd-grid" aria-label="Products">
            ${filtered.map(p => `<li>
              ${card({
                flush: true,
                content: `
                  ${uiImage({ src: p.img, alt: p.name, ratio: '16/9' })}
                  <div class="pd-product-body">
                    <div class="pd-product-meta">
                      ${badge({ label: p.category, variant: 'default' })}
                      ${p.featured ? badge({ label: 'Featured', variant: 'info' }) : ''}
                    </div>
                    ${heading({ level: 2, text: p.name, size: 'sm' })}
                    <div class="pd-product-stats">
                      <span class="pd-rating" aria-label="${p.rating} out of 5 stars">★ ${p.rating}</span>
                      <span class="pd-reviews">(${p.reviews.toLocaleString()})</span>
                    </div>
                    <p class="pd-price">£${p.price}</p>
                  </div>
                `,
              })}
            </li>`).join('')}
          </ul>`

      return `
    <div class="pd-content">
      ${gridContent}
    </div>

  </main>
</div>`
    },
  },
}
