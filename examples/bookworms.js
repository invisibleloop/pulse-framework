/**
 * Pulse — BookWorms example
 *
 * Demonstrates:
 *   - Light-theme editorial branding for a physical/independent business
 *   - nav() with logo text, anchor links, and a CTA action button
 *   - Pure HTML sections — no Pulse section/container wrappers (shows the
 *     framework is just strings; you can write vanilla HTML where it fits)
 *   - Book card grid (staff picks) with cover images from picsum.photos
 *   - Pull-quote / press quote breakout
 *   - Two-column feature grid
 *   - Bordered event list with date / title / host columns
 *   - Centred CTA section
 *   - footer() with flat link list
 *   - Google Fonts (Fraunces) for display headings
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/bookworms
 */

import { nav, button, footer } from '../src/ui/index.js'

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const picks = [
  {
    tag:    'Fiction · Staff pick',
    title:  'The Lantern Keepers',
    author: 'Iris Aldenmoor',
    note:   'A quiet novel about three sisters, an unreliable lighthouse, and the long winter that follows a single decision.',
    cover:  '/images/bookworms/lantern-keepers.jpg',
  },
  {
    tag:    'Non-fiction · This week',
    title:  'How We Read Now',
    author: 'Dr. Samuel Okafor',
    note:   'A short, generous history of attention — from monastic libraries to the open browser tab.',
    cover:  '/images/bookworms/how-we-read-now.jpg',
  },
  {
    tag:    'Rare find · Just arrived',
    title:  'Letters from a Provincial Bookseller',
    author: 'M. Halloran (1927)',
    note:   'First edition, lightly foxed. A wry account of running a shop through a quiet decade.',
    cover:  '/images/bookworms/provincial-bookseller.jpg',
  },
]

const features = [
  {
    title: 'Curated, not algorithmic',
    body:  'Every recommendation comes from one of our booksellers. No bestseller lists, no engagement metrics — just books we\'ve read and would lend you ourselves.',
  },
  {
    title: 'Browse by mood',
    body:  'Looking for something restorative? Something difficult? Our shelves are arranged the way readers actually think.',
  },
  {
    title: 'Author evenings & book clubs',
    body:  'Small, considered events with writers we admire. Wine, conversation, and signed copies — no panels of four.',
  },
  {
    title: 'Free delivery over £25',
    body:  'Wrapped by hand, delivered locally by bicycle. Posted further afield by the next morning.',
  },
  {
    title: 'Gift cards & reader subscriptions',
    body:  'A monthly book chosen for one specific reader, with a note from the bookseller who picked it.',
  },
  {
    title: 'Open seven days',
    body:  'Old Market Lane, opposite the bakery. Coffee from nine, books from ten.',
  },
]

const events = [
  { date: '12 June',  title: 'An evening with Iris Aldenmoor', host: 'In conversation with Priya Joshi' },
  { date: '21 June',  title: 'Slow Reading Club — Middlemarch, part one', host: 'Hosted by the BookWorms team' },
  { date: '03 July',  title: 'New voices in non-fiction', host: 'Three debut authors read and answer questions' },
]

