/**
 * Pulse — Retro Wheels Co. example
 *
 * Demonstrates:
 *   - Retro/vintage light-theme branding (1970s enamel-sign aesthetic)
 *   - stat(), testimonial(), cta(), card(), badge() layout components
 *   - Icon imports: iconMapPin, iconPhone, iconClock, iconSend, iconStar
 *   - Async action with onStart / run / onSuccess / onError lifecycle
 *   - State-driven form (idle → sending → sent) with disabled submit
 *   - input() fields inside a card() for the booking enquiry
 *   - System web fonts (Rockwell + Courier New) — zero extra HTTP requests
 *   - Full-bleed hero with background image + gradient overlay
 *   - Stat strip with inverted navy background
 *   - Drop cap typography for editorial prose section
 *   - Opening hours list with Courier monospace styling
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/retrowheels
 */

import {
  nav, footer, button, input, stat, testimonial, cta, card, badge,
} from '../src/ui/index.js'
import { iconMapPin, iconPhone, iconClock, iconSend, iconStar } from '../src/ui/icons.js'

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const SERVICES = [
  {
    num:   'No. 01',
    title: 'Restored Vintage Bicycles',
    body:  'Lovingly rebuilt Raleighs, Peugeots, and Bianchis from the workshop. Each one inspected, polished, and ready for the road.',
    price: 'From £325',
  },
  {
    num:   'No. 02',
    title: 'Hand-Built City Cruisers',
    body:  'Lugged steel frames, leather saddles, and brass bells. Built to your measurements over four to six weeks.',
    price: 'From £1,100',
  },
  {
    num:   'No. 03',
    title: 'Full-Service Workshop',
    body:  'Brakes, gears, wheels, headsets — whatever the trouble. We work on every era from penny-farthings to ten-speeds.',
    price: 'From £45',
  },
  {
    num:   'No. 04',
    title: 'Steel-Frame Tune-Ups',
    body:  'Bottom bracket overhaul, hub repack, true the wheels, polish the chrome. Your old steed will ride like 1976 again.',
    price: '£95',
  },
  {
    num:   'No. 05',
    title: 'Saddles & Leather Goods',
    body:  'Brooks saddles, twine-wrapped bar tape, canvas tool rolls, and waxed cotton panniers. Stocked and ready to fit.',
    price: 'From £18',
  },
  {
    num:   'No. 06',
    title: 'Weekend Group Rides',
    body:  'Every Saturday at 9 a.m. — twenty miles, a cafe stop, and home by lunch. All paces, all bikes, all welcome.',
    price: 'Free · BYO bicycle',
  },
]

const HOURS = [
  { day: 'Tuesday',   time: '9 a.m. — 6 p.m.' },
  { day: 'Wednesday', time: '9 a.m. — 6 p.m.' },
  { day: 'Thursday',  time: '9 a.m. — 7 p.m.' },
  { day: 'Friday',    time: '9 a.m. — 6 p.m.' },
  { day: 'Saturday',  time: '9 a.m. — 5 p.m.' },
  { day: 'Sunday',    time: '10 a.m. — 4 p.m.' },
  { day: 'Monday',    time: 'Closed', closed: true },
]

const REVIEWS = [
  {
    quote:  'They rebuilt my grandfather\u2019s 1972 Raleigh Twenty as if it had just left the factory. I cried a little. Worth every penny.',
    name:   'Eleanor Bishop',
    role:   'Brought back from the loft',
    rating: 5,
  },
  {
    quote:  'The custom cruiser I commissioned is the loveliest object I own. Hand-pinstriped name on the down tube. A proper bicycle.',
    name:   'Marcus O\u2019Halloran',
    role:   'Custom build, Spring 2026',
    rating: 5,
  },
  {
    quote:  'Saturday ride is the best thing in my week. Twenty miles, a cafe stop, and not a single person in lycra. Bliss.',
    name:   'Priya Ramachandran',
    role:   'Weekend rider since 2024',
    rating: 5,
  },
]

// Logo uses system web fonts — no external request needed
const LOGO = `<span class="rw-logo-text">Retro Wheels Co.</span>`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderService = (s) => `
  <article class="rw-service">
    <p class="rw-service-num">${s.num}</p>
    <h3>${s.title}</h3>
    <p>${s.body}</p>
    <p class="rw-service-price">${s.price}</p>
  </article>
`

