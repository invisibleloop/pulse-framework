# Component Decision Tree

Use this guide to quickly find the right component for your layout, form, or UI pattern. Organized by task.

## Layout & Structure

### Need a page container?
- **Max-width wrapper** → `container()`
- **Semantic content block** → `section()`

### Need to arrange elements vertically?
→ `stack({ gap: 'md' })` — consistent spacing between children, no alignment options needed
- Use gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- Rarely needs alignment; when you do, use the `align` prop ('stretch' | 'start' | 'center' | 'end')

**Example:**
```js
stack({
  gap: 'lg',
  items: [
    heading({ text: 'Contact us' }),
    input({ label: 'Email', name: 'email' }),
    textarea({ label: 'Message', name: 'message' }),
  ].map(e => e),
})
```

### Need to arrange elements horizontally with wrapping?
→ `cluster()` — buttons, badges, tags, icon groups
- Use gap: 'xs' | 'sm' | 'md' | 'lg'
- Justify options: 'start' | 'center' | 'end' | 'between'
- Align options: 'start' | 'center' | 'end'

**Example:**
```js
cluster({
  gap: 'md',
  justify: 'between',
  items: [
    button({ label: 'Cancel', variant: 'ghost' }),
    button({ label: 'Save', variant: 'primary' }),
  ].map(e => e),
})
```

### Need a 2D grid (tiles, cards, products)?
→ `grid()` — responsive columns, collapses to single column on mobile
- cols: 1 | 2 | 3 | 4 (default: 3)
- gap: 'sm' | 'md' | 'lg'

**Example:**
```js
grid({
  cols: 3,
  gap: 'md',
  items: products.map(p => card({
    title: p.name,
    content: `<p>${p.description}</p>`,
  })).map(e => e),
})
```

### Need image + text side-by-side?
→ `media()` — two-column layout, stacks on mobile
- reverse: true to put text on the left
- align: 'start' | 'center' (vertical alignment)
- gap: 'sm' | 'md' | 'lg'

**Example:**
```js
media({
  image: `<img src="feature.png" alt="Feature screenshot">`,
  content: `<h3>Save time</h3><p>No build step required.</p>`,
  reverse: false,
})
```

---

## Surfaces & Containers

### Need a card-like surface?
→ `card()` — container with optional title and footer
- variant: 'default' | 'elevated' | 'bordered' | 'flat' | 'glass' | 'tinted'
- flush: true to remove internal padding (for custom layouts inside)

**Example:**
```js
card({
  title: 'User profile',
  content: `<p>Name: ${user.name}</p>`,
  footer: cluster({
    gap: 'md',
    items: [
      button({ label: 'Edit', variant: 'secondary' }),
      button({ label: 'Delete', variant: 'danger' }),
    ].map(e => e),
  }),
})
```

### Need to show an empty state?
→ `empty()` — placeholder when no data exists
- title, content, action (HTML string for button/link)

**Example:**
```js
empty({
  title: 'No posts yet',
  content: 'Create your first post to get started.',
  action: button({ label: 'New post', href: '/posts/new' }),
})
```

### Need a message/alert box?
→ `alert()` — styled message container
- variant: 'info' | 'success' | 'warning' | 'error'
- title and content (both optional)

**Example:**
```js
alert({
  variant: 'success',
  title: 'Saved!',
  content: 'Your changes have been saved.',
})
```

---

## Form Controls

### Text input?
→ `input()` — single-line text field
- label, placeholder, value, error, hint, required, disabled
- name for form submission

**Example:**
```js
input({
  name: 'email',
  label: 'Email',
  placeholder: 'you@example.com',
  type: 'email',
  required: true,
})
```

### Multi-line text?
→ `textarea()` — for longer text
- label, placeholder, rows, value, error, hint, required
- name for form submission

**Example:**
```js
textarea({
  name: 'message',
  label: 'Message',
  placeholder: 'Tell us what you think...',
  rows: 6,
})
```

### Dropdown selection?
→ `select()` — pick one from a list
- options: array of strings or { label, value } objects
- value, label, error, hint, required, disabled, name

