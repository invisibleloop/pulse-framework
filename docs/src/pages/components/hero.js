import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { hero, appBadge } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/hero')

export default {
  route: '/components/hero',
  meta: {
    theme:       'light',
    title: 'Hero — Pulse Docs',
    description: 'Hero component for Pulse UI.',
    styles: ['/pulse-ui.css', '/theme.css', '/docs.css'],
  },
  state: {},
  view: () => {
    const placeholderImg = `<img src="/img/heic1501a.jpg" alt="The Pillars of Creation in the Eagle Nebula, captured by the Hubble Space Telescope" style="width:100%;height:100%;object-fit:cover;border-radius:var(--ui-radius,8px);display:block">`
    return renderComponentPage({
    currentHref: '/components/hero',
    prev,
    next,
    name: 'hero',
    description: 'Full-width hero section. Pass <code>image</code> HTML to activate the split layout — text on one side, image on the other. Use <code>imageAlign</code> to swap sides. Set <code>align: \'left\'</code> for left-aligned text without an image. Use <code>size: \'sm\'</code> for inner-page headers.',
    content: `
      ${demo(
        hero({
          eyebrow:  'Now available',
          title:    'The app your phone deserves',
          subtitle: 'Beautifully simple. Ridiculously fast. Available on iOS and Android.',
          actions:  appBadge({ store: 'apple', href: '#' }) + ' ' + appBadge({ store: 'google', href: '#' }),
        }),
        `hero({
  eyebrow:  'Now available',
  title:    'The app your phone deserves',
  subtitle: 'Beautifully simple. Ridiculously fast.',
  actions:  appBadge({ store: 'apple',  href: appStoreUrl }) +
            appBadge({ store: 'google', href: playStoreUrl }),
})`,
        { bleed: true }
      )}

      ${demo(
        hero({
          eyebrow:  'Split layout',
          title:    'Text left, image right',
          subtitle: 'Pass an image slot to activate the split layout. The text sits on the left, image on the right.',
          actions:  appBadge({ store: 'apple', href: '#' }) + ' ' + appBadge({ store: 'google', href: '#' }),
          image:    placeholderImg,
        }),
        `hero({
  eyebrow:  'Split layout',
  title:    'Text left, image right',
  subtitle: 'Pass an image slot to activate the split layout.',
  actions:  appBadge({ store: 'apple',  href: appStoreUrl }) +
            appBadge({ store: 'google', href: playStoreUrl }),
  image:    \`<img src="\${screenshotUrl}" alt="Product screenshot">\`,
})`,
        { bleed: true }
      )}

      ${demo(
        hero({
          eyebrow:    'Split layout',
          title:      'Image left, text right',
          subtitle:   'Set imageAlign: \'left\' to put the image on the left and text on the right.',
          image:      placeholderImg,
          imageAlign: 'left',
        }),
        `hero({
  eyebrow:    'Split layout',
  title:      'Image left, text right',
  subtitle:   'Set imageAlign to swap sides.',
  image:      \`<img src="\${screenshotUrl}" alt="Product screenshot">\`,
  imageAlign: 'left',
})`,
        { bleed: true }
      )}

      ${demo(
        `<div style="display:flex;flex-direction:column;gap:0">` +
          hero({ eyebrow: 'Solid colour', title: 'background: color', background: '#0f172a', size: 'sm' }) +
          hero({ eyebrow: 'Custom gradient', title: 'background: CSS gradient', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', size: 'sm' }) +
        `</div>`,
        `// Any valid CSS background value
hero({ title: 'Headline', background: '#0f172a' })
hero({ title: 'Headline', background: 'linear-gradient(135deg, #1e1b4b, #312e81)' })`,
        { bleed: true }
      )}

      ${demo(
        hero({
          title:    'Blog',
          subtitle: 'Thoughts on building for the web.',
          size:     'sm',
        }),
        `hero({
  title:    'Blog',
  subtitle: 'Thoughts on building for the web.',
  size:     'sm',
})`,
        { bleed: true }
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>eyebrow</code>',     'string',        '—',          'Small label above the title'],
          ['<code>title</code>',       'string',        '—',          ''],
          ['<code>subtitle</code>',    'string',        '—',          ''],
          ['<code>actions</code>',     'string (HTML)', '—',          'Raw HTML slot — buttons, badges, etc.'],
          ['<code>image</code>',       'string (HTML)', '—',          'Raw HTML slot — activates split layout when set'],
          ['<code>layout</code>',      'string',        "'split'",    "When <code>image</code> is set: <code>'split'</code> (even columns) · <code>'asymmetric'</code> (wider text, narrower image) · <code>'overlap'</code> (image overlaps below text)"],
          ['<code>imageAlign</code>',  'string',        "'right'",    "'right' (text left) or 'left' (text right) — only applies when image is set"],
          ['<code>align</code>',       'string',        "'center'",   "'center' or 'left' — text alignment when no image"],
          ['<code>size</code>',        'string',        "'md'",       "'md' (5rem padding) or 'sm' (2.5rem top, no bottom) — use sm for inner-page headers"],
          ['<code>background</code>', 'string',        '—',          'Any CSS background value — solid colour or custom gradient.'],
        ]
      )}
    `,
  })
  },
}
