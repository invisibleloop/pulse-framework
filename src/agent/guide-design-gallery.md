# Pulse Design Gallery — Templates & Component Combinations

A curated catalogue of ready-to-use design patterns. Each entry names the live template (or component combination), its distinguishing visual character, which vibe preset to set, which CSS theme to load, and the key components that make it work. Use this alongside `pulse://guide/design-references` — gallery = what it looks like + how to build it; design-references = aesthetic direction + creative strategy.

---

## Templates

### Local Business Landing Page
**Route:** `/templates/local-business`  
**Vibe:** `warm`  **Theme:** `light`  **CSS:** `lumio.css`

Warm cream background, hand-crafted feel. Photo-forward hero with a split layout (text left, dog/product image right). Earthy greens and amber for CTAs. Services grid of 6 cards with price footers. Two-column about section with credentials checklist. Three-column testimonials. Contact section with location/hours sidebar and inline booking form. Stat strip showing social proof numbers.

**Key components:** `hero({ layout:'split' })`, `section`, `container`, `grid`, `card` (with `footer`), `stat`, `testimonial`, `cta`, `badge`

**Distinguishing moves:**
- Gradient hero `linear-gradient(135deg, #fdf6ee, #fdebd0)` with `color:#3d2b1e` — define these hex values as tokens in `public/theme.css` and reference them via `var()`; the lint hook blocks raw hex in any other stylesheet
- Nav with `background: rgba(255,250,245,0.92)` and matching text colour
- Cards with price footer: `<div class="u-flex u-items-center u-justify-between"><span>From</span><strong>£35</strong></div>`
- Credentials list: icon + span with `iconCheckCircle`
- Booking form inlined inside a `card`

**Best for:** Dog groomer, physio, florist, bakery, personal trainer, hair salon, local café, tradesperson

---

### Portfolio / Creative Agency
**Route:** `/templates/portfolio`  
**Vibe:** `minimal`  **Theme:** `dark`  **CSS:** *(none extra — dark theme built-in)*

Dark, editorial, high-contrast. Works grid with cover images (fluid fill via `flush:true`), category badge overlays, and title links. Minimal nav without action button. About section in a narrow `sm` container for essay-like reading width. Simple plain contact form. Monochromatic palette with accent for hover states.

**Key components:** `hero({ layout:'centered' })`, `section`, `container({ size:'sm' })`, `grid({ cols:3 })`, `card({ flush:true })`, `badge({ variant:'soft' })`

**Distinguishing moves:**
- `card({ flush:true })` + `<img>` at top of content, padded inner div below — creates image card without a native image slot
- `aspect-ratio:3/2` on images for consistent crop
- `container({ size:'sm' })` for about/contact text — keeps it from stretching wide
- No eyebrows, no badge decorations in hero — just clean large type

**Best for:** Designer, photographer, illustrator, studio, agency, architect, film-maker

---

### Event / Conference
**Route:** `/templates/event`  
**Vibe:** `bold`  **Theme:** `dark`  **CSS:** *(none extra — dark theme built-in)*

Dark navy with violet/purple gradient CTAs. Centred hero with countdown-style stats strip. Sponsor logo marquee. Speaker portrait grid (4 columns, `flush:true` square images). Schedule as an accordion (3 day items, each with time/stage timetable). Venue section with two-column layout (map + details). Ticket pricing highlight.

**Key components:** `hero`, `section`, `container`, `grid({ cols:4 })`, `card({ flush:true })`, `accordion`, `marquee`, `badge`, `stat`, `cta`

**Distinguishing moves:**
- Speaker cards: `aspect-ratio:1/1` square portrait images + name/role/quote below
- Accordion items: `{ question: 'Day 1 — ...', answer: '<div>...timetable rows...</div>' }`
- Marquee for sponsor logos: `marquee({ items: [...], gap:'xl', speed:'slow' })`
- Stats strip: `section({ variant:'alt', padding:'sm' })` + `grid({ cols:4 })`

**Best for:** Conference, hackathon, festival, product launch, awards ceremony, summit

---

### Editorial / Magazine
**Route:** `/templates/editorial`  
**Vibe:** `editorial`  **Theme:** `dark`  **CSS:** *(none extra — dark theme built-in)*

