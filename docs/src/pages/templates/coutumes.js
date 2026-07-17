// Recreation of coutumes.com for Pulse capability testing
//
// component-free — creative override: this editorial fashion recreation relies
// on several highly custom sections (dual-image blend-mode hero, hover-reveal
// product cards, 50/50 image pair, large serif brand statement, dismissible
// announcement bar) that have no generic component equivalent — the former
// editorialHero/productCard/imagePair/brandStatement/banner components were
// cut from the library as narrow single-purpose wrappers an agent can
// hand-roll; this file now hand-rolls them directly with scoped CSS in
// coutumes.css, using var() tokens throughout. nav(), pullquote() (variant:
// 'editorial'), grid(), uiImage(), and footer() (rich layout) remain kept
// components and are unchanged.
//
// Substituted fonts: Bebas Neue (→ Plaak 3), Cormorant Garamond (→ Exposure Regular)
// All photography: placeholder images (originals are proprietary Coutumes photos)

import { nav, pullquote, grid, uiImage, footer } from '@invisibleloop/pulse/ui'
import { asset } from '../../lib/layout.js'

export const spec = {
  route: '/templates/coutumes',
  meta: {
    title: 'Coutumes — Recreation Test',
    description: 'Pulse recreation of coutumes.com for capability testing.',
    styles: [
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Barlow:wght@400;500&display=optional',
      '/pulse-ui.css',
      '/coutumes.css',
    ],
  },

  state: { bannerVisible: true },

  mutations: {
    dismissBanner: (state) => ({ bannerVisible: false }),
  },

  view: (state) => `
  <main id="main-content">

    <!-- Announcement bar — fixed to bottom, dismissible. Raw HTML: the
         removed banner() component previously rendered this; the dismiss
         button still wires to the existing dismissBanner mutation. -->
    ${state.bannerVisible ? `
      <div class="coutumes-announce" role="banner">
        <span>SILVER LANDS&nbsp;•&nbsp;NEW CAPSULE COLLECTION</span>
        <button class="coutumes-announce-close" data-event="click:dismissBanner" aria-label="Close announcement">×</button>
      </div>
    ` : ''}

    <!-- Navigation — nav() supports a second utilityLinks group natively. -->
    ${nav({
      logo: 'COUTUMES',
      logoHref: '/',
      links: [
        { label: 'Jewelry',        href: '#' },
        { label: 'Accessories',    href: '#' },
        { label: 'Souvenirs Club', href: '#' },
        { label: 'About',          href: '#' },
      ],
      utilityLinks: [
        { label: 'Search',     href: '#' },
        { label: 'Magazine',   href: '#' },
        { label: 'FAQ',        href: '#' },
        { label: 'Cart (0)',   href: '#' },
      ],
      sticky: true,
      background: 'var(--coutumes-white)',
      color: 'var(--coutumes-black)',
    })}

    <!-- Hero — dual split-image with overlapping blend-mode type. Raw HTML:
         the removed editorialHero() component previously rendered this
         mix-blend-mode overlay technique; a real h1 heading element carries
         the accessible heading while the overlay lines are decorative (aria-hidden). -->
    <section class="coutumes-hero">
      <h1 class="coutumes-sr-only">Silver Lands Capsule Collection</h1>
      <div class="coutumes-hero-images">
        <div class="coutumes-hero-img">
          <img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=700&q=80" alt="Hand holding a cream hat, wearing a dark ring" width="700" loading="eager" fetchpriority="high">
        </div>
        <div class="coutumes-hero-img">
          <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&q=80" alt="Man leaning against a Land Rover in the countryside" width="700" loading="eager">
        </div>
      </div>
      <div class="coutumes-hero-text" aria-hidden="true">
        ${['INTRODUCING', 'SILVER LANDS', 'CAPSULE', 'COLLECTION'].map(l => `<span>${l}</span>`).join('')}
      </div>
    </section>

    <!-- Editorial quote — pullquote() variant='editorial' (centred, no border). -->
    <section id="collection">
      ${pullquote({
        quote:   'Open roads with no precise destination, passing landscapes, a few days spent outside with friends. Pieces designed to travel for a long time.',
        cite:    'Silver Lands Capsule Collection',
        variant: 'editorial',
        size:    'lg',
      })}
    </section>

    <!-- Product grid — raw anchor cards (full-bleed image + below-caption
         name/price), replacing the removed productCard() component.
         Laid out with the kept grid() component. -->
    ${grid({
      cols:    3,
      gap:     'sm',
      content: [
        {
          img:   'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80',
          alt:   'White beaded bracelet on dark wrist',
          name:  'Silver Tube Bracelet',
          price: '£67.00',
          badge: 'NEW',
        },
        {
          img:   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
          alt:   'Close portrait of young man with curly hair wearing gold earring',
          name:  'Kali Hoop Earring',
          price: '£31.00',
          badge: 'NEW',
        },
        {
          img:   'https://picsum.photos/seed/cuff/600/750',
          alt:   'Silver cuff bracelet on wrist',
          name:  'Land Cuff',
          price: '£62.00',
          badge: 'NEW',
        },
      ].map(p => `
        <a href="#" class="coutumes-product-card">
          <img src="${p.img}" alt="${p.alt}" loading="lazy" decoding="async">
          ${p.badge ? `<span class="coutumes-product-badge">${p.badge}</span>` : ''}
          <div class="coutumes-product-caption">
            <p class="coutumes-product-name">${p.name}</p>
            <p class="coutumes-product-price">${p.price}</p>
          </div>
        </a>
      `).join(''),
      class: 'coutumes-product-grid',
    })}

    <!-- 50/50 split editorial images — raw HTML two-column grid, replacing
         the removed imagePair() component. media() is image + text and
         is not a fit for this text-free two-photo layout. -->
    <div class="coutumes-split-images" aria-label="Craftmanship and boutique">
      <div class="coutumes-split-col">
        <div class="coutumes-split-img">
          <img src="https://picsum.photos/seed/craft/700/900" alt="Craftsman working with tools in a jewelry workshop" loading="lazy" decoding="async">
        </div>
        <a href="#craftmanship" class="coutumes-split-link">Craftmanship →</a>
      </div>
      <div class="coutumes-split-col">
        <div class="coutumes-split-img">
          <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700&q=80" alt="Elegant boutique storefront with warm lighting" loading="lazy" decoding="async">
        </div>
        <a href="#store" class="coutumes-split-link">Store →</a>
      </div>
    </div>

    <!-- Large editorial statement — raw HTML, replacing the removed
         brandStatement() component. pullquote() is for shorter attributed
         quotes; this is an unattributed full-width brand-voice paragraph. -->
    <div class="coutumes-statement">
      <div class="coutumes-statement-inner">
        <p>pieces that are both eclectic and everyday. Subtly precious, expressive, and refined, our jewelry complements an outfit or disrupts it, introducing new rituals into the modern man&rsquo;s wardrobe.</p>
      </div>
    </div>

    <!-- Portrait — uiImage() works well here with maxWidth constraint -->
    ${uiImage({
      src:      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
      alt:      'Young man holding a Kodak camera, wearing a silver ring',
      ratio:    '3/4',
      maxWidth: '600px',
      class:    'coutumes-portrait',
    })}

    <!-- Footer — footer() already supports the rich layout (columns,
         subscribe, wordmark, background/color) used here; no changes needed. -->
    ${footer({
      background: 'var(--coutumes-amber)',
      color:      'var(--coutumes-black)',
      subscribe: `
        <p class="coutumes-footer-subscribe-label">JOIN THE COUTUMES CLUB</p>
        <form class="coutumes-footer-form" aria-label="Newsletter subscribe">
          <label for="footer-email" class="coutumes-sr-only">Email address</label>
          <input id="footer-email" type="email" name="email" placeholder="Email" autocomplete="email">
          <button type="submit">■ SUBSCRIBE</button>
        </form>
        <p class="coutumes-footer-legal">By clicking Subscribe, I accept the <a href="#">Privacy Policy</a>.</p>
      `,
      columns: [
        {
          title: 'Our Brand',
          links: [
            { label: 'Craftmanship', href: '#' },
            { label: 'About Us',     href: '#' },
            { label: 'Our Store',    href: '#' },
            { label: 'Magazine',     href: '#' },
            { label: 'Instagram',    href: '#' },
          ],
        },
        {
          title: 'Our Collections',
          links: [
            { label: 'Best sellers',    href: '#' },
            { label: 'Silver Lands',    href: '#' },
            { label: 'Classics',        href: '#' },
            { label: 'Stones',          href: '#' },
            { label: 'Denim Collection',href: '#' },
            { label: 'Souvenirs Club',  href: '#' },
          ],
        },
        {
          title: 'Help',
          links: [
            { label: 'Shipping Policy', href: '#' },
            { label: 'Return',          href: '#' },
            { label: 'FAQ',             href: '#' },
            { label: 'Contact',         href: '#' },
          ],
        },
      ],
      wordmark: 'COUTUMES',
      links: [
        { label: 'Privacy Policy',   href: '#' },
        { label: 'Terms of service', href: '#' },
      ],
      legal: 'Site by Coutumes',
    })}

  </main>
  <script src="${asset('/pulse-ui.js')}" defer></script>
  `,
}

export default spec
