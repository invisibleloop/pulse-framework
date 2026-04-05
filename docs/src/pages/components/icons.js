import { renderComponentPage, demo } from '../../lib/component-page.js'
import { prevNext } from '../../lib/nav.js'
import { table } from '../../lib/layout.js'
import { modal } from '../../../../src/ui/index.js'
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
  iconMapPin, iconSun, iconMoon,
  iconFeather, iconTelescope, iconAi, iconSmile, iconBarChart,
  iconShoppingCart, iconShoppingBag, iconCreditCard, iconPackage, iconGift,
  iconWallet, iconTruck, iconReceipt, iconStore, iconPercent, iconTicket, iconBanknote,
  iconUtensils, iconCoffee, iconPizza, iconApple, iconCarrot,
  iconWine, iconCakeSlice, iconFish, iconCherry, iconEgg,
  iconCookie, iconIceCream, iconCroissant, iconSalad, iconWheat,
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
    { name: 'iconSmile',         fn: iconSmile         },
  ]},
  { group: 'AI & Data', icons: [
    { name: 'iconAi',       fn: iconAi       },
    { name: 'iconBarChart', fn: iconBarChart },
  ]},
  { group: 'Astronomy', icons: [
    { name: 'iconTelescope', fn: iconTelescope },
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
    { name: 'iconFeather',  fn: iconFeather  },
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
    { name: 'iconPlay',   fn: iconPlay   },
    { name: 'iconPause',  fn: iconPause  },
    { name: 'iconVolume', fn: iconVolume },
    { name: 'iconStar',   fn: iconStar   },
    { name: 'iconHeart',  fn: iconHeart  },
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
  { group: 'Ecommerce', icons: [
    { name: 'iconShoppingCart', fn: iconShoppingCart },
    { name: 'iconShoppingBag',  fn: iconShoppingBag  },
    { name: 'iconCreditCard',   fn: iconCreditCard   },
    { name: 'iconPackage',      fn: iconPackage      },
    { name: 'iconGift',         fn: iconGift         },
    { name: 'iconWallet',       fn: iconWallet       },
    { name: 'iconTruck',        fn: iconTruck        },
    { name: 'iconReceipt',      fn: iconReceipt      },
    { name: 'iconStore',        fn: iconStore        },
    { name: 'iconPercent',      fn: iconPercent      },
    { name: 'iconTicket',       fn: iconTicket       },
    { name: 'iconBanknote',     fn: iconBanknote     },
  ]},
  { group: 'Food & Drink', icons: [
    { name: 'iconUtensils',  fn: iconUtensils  },
    { name: 'iconCoffee',    fn: iconCoffee    },
    { name: 'iconPizza',     fn: iconPizza     },
    { name: 'iconApple',     fn: iconApple     },
    { name: 'iconCarrot',    fn: iconCarrot    },
    { name: 'iconWine',      fn: iconWine      },
    { name: 'iconCakeSlice', fn: iconCakeSlice },
    { name: 'iconFish',      fn: iconFish      },
    { name: 'iconCherry',    fn: iconCherry    },
    { name: 'iconEgg',       fn: iconEgg       },
    { name: 'iconCookie',    fn: iconCookie    },
    { name: 'iconIceCream',  fn: iconIceCream  },
    { name: 'iconCroissant', fn: iconCroissant },
    { name: 'iconSalad',     fn: iconSalad     },
    { name: 'iconWheat',     fn: iconWheat     },
  ]},
]

// Safe ID from icon name: iconArrowLeft → arrow-left
const safeId = name => name.replace(/^icon/, '').replace(/([A-Z])/g, m => '-' + m.toLowerCase()).replace(/^-/, '')

const PREVIEW_SIZES  = [12, 16, 20, 24, 32, 48]
const PREVIEW_COLORS = [
  { label: 'Default', style: ''                              },
  { label: 'Accent',  style: 'color:var(--accent)'          },
  { label: 'Green',   style: 'color:var(--color-green,#4ade80)'  },
  { label: 'Yellow',  style: 'color:var(--color-yellow,#facc15)' },
  { label: 'Red',     style: 'color:var(--color-red,#f87171)'    },
  { label: 'Muted',   style: 'color:var(--muted)'           },
]

function iconPreviewModal({ name, fn }) {
  const id = `icon-modal-${safeId(name)}`

  const sizesHtml = PREVIEW_SIZES.map(size => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      ${fn({ size })}
      <span style="font-size:0.6rem;color:var(--muted);font-family:var(--mono,monospace)">${size}</span>
    </div>
  `).join('')

  const colorsHtml = PREVIEW_COLORS.map(({ label, style }) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;${style}">
      ${fn({ size: 28 })}
      <span style="font-size:0.6rem;color:var(--muted);font-family:var(--mono,monospace)">${label}</span>
    </div>
  `).join('')

  const bgHtml =
    ['circle', 'square'].map(shape =>
      ['accent', 'success', 'warning', 'error', 'muted'].map(bgColor =>
        fn({ size: 20, bg: shape, bgColor })
      ).join('')
    ).join('<br style="display:block;margin:.5rem 0">')

  return modal({
    id,
    title: name,
    size:  'md',
    content: `
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div>
          <p style="font-size:.75rem;color:var(--muted);margin:0 0 .75rem">Sizes</p>
          <div style="display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap">${sizesHtml}</div>
        </div>
        <div>
          <p style="font-size:.75rem;color:var(--muted);margin:0 0 .75rem">Colours</p>
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">${colorsHtml}</div>
        </div>
        <div>
          <p style="font-size:.75rem;color:var(--muted);margin:0 0 .75rem">Backgrounds</p>
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">${bgHtml}</div>
        </div>
      </div>
    `,
  })
}

function iconGrid_() {
  return ICONS.map(({ group, icons }) => `
    <h3 class="doc-h3" style="margin-top:2rem">${group}</h3>
    <div class="icon-grid">
      ${icons.map(({ name, fn }) => `
        <button type="button" class="icon-grid-item" style="cursor:pointer;font:inherit;color:inherit" data-dialog-open="icon-modal-${safeId(name)}" aria-label="Preview ${name}">
          <div class="icon-grid-preview">${fn({ size: 20 })}</div>
          <span class="icon-grid-name">${name}</span>
        </button>
      `).join('')}
    </div>
  `).join('')
}

function iconModals_() {
  return ICONS.flatMap(({ icons }) => icons).map(iconPreviewModal).join('')
}

const pageContent = `
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
      <p>Click any icon to preview sizes, colours, and backgrounds.</p>

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

      <p style="margin-top:2rem;font-size:.8rem;color:var(--muted)">SVG paths derived from <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a> (ISC License, Copyright © 2022 Lucide Contributors) and <a href="https://feathericons.com" target="_blank" rel="noopener noreferrer">Feather Icons</a> (MIT License, Copyright © 2013–2017 Cole Bemis). Phosphor hand-pointer icons MIT License, Copyright © 2020 Phosphor Icons.</p>
    `

export default {
  route: '/components/icons',
  meta: {
    title: 'Icons — Pulse Docs',
    description: 'Built-in icon set for Pulse UI.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },

  // Shell: all visible content (nav, examples, icon grid) — sends immediately.
  // Modals: 100 hidden <dialog> elements — streamed after. Users never see them
  // arrive since dialogs are display:none until opened.
  stream: {
    shell:    ['page'],
    deferred: ['modals'],
  },

  view: {
    page: () => renderComponentPage({
      currentHref: '/components/icons',
      prev,
      next,
      name: 'icons',
      description: '100 curated icons. All are pure functions returning an SVG string — no external library, no DOM dependency, tree-shakeable. Style: 24×24 viewBox, <code>stroke="currentColor"</code>, compatible with any colour token.',
      content: pageContent,
    }),
    modals: () => iconModals_(),
  },
}
