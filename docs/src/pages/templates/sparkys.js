/**
 * Template: Sparkys — Local Trades Business
 *
 * A sharp, trustworthy landing page for a local electrical contractor.
 * Navy + amber palette. Hero with split stats panel, services grid,
 * trust signals, testimonial, and contact strip.
 *
 * Vibe: corporate  Theme: light  Palette: navy / amber
 *
 * component-free — creative override: the top utility strip, trust list, and
 * contact strip are small raw-HTML sections (icon+label pairs / a two-column
 * bar) that replaced the now-removed topStrip/trustList/contactRow components.
 * Services use the kept card() component instead of the removed serviceCard().
 */

import {
  nav, button, footer, card, grid,
  iconZap, iconShield, iconCheck, iconPhone, iconMail, iconHome, iconClock, iconSettings, iconAlertTriangle, iconStar,
} from '../../../../src/ui/index.js'
import { asset } from '../../lib/layout.js'

const PHONE      = '01623 555 014'
const PHONE_HREF = 'tel:+441623555014'
const EMAIL      = 'hello@sparkys-electrical.co.uk'

const services = [
  {
    icon:  iconHome({ size: 22 }),
    title: 'Domestic rewiring & repairs',
    body:  'Full or partial rewires, consumer unit upgrades, sockets, lighting, fault finding — done cleanly and on time.',
  },
  {
    icon:  iconZap({ size: 22 }),
    title: 'EV charger installation',
    body:  'OZEV-approved installers for home and workplace chargers. We handle the survey, install and DNO paperwork.',
  },
  {
    icon:  iconSettings({ size: 22 }),
    title: 'Commercial fit-outs',
    body:  'Offices, retail and light industrial — design, installation and certification under one roof.',
  },
  {
    icon:  iconShield({ size: 22 }),
    title: 'EICR & landlord certificates',
    body:  'Mandatory five-year electrical inspections for rental properties. Same-day digital report.',
  },
  {
    icon:  iconAlertTriangle({ size: 22 }),
    title: 'Emergency 24/7 call-out',
    body:  'Power down? Burning smell? Tripping breakers? An engineer on the road within 60 minutes, day or night.',
  },
  {
    icon:  iconCheck({ size: 22 }),
    title: 'Inspections & testing',
    body:  'Periodic testing, PAT testing, and remedial works to bring older installations up to current regulations.',
  },
]

const why = [
  {
    title: 'Part P registered',
    body:  'NICEIC Approved Contractor. Every job notified to building control — paperwork sorted on your behalf.',
  },
  {
    title: 'Fixed, transparent pricing',
    body:  'Written quotes before we start. No "while we\'re here" surprises and no callout fee on quoted work.',
  },
  {
    title: '£10m public liability',
    body:  'Fully insured for domestic and commercial work, with a 12-month workmanship guarantee on every job.',
  },
]

const service = (s) => card({
  content: `
    <div class="ui-service-card-icon" aria-hidden="true">${s.icon}</div>
    <h3 class="ui-service-card-title">${s.title}</h3>
    <p class="ui-service-card-desc">${s.body}</p>
  `,
  class: 'service-card',
})

const whyItem = (w) => `
  <div class="why__item">
    <h3 class="why__title">${w.title}</h3>
    <p class="why__body">${w.body}</p>
  </div>
`

