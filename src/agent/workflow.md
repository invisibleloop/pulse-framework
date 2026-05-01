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

### 3a — Announce before writing

Before writing any file, output a build brief so the user can see what is being constructed and catch misunderstandings before minutes of work are lost. Format:

```
Building: <page name> (<route>)
State:     <fields and types, or "none">
Mutations: <list, or "none">
Actions:   <list with brief description, or "none">
Server:    <fetcher names and what they fetch, or "none">
View:      <key sections / landmarks>
Files:     <list of files that will be written>
```

Output this before making any tool calls. Do not skip it for "simple" pages — a one-liner is fine for simple pages, but always output something.

### 3b — Write

Write each file using the **Write tool** — not `pulse_create_page`. This shows the user a readable diff. Before each file write, output a one-line status (present-progressive, no tick — the work hasn't happened yet):

```
Writing src/pages/my-page.js...
```

After the Write tool completes, call `pulse_create_page(name)` to register the page. Only after that call succeeds output:

```
✓ src/pages/my-page.js written and registered.
```

**Rule: never output `✓` before the tool call that confirms the result. Use present-progressive (`Writing...`, `Running...`, `Checking...`) for pre-tool announcements.**

If multiple files are needed (spec + shared component, spec + test stub, etc.), announce and write them one at a time with a status line before each.

---

## Phase 4 — Validate (pass gate)

Run `pulse_validate` on the spec file.

- **If it passes:** output `✓ Validation clean — checking browser...` and continue.
- **If it fails:** fix every error and every warning, then re-run. Repeat until clean. Do not continue until validation is clean.

---

## Phase 5 — Browser check (pass gate)

**After every file edit, restart the server and reload the browser before checking anything.** The dev server auto-restarts on file changes but the browser tab stays stale. Always:
1. Call `pulse_restart_server` — waits for the server to be ready
2. Call `navigate_page` with the page URL — reloads the browser tab

Do this before every screenshot, console check, or visual inspection. Never debug a problem that might just be a stale tab.

**Run `/verify` now — as soon as the first build is working.** Do not defer it to the end. Do not execute these steps manually.

`/verify` is the canonical implementation of phases 4–7: it validates, screenshots, runs Lighthouse (desktop + mobile), runs the performance trace (LCP + CLS), checks console errors, runs `pulse_review`, and — critically — **writes the `.pulse-verified` stamp** at the end. Running the steps manually without writing the stamp will cause the stop hook to block.

Pass gates (all must be met before continuing to Phase 6):
- Screenshot: no layout or rendering issues
- Lighthouse desktop: Accessibility, Best Practices, SEO all 100
- Lighthouse mobile: same pass bar
- **CLS: 0.00** — any layout shift is a blocker; fix it before proceeding
- LCP: measured and reported; flag any fixable insight (render-blocking resources, large image delay)
- No console errors

**If any gate fails:** fix the issue and run `/verify` again. Repeat until all gates pass.

Output after passing: `✓ Verified — writing tests...`

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

> Note: `/verify` includes the review step (`pulse_review`) — if you ran `/verify` and it passed cleanly, the Review Agent has already run. You do not need to invoke it again separately.

---

## Phase 8 — Fix review issues

Fix every issue raised by the Review Agent. If the fixes touch the spec or view, run `/verify` again — it re-runs validation, Lighthouse, the performance trace, console check, and review in one pass and writes a fresh stamp.

Only declare the task done after phase 8 is complete and all gates still pass.

---

## Gate summary

```
Phase 1  Understand          (no gate — always run)
Phase 2  Plan                gate: user confirmation
Phase 3  Build               announce brief → write files (no gate, but always narrate)
Phase 4  Validate            gate: pulse_validate clean
Phase 5  Browser             gate: Lighthouse 100/100/100 (A/BP/SEO) + CLS 0.00, desktop + mobile
Phase 6  Tests               gate: all tests pass
Phase 7  Review Agent        (only reached after phases 4–6 all pass)
Phase 8  Fix + re-verify     gate: all gates still pass
```