**Example:**
```js
select({
  name: 'country',
  label: 'Country',
  options: [
    { label: 'United States', value: 'us' },
    { label: 'Canada', value: 'ca' },
    { label: 'Mexico', value: 'mx' },
  ],
})
```

### Single yes/no toggle?
→ `toggle()` — on/off switch
- label, checked, disabled, id, name

**Example:**
```js
toggle({
  name: 'notifications',
  label: 'Enable notifications',
  checked: true,
})
```

### Pick one of several options?
→ `radio()` — vertical list of choices
→ `cluster()` — horizontal button/option group (for compact layouts)

**radio() example:**
```js
radio({
  name: 'frequency',
  label: 'Email frequency',
  options: [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ],
})
```

**Horizontal option group (compact):**
```js
cluster({
  gap: 'sm',
  content: `
    <fieldset>
      <legend class="sr-only">Size</legend>
      ${['sm', 'md', 'lg'].map(s => `
        <label>
          <input type="radio" name="size" value="${s}">
          ${s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
        </label>
      `).join('')}
    </fieldset>
  `,
})
```

### Pick multiple options?
→ `checkbox()` — multi-select form control
- options: array of { label, value } or strings
- value array of selected values

**Example:**
```js
checkbox({
  name: 'features',
  label: 'Features you want',
  options: [
    { label: 'Dark mode', value: 'dark' },
    { label: 'Sync', value: 'sync' },
    { label: 'Offline', value: 'offline' },
  ],
})
```

### Range/slider input?
→ `slider()` — numeric value with min/max
- name, label, min, max, step, value, disabled, event (for binding)

**Example:**
```js
slider({
  name: 'volume',
  label: 'Volume',
  min: 0,
  max: 100,
  value: 50,
})
```

### Star rating?
→ `rating()` — 1–5 star picker
- value (current rating), max, readonly, name, event (for binding)

**Example:**
```js
rating({
  value: 3,
  max: 5,
  event: 'change:setRating',
})
```

### File upload?
→ `fileUpload()` — file input with label
- label, name, accept, multiple, hint

**Example:**
```js
fileUpload({
  name: 'avatar',
  label: 'Upload avatar',
  accept: 'image/*',
})
```

### Group related form fields?
→ Use `stack()` with a `heading()`

```js
// Group form fields vertically
stack({
  gap: 'md',
  content: `
    ${heading({ level: 3, text: 'Contact info' })}
    ${input({ label: 'Email', name: 'email' })}
    ${input({ label: 'Phone', name: 'phone' })}
  `,
})
```

---

## Navigation & Content

### Full-page navigation header?
→ `nav()` — sticky nav with logo, links, and actions
- logo (HTML), logoHref
- links: array of { label, href, active? }
- action (HTML for right-side button/menu)
- sticky: true for fixed positioning
- burgerAlign: 'left' | 'right' for mobile menu icon

**Example:**
```js
nav({
  logo: 'MyApp',
  logoHref: '/',
  links: [
    { label: 'Home', href: '/', active: true },
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
  ],
  action: button({ label: 'Sign in', href: '/login' }),
  sticky: true,
})
```

### Page footer?
→ `footer()` — footer container (agents add custom layout inside)
- content (HTML string)

**Example:**
```js
footer({
  content: `
    <div class="footer-cols">
      <div><h4>Company</h4><ul>...</ul></div>
      <div><h4>Product</h4><ul>...</ul></div>
    </div>
    <p>&copy; 2026 My Company</p>
  `,
})
```

### Breadcrumb navigation?
→ `breadcrumbs()` — hierarchy trail
- items: array of { label, href? } (last item is current page)
- separator: custom separator (default: '/')

**Example:**
```js
breadcrumbs({
  items: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'My Post' },  // no href = current page
  ],
})
```

### Data table?
→ `table()` — semantic HTML table with styling
- headers: array of column titles
- rows: array of arrays (each inner array is a row)
- caption: table caption