Dark with serif headline typography. Featured article hero with byline, read-time badge, and category tag. Pullquote section with large italic text and cite attribution. Six-card article grid with `flush:true` cards (16:9 cover images, eyebrow category, deck text, author, date, read-time). Newsletter CTA in a `spotlight` section variant.

**Key components:** `hero`, `section({ variant:'spotlight' })`, `pullquote`, `container`, `grid({ cols:3 })`, `card({ flush:true })`, `badge`, `cta`

**Distinguishing moves:**
- Article cards: `card({ flush:true })` + `<img style="aspect-ratio:16/9">` + padded inner div with category badge, title link, deck, byline row
- `pullquote({ quote:'...', cite:'Name, Publication' })` — note `cite` not `author`
- Featured hero uses `layout:'centered'` with small eyebrow badge and read-time
- `section({ variant:'spotlight' })` for the newsletter signup gives a glowing background effect

**Best for:** Online magazine, news publication, blog, newsletter landing page, media brand

---

### Mobile App Landing Page
**Route:** `/templates/mobile-app`  
**Vibe:** `bold` or `minimal`  **Theme:** `dark`  **CSS:** *(dark theme built-in)*

Hero with phone-frame mockup, feature grid, pricing section, testimonials, and App Store badges. The centrepiece is a `phoneFrame` component wrapping a screenshot or animated mockup.

**Key components:** `hero`, `phoneFrame`, `feature`, `pricing`, `testimonial`, `appBadge`, `cta`

**Best for:** iOS/Android app, SaaS with mobile client, consumer product launch

---

### Blog Post
**Route:** `/templates/blog-post`  
**Vibe:** `editorial` or `minimal`  **Theme:** light or dark  **CSS:** `/pulse-ui.css`

Long-form article layout with `prose` component for markdown rendering, breadcrumbs, reading time, featured image, and a related-posts footer.

**Key components:** `prose`, `heading`, `breadcrumbs`, `badge`, `container({ size:'sm' })`

**Best for:** Article, tutorial, case study, documentation page, essay

---

## Component Combinations by Use Case

> Inline `style=""` in these snippets is limited to structural image properties (`aspect-ratio`, `object-fit`, fixed heights) that have no utility-class equivalent — this is the permitted exception to the no-inline-style rule. Colours and theming still belong in tokens.

### Image Card (Card with Cover Photo)
Card doesn't have a native image slot — use `flush:true` and put the image inside `content`:

```js
card({
  flush:   true,
  content: `
    <img src="${url}" alt="${alt}" class="u-w-full" style="aspect-ratio:3/2;object-fit:cover;">
    <div class="u-p-5">
      <h3 class="u-font-semibold">${title}</h3>
      <p class="u-text-sm u-text-muted">${body}</p>
    </div>
  `,
})
```

### Article Card (16:9 image + category + byline)
```js
card({
  flush:   true,
  content: `
    <img src="${img}" alt="${title}" class="u-w-full" style="aspect-ratio:16/9;object-fit:cover;">
    <div class="u-p-5">
      <div class="u-mb-2">${badge({ label: category, variant:'soft', size:'sm' })}</div>
      <h3 class="u-font-semibold u-leading-snug">
        <a href="${href}" class="u-text-inherit">${title}</a>
      </h3>
      <p class="u-text-sm u-text-muted u-mt-2">${deck}</p>
      <div class="u-flex u-gap-3 u-mt-3">
        <span class="u-text-xs u-text-muted">${author}</span>
        <span class="u-text-xs u-text-muted">·</span>
        <span class="u-text-xs u-text-muted">${date}</span>
      </div>
    </div>
  `,
})
```

### Credentials List (icon + text rows)
```js
const items = ['City & Guilds Level 3 qualified', 'Fear-free certified', 'Insured and first-aid trained']
items.map(item => `
  <div class="u-flex u-items-center u-gap-2">
    ${iconCheckCircle({ size: 18 })}
    <span>${item}</span>
  </div>
`).join('')
```

### Stat Strip
```js
section({
  variant:  'alt',
  padding:  'sm',
  content:  container({ content: grid({
    cols: 4,
    gap:  'lg',
    content: [
      stat({ value: '2,400+', label: 'Happy customers' }),
      stat({ value: '4.9',    label: 'Star rating'     }),
      stat({ value: '6 years', label: 'In business'   }),
      stat({ value: 'Same day', label: 'Bookings'     }),
    ].join(''),
  }) }),
})
```

