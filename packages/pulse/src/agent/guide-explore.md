# Pulse Explore Guide — Blank-Canvas Layout Thinking

This guide is for when you want a site that feels **distinct**, not just correct. It teaches structure-first thinking: start with layout zones and emotional intent, not with which template to adapt.

> Read this when `pulse_sketch` suggests an unusual layout, when the user says "make it feel different", or when no template in `pulse://guide/templates` is a good fit.

---

## The Problem with Defaulting to Components

Every Pulse component is well-built. That's also their risk: they pull strongly toward a recognisable vocabulary — centred hero, three-column features, testimonial cards. A dog groomer and a hedge fund built with default components will look like cousins.

**The escape hatch is always available.** The `view` function is raw HTML. You can use:
- Zero components — just utility classes and inline HTML
- A mix of raw layout with components for specific elements (nav, footer, forms)
- Component structure with overridden CSS via app.css class rules

> **Note on inline styles:** The raw HTML patterns in this guide use `style=` attributes for clarity. In your own specs, move those rules into `app.css` as named classes — the `pulse_review` checklist will flag inline styles as a smell, and they can't be overridden cleanly. The pattern is: sketch with inline styles → extract to `app.css` classes → done.

---

## Start with Intent, Not Components

Before opening `pulse://guide/components`, answer three questions:

### 1. What is the emotional job?
Not "what does the page contain" but "how should the user feel 30 seconds after landing?"

| Feeling | Layout signal |
|---|---|
| Trust / authority | Wide margins, generous whitespace, restrained type, no decoration |
| Energy / urgency | Full-bleed images, bold type, tight spacing, strong diagonals |
| Warmth / handmade | Irregular layout, slight tilts, texture, serif body text |
| Precision / technical | Monospace accents, grid-aligned everything, data tables, no fluff |
| Playful / surprising | Breaking the grid, overlapping elements, unexpected colour pops |
| Editorial / serious | Long reading width, pullquotes, photo captions, no eyebrow badges |

### 2. What is the dominant structural gesture?
One of these should describe the entire page:

- **Full-bleed** — images or colour fills edge-to-edge, type floats over them
- **Offset split** — persistent asymmetry: content always 60/40 or 70/30, never centered
- **Vertical rhythm** — everything stacked, each section separated by whitespace not dividers
- **Dense grid** — information-rich, small gutters, horizontal scannable
- **Long-form** — single narrow column, essay-like, designed for reading not scanning
- **Kinetic** — scrolling triggers layout shifts (parallax, sticky elements, revealed content)

### 3. What should it NOT look like?
Name something to avoid. "Not another SaaS dark card page." "Not a startup landing page." "Not like it was made with a template."

This negative constraint is often more useful than the positive one.

---

## Layout Zones Approach

Design the page as zones before deciding what fills them:

```
┌─────────────────────────────────────────┐
│  IDENTITY ZONE                          │  ← Name, logo, hook. First impression.
│  (full-bleed image? type only? split?)  │
├─────────────────────────────────────────┤
│  PROOF ZONE                             │  ← Why believe it? Numbers, names, photos.
│  (stats? logos? photos? quote?)         │
├─────────────────────────────────────────┤
│  DETAIL ZONE                            │  ← What exactly do you offer?
│  (features? services? work? prices?)    │
├─────────────────────────────────────────┤
│  TRUST ZONE                             │  ← Social proof, credentials, story.
│  (testimonials? about? process?)        │
├─────────────────────────────────────────┤
│  ACTION ZONE                            │  ← The ask. Form, CTA, booking, purchase.
└─────────────────────────────────────────┘
```

The *order* and *proportion* of these zones is a design decision. A personal trainer might lead with PROOF (transformation photos) before IDENTITY. A law firm might bury the ACTION ZONE beneath extensive TRUST ZONE content.

**Reordering zones is one of the cheapest ways to feel distinctive.**

---

## Raw HTML Patterns (Zero Components)