**Example:**
```js
table({
  headers: ['Name', 'Email', 'Status'],
  rows: [
    ['Alice', 'alice@example.com', 'Active'],
    ['Bob', 'bob@example.com', 'Inactive'],
  ],
  caption: 'User list',
})
```

### Expandable/collapsible section?
→ `accordion()` — one or many expandable items
- items: array of { title, content, open? }

**Example:**
```js
accordion({
  items: [
    { title: 'What is Pulse?', content: '<p>Pulse is...</p>', open: true },
    { title: 'How do I use it?', content: '<p>First, install...</p>' },
  ],
})
```

---

## Landing Page & Marketing

### Full-width hero section?
→ `hero()` — headline, subheadline, actions, optional image
- title, subtitle, eyebrow
- image (HTML for right side or background)
- layout: 'split' | 'asymmetric' | 'overlap' (when image is set)
- backgroundImage (full-bleed background)
- actions (button/badge HTML)

**Example (split layout):**
```js
hero({
  eyebrow: 'Now available',
  title: 'Build without complexity',
  subtitle: 'No build step. No dependencies. Pure HTML.',
  image: `<img src="hero.png" alt="Pulse editor">`,
  actions: `
    ${button({ label: 'Get started', href: '/docs' })}
    ${button({ label: 'Learn more', variant: 'ghost', href: '/features' })}
  `,
  layout: 'split',
})
```

**Example (background image):**
```js
hero({
  title: 'Amazing features',
  subtitle: 'Everything you need.',
  backgroundImage: 'url(/bg.jpg)',
  overlay: 0.4,  // dark overlay opacity
  actions: button({ label: 'Explore', href: '/products' }),
})
```

### Call-to-action section?
→ `cta()` — centred block (simpler than hero)
- title, subtitle (or body), eyebrow
- actions (button HTML)
- align: 'center' | 'left'

**Example:**
```js
cta({
  eyebrow: 'Ready?',
  title: 'Start building today',
  subtitle: 'Join thousands of developers.',
  actions: `
    ${button({ label: 'Sign up free', href: '/signup' })}
  `,
})
```

### Feature tiles?
→ `feature()` — icon + title + description (used in grid)
- icon (SVG string), title, description
- image (for custom visuals above icon)
- center: true to centre-align

**Example:**
```js
grid({
  cols: 3,
  gap: 'lg',
  items: [
    feature({
      icon: iconZap(),
      title: 'Fast',
      description: 'Ships in milliseconds.',
      center: true,
    }),
    feature({
      icon: iconShield(),
      title: 'Secure',
      description: 'No external dependencies.',
      center: true,
    }),
  ].map(e => e),
})
```

---

## Data Display & Feedback

### Key metric (KPI)?
→ `stat()` — single value with label and optional trend
- label, value, delta (change), trend: 'up' | 'down' | 'flat'

**Example:**
```js
cluster({
  gap: 'xl',
  items: [
    stat({ label: 'Users', value: '1,234', delta: '+12%', trend: 'up' }),
    stat({ label: 'Revenue', value: '$45K', delta: '+8%', trend: 'up' }),
  ].map(e => e),
})
```

### User avatar?
→ `avatar()` — profile image or initials
- src (image URL), alt
- initials (fallback when no image)
- size: 'sm' | 'md' | 'lg'

**Example:**
```js
avatar({
  src: user.avatar,
  alt: user.name,
  size: 'md',
})
```

### Loading state?
→ `spinner()` — animated loading indicator
- size: 'sm' | 'md' | 'lg'
- color: 'accent' | 'muted' | 'white'
- label (screen reader text)

**Example:**
```js
spinner({ size: 'md', label: 'Loading posts...' })
```

### Progress indicator?
→ `progress()` — bar (determinate or indeterminate)
- value, max (omit for indeterminate)
- label, showLabel, showValue
- variant: 'info' | 'success' | 'warning' | 'error'

**Example:**
```js
progress({
  value: 65,
  max: 100,
  label: 'Upload progress',
  showValue: true,
})
```

### Small label/tag?
→ `badge()` — semantic label
- label, variant: 'default' | 'success' | 'warning' | 'error' | 'info'

