/**
 * Pulse Docs — Templates
 *
 * Showcase of ready-made Pulse templates.
 */

import { renderLayout, h1, lead, section } from '../lib/layout.js'
import { prevNext }                        from '../lib/nav.js'
import { badge }                           from '../../../src/ui/index.js'

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function statPill(label, value) {
  return `<span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.72rem;font-weight:500;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55)">
    <span style="color:#7c3aed">●</span> ${esc(label)}: <strong style="color:rgba(255,255,255,0.85);font-weight:600">${esc(String(value))}</strong>
  </span>`
}

function templateCard({ name, route, description, tags = [], stats = {}, preview = '' }) {
  const tagHtml = tags.map(t =>
    `<span style="display:inline-block;padding:0.2rem 0.6rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:4px;font-size:0.72rem;font-weight:500;color:rgba(255,255,255,0.55)">${esc(t)}</span>`
  ).join('')

  const statHtml = Object.entries(stats).map(([k, v]) => statPill(k, v)).join('')

  return `
    <div style="border:1px solid rgba(255,255,255,0.1);border-radius:0.875rem;overflow:hidden;display:flex;flex-direction:column;background:rgba(255,255,255,0.03)">

      <a href="${esc(route)}" aria-label="Open ${esc(name)} template" style="display:block;background:#0d0d12;border-bottom:1px solid rgba(255,255,255,0.08);text-decoration:none;overflow:hidden">
        <div style="padding:0.5rem 0.75rem;background:#16161e;display:flex;align-items:center;gap:0.375rem;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="width:8px;height:8px;border-radius:50%;background:#ff5f57;display:inline-block"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:#febc2e;display:inline-block"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:#28c840;display:inline-block"></span>
          <span style="flex:1;height:14px;background:rgba(255,255,255,0.06);border-radius:3px;margin-left:0.5rem"></span>
        </div>
        <div style="padding:1rem 1.25rem 1.25rem;min-height:180px">
          ${preview}
        </div>
      </a>

      <div style="padding:1.25rem 1.25rem 1rem;flex:1;display:flex;flex-direction:column;gap:0.875rem">
        <div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
            <h2 style="margin:0;font-size:1rem;font-weight:700;line-height:1.3">${esc(name)}</h2>
            ${tagHtml}
          </div>
          <p style="margin:0;font-size:0.85rem;line-height:1.6;opacity:0.65">${esc(description)}</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;padding-top:0.625rem;border-top:1px solid rgba(255,255,255,0.08)">${statHtml}</div>
      </div>

      <div style="padding:0.875rem 1.25rem;border-top:1px solid rgba(255,255,255,0.08)">
        <a href="${esc(route)}" style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1.1rem;background:#7c3aed;border-radius:0.4rem;font-size:0.85rem;font-weight:600;text-decoration:none !important;color:#fff !important">
          View template
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>`
}

// Mini CSS page-layout previews ────────────────────────────────────────────────

const bar  = (w, h, bg = 'rgba(255,255,255,0.12)', r = 3) =>
  `<div style="width:${w};height:${h}px;background:${bg};border-radius:${r}px;flex-shrink:0"></div>`

