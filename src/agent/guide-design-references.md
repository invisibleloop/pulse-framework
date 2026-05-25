# Pulse Design References — Aesthetic Vocabulary

Use this guide to build **distinctive** pages rather than defaulting to the standard SaaS landing page. Match the user's product to a design direction, then apply the component combinations, vibe, and token hints below.

When you choose a design direction, tell the user which one you're using and why. The whole point is conscious choice.

---

## Design Directions

### 1. Clean SaaS / Productivity
**Feels like:** Linear, Vercel, Notion, Raycast  
**vibe:** `minimal` or `bold`  
**Geometry:** tight radius (2–6px), mono grids, generous whitespace  
**Typography:** geometric sans, tight tracking on headings, strong size contrast  
**Palette pattern:** near-black bg + single accent (indigo / blue / violet)  
**Signature moves:** bento grid, floating nav on scroll, stat bar, code window  
**Components to lead with:** `hero(layout:'centered')`, `grid`, `stat`, `codeWindow`, `feature`

---

### 2. Warm Local Business
**Feels like:** a bakery, dog groomer, physiotherapy clinic, florist  
**vibe:** `warm`  
**Geometry:** large radius (14–20px), soft card shadows, rounded buttons  
**Typography:** humanist sans (inter, nunito), comfortable line-height  
**Palette pattern:** earthy warm — terracotta / sage / cream / warm off-white  
**Signature moves:** real photo hero, services grid with icons, "meet the team", hours + map, handwritten accent (SVG underline via decorate)  
**Components to lead with:** `hero(layout:'split')`, `photoCard`, `gallery`, `section(variant:'alt')`, `footer` with address

---

### 3. Editorial / Publication
**Feels like:** The Verge, Substack, MIT Technology Review, a literary magazine  
**vibe:** `editorial`  
**Geometry:** zero radius, column rules, tight grids  
**Typography:** serif display (Georgia / Playfair Display), strong weight contrast, generous body leading  
**Palette pattern:** black + white + single ink colour (brick red / forest green)  
**Signature moves:** article grid with issue number, pullquote, prose with drop cap, author byline as hero subtitle  
**Components to lead with:** `prose`, `pullquote`, `hero(size:'sm')`, `grid`, `section` with column text

---

### 4. Bold Agency / Creative Studio
**Feels like:** Awwwards winner, design agency, film production studio  
**vibe:** `bold`  
**Geometry:** medium radius (6–10px), oversized type, dramatic section transitions  
**Typography:** heavy condensed sans (Black weight), massive heading, strong contrast  
**Palette pattern:** black bg + vivid single colour (yellow / red / lime) for accents  
**Signature moves:** work case-study grid, client logo marquee, big number stats, diagonal section, full-bleed hero  
**Components to lead with:** `hero(layout:'poster')`, `marquee`, `gallery(layout:'masonry')`, `section(variant:'diagonal')`, `stat`

---

### 5. Playful / Consumer App
**Feels like:** Duolingo, Headspace, Loom, Figma landing page  
**vibe:** `playful`  
**Geometry:** very rounded (18–24px), friendly icons, colourful  
**Typography:** rounded or friendly sans, loose spacing, emoji-friendly  
**Palette pattern:** bright bg (coral / mint / lavender) + dark text  
**Signature moves:** illustrated phone mockup, animated badge counts, colourful feature cards, social proof strip  
**Components to lead with:** `phoneFrame`, `hero(layout:'split')`, `appBadge`, `feature`, `testimonial`

---

### 6. Minimal Portfolio
**Feels like:** a photographer, architect, developer personal site, typographer  
**vibe:** `minimal`  
**Geometry:** ultra-low radius (0–3px), strong whitespace, grid discipline  
**Typography:** light weight body, all-caps labels, large work titles  
**Palette pattern:** white or near-black + single neutral accent  
**Signature moves:** work grid (no card chrome), simple text navigation, contact via plain `<a href="mailto:...">`, no footer clutter  
**Components to lead with:** `gallery(layout:'grid')`, `grid`, `container(size:'sm')`, `heading`, minimal `footer`

---

### 7. Event / Conference
**Feels like:** a festival poster, tech conference site, concert landing page  
**vibe:** `bold` or `neon`  
**Geometry:** strong, decisive — either rectangular or very rounded  
**Typography:** poster-style headline, tight date/location details  
**Palette pattern:** dark bg + 2 vivid accent colours; optional gradient hero  
**Signature moves:** date + venue stat bar, speaker grid, schedule accordion, countdown timer (client-only JS), ticket CTA  
**Components to lead with:** `hero` with gradient `background`, `stat`, `grid` for speakers, `accordion` for schedule, `cta` with bold button

