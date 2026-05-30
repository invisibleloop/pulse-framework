# Build Workflow

---

## Quick decision tree

| Situation | Start here |
|---|---|
| New site, new branded page, or "build me X from scratch" | `pulse_intake` → `pulse_sketch` → `pulse_intent` → build |
| Editing an existing page, adding a section, fixing a bug | Go straight to Step 1 — Understand |
| "Add X to the existing Y" (one-liner) | Read the relevant file, make the change, run `/verify` |
| Stuck on which component to use | `pulse_intent("describe what I'm building")` |
| Colours failing contrast / unsure about palette | `pulse_check_contrast` |
| Something looks wrong in the browser | `pulse_restart_server`, then `/verify` |
| Lighthouse < 100 | Fix the flagged audit, run `/verify` again — do not skip to commit |

---

## New project or new page? Start with Intake

For any **new page, landing page, or branded site**, run the intake sequence first:

```
0. pulse_extract_inspiration(url/image) → structured design brief  [if user shares reference]
1. pulse_intake(name, pitch, features, ...)   → product brief + contrast check
2. pulse_sketch(brief, vibe?, antiStyle?)     → 3 layout directions to choose from
3. pulse_intent(description)                  → archetype + scaffold + guide list
```

- **`pulse_extract_inspiration`** — call this first if the user shares a URL, site name, or image they like. Gives you a structured extraction template: visit the URL or analyse the image with your vision tools, extract colours, layout, typography, and feel, then feed those findings into pulse_intake. If no inspiration is shared, skip this step.
- **`pulse_intake`** — captures the real content (name, pitch, features, palette, vibe, what it should NOT look like). Returns a brief with copy-ready content and early contrast warnings. Always ask the user one question at a time — never multi-choice for open-ended questions.
- **`pulse_sketch`** — generates 3 structurally distinct layout directions (full-bleed, asymmetric split, typography-only, editorial, dense grid, story scroll, content-first). **Call this before writing any code.** Prevents defaulting to centred hero + three-column features every time.
- **Skip `pulse_sketch` only** when the vibe is `corporate` or `minimal` AND the user hasn't expressed any structural preference. For `playful`, `bold`, `brutalist`, `retro`, or `neon` vibes, `pulse_sketch` is mandatory — templates have default section orders that actively fight these vibes.
- **`pulse_intent`** — maps the chosen direction to a spec scaffold and tells you which guides to read.

For **small edits, bug fixes, or "add X to existing Y"** — skip intake/sketch and go straight to Step 0 below.

---

## Step 0 — Intent (always first for non-trivial builds)

After intake + sketch (or directly for targeted tasks), call `pulse_intent`:

```
pulse_intent("a settings page with profile editing and a save action")
```

It returns a matched archetype, recommended components, a starter spec scaffold, and which guide sections to read. This replaces hunting through guide sections manually.

If the user's request is already very specific (a one-liner edit, a bug fix, "add X to the existing Y"), skip this and go straight to Understand.

---

## Step 1 — Understand

Call `pulse_list_structure` to see what already exists. Fetch only the guide sections relevant to your intent (the `pulse_intent` response tells you which ones).

Do not fetch every guide section for every task. Fetch what you need.

---

## Step 2 — Plan

Decide the complexity tier (see below) and confirm with the user if the task is non-trivial. Output a concise plan:

- Route, state shape, mutations/actions, server fetchers
- Which UI components you will use
- Files you will create or modify

**Skip confirmation for trivially small tasks** (add a button, fix a label, swap a component). When in doubt, confirm.

**When asking the user questions:** ask one question at a time. If you present choices, use at most 4 options — the `ask_user` tool enforces this limit and will error if exceeded. For open-ended questions (names, copy, features, hex colours), ask as plain prose with no choices at all.

---

## Complexity tiers

Not every task needs all 8 phases. Match the tier to the task:

### Tier 1 — Simple (static or read-only content)

*Applies to:* landing pages, blog posts, profile pages, any page with no mutations or actions.

| Phase | Action | Gate |
|---|---|---|
| 1 | Intent + Understand | — |
| 2 | Build | announce brief → write files |
| 3 | Validate | `pulse_validate` clean |
| 4 | Browser | screenshot + Lighthouse desktop + mobile (100/100/100) |

No tests required for pure view specs with no logic. Add tests if the view has non-trivial helper functions.

### Tier 2 — Standard (interactive, single-purpose)

