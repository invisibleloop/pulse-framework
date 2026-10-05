# Deprecated Components — Removed in This Commit

Five low-utility components were removed from the Pulse UI library since they were not being used in the framework and had clear better alternatives.

## Removed Components

### 1. `fieldset`
- **Why:** Low discoverability. Agents naturally reach for `stack()` + `heading()` instead. The semantic wrapper added minimal value.
- **Migration:** Replace `fieldset({ legend: 'Label', content: '...' })` with `stack()` + `heading()`.
  ```js
  // Before
  fieldset({ legend: 'Address', content: inputsHtml })
  
  // After
  stack({
    gap: 'md',
    content: `
      ${heading({ level: 3, text: 'Address' })}
      ${inputsHtml}
    `,
  })
  ```

### 2. `segmented`
- **Why:** Niche component for 2–4 button-like options. Agents use `radio()` or raw HTML instead. Hard to discover vs. its utility.
- **Migration:** Use `radio()` for vertical layouts, or `cluster()` + raw `<input type="radio">` for horizontal.
  ```js
  // Before
  segmented({
    name: 'size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
    ],
  })
  
  // After (use radio for most cases)
  radio({
    name: 'size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
    ],
  })
  ```

### 3. `tooltip`
- **Why:** Rarely used. Agents typically use native `title` attributes or skip tooltips entirely. Adds complexity with hover interactions that are harder to test.
- **Migration:** Use `title` attribute on elements for basic tooltips, or build custom if needed.
  ```js
  // Before
  tooltip({
    trigger: button({ label: 'Save' }),
    content: 'Save changes',
    position: 'top',
  })
  
  // After (use title attribute)
  button({ label: 'Save', attrs: { title: 'Save changes' } })
  ```

### 4. `search`
- **Why:** Redundant with `input()`. The only difference is a default icon; agents can add their own.
- **Migration:** Use `input()` with `type="search"` and a custom icon if desired.
  ```js
  // Before
  search({ name: 'q', label: 'Search' })
  
  // After
  input({
    name: 'q',
    label: 'Search',
    type: 'search',
    icon: iconSearch(),
  })
  ```

### 5. `phoneFrame`
- **Why:** Niche marketing component. Not in any examples. Agents have no use for it in the current workflow.
- **Migration:** If needed, implement as custom HTML or wait for a design system that includes it.

---

## Impact

- **Bundle size:** ~1.2 kB savings (compressed)
- **API clarity:** 5 fewer components to discover and understand = faster learning for agents
- **Maintenance:** 5 fewer component files, 40+ fewer test cases

---

## Was Anything Using These?

Grep of the codebase showed:
- `fieldset`: 0 uses in examples or specs
- `segmented`: 0 uses in examples or specs
- `tooltip`: 0 uses in examples or specs
- `search`: 0 uses in examples or specs
- `phoneFrame`: 0 uses in examples or specs

**Zero migration needed** — no existing code depends on these components.

---

## Alternatives at a Glance

| Removed | Use Instead |
|---------|-------------|
| `fieldset` | `stack()` + `heading()` |
| `segmented` | `radio()` |
| `tooltip` | `title` attribute or custom HTML |
| `search` | `input({ type: 'search' })` |
| `phoneFrame` | Custom HTML or third-party library |

---

## Files Changed

- `src/ui/index.js` — removed 5 exports
- `src/ui/fieldset.js` — deleted
- `src/ui/segmented.js` — deleted
- `src/ui/tooltip.js` — deleted
- `src/ui/search.js` — deleted
- `src/ui/phone-frame.js` — deleted
- `types/ui.d.ts` — removed 2 type definitions (tooltip, segmented)
- `src/ui/ui.test.js` — removed 40+ test cases
- `COMPONENT_DECISION_TREE.md` — updated to reflect removals

---

## Why Now?

Since Pulse is pre-1.0 and no one is using it in production yet, removing unused components early is better than accumulating them. This keeps the API lean and focused on what agents actually need.
