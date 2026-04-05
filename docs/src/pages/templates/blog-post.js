/**
 * Template: Blog Post — Observatory
 *
 * A full blog post page for an astronomy publication.
 * Includes sticky nav, article hero, prose body, newsletter signup, and footer.
 * Dark theme using the Observatory palette (prussian blue / pacific blue).
 */

import { asset } from '../../lib/layout.js'
import {
  nav        as uiNav,
  hero,
  section,
  container,
  prose,
  heading,
  card,
  input,
  button,
  footer,
  iconTelescope,
  iconCheckCircle,
  iconCalendar,
  iconMapPin,
} from '../../../../src/ui/index.js'

// ── Navigation ───────────────────────────────────���────────────────────────────

const pageNav = uiNav({
  logo: `${iconTelescope({ size: 20 })}<span class="u-font-bold" style="letter-spacing:-0.02em">Observatory</span>`,
  links: [
    { label: 'Articles', href: '#' },
    { label: 'Topics',   href: '#' },
    { label: 'Archive',  href: '#' },
  ],
  sticky:     true,
  background: 'rgba(10, 34, 57, 0.85)',
})

// ── Article hero ──────────────────────────────────────────────────────────────

const articleHero = hero({
  eyebrow:  'Deep Sky Objects',
  title:    'The Pillars of Creation: Stellar Nurseries Caught in the Act',
  subtitle: 'Six trillion miles tall and sculpted by the light of newborn stars — the Eagle Nebula\'s most famous feature is one of the most photographed objects in the cosmos. Here\'s what three decades of observation have revealed.',
  actions:  `<p class="u-text-sm u-text-muted">By Dr. Elena Vasquez · 14 January 2026 · 9 min read</p>`,
  align:    'center',
  size:     'sm',
  background: 'linear-gradient(160deg, #0a2239 0%, #132e32 60%, #0d2b38 100%)',
})

// ── Article body ──────────────────────────────────────────────────────────────

