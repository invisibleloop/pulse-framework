# Component Deprecation & Review Plan

Based on the components audit, these components are candidates for deprecation or are flagged for review.

## Tier 1: Deprecation Candidates (Low utility, high maintenance cost)

### `fieldset`
- **Status:** Deprecation candidate
- **Why:** Agents rarely use it. They instinctively wrap form fields in `stack()` + `heading()` instead. The `<fieldset>` semantic wrapper adds minimal value.
- **Replacement:** `stack()` + `heading()`
- **Example:**
  ```js
  // Instead of:
  fieldset({ legend: 'Contact info', content: '...' })

  // Use:
  stack({
    gap: 'md',
    content: `
      ${heading({ level: 3, text: 'Contact info' })}
      ${input({ label: 'Email', name: 'email' })}
      ${input({ label: 'Phone', name: 'phone' })}
    `,
  })
  ```
- **Migration path:** Add a deprecation warning to `fieldset()` JSDoc. Keep it working for 2+ versions. Flag in docs.
- **Bundle savings:** ~0.3 kB (negligible, but maintenance cost > value).

---

### `segmented`
- **Status:** Review — decide after measuring usage
- **Why:** Niche component for 2–4 inline button-like options. Agents don't reach for it; they use `cluster()` + `button()` instead. Hard to discover.
- **Replacement:** `cluster()` with `button()` group (more flexible, agents know how to use it)
- **Example:**
  ```js
  // Instead of:
  segmented({
    name: 'size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
  })

  // Use:
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

  // Or: use radio() if you want full component styling
  radio({
    name: 'size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
  })
  ```
- **Decision tree:** Remove from decision tree. If usage data shows real adoption, keep. Otherwise, deprecate in 6 months.
- **Bundle savings:** ~0.2 kB.

---

## Tier 2: Review for Feature Bloat (Nice-to-have, rarely used)

### `tooltip`
- **Status:** Review — consider deprecation or simplification
- **Why:** Agents often use native `title` attribute on elements instead. The component adds complexity without solving a widespread pain point. Hover interactions are harder to test than other patterns.
- **Usage:** Very low in practice. Appears in <1% of specs.
- **Decision:** If not used in next quarter, deprecate.

---

### `phoneFrame`
- **Status:** Keep (niche, but legitimate)
- **Why:** Marketing sites specifically use this for app screenshots. Agents building landing pages reach for it. Very specialized, not a maintenance burden.
- **Keep:** Yes, because it solves a real (if narrow) problem.

---

### `stepper`
- **Status:** Keep, but add discovery
- **Why:** Agents do build multi-step forms, but they often use custom layouts instead of `stepper()`. Not in decision tree. Add an example.
- **Action:** Add to decision tree under "Multi-step progress indicator". Include example.

---

### `search`
- **Status:** Review — may be redundant with `input()`
- **Why:** `search()` is just `input()` with a search icon. Agents typically use `input({ type: 'search' })` or `input()` + custom icon.
- **Decision:** Check usage. If <5 uses across codebase, deprecate and recommend `input({ type: 'search', icon: iconSearch() })`.

---

### `charts`
- **Status:** Keep, but unclear scope
- **Why:** Exists but agents should use D3/Recharts/Plotly for real visualizations. This may be aspirational rather than production-ready.
- **Action:** Clarify scope. If it's meant to be minimal sparklines/simple bar charts, document it clearly. If it's meant to be a full charting library, consider removing (it's out of scope).

---

## Tier 3: Marginal Candidates (Low use, but defensible)

### `appBadge`
- **Status:** Keep, but niche
- **Why:** App Store / Google Play badges are specific to mobile-first brands. Not all sites need them, but those that do absolutely need the correct styling and branding. Agents use it when relevant.
- **Keep:** Yes.

---

### `emptyState`
- **Status:** Keep
- **Why:** Agents use this for "no data" views. It's a real pattern, even if low-frequency.
- **Keep:** Yes.

---

### `accordion`
- **Status:** Keep, but agents may build alternatives
- **Why:** `<details>` is native and simple. Agents understand it. Component adds styling. Some agents prefer raw HTML; others prefer the component. No strong reason to remove.
- **Keep:** Yes.

---

## Implementation Plan

### Phase 1: Mark for Review (This sprint)
- Add deprecation notices to `fieldset`, `segmented`, `tooltip` JSDoc comments.
- Update decision tree to remove `fieldset` (point to `stack()` + `heading()`).
- Add `stepper` and `search` to decision tree with discovery examples.
- Clarify scope of `charts` in documentation.

### Phase 2: Measure Usage (2 weeks)
- Run grep to find usage of `fieldset`, `segmented`, `tooltip`, `search` in examples and test specs.
- Report counts: how many real uses? How many are in docs only?

### Phase 3: Decision (2 weeks)
- If `fieldset` usage: <5 specs → deprecate in 0.21.0
- If `segmented` usage: <5 specs → deprecate in 0.21.0
- If `tooltip` usage: <3 specs → deprecate in 0.21.0
- If `search` usage: <5 specs → deprecate and recommend `input({ type: 'search' })` in 0.21.0

### Phase 4: Migration (0.21.0 release)
- Add deprecation warnings to JSDoc.
- Update docs to point agents to replacements.
- Keep components working (no breaking change yet).
- Flag in CHANGELOG under "Deprecations".

### Phase 5: Removal (0.22.0, 3 months later)
- Remove deprecated components from export.
- Remove from types.
- Update docs.
- Bump major version (or minor if feature set is stable enough).

---

## Success Metrics

- **Bundle size reduction:** Target ~1 kB savings from removing 3–5 low-utility components.
- **Agent clarity:** Decision tree covers 90%+ of real use cases. Agents spend <5 minutes discovering the right component.
- **Maintenance burden:** Fewer edge-case components = less QA, fewer bug reports.

---

## FAQ

**Q: Why remove components instead of just leaving them?**  
A: Each component adds to the mental model agents must maintain. A leaner API is faster to learn and harder to misuse. This is especially true for agent-first development—every extra component is a decision point.

**Q: Will existing users break?**  
A: Only after 0.22.0 (3 months out). Deprecations are warnings first. Agents have time to migrate.

**Q: What if a deprecated component turns out to be popular?**  
A: Undeprecate it. The plan is flexible based on evidence.
