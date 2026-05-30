/**
 * Pulse — Susuki Bento artist portfolio example
 *
 * Demonstrates:
 *   - Dark-by-default brutalist gallery palette (near-black, bone, vermilion)
 *   - Zero-radius design language (--radius: 0px overrides Pulse defaults)
 *   - Asymmetric CSS grid works gallery (12-col with mixed span sizes)
 *   - Pure vanilla HTML throughout — no Pulse UI components used.
 *     Shows that Pulse views are just template literals; you can write
 *     raw HTML for fully custom layouts without any component overhead.
 *   - Custom sticky nav and simple footer hand-rolled in the view
 *   - HTML-escaped data with a utility function (safe pattern for user data)
 *   - Hover effect with CSS filter: grayscale + scale on artwork images
 *   - Exhibition table using CSS grid (year / title / venue / tag columns)
 *   - Press list with CSS ::before dot separator
 *   - Two-column contact grid
 *   - System font stack only (Inter → system-ui fallback) — no HTTP requests
 *   - picsum.photos for artwork images (placeholder seeded by id)
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/suzukibento
 */

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const works = [
  { id: 1043, cls: 'sb-work--a', title: 'Erosion (Shibuya)',     year: '2025', medium: 'Oil, ash, dust on canvas — 220×180cm' },
  { id: 1025, cls: 'sb-work--b', title: 'Fragments No. 14',     year: '2024', medium: 'Mixed media — 140×140cm' },
  { id: 1015, cls: 'sb-work--c', title: 'Displaced',            year: '2024', medium: 'Acrylic, collage — 160×120cm' },
  { id: 1059, cls: 'sb-work--d', title: 'Residue',              year: '2023', medium: 'Oil on linen — 100×100cm' },
  { id: 1062, cls: 'sb-work--e', title: 'Mother Tongue',        year: '2023', medium: 'Oil, gold leaf — 180×140cm' },
  { id: 1084, cls: 'sb-work--f', title: 'Untitled (Berlin VI)', year: '2025', medium: 'Concrete, pigment — 300×200cm' },
]

const exhibitions = [
  { year: '2026', title: 'Soft Architectures',      venue: 'Kunsthalle Basel, CH',      tag: 'Solo',  solo: true  },
  { year: '2025', title: 'The Weight of Surface',   venue: 'KW Institute, Berlin',      tag: 'Solo',  solo: true  },
  { year: '2025', title: 'Asia Now',                venue: 'Monnaie de Paris',           tag: 'Group', solo: false },
  { year: '2024', title: 'Memory as Material',      venue: 'Hauser & Wirth, Hong Kong', tag: 'Solo',  solo: true  },
  { year: '2024', title: 'Berlin Biennale 13',      venue: 'Hamburger Bahnhof',         tag: 'Group', solo: false },
  { year: '2023', title: 'Quiet Geographies',       venue: 'Mori Art Museum, Tokyo',    tag: 'Solo',  solo: true  },
  { year: '2022', title: 'New Painting / New Asia',  venue: 'Tate St Ives',              tag: 'Group', solo: false },
]

