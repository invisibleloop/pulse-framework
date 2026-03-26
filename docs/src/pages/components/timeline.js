import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { timeline, timelineItem, badge, card, stat, button } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/timeline')

// Shared check SVG for reuse
const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
const starIcon  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
const alertIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`

export default {
  route: '/components/timeline',
  meta: {
    title: 'Timeline — Pulse Docs',
    description: 'Timeline component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/timeline',
    prev,
    next,
    name: 'timeline',
    description: 'Ordered sequence of events or steps connected by a line. Supports vertical (default) and horizontal orientations. Each item accepts a raw HTML content slot — pass any text, component, or markup.',
    content: `

      <h2 class="doc-h2" id="vertical">Vertical (default)</h2>
      <p>Steps flow downward. The connector line links each dot to the next.</p>
      ${demo(
        timeline({
          items: [
            { label: 'Jan 2023', content: '<strong style="color:var(--ui-text)">Project kicked off</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Initial scope agreed with stakeholders. Repository created.</p>' },
            { label: 'Mar 2023', content: '<strong style="color:var(--ui-text)">Alpha release</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Internal testing with 12 pilot users. Core features stable.</p>' },
            { label: 'Jun 2023', content: '<strong style="color:var(--ui-text)">Public beta</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Open sign-up enabled. 400 users in first week.</p>' },
            { label: 'Sep 2023', content: '<strong style="color:var(--ui-text)">v1.0 launched</strong><p style="color:var(--ui-muted);margin:.25rem 0 0">Billing live, docs published, ProductHunt launch.</p>' },
          ],
        }),
        `timeline({
  items: [
    { label: 'Jan 2023', content: '<strong>Project kicked off</strong><p>Initial scope agreed.</p>' },
    { label: 'Mar 2023', content: '<strong>Alpha release</strong><p>Internal testing with 12 pilot users.</p>' },
    { label: 'Jun 2023', content: '<strong>Public beta</strong><p>Open sign-up enabled. 400 users in first week.</p>' },
    { label: 'Sep 2023', content: '<strong>v1.0 launched</strong><p>Billing live, docs published.</p>' },
  ],
})`
      )}

      <h2 class="doc-h2" id="horizontal">Horizontal</h2>
      <p>Steps flow left to right — good for process flows or numbered stages.</p>
      ${demo(
        timeline({
          direction: 'horizontal',
          items: [
            { label: 'Step 1', content: '<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Sign up</p>' },
            { label: 'Step 2', content: '<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Connect data</p>' },
            { label: 'Step 3', content: '<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Invite team</p>' },
            { label: 'Step 4', content: '<p style="color:var(--ui-muted);margin:0;font-size:.85rem">Go live</p>' },
          ],
        }),
        `timeline({
  direction: 'horizontal',
  items: [
    { label: 'Step 1', content: '<p>Sign up</p>'      },
    { label: 'Step 2', content: '<p>Connect data</p>' },
    { label: 'Step 3', content: '<p>Invite team</p>'  },
    { label: 'Step 4', content: '<p>Go live</p>'      },
  ],
})`
      )}

      <h2 class="doc-h2" id="dot-colors">Dot colours</h2>
      <p>Use <code>dotColor</code> to convey status: <code>'accent'</code> · <code>'success'</code> · <code>'warning'</code> · <code>'error'</code> · <code>'muted'</code>.</p>
      ${demo(
        timeline({
          items: [
            { dotColor: 'success', label: 'Deployed',  content: '<p style="color:var(--ui-muted);margin:0">Production deploy completed successfully.</p>' },
            { dotColor: 'success', label: 'Tested',    content: '<p style="color:var(--ui-muted);margin:0">All 92 tests passed. Coverage 98%.</p>' },
            { dotColor: 'warning', label: 'Review',    content: '<p style="color:var(--ui-muted);margin:0">Awaiting sign-off from design lead.</p>' },
            { dotColor: 'error',   label: 'Blocked',   content: '<p style="color:var(--ui-muted);margin:0">Dependency on payment API not yet ready.</p>' },
            { dotColor: 'muted',   label: 'Planned',   content: '<p style="color:var(--ui-muted);margin:0">Mobile app release — Q1 2025.</p>' },
          ],
        }),
        `timeline({
  items: [
    { dotColor: 'success', label: 'Deployed', content: '...' },
    { dotColor: 'success', label: 'Tested',   content: '...' },
    { dotColor: 'warning', label: 'Review',   content: '...' },
    { dotColor: 'error',   label: 'Blocked',  content: '...' },
    { dotColor: 'muted',   label: 'Planned',  content: '...' },
  ],
})`
      )}

      <h2 class="doc-h2" id="icon-dots">Icon dots</h2>
      <p>Pass any SVG or emoji as <code>dot</code>. The dot grows to accommodate the content and uses a tinted background matching its colour variant.</p>
      ${demo(
        timeline({
          items: [
            { dot: checkIcon, dotColor: 'success', label: 'Completed', content: '<strong style="color:var(--ui-text)">Onboarding</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">Profile set up, preferences saved.</p>' },
            { dot: starIcon,  dotColor: 'accent',  label: 'Milestone', content: '<strong style="color:var(--ui-text)">First 1,000 users</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">Reached organically in 18 days.</p>' },
            { dot: alertIcon, dotColor: 'warning', label: 'Incident',  content: '<strong style="color:var(--ui-text)">Partial outage</strong><p style="color:var(--ui-muted);margin:.2rem 0 0">CDN edge node failed — resolved in 4 minutes.</p>' },
          ],
        }),
        `timeline({
  items: [
    {
      dot:      checkSvg,
      dotColor: 'success',
      label:    'Completed',
      content:  '<strong>Onboarding</strong><p>Profile set up, preferences saved.</p>',
    },
    {
      dot:      starSvg,
      dotColor: 'accent',
      label:    'Milestone',
      content:  '<strong>First 1,000 users</strong>',
    },
  ],
})`
      )}

      <h2 class="doc-h2" id="rich-content">Rich content slot</h2>
      <p>The <code>content</code> slot accepts any HTML — including other Pulse components like <code>card()</code>, <code>badge()</code>, or <code>stat()</code>.</p>
      ${demo(
        timeline({
          items: [
            {
              dotColor: 'success',
              label: 'Q1 2024',
              content: card({
                title: 'Series A closed',
                content: `<div style="display:flex;gap:1.5rem;flex-wrap:wrap">` +
                  stat({ label: 'Raised',    value: '$4.2M' }) +
                  stat({ label: 'Valuation', value: '$18M'  }) +
                  stat({ label: 'Investors', value: '6'     }) +
                `</div>`,
              }),
            },
            {
              dotColor: 'accent',
              label: 'Q3 2024',
              content: card({
                title: 'Product launch',
                content: `<p style="color:var(--ui-muted);margin:0 0 .75rem">Shipped v1.0 to general availability. Three tiers, 14-day trial.</p>` +
                  `<div style="display:flex;gap:.5rem;flex-wrap:wrap">` +
                  badge({ label: 'Launch', variant: 'info'    }) +
                  badge({ label: 'Billing live', variant: 'success' }) +
                  `</div>`,
              }),
            },
            {
              dotColor: 'muted',
              label: 'Q1 2025 (planned)',
              content: card({
                title: 'Mobile apps',
                content: `<p style="color:var(--ui-muted);margin:0 0 .75rem">iOS and Android apps in development. Public beta planned.</p>` +
                  button({ label: 'Join waitlist', size: 'sm', variant: 'secondary' }),
              }),
            },
          ],
        }),
        `timeline({
  items: [
    {
      dotColor: 'success',
      label:    'Q1 2024',
      content:  card({
        title:   'Series A closed',
        content: stat({ label: 'Raised', value: '$4.2M' }) + ...,
      }),
    },
    {
      dotColor: 'accent',
      label:    'Q3 2024',
      content:  card({
        title:   'Product launch',
        content: '<p>Shipped v1.0 to general availability.</p>' +
                 badge({ label: 'Billing live', variant: 'success' }),
      }),
    },
  ],
})`
      )}

      <h2 class="doc-h2" id="item-fn">Using timelineItem()</h2>
      <p>Build items individually with <code>timelineItem()</code> and pass the joined HTML as <code>content</code>. Useful for dynamic or conditional lists.</p>
      ${demo(
        timeline({
          content:
            timelineItem({ dotColor: 'success', label: 'Done',    content: '<p style="color:var(--ui-muted);margin:0">Design system tokens agreed</p>' }) +
            timelineItem({ dotColor: 'success', label: 'Done',    content: '<p style="color:var(--ui-muted);margin:0">Component library built</p>' }) +
            timelineItem({ dotColor: 'accent',  label: 'Current', content: '<p style="color:var(--ui-muted);margin:0">Documentation in progress</p>' }) +
            timelineItem({ dotColor: 'muted',   label: 'Next',    content: '<p style="color:var(--ui-muted);margin:0">Public launch</p>' }),
        }),
        `timeline({
  content:
    timelineItem({ dotColor: 'success', label: 'Done',    content: '...' }) +
    timelineItem({ dotColor: 'success', label: 'Done',    content: '...' }) +
    timelineItem({ dotColor: 'accent',  label: 'Current', content: '...' }) +
    timelineItem({ dotColor: 'muted',   label: 'Next',    content: '...' }),
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>direction</code>', 'string', "'vertical'", "'vertical' · 'horizontal'"],
          ['<code>items</code>',     'array',  '[]',         'Array of <code>timelineItem</code> option objects'],
          ['<code>content</code>',   'string (HTML)', '—',   'Raw HTML alternative to <code>items</code> — use with <code>timelineItem()</code>'],
        ]
      )}

      <h3 class="doc-h3" style="margin-top:2rem">timelineItem() props</h3>
      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>',  'string (HTML)', '—',        'Raw HTML body — accepts any component output'],
          ['<code>label</code>',    'string',        '—',        'Timestamp or step label (escaped)'],
          ['<code>dot</code>',      'string (HTML)', '—',        'Raw HTML inside the dot — SVG or emoji; grows the dot to 2rem'],
          ['<code>dotColor</code>', 'string',        "'accent'", "'accent' · 'success' · 'warning' · 'error' · 'muted'"],
        ]
      )}
    `,
  }),
}