### Sponsor Marquee
```js
marquee({
  items: ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli'].map(
    name => `<span class="u-font-semibold u-text-lg u-opacity-60">${name}</span>`
  ),
  speed: 'slow',
  gap:   'xl',
})
```

### Section with Header (Eyebrow + Title + Subtitle)
```js
section({
  id:       'services',
  eyebrow:  'Our Services',
  title:    'Everything You Need',
  subtitle: 'A supporting line with a bit more detail.',
  align:    'center',
  content:  `...grid or cards...`,
})
```
Note: when using the built-in `eyebrow`/`title`/`subtitle` on `section`, you don't need to put them inside the `content`. They are automatically rendered above `content` as a header block.

### Two-Column Section (Text + Image)
```js
section({
  id:      'about',
  variant: 'alt',
  content: container({ content: grid({
    cols: 2,
    gap:  'xl',
    content: `
      <div>
        <img src="${img}" alt="..." class="u-w-full u-rounded-xl" style="object-fit:cover;height:360px;">
      </div>
      <div class="u-flex u-flex-col u-justify-center u-gap-5">
        ${heading({ level: 2, text: 'About Us' })}
        <p class="u-text-muted u-leading-relaxed">...</p>
      </div>
    `,
  }) }),
})
```

### Booking / Contact Form Inside a Card
Use the `input()` component for fields — it renders the label, id wiring, and required marker accessibly. Do not write raw `<input>`/`<label>` HTML:

```js
card({
  title:   'Book an Appointment',
  content: `
    <p class="u-text-muted u-text-sm u-mb-4">Fill in the form and we'll confirm within a few hours.</p>
    <form class="u-flex u-flex-col u-gap-3" data-action="submit">
      ${input({ label: 'Your name', name: 'name', required: true })}
      ${input({ label: 'Email', name: 'email', type: 'email', required: true })}
      ${button({ label: 'Send Enquiry', type: 'submit', variant: 'primary', fullWidth: true })}
    </form>
  `,
  padding: 'lg',
})
```

---

## Prop Names — Quick Reference (Critical)

The most common mistakes when writing templates. These will silently produce empty output:

| Component | ❌ Wrong prop | ✅ Correct prop |
|---|---|---|
| `section` | `children:` | `content:` |
| `container` | `children:` | `content:` |
| `grid` | `children:` | `content:` |
| `card` | `body:` | `content:` |
| `card` | `image:` *(unsupported)* | Put `<img>` inside `content:` |
| `card` | `href:` *(unsupported)* | Wrap title in `<a>` inside `content:` |
| `testimonial` | `author:` | `name:` |
| `pullquote` | `author:` | `cite:` |
| `accordion` items | `title:` | `question:` |
| `accordion` items | `content:` | `answer:` |

---

## CSS Themes Available

| File | Character | Pairs with vibe |
|---|---|---|
| *(none — dark default)* | Deep dark, cool greys, blue-ish surface | `minimal`, `bold`, `editorial` |
| `/themes/lumio.css` | Warm cream whites, earthy mid-tones | `warm`, `paper` |
| `/themes/neon.css` | Electric neon on very dark surface | `neon`, `brutalist` |
| `/themes/retro.css` | Muted vintage pastels, aged look | `retro` |
| `/themes/corporate.css` | Clean neutral greys, professional blue | `corporate` |

Load via `meta.styles: ['/pulse-ui.css', '/themes/lumio.css']`.

---

## Vibes (data-vibe attribute)

Set via `meta: { vibe: 'warm' }`. Controls radius, font weight, letter-spacing, and some colour nudges.

| Vibe | Radius | Feel |
|---|---|---|
| `warm` | rounded | Approachable, organic, friendly |
| `editorial` | square | Serious, print-like, editorial |
| `minimal` | slight | Clean, airy, Swiss-influenced |
| `bold` | medium | Confident, high-contrast |
| `playful` | very rounded | Fun, colourful, consumer |
| `brutalist` | none | Raw, stark, anti-design |
| `retro` | pill/soft | Nostalgic, 70s–90s influenced |
| `corporate` | small | Professional, trustworthy |
| `neon` | medium | Electric, nightlife, gaming |
| `paper` | slight | Textured, craft, tactile |
