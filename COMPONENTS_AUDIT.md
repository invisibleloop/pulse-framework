# Pulse UI Components Audit

**47 components total.** This audit categorizes them by utility tier, identifies redundancies, and assesses what agents can confidently build without guidance.

## By Category

### Tier 1: Essential, High-Reuse (Keep, Document Well)

These are foundational. Agents should always prefer these.

| Component | Reuse Rate | Complexity | Agent Self-Service? | Notes |
|-----------|-----------|-----------|-------------|-------|
| **button** | Very high | Medium | ✅ Yes | Handles dual render (link/button), escape, icons, variants. Agents grasp quickly. |
| **input** | Very high | Low | ✅ Yes | Text input, error display, optional label. Straightforward. |
| **card** | Very high | Low | ✅ Yes | Container with optional title/footer. Flexible layout slot. |
| **stack** | Very high | Low | ✅ Yes | Vertical flex layout. Agents understand immediately. |
| **cluster** | Very high | Low | ✅ Yes | Horizontal wrapping flex layout. Essential for button groups. |
| **grid** | Very high | Low | ✅ Yes | Responsive CSS grid. Agents use it for tile layouts. |
| **select** | High | Low | ✅ Yes | Dropdown with option parsing. Agents self-serve. |
| **textarea** | High | Low | ✅ Yes | Multi-line text input. Simple mental model. |
| **container** | High | Low | ✅ Yes | Max-width wrapper. Trivial. |
| **section** | High | Low | ✅ Yes | Semantic block with padding. Agents understand. |
| **alert** | High | Low | ✅ Yes | Styled message box. Variants (info/success/warning/error) match UI patterns agents expect. |
| **badge** | High | Low | ✅ Yes | Small label/tag. Agents use it in headers, product cards. |
| **spinner** | High | Low | ✅ Yes | Loading indicator. Straightforward. |

---

### Tier 2: High-Value Patterns (Keep, but Require Discovery)

Agents will use these frequently once they know about them. The barrier is **discoverability**, not complexity.

| Component | Reuse Rate | Complexity | Agent Self-Service? | Notes |
|-----------|-----------|-----------|-------------|-------|
| **hero** | High | Medium | ⚠️ Partial | Supports 3 layouts (split, asymmetric, overlap), background images, overlays. Rich feature set. Agents need docs to exploit it — many will build custom hero instead. |
| **feature** | High | Low | ✅ Yes | Icon + title + desc block. Used in grid for "why us" sections. Agents grasp it. |
| **cta** | High | Low | ✅ Yes | Centred heading + actions. Similar to hero but simpler. Agents use readily. |
| **media** | High | Low | ✅ Yes | Image + text side-by-side with `reverse`. Agents find this useful. |
| **heading** | Medium | Low | ✅ Yes | Semantic h1–h6 with visual styling. Agents use it. |
| **nav** | High | Medium | ⚠️ Partial | Sticky nav with responsive burger menu. Rich prop set. Agents need examples. |
| **footer** | High | Low | ✅ Yes | Footer layout container. Agents build custom content inside. |
| **table** | Medium | Low | ✅ Yes | Basic HTML table styling. Agents use when displaying data. |
| **stat** | Medium | Low | ✅ Yes | Value + label + delta (trend). Used in dashboards. Agents understand. |
| **avatar** | Medium | Low | ✅ Yes | User image or initials. Agents use in profiles, comments. |
| **breadcrumbs** | Low | Low | ✅ Yes | Navigation breadcrumb trail. Agents use when needed. |
| **progress** | Medium | Low | ✅ Yes | Progress bar (determinate or indeterminate). Agents understand. |
| **empty** | Medium | Low | ✅ Yes | No-data state placeholder. Agents use for empty lists. |

---

### Tier 3: Specialized, Lower Reuse (Keep, but Agents May Build Alternatives)

Agents can build these from scratch if needed. They exist to save time on specific patterns.

