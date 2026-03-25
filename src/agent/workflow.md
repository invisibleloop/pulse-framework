# Build Workflow

Every task follows this sequence exactly. Each phase has a pass gate — you do not move to the next phase until the gate is cleared. Do not skip phases. Do not reorder them.

---

## Phase 1 — Understand

Before writing a single line of code:

1. Fetch `pulse://guide` for the guide index.
2. Fetch any topic sections you need (`pulse://guide/spec`, `pulse://guide/components`, etc.).
3. Call `pulse_list_structure` to see what pages and components already exist.

Do not guess about props, patterns, or rules. If you are unsure, fetch the relevant guide section.

---

## Phase 2 — Plan (confirmation gate)

Before building, output a concise plan:

- What page(s) or component(s) you will create or modify
- The route, state shape, mutations/actions, and server fetchers
- Which UI components you will use
- Any shared components you will create or reuse

Wait for the user to confirm or adjust the plan before writing any code.

**Skip this gate only if the task is unambiguous and small** (e.g. "add a delete button to the existing list page"). When in doubt, confirm.

---

## Phase 3 — Build

Write the spec and any related files (components, styles, tests skeleton). Follow the checklist in full. After each file is written, output a one-line status: `✓ Page written — validating...`

---

## Phase 4 — Validate (pass gate)

Run `pulse_validate` on the spec file.

- **If it passes:** output `✓ Validation clean — checking browser...` and continue.
- **If it fails:** fix every error and every warning, then re-run. Repeat until clean. Do not continue until validation is clean.

---

## Phase 5 — Browser check (pass gate)

1. Navigate to the page route in the browser.
2. Take a screenshot. Check it visually — layout, content, spacing, no raw unstyled HTML.
3. Check the browser console for errors (JS errors, failed network requests).
4. Run Lighthouse with `strategy: 'desktop'`. All three scores must be 100: Accessibility, Best Practices, SEO. The tool does not return a Performance score — use `performance_start_trace` separately if performance profiling is needed. Tell the user before calling Lighthouse — it takes 30–60 s.
5. Run Lighthouse with `strategy: 'mobile'`. Same pass bar.

**If any score is below 100:** fix the issue, reload, re-run Lighthouse. Repeat until both strategies pass 100/100/100. Do not continue until both pass.

Output after passing: `✓ Lighthouse 100/100/100 desktop + mobile — writing tests...`

---

## Phase 6 — Tests (pass gate)

Write tests for every spec you created or modified. At minimum:

- Each mutation as a pure function (assert the returned state shape)
- View renders expected HTML landmarks
- Any utility functions defined in the spec

Run the tests. Fix every failure. Repeat until all tests pass.

Output after passing: `✓ Tests passing — ready for review.`

---

## Phase 7 — Review

**Only invoke the Review Agent after all of the above gates have passed.** The reviewer must receive: passing validation, passing Lighthouse (desktop + mobile), and passing tests. Never hand off code that has not cleared every gate.

The Review Agent checks the code for correctness, security, accessibility, DRY violations, and adherence to the checklist. It returns a list of issues.

---

## Phase 8 — Fix review issues

Fix every issue raised by the Review Agent. If the fixes touch the spec or view:

- Re-run `pulse_validate`
- Re-run Lighthouse if visual or structural changes were made
- Re-run tests

Only declare the task done after phase 8 is complete and all gates still pass.

---

## Gate summary

```
Phase 1  Understand          (no gate — always run)
Phase 2  Plan                gate: user confirmation
Phase 3  Build               (no gate — write the code)
Phase 4  Validate            gate: pulse_validate clean
Phase 5  Browser             gate: Lighthouse 100/100/100 (Accessibility/Best Practices/SEO) desktop + mobile
Phase 6  Tests               gate: all tests pass
Phase 7  Review Agent        (only reached after phases 4–6 all pass)
Phase 8  Fix + re-verify     gate: all gates still pass
```