export default {
  route: '/templates/sparkys',

  meta: {
    title:       'Sparkys — Trusted Electricians in Ashfield',
    description: 'Sparkys are Part P registered electricians serving homes, landlords and businesses across Ashfield. Rewiring, EV chargers, EICRs and 24/7 emergency call-out.',
    theme:       'light',
    styles:      ['/pulse-ui.css', '/sparkys.css'],
    schema: {
      '@context': 'https://schema.org',
      '@type':    'Electrician',
      name:       'Sparkys',
      telephone:  '+44 1623 555014',
      email:      EMAIL,
      areaServed: 'Ashfield, Nottinghamshire',
      address: {
        '@type':         'PostalAddress',
        streetAddress:   '14 Forge Lane',
        addressLocality: 'Sutton-in-Ashfield',
        postalCode:      'NG17 4FX',
        addressCountry:  'GB',
      },
    },
  },

  view: () => `
    <div class="top-strip">
      <div class="top-strip__left">Mon–Sat 7am–7pm · 24/7 emergency line</div>
      <div class="top-strip__right"><a href="${PHONE_HREF}">Call ${PHONE}</a></div>
    </div>

    ${nav({
      logo:     '<strong class="brand-mark">Sparkys</strong>',
      logoHref: '/',
      links: [
        { label: 'Services',    href: '#services' },
        { label: 'Why Sparkys', href: '#why' },
        { label: 'Reviews',     href: '#reviews' },
        { label: 'Contact',     href: '#contact' },
      ],
      action: button({
        label:   'Get a free quote',
        href:    '#contact',
        variant: 'primary',
        size:    'sm',
      }),
      sticky: true,
    })}

    <main id="main-content">
      <section class="hero-split" aria-labelledby="hero-title">
        <div class="hero-split__text">
          <p class="hero-split__eyebrow">Ashfield · Mansfield · Kirkby</p>
          <h1 id="hero-title" class="hero-split__title">Ashfield's trusted electricians, since 2008.</h1>
          <p class="hero-split__subtitle">From a dodgy socket to a full commercial fit-out — Sparkys are the local team homeowners, landlords and businesses call when the job has to be done properly.</p>
          <div class="hero-split__actions">
            ${button({
              label:   'Get a free quote',
              href:    '#contact',
              variant: 'primary',
              size:    'lg',
            })}
            ${button({
              label:   `Call ${PHONE}`,
              href:    PHONE_HREF,
              variant: 'secondary',
              size:    'lg',
              icon:    iconPhone({ size: 16 }),
            })}
          </div>
          <div class="hero-split__trust">
            <ul class="trust-inline">
              ${['Part P registered', 'NICEIC approved', '£10m insured'].map(t => `
                <li class="trust-inline__item">
                  <span class="trust-inline__icon" aria-hidden="true">${iconCheck({ size: 14 })}</span>
                  <span>${t}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        <aside class="hero-split__panel" aria-label="Sparkys at a glance">
          <p class="hero-split__panel-title">Sparkys at a glance</p>
          <dl class="hero-stats">
            <div>
              <dd class="hero-stat__value">24/7</dd>
              <dt class="hero-stat__label">Emergency call-out</dt>
            </div>
            <div>
              <dd class="hero-stat__value">1,200+</dd>
              <dt class="hero-stat__label">Jobs completed</dt>
            </div>
            <div>
              <dd class="hero-stat__value"><span class="hero-stat__rating">4.9${iconStar({ size: 22 })}</span></dd>
              <dt class="hero-stat__label">Average review</dt>
            </div>
            <div>
              <dd class="hero-stat__value">16 yrs</dd>
              <dt class="hero-stat__label">Serving Ashfield</dt>
            </div>
          </dl>
        </aside>
      </section>

      <section id="services" class="section">
        <div class="section__inner">
          <header class="section__head">
            <p class="section__eyebrow">What we do</p>
            <h2 class="section__title">Domestic, commercial and everything in between.</h2>
            <p class="section__subtitle">One local team, certified for every job — so you don't end up juggling three different trades.</p>
          </header>
          ${grid({ cols: 3, gap: 'md', content: services.map(service).join(''), class: 'services' })}
        </div>
      </section>

      <section id="why" class="section section--alt">
        <div class="section__inner">
          <header class="section__head">
            <p class="section__eyebrow">Why Sparkys</p>
            <h2 class="section__title">Certified, insured, and on time.</h2>
            <p class="section__subtitle">The boring stuff that actually matters when an electrician is in your home or business.</p>
          </header>
          <div class="why">
            ${why.map(whyItem).join('')}
          </div>
        </div>
      </section>

      <section id="reviews" class="section">
        <div class="section__inner">
          <figure class="quote">
            <div class="quote__mark" aria-hidden="true">"</div>
            <blockquote class="quote__text">Sparkys rewired our 1930s house top to bottom in five days, on the price they quoted, and tidied up after themselves every evening. Genuinely couldn't fault them.</blockquote>
            <figcaption class="quote__cite">Helen M. · Sutton-in-Ashfield</figcaption>
          </figure>
        </div>
      </section>

      <section id="contact" class="contact-strip" aria-labelledby="contact-title">
        <div class="contact-strip__inner">
          <div>
            <h2 id="contact-title" class="contact-strip__title">Need a sparky? Let's talk.</h2>
            <p class="contact-strip__lead">Free, no-obligation quotes for homes and businesses across Ashfield, Mansfield and the wider NG postcodes.</p>
          </div>
          <div class="contact-strip__details">
            <ul class="contact-inline">
              ${[
                { icon: iconPhone({ size: 18 }), label: PHONE,    href: PHONE_HREF },
                { icon: iconMail({ size: 18 }),  label: EMAIL,    href: `mailto:${EMAIL}` },
                { icon: iconClock({ size: 18 }), label: 'Mon–Sat 7am–7pm · 24/7 emergencies' },
              ].map(({ icon, label, href }) => `
                <li class="contact-inline__item">
                  <span class="contact-inline__icon" aria-hidden="true">${icon}</span>
                  ${href ? `<a href="${href}">${label}</a>` : `<span>${label}</span>`}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </section>
    </main>

    ${footer({
      logo:     '<span class="site-footer__brand">Sparkys</span>',
      logoHref: '/',
      links: [
        { label: 'Services', href: '#services' },
        { label: 'Reviews',  href: '#reviews' },
        { label: 'Contact',  href: '#contact' },
      ],
      legal: '© 2026 Sparkys Electrical Ltd · NICEIC 60123456 · Reg. in England 09876543',
    })}
    <script src="${asset('/pulse-ui.js')}" defer></script>
  `,
}
