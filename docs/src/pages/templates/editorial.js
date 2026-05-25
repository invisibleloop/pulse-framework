/**
 * Template: Editorial / Magazine Landing Page
 *
 * A publication homepage — featured article grid, newsletter signup,
 * category navigation, and a pullquote-driven article preview.
 * Strong typographic hierarchy. Dark theme.
 *
 * Vibe: editorial  Theme: dark (default)
 */

import { asset } from '../../lib/layout.js'
import {
  nav      as uiNav,
  hero,
  section,
  container,
  grid,
  card,
  heading,
  badge,
  button,
  footer,
  input,
  pullquote,
  divider,
  prose,
  iconBookmark,
  iconFeather,
  iconCheckCircle,
  iconArrowRight,
  iconCalendar,
  iconUser,
} from '../../../../src/ui/index.js'

// ── Navigation ────────────────────────────────────────────────────────────────

const pageNav = uiNav({
  logo: `${iconBookmark({ size: 20 })}<span class="u-font-bold" style="letter-spacing:-0.02em;font-style:italic">The Signal</span>`,
  links: [
    { label: 'Technology', href: '/technology' },
    { label: 'Design',     href: '/design'     },
    { label: 'Science',    href: '/science'    },
    { label: 'Culture',    href: '/culture'    },
    { label: 'Archive',    href: '/archive'    },
  ],
  action: button({ label: 'Subscribe', href: '#subscribe', size: 'sm', variant: 'primary' }),
  sticky: true,
})

// ── Hero — Featured article ───────────────────────────────────────────────────

const pageHero = hero({
  eyebrow:  'Technology · Feature',
  title:    'The Quiet Revolution: How Ambient AI Is Reshaping Every Profession',
  subtitle: 'It\'s not the robots that will change work — it\'s the invisible layer of intelligence already woven into the tools you use every day. A special investigation.',
  actions:  `
    <div class="u-flex u-items-center u-gap-4 u-flex-wrap">
      <span class="u-text-sm u-text-muted">${iconUser({ size: 14 })} By Anya Novak</span>
      <span class="u-text-sm u-text-muted">${iconCalendar({ size: 14 })} 24 May 2026</span>
      <span class="u-text-sm u-text-muted">18 min read</span>
    </div>
    ${button({ label: 'Read the investigation', href: '/articles/ambient-ai', variant: 'primary', size: 'lg' })}
  `,
  align:      'left',
  size:       'lg',
  background: 'linear-gradient(160deg, #0a0a0c 0%, #111118 100%)',
})

// ── Pullquote from featured ───────────────────────────────────────────────────

const featuredPullquote = section({
  variant:  'alt',
  padding:  'sm',
  content: container({ size: 'sm', content: pullquote({
    quote:  'The models are not coming for your job. The person who knows how to work with them is.',
    cite: 'Anya Novak, The Signal',
  }) }),
})

// ── Latest articles ───────────────────────────────────────────────────────────