const articleBody = `
<p>In April 1995, astronomers pointed the Hubble Space Telescope at a seemingly unremarkable patch of sky in the constellation Serpens. What they captured would become one of the most iconic images in the history of science: three towering columns of gas and dust, backlit by the fierce radiation of newly-formed stars.</p>

<p>These are the Pillars of Creation — a region of active star formation nestled inside the Eagle Nebula, some 6,500 light-years from Earth. The tallest pillar stretches four light-years from base to tip, roughly equivalent to the distance between our Sun and its nearest stellar neighbour, Proxima Centauri.</p>

<figure>
  <img
    src="/img/heic1501a.jpg"
    alt="Three towering columns of gas and dust, backlit by brilliant blue stars, rise from a field of glowing hydrogen in the Eagle Nebula — the Pillars of Creation as seen by Hubble."
    loading="lazy">
  <figcaption>The Pillars of Creation, Eagle Nebula (M16) — Hubble Space Telescope, 2015. Credit: NASA, ESA/Hubble and the Hubble Heritage Team</figcaption>
</figure>

<h2 id="what-are-the-pillars">What are the Pillars, exactly?</h2>

<p>The Pillars are a type of structure known as an evaporating gaseous globule, or EGG. They form when intense ultraviolet radiation from hot, massive young stars bombards surrounding clouds of molecular hydrogen. The radiation ionises the outer layers of the cloud, causing them to evaporate and stream away. But denser knots of gas resist this erosion, acting as shields that protect the material behind them.</p>

<p>The result is a column: a finger of denser gas pointing away from the radiation source, its tip rounded and hardened by the very light trying to destroy it. The pillars we see in the Eagle Nebula are essentially the remnants of a much larger cloud, sculpted over millions of years by the stars that formed within it.</p>

<h2 id="nursery-in-destruction">A nursery in the act of destruction</h2>

<p>Look closely at the tips of the pillars and you'll see small, dark bumps — protrusions that break away from the column like droplets from a slow-moving waterfall. Each of these is a potential solar system in the making. Inside every bump, gravity is pulling gas and dust into an ever-tighter knot. Given time — another hundred thousand years, perhaps — each one may collapse under its own weight and ignite as a new star.</p>

<p>The irony is profound. The very stars that are destroying the pillars through photoevaporation were themselves born from the same cloud. The Pillars of Creation are, simultaneously, a stellar nursery and a funeral pyre.</p>

<h2 id="how-spitzer-changed">How Spitzer changed the story</h2>

<p>In 2007, the Spitzer Space Telescope — sensitive to infrared light invisible to human eyes — revealed something unexpected. The Eagle Nebula appeared to have already been hit by the shockwave from a supernova explosion. If correct, the pillars we see in visible light may already be gone. Light from their destruction would still be en route to us, not expected to arrive for another thousand years.</p>

<p>When it does, the Eagle Nebula will briefly outshine everything in the night sky except the Moon. Then, as the light-years between us absorb the news, it will fade — and one of the most recognisable objects in the cosmos will exist only in our archives.</p>

<h2 id="the-webb-revision">The Webb revision</h2>

<p>In 2022, the James Webb Space Telescope turned its golden mirror on the Pillars and returned images that made 1995 look like a rough draft. Webb's near-infrared camera penetrated the dust to reveal thousands of previously hidden young stars, some still wrapped in their accretion discs. Orange jets of superheated material punch out from several of the protostars, signatures of the violent magnetic fields that accompany stellar birth.</p>

<p>Webb also confirmed that the Pillars are not as serene as they appear. Turbulence ripples through the gas. Temperature gradients steepen where radiation meets denser material. The whole structure is in slow, continuous motion — a three-dimensional sculpture being revised in real time by forces we are only beginning to understand.</p>

<h2 id="observing-from-earth">Observing from Earth</h2>

<p>The Eagle Nebula is visible from Earth with modest equipment. From mid-northern latitudes, it rises in the southeast during summer evenings and reaches its highest point around midnight in July. A modest telescope at low magnification will reveal the nebulosity surrounding the cluster M16. The pillars themselves, however, require long-exposure imaging — they lie within the brighter core of the nebula and are impossible to resolve visually.</p>

<p>If you point a camera at M16 on a dark night and stack several hours of exposures, the pillars will emerge from the noise — dim, dark columns against a field of glowing hydrogen. You'll be photographing light that left the nebula when the Western Roman Empire was still intact. Every image you take is a time machine.</p>
`

// ── Article aside ────────────────────────────────────────────────────────────

const articleAside = `
  <aside aria-label="Article sidebar">
    <div class="obs-aside-section">
      <p class="u-text-sm u-font-semibold u-mb-3">In this article</p>
      <nav aria-label="Article sections">
        <a class="obs-aside-nav-link" href="#what-are-the-pillars">What are the Pillars?</a>
        <a class="obs-aside-nav-link" href="#nursery-in-destruction">A nursery in the act of destruction</a>
        <a class="obs-aside-nav-link" href="#how-spitzer-changed">How Spitzer changed the story</a>
        <a class="obs-aside-nav-link" href="#the-webb-revision">The Webb revision</a>
        <a class="obs-aside-nav-link" href="#observing-from-earth">Observing from Earth</a>
      </nav>
    </div>
    <div class="obs-aside-section">
      ${card({
        content: `
          <p class="u-text-xs u-font-semibold u-text-accent u-mb-2">UPCOMING EVENT</p>
          ${heading({ level: 3, text: 'Dark Sky Night 2026' })}
          <p class="u-text-sm u-text-muted u-mt-2 u-mb-4">A guided tour of the summer sky with expert astronomers. Telescopes provided. Suitable for all ages.</p>
          <div class="u-flex u-flex-col u-gap-1 u-mb-4">
            <span class="u-flex u-items-center u-gap-2 u-text-sm u-text-muted">
              ${iconCalendar({ size: 14 })} 19 July 2026
            </span>
            <span class="u-flex u-items-center u-gap-2 u-text-sm u-text-muted">
              ${iconMapPin({ size: 14 })} Galloway Forest Park, Scotland
            </span>
          </div>
          ${button({ label: 'Book a place', href: '#', size: 'sm', full: true })}
        `,
      })}
    </div>
  </aside>`