---

### 8. Retro / Craft / Nostalgia
**Feels like:** a craft brewery, vinyl record shop, heritage brand, farmers market  
**vibe:** `retro`  
**Geometry:** medium radius (8px), textured backgrounds, thick borders  
**Typography:** slab serif (Rockwell / Courier), mixed cases, stamp-style labels  
**Palette pattern:** amber / cream / dark brown / forest green  
**Signature moves:** `decorate(pattern:'dots')` background, thick divider lines, badge-style eyebrows, stacked text hierarchy  
**Components to lead with:** `hero(layout:'stacked')`, `section(variant:'alt')`, `decorate`, `badge`, `card`

---

### 9. Corporate / B2B / Enterprise
**Feels like:** Salesforce, Workday, a consultancy, an insurance company  
**vibe:** `corporate`  
**Geometry:** conservative radius (4px), structured layout, safe  
**Typography:** system-ui or clean sans, no display serif, professional  
**Palette pattern:** navy / corporate blue + white + grey  
**Signature moves:** trust logos, security/compliance badges, case study cards, feature table, partner logos  
**Components to lead with:** `hero(layout:'centered')`, `grid`, `feature`, `stat`, `testimonial` with company name

---

### 10. Brutalist / Art / Counter-culture
**Feels like:** a Berlin gallery, fashion brand, experimental portfolio, zine  
**vibe:** `brutalist`  
**Geometry:** zero radius everywhere, raw edges, intentional "broken" look  
**Typography:** impact / black weight / giant, sometimes rotated via CSS transform  
**Palette pattern:** black + white + ONE violent accent (red / lime / hot pink)  
**Signature moves:** asymmetric grid, oversized section numbers, text-only nav, full bleed images bleeding into sections, no visual fluff  
**Components to lead with:** raw `section`, `container`, `heading`, `gallery` (no rounded), `decorate(pattern:'noise')`

---

### 11. Dark Tech / Gaming / Crypto
**Feels like:** a cyberpunk game, crypto protocol, AI startup, hardware brand  
**vibe:** `neon`  
**Geometry:** sharp (2–4px), glowing borders, glassmorphism  
**Typography:** monospace or geometric sans, colour gradient on headings  
**Palette pattern:** very dark bg (#0a0a0f) + neon accent (cyan / green / magenta)  
**Signature moves:** blurred glow backgrounds, animated grid lines (CSS), terminal code window, token/protocol stats  
**Components to lead with:** `hero` with gradient, `codeWindow`, `stat`, `section(variant:'spotlight')`, `grid`

---

### 12. Warm Editorial / Journal
**Feels like:** a personal newsletter, book club, reading list, thoughtful blog  
**vibe:** `paper`  
**Geometry:** organic radius (10px), soft card shadows  
**Typography:** serif body (Georgia), comfortable 1.8 line-height, warm type colour  
**Palette pattern:** warm off-white bg + dark sepia text + muted link colour  
**Signature moves:** `prose` + `pullquote`, author avatar + bio card, reading time badge, related articles footer  
**Components to lead with:** `prose`, `pullquote`, `avatar`, `card`, `container(size:'sm')`

---

## How to use this guide

1. **At intake** — when the user describes their product, map it to one of the directions above.
2. **State the choice** — tell the user "I'm using the Warm Local Business direction — rounded cards, earthy palette, photo-forward hero."
3. **Apply the vibe** — set `meta.vibe` to the recommended value.
4. **Lead with the right components** — the "Components to lead with" list is ordered: use the first one for the hero, the rest for the body sections.
5. **Match the palette pattern** — don't apply a corporate navy palette to a playful app. If the user gave you brand colours, note whether they are warm/cool/saturated before writing CSS.
6. **Pick a template if one exists** — design direction + template = fastest correct result. See `pulse://guide/templates`.

## Cross-cutting rules

- Never default to centered hero + feature grid + pricing + FAQ without checking if a different layout suits the product better.
- The `marquee` component is great for trust logos, client names, and tech stack badges — use it on agency/corporate/SaaS directions.
- The `photoCard` and `gallery` components are underused — deploy them whenever the product has visual appeal (food, fitness, places, products).
- `decorate` backgrounds (dots, grid, noise, lines) add texture without images — especially useful on retro, brutalist, and paper directions.
- `section(variant:'diagonal')` → bold / agency; `section(variant:'paper')` → warm / retro; `section(variant:'spotlight')` → dark tech / neon.