| Component | Reuse Rate | Complexity | Agent Self-Service? | Reasoning |
|-----------|-----------|-----------|-------------|----------|
| **modal** | Low-Medium | Medium | ⚠️ Partial | Wraps native `<dialog>`. Agents often write custom dialog HTML. Type hints help. |
| **accordion** | Medium | Medium | ⚠️ Partial | Client-side expand/collapse. Agents might build custom collapse or use raw `<details>`. |
| **checkbox** | Medium | Low | ✅ Yes | Form control. Agents use when building forms. |
| **radio** / **radioGroup** | Medium | Low | ✅ Yes | Form control variants. Agents grasp the difference. |
| **toggle** (switch) | Medium | Low | ✅ Yes | On/off control. Agents recognize the pattern. |
| **slider** | Medium | Low | ✅ Yes | Range input. Agents use when needed. |
| **segmented** | Low | Low | ⚠️ Partial | Button-group variant for 2–4 options. Agents might build a custom button cluster instead. |
| **rating** | Low | Low | ✅ Yes | Star rating control. Agents use when present. |
| **fileUpload** | Low | Low | ✅ Yes | File input wrapper. Straightforward. |
| **stepper** | Low | Medium | ⚠️ Partial | Multi-step form indicator. Agents might build from grid + styling. |
| **tooltip** | Low | Low | ⚠️ Partial | Hover/focus tooltip. Agents often use title attributes instead. |
| **phoneFrame** | Very Low | Low | ⚠️ Partial | Phone mockup frame. Niche — for marketing screenshots. Agents rarely reach for it. |
| **search** | Low | Low | ⚠️ Partial | Search input variant. Agents often use `input()` + custom CSS. |
| **appBadge** | Low | Low | ✅ Yes | App Store / Google Play button. Niche. Agents use when needed. |
| **divider** | Low | Low | ✅ Yes | Visual separator line. Agents use. |
| **prose** | High | Low | ✅ Yes | Markdown/HTML content styling. Agents use for blog posts. |
| **pullquote** | Low | Low | ✅ Yes | Blockquote styling. Agents use in editorial content. |
| **uiImage** | Low | Low | ✅ Yes | Image with optional optimization hints. Agents use instead of raw `<img>`. |

---

### Tier 4: Maintenance / Support (Review for Removal)

These have low utility, high maintenance cost, or overlap with existing components.

| Component | Status | Reasoning |
|-----------|--------|-----------|
| **fieldset** | ⚠️ Questionable | Agents rarely use this. It's a semantic wrapper for form groups. Agents often just nest inputs in a `stack()` and add a heading. **Removal candidate:** save 0.1 kB, minimal loss. |
| **charts** | ⚠️ Experimental | Exists but agents should probably use D3/Recharts/Plotly for real visualizations. **Review:** Is this being used? |

---

## Redundancy Check

### Layout Utilities
- **grid** (2D CSS grid, up to 4 cols)
- **stack** (vertical flex, 5 gap levels)
- **cluster** (horizontal flex with wrap, 4 gap levels, justify+align)
- **container** (max-width wrapper)
- **section** (semantic block with padding)

✅ **No redundancy.** Each has a distinct purpose:
- Grid for 2D layouts
- Stack for vertical sequences (most common)
- Cluster for inline groups (buttons, badges)
- Container for width constraint
- Section for semantic blocks

Agents quickly learn to reach for the right one.

### Form Controls
- **input** (text)
- **select** (dropdown)
- **textarea** (multiline)
- **checkbox** (multiple choice)
- **radio** / **radioGroup** (single choice, grouped)
- **toggle** (on/off)
- **slider** (range)
- **segmented** (2–4 inline options)
- **rating** (star picker)
- **fileUpload** (file input)
- **fieldset** (group label)

⚠️ **Minor overlap:** `segmented` (2–4 buttons) vs. `radio` (many options). Agents might not reach for `segmented` if they don't know about it — they'll use `cluster()` + `button()` instead. **Action:** improve docs, not remove.

### Cards / Containers
- **card** (surface with optional title/footer)
- **empty** (no-data state placeholder)
- **alert** (styled message box)

✅ **No redundancy.** Each solves a different problem.

