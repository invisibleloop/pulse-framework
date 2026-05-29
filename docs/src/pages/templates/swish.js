/**
 * Pulse — Swish example
 *
 * Demonstrates:
 *   - Editorial light-theme branding (fashion / luxury ecommerce)
 *   - Composing nav, section, container, grid, pullquote, button, footer, input
 *   - Custom component helpers (look card, strip cell, journal card)
 *   - Google Fonts integration via meta.styles
 *   - Full-bleed hero with CSS background image + gradient overlay
 *   - Responsive grid, lookbook strip, image-led journal cards
 *   - Newsletter sign-up form using the input() component
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/swish
 */

import {
  nav,
  section,
  container,
  grid,
  pullquote,
  button,
  footer,
  input,
} from '../../../../src/ui/index.js'

// ---------------------------------------------------------------------------
// Card / cell helpers
// ---------------------------------------------------------------------------

const look = ({ name, season, price, src }) => `
  <a class="swish-look" href="/collections/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}">
    <div class="swish-look__frame">
      <img src="${src}" alt="${name} — ${season}" loading="lazy" />
    </div>
    <div class="swish-look__name">${name}</div>
    <div class="swish-look__meta">${season} · ${price}</div>
  </a>
`

const stripCell = ({ src, alt, label }) => `
  <figure class="swish-strip__cell">
    <img src="${src}" alt="${alt}" loading="lazy" />
    <figcaption class="swish-strip__label">${label}</figcaption>
  </figure>
`

const journalCard = ({ category, title, deck, byline, src }) => `
  <article class="swish-journal-card">
    <div class="swish-journal-card__frame">
      <img src="${src}" alt="" loading="lazy" />
    </div>
    <div class="swish-journal-card__category">${category}</div>
    <h3 class="swish-journal-card__title">${title}</h3>
    <p class="swish-journal-card__deck">${deck}</p>
    <div class="swish-journal-card__byline">${byline}</div>
  </article>
`

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const featured = [
  {
    name:   'The Marlene Coat',
    season: 'AW26',
    price:  '£1,290',
    src:    '/images/swish/1539109136881-3be0616acf4b.jpg',
  },
  {
    name:   'Atelier Knit',
    season: 'AW26',
    price:  '£480',
    src:    '/images/swish/1485518882345-15568b007407.jpg',
  },
  {
    name:   'Bias Slip Dress',
    season: 'AW26',
    price:  '£695',
    src:    '/images/swish/1572804013309-59a88b7e92f1.jpg',
  },
  {
    name:   'Wide-Leg Trouser',
    season: 'AW26',
    price:  '£420',
    src:    '/images/swish/1551803091-e20673f15770.jpg',
  },
]

const lookbook = [
  {
    src:   '/images/swish/1483985988355-763728e1935b.jpg',
    alt:   'Tailored editorial look in muted neutrals',
    label: 'Tailoring',
  },
  {
    src:   '/images/swish/1469334031218-e382a71b716b.jpg',
    alt:   'Soft knitwear styled with wide trousers',
    label: 'Knitwear',
  },
  {
    src:   '/images/swish/1502716119720-b23a93e5fe1b.jpg',
    alt:   'Evening dress under low light',
    label: 'Evening',
  },
]

