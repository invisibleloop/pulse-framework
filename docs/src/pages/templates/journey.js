/**
 * Pulse — Journey example
 *
 * Demonstrates:
 *   - Mode B creative override — raw HTML throughout, no structural components
 *   - Split-screen layout: sticky hero left / scrollable timeline right (100svh grid)
 *   - appBadge component from @invisibleloop/pulse/ui
 *   - Deep-night palette (#0A0A0F) with gold (#C9A96E) accent
 *   - Alternating left/right timeline cards with centred thread + connector dots
 *   - calc(50% - var(--ui-space-8)) pattern for half-width timeline cards
 *   - Sticky positioned timeline column with overflow-y: auto + scrollbar-width: none
 *   - Frosted glass nav: rgba translucency + backdrop-filter blur
 *   - Skip link, visually-hidden headings, section aria-labelledby — full a11y
 *   - Mobile responsive: stacks vertically, thread moves left, full-width cards
 *   - iconTag, iconPlus, iconSend, iconArrowDown, iconFeather from icons.js
 *   - picsum.photos/id/* for stable prototype images
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/journey
 */

import { appBadge } from '../../../../src/ui/index.js'
import { iconTag, iconPlus, iconSend, iconArrowDown, iconFeather } from '../../../../src/ui/icons.js'

// ---------------------------------------------------------------------------
// Timeline data
// ---------------------------------------------------------------------------

const timelineEvents = [
  {
    year:  '2019',
    title: 'First Day in the City',
    body:  'Packed everything into one suitcase. The apartment was smaller than expected. The feeling was not.',
    tag:   'Milestone',
    image: { src: '/images/journey/29.jpg', alt: 'City street view' },
  },
  {
    year:  '2020',
    title: 'Learning to Stay Still',
    body:  'The world paused. Finished three books. Started painting. Discovered what quiet actually sounds like.',
    tag:   'Reflection',
  },
  {
    year:  '2021',
    title: 'The Road Trip',
    body:  '4,200 miles across eleven states. Every diner looks the same after midnight. Every sunrise does not.',
    tag:   'Adventure',
    image: { src: '/images/journey/178.jpg', alt: 'Open road through a landscape' },
  },
  {
    year:  '2022',
    title: 'Said Yes',
    body:  'On a Tuesday. In the kitchen. No ring yet, just the question and the answer and the rest of our lives.',
    tag:   'Love',
  },
  {
    year:  '2024',
    title: 'This Is Home Now',
    body:  'The boxes are gone. The walls have pictures. The cat has a name. The journey continues.',
    tag:   'Present',
  },
]

// ---------------------------------------------------------------------------
// Timeline card helper
// ---------------------------------------------------------------------------

const tlCard = ({ year, title, body, tag, image }) => `
  <div class="j-tl-card${image ? ' j-tl-card--image' : ''}">
    ${image ? `<img class="j-tl-image" src="${image.src}" alt="${image.alt}" width="600" height="340" loading="lazy" decoding="async">` : ''}
    <div class="j-tl-content">
      <p class="j-tl-year">${year}</p>
      <h3 class="j-tl-title">${title}</h3>
      <p class="j-tl-body">${body}</p>
      <span class="j-tl-tag">${iconTag({ size: 10 })}${tag}</span>
    </div>
  </div>
`

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/templates/journey',

  meta: {
    title:       'Journey \u2014 Your story, in order',
    description: 'Plot your life\u2019s journey. Map events, milestones, and memories on a beautiful timeline.',
    styles:      ['/pulse-ui.css', '/journey.css'],
    theme:       'dark',
  },

  view: () => `
    <a href="#main-content" class="j-skip-link">Skip to main content</a>

    <header role="banner">
      <nav class="j-nav" aria-label="Site navigation">
        <a href="/journey" class="j-nav-wordmark" aria-label="Journey \u2014 home">Journey</a>
        ${appBadge({ store: 'apple', href: '#download' })}
      </nav>
    </header>

    <main id="main-content">

      <!-- Hero + Timeline split -->
      <div class="j-hero-split">

        <!-- Hero -->
        <section class="j-hero" aria-labelledby="journey-hero-title">
          <p class="j-hero-eyebrow" aria-hidden="true">Your story \u00b7 In order</p>
          <h1 class="j-hero-title" id="journey-hero-title">
            Every<br>moment<br><em>matters.</em>
          </h1>
          <p class="j-hero-sub">
            Journey is a beautiful timeline for your life. Plot events, mark milestones,
            and explore the story only you can tell.
          </p>
          <div class="j-hero-cta">
            <a href="#download" class="j-btn-primary">
              Download free
            </a>
            <a href="#journey-timeline" class="j-btn-ghost">
              See how it works ${iconArrowDown({ size: 14 })}
            </a>
          </div>
          <div class="j-hero-scroll" aria-hidden="true">
            <span class="j-hero-line"></span>
            <span>Scroll to explore</span>
          </div>
        </section>

        <!-- Timeline demo -->
        <section class="j-timeline-section" id="journey-timeline" aria-labelledby="journey-timeline-heading">
          <p class="j-section-label" aria-hidden="true">01 \u2014 Your timeline</p>
          <h2 class="j-visually-hidden" id="journey-timeline-heading">Example journey timeline</h2>
          <div class="j-timeline" role="list">
            ${timelineEvents.map(ev => `
              <div class="j-tl-item" role="listitem">
                ${tlCard(ev)}
              </div>
            `).join('')}
          </div>
        </section>

      </div><!-- end j-hero-split -->

      <!-- Features -->
      <section class="j-features" aria-labelledby="journey-features-heading">
        <h2 class="j-visually-hidden" id="journey-features-heading">Features</h2>
        <div>
          <p class="j-feature-label">${iconPlus({ size: 12 })}Plot your path</p>
          <p class="j-feature-body">Add any event \u2014 big or small \u2014 and watch your story take shape along a living timeline.</p>
        </div>
        <div>
          <p class="j-feature-label">${iconTag({ size: 12 })}Tag &amp; explore</p>
          <p class="j-feature-body">Organise moments by theme, mood, or chapter. Filter your timeline to find any memory instantly.</p>
        </div>
        <div>
          <p class="j-feature-label">${iconSend({ size: 12 })}Share your journey</p>
          <p class="j-feature-body">Export a beautiful visual timeline to share with the people who made it worth living.</p>
        </div>
      </section>

      <!-- CTA / Download -->
      <section class="j-cta" id="download" aria-labelledby="journey-cta-heading">
        <p class="j-cta-eyebrow">Available now \u00b7 iOS</p>
        <h2 class="j-cta-title" id="journey-cta-heading">
          Begin your<br><em>journey</em> today.
        </h2>
        <div class="j-cta-badges">
          ${appBadge({ store: 'apple', href: '#' })}
        </div>
      </section>

    </main>

    <footer class="j-footer" role="contentinfo">
      <span class="j-footer-word">${iconFeather({ size: 12 })} Journey &copy; 2025</span>
      <nav class="j-footer-links" aria-label="Footer navigation">
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#contact">Contact</a>
      </nav>
    </footer>
  `,
}
