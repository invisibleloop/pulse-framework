/**
 * Template: Mobile App Landing Page
 *
 * A complete landing page for a mobile app — nav, hero, features,
 * stats, testimonials, pricing, FAQ, CTA, footer.
 * Built entirely from Pulse UI components, zero custom HTML.
 */

import {
  nav        as uiNav,
  hero,
  phoneFrame,
  section,
  container,
  grid,
  feature,
  stat,
  testimonial,
  pricing,
  accordion,
  cta,
  footer,
  appBadge,
  button,
  iconFeather,
  iconAi,
  iconSmile,
  iconLock,
  iconZap,
  iconRefresh,
  iconBarChart,
} from '../../../../src/ui/index.js'

// ── Navigation ────────────────────────────────────────────────────────────────

const pageNav = uiNav({
  logo: `${iconFeather({ size: 20 })}<span class="u-font-bold" style="letter-spacing:-0.02em;color:#fff">Lumio</span>`,
  links: [
    { label: 'Features',     href: '#features'     },
    { label: 'Pricing',      href: '#pricing'      },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ',          href: '#faq'          },
  ],
  action: button({ label: 'Download Free', href: '#download', size: 'sm' }),
  sticky: true,
  background: 'rgba(58, 78, 88, 0.75)',
  color: '#fff',
})

// ── Hero ──────────────────────────────────────────────────────────────────────