**Example:**
```js
cluster({
  gap: 'sm',
  items: [
    badge({ label: 'Featured', variant: 'success' }),
    badge({ label: 'New', variant: 'info' }),
  ].map(e => e),
})
```

### Multi-step progress indicator?
→ `stepper()` — visual step indicator
- steps: array of { label, complete?, active? }
- current (active step index)

**Example:**
```js
stepper({
  steps: [
    { label: 'Details', complete: true },
    { label: 'Payment', active: true },
    { label: 'Confirm' },
  ],
  current: 1,
})
```

---

## Interactive / Overlays

### Modal dialog?
→ `modal()` — native HTML dialog with button trigger
- id (unique identifier)
- title, content, footer
- size: 'sm' | 'md' | 'lg' | 'xl'

**Use pattern:**
```js
// Always render the dialog in the view
${modal({
  id: 'confirm-delete',
  title: 'Confirm deletion',
  content: '<p>Are you sure?</p>',
  footer: `
    ${button({ label: 'Cancel', 'data-dialog-close': '' })}
    ${button({ label: 'Delete', variant: 'danger' })}
  `,
})}

// Open with data-dialog-open anywhere on the page
${button({ label: 'Delete item', 'data-dialog-open': 'confirm-delete' })}
```

---

## Typography

### Heading?
→ `heading()` — semantic h1–h6
- text (escaped), level: 1–6
- class for custom styling

**Example:**
```js
heading({ level: 2, text: 'Features' })
```

### Markdown / rich text content?
→ `prose()` — styled HTML container for article/blog content
- content (HTML string, typically from markdown parser)

**Example:**
```js
prose({
  content: `<h2>Introduction</h2><p>...</p>`,
})
```

### Blockquote / pull quote?
→ `pullquote()` — styled quote with attribution
- quote, cite (author)

**Example:**
```js
pullquote({
  quote: 'Build without complexity.',
  cite: '— Pulse docs',
})
```

### Divider / separator?
→ `divider()` — visual line (optional label)
- label (text on the line)

**Example:**
```js
divider({ label: 'or' })
```

---

## Media

### Image with optimization?
→ `uiImage()` — image with optional priority/sizing hints
- src, alt, width, height, priority

**Example:**
```js
uiImage({
  src: '/hero.jpg',
  alt: 'Hero screenshot',
  width: 800,
  height: 600,
  priority: true,  // for LCP images
})
```


### App Store / Play Store badge?
→ `appBadge()` — official badge linking to app stores
- store: 'apple' | 'google'
- href (link to app store page)

**Example:**
```js
cluster({
  gap: 'md',
  items: [
    appBadge({ store: 'apple', href: 'https://apps.apple.com/...' }),
    appBadge({ store: 'google', href: 'https://play.google.com/...' }),
  ].map(e => e),
})
```

---

## Button & Action

### Call to action / link button?
→ `button()` — renders as `<a>` when href is set, `<button>` otherwise
- label, variant: 'primary' | 'secondary' | 'ghost' | 'danger'
- size: 'sm' | 'md' | 'lg'
- href (renders as link when set)
- type: 'button' | 'submit' | 'reset'
- icon, iconAfter (SVG strings)
- fullWidth: true to stretch to parent width

**Example (as link):**
```js
button({
  label: 'Get started',
  href: '/docs',
  variant: 'primary',
  size: 'lg',
})
```

**Example (as button with icon):**
```js
button({
  label: 'Save',
  type: 'submit',
  icon: iconCheck(),
})
```

---

## When to Build Custom

Most patterns have a component, but sometimes custom HTML is the right call:

- **Highly unique visual design** → write custom CSS + raw HTML
- **Niche layout** → `stack()` + `grid()` + custom divs often suffice
- **Complex nested interactions** → raw HTML with `data-event` binding may be clearer than chaining components
- **Brand-specific components** → extend with CSS, don't duplicate a component

**Remember:** Agents should prefer components for 80% of layouts. Custom HTML is for the remaining 20%.
