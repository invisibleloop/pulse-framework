// Recreation of coutumes.com for Pulse capability testing
// This spec deliberately uses Pulse UI components to document:
//   - which components cover the design requirements, and
//   - which new components were needed (marked ★ NEW)
//
// Substituted fonts: Bebas Neue (→ Plaak 3), Cormorant Garamond (→ Exposure Regular)
// All photography: placeholder images (originals are proprietary Coutumes photos)

import { nav, banner, editorialHero, pullquote, grid, productCard, imagePair, brandStatement, uiImage, footer, input, button } from '@invisibleloop/pulse/ui'

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

    <!-- Announcement bar — fixed to bottom, dismissible -->
    ${state.bannerVisible ? banner({
      content:      `<span>SILVER LANDS&nbsp;•&nbsp;NEW CAPSULE COLLECTION</span>`,
      variant:      'promo',
      position:     'bottom',
      dismissible:  true,
      dismissEvent: 'dismissBanner',
    }) : ''}

    <!-- Navigation — nav() with utility links in action slot
         GAP: nav has no second link group; utility links (Search, Magazine, FAQ, Cart)
         are crammed into the action slot as raw HTML rather than a proper utilityLinks param -->
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

    <!-- Hero — ★ NEW: editorialHero() — dual split-image with overlapping blend-mode type.
         The hero() component could not do this: it only supports a single image side.
         editorialHero accepts leftImage + rightImage + lines array + blend mode. -->
    ${editorialHero({
      leftImage:  `<img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=700&q=80" alt="Hand holding a cream hat, wearing a dark ring" width="700" loading="eager" fetchpriority="high">`,
      rightImage: `<img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&q=80" alt="Man leaning against a Land Rover in the countryside" width="700" loading="eager">`,
      lines:   ['INTRODUCING', 'SILVER LANDS', 'CAPSULE', 'COLLECTION'],
      heading: 'Silver Lands Capsule Collection',
      color:   'var(--coutumes-amber)',
      blend:   'none',
      ratio:   '3/4',
      class:   'coutumes-hero',
    })}

    <!-- Editorial quote — ★ ENHANCED: pullquote() with new variant: 'editorial'
         Previously pullquote only had a left accent border (wrong for this centred
         large-serif pattern). New variant='editorial' removes the border and centres. -->
    <section id="collection">
      ${pullquote({
        quote:   'Open roads with no precise destination, passing landscapes, a few days spent outside with friends. Pieces designed to travel for a long time.',
        cite:    'Silver Lands Capsule Collection',
        variant: 'editorial',
        size:    'lg',
      })}
    </section>

    <!-- Product grid — grid() + ★ NEW: productCard()
         photoCard() is polaroid-styled (wrong for fashion e-commerce).
         productCard() is full-bleed with hover-reveal name overlay. -->
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
      ].map(p => productCard({
        src:    p.img,
        alt:    p.alt,
        name:   p.name,
        price:  p.price,
        badge:  p.badge,
        ratio:  '4/5',
        layout: 'below',
      })).join(''),
      class: 'coutumes-product-grid',
    })}

    <!-- 50/50 split editorial images — ★ NEW: imagePair()
         media() is image + text. There was no component for two editorial photos
         side by side with no text. imagePair() fills this gap. -->
    ${imagePair({
      leftSrc:    'https://picsum.photos/seed/craft/700/900',
      leftAlt:    'Craftsman working with tools in a jewelry workshop',
      rightSrc:   'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700&q=80',
      rightAlt:   'Elegant boutique storefront with warm lighting',
      ratio:      '3/4',
      label:      'Craftmanship and boutique',
      leftLabel:  'Craftmanship',
      leftHref:   '#craftmanship',
      rightLabel: 'Store',
      rightHref:  '#store',
    })}

    <!-- Large editorial statement — ★ NEW: brandStatement()
         pullquote() is for shorter attributed quotes (with left border).
         brandStatement() is for full-width brand-voice paragraphs: large,
         centred, italic serif. -->
    ${brandStatement({
      text: 'pieces that are both eclectic and everyday. Subtly precious, expressive, and refined, our jewelry complements an outfit or disrupts it, introducing new rituals into the modern man&rsquo;s wardrobe.',
      font: 'serif',
      size: 'md',
    })}

    <!-- Portrait — uiImage() works well here with maxWidth constraint -->
    ${uiImage({
      src:      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
      alt:      'Young man holding a Kodak camera, wearing a silver ring',
      ratio:    '3/4',
      maxWidth: '600px',
      class:    'coutumes-portrait',
    })}

    <!-- Footer — ★ ENHANCED: footer() with new columns + subscribe + wordmark + background params.
         The simple footer() only had logo + flat links + legal.
         New rich variant adds multi-column link grid, subscribe form, and giant wordmark. -->
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
  `,
}

export default spec