const navLinks = [
  { label: 'Browse',      href: '#browse' },
  { label: 'Staff picks', href: '#picks'  },
  { label: 'Events',      href: '#events' },
  { label: 'Visit',       href: '#visit'  },
]

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/bookworms',

  meta: {
    title:       'BookWorms — an independent bookstore for curious readers',
    description: 'Handpicked fiction, non-fiction, and rare finds. Weekly staff picks, author evenings, and a slow reading club. Open seven days on Old Market Lane.',
    theme:       'light',
    styles:      [
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&display=swap',
      '/pulse-ui.css',
      '/examples/bookworms.css',
    ],
  },

  view: () => `
    ${nav({
      logo:   'BookWorms',
      links:  navLinks,
      action: button({ label: 'Visit the shop', href: '#visit', variant: 'primary', size: 'sm' }),
      sticky: true,
    })}

    <main id="main-content">
      <section class="bw-hero">
        <div class="bw-shell bw-hero__inner">
          <div class="bw-hero__content">
            <p class="bw-eyebrow">Independent bookstore · Old Market Lane</p>
            <h1 class="bw-hero-title">Books, handpicked for the curious.</h1>
            <p class="bw-hero-lede">
              BookWorms is a small shop with a long memory. Every title on our shelves has been read by
              someone who works here — and is waiting for the right reader to find it.
            </p>
            <div class="bw-cta-actions bw-cta-actions--start">
              ${button({ label: 'See this week\u2019s picks', href: '#picks', variant: 'primary' })}
              ${button({ label: 'Upcoming events',            href: '#events', variant: 'secondary' })}
            </div>
          </div>
          <div class="bw-hero__image" aria-hidden="true">
            <img src="/images/bookworms/hero-books.jpg" alt="" width="820" height="1080" />
          </div>
        </div>
      </section>

      <section class="bw-section" id="picks">
        <div class="bw-shell">
          <p class="bw-section-label">This week</p>
          <h2 class="bw-section-title">Three books we\u2019re pressing into people\u2019s hands.</h2>
          <div class="bw-picks">
            ${picks.map((p, i) => `
              <article>
                <div class="bw-pick-cover-wrap">
                  <img class="bw-pick-cover" src="${p.cover}" alt="Cover of ${p.title} by ${p.author}" width="400" height="600" loading="lazy" />
                  <div class="bw-pick-overlay">
                    <h3 class="bw-pick-overlay-title">${p.title}</h3>
                    <p class="bw-pick-overlay-author">${i === 2 ? p.author.replace(/\s*\(\d{4}\)/, '') : 'by ' + p.author}</p>
                  </div>
                </div>
                <p class="bw-pick-meta">${p.tag}</p>
                <h3 class="bw-pick-title">${p.title}</h3>
                <p class="bw-pick-author">by ${p.author}</p>
                <p class="bw-pick-note">${p.note}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="bw-pull">
        <div class="bw-shell">
          <p class="bw-pull-quote">\u201cThe kind of shop where you walk in for one book and leave with three you didn\u2019t know you needed.\u201d</p>
          <p class="bw-pull-cite">\u2014 The Quarterly Review</p>
        </div>
      </section>

      <section class="bw-section" id="browse">
        <div class="bw-shell">
          <p class="bw-section-label">What we do</p>
          <h2 class="bw-section-title">A bookstore that still reads.</h2>
          <div class="bw-features">
            ${features.map(f => `
              <div>
                <h3 class="bw-feature-title">${f.title}</h3>
                <p class="bw-feature-body">${f.body}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="bw-section" id="events">
        <div class="bw-shell">
          <p class="bw-section-label">Upcoming</p>
          <h2 class="bw-section-title">Evenings worth turning up for.</h2>
          <div class="bw-events">
            ${events.map(e => `
              <article class="bw-event">
                <p class="bw-event-date">${e.date}</p>
                <h3 class="bw-event-title">${e.title}</h3>
                <p class="bw-event-host">${e.host}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="bw-cta" id="visit">
        <div class="bw-shell">
          <h2 class="bw-cta-title">Come and browse.</h2>
          <p class="bw-cta-sub">
            14 Old Market Lane, opposite the bakery. Open Monday to Sunday, 10am\u20137pm.
            Or sign up to receive one handpicked book each month.
          </p>
          <div class="bw-cta-actions">
            ${button({ label: 'Plan a visit',          href: '#visit', variant: 'primary'   })}
            ${button({ label: 'Reader subscription',   href: '#visit', variant: 'secondary' })}
          </div>
        </div>
      </section>
    </main>

    ${footer({
      logo:  'BookWorms',
      links: [
        { label: 'Browse',  href: '#browse' },
        { label: 'Events',  href: '#events' },
        { label: 'Visit',   href: '#visit'  },
        { label: 'Contact', href: '#visit'  },
      ],
      legal: '\u00a9 2026 BookWorms \u00b7 14 Old Market Lane',
    })}
  `,
}