const journal = [
  {
    category: 'Atelier',
    title:    'Inside the Florence workshop',
    deck:     'Where every Marlene coat is cut, basted and finished by hand over twenty-three days.',
    byline:   'Words by Inez Vasquez',
    src:      '/images/swish/1558769132-cb1aea458c5e.jpg',
  },
  {
    category: 'Conversation',
    title:    'A new vocabulary for womenswear',
    deck:     'Creative director Lila Chen on quiet power, ease, and clothes that outlive a season.',
    byline:   'Interview by The Editors',
    src:      '/images/swish/1496747611176-843222e1e57c.jpg',
  },
  {
    category: 'Care',
    title:    'On keeping wool well',
    deck:     'A short guide to brushing, airing and storing the pieces meant to be with you for years.',
    byline:   'Words by Marta Engel',
    src:      '/images/swish/1490481651871-ab68de25d43d.jpg',
  },
]

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/templates/swish',

  meta: {
    title:       'Swish — Considered womenswear, season by season',
    description: 'Swish is a ready-to-wear house designing collection-led womenswear, handfinished in Florence and Porto. Demonstrates editorial branding with Pulse.',
    theme:       'light',
    styles:      [
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap',
      '/pulse-ui.css',
      '/swish.css',
    ],
    ogTitle:     'Swish — Autumn/Winter 2026',
    ogImage:     '/images/swish/1490481651871-ab68de25d43d.jpg',
  },

  view: () => `
    <a href="#main-content" class="skip-link">Skip to main content</a>

    ${nav({
      sticky:   true,
      logo:     `<span class="swish-mark">Swish</span>`,
      logoHref: '/swish',
      links: [
        { label: 'Collections', href: '/collections' },
        { label: 'Lookbook',    href: '/lookbook'    },
        { label: 'Atelier',     href: '/atelier'     },
        { label: 'Journal',     href: '/journal'     },
        { label: 'Stores',      href: '/stores'      },
      ],
      action: button({ label: 'Bag (0)', href: '/bag', variant: 'ghost', size: 'sm' }),
    })}

    <main id="main-content">
      <section class="swish-hero" aria-label="Autumn Winter 2026 collection">
        <div class="swish-hero__inner">
          <div class="swish-hero__eyebrow">AW26 · Issue Nº07</div>
          <h1 class="swish-hero__title">Quiet power, cut to last.</h1>
          <p class="swish-hero__deck">The Autumn/Winter collection — a study in tailoring, weight and restraint. Forty-two pieces, made in small runs across Florence and Porto.</p>
          <div class="u-flex u-gap-3 u-flex-wrap">
            ${button({ label: 'Shop the collection', href: '/collections/aw26', variant: 'primary', size: 'lg' })}
            ${button({ label: 'View lookbook',       href: '/lookbook',         variant: 'ghost',   size: 'lg' })}
          </div>
        </div>
      </section>

      ${section({
        padding: 'lg',
        class: 'swish-quote-section',
        content: container({
          size: 'md',
          content: pullquote({
            quote: 'A new vocabulary for modern womenswear — disciplined, quietly luxurious, refreshingly unfussy.',
            cite:  'British Vogue',
            size:  'lg',
          }),
        }),
      })}

      ${section({
        padding: 'lg',
        content: container({
          content: `
            <div class="swish-issue">Featured pieces · AW26</div>
            ${grid({
              cols:    4,
              gap:     'lg',
              content: featured.map(look).join(''),
            })}
          `,
        }),
      })}

      ${section({
        variant: 'alt',
        padding: 'lg',
        content: container({
          content: `
            <div class="swish-split">
              <div class="swish-split__media">
                <img
                  src="/images/swish/1558769132-cb1aea458c5e.jpg"
                  alt="A tailor working at the Florence atelier" />
              </div>
              <div class="swish-split__body">
                <div class="swish-issue swish-issue--left">The Atelier</div>
                <h2 class="swish-split__title">Made slowly, in two small houses.</h2>
                <p>Tailoring is cut and finished in a converted convent in Oltrarno, Florence. Knitwear is shaped by a family-run mill outside Porto that has been spinning yarn for four generations.</p>
                <p>Each collection is produced in runs of fewer than three hundred pieces — quiet, deliberate, and intended to be lived in for years.</p>
                ${button({ label: 'Visit the atelier', href: '/atelier', variant: 'secondary' })}
              </div>
            </div>
          `,
        }),
      })}

      ${section({
        padding: 'lg',
        content: container({
          content: `
            <div class="swish-issue">Lookbook</div>
            <div class="swish-strip">${lookbook.map(stripCell).join('')}</div>
          `,
        }),
      })}

      ${section({
        variant: 'alt',
        padding: 'lg',
        content: container({
          content: `
            <div class="swish-issue">From the journal</div>
            ${grid({
              cols:    3,
              gap:     'lg',
              content: journal.map(journalCard).join(''),
            })}
          `,
        }),
      })}

      ${section({
        padding: 'lg',
        content: container({
          size: 'md',
          content: `
            <div class="swish-newsletter">
              <h2 class="swish-newsletter__title">Letters from Swish</h2>
              <p class="swish-newsletter__deck">Collection previews, atelier notes and private sale invitations — sent six times a year, never more.</p>
              <form class="swish-newsletter__form" action="/subscribe" method="post" novalidate>
                ${input({ name: 'email', label: 'Email address', type: 'email', placeholder: 'your@email.com', required: true, attrs: { autocomplete: 'email' } })}
                ${button({ label: 'Subscribe', type: 'submit', variant: 'primary' })}
              </form>
            </div>
          `,
        }),
      })}
    </main>

    ${footer({
      logo:     `<span class="swish-mark">Swish</span>`,
      logoHref: '/swish',
      columns: [
        {
          title: 'Shop',
          links: [
            { label: 'AW26 Collection', href: '/collections/aw26' },
            { label: 'Tailoring',       href: '/collections/tailoring' },
            { label: 'Knitwear',        href: '/collections/knitwear' },
            { label: 'Evening',         href: '/collections/evening' },
          ],
        },
        {
          title: 'House',
          links: [
            { label: 'Atelier', href: '/atelier' },
            { label: 'Journal', href: '/journal' },
            { label: 'Stores',  href: '/stores'  },
            { label: 'Careers', href: '/careers' },
          ],
        },
        {
          title: 'Help',
          links: [
            { label: 'Contact',  href: '/contact'  },
            { label: 'Shipping', href: '/shipping' },
            { label: 'Returns',  href: '/returns'  },
            { label: 'Care',     href: '/care'     },
          ],
        },
      ],
      legal: '© 2026 Swish Maison. All rights reserved.',
    })}
  `,
}