const renderHourRow = (h) => `
  <li class="rw-hours-row">
    <span>${h.day}</span>
    <span class="${h.closed ? 'rw-closed' : ''}">${h.time}</span>
  </li>
`

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/retrowheels',

  meta: {
    title:       'Retro Wheels Co. — Restored vintage bicycles, est. 1976',
    description: 'A neighbourhood bicycle shop specialising in restored vintage bikes, hand-built city cruisers, and old-school repairs. Established 1976.',
    theme:       'light',
    styles:      ['/pulse-ui.css', '/examples/retrowheels.css'],
  },

  state: {
    status: 'idle',   // idle | sending | sent
  },

  view: (state) => `
    <a href="#main-content" class="rw-skip-link">Skip to main content</a>

    ${nav({
      logo:     LOGO,
      logoHref: '/retrowheels',
      sticky:   true,
      links: [
        { label: 'Workshop', href: '#workshop' },
        { label: 'Services', href: '#services' },
        { label: 'Reviews',  href: '#reviews'  },
        { label: 'Visit',    href: '#visit'    },
      ],
      action: button({ label: 'Book a service', href: '#book', size: 'sm' }),
    })}

    <main id="main-content">
      <section class="rw-hero" aria-labelledby="hero-title">
        <div class="rw-hero-inner">
          <p class="rw-hero-eyebrow">Established 1976</p>
          <h1 id="hero-title" class="rw-hero-title">
            Steel frames,<br>
            <em>old roads,</em><br>
            new adventures.
          </h1>
          <p class="rw-hero-sub">
            A neighbourhood bicycle shop on Saddler Lane &mdash; restoring vintage bikes,
            hand-building city cruisers, and keeping every steel-framed bicycle in town
            rolling sweetly since the Carter administration.
          </p>
          <div class="rw-hero-actions">
            ${button({ label: 'Browse the workshop', href: '#services', variant: 'primary',   size: 'lg' })}
            ${button({ label: 'Saturday ride',       href: '#ride',     variant: 'secondary', size: 'lg' })}
          </div>
        </div>
        <p class="rw-hero-image-credit">Photo: Unsplash</p>
      </section>

      <section class="rw-stat-strip" aria-label="Shop facts">
        <div class="rw-stat-strip-inner">
          ${stat({ label: 'Established',    value: '1976',   center: true })}
          ${stat({ label: 'Bikes restored', value: '2,400+', center: true })}
          ${stat({ label: 'Saturday riders', value: '60/wk', center: true })}
          ${stat({ label: 'Carbon fibre',   value: 'None',   center: true })}
        </div>
      </section>

      <section id="workshop" class="rw-editorial">
        <p class="rw-eyebrow">The Workshop</p>
        <h2 class="rw-section-title u-mt-3">A bicycle is a promise that you&rsquo;ll go outside.</h2>
        <hr class="rw-rule">
        <p>
          We opened in the autumn of 1976 in a former ironmonger&rsquo;s on Saddler Lane.
          Fifty years on, the floorboards still creak, the tea is still strong, and the
          workbench is still covered in the same small jars of cotter pins and brass
          ferrules. What we build today is the same thing we built then: bicycles you
          could leave to your grandchildren.
        </p>
        <p>
          We don&rsquo;t do carbon. We don&rsquo;t do electronic shifting. We do lugged steel,
          hand-built wheels, three-speed hubs, and a fair few French derailleurs that
          require patience and the correct sort of grease. If your bicycle has a name,
          we&rsquo;d like to meet it.
        </p>
        ${badge({ label: 'Repairs by appointment · Workshop open Tues — Sun', variant: 'default' })}
      </section>

      <section id="services" class="rw-section rw-section--alt">
        <div class="rw-section-inner">
          <p class="rw-eyebrow">Services &amp; Goods</p>
          <h2 class="rw-section-title">Six things we&rsquo;re rather good at.</h2>
          <p class="rw-section-deck">
            Prices are honest, the work is guaranteed for a year, and every bicycle that
            leaves the workshop has been ridden round the block by someone who actually
            cares.
          </p>
          <div class="rw-service-grid">
            ${SERVICES.map(renderService).join('')}
          </div>
        </div>
      </section>

      <section id="reviews" class="rw-section">
        <div class="rw-section-inner">
          <p class="rw-eyebrow">From the Logbook</p>
          <h2 class="rw-section-title">What folks have been saying.</h2>
          <p class="rw-section-deck">Reviews collected from customers, riders, and the occasional postcard pinned to the workshop wall.</p>
          <div class="rw-service-grid">
            ${REVIEWS.map(r => testimonial(r)).join('')}
          </div>
        </div>
      </section>

      <section id="visit" class="rw-section rw-section--alt">
        <div class="rw-section-inner">
          <p class="rw-eyebrow">Visit the Shop</p>
          <h2 class="rw-section-title">Find us, ring us, or write.</h2>
          <hr class="rw-rule">
          <div class="rw-visit-grid">
            <div>
              <h3 class="rw-hours-heading">
                ${iconClock({ size: 18 })} Opening hours
              </h3>
              <ul class="rw-hours" aria-label="Opening hours">
                ${HOURS.map(renderHourRow).join('')}
              </ul>
              <div class="rw-address">
                <p><strong>${iconMapPin({ size: 16 })} 14 Saddler Lane</strong><br>
                Trumpington, Cambridge<br>
                CB2 9PQ</p>
                <p class="u-mt-3">${iconPhone({ size: 16 })} 01223 555 0176<br>
                hello@retrowheels.co</p>
              </div>
            </div>

            <div id="book">
              ${card({
                title:   'Book a service',
                level:   3,
                content: state.status === 'sent'
                  ? `<p>Thanks &mdash; we&rsquo;ll be in touch within a working day. Tea&rsquo;s on when you arrive.</p>`
                  : `<form data-action="bookService" novalidate>
                       <p class="u-mb-4 u-text-muted">Drop us a line about your bicycle. We&rsquo;ll reply with a slot and an estimate.</p>
                       ${input({ name: 'name',  label: 'Your name',               required: true })}
                       ${input({ name: 'email', label: 'Email',                   type: 'email', required: true, class: 'u-mt-3' })}
                       ${input({ name: 'bike',  label: 'Bicycle (make, year)',    placeholder: 'e.g. 1972 Raleigh Twenty', class: 'u-mt-3' })}
                       <div class="u-mt-4">
                         ${button({
                           label: state.status === 'sending' ? 'Sending\u2026' : 'Send enquiry',
                           type:  'submit',
                           icon:  iconSend({ size: 16 }),
                           attrs: state.status === 'sending' ? { 'aria-busy': 'true', disabled: '' } : {},
                         })}
                       </div>
                     </form>`,
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="ride" class="rw-ride-banner">
        <p class="rw-eyebrow rw-eyebrow--on-orange">Every Saturday, 9 a.m. sharp</p>
        <h2>${iconStar({ size: 28 })} Join the Saturday ride.</h2>
        <p>Twenty miles, one cafe stop, no lycra required. Meet at the shop. Helmets sensible, bicycle of any vintage welcome.</p>
        ${button({ label: 'Add me to the list', href: '#book', variant: 'secondary', size: 'lg' })}
      </section>

      <section class="rw-section">
        <div class="rw-section-inner">
          ${cta({
            eyebrow:  'Workshop & Showroom',
            title:    'Bring us a bicycle. Leave with a story.',
            subtitle: 'Walk-ins welcome during opening hours. The kettle is always on.',
            actions:  button({ label: 'Find the shop', href: '#visit', variant: 'primary', size: 'lg' }),
          })}
        </div>
      </section>
    </main>

    ${footer({
      logo:  LOGO,
      links: [
        { label: 'Workshop',      href: '#workshop' },
        { label: 'Services',      href: '#services' },
        { label: 'Visit',         href: '#visit'    },
        { label: 'Saturday ride', href: '#ride'     },
      ],
      legal: '\u00a9 1976 \u2014 2026 Retro Wheels Co. \u00b7 14 Saddler Lane, Cambridge \u00b7 A bicycle is forever.',
    })}
  `,

  actions: {
    bookService: {
      onStart: () => ({ status: 'sending' }),
      run: async (_state, _server, formData) => {
        const name  = (formData.get('name')  || '').trim()
        const email = (formData.get('email') || '').trim()
        if (!name)  throw new Error('Please tell us your name.')
        if (!email) throw new Error('Please leave an email so we can reply.')
        await new Promise(r => setTimeout(r, 350))
        return { name }
      },
      onSuccess: () => ({
        status: 'sent',
        _toast: { message: 'Enquiry sent \u2014 we\u2019ll be in touch shortly.', variant: 'success' },
      }),
      onError: (_state, err) => ({
        status: 'idle',
        _toast: { message: err.message || 'Something went wrong. Try again?', variant: 'error' },
      }),
    },
  },

  onViewError: () => `
    <main id="main-content" class="rw-editorial">
      <h1>Spanner in the works</h1>
      <p>Something went sideways. <a href="/retrowheels">Reload the page</a> or give us a ring on 01223 555 0176.</p>
    </main>
  `,
}
