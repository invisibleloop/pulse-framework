/**
 * Template: Shop — Product Page
 *
 * A clean, interactive e-commerce product page.
 * Light theme, blue accent. Full add-to-cart flow with a basket modal,
 * quantity controls, spec grid, and key stats.
 *
 * Vibe: minimal  Theme: light  Palette: blue / white
 *
 * Demonstrates:
 *   - nav() with a custom cart icon trigger and dialog-open
 *   - modal() basket with a live cart table
 *   - Quantity stepper with min/max constraints
 *   - displayHeading(), badge(), sectionLabel(), stat(), grid()
 *   - _toast on mutation success
 *   - Light theme with custom accent override
 */

import {
  nav, displayHeading, badge, sectionLabel, stat, grid,
  button, modal, empty,
  iconPlus, iconMinus, iconShoppingCart, iconCheck, iconPackage,
  colophon,
} from '../../../../src/ui/index.js'
import { asset } from '../../lib/layout.js'

const SPECS = [
  { label: 'Display',    value: '15.6" Retina, 2560×1664' },
  { label: 'Processor',  value: 'M3 Pro, 12-core CPU' },
  { label: 'Memory',     value: '32GB Unified Memory' },
  { label: 'Storage',    value: '1TB SSD' },
  { label: 'Battery',    value: 'Up to 18 hours' },
  { label: 'Chassis',    value: 'Space Grey Aluminium' },
  { label: 'Ports',      value: '3× USB-C, HDMI, SD card' },
  { label: 'Weight',     value: '1.86 kg' },
]

const UNIT_PRICE = 1899

export const formatPrice = (p) => `£${p.toLocaleString('en-GB')}`
export const cartTotal   = (items) => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
export const cartCount   = (items) => items.reduce((sum, i) => sum + i.qty, 0)

const cartRows = (items) => items.map(({ name, qty, unitPrice }) => [
  name,
  String(qty),
  formatPrice(unitPrice),
  formatPrice(qty * unitPrice),
])

