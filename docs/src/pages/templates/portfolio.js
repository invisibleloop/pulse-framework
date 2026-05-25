/**
 * Template: Portfolio / Personal Site
 *
 * A minimal, work-first portfolio for a creative professional —
 * designer, developer, photographer, architect, or illustrator.
 * Dark, editorial, image-led with a clean contact section.
 *
 * Vibe: minimal  Theme: dark (default)
 */

import { asset } from '../../lib/layout.js'
import {
  nav        as uiNav,
  hero,
  section,
  container,
  grid,
  card,
  gallery,
  heading,
  badge,
  button,
  footer,
  divider,
  iconUser,
  iconMail,
  iconExternalLink,
  iconArrowRight,
} from '../../../../src/ui/index.js'

// ── Navigation ────────────────────────────────────────────────────────────────

const pageNav = uiNav({
  logo: `<span class="u-font-bold u-tracking-tight" style="letter-spacing:-0.03em">Alex Mercer</span>`,
  links: [
    { label: 'Work',    href: '#work'    },
    { label: 'About',   href: '#about'   },
    { label: 'Contact', href: '#contact' },
  ],
  sticky: true,
})

// ── Hero ──────────────────────────────────────────────────────────────────────

const pageHero = hero({
  eyebrow:  'Designer & Creative Director',
  title:    'I Make Brands Feel Like Themselves',
  subtitle: 'Ten years of identity, interface, and interaction design for companies that care how they show up in the world.',
  actions:  `
    ${button({ label: 'See my work', href: '#work', variant: 'primary', size: 'lg' })}
    ${button({ label: 'Get in touch', href: '#contact', variant: 'ghost', size: 'lg' })}
  `,
  align:  'left',
  layout: 'centered',
  size:   'lg',
  background: 'linear-gradient(160deg, #0d0d10 0%, #12101a 100%)',
})

// ── Selected work ─────────────────────────────────────────────────────────────

const work = section({
  id:       'work',
  content: container({ size: 'lg', content: `
    <div class="u-flex u-items-end u-justify-between u-mb-10">
      <div>
        ${badge({ label: 'Selected Work', variant: 'soft' })}
        ${heading({ level: 2, text: 'Recent Projects' })}
      </div>
      <a href="#" class="u-text-sm u-text-muted u-flex u-items-center u-gap-1 u-no-underline hover:u-text-accent">
        All work ${iconArrowRight({ size: 14 })}
      </a>
    </div>
    ${grid({
      cols:    3,
      gap:     'md',
      content: [
        ...[
          { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', title: 'Meridian Health',         body: 'Brand identity, design system, and patient-facing web platform for a UK healthcare group.',   tags: ['Branding','Design System'] },
          { img: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop', title: 'Lume Architecture',       body: 'Website redesign and new visual identity for a London architecture practice.',                tags: ['Web Design','Identity']    },
          { img: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=600&h=400&fit=crop', title: 'Volta Coffee',            body: 'Packaging design, brand guidelines, and e-commerce site for a specialty roaster.',            tags: ['Packaging','E-commerce']   },
          { img: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop', title: 'Navi Finance',             body: 'Product design and interface system for a B2B fintech dashboard.',                           tags: ['Product Design','UI/UX']   },
          { img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', title: 'The Studio Collective',   body: 'Identity, print collateral, and membership site for a creative coworking space.',             tags: ['Identity','Print']         },
          { img: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=600&h=400&fit=crop', title: 'Bloom Wellbeing',         body: 'Brand strategy and visual identity for a mental health and wellbeing platform.',               tags: ['Strategy','Identity']      },
        ].map(w => card({
          flush:   true,
          content: `
            <a href="#" class="u-block">
              <img src="${w.img}" alt="${w.title}" class="u-w-full" style="aspect-ratio:3/2;object-fit:cover;">
            </a>
            <div class="u-p-5">
              <h3 class="u-font-semibold u-mb-2"><a href="#" class="u-text-inherit">${w.title}</a></h3>
              <p class="u-text-sm u-text-muted u-mb-3">${w.body}</p>
              <div class="u-flex u-flex-wrap u-gap-2">${w.tags.map(t => badge({ label: t, variant: 'soft', size: 'sm' })).join('')}</div>
            </div>
          `,
        })),
      ].join(''),
    })}
  ` }),
})

