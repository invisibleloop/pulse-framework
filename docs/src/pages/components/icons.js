import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import {
  button, feature,
  iconArrowLeft, iconArrowRight, iconArrowUp, iconArrowDown,
  iconChevronLeft, iconChevronRight, iconChevronUp, iconChevronDown,
  iconExternalLink, iconMenu, iconX, iconMoreHorizontal, iconMoreVertical,
  iconCheck, iconCheckCircle, iconXCircle, iconAlertCircle, iconAlertTriangle, iconInfo,
  iconPlus, iconMinus, iconEdit, iconTrash, iconCopy, iconSearch, iconFilter,
  iconDownload, iconUpload, iconRefresh, iconSend,
  iconEye, iconEyeOff, iconLock, iconUnlock, iconSettings, iconBell,
  iconUser, iconUsers, iconMail, iconMessageSquare,
  iconHome, iconLogOut, iconLogIn,
  iconFile, iconImage, iconLink, iconCode, iconCalendar, iconClock, iconBookmark, iconTag,
  iconPlay, iconPause, iconVolume, iconStar, iconHeart,
  iconPhone, iconGamepad,
  iconHandPointUp, iconHandPointDown, iconHandPointLeft, iconHandPointRight,
  iconGlobe, iconShield, iconZap, iconTrendingUp, iconTrendingDown, iconLoader, iconGrid, iconBug,
  iconMapPin,
  iconSun, iconMoon,
} from '../../../../src/ui/index.js'

const { prev, next } = prevNext('/components/icons')

// All icons grouped for the visual grid
const ICONS = [
  { group: 'Navigation & Direction', icons: [
    { name: 'iconArrowLeft',      fn: iconArrowLeft      },
    { name: 'iconArrowRight',     fn: iconArrowRight     },
    { name: 'iconArrowUp',        fn: iconArrowUp        },
    { name: 'iconArrowDown',      fn: iconArrowDown      },
    { name: 'iconChevronLeft',    fn: iconChevronLeft    },
    { name: 'iconChevronRight',   fn: iconChevronRight   },
    { name: 'iconChevronUp',      fn: iconChevronUp      },
    { name: 'iconChevronDown',    fn: iconChevronDown    },
    { name: 'iconExternalLink',   fn: iconExternalLink   },
    { name: 'iconMenu',           fn: iconMenu           },
    { name: 'iconX',              fn: iconX              },
    { name: 'iconMoreHorizontal', fn: iconMoreHorizontal },
    { name: 'iconMoreVertical',   fn: iconMoreVertical   },
  ]},
  { group: 'Status', icons: [
    { name: 'iconCheck',         fn: iconCheck         },
    { name: 'iconCheckCircle',   fn: iconCheckCircle   },
    { name: 'iconXCircle',       fn: iconXCircle       },
    { name: 'iconAlertCircle',   fn: iconAlertCircle   },
    { name: 'iconAlertTriangle', fn: iconAlertTriangle },
    { name: 'iconInfo',          fn: iconInfo          },
  ]},
  { group: 'Actions', icons: [
    { name: 'iconPlus',     fn: iconPlus     },
    { name: 'iconMinus',    fn: iconMinus    },
    { name: 'iconEdit',     fn: iconEdit     },
    { name: 'iconTrash',    fn: iconTrash    },
    { name: 'iconCopy',     fn: iconCopy     },
    { name: 'iconSearch',   fn: iconSearch   },
    { name: 'iconFilter',   fn: iconFilter   },
    { name: 'iconDownload', fn: iconDownload },
    { name: 'iconUpload',   fn: iconUpload   },
    { name: 'iconRefresh',  fn: iconRefresh  },
    { name: 'iconSend',     fn: iconSend     },
  ]},
  { group: 'UI Controls', icons: [
    { name: 'iconEye',      fn: iconEye      },
    { name: 'iconEyeOff',   fn: iconEyeOff   },
    { name: 'iconLock',     fn: iconLock     },
    { name: 'iconUnlock',   fn: iconUnlock   },
    { name: 'iconSettings', fn: iconSettings },
    { name: 'iconBell',     fn: iconBell     },
  ]},
  { group: 'People & Communication', icons: [
    { name: 'iconUser',          fn: iconUser          },
    { name: 'iconUsers',         fn: iconUsers         },
    { name: 'iconMail',          fn: iconMail          },
    { name: 'iconMessageSquare', fn: iconMessageSquare },
  ]},
  { group: 'Navigation & Pages', icons: [
    { name: 'iconHome',   fn: iconHome   },
    { name: 'iconMapPin', fn: iconMapPin },
    { name: 'iconLogOut', fn: iconLogOut },
    { name: 'iconLogIn',  fn: iconLogIn  },
  ]},
  { group: 'Content & Files', icons: [
    { name: 'iconFile',     fn: iconFile     },
    { name: 'iconImage',    fn: iconImage    },
    { name: 'iconLink',     fn: iconLink     },
    { name: 'iconCode',     fn: iconCode     },
    { name: 'iconCalendar', fn: iconCalendar },
    { name: 'iconClock',    fn: iconClock    },
    { name: 'iconBookmark', fn: iconBookmark },
    { name: 'iconTag',      fn: iconTag      },
  ]},
  { group: 'Media & Rating', icons: [
    { name: 'iconPlay',  fn: iconPlay  },
    { name: 'iconPause', fn: iconPause },
    { name: 'iconVolume', fn: iconVolume },
    { name: 'iconStar',  fn: iconStar  },
    { name: 'iconHeart', fn: iconHeart },
  ]},
  { group: 'Devices', icons: [
    { name: 'iconPhone',   fn: iconPhone   },
    { name: 'iconGamepad', fn: iconGamepad },
  ]},
  { group: 'Hand Pointers', icons: [
    { name: 'iconHandPointUp',    fn: iconHandPointUp    },
    { name: 'iconHandPointDown',  fn: iconHandPointDown  },
    { name: 'iconHandPointLeft',  fn: iconHandPointLeft  },
    { name: 'iconHandPointRight', fn: iconHandPointRight },
  ]},
  { group: 'Misc', icons: [
    { name: 'iconGlobe',        fn: iconGlobe        },
    { name: 'iconShield',       fn: iconShield       },
    { name: 'iconZap',          fn: iconZap          },
    { name: 'iconTrendingUp',   fn: iconTrendingUp   },
    { name: 'iconTrendingDown', fn: iconTrendingDown },
    { name: 'iconLoader',       fn: iconLoader       },
    { name: 'iconGrid',         fn: iconGrid         },
    { name: 'iconBug',          fn: iconBug          },
  ]},
  { group: 'Theme', icons: [
    { name: 'iconSun',  fn: iconSun  },
    { name: 'iconMoon', fn: iconMoon },
  ]},
]