// ── Newsletter ────────────────────────────────────────────────────────────────

const newsletterSection = (state) => section({
  id:      'newsletter',
  variant: 'alt',
  content: container({
    size:    'sm',
    content: `
      <div class="u-text-center">
        ${heading({ level: 2, text: 'Never miss a discovery' })}
        <p class="u-text-muted u-mt-2 u-mb-6">Weekly dispatches from the cosmos — deep sky objects, new research, and what to observe this month.</p>
        ${state.status === 'success'
          ? `<div class="u-flex u-items-center u-justify-center u-gap-2">
               ${iconCheckCircle({ size: 20 })}
               <span>You're subscribed. Clear skies ahead.</span>
             </div>`
          : `<form data-action="subscribe" aria-label="Newsletter signup" novalidate>
               <div class="u-flex u-gap-3 u-flex-wrap u-justify-center u-items-end">
                 ${input({ label: 'Email address', name: 'email', type: 'email', placeholder: 'your@email.com', required: true })}
                 ${button({
                   label: state.status === 'loading' ? 'Subscribing\u2026' : 'Subscribe',
                   type:  'submit',
                   attrs: state.status === 'loading' ? { 'aria-busy': 'true', disabled: '' } : {},
                 })}
               </div>
             </form>`
        }
      </div>
    `,
  }),
})

// ── Footer ────────────────────────────────────────────────────────────────────

const pageFooter = footer({
  logo:     `${iconTelescope({ size: 18 })}<span class="u-font-bold" style="letter-spacing:-0.02em">Observatory</span>`,
  logoHref: '/',
  links: [
    { label: 'About',   href: '#' },
    { label: 'Archive', href: '#' },
    { label: 'Topics',  href: '#' },
    { label: 'Privacy', href: '#' },
    { label: 'RSS',     href: '#' },
  ],
  legal: `\u00a9 ${new Date().getFullYear()} Observatory. All rights reserved.`,
})

// ── Spec ─────────────────────────────────────────────────────────────────��────

export default {
  route: '/templates/blog-post',

  meta: {
    title:       'The Pillars of Creation \u2014 Observatory',
    description: 'Six trillion miles tall and sculpted by the light of newborn stars \u2014 the Eagle Nebula\'s Pillars of Creation remain one of the most studied and photographed objects in the cosmos.',
    styles:      ['/pulse-ui.css', '/themes/observatory.css'],
  },

  state: {
    status: 'idle',
  },

  actions: {
    subscribe: {
      onStart: (state) => ({ status: 'loading' }),
      run: async (state, serverState, formData) => {
        const email = formData.get('email')
        if (!email) throw new Error('Email address is required')
        // Replace with your email API call
        await new Promise(r => setTimeout(r, 600))
        return { email }
      },
      onSuccess: (state) => ({
        status: 'success',
        _toast: { message: 'Welcome to Observatory! Clear skies ahead.', variant: 'success' },
      }),
      onError: (state, err) => ({
        status: 'error',
        _toast: { message: err.message || 'Something went wrong. Please try again.', variant: 'error' },
      }),
    },
  },

  view: (state) => `
    <a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:1rem;z-index:9999;padding:0.5rem 1rem;background:var(--ui-accent);color:var(--ui-accent-text);border-radius:0.25rem;text-decoration:none">Skip to main content</a>
    <div class="obs-reading-progress" aria-hidden="true"><div class="obs-reading-progress-bar"></div></div>
    ${pageNav}
    <main id="main-content">
      ${articleHero}
      ${section({ content: container({ content: `<div class="obs-article">${prose({ content: articleBody })}${articleAside}</div>` }) })}
      ${newsletterSection(state)}
    </main>
    ${pageFooter}
    <script src="${asset('/pulse-ui.js')}" defer></script>`,
}
