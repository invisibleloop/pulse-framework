import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { phoneFrame } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/phone-frame')

const sampleScreen = `
  <div style="background:#1a2c24;min-height:520px;padding:0.75rem;display:flex;flex-direction:column;gap:0.75rem;font-family:system-ui,sans-serif;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0.25rem;font-size:0.6rem;color:rgba(255,255,255,0.5)">
      <span>9:41</span>
      <svg width="20" height="8" viewBox="0 0 20 8" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="16" height="7" rx="2" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><rect x="1.5" y="1.5" width="12" height="5" rx="1" fill="rgba(255,255,255,0.7)"/><path d="M18 3v2c.8-.3.8-1.7 0-2z" fill="rgba(255,255,255,0.6)"/></svg>
    </div>
    <div style="font-size:0.85rem;font-weight:700;color:#fff">Good morning, Sarah</div>
    <div style="background:rgba(255,255,255,0.06);border-radius:0.75rem;padding:0.75rem;flex:1;display:flex;flex-direction:column;gap:0.5rem">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);letter-spacing:0.04em">TODAY'S ENTRY</div>
      <div style="font-size:0.72rem;color:rgba(255,255,255,0.85);line-height:1.6">Feeling grateful today. The early morning light was something else — golden and soft through the curtains.</div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-radius:0.75rem;padding:0.75rem">
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);letter-spacing:0.04em;margin-bottom:0.4rem">STREAK</div>
      <div style="display:flex;gap:0.3rem">
        ${[1,2,3,4,5,6,7].map(d => `<div style="flex:1;height:28px;background:${d < 6 ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.08)'};border-radius:4px"></div>`).join('')}
      </div>
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);margin-top:0.4rem;text-align:right">5 day streak 🔥</div>
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
  content: \`<div style="background:#1a2c24;min-height:520px;padding:0.75rem;">
    <!-- your app screen UI -->
  </div>\`,
})`,
      )}

      <h2>Hover animation</h2>
      <p>Pass <code>animate: true</code> to enable a gentle 3-D tilt when the user hovers over the frame. Ideal for hero sections — hover the phone below to see it.</p>

      ${demo(
        phoneFrame({ content: sampleScreen, animate: true }),
        `phoneFrame({
  content: \`...\`,
  animate: true,
})`,
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>content</code>', 'string (HTML)', "''",    'HTML rendered inside the screen area'],
          ['<code>animate</code>', 'boolean',       'false', 'Enables a gentle 3-D tilt on mouse hover — recommended for hero usage'],
          ['<code>class</code>',   'string',        "''",    'Extra CSS classes on the root element'],
        ]
      )}
    `,
  }),
}
