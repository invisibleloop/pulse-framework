import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table, callout } from '../../lib/layout.js'
import { decorate } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/decorate')

const swatch = (pattern, label) => `
  <div style="position:relative;width:200px;height:120px;border-radius:var(--ui-radius);border:1px solid var(--ui-border);overflow:hidden;display:flex;align-items:center;justify-content:center">
    ${decorate({ pattern })}
    <span style="position:relative;z-index:1;font-weight:600;font-size:.875rem">${label}</span>
  </div>`

export default {
  route: '/components/decorate',
  meta: {
    title: 'Decorate — Pulse Docs',
    description: 'Inline SVG background pattern overlay for adding subtle texture to sections in Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderComponentPage({
    currentHref: '/components/decorate',
    prev,
    next,
    name: 'decorate',
    description: 'Inline SVG background pattern. Drop it inside any container with <code>position: relative</code> to add subtle texture without external assets. Five patterns: dots, grid, lines, zigzag, cross. Zero JavaScript — pure inline SVG.',
    content: `
      <h2 class="doc-h2" id="patterns">Patterns</h2>
      <p>Five built-in patterns. The SVG fills the parent completely with <code>position: absolute; inset: 0</code>.</p>
      ${demo(
        `<div style="display:flex;flex-wrap:wrap;gap:1rem">` +
          swatch('dots',   'dots') +
          swatch('grid',   'grid') +
          swatch('lines',  'lines') +
          swatch('zigzag', 'zigzag') +
          swatch('cross',  'cross') +
        `</div>`,
        `// Parent must have position: relative
<div style="position:relative">
  ${`${decorate({ pattern: 'dots' })}`}
  <p>Your content sits on top</p>
</div>`
      )}

      <h2 class="doc-h2" id="color">Color and opacity</h2>
      <p>The default color is <code>var(--ui-border)</code> — it fits both light and dark themes. Override with any CSS value. Control density with <code>opacity</code>.</p>
      ${demo(
        `<div style="display:flex;flex-wrap:wrap;gap:1rem">` +
          `<div style="position:relative;width:200px;height:120px;border-radius:var(--ui-radius);overflow:hidden;background:var(--ui-accent);display:flex;align-items:center;justify-content:center">` +
            decorate({ pattern: 'dots', color: '#fff', opacity: 0.3 }) +
            `<span style="position:relative;z-index:1;color:#fff;font-weight:600">opacity: 0.3</span>` +
          `</div>` +
          `<div style="position:relative;width:200px;height:120px;border-radius:var(--ui-radius);overflow:hidden;background:var(--ui-surface-raised);display:flex;align-items:center;justify-content:center">` +
            decorate({ pattern: 'grid', opacity: 0.6 }) +
            `<span style="position:relative;z-index:1;font-weight:600">opacity: 0.6</span>` +
          `</div>` +
        `</div>`,
        `decorate({ pattern: 'dots', color: '#fff', opacity: 0.3 })`
      )}

      ${callout('note', 'The <code>decorate</code> element is <code>aria-hidden="true"</code> — it is purely decorative. Make sure surrounding content has sufficient contrast without relying on the pattern.')}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>pattern</code>', 'string', "'dots'",              "'dots' · 'grid' · 'lines' · 'zigzag' · 'cross'"],
          ['<code>color</code>',   'string', "'var(--ui-border)'",  'Any CSS color value — <code>var()</code> tokens and hex are both accepted'],
          ['<code>opacity</code>', 'number', '0.4',                 'SVG opacity — 0 (invisible) to 1 (solid)'],
          ['<code>size</code>',    'number', '20',                  'Pattern tile size in pixels — smaller values = denser pattern'],
        ]
      )}
    `,
  }),
}