const press = [
  'Frieze', 'Artforum', 'ArtReview', 'S\u00fcddeutsche Zeitung',
  'The Japan Times', 'Mousse', 'e-flux',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

const work = (w) => `
  <figure class="sb-work ${w.cls}">
    <img src="/images/suzukibento/${w.id}.jpg" alt="${esc(w.title)}, ${esc(w.year)}" loading="lazy" width="1200" height="900">
    <figcaption class="sb-work__caption">${esc(w.title)} <span>${esc(w.year)}</span></figcaption>
  </figure>
`

const exhibition = (e) => `
  <li class="sb-exhibition">
    <span class="sb-exhibition__year">${esc(e.year)}</span>
    <span class="sb-exhibition__title">${esc(e.title)}</span>
    <span class="sb-exhibition__venue">${esc(e.venue)}</span>
    <span class="sb-exhibition__tag${e.solo ? ' sb-exhibition__tag--solo' : ''}">${esc(e.tag)}</span>
  </li>
`

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/templates/suzukibento',

  meta: {
    title:       'Susuki Bento \u2014 Painter',
    description: 'Tokyo-born, Berlin-based mixed-media artist exploring memory, displacement, and urban erosion through large-scale painting.',
    theme:       'dark',
    styles:      ['/pulse-ui.css', '/suzukibento.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <header class="sb-nav">
      <a href="/suzukibento" class="sb-nav__brand" aria-label="Susuki Bento — home">Susuki Bento<span class="sb-nav__dot" aria-hidden="true"></span></a>
      <input type="checkbox" id="sb-menu-toggle" class="sb-nav__toggle-input" aria-hidden="true">
      <label for="sb-menu-toggle" class="sb-nav__burger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </label>
      <nav aria-label="Primary">
        <ul class="sb-nav__links">
          <li><a href="#works">Works</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#exhibitions">Exhibitions</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>

    <main id="main-content">
      <section class="sb-hero">
        <span class="sb-hero__eyebrow">ペインタ \u2014 b. Tokyo, 1984 \u00b7 lives Berlin</span>
        <h1 class="sb-hero__title">Susuki<br>Bento<em>.</em></h1>
        <div class="sb-hero__meta">
          <div>
            <span class="sb-hero__meta-label">Now showing</span>
            <strong>The Weight of Surface \u2014 KW Institute, Berlin</strong>
          </div>
          <div>
            <span class="sb-hero__meta-label">Closing</span>
            <strong>14 September 2026</strong>
          </div>
          <div>
            <span class="sb-hero__meta-label">Represented by</span>
            <strong>Hauser &amp; Wirth</strong>
          </div>
        </div>
      </section>

      <section id="works" class="sb-section">
        <div class="sb-section__head">
          <span class="sb-section__label">01 \u2014 Selected works</span>
          <h2 class="sb-section__title">Recent paintings, 2023\u20132025</h2>
        </div>
        <div class="sb-works">
          ${works.map(work).join('')}
        </div>
      </section>

      <section id="about" class="sb-section">
        <div class="sb-section__head">
          <span class="sb-section__label">02 \u2014 Statement</span>
          <h2 class="sb-section__title">On surface, memory, dust</h2>
        </div>
        <div class="sb-statement">
          <dl class="sb-statement__bio">
            <dt>Born</dt><dd>Tokyo, 1984</dd>
            <dt>Lives</dt><dd>Berlin-Wedding</dd>
            <dt>Education</dt><dd>Tokyo University of the Arts, MFA<br>St\u00e4delschule, Frankfurt</dd>
            <dt>Studio</dt><dd>Soldiner Stra\u00dfe 31, 13359 Berlin</dd>
          </dl>
          <div>
            <p>The work begins with surface. I scrape, layer, bury and uncover until the paint behaves like architecture &mdash; weight, weather, decay. Each canvas is a record of what a place could not hold onto.</p>
            <p>For two decades I have moved between Tokyo and Berlin, two cities defined by the things they have erased. My paintings collect this erasure: dust from demolition sites, charcoal from cleared lots, the colour of a wall before it was repainted. They are quiet objects made from loud absences.</p>
          </div>
        </div>
      </section>

      <section id="exhibitions" class="sb-section">
        <div class="sb-section__head">
          <span class="sb-section__label">03 \u2014 Exhibition history</span>
          <h2 class="sb-section__title">Selected solo &amp; group, 2022\u20132026</h2>
        </div>
        <ul class="sb-exhibitions">
          ${exhibitions.map(exhibition).join('')}
        </ul>
      </section>

      <section class="sb-section">
        <div class="sb-section__head">
          <span class="sb-section__label">04 \u2014 Press</span>
          <h2 class="sb-section__title">In print</h2>
        </div>
        <p class="sb-press">${press.map((p) => `<span>${esc(p)}</span>`).join('')}</p>
      </section>

      <section id="contact" class="sb-section">
        <div class="sb-section__head">
          <span class="sb-section__label">05 \u2014 Contact</span>
          <h2 class="sb-section__title">Studio &amp; representation</h2>
        </div>
        <div class="sb-contact">
          <div>
            <h3>Studio enquiries</h3>
            <a href="mailto:studio@susukibento.art">studio@susukibento.art</a>
            <p>Soldiner Stra\u00dfe 31<br>13359 Berlin</p>
          </div>
          <div>
            <h3>Gallery representation</h3>
            <a href="mailto:bento@hauserwirth.com">bento@hauserwirth.com</a>
            <p>Hauser &amp; Wirth<br>Z\u00fcrich \u00b7 London \u00b7 Hong Kong</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="sb-foot">
      <span>&copy; Susuki Bento Studio 2026</span>
      <span>Site by <a href="https://invisibleloop.com" class="sb-foot__link" target="_blank" rel="noopener">invisibleloop</a></span>
    </footer>
  `,
}
