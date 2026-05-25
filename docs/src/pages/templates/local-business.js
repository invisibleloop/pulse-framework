/**
 * Template: Local Business Landing Page
 *
 * A warm, approachable landing page for a local service business —
 * think dog groomer, physiotherapy clinic, florist, bakery, or tradesperson.
 * Photo-forward, services-first, easy to contact.
 *
 * Vibe: warm  Theme: light  Palette: earthy / organic
 */

import { asset } from '../../lib/layout.js'
import {
  nav        as uiNav,
  hero,
  section,
  container,
  grid,
  card,
  stat,
  testimonial,
  cta,
  footer,
  button,
  badge,
  heading,
  decorate,
  iconMapPin,
  iconPhone,
  iconClock,
  iconStar,
  iconCheckCircle,
  iconHeart,
  iconUser,
} from '../../../../src/ui/index.js'

// ── Navigation ────────────────────────────────────────────────────────────────

const pageNav = uiNav({
  logo: `${iconHeart({ size: 20 })}<span class="u-font-bold" style="letter-spacing:-0.01em">Pawfect Grooming</span>`,
  links: [
    { label: 'Services', href: '#services'     },
    { label: 'About',    href: '#about'         },
    { label: 'Reviews',  href: '#reviews'       },
    { label: 'Contact',  href: '#contact'       },
  ],
  action: button({ label: 'Book Now', href: '#contact', size: 'sm' }),
  sticky:     true,
  background: 'rgba(255, 250, 245, 0.92)',
  color:      '#3d2b1e',
})

// ── Hero ──────────────────────────────────────────────────────────────────────

const pageHero = hero({
  eyebrow:  'Serving Maplewood Since 2018',
  title:    'Your Dog Deserves to Look Their Best',
  subtitle: 'Professional grooming with a gentle touch. We take care of every breed, every size — so your pup leaves looking brilliant and feeling calm.',
  actions:  `
    ${button({ label: 'Book an Appointment', href: '#contact', variant: 'primary', size: 'lg' })}
    ${button({ label: 'View Services',       href: '#services', variant: 'ghost',   size: 'lg' })}
  `,
  layout:     'split',
  align:      'left',
  background: 'linear-gradient(135deg, #fdf6ee 0%, #fdebd0 100%)',
  color:      '#3d2b1e',
  image:      `<img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=500&fit=crop" alt="Happy golden retriever after grooming" class="u-w-full u-rounded-xl" style="object-fit:cover;height:420px;">`,
})

// ── Stats strip ───────────────────────────────────────────────────────────────

const statsStrip = section({
  variant:    'alt',
  padding:    'sm',
  content:   container({ content: grid({
    cols:    4,
    gap:     'lg',
    content: [
      stat({ value: '2,400+', label: 'Happy dogs groomed'         }),
      stat({ value: '4.9',    label: 'Star rating on Google'      }),
      stat({ value: '6 years', label: 'Serving our community'    }),
      stat({ value: 'Same day', label: 'Bookings available'      }),
    ].join(''),
  }) }),
})

// ── Services ─────────────────────────────────────────────────────────────────