These are layouts that deliberately use no Pulse components except `nav` and `footer`. They demonstrate what's possible.

### Full-Bleed Typography Hero
```js
const typographicHero = `
<section style="
  min-height: 100svh;
  display: grid;
  place-items: center;
  background: var(--ui-bg);
  padding: var(--ui-space-8);
">
  <div style="max-width: 900px; text-align: center;">
    <p style="
      font-size: clamp(0.75rem, 1.5vw, 0.875rem);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ui-muted);
      margin-bottom: var(--ui-space-6);
    ">Est. 2024 · London</p>
    <h1 style="
      font-size: clamp(3rem, 10vw, 8rem);
      font-weight: 800;
      line-height: 0.9;
      letter-spacing: -0.04em;
      color: var(--ui-text);
    ">The Work<br>Speaks for<br>Itself.</h1>
    <a href="#work" style="
      display: inline-block;
      margin-top: var(--ui-space-10);
      padding: var(--ui-space-4) var(--ui-space-8);
      border: 1px solid var(--ui-border);
      color: var(--ui-text);
      text-decoration: none;
      font-size: 0.875rem;
      letter-spacing: 0.05em;
    ">View Work ↓</a>
  </div>
</section>
`
```

### Asymmetric Split (Persistent Offset)
```js
const asymmetricHero = `
<section style="
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr 1.6fr;
">
  <div style="
    background: var(--ui-bg-alt);
    padding: var(--ui-space-16) var(--ui-space-8);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  ">
    <p style="color:var(--ui-muted);font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:var(--ui-space-4)">Dog grooming · Maplewood</p>
    <h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:var(--ui-text)">Your dog,<br>beautifully<br>groomed.</h1>
    <a href="#book" style="display:inline-flex;align-items:center;gap:0.5rem;margin-top:var(--ui-space-8);color:var(--ui-text);text-decoration:none;font-weight:500">
      Book now <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  </div>
  <div style="overflow:hidden;">
    <img src="${imageUrl}" alt="${imageAlt}" style="width:100%;height:100%;object-fit:cover;">
  </div>
</section>
`
```

### Stacked Long-Form (Essay / Blog)
```js
const essayLayout = `
<article style="
  max-width: 680px;
  margin: 0 auto;
  padding: var(--ui-space-16) var(--ui-space-6);
">
  <header style="margin-bottom: var(--ui-space-12);">
    <p style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ui-muted);margin-bottom:var(--ui-space-3)">
      ${category} · ${date} · ${readTime}
    </p>
    <h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:700;line-height:1.15;letter-spacing:-0.02em;margin-bottom:var(--ui-space-4)">
      ${title}
    </h1>
    <p style="font-size:1.125rem;color:var(--ui-muted);line-height:1.6;">${deck}</p>
    <div style="display:flex;align-items:center;gap:1rem;margin-top:var(--ui-space-6);padding-top:var(--ui-space-6);border-top:1px solid var(--ui-border);">
      <img src="${authorAvatar}" alt="${authorName}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
      <div>
        <p style="font-weight:500;font-size:0.875rem;">${authorName}</p>
        <p style="color:var(--ui-muted);font-size:0.75rem;">${authorRole}</p>
      </div>
    </div>
  </header>
  <img src="${heroImage}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;margin-bottom:var(--ui-space-10);">
  <div style="font-size:1.0625rem;line-height:1.75;color:var(--ui-text);">
    ${bodyHtml}
  </div>
</article>
`
```

### Dense Grid (Portfolio / Gallery)
```js
const denseGrid = `
<section style="
  padding: var(--ui-space-4);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--ui-space-3);
">
  ${items.map(item => `
    <a href="${item.href}" style="
      display: block;
      overflow: hidden;
      position: relative;
      aspect-ratio: 4/3;
      background: var(--ui-bg-alt);
    ">
      <img src="${item.img}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease;">
      <div style="
        position:absolute;inset:0;
        background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
        display:flex;align-items:flex-end;padding:var(--ui-space-4);
        opacity:0;transition:opacity 0.3s ease;
      " class="grid-overlay">
        <p style="color:#fff;font-weight:500;font-size:0.875rem;">${item.title}</p>
      </div>
    </a>
  `).join('')}