export default {
  route: '/templates/shop',
  meta: {
    title:       'Shop — Product Page Template · Pulse',
    description: 'Interactive e-commerce product page with cart modal, quantity controls, and spec grid. Built with Pulse.',
    styles:      [
      asset('/pulse-ui.css'),
      asset('/shop.css'),
    ],
    theme: 'light',
  },
  state: {
    qty:       1,
    cartItems: [],
    added:     false,
  },
  mutations: {
    increment: (state) => ({
      qty:   Math.min(state.qty + 1, 10),
      added: false,
    }),
    decrement: (state) => ({
      qty:   Math.max(state.qty - 1, 1),
      added: false,
    }),
    addToCart: (state) => {
      const existing = state.cartItems.find(i => i.name === 'DevBook Pro 15')
      const cartItems = existing
        ? state.cartItems.map(i =>
            i.name === 'DevBook Pro 15'
              ? { ...i, qty: i.qty + state.qty }
              : i
          )
        : [...state.cartItems, { name: 'DevBook Pro 15', qty: state.qty, unitPrice: UNIT_PRICE }]
      return {
        cartItems,
        added:  true,
        _toast: { message: `${state.qty} × DevBook Pro 15 added to cart`, variant: 'success' },
      }
    },
  },
  view: (state) => {
    const count = cartCount(state.cartItems)
    const total = cartTotal(state.cartItems)

    return `
    ${nav({
      logo:     `${iconPackage({ size: 18 })} Tech Stuff Inc.`,
      logoHref: '/',
      sticky:   true,
      links:    [
        { label: 'Laptops',     href: '/templates/shop' },
        { label: 'Accessories', href: '#' },
        { label: 'Support',     href: '#' },
      ],
      action: `
        <button
          type="button"
          class="cart-trigger"
          data-dialog-open="cart"
          aria-label="${count > 0 ? `Open basket, ${count} item${count !== 1 ? 's' : ''}` : 'Open basket'}"
        >
          ${iconShoppingCart({ size: 18 })}
          ${count > 0 ? `<span class="cart-bubble" aria-hidden="true">${count}</span>` : ''}
        </button>
      `,
    })}

    <script src="${asset('/pulse-ui.js')}" defer></script>

    <main id="main-content">

      <div class="page-body product-display">
        ${displayHeading({ text: 'DevBook Pro 15', level: 1, tracking: 'tight' })}
        <p class="product-tagline">Premium developer laptop for people who build things.</p>
        <div class="product-meta-row">
          ${badge({ label: 'In Stock', variant: 'success' })}
          ${badge({ label: 'Ships in 24 hours', variant: 'info' })}
        </div>
      </div>

      ${modal({
        id:      'cart',
        title:   'Your basket',
        level:   2,
        size:    'lg',
        content: state.cartItems.length === 0
          ? empty({ title: 'Your basket is empty', description: 'Add a product to get started.' })
          : `
            <table class="ui-table cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" class="cart-col-num">Qty</th>
                  <th scope="col" class="cart-col-num">Unit price</th>
                  <th scope="col" class="cart-col-num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${cartRows(state.cartItems).map(([name, qty, unit, sub]) => `
                  <tr>
                    <td>${name}</td>
                    <td class="cart-col-num">${qty}</td>
                    <td class="cart-col-num">${unit}</td>
                    <td class="cart-col-num">${sub}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="cart-total-row">
                  <td colspan="3"><strong>Total</strong></td>
                  <td class="cart-col-num"><strong>${formatPrice(total)}</strong></td>
                </tr>
              </tfoot>
            </table>
          `,
        footer: `
          ${button({ label: 'Continue shopping', variant: 'secondary', attrs: { 'data-dialog-close': '' } })}
          ${button({ label: 'Checkout', variant: 'primary', disabled: state.cartItems.length === 0 })}
        `,
      })}

      <img
        class="product-photo"
        src="/images/shop/devbook-pro.jpg"
        alt="DevBook Pro 15 open on a clean white desk showing a code editor, with headphones, a coffee mug, and a plant nearby"
        width="1366"
        height="912"
      />

      <div class="page-body product-purchase">
        <p class="product-price">£1,899</p>

        <div class="qty-control">
          ${button({
            label:    'Decrease quantity',
            variant:  'secondary',
            size:     'sm',
            disabled: state.qty <= 1,
            icon:     iconMinus({ size: 14 }),
            class:    'qty-btn',
            attrs:    { 'data-event': 'decrement', 'aria-label': 'Decrease quantity' },
          })}
          <span class="qty-value" aria-live="polite">${state.qty}</span>
          ${button({
            label:    'Increase quantity',
            variant:  'secondary',
            size:     'sm',
            disabled: state.qty >= 10,
            icon:     iconPlus({ size: 14 }),
            class:    'qty-btn',
            attrs:    { 'data-event': 'increment', 'aria-label': 'Increase quantity' },
          })}
        </div>

        <div class="cart-actions">
          ${button({
            label:   state.added ? 'Added to cart' : 'Add to cart',
            variant: 'primary',
            size:    'lg',
            icon:    state.added ? iconCheck({ size: 16 }) : iconShoppingCart({ size: 16 }),
            attrs:   { 'data-event': 'addToCart' },
          })}
        </div>
        ${state.added ? `<p class="added-confirm">${state.cartItems.find(i => i.name === 'DevBook Pro 15')?.qty ?? 0} item${(state.cartItems.find(i => i.name === 'DevBook Pro 15')?.qty ?? 0) !== 1 ? 's' : ''} in your basket.</p>` : ''}
      </div>

      <div class="page-body product-specs">
        ${sectionLabel({ eyebrow: 'Under the hood', heading: 'Full specifications', rule: true })}
        <div class="spec-grid">
          ${SPECS.map(({ label, value }) => `
            <div class="spec-item">
              <span class="spec-label">${label}</span>
              <span class="spec-value">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="page-body product-stats">
        ${sectionLabel({ eyebrow: 'At a glance', heading: 'Key numbers', rule: true })}
        <div class="product-stats-grid">
          ${grid({ cols: 3, content:
            stat({ label: 'Battery life', value: '18 hrs', trend: 'up' }) +
            stat({ label: 'Unified memory', value: '32 GB' }) +
            stat({ label: 'Delivery', value: '24 hrs', trend: 'up' })
          })}
        </div>
      </div>

    </main>

    ${colophon({
      content: `<p>© 2026 Tech Stuff Inc. · <a href="#">Terms</a> · <a href="#">Privacy</a></p>`,
      align: 'center',
    })}
  `
  },

  onViewError: () => `
    <main id="main-content">
      <div class="view-error">
        <p>Something went wrong loading this page. <a href="/templates/shop">Reload</a></p>
      </div>
    </main>
  `,
}