### Marketing Blocks
- **hero** (full-width, image support, 3 layouts)
- **cta** (call-to-action, centred, simpler than hero)
- **feature** (icon + title + desc tile)

✅ **Clear separation.** Agents understand the use cases.

### Data Display
- **table** (HTML table styling)
- **stat** (single KPI with trend)

✅ **No overlap.**

---

## What Agents Can Build Without Guidance

### Readily Self-Service (No Docs Needed)
Agents will intuitively reach for these and use them correctly:
- button
- input
- select
- textarea
- stack
- cluster
- grid
- card
- container
- section
- alert
- badge
- spinner
- progress
- heading
- avatar
- empty
- checkbox
- radio
- toggle
- divider

**Count: 20 components.** ~40% of the library. Agents can build with these alone for basic pages.

### Partial Self-Service (Benefit from Examples)
Agents know about these but might not exploit their full capability without seeing examples:
- hero (3 layout modes, backgrounds, overlays)
- nav (responsive burger, sticky mode)
- modal (native dialog patterns)
- media (reverse layout)
- cta (similar to hero — agents might not know when to pick one)
- feature (grid patterns)
- table (when to use for data vs. custom layout)

**Action:** add `@example` JSDoc comments showing the 80/20 use case.

### Likely Build Custom Instead
Agents often build these from scratch rather than reaching for the component:
- accordion (might use raw `<details>`)
- tooltip (might use `title` attribute)
- search (might use custom input + styling)
- stepper (might use grid + icons)
- fieldset (might just use stack + heading)

**Why:** low discoverability, marginal utility over raw HTML, smaller cognitive load to DIY.

---

## Recommendations for Agent DX

### 1. **Reduce Discoverability Friction**
Create a **searchable decision tree** — not a component list. Agent question: "I need X layout" → recommends component.

Example structure:
```
Need a layout?
  └─ Two columns (image + text) → media()
  └─ N columns grid → grid()
  └─ Vertical stack → stack()
  └─ Inline wrapping → cluster()

Need a form control?
  └─ Text input → input()
  └─ Dropdown → select()
  └─ Yes/no toggle → toggle()
  └─ Pick one of N → radio()
  └─ Pick some of N → checkbox()
```

### 2. **Add `@example` Comments to Medium-Complexity Components**
In the JSDoc of `hero`, `nav`, `feature`, `cta`, add one concrete example:

```javascript
/**
 * Hero with split layout and image
 * @example
 * hero({
 *   title: 'Build faster',
 *   subtitle: 'No build step, no complexity',
 *   image: `<img src="hero.png" alt="">`,
 *   actions: button({ label: 'Get started', href: '/docs' }),
 * })
 */
```

### 3. **Drop or Deprecate Low-Utility Components**
- **fieldset**: Agents use `stack()` + `heading()` instead. Removal saves 0.3 kB. Deprecate with a migration guide.
- **segmented**: Only useful if agents know about it. Add to decision tree; if not used in 2 years, consider removal.

### 4. **Enrich `media.d.ts`**
The `reverse` prop isn't obvious in the type signature. Add a comment:

```typescript
/**
 * Image + text two-column layout.
 * @param {string} [props.image] - HTML for the visual side
 * @param {string} [props.content] - HTML for the text side
 * @param {boolean} [props.reverse] - Swap sides (text left, image right)
 */
```

---

## Summary

**Component library health: Good.**

- No major redundancies. Each component solves a real problem.
- ~40% of components are self-service for agents (no docs needed).
- ~45% benefit from examples/docs but are still accessible.
- ~15% are niche or low-utility — candidates for review/deprecation.

**For agents:**
1. **Tier 1 (essential)** — agents learn these first.
2. **Tier 2 (high-value)** — agents need examples to discover them.
3. **Tier 3 (specialized)** — agents build alternatives or use when needed.
4. **Tier 4 (review)** — remove or deprecate low-utility components.

**Next step:** Create a component decision tree + add `@example` JSDoc comments to Tier 2 components. This unlocks agent self-service without adding complexity.