const mobileAppPreview = `
  <div style="display:flex;flex-direction:column;gap:6px;font-size:0">

    <!-- nav -->
    <div style="display:flex;align-items:center;gap:6px">
      ${bar('28px', 6, 'var(--color-accent)')}
      ${bar('40px', 4)}  ${bar('30px', 4)}  ${bar('30px', 4)}
      <div style="flex:1"></div>
      ${bar('48px', 18, 'var(--color-accent)', 4)}
    </div>

    <!-- hero -->
    <div style="display:flex;gap:10px;margin-top:4px;align-items:center">
      <div style="flex:1;display:flex;flex-direction:column;gap:5px">
        ${bar('50px', 3, 'var(--color-accent)')}
        ${bar('100%', 10, 'rgba(255,255,255,0.18)', 2)}
        ${bar('85%',  10, 'rgba(255,255,255,0.18)', 2)}
        ${bar('70%',   6, 'rgba(255,255,255,0.08)', 2)}
        <div style="display:flex;gap:5px;margin-top:4px">
          ${bar('52px', 16, 'rgba(255,255,255,0.15)', 4)}
          ${bar('52px', 16, 'rgba(255,255,255,0.15)', 4)}
        </div>
      </div>
      <div style="width:52px;height:90px;background:rgba(255,255,255,0.08);border-radius:8px;border:1px solid rgba(255,255,255,0.12);flex-shrink:0;display:flex;flex-direction:column;gap:4px;padding:6px">
        ${bar('100%', 20, 'var(--color-accent)', 4)}
        ${bar('100%', 12, 'rgba(255,255,255,0.1)', 3)}
        ${bar('100%', 12, 'rgba(255,255,255,0.1)', 3)}
      </div>
    </div>

    <!-- stats row -->
    <div style="display:flex;gap:5px;margin-top:2px">
      ${[1,2,3,4].map(() => `<div style="flex:1;height:22px;background:rgba(255,255,255,0.06);border-radius:3px"></div>`).join('')}
    </div>

    <!-- features grid -->
    <div style="display:flex;gap:5px">
      ${[1,2,3].map(() => `<div style="flex:1;height:36px;background:rgba(255,255,255,0.05);border-radius:3px;padding:5px;display:flex;flex-direction:column;gap:3px">${bar('40%',4,'var(--color-accent)')}${bar('80%',3)}${bar('90%',3)}</div>`).join('')}
    </div>

    <!-- pricing row -->
    <div style="display:flex;gap:5px">
      ${[1,2,3].map((i) => `<div style="flex:1;height:42px;background:${i===2?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.05)'};border-radius:3px;border:${i===2?'1px solid rgba(139,92,246,0.5)':'1px solid transparent'};padding:5px;display:flex;flex-direction:column;gap:3px">${bar('60%',4,i===2?'var(--color-accent)':'rgba(255,255,255,0.15)')}${bar('40%',6,i===2?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)')}${bar('80%',3)}</div>`).join('')}
    </div>
  </div>`

const TEMPLATES = [
  {
    name:        'Mobile App Landing Page',
    route:       '/templates/mobile-app',
    description: 'A complete marketing site for a mobile app — nav, hero with phone mockup, feature grid, social proof stats, testimonials, pricing cards, FAQ accordion, download CTA, and footer.',
    tags:        ['Landing Page', 'Marketing'],
    preview:     mobileAppPreview,
    stats: {
      'Accessibility': '100',
      'Best Practices': '100',
      'SEO':           '100',
      'CLS':           '0.00',
      'JS':            '~4.2 kB',
    },
  },
]

const content = `
  ${h1('Templates')}
  ${lead('Production-ready Pulse templates built entirely from the <a href="/components">UI component library</a>. Every template ships with 100/100/100 Lighthouse scores (Accessibility, Best Practices, SEO) and zero CLS.')}

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem;margin-top:2rem">
    ${TEMPLATES.map(templateCard).join('')}
  </div>

  ${section('adding', 'Suggesting a template')}
  <p>Have an idea for a template? <a href="https://github.com/invisibleloop/pulse-framework/issues" target="_blank" rel="noopener noreferrer">Open an issue on GitHub</a> with the layout you have in mind and we'll consider adding it to the library.</p>
`

export default {
  route: '/templates',

  meta: {
    title:       'Templates — Pulse',
    description: 'Production-ready Pulse templates. Every template uses only Pulse UI components and ships with 100/100/100 Lighthouse scores.',
    styles:      ['/pulse-ui.css', '/docs.css'],
  },

  view: () => {
    const { prev, next } = prevNext('/templates')
    return renderLayout({ currentHref: '/templates', content, prev, next })
  },
}