*Applies to:* forms, CRUD pages, settings, auth flows, dashboards without complex state machines.

| Phase | Action | Gate |
|---|---|---|
| 1 | Intent + Understand | — |
| 2 | Plan | user confirmation (skip if unambiguous) |
| 3 | Build | announce brief → write files |
| 4 | Validate | `pulse_validate` clean |
| 5 | Browser | screenshot → `pulse_design_review` (if intake ran) → `pulse_layout_review` → Lighthouse desktop + mobile (100/100/100) + CLS 0.00 |
| 6 | Tests | mutations, view landmarks, any utility functions |
| 7 | Code review | `pulse_review` — only after 4–6 pass |

### Tier 3 — Complex (multi-step, shared state, or security-sensitive)

*Applies to:* multi-step wizards, pages with guards and auth, store-connected pages, anything touching sensitive data or complex branching state.

All phases as originally defined — full 8-phase flow with every gate.

| Phase | Action | Gate |
|---|---|---|
| 1 | Intent + Understand | — |
| 2 | Plan | **user confirmation required** |
| 3 | Build | announce brief → write files |
| 4 | Validate | `pulse_validate` clean |
| 5 | Browser | screenshot → `pulse_design_review` (if intake ran) → `pulse_layout_review` → Lighthouse 100/100/100 + CLS 0.00, desktop + mobile |
| 6 | Tests | full coverage: mutations, actions, guards, view |
| 7 | Code review | `pulse_review` |
| 8 | Fix + re-verify | re-run all gates |

**If in doubt, default to Tier 2.** Choosing a lower tier than the task warrants means you'll hit problems at gates — the tiers are a shortcut, not a way to skip quality.

---

## Phase 3 — Build

### 3a — Decide: components or creative override

**Two valid modes — choose one and state it in the build brief:**

**Mode A — Components first (default)**
Use Pulse UI components for all standard UI patterns. Before writing any view HTML, grep `src/ui/index.js` for the components you need:

```bash
grep -E "^export" src/ui/index.js | head -20
```

Or use the guide-components table. Never write these patterns from scratch in Mode A:

- Hero section → `hero()`
- Product/service cards → `card()`
- Image + text layouts → `media()`
- Horizontal strips → `banner()`
- Feature tiles → `feature()`
- Testimonials → `testimonial()`
- CTAs → `cta()`

If you're about to type `class="hero"` or `class="product-card"` in Mode A, stop — use the component instead.

**Mode B — Creative override (raw HTML throughout)**
When the design intent calls for a more expressive, unconventional, or typographically-driven layout that components would constrain, you may build with raw HTML throughout. This is a deliberate design decision, not a shortcut.

Rules for Mode B:
- Load `/pulse-ui.css` in `meta.styles` — the token system is still required
- Functional atoms (`button`, `input`, `badge`, `modal`) should still come from components unless there is a specific design reason
- The quality gate is 100/100/100/100 Lighthouse on both desktop and mobile — this replaces the component checklist as the pass bar

Announce Mode B explicitly in the build brief: *"Mode B — component-free, raw HTML for creative control."*

### 3b — Announce before writing

Before writing any file, output a build brief:

```
Building:   <page name> (<route>)
Mode:       A — components first | B — creative override (raw HTML, reason: ...)
State:      <fields and types, or "none">
Mutations:  <list, or "none">
Actions:    <list with brief description, or "none">
Server:     <fetcher names and what they fetch, or "none">
Components: <which UI components you will use, or "none — Mode B">
View:       <key sections / landmarks>
Files:      <list of files that will be written>
```

One-liners are fine for simple pages, but always output something. **Declaring the mode upfront** makes the design intent explicit and prevents unnecessary component-reinvention warnings during review.

### 3c — Write

Write each file using the **Write tool** — not `pulse_create_page`. This shows the user a readable diff. Before each file write, output a one-line status (present-progressive):

```
Writing src/pages/my-page.js...
```

After the Write tool completes, call `pulse_create_page(name)` to register the page. Only after that call succeeds output:

```
✓ src/pages/my-page.js written and registered.
```

### 3d — Suggest (optional but recommended)

After writing the first draft, call `pulse_suggest(content)` before running the hard validator. It catches obvious omissions collaboratively — a second opinion, not a gate.

**Rule: never output `✓` before the tool call that confirms the result.**

---

## Phase 4 — Validate (pass gate)