</section>
`
```

---

## Mixing Raw Layout with Pulse Components

You don't have to choose all-or-nothing. Common hybrid pattern:

```js
view: () => `
  ${uiNav({ ... })}                  ← Use nav — it handles mobile burger, sticky, a11y

  <section style="...raw layout...">  ← Raw hero with your own structure
    ...
  </section>

  ${section({                         ← Use section for padding + background variant
    variant: 'alt',
    content: grid({ ... })            ← Use grid for the responsive column system
  })}

  ${cta({ ... })}                     ← Use cta — saves 10 lines and is a11y correct

  ${footer({ ... })}                 ← Use footer — handles all the footer layout
`
```

**Rule of thumb:** Use Pulse components for global chrome (nav, footer), repeating patterns (cards, testimonials, features), and interactive elements (buttons, forms, modals). Use raw HTML for hero sections, custom layouts, and any zone where the default shape doesn't serve the design.

---

## CSS Custom Properties Available Everywhere

Even in raw HTML, you have the full design token system:

```css
/* Colours */
var(--ui-bg)           /* page background */
var(--ui-bg-alt)       /* slightly offset background (cards, alternating sections) */
var(--ui-surface)      /* elevated surface (modals, dropdowns) */
var(--ui-text)         /* primary text */
var(--ui-muted)        /* secondary / caption text */
var(--ui-border)       /* divider / outline color */
var(--ui-accent)       /* brand accent (buttons, links, highlights) */

/* Spacing */
var(--ui-space-1)      /* 0.25rem */
var(--ui-space-2)      /* 0.5rem */
var(--ui-space-3)      /* 0.75rem */
var(--ui-space-4)      /* 1rem */
var(--ui-space-6)      /* 1.5rem */
var(--ui-space-8)      /* 2rem */
var(--ui-space-10)     /* 2.5rem */
var(--ui-space-12)     /* 3rem */
var(--ui-space-16)     /* 4rem */

/* Typography */
var(--ui-font)         /* body font stack */
var(--ui-radius)       /* base border-radius (affected by vibe) */
var(--ui-radius-lg)    /* larger radius */

/* Shadows */
var(--ui-shadow-sm)    /* subtle card shadow */
var(--ui-shadow)       /* standard shadow */
var(--ui-shadow-lg)    /* large shadow */
```

Use `clamp()` for fluid type: `font-size: clamp(2rem, 5vw, 4rem)` — scales smoothly across breakpoints.

---

## The 3-Layout Rule

Before writing any code, sketch 3 structurally different options for the hero / above-the-fold zone. Even one sentence each:

> Option A: Full-bleed photo, title in bottom-left corner, text reversed out of image  
> Option B: 60/40 split — headline left, product photo right, earthy cream background  
> Option C: Typography-only, massive headline, minimal, no image — lets the copy breathe

Then choose the one that matches the emotional intent. If you can't decide, pick the most unusual one.

**The `pulse_sketch` tool automates this** — call it with a brief description and it returns 3 structured layout directions ready to choose from.

---

## Anti-Pattern Checklist

These are the signs a design has defaulted to template mode rather than intent:

- [ ] Hero is centred with eyebrow badge + large title + subtitle + two buttons
- [ ] Three-column feature grid with icon + heading + body
- [ ] Testimonials are all in cards with quote + author name
- [ ] Every section alternates white/light-grey backgrounds
- [ ] The nav has a logo on the left, links in the middle, CTA on the right
- [ ] The footer has the same logo, same links, and a copyright line

None of these are wrong. But if they're all there together, the page will look like every other Pulse page. Consider swapping at least 2 of the 6 for something more distinctive.