const latestArticles = section({
  content: container({ content: `
    <div class="u-flex u-items-end u-justify-between u-mb-8">
      ${heading({ level: 2, text: 'Latest' })}
      <a href="/archive" class="u-text-sm u-text-muted u-flex u-items-center u-gap-1 u-no-underline hover:u-text-accent">
        Full archive ${iconArrowRight({ size: 14 })}
      </a>
    </div>
    ${grid({
      cols: 3,
      gap: 'lg',
      content: [
        {
          image:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=360&fit=crop',
          eyebrow:  'Design',
          title:    'Typography at Scale: What Happens When Humans Stop Setting Type',
          deck:     'AI is generating millions of documents per day. The defaults are winning.',
          author:   'Marcus Webb',
          date:     '22 May 2026',
          readTime: '8 min',
          href:     '/articles/typography-scale',
        },
        {
          image:    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=360&fit=crop',
          eyebrow:  'Science',
          title:    'The Sixth Mass Extinction Is Already Underway. Here Is What Scientists Are Doing.',
          deck:     'New genomic mapping tools are giving conservationists their first real-time picture.',
          author:   'Dr. Elena Vasquez',
          date:     '20 May 2026',
          readTime: '14 min',
          href:     '/articles/sixth-extinction',
        },
        {
          image:    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=360&fit=crop',
          eyebrow:  'Technology',
          title:    'Inside the Race to Build a Reliable Memory Layer for AI',
          deck:     'Every major lab is working on the same problem. Nobody has solved it yet.',
          author:   'Priya Sharma',
          date:     '18 May 2026',
          readTime: '11 min',
          href:     '/articles/ai-memory',
        },
        {
          image:    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=360&fit=crop',
          eyebrow:  'Culture',
          title:    'The Book That Predicted the Creator Economy — in 1972',
          deck:     'Alvin Toffler saw it coming. We just weren\'t paying close enough attention.',
          author:   'James Park',
          date:     '16 May 2026',
          readTime: '6 min',
          href:     '/articles/toffler-creator-economy',
        },
        {
          image:    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=360&fit=crop',
          eyebrow:  'Technology',
          title:    'GPT-6 and the End of Prompt Engineering as a Discipline',
          deck:     'What happens to the role when the model outgrows the interface?',
          author:   'Tom Chen',
          date:     '14 May 2026',
          readTime: '9 min',
          href:     '/articles/gpt6-prompts',
        },
        {
          image:    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=360&fit=crop',
          eyebrow:  'Science',
          title:    'Why Sleep Deprivation Is the Most Under-reported Crisis in Modern Medicine',
          deck:     'New research links chronic sleep loss to outcomes previously attributed to diet and exercise.',
          author:   'Fatima Al-Rashid',
          date:     '12 May 2026',
          readTime: '12 min',
          href:     '/articles/sleep-crisis',
        },
      ].map(a => card({
        flush:   true,
        content: `
          <img src="${a.image}" alt="${a.title}" class="u-w-full" style="aspect-ratio:16/9;object-fit:cover;">
          <div class="u-p-5">
            <div class="u-flex u-items-center u-gap-2 u-mb-2">
              ${badge({ label: a.eyebrow, variant: 'soft', size: 'sm' })}
            </div>
            <h3 class="u-font-semibold u-leading-snug u-mt-2">
              <a href="${a.href}" class="u-text-inherit">${a.title}</a>
            </h3>
            <p class="u-text-sm u-text-muted u-mt-2">${a.deck}</p>
            <div class="u-flex u-items-center u-gap-3 u-mt-3">
              <span class="u-text-xs u-text-muted">${a.author}</span>
              <span class="u-text-xs u-text-muted">·</span>
              <span class="u-text-xs u-text-muted">${a.date}</span>
              <span class="u-text-xs u-text-muted">·</span>
              <span class="u-text-xs u-text-muted">${a.readTime}</span>
            </div>
          </div>
        `,
      })).join(''),
    })}
  ` }),
})

// ── Newsletter ────────────────────────────────────────────────────────────────

const subscribe = section({
  id:       'subscribe',
  variant:  'spotlight',
  content: container({ size: 'sm', content: `
    <div class="u-text-center u-mb-8">
      ${badge({ label: 'Newsletter', variant: 'soft' })}
      ${heading({ level: 2, text: 'The Weekly Signal' })}
      <p class="u-text-muted u-mt-3">Our editors pick the five stories that matter most, with a short annotation on why. Sent every Friday at noon. No algorithm. No ads. Just signal.</p>
    </div>
    <div class="u-flex u-gap-3 u-justify-center u-flex-wrap">
      ${input({ label: 'Email address', name: 'email', type: 'email', placeholder: 'your@email.com', required: true })}
      ${button({ label: 'Subscribe Free', type: 'submit', variant: 'primary', size: 'lg' })}
    </div>
    <div class="u-flex u-justify-center u-gap-4 u-mt-4 u-flex-wrap">
      ${[
        'No spam, ever',
        'Unsubscribe any time',
        '47,000+ readers',
      ].map(item => `
        <span class="u-flex u-items-center u-gap-1 u-text-sm u-text-muted">
          ${iconCheckCircle({ size: 14 })} ${item}
        </span>
      `).join('')}
    </div>
  ` }),
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:  `${iconBookmark({ size: 18 })}<span class="u-font-bold u-italic">The Signal</span>`,
  links: [
    { label: 'Technology', href: '/technology' },
    { label: 'Design',     href: '/design'     },
    { label: 'Science',    href: '/science'    },
    { label: 'Culture',    href: '/culture'    },
    { label: 'Subscribe',  href: '#subscribe'  },
    { label: 'About',      href: '/about'      },
    { label: 'Privacy',    href: '/privacy'    },
  ],
  legal: '© 2026 The Signal Media Ltd · All rights reserved · ISSN 2048-9021',
})

// ── Spec ─────────────────────────────────────────────────────────────────────

export default {
  route: '/templates/editorial',

  meta: {
    title:       'The Signal — Journalism for the Curious Mind',
    description: 'Independent long-form journalism covering technology, design, science, and culture. Subscribe to The Weekly Signal — 47,000 readers.',
    vibe:        'editorial',
    styles:      ['/pulse-ui.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">Skip to main content</a>
    ${pageNav}
    <main id="main-content">
      ${pageHero}
      ${featuredPullquote}
      ${latestArticles}
      ${subscribe}
    </main>
    ${pageFooter}
  `,
}
