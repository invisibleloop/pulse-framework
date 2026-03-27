import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { hero, appBadge } from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/hero')

export default {
  route: '/components/hero',
  meta: {
    title: 'Hero — Pulse Docs',
    description: 'Hero component for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => {
    const placeholderImg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" style="width:100%;height:auto;border-radius:var(--ui-radius,8px);display:block" role="img" aria-label="Placeholder image">
  <rect width="600" height="400" fill="#111116" rx="8"/>
  <rect x="24" y="24" width="552" height="32" rx="6" fill="#1a1a22"/>
  <circle cx="44" cy="40" r="6" fill="#ff5f57"/><circle cx="64" cy="40" r="6" fill="#febc2e"/><circle cx="84" cy="40" r="6" fill="#28c840"/>
  <rect x="24" y="72" width="552" height="200" rx="6" fill="#1a1a22"/>
  <rect x="40" y="92" width="200" height="12" rx="3" fill="#2a2a35"/>
  <rect x="40" y="116" width="300" height="8" rx="3" fill="#222228"/>
  <rect x="40" y="132" width="260" height="8" rx="3" fill="#222228"/>
  <rect x="40" y="148" width="280" height="8" rx="3" fill="#222228"/>
  <rect x="40" y="176" width="120" height="32" rx="6" fill="#9b8dff" opacity=".9"/>
  <rect x="24" y="288" width="264" height="88" rx="6" fill="#1a1a22"/>
  <rect x="312" y="288" width="264" height="88" rx="6" fill="#1a1a22"/>
  <rect x="40" y="304" width="100" height="8" rx="3" fill="#2a2a35"/>
  <rect x="40" y="320" width="140" height="6" rx="3" fill="#222228"/>
  <rect x="328" y="304" width="100" height="8" rx="3" fill="#2a2a35"/>
  <rect x="328" y="320" width="120" height="6" rx="3" fill="#222228"/>
</svg>`
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
})`
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
})`
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
})`
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
})`
      )}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>eyebrow</code>',     'string',        '—',          'Small label above the title'],
          ['<code>title</code>',       'string',        '—',          ''],
          ['<code>subtitle</code>',    'string',        '—',          ''],
          ['<code>actions</code>',     'string (HTML)', '—',          'Raw HTML slot — buttons, badges, etc.'],
          ['<code>image</code>',       'string (HTML)', '—',          'Raw HTML slot — activates split layout when set'],
          ['<code>imageAlign</code>',  'string',        "'right'",    "'right' (text left) or 'left' (text right) — only applies when image is set"],
          ['<code>align</code>',       'string',        "'center'",   "'center' or 'left' — text alignment when no image"],
          ['<code>size</code>',        'string',        "'md'",       "'md' (5rem padding) or 'sm' (2.5rem top, no bottom) — use sm for inner-page headers"],
        ]
      )}
    `,
  })
  },
}