function iconGrid_() {
  return ICONS.map(({ group, icons }) => `
    <h3 class="doc-h3" style="margin-top:2rem">${group}</h3>
    <div class="icon-grid">
      ${icons.map(({ name, fn }) => `
        <div class="icon-grid-item">
          <div class="icon-grid-preview">${fn({ size: 20 })}</div>
          <span class="icon-grid-name">${name}</span>
        </div>
      `).join('')}
    </div>
  `).join('')
}

export default {
  route: '/components/icons',
  meta: {
    title: 'Icons — Pulse Docs',
    description: 'Built-in icon set for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  state: {},
  view: () => renderComponentPage({
    currentHref: '/components/icons',
    prev,
    next,
    name: 'icons',
    description: '55 curated icons. All are pure functions returning an SVG string — no external library, no DOM dependency, tree-shakeable. Style: 24×24 viewBox, <code>stroke="currentColor"</code>, compatible with any colour token.',
    content: `

      <h2 class="doc-h2" id="usage">Usage</h2>
      <p>Import the icon functions you need alongside other components. Call each as a function — optionally pass <code>size</code> and <code>class</code>.</p>
      ${demo(
        `<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">` +
          iconCheck({ size: 20 }) +
          iconSearch({ size: 20 }) +
          iconUser({ size: 20 }) +
          iconStar({ size: 20 }) +
          iconZap({ size: 20 }) +
          iconSettings({ size: 20 }) +
        `</div>`,
        `import { iconCheck, iconSearch, iconUser } from '@invisibleloop/pulse/ui'

// Default size (16px)
iconCheck()

// Custom size
iconSearch({ size: 20 })

// With extra class
iconUser({ size: 20, class: 'u-text-accent' })`
      )}

      <h2 class="doc-h2" id="with-button">With button</h2>
      <p>Pass an icon into the <code>icon</code> prop of <code>button()</code>.</p>
      ${demo(
        `<div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center">` +
          button({ label: 'Download', variant: 'primary',   icon: iconDownload({ size: 14 }) }) +
          button({ label: 'Edit',     variant: 'secondary', icon: iconEdit({ size: 14 }) }) +
          button({ label: 'Delete',   variant: 'danger',    icon: iconTrash({ size: 14 }) }) +
          button({ label: 'Search',   variant: 'ghost',     icon: iconSearch({ size: 14 }) }) +
        `</div>`,
        `button({ label: 'Download', variant: 'primary',   icon: iconDownload({ size: 14 }) })
button({ label: 'Edit',     variant: 'secondary', icon: iconEdit({ size: 14 }) })
button({ label: 'Delete',   variant: 'danger',    icon: iconTrash({ size: 14 }) })
button({ label: 'Search',   variant: 'ghost',     icon: iconSearch({ size: 14 }) })`
      )}

      <h2 class="doc-h2" id="with-feature">With feature</h2>
      <p>Icons compose naturally into the <code>feature()</code> icon slot.</p>
      ${demo(
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">` +
          feature({ icon: iconZap({ size: 20 }),    title: 'Fast',    description: 'Streaming SSR. No build step.' }) +
          feature({ icon: iconShield({ size: 20 }), title: 'Secure',  description: 'Security headers on every response.' }) +
          feature({ icon: iconCode({ size: 20 }),   title: 'Simple',  description: 'Plain JS objects, no JSX.' }) +
        `</div>`,
        `feature({ icon: iconZap({ size: 20 }),    title: 'Fast',   description: '...' })
feature({ icon: iconShield({ size: 20 }), title: 'Secure', description: '...' })
feature({ icon: iconCode({ size: 20 }),   title: 'Simple', description: '...' })`
      )}

      <h2 class="doc-h2" id="background">Background</h2>
      <p>Add <code>bg: 'circle'</code> or <code>bg: 'square'</code> to wrap the icon in a tinted background. Use <code>bgColor</code> to pick the colour — defaults to <code>'accent'</code>.</p>

      <h3 class="doc-h3">Circle</h3>
      ${demo(
        `<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">` +
          iconZap({     size: 20, bg: 'circle', bgColor: 'accent'  }) +
          iconCheck({   size: 20, bg: 'circle', bgColor: 'success' }) +
          iconAlertTriangle({ size: 20, bg: 'circle', bgColor: 'warning' }) +
          iconXCircle({ size: 20, bg: 'circle', bgColor: 'error'   }) +
          iconSettings({size: 20, bg: 'circle', bgColor: 'muted'   }) +
        `</div>`,
        `iconZap({          size: 20, bg: 'circle', bgColor: 'accent'  })
iconCheck({        size: 20, bg: 'circle', bgColor: 'success' })
iconAlertTriangle({ size: 20, bg: 'circle', bgColor: 'warning' })
iconXCircle({      size: 20, bg: 'circle', bgColor: 'error'   })
iconSettings({     size: 20, bg: 'circle', bgColor: 'muted'   })`
      )}

      <h3 class="doc-h3">Square (rounded)</h3>
      ${demo(
        `<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">` +
          iconZap({     size: 20, bg: 'square', bgColor: 'accent'  }) +
          iconCheck({   size: 20, bg: 'square', bgColor: 'success' }) +
          iconAlertTriangle({ size: 20, bg: 'square', bgColor: 'warning' }) +
          iconXCircle({ size: 20, bg: 'square', bgColor: 'error'   }) +
          iconSettings({size: 20, bg: 'square', bgColor: 'muted'   }) +
        `</div>`,
        `iconZap({ size: 20, bg: 'square', bgColor: 'accent' })`
      )}

      <h3 class="doc-h3">With feature()</h3>
      <p>Pairs naturally with the <code>feature()</code> icon slot at larger sizes.</p>
      ${demo(
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">` +
          feature({ icon: iconZap({    size: 22, bg: 'square', bgColor: 'accent'  }), title: 'Fast',    description: 'Streaming SSR, zero config.' }) +
          feature({ icon: iconShield({ size: 22, bg: 'square', bgColor: 'success' }), title: 'Secure',  description: 'Security headers by default.' }) +
          feature({ icon: iconCode({   size: 22, bg: 'square', bgColor: 'muted'   }), title: 'Simple',  description: 'Plain JS objects, no JSX.' }) +
        `</div>`,
        `feature({ icon: iconZap({    size: 22, bg: 'square', bgColor: 'accent'  }), title: 'Fast',   description: '...' })
feature({ icon: iconShield({ size: 22, bg: 'square', bgColor: 'success' }), title: 'Secure', description: '...' })
feature({ icon: iconCode({   size: 22, bg: 'square', bgColor: 'muted'   }), title: 'Simple', description: '...' })`
      )}

      <h2 class="doc-h2" id="colour">Colour</h2>
      <p>Icons inherit <code>color</code> from their parent — use utility classes or CSS tokens to tint them.</p>
      ${demo(
        `<div style="display:flex;gap:1.25rem;align-items:center">` +
          `<span class="u-text-accent">${iconStar({ size: 20 })}</span>` +
          `<span class="u-text-green">${iconCheckCircle({ size: 20 })}</span>` +
          `<span class="u-text-red">${iconXCircle({ size: 20 })}</span>` +
          `<span class="u-text-yellow">${iconAlertTriangle({ size: 20 })}</span>` +
          `<span class="u-text-blue">${iconInfo({ size: 20 })}</span>` +
          `<span class="u-text-muted">${iconClock({ size: 20 })}</span>` +
        `</div>`,
        `<span class="u-text-accent">\${iconStar({ size: 20 })}</span>
<span class="u-text-green">\${iconCheckCircle({ size: 20 })}</span>
<span class="u-text-red">\${iconXCircle({ size: 20 })}</span>
<span class="u-text-yellow">\${iconAlertTriangle({ size: 20 })}</span>`
      )}

      <h2 class="doc-h2" id="all-icons">All icons</h2>
      <p>Click any icon name to copy the import.</p>

      ${iconGrid_()}

      ${table(
        ['Prop', 'Type', 'Default', 'Description'],
        [
          ['<code>size</code>',    'number', '16',      'Width and height in px'],
          ['<code>class</code>',   'string', '—',       'Extra CSS classes (on wrapper when <code>bg</code> is set, otherwise on the SVG)'],
          ['<code>bg</code>',      'string', '—',       "'circle' · 'square' — wraps the icon in a tinted background"],
          ['<code>bgColor</code>', 'string', "'accent'", "'accent' · 'success' · 'warning' · 'error' · 'muted'"],
        ]
      )}
    `,
  }),
}