Run `pulse_validate` on the spec file.

- **If it passes:** output `✓ Validation clean — checking browser...` and continue.
- **If it fails:** fix every error and every warning, then re-run. Repeat until clean.

---

## Phase 5 — Browser check (pass gate)

**After every file edit, restart the server and reload the browser before checking anything.** The dev server auto-restarts on file changes but the browser tab stays stale. Always:
1. Call `pulse_restart_server` — waits for the server to be ready
2. Call `navigate_page` with the page URL — reloads the browser tab

Do this before every screenshot, console check, or visual inspection. Never debug a problem that might just be a stale tab.

**Run `/verify` now — as soon as the first build is working.** Do not defer it to the end. Do not execute these steps manually.

`/verify` validates, screenshots, runs Lighthouse (desktop + mobile), runs the performance trace (LCP + CLS), checks console errors, runs `pulse_review`, and writes the `.pulse-verified` stamp. Running steps manually does not write the stamp.

> **Lighthouse pre-flight:** `/verify` calls `pulse_build` automatically before running Lighthouse, and audits against the production server on port 3001. If you ever call `lighthouse_audit` manually outside `/verify`, you must first run `pulse_build` and navigate to `http://localhost:3001/your-route`. Auditing the dev server (port 3000) will produce misleading results.

### ⛔ After every screenshot — mandatory steps before continuing

Taking a screenshot is NOT the end of phase 5. After every screenshot, you **must** run:

1. `pulse_design_review` (if `pulse_intake` ran) — work through all 7 signals, fix any Fail
2. `pulse_layout_review <url>` — 390/768/1280px overflow, broken images, collapsed sections
3. `/verify` — Lighthouse desktop + mobile (100/100/100) + CLS 0.00 + `pulse_review`

**Do not report the page as done until `/verify` writes the `.pulse-verified` stamp.** Skipping Lighthouse means broken contrast, missing landmarks, and Best Practices failures ship to the user.

Pass gates:
- Screenshot: no layout or rendering issues
- Design review: all 7 signals pass (or intake didn't run)
- Layout review: no overflow, broken images, or collapsed sections at any viewport
- Lighthouse desktop: Accessibility, Best Practices, SEO all 100
- Lighthouse mobile: same
- **CLS: 0.00** — any layout shift is a blocker
- No console errors

**If any gate fails:** fix and run `/verify` again.

**Troubleshooting browser profile lock:** If you see "browser already running" or chrome profile errors, another session is using the same Chrome profile. This is a `chrome-devtools-mcp` limitation — only one session can use the profile at a time. Ask the user to close other Claude sessions, or wait for the other session to finish.

**CSS-only changes after verification:** If you've already run `/verify` successfully and the user asks for minor CSS tweaks (margins, colours, spacing), you must run the full `/verify` workflow again — the stop hook checks the file mtime against the stamp. There is no lighter CSS-only check. This is by design: even CSS changes can affect CLS, colour contrast, or readability.

---

## Phase 6 — Tests (pass gate, Tier 2+)

Write tests for every spec you created or modified. At minimum:

- Each mutation as a pure function
- View renders expected HTML landmarks
- Any utility functions defined in the spec

Run the tests. Fix every failure.

---

## Phase 7 — Review (Tier 2+)

Only invoke `pulse_review` after phases 4–6 all pass. It checks the code for correctness, security, accessibility, DRY violations, and checklist adherence.

> Note: `/verify` includes the review step — if you ran `/verify` and it passed, the Review Agent has already run.

---

## Phase 8 — Fix review issues (Tier 3)

Fix every issue raised. If fixes touch the spec or view, run `/verify` again.

Only declare the task done after all gates still pass.

---

## Summary

```
New project / new page:
  pulse_extract_inspiration  → (if user shares a URL or image) extract palette/layout/feel
  pulse_intake               → capture real content, palette, vibe, anti-style
  pulse_sketch               → choose 1 of 3 structural layout directions
  pulse_intent               → get scaffold + guide list

Targeted edit / bug fix:
  pulse_intent    → (or skip entirely for trivial changes)

Step 1   Understand        pulse_list_structure + relevant guides
Step 2   Plan             confirm with user if non-trivial

Tier 1  Simple     → phases 3 → 4 → 5
Tier 2  Standard   → phases 3 → 4 → 5 → 6 → 7
Tier 3  Complex    → phases 3 → 4 → 5 → 6 → 7 → 8
```

