import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { phoneFrame } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/phone-frame')

const sampleScreen = `
  <div style="background:#1a2c24;height:100%;padding:0.75rem;display:flex;flex-direction:column;gap:0.625rem;font-family:system-ui,sans-serif;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0.25rem;font-size:0.6rem;color:rgba(255,255,255,0.5)">
      <span>9:41</span>
      <svg width="20" height="8" viewBox="0 0 20 8" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="16" height="7" rx="2" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><rect x="1.5" y="1.5" width="12" height="5" rx="1" fill="rgba(255,255,255,0.7)"/><path d="M18 3v2c.8-.3.8-1.7 0-2z" fill="rgba(255,255,255,0.6)"/></svg>
    </div>
    <div style="font-size:0.85rem;font-weight:700;color:#fff">Good morning, Sarah</div>
    <div style="background:rgba(255,255,255,0.06);border-radius:0.625rem;padding:0.625rem;flex:1">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);margin-bottom:0.3rem">TODAY'S ENTRY</div>
      <div style="font-size:0.72rem;color:rgba(255,255,255,0.85);line-height:1.5">Feeling grateful today. The early morning light…</div>
    </div>
  </div>`

export default {
  route: '/components/phone-frame',
  meta: {
    title: 'Phone Frame — Pulse Docs',
    description: 'Phone Frame component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/phone-frame',
    prev,
    next,
    name: 'phoneFrame',
    description: 'A realistic CSS mobile phone frame — device chrome, dynamic island, side buttons, and home indicator. Pass arbitrary HTML into the <code>content</code> slot to fill the screen area. No images, pure CSS/HTML.',
    content: `
      ${demo(
        phoneFrame({ content: sampleScreen }),
        `phoneFrame({
  content: \`<div style="background:#1a2c24;height:100%;padding:0.75rem;">
    <!-- your app screen UI -->
  </div>\`,
})`,
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>', 'string (HTML)', "''",  'HTML rendered inside the screen area'],
          ['<code>class</code>',   'string',        "''",  'Extra CSS classes on the root element'],
        ]
      )}
    `,
  }),
}