const phoneScreen = `
  <div style="background:#1a2c24;height:100%;padding:0.75rem;display:flex;flex-direction:column;gap:0.625rem;font-family:system-ui,sans-serif;">

    <!-- status bar -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0.25rem;font-size:0.6rem;color:rgba(255,255,255,0.5)">
      <span>9:41</span>
      <div style="display:flex;gap:4px;align-items:center">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="rgba(255,255,255,0.5)" aria-hidden="true"><rect x="0" y="2" width="2" height="6" rx="1"/><rect x="3" y="1" width="2" height="7" rx="1"/><rect x="6" y="0" width="2" height="8" rx="1"/><rect x="9" y="0" width="2" height="8" rx="1" opacity="0.3"/></svg>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="rgba(255,255,255,0.5)" aria-hidden="true"><path d="M5 1.5C3.1 1.5 1.4 2.3 0.2 3.6L1.6 5c0.9-1 2.1-1.5 3.4-1.5s2.5.6 3.4 1.5L9.8 3.6C8.6 2.3 6.9 1.5 5 1.5zm0 3L6.4 6c-.4-.4-.9-.6-1.4-.6s-1 .2-1.4.6L5 4.5zm0-6C2.1-1.5.2-.6-1.2.8L.2 2.2C1.9.8 3.4 0 5 0s3.1.8 4.8 2.2L11.2.8C9.8-.6 7.9-1.5 5-1.5z" transform="translate(0,1.5)"/></svg>
        <svg width="20" height="8" viewBox="0 0 20 8" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="16" height="7" rx="2" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><rect x="1.5" y="1.5" width="12" height="5" rx="1" fill="rgba(255,255,255,0.7)"/><path d="M18 3v2c.8-.3.8-1.7 0-2z" fill="rgba(255,255,255,0.6)"/></svg>
      </div>
    </div>

    <!-- greeting + streak badge -->
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:0.62rem;color:rgba(255,255,255,0.55)">Good morning</div>
        <div style="font-size:0.85rem;font-weight:700;color:#fff">Sarah</div>
      </div>
      <div style="background:rgba(229,193,189,0.18);border:1px solid rgba(229,193,189,0.35);border-radius:999px;padding:0.2rem 0.5rem;display:flex;align-items:center;gap:0.25rem;font-size:0.6rem;color:#e5c1bd;font-weight:600">
        🔥 28
      </div>
    </div>

    <!-- today's entry card -->
    <div style="background:linear-gradient(135deg,#2a4d3c,#3a6650);border-radius:0.75rem;padding:0.75rem;flex-shrink:0">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.6);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.04em">Today's entry</div>
      <div style="font-size:0.78rem;font-weight:600;color:#fff;margin-bottom:0.2rem">Morning reflection</div>
      <div style="font-size:0.65rem;color:rgba(255,255,255,0.7);line-height:1.4">Feeling grateful today. The early morning…</div>
      <div style="display:flex;gap:0.25rem;margin-top:0.5rem">
        ${['😊','🌤','✨'].map(e=>`<span style="font-size:0.75rem">${e}</span>`).join('')}
      </div>
    </div>

    <!-- mood chart -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:0.625rem;padding:0.625rem">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.55);margin-bottom:0.4rem;font-weight:500">MOOD THIS WEEK</div>
      <div style="display:flex;gap:3px;align-items:flex-end;height:32px">
        ${[55,70,45,85,65,80,100].map((h,i)=>`<div style="flex:1;background:${i===6?'#7b9e87':'rgba(123,158,135,0.3)'};border-radius:2px 2px 0 0;height:${h}%;transition:height 0.3s"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:3px">
        ${['M','T','W','T','F','S','S'].map((d,i)=>`<span style="font-size:0.5rem;color:${i===6?'#b6be9c':'rgba(255,255,255,0.25)'};flex:1;text-align:center">${d}</span>`).join('')}
      </div>
    </div>

    <!-- AI insight -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:0.625rem;padding:0.625rem;display:flex;gap:0.4rem;align-items:flex-start">
      <span style="font-size:0.75rem;flex-shrink:0">✦</span>
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);line-height:1.5">You write more on days you exercise. 3-day pattern detected.</div>
    </div>

  </div>`

const pageHero = hero({
  eyebrow:  'Your mindful journaling companion',
  title:    'Write, reflect, and grow every day',
  subtitle: 'Lumio uses AI to help you understand your thoughts, track your mood, and build lasting habits — all in a beautifully simple journal.',
  background:   '#7b9e87',
  eyebrowColor: '#1a2e24',
  color:        '#1a2e24',
  image:    phoneFrame({ content: phoneScreen }),
  actions:  `
    <div class="u-flex u-gap-3 u-flex-wrap u-justify-center">
      ${appBadge({ store: 'apple',  href: '#download' })}
      ${appBadge({ store: 'google', href: '#download' })}
    </div>
    <p class="u-mt-3 u-text-sm u-text-muted">Free forever · No credit card required</p>
  `,
})

// ── Stats ─────────────────────────────────────────────────────────────────────

const statsSection = section({
  variant: 'alt',
  padding: 'sm',
  content: container({
    content: grid({
      cols:    4,
      gap:     'md',
      content: [
        stat({ label: 'Active users',     value: '127K+', trend: 'up',      change: '↑ 23% this month',  center: true }),
        stat({ label: 'Journal entries',  value: '4.2M',  trend: 'up',      change: '↑ 18% this month',  center: true }),
        stat({ label: 'App Store rating', value: '4.9',   trend: 'neutral', change: '★ 8,400 reviews',   center: true }),
        stat({ label: 'Days avg. streak', value: '34',    trend: 'up',      change: '↑ 12% vs last year', center: true }),
      ].join(''),
    }),
  }),
})

// ── Features ──────────────────────────────────────────────────────────────────

const featuresSection = section({
  id:       'features',
  eyebrow:  'Why people love Lumio',
  title:    'Everything you need to build a journaling habit',
  align:    'center',
  content: container({
    content: grid({
      cols: 3,
      gap:  'lg',
      content: [
        feature({ icon: iconAi({ size: 36 }),       title: 'AI-powered insights',    description: 'Lumio reads between the lines. Get weekly summaries, pattern recognition, and personalised prompts that help you dig deeper.' }),
        feature({ icon: iconSmile({ size: 36 }),    title: 'Mood & habit tracking',  description: 'Log your mood in seconds with an emoji or a word. Lumio connects the dots over time so you can see what affects how you feel.' }),
        feature({ icon: iconLock({ size: 36 }),     title: 'End-to-end encrypted',   description: 'Your journal is yours alone. Every entry is encrypted on your device before it ever touches our servers. We literally cannot read it.' }),
        feature({ icon: iconZap({ size: 36 }),      title: 'Daily prompts',          description: 'Never stare at a blank page. Choose from 300+ prompts crafted by therapists and coaches, or let Lumio suggest one based on your week.' }),
        feature({ icon: iconRefresh({ size: 36 }),  title: 'Sync across devices',    description: 'Start on your phone, continue on your tablet. Everything syncs instantly and works offline — your entries are always available.' }),
        feature({ icon: iconBarChart({ size: 36 }), title: 'Progress & streaks',     description: 'Streaks keep you accountable. Track your journaling consistency with beautiful charts and celebrate milestones along the way.' }),
      ].map(f => `<div>${f}</div>`).join(''),
    }),
  }),
})

// ── Testimonials ──────────────────────────────────────────────────────────────

const testimonialsSection = section({
  id:       'testimonials',
  variant:  'alt',
  eyebrow:  'Loved by 127,000+ journalers',
  title:    'Real people, real results',
  align:    'center',
  content: container({
    content: grid({
      cols: 3,
      gap:  'md',
      content: [
        testimonial({ quote: 'I\'ve tried every journaling app out there. Lumio is the first one that actually helped me understand why I was feeling burnt out. The AI insights are genuinely useful, not gimmicky.', name: 'Sarah K.',     role: 'Product Designer',     rating: 5 }),
        testimonial({ quote: 'The streak feature sounds simple but it completely changed my relationship with writing. 112 days in and I haven\'t missed one. My therapist noticed a difference before I did.',            name: 'Marcus T.',    role: 'Software Engineer',    rating: 5 }),
        testimonial({ quote: 'I was sceptical about the AI part but it\'s surprisingly good at spotting patterns. It told me I write less when I skip my morning run — completely true and now I use it as motivation.', name: 'Priya R.',     role: 'Clinical Psychologist', rating: 5 }),
      ].map(t => `<div>${t}</div>`).join(''),
    }),
  }),
})

// ── Pricing ───────────────────────────────────────────────────────────────────

const pricingSection = section({
  id:       'pricing',
  eyebrow:  'Simple pricing',
  title:    'Start free, upgrade when you\'re ready',
  subtitle: 'No contracts. Cancel any time. All plans include a 14-day free trial of Lumio Pro.',
  align:    'center',
  content: container({
    size:    'md',
    content: grid({
      cols: 3,
      gap:  'md',
      content: [
        pricing({
          name:        'Free',
          price:       '£0',
          period:      'forever',
          description: 'Everything you need to start a journaling habit.',
          features: [
            'Unlimited journal entries',
            'Basic mood tracking',
            '30-day history',
            '5 daily prompts per month',
            'iOS & Android apps',
          ],
          action: button({ label: 'Get started free', href: '#download', variant: 'outline', full: true }),
        }),
        pricing({
          name:        'Pro',
          price:       '£4.99',
          period:      '/month',
          description: 'AI insights and unlimited everything for serious journalers.',
          badge:       'Most popular',
          highlighted: true,
          features: [
            'Everything in Free',
            'AI-powered weekly insights',
            'Unlimited prompt library',
            'Mood pattern analysis',
            'End-to-end encryption',
            'Export to PDF',
          ],
          action: button({ label: 'Start free trial', href: '#download', full: true }),
        }),
        pricing({
          name:        'Family',
          price:       '£9.99',
          period:      '/month',
          description: 'Share Lumio Pro with up to 5 family members.',
          features: [
            'Everything in Pro',
            'Up to 5 accounts',
            'Shared family streaks',
            'Parental controls',
            'Priority support',
          ],
          action: button({ label: 'Start free trial', href: '#download', variant: 'outline', full: true }),
        }),
      ].map(p => `<div>${p}</div>`).join(''),
    }),
  }),
})

// ── FAQ ───────────────────────────────────────────────────────────────────────

const faqSection = section({
  id:      'faq',
  variant: 'alt',
  eyebrow: 'FAQ',
  title:   'Common questions',
  align:   'center',
  content: container({
    size:    'sm',
    content: accordion({
      items: [
        {
          question: 'Is my journal really private?',
          answer:   'Yes — completely. Entries are encrypted on your device using AES-256 before upload. Our servers only ever see ciphertext. Even Lumio employees cannot read your journal.',
        },
        {
          question: 'What happens when my 14-day trial ends?',
          answer:   'You\'ll automatically drop to the Free plan. All your entries are kept — you just lose access to Pro features like AI insights and the full prompt library. No surprise charges.',
        },
        {
          question: 'Can I export my data?',
          answer:   'Pro users can export the full journal history as a PDF or JSON file at any time from Settings → Export. Free users can export the last 30 days.',
        },
        {
          question: 'Does it work offline?',
          answer:   'Yes. The full app works offline — write, browse, and edit entries without a connection. Changes sync automatically when you\'re back online.',
        },
        {
          question: 'How does the AI know what to say?',
          answer:   'The AI reads your entries (on-device, before encryption) to spot recurring themes, emotional patterns, and topics. It never sends plain-text content to our servers.',
        },
      ],
    }),
  }),
})

// ── Download CTA ──────────────────────────────────────────────────────────────

const downloadCta = section({
  id:      'download',
  content: cta({
    eyebrow:  'Ready to start?',
    title:    'Your journal is waiting',
    subtitle: 'Join 127,000 people who journal with Lumio every day. Free forever — no credit card needed.',
    actions:  `
      <div class="u-flex u-gap-3 u-flex-wrap u-justify-center">
        ${appBadge({ store: 'apple',  href: '#' })}
        ${appBadge({ store: 'google', href: '#' })}
      </div>`,
  }),
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:     `${iconFeather({ size: 18 })}<span class="u-font-bold" style="letter-spacing:-0.02em">Lumio</span>`,
  logoHref: '#',
  links: [
    { label: 'Privacy',  href: '#' },
    { label: 'Terms',    href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Blog',     href: '#' },
    { label: 'Twitter',  href: '#' },
  ],
  legal: `© ${new Date().getFullYear()} Lumio Inc. All rights reserved.`,
})

// ── Spec ──────────────────────────────────────────────────────────────────────

export default {
  route: '/templates/mobile-app',

  meta: {
    title:       'Lumio — Journal with clarity',
    description: 'The AI-powered journaling app that helps you understand your thoughts, track your mood, and build lasting habits.',
    theme:       'light',
    styles:      ['/pulse-ui.css', '/themes/lumio.css'],
  },

  view: () => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:1rem;z-index:9999;padding:0.5rem 1rem;background:var(--color-accent);color:white;border-radius:0.25rem;text-decoration:none">Skip to main content</a>
    ${pageNav}
    <main id="main-content">
      ${pageHero}
      ${statsSection}
      ${featuresSection}
      ${testimonialsSection}
      ${pricingSection}
      ${faqSection}
      ${downloadCta}
    </main>
    ${pageFooter}
    <script src="/pulse-ui.js" defer></script>`,
}