const services = section({
  id:       'services',
  content: container({ content: `
    <div class="u-text-center u-mb-10">
      ${badge({ label: 'Our Services', variant: 'soft' })}
      ${heading({ level: 2, text: 'Everything Your Dog Needs' })}
      <p class="u-text-muted u-mt-3 u-max-w-prose u-mx-auto">From a quick bath and brush to a full groom — we offer flexible packages that fit every breed and budget.</p>
    </div>
    ${grid({
      cols: 3,
      gap: 'md',
      content: [
        card({
          title:    'Bath & Brush',
          content:     'Full shampoo and condition, blow dry, brush out, and ear clean. Perfect for maintenance between full grooms.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£35</strong></div>`,
          padding:  'lg',
        }),
        card({
          title:    'Full Groom',
          content:     'Everything in Bath & Brush plus breed-specific cut, nail clip, paw pad tidy, and a bandana or bow to finish.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£55</strong></div>`,
          padding:  'lg',
        }),
        card({
          title:    'Puppy Introduction',
          content:     'A gentle first visit for puppies under 6 months. Short, calm, positive — building trust with grooming from day one.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£30</strong></div>`,
          padding:  'lg',
        }),
        card({
          title:    'De-shed Treatment',
          content:     'Intensive deshedding bath, high-velocity dry, and thorough brush out. Great for double-coated breeds shedding heavily.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£65</strong></div>`,
          padding:  'lg',
        }),
        card({
          title:    'Nail Trim',
          content:     'Quick, precise nail trimming and filing. Walk-ins welcome — takes under 10 minutes.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£12</strong></div>`,
          padding:  'lg',
        }),
        card({
          title:    'Teeth Cleaning',
          content:     'Non-anaesthetic teeth brushing with dog-safe toothpaste. Add-on to any service or book standalone.',
          footer:   `<div class="u-flex u-items-center u-justify-between"><span class="u-text-sm u-text-muted">From</span><strong>£15</strong></div>`,
          padding:  'lg',
        }),
      ].join(''),
    })}
  ` }),
})

// ── About ─────────────────────────────────────────────────────────────────────

const about = section({
  id:       'about',
  variant:  'alt',
  content: container({ content: grid({
    cols:    2,
    gap:     'xl',
    content: `
      <div>
        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop" alt="Groomer working with a friendly spaniel" class="u-w-full u-rounded-xl" style="object-fit:cover;height:360px;">
      </div>
      <div class="u-flex u-flex-col u-justify-center u-gap-5">
        ${badge({ label: 'About Us', variant: 'soft' })}
        ${heading({ level: 2, text: 'A Family Business Built on Love for Dogs' })}
        <p class="u-text-muted u-leading-relaxed">Hi, I'm Sophie. I started Pawfect Grooming in 2018 after 10 years as a veterinary nurse — I wanted to bring the same calm, careful approach to grooming that I'd seen transform anxious animals in the clinic.</p>
        <p class="u-text-muted u-leading-relaxed">Every dog is treated like our own. We never rush, we never cage dry, and we always use products that are gentle on skin and coat.</p>
        <div class="u-flex u-flex-col u-gap-2 u-mt-2">
          ${[
            'City & Guilds Level 3 qualified groomer',
            'Fear-free certified practitioner',
            'Insured and first-aid trained',
            'We welcome anxious and reactive dogs',
          ].map(item => `<div class="u-flex u-items-center u-gap-2">${iconCheckCircle({ size: 18 })}<span>${item}</span></div>`).join('')}
        </div>
      </div>
    `,
  }) }),
})

// ── Reviews ───────────────────────────────────────────────────────────────────

const reviews = section({
  id:       'reviews',
  content: container({ content: `
    <div class="u-text-center u-mb-10">
      ${badge({ label: 'Reviews', variant: 'soft' })}
      ${heading({ level: 2, text: 'What Dog Owners Say' })}
    </div>
    ${grid({
      cols: 3,
      gap: 'md',
      content: [
        testimonial({ quote: 'Bertie used to shake going into any groomer. After his first visit here he was wagging his tail at the door. The difference is incredible.', name: 'Claire M.', role: 'Owner of Bertie, Border Terrier' }),
        testimonial({ quote: 'Spotless salon, gentle hands, and my cocker comes home looking absolutely perfect every single time. Wouldn\'t trust anyone else.', name: 'James R.', role: 'Owner of Biscuit, Cocker Spaniel' }),
        testimonial({ quote: 'Sophie worked wonders on our rescue greyhound who had never been groomed before. Patient, kind, and professional. 10/10.', name: 'Priya S.', role: 'Owner of Rocket, Greyhound' }),
      ].join(''),
    })}
  ` }),
})

// ── Contact / Hours ──────────────────────────────────────────────────────────

const contact = section({
  id:       'contact',
  variant:  'alt',
  content: container({ content: grid({
    cols:    2,
    gap:     'xl',
    content: `
      <div class="u-flex u-flex-col u-gap-6">
        ${badge({ label: 'Find Us', variant: 'soft' })}
        ${heading({ level: 2, text: 'Visit or Get in Touch' })}
        <div class="u-flex u-flex-col u-gap-4">
          <div class="u-flex u-gap-3 u-items-start">
            ${iconMapPin({ size: 20 })}
            <div>
              <p class="u-font-semibold">Studio Location</p>
              <p class="u-text-muted u-text-sm">42 Elm Street, Maplewood, MT12 4PQ<br>Free parking on Elm Street and the adjacent car park.</p>
            </div>
          </div>
          <div class="u-flex u-gap-3 u-items-start">
            ${iconPhone({ size: 20 })}
            <div>
              <p class="u-font-semibold">Call or WhatsApp</p>
              <p class="u-text-muted u-text-sm"><a href="tel:+441234567890" class="u-text-accent">01234 567 890</a></p>
            </div>
          </div>
          <div class="u-flex u-gap-3 u-items-start">
            ${iconClock({ size: 20 })}
            <div>
              <p class="u-font-semibold">Opening Hours</p>
              <div class="u-text-muted u-text-sm u-flex u-flex-col u-gap-1">
                <p>Monday – Friday: 8:30am – 6:00pm</p>
                <p>Saturday: 9:00am – 4:00pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        ${card({
          title:   'Book an Appointment',
          content:    `
            <p class="u-text-muted u-text-sm u-mb-4">Call or WhatsApp us to book, or fill in the form and we'll confirm within a few hours.</p>
            <form class="u-flex u-flex-col u-gap-3">
              <div class="u-flex u-flex-col u-gap-1">
                <label class="u-text-sm u-font-medium" for="owner-name">Your name</label>
                <input id="owner-name" name="name" type="text" placeholder="Jane Smith" class="u-input" required>
              </div>
              <div class="u-flex u-flex-col u-gap-1">
                <label class="u-text-sm u-font-medium" for="owner-phone">Phone number</label>
                <input id="owner-phone" name="phone" type="tel" placeholder="07700 900 000" class="u-input" required>
              </div>
              <div class="u-flex u-flex-col u-gap-1">
                <label class="u-text-sm u-font-medium" for="dog-breed">Dog's breed & name</label>
                <input id="dog-breed" name="dog" type="text" placeholder="Biscuit — Cocker Spaniel" class="u-input">
              </div>
              <div class="u-flex u-flex-col u-gap-1">
                <label class="u-text-sm u-font-medium" for="service">Service</label>
                <select id="service" name="service" class="u-input">
                  <option>Bath &amp; Brush</option>
                  <option>Full Groom</option>
                  <option>Puppy Introduction</option>
                  <option>De-shed Treatment</option>
                  <option>Nail Trim</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              ${button({ label: 'Send Enquiry', type: 'submit', variant: 'primary', fullWidth: true })}
            </form>
          `,
          padding: 'lg',
        })}
      </div>
    `,
  }) }),
})

// ── CTA banner ────────────────────────────────────────────────────────────────

const ctaBanner = cta({
  eyebrow:  'First-time visitors',
  title:    '10% Off Your First Groom',
  subtitle: 'Mention this offer when you book. Valid for new customers on any full-groom package.',
  actions:  button({ label: 'Claim Offer', href: '#contact', variant: 'primary', size: 'lg' }),
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:    `${iconHeart({ size: 18 })}<span class="u-font-bold">Pawfect Grooming</span>`,
  links: [
    { label: 'Services',      href: '#services' },
    { label: 'About',         href: '#about'    },
    { label: 'Reviews',       href: '#reviews'  },
    { label: 'Book Now',      href: '#contact'  },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
  legal:   'Pawfect Grooming · 42 Elm Street, Maplewood MT12 4PQ · Company No. 11234567',
})

// ── Spec ─────────────────────────────────────────────────────────────────────

export default {
  route: '/templates/local-business',

  meta: {
    title:       'Pawfect Grooming — Professional Dog Grooming in Maplewood',
    description: 'Award-winning dog grooming salon in Maplewood. Expert cuts, baths, and nail trims for all breeds. Book online or call 01234 567 890.',
    theme:       'light',
    vibe:        'warm',
    styles:      ['/pulse-ui.css', '/themes/lumio.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">Skip to main content</a>
    ${pageNav}
    <main id="main-content">
      ${pageHero}
      ${statsStrip}
      ${services}
      ${about}
      ${reviews}
      ${contact}
      ${ctaBanner}
    </main>
    ${pageFooter}
  `,
}
