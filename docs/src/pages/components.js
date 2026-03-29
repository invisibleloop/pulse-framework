import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/components')

export default {
  route: '/components',
  meta: {
    title: 'Component Library — Pulse Docs',
    description: 'Server-rendered UI components for Pulse — button, card, input, alert, stat, avatar, table and more. Fully accessible, mobile-ready, zero client JS.',
    styles: ['/pulse-ui.css', '/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/components',
    prev,
    next,
    content: `
      ${h1('Component Library')}
      ${lead('Server-rendered building blocks. Each component is a pure function that returns an HTML string — no client-side JS, no build step, accessible and mobile-ready by default. The output is the same every time the same props are passed.')}

      ${section('setup', 'Setup')}
      <p>Components are imported directly into the spec file alongside the stylesheet reference in <code>meta.styles</code>. No build step, no registration.</p>
      ${codeBlock(highlight(`import { button, card, input } from '@invisibleloop/pulse/ui'
import { escHtml }          from '@invisibleloop/pulse/html'

export default {
  route: '/example',
  meta: {
    title:  'Example',
    styles: ['/pulse-ui.css', '/app.css'],
  },
  view: () => \`
    <main id="main-content">
      \${card({
        title:   'Welcome',
        content: button({ label: 'Get started', href: '/start' }),
      })}
    </main>
  \`,
}`, 'js'))}

      ${section('theming', 'Theming')}
      <p>All visual values flow through CSS custom properties. Override any <code>--ui-*</code> token in <code>:root</code> in your <code>app.css</code> to retheme the entire library at once.</p>
      ${codeBlock(highlight(`/* app.css */
:root {
  --ui-accent:       #6366f1;
  --ui-accent-hover: #818cf8;
  --ui-accent-dim:   rgba(99, 102, 241, .12);
  --ui-radius:       6px;
  --ui-bg:           #ffffff;
  --ui-surface:      #f9fafb;
  --ui-text:         #111827;
  --ui-muted:        #6b7280;
  --ui-border:       #e5e7eb;
}`, 'css'))}
      <p>New variants follow the <code>ui-btn--{name}</code> CSS modifier pattern. A brand-coloured button, for example, is just a new class in <code>app.css</code> — the component itself stays untouched.</p>
      ${codeBlock(highlight(`.ui-btn--brand {
  background: var(--brand);
  color:      #fff;
  border:     none;
}
.ui-btn--brand:hover:not(.ui-btn--disabled) {
  background: var(--brand-hover);
}`, 'css'))}

      ${section('components', 'Components')}
      <p>Each component has its own page with full demos, code examples, and a props reference.</p>

      <h3 class="doc-h3">UI</h3>
      ${table(
        ['Component', 'Description'],
        [
          ['<a href="/components/button">button</a>',   'Renders as <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code>. Four variants, three sizes.'],
          ['<a href="/components/badge">badge</a>',     'Inline status label. Five semantic colour variants.'],
          ['<a href="/components/card">card</a>',       'Content surface with title, body, and optional footer.'],
          ['<a href="/components/input">input</a>',       'Labelled text input with hint and error support.'],
          ['<a href="/components/fieldset">fieldset</a>', 'Semantic grouping of related fields with an accessible legend.'],
          ['<a href="/components/select">select</a>',     'Styled select with option groups and current-value support.'],
          ['<a href="/components/textarea">textarea</a>', 'Multi-line input with label, hint, and error.'],
          ['<a href="/components/alert">alert</a>',     'Inline feedback banner. ARIA roles wired by variant.'],
          ['<a href="/components/stat">stat</a>',       'Numeric metric with optional trend arrow.'],
          ['<a href="/components/avatar">avatar</a>',   'User avatar — image with fallback to initials.'],
          ['<a href="/components/empty">empty</a>',     'Empty state with title, description, and optional CTA.'],
          ['<a href="/components/table">table</a>',     'Accessible data table with scroll wrapper.'],
        ]
      )}

      <h3 class="doc-h3">Landing page</h3>
      ${table(
        ['Component', 'Description'],
        [
          ['<a href="/components/nav">nav</a>',               'Site header with logo, links, and optional CTA.'],
          ['<a href="/components/hero">hero</a>',             'Full-width hero section with eyebrow, title, and actions.'],
          ['<a href="/components/app-badge">appBadge</a>',    'App Store / Google Play download badge.'],
          ['<a href="/components/feature">feature</a>',       'Icon + title + description block for feature grids.'],
          ['<a href="/components/testimonial">testimonial</a>', 'Customer quote with avatar and star rating.'],
          ['<a href="/components/pricing">pricing</a>',       'Plan card with feature list and CTA. Supports highlighted state.'],
          ['<a href="/components/accordion">accordion</a>',   'Collapsible FAQ items — no JS, native <code>&lt;details&gt;</code>.'],
          ['<a href="/components/cta">cta</a>',               'Call-to-action block with eyebrow, heading, body, and actions slot.'],
        ]
      )}

      <h3 class="doc-h3">Layout</h3>
      ${table(
        ['Component', 'Description'],
        [
          ['<a href="/components/container">container</a>', 'Max-width wrapper with horizontal padding.'],
          ['<a href="/components/section">section</a>',     'Vertical padding block with background variant.'],
          ['<a href="/components/grid">grid</a>',           'Responsive CSS grid. Collapses to one column on mobile.'],
          ['<a href="/components/stack">stack</a>',         'Flex column with consistent vertical gap.'],
          ['<a href="/components/cluster">cluster</a>',     'Flex row with wrapping — for badges, buttons, etc.'],
          ['<a href="/components/divider">divider</a>',     'Horizontal rule, optionally with centred label.'],
          ['<a href="/components/banner">banner</a>',       'Full-width announcement bar above the nav.'],
          ['<a href="/components/media">media</a>',             'Two-column image + text layout, stacks on mobile.'],
          ['<a href="/components/code-window">codeWindow</a>', 'macOS window chrome around a code block. Accepts pre-highlighted HTML.'],
          ['<a href="/components/footer">footer</a>',          'Site footer with logo, nav links, and legal text. Stacks on mobile.'],
        ]
      )}

      ${section('utilities', 'Utility classes')}
      <p><code>pulse-ui.css</code> ships a utility layer (prefix <code>u-</code>) for common spacing, typography, and layout needs. Reach for these before writing custom CSS — they use the same <code>--ui-*</code> tokens as components so theme overrides apply everywhere.</p>

      <h3 class="doc-h3">Spacing</h3>
      <p>Scale: 1=4px 2=8px 3=12px 4=16px 5=20px 6=24px 8=32px 10=40px 12=48px 16=64px</p>
      ${table(
        ['Class', 'Property'],
        [
          ['<code>u-mt-{0–16}</code>', 'margin-top'],
          ['<code>u-mb-{0–16}</code>', 'margin-bottom'],
          ['<code>u-mx-auto</code>', 'margin-left + right: auto'],
          ['<code>u-p-{0–8}</code>', 'padding (all sides)'],
          ['<code>u-px-{0–8}</code>', 'padding-left + right'],
          ['<code>u-py-{0–8}</code>', 'padding-top + bottom'],
        ]
      )}

      <h3 class="doc-h3">Typography</h3>
      ${table(
        ['Class', 'Effect'],
        [
          ['<code>u-text-{xs,sm,base,lg,xl,2xl,3xl,4xl}</code>', 'Font size + matching line-height'],
          ['<code>u-font-{normal,medium,semibold,bold}</code>', 'Font weight'],
          ['<code>u-text-{left,center,right}</code>', 'Text alignment'],
          ['<code>u-text-{default,muted,accent,green,red,yellow,blue}</code>', 'Token colour'],
          ['<code>u-leading-{tight,snug,normal,relaxed,loose}</code>', 'Line height'],
        ]
      )}

      <h3 class="doc-h3">Layout</h3>
      ${table(
        ['Class', 'Effect'],
        [
          ['<code>u-flex</code> / <code>u-flex-col</code>', 'Flex row or column'],
          ['<code>u-items-{start,center,end,stretch}</code>', 'align-items'],
          ['<code>u-justify-{start,center,end,between}</code>', 'justify-content'],
          ['<code>u-gap-{1–8}</code>', 'gap'],
          ['<code>u-w-full</code>', 'width: 100%'],
          ['<code>u-max-w-{xs,sm,md,lg,xl,prose}</code>', 'max-width (320px–1024px, 65ch)'],
          ['<code>u-hidden</code> / <code>u-block</code> / <code>u-inline-block</code>', 'display'],
        ]
      )}

      <h3 class="doc-h3">Visual</h3>
      ${table(
        ['Class', 'Effect'],
        [
          ['<code>u-rounded</code> / <code>u-rounded-md</code> / <code>u-rounded-lg</code> / <code>u-rounded-full</code>', 'border-radius'],
          ['<code>u-border</code> / <code>u-border-t</code> / <code>u-border-b</code>', '1px solid --ui-border'],
          ['<code>u-bg-surface</code> / <code>u-bg-surface2</code> / <code>u-bg-accent</code>', 'background token'],
          ['<code>u-overflow-hidden</code> / <code>u-overflow-auto</code>', 'overflow'],
          ['<code>u-opacity-50</code> / <code>u-opacity-75</code>', 'opacity'],
        ]
      )}

      <p>Utilities compose naturally with components and with each other:</p>
      ${codeBlock(highlight(`<!-- centred hero block — no custom CSS needed -->
<div class="u-flex u-flex-col u-items-center u-text-center u-py-16 u-gap-4">
  <h1 class="u-text-4xl u-font-bold">Hello</h1>
  <p class="u-text-lg u-text-muted u-max-w-prose">Subtitle goes here.</p>
  \${button({ label: 'Get started', href: '/start' })}
</div>`, 'html'))}

      ${callout('note', 'Never use inline <code>style=""</code> attributes. Reach for utility classes first, and only add to <code>app.css</code> when you need something utilities cannot provide — a unique animation, a custom grid, or a one-off component variant.')}

      ${section('composing', 'Composing components')}
      <p>Components compose naturally — pass the output of one as the <code>content</code> or <code>footer</code> of another. Here's a stat dashboard card:</p>
      ${codeBlock(highlight(`import { card, stat, button } from '@invisibleloop/pulse/ui'

card({
  title:   'This week',
  content: \`
    \${stat({ label: 'Page views', value: '48,291', change: '+12%', trend: 'up' })}
    \${stat({ label: 'New users',  value: '1,042',  change: '+4%',  trend: 'up' })}
    \${stat({ label: 'Bounced',    value: '22%',    change: '+1%',  trend: 'down' })}
  \`,
  footer: button({ label: 'View full report', href: '/analytics', variant: 'ghost', size: 'sm' }),
})`, 'js'))}

      ${callout('note', 'Text props like <code>label</code>, <code>title</code>, <code>value</code>, and <code>error</code> are escaped automatically. <code>content</code>, <code>footer</code>, <code>rows</code>, <code>actions</code>, <code>icon</code>, <code>action</code>, and <code>logo</code> are raw HTML slots — they pass through as-is, so any user-supplied data going into those slots should go through <code>escHtml()</code> first.')}
    `,
  }),
}
