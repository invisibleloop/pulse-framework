import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { button, card, badge, grid } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/card')

export default {
  route: '/components/card',
  meta: {
    title: 'Card — Pulse Docs',
    description: 'Card component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/card',
    prev,
    next,
    name: 'card',
    description: '<code>content</code> and <code>footer</code> are raw HTML slots — they pass through as-is. Wrap user-supplied values in <code>escHtml()</code> before composing them into the string.',
    content: `
      ${demo(
        card({
          title:   'Recent activity',
          content: '<p class="u-text-muted u-text-sm" style="margin:0">No activity in the last 7 days.</p>',
          footer:  button({ label: 'View all', href: '#', variant: 'ghost', size: 'sm' }),
        }),
        `card({
  title:   'Recent activity',
  content: \`<p class="u-text-muted u-text-sm">No activity in the last 7 days.</p>\`,
  footer:  button({ label: 'View all', href: '/activity', variant: 'ghost', size: 'sm' }),
})`
      )}

      <h2 class="doc-h2" id="image">With image</h2>
      <p>Use <code>flush</code> to remove body padding, then add an image at the top and restore padding on the text content below it.</p>

      ${demo(
        card({
          flush:   true,
          content: `
            <div class="u-rounded-md u-overflow-hidden" style="height:180px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:3rem">🌄</span>
            </div>
            <div class="u-p-5">
              <p class="u-font-semibold u-mb-2" style="margin-top:0">Mountain retreat</p>
              <p class="u-text-muted u-text-sm" style="margin:0">A peaceful escape in the highlands. Three nights, all-inclusive.</p>
            </div>
          `,
          footer: button({ label: 'Book now', href: '#', variant: 'primary', size: 'sm' }),
        }),
        `card({
  flush: true,
  content: \`
    <div class="u-rounded-md u-overflow-hidden" style="height:180px;background:...">
      <img src="/img/retreat.jpg" alt="Mountain retreat" style="width:100%;height:100%;object-fit:cover">
    </div>
    <div class="u-p-5">
      <p class="u-font-semibold u-mb-2">Mountain retreat</p>
      <p class="u-text-muted u-text-sm">A peaceful escape in the highlands.</p>
    </div>
  \`,
  footer: button({ label: 'Book now', href: '/book', variant: 'primary', size: 'sm' }),
})`
      )}

      <h2 class="doc-h2" id="badges">With badges</h2>
      <p>Compose <code>badge()</code> inside <code>content</code> to show status labels or category tags.</p>

      ${demo(
        card({
          title:   'API rate limits',
          content: `
            <div class="u-flex u-gap-2 u-mb-4">
              ${badge({ label: 'Production', variant: 'success' })}
              ${badge({ label: 'v2.1', variant: 'info' })}
            </div>
            <p class="u-text-muted u-text-sm" style="margin:0">Requests are capped at 1,000/min per API key. Contact support to increase your limit.</p>
          `,
          footer: `
            <div class="u-flex u-gap-2">
              ${button({ label: 'View docs', href: '#', variant: 'ghost', size: 'sm' })}
              ${button({ label: 'Request increase', href: '#', variant: 'secondary', size: 'sm' })}
            </div>
          `,
        }),
        `card({
  title:   'API rate limits',
  content: \`
    <div class="u-flex u-gap-2 u-mb-4">
      \${badge({ label: 'Production', variant: 'success' })}
      \${badge({ label: 'v2.1',       variant: 'info' })}
    </div>
    <p class="u-text-muted u-text-sm">Requests are capped at 1,000/min per API key.</p>
  \`,
  footer: \`
    \${button({ label: 'View docs',        href: '/docs',    variant: 'ghost',     size: 'sm' })}
    \${button({ label: 'Request increase', href: '/contact', variant: 'secondary', size: 'sm' })}
  \`,
})`
      )}

      <h2 class="doc-h2" id="metadata">With metadata row</h2>
      <p>A flex row inside <code>content</code> works well for author, date, read-time and similar metadata.</p>

      ${demo(
        card({
          title:   'Building with Pulse',
          content: `
            <p class="u-text-muted u-text-sm u-mb-4">Learn how to scaffold a new project and ship your first spec-driven page in under ten minutes.</p>
            <div class="u-flex u-gap-3" style="align-items:center;flex-wrap:wrap">
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);flex-shrink:0"></div>
              <span class="u-text-sm u-text-muted">Jane Smith</span>
              <span class="u-text-sm u-text-muted">·</span>
              <span class="u-text-sm u-text-muted">Mar 15, 2024</span>
              <span class="u-text-sm u-text-muted u-ml-auto">5 min read</span>
            </div>
          `,
          footer: button({ label: 'Read article →', href: '#', variant: 'ghost', size: 'sm' }),
        }),
        `card({
  title:   'Building with Pulse',
  content: \`
    <p class="u-text-muted u-text-sm u-mb-4">Learn how to scaffold a new project...</p>
    <div class="u-flex u-gap-3" style="align-items:center;flex-wrap:wrap">
      <img src="/img/avatar.jpg" class="u-rounded-full" style="width:28px;height:28px" alt="">
      <span class="u-text-sm u-text-muted">Jane Smith</span>
      <span class="u-text-sm u-text-muted">·</span>
      <span class="u-text-sm u-text-muted">Mar 15, 2024</span>
      <span class="u-text-sm u-text-muted u-ml-auto">5 min read</span>
    </div>
  \`,
  footer: button({ label: 'Read article →', href: '/blog/pulse', variant: 'ghost', size: 'sm' }),
})`
      )}

      <h2 class="doc-h2" id="stat">Stat / metric card</h2>
      <p>Cards without a title work well as simple metric tiles. Use <code>grid()</code> to lay multiple cards out side by side.</p>

      ${demo(
        grid({
          cols: 3,
          gap: 'sm',
          content: [
            card({ content: `<p class="u-text-muted u-text-sm u-mb-1" style="margin-top:0">Total revenue</p><p class="u-text-3xl u-font-bold" style="margin:0">£48,295</p><p class="u-text-sm u-text-green u-mb-0" style="margin-top:.25rem">↑ 12% this month</p>` }),
            card({ content: `<p class="u-text-muted u-text-sm u-mb-1" style="margin-top:0">Active users</p><p class="u-text-3xl u-font-bold" style="margin:0">3,842</p><p class="u-text-sm u-text-muted u-mb-0" style="margin-top:.25rem">Across all plans</p>` }),
            card({ content: `<p class="u-text-muted u-text-sm u-mb-1" style="margin-top:0">Churn rate</p><p class="u-text-3xl u-font-bold" style="margin:0">1.4%</p><p class="u-text-sm u-text-red u-mb-0" style="margin-top:.25rem">↑ 0.2% vs last month</p>` }),
          ].join(''),
        }),
        `grid({
  cols: 3,
  gap: 'sm',
  content: [
    card({
      content: \`
        <p class="u-text-muted u-text-sm u-mb-1">Total revenue</p>
        <p class="u-text-3xl u-font-bold">£48,295</p>
        <p class="u-text-sm u-text-green">↑ 12% this month</p>
      \`,
    }),
    card({ ... }),
    card({ ... }),
  ].join(''),
})`
      )}

      <h2 class="doc-h2" id="grid-inside">Grid inside a card</h2>
      <p>Components compose freely — pass a <code>grid()</code> into a card's <code>content</code> slot for structured layouts inside a surface.</p>

      ${demo(
        card({
          title: 'Plan comparison',
          content: grid({
            cols: 3,
            gap: 'sm',
            content: [
              `<div class="u-text-center u-p-2">
                <p class="u-font-semibold u-mb-1" style="margin-top:0">Starter</p>
                <p class="u-text-2xl u-font-bold u-mb-1" style="margin:0">£0</p>
                <p class="u-text-muted u-text-sm" style="margin:0">Up to 3 projects</p>
              </div>`,
              `<div class="u-text-center u-p-2" style="border-left:1px solid var(--ui-border);border-right:1px solid var(--ui-border)">
                <p class="u-font-semibold u-mb-1" style="margin-top:0;color:var(--ui-accent)">Pro</p>
                <p class="u-text-2xl u-font-bold u-mb-1" style="margin:0">£12</p>
                <p class="u-text-muted u-text-sm" style="margin:0">Unlimited projects</p>
              </div>`,
              `<div class="u-text-center u-p-2">
                <p class="u-font-semibold u-mb-1" style="margin-top:0">Enterprise</p>
                <p class="u-text-2xl u-font-bold u-mb-1" style="margin:0">Custom</p>
                <p class="u-text-muted u-text-sm" style="margin:0">SLA + support</p>
              </div>`,
            ].join(''),
          }),
          footer: button({ label: 'View full pricing', href: '#', variant: 'ghost', size: 'sm' }),
        }),
        `card({
  title:   'Plan comparison',
  content: grid({
    cols: 3,
    gap: 'sm',
    content: [
      \`<div class="u-text-center u-p-2">...</div>\`,
      \`<div class="u-text-center u-p-2">...</div>\`,
      \`<div class="u-text-center u-p-2">...</div>\`,
    ].join(''),
  }),
  footer: button({ label: 'View full pricing', href: '/pricing', variant: 'ghost', size: 'sm' }),
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>title</code>',   'string',  '—',     'Escaped automatically'],
          ['<code>level</code>',   'number',  '3',     'Heading tag for the title (1–6). Visual style is unchanged — use this to keep the document outline correct when the surrounding context already has an h2 or h3.'],
          ['<code>content</code>', 'string',  '—',     'HTML string — not escaped'],
          ['<code>footer</code>',  'string',  '—',     'HTML string — not escaped'],
          ['<code>flush</code>',   'boolean', 'false', 'Removes body padding — useful for full-bleed images or tables'],
          ['<code>class</code>',   'string',  '—',     ''],
        ]
      )}
    `,
  }),
}
