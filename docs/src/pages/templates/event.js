/**
 * Template: Event / Conference Landing Page
 *
 * A high-energy landing page for a tech conference, festival, workshop, or concert.
 * Dark, bold, with speaker grid, schedule accordion, venue info, and ticket CTA.
 *
 * Vibe: bold  Theme: dark (default)
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
  accordion,
  cta,
  footer,
  button,
  badge,
  heading,
  avatar,
  marquee,
  iconCalendar,
  iconMapPin,
  iconUsers,
  iconZap,
  iconStar,
} from '../../../../src/ui/index.js'

// ── Navigation ────────────────────────────────────────────────────────────────

const pageNav = uiNav({
  logo: `${iconZap({ size: 20 })}<span class="u-font-black" style="letter-spacing:-0.04em;font-size:1.2rem">SIGNAL</span>`,
  links: [
    { label: 'Speakers', href: '#speakers' },
    { label: 'Schedule', href: '#schedule' },
    { label: 'Venue',    href: '#venue'    },
  ],
  action:     button({ label: 'Get Tickets', href: '#tickets', size: 'sm', variant: 'primary' }),
  sticky:     true,
  background: 'rgba(5, 5, 8, 0.9)',
})

// ── Hero ──────────────────────────────────────────────────────────────────────

const pageHero = hero({
  eyebrow:  '14–16 October 2026 · London',
  title:    'The UK\'s Premier Design & Technology Conference',
  subtitle: 'Three days. 40 speakers. One thousand makers, designers, and engineers coming together to build what\'s next.',
  actions:  `
    ${button({ label: 'Get Early Bird Tickets', href: '#tickets', variant: 'primary', size: 'lg' })}
    ${button({ label: 'View Programme',         href: '#schedule', variant: 'ghost',  size: 'lg' })}
  `,
  align:      'center',
  size:       'xl',
  background: 'linear-gradient(180deg, #05050a 0%, #0d0829 50%, #05050a 100%)',
})

// ── Stats strip ───────────────────────────────────────────────────────────────

const statsStrip = section({
  variant:  'dark',
  padding:  'sm',
  content: container({ content: grid({
    cols:    4,
    gap:     'lg',
    content: [
      stat({ value: '3 days',   label: '14–16 October 2026'      }),
      stat({ value: '40+',      label: 'World-class speakers'    }),
      stat({ value: '1,000',    label: 'Attendees expected'      }),
      stat({ value: '12 tracks', label: 'Across design + tech'  }),
    ].join(''),
  }) }),
})

// ── Sponsor logos ─────────────────────────────────────────────────────────────

const sponsors = section({
  padding:  'sm',
  content: container({ content: `
    <p class="u-text-center u-text-sm u-text-muted u-mb-6 u-uppercase u-tracking-widest">Supported by</p>
    ${marquee({
      speed:    40,
      fade:     true,
      content: ['Acme Corp', 'Vertex AI', 'CloudStack', 'Meridian', 'NovaBuild', 'Prism Labs', 'Synthwave Co', 'Lattice'].map(name =>
        `<span class="u-font-bold u-text-muted u-text-lg u-px-6">${name}</span>`
      ).join(''),
    })}
  ` }),
})

// ── Speakers ──────────────────────────────────────────────────────────────────

const speakers = section({
  id:       'speakers',
  content: container({ content: `
    <div class="u-text-center u-mb-10">
      ${badge({ label: 'Speakers', variant: 'soft' })}
      ${heading({ level: 2, text: 'Learn From the Best' })}
      <p class="u-text-muted u-mt-3">Practitioners and visionaries from the leading companies and independent studios.</p>
    </div>
    ${grid({
      cols: 4,
      gap: 'md',
      content: [
        { name: 'Dr. Sarah Okonkwo', role: 'Head of AI Research, DeepMind',        topic: 'The limits of large language models',          img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop' },
        { name: 'James Park',        role: 'Co-founder, Figma',                     topic: 'Design tools for the next ten years',          img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
        { name: 'Elena Vasquez',     role: 'CTO, Stripe',                           topic: 'How we built a 99.999% uptime payment system', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
        { name: 'Priya Sharma',      role: 'Design Director, Apple',                topic: 'Designing for a billion devices',               img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' },
        { name: 'Marcus Webb',       role: 'Founder, Linear',                       topic: 'Why product velocity is a design problem',     img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
        { name: 'Anya Petrova',      role: 'Principal Engineer, Vercel',            topic: 'The future of edge rendering',                 img: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop' },
        { name: 'Tom Chen',          role: 'Creative Director, Pentagram',          topic: 'Brand identity in the age of AI generation',   img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
        { name: 'Fatima Al-Rashid',  role: 'Accessibility Lead, BBC',               topic: 'Designing for everyone, not just most people', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' },
      ].map(s => card({
        flush:   true,
        content: `
          <img src="${s.img}" alt="${s.name}" class="u-w-full" style="aspect-ratio:1/1;object-fit:cover;">
          <div class="u-p-4">
            <p class="u-font-semibold">${s.name}</p>
            <p class="u-text-sm u-text-muted u-mb-2">${s.role}</p>
            <p class="u-text-sm u-italic">"${s.topic}"</p>
          </div>
        `,
      })).join(''),
    })}
  ` }),
})

// ── Schedule ──────────────────────────────────────────────────────────────────

const schedule = section({
  id:       'schedule',
  variant:  'alt',
  content: container({ content: `
    <div class="u-text-center u-mb-10">
      ${badge({ label: 'Schedule', variant: 'soft' })}
      ${heading({ level: 2, text: 'Three Days. Every Angle.' })}
    </div>
    ${accordion({
      items: [
        {
          question: 'Day 1 — Design Systems & Strategy (14 Oct)', answer: `<div class="u-flex u-flex-col u-gap-3 u-py-2">
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">9:00am — Opening keynote: The state of design in 2026</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">11:00am — Panel: Design tokens at scale</span><span class="u-text-sm u-text-muted">Hall A</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">2:00pm — Workshop: Building accessible design systems</span><span class="u-text-sm u-text-muted">Workshop Room 1</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">4:30pm — Talk: Brand identity in the AI generation</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">6:30pm — Evening drinks and networking</span><span class="u-text-sm u-text-muted">Rooftop</span></div>
          </div>`,
        },
        {
          question: 'Day 2 — Engineering & Performance (15 Oct)', answer: `<div class="u-flex u-flex-col u-gap-3 u-py-2">
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">9:30am — Keynote: The future of edge rendering</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">11:30am — Talk: Building 99.999% uptime systems</span><span class="u-text-sm u-text-muted">Hall B</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">2:00pm — Deep dive: AI/ML in production</span><span class="u-text-sm u-text-muted">Hall A</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">4:00pm — Lightning talks: 8 speakers × 10 minutes</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">7:00pm — Sponsor showcase & demos</span><span class="u-text-sm u-text-muted">Expo Floor</span></div>
          </div>`,
        },
        {
          question: 'Day 3 — Product & AI (16 Oct)', answer: `<div class="u-flex u-flex-col u-gap-3 u-py-2">
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">9:30am — Keynote: Designing for a billion devices</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">11:00am — Panel: AI tools that actually ship</span><span class="u-text-sm u-text-muted">Hall A</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">2:00pm — Talk: Product velocity as a design problem</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
            <div class="u-flex u-justify-between u-items-start"><span class="u-font-medium">4:00pm — Closing keynote + awards</span><span class="u-text-sm u-text-muted">Main Stage</span></div>
          </div>`,
        },
      ],
    })}
  ` }),
})

// ── Venue ─────────────────────────────────────────────────────────────────────

const venue = section({
  id:       'venue',
  content: container({ content: grid({
    cols:    2,
    gap:     'xl',
    content: `
      <div class="u-flex u-flex-col u-gap-5">
        ${badge({ label: 'Venue', variant: 'soft' })}
        ${heading({ level: 2, text: 'The Barbican Centre, London' })}
        <p class="u-text-muted u-leading-relaxed">One of Europe's largest multi-arts venues — a brutalist landmark in the heart of the City of London. SIGNAL takes over the entire main complex for three days.</p>
        <div class="u-flex u-flex-col u-gap-3">
          <div class="u-flex u-gap-3 u-items-center">
            ${iconMapPin({ size: 18 })} <span class="u-text-muted">Silk Street, Barbican, London EC2Y 8DS</span>
          </div>
          <div class="u-flex u-gap-3 u-items-center">
            ${iconCalendar({ size: 18 })} <span class="u-text-muted">14–16 October 2026 · Doors open 9:00am daily</span>
          </div>
          <div class="u-flex u-gap-3 u-items-center">
            ${iconUsers({ size: 18 })} <span class="u-text-muted">Capacity: 1,200 across 6 stages and 3 workshop rooms</span>
          </div>
        </div>
      </div>
      <div>
        <img src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop" alt="Barbican Centre, London" class="u-w-full u-rounded-lg" style="object-fit:cover;height:320px;">
      </div>
    `,
  }) }),
})

// ── Tickets ───────────────────────────────────────────────────────────────────

const tickets = cta({
  id:       'tickets',
  eyebrow:  'Early Bird — ends 30 June',
  title:    'Join 1,000 Makers in London',
  subtitle: 'All-access pass includes three days of talks, workshops, evening events, and a printed programme. Early bird saves £200.',
  actions:  `
    ${button({ label: 'Get Early Bird Tickets — £495', href: 'https://signal-conf.example/tickets', variant: 'primary', size: 'lg' })}
    ${button({ label: 'Team discounts (5+)',           href: 'mailto:team@signal-conf.example',     variant: 'ghost',   size: 'lg' })}
  `,
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:  `${iconZap({ size: 16 })}<span class="u-font-black" style="letter-spacing:-0.04em">SIGNAL</span>`,
  links: [
    { label: 'Speakers',    href: '#speakers' },
    { label: 'Schedule',    href: '#schedule' },
    { label: 'Venue',       href: '#venue'    },
    { label: 'Sponsorship', href: '/sponsor'  },
    { label: 'Code of Conduct', href: '/coc' },
  ],
  legal: 'Signal Conference Ltd · Registered in England & Wales · Company No. 14567890',
})

// ── Spec ─────────────────────────────────────────────────────────────────────

export default {
  route: '/templates/event',

  meta: {
    title:       'SIGNAL 2026 — Design & Technology Conference, London',
    description: '14–16 October 2026 at the Barbican, London. 40 speakers, 3 days, 12 tracks covering design, engineering, and AI.',
    vibe:        'bold',
    styles:      ['/pulse-ui.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">Skip to main content</a>
    ${pageNav}
    <main id="main-content">
      ${pageHero}
      ${statsStrip}
      ${sponsors}
      ${speakers}
      ${schedule}
      ${venue}
      ${tickets}
    </main>
    ${pageFooter}
  `,
}