// ── About ─────────────────────────────────────────────────────────────────────

const about = section({
  id:       'about',
  variant:  'alt',
  content: container({ size: 'sm', content: `
    ${badge({ label: 'About', variant: 'soft' })}
    ${heading({ level: 2, text: 'A Designer Who Thinks Like a Strategist' })}
    <div class="u-flex u-flex-col u-gap-4 u-mt-4">
      <p class="u-text-muted u-leading-relaxed">I've spent the last decade working with startups, agencies, and established brands across healthcare, finance, and consumer goods. My work sits at the intersection of visual craft and strategic clarity.</p>
      <p class="u-text-muted u-leading-relaxed">Before going independent in 2020, I was Creative Director at Studio Contrast in London, where I led a team of eight on brand and digital projects for clients across Europe.</p>
      <p class="u-text-muted u-leading-relaxed">I'm based in Bristol but work with clients globally. I take on two or three new projects per quarter — if you have something interesting, let's talk.</p>
    </div>
    <div class="u-flex u-gap-4 u-mt-8 u-flex-wrap">
      ${['Brand Identity', 'Design Systems', 'UI/UX', 'Art Direction', 'Typography', 'Motion'].map(s =>
        badge({ label: s, variant: 'outline' })
      ).join('')}
    </div>
  ` }),
})

// ── Contact ───────────────────────────────────────────────────────────────────

const contact = section({
  id:       'contact',
  content: container({ size: 'sm', content: `
    <div class="u-text-center">
      ${badge({ label: 'Get in Touch', variant: 'soft' })}
      ${heading({ level: 2, text: "Let's Work Together" })}
      <p class="u-text-muted u-mt-3 u-mb-8">I'm currently available for projects starting Q3 2026. Send me a note and I'll get back to you within 24 hours.</p>
      <div class="u-flex u-flex-col u-gap-3 u-items-center">
        <a href="mailto:alex@alexmercer.design" class="u-flex u-items-center u-gap-2 u-text-accent u-no-underline u-font-medium">
          ${iconMail({ size: 18 })} alex@alexmercer.design
        </a>
        <a href="https://github.com/alexmercer" class="u-flex u-items-center u-gap-2 u-text-muted u-no-underline hover:u-text-accent" target="_blank" rel="noopener">
          ${iconExternalLink({ size: 18 })} github.com/alexmercer
        </a>
      </div>
      <div class="u-mt-10">
        ${button({ label: 'Download CV', href: '/cv-alex-mercer.pdf', variant: 'outline', size: 'lg' })}
      </div>
    </div>
  ` }),
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:  `<span class="u-font-bold u-tracking-tight">Alex Mercer</span>`,
  links: [
    { label: 'Work',    href: '#work'    },
    { label: 'About',   href: '#about'   },
    { label: 'Contact', href: '#contact' },
  ],
  legal: '© 2026 Alex Mercer Design Ltd · Bristol, UK · VAT 123 4567 89',
})

// ── Spec ─────────────────────────────────────────────────────────────────────

export default {
  route: '/templates/portfolio',

  meta: {
    title:       'Alex Mercer — Designer & Creative Director',
    description: 'Independent designer and creative director based in Bristol. Brand identity, design systems, and UI/UX for companies that care how they show up.',
    vibe:        'minimal',
    styles:      ['/pulse-ui.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">Skip to main content</a>
    ${pageNav}
    <main id="main-content">
      ${pageHero}
      ${work}
      ${about}
      ${contact}
    </main>
    ${pageFooter}
  `,
}
