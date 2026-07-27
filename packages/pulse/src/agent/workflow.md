# Build Workflow

---

## Quick decision tree

| Situation | Start here |
|---|---|
| New site, new branded page, or "build me X from scratch" | `pulse_intake` → `pulse_sketch` → `pulse_intent` → build |
| Editing an existing page, adding a section, fixing a bug | Go straight to Step 1 — Understand |
| "Add X to the existing Y" (one-liner) | Read the relevant file, make the change, run `/verify` |
| Iterating on design before user approves | `/verify --quick` between rounds; full `/verify` once approved |
| Stuck on which component to use | `pulse_intent("describe what I'm building")` |
| Colours failing contrast / unsure about palette | `pulse_check_contrast` |
| Something looks wrong in the browser | `pulse_restart_server`, then `/verify --quick` |
| Lighthouse < 100 | Fix the flagged audit, run `/verify` again — do not skip to commit |

---

## New project or new page? Start with Intake

For any **new page, landing page, or branded site**, run the intake sequence first:

```
0. ASK:  "Do you have any design inspiration — a site you love, a screenshot, or a mood board
          image? Drop images into public/intake/ or paste a URL and I'll extract the design
          intent before we start."   ← MANDATORY. Ask this before doing anything else.
0b. pulse_extract_inspiration(url/image) → structured design brief  [if user supplies reference]
1. pulse_intake(name, pitch, features, ...)   → product brief + contrast check
2. pulse_sketch(brief, vibe?, antiStyle?)     → 3 layout directions to choose from
3. pulse_intent(description)                  → archetype + scaffold + guide list
```

- **Step 0 — Ask for inspiration first (mandatory):** Before calling any tool or presenting any plan, ask the user: *"Do you have any design inspiration — a site you love, a screenshot, or a mood board image? Drop images into `public/intake/` or paste a URL and I'll extract the design intent before we start."* Wait for the answer. Do not skip this question, even if the user's brief already seems detailed. Check `public/intake/` for any images already dropped there.
- **`pulse_extract_inspiration`** — call this after step 0 if the user supplies a URL, site name, or image they like. Also call it for any images already present in `public/intake/`. Gives you a structured extraction template: visit the URL or analyse the image with your vision tools, extract colours, layout, typography, and feel, then feed those findings into pulse_intake. If the user explicitly says they have no reference, skip this step.
- **`pulse_intake`** — captures the real content (name, pitch, features, palette, theme, vibe, what it should NOT look like). Returns a brief with copy-ready content and early contrast warnings. Always ask the user one question at a time — never multi-choice for open-ended questions. **Always ask light or dark** — Pulse renders dark when `meta.theme` is unset, so an unstated light design ships dark.
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

**Check `src/components/` for shared sections before building.** If a layout, nav, footer, CTA strip, or section you're about to write already exists there — or already exists inline in another spec — reuse or extract it now rather than writing a second copy. Catching duplication here is cheap; catching it at review (phase 7) means the expensive gates already ran against the duplicated version.

Do not fetch every guide section for every task. Fetch what you need.

---

## Step 2 — Plan

Decide the complexity tier (see below) and confirm with the user if the task is non-trivial. Output a concise plan:

- Route, state shape, mutations/actions, server fetchers
- **Theme: light or dark** — Pulse defaults to **dark** when `meta.theme` is unset. Decide now (ask the user if the brief doesn't say) — discovering a wrong theme at the screenshot costs a full edit → restart → re-approval cycle.
- Which UI components you will use
- Files you will create or modify

**Skip confirmation for trivially small tasks** (add a button, fix a label, swap a component). When in doubt, confirm.

**When asking the user questions:** ask one question at a time. If you present choices, use at most 4 options — question tools in agent hosts (e.g. Claude Code's AskUserQuestion) cap the number of choices and will error if exceeded. For open-ended questions (names, copy, features, hex colours), ask as plain prose with no choices at all.

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
| 4a | Design approval | screenshot → show user → **wait for approval** *(new-build only)* |
| 4b | Verify | `pulse_design_review` (if intake ran) → `pulse_layout_review` → Lighthouse desktop + mobile (100/100/100) |

No tests required for pure view specs with no logic. Add tests if the view has non-trivial helper functions.

### Tier 2 — Standard (interactive, single-purpose)

*Applies to:* forms, CRUD pages, settings, auth flows, dashboards without complex state machines.

| Phase | Action | Gate |
|---|---|---|
| 1 | Intent + Understand | — |
| 2 | Plan | user confirmation (skip if unambiguous) |
| 3 | Build | announce brief → write files |
| 4 | Validate | `pulse_validate` clean |
| 5a | Design approval | screenshot → show user → **wait for approval** *(new-build only)* |
| 5b | Verify | `pulse_design_review` (if intake ran) → `pulse_layout_review` → Lighthouse desktop + mobile (100/100/100) + CLS 0.00 |
| 6 | Tests | mutations, view landmarks, any utility functions |
| 7 | Code review | `pulse_review` — only after 5–6 pass |

### Tier 3 — Complex (multi-step, shared state, or security-sensitive)

*Applies to:* multi-step wizards, pages with guards and auth, store-connected pages, anything touching sensitive data or complex branching state.

All phases as originally defined — full flow with every gate.

| Phase | Action | Gate |
|---|---|---|
| 1 | Intent + Understand | — |
| 2 | Plan | **user confirmation required** |
| 3 | Build | announce brief → write files |
| 4 | Validate | `pulse_validate` clean |
| 5a | Design approval | screenshot → show user → **wait for approval** *(new-build only)* |
| 5b | Verify | `pulse_design_review` (if intake ran) → `pulse_layout_review` → Lighthouse 100/100/100 + CLS 0.00, desktop + mobile |
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
- Feature tiles → `feature()`
- Testimonials → `card({ content, footer })` with quote + avatar/name in the footer slot
- CTAs → `cta()`

If you're about to type `class="hero"` or `class="product-card"` in Mode A, stop — use the component instead.

**Reuse across specs (both modes):** one spec = one page; a site is many specs sharing code. Before writing a new section, check `src/components/` — and if a section you're writing already exists in another spec, extract it to `src/components/` *now* and import it from both, rather than pasting a copy. Same for CSS: a shared section's styles go in the shared `app.css` (listed in `meta.styles` by every spec that uses it), never duplicated into per-page stylesheets.

**Mode B — Creative override (raw HTML throughout)**
When the design intent calls for a more expressive, unconventional, or typographically-driven layout that components would constrain, you may build with raw HTML throughout. This is a deliberate design decision, not a shortcut.

**When to choose Mode B — use the component, unless:**
- The layout requires **full-viewport height or edge-to-edge bleed** that the component doesn't support (e.g. `hero()` doesn't fill the viewport)
- The design uses **custom gradient glows, parallax, or large-scale image fills** that the component would wrap in unwanted structure
- The vibe is **brutalist, retro, neon, paper, or typographic-editorial** and the structural feel would be actively fought by the component's default padding/spacing/radius
- The typography is **clamp-scaled display type** (e.g. `clamp(4rem, 10vw, 12rem)`) that breaks inside a component's internal box model
- The layout is **asymmetric or zone-based** (e.g. 70/30 split, overlapping elements, staggered grid) that no single component supports
- A **Figma/reference design was provided** that clearly departs from the component's output

**When to use the component (not a valid reason for override):**
- "The component doesn't have a perfect prop for this" — add a utility class or wrapper div instead
- "I want a slightly different colour or size" — override with CSS tokens
- "I'm not sure what the component looks like" — check the guide first
- "It's easier to write raw HTML" — this is never a valid reason

Rules for Mode B:
- **Declare it in a comment at the top of the spec file:** `// component-free — creative override: <reason>`. The review tool detects creative override by reading this comment from the source — without it, `pulse_review` will flag every component pattern as a violation even though you chose Mode B deliberately. Announcing the mode in chat is not enough; the comment must be in the file.
- Load `/pulse-ui.css` in `meta.styles` — the token system is still required
- Functional atoms (`button`, `input`, `badge`, `modal`) should still come from components unless there is a specific design reason
- The quality gate is Lighthouse 100 on Accessibility, Best Practices, and SEO (desktop and mobile) plus CLS 0.00 — this replaces the component checklist as the pass bar. Performance is reported but not gated.

Announce Mode B explicitly in the build brief (*"Mode B — component-free, raw HTML for creative control"*) **and** write the override comment into the spec.

### 3b — Announce before writing

Before writing any file, output a build brief:

```
Building:   <page name> (<route>)
Mode:       A — components first | B — creative override (raw HTML, reason: ...)
Theme:      light | dark (+ vibe, if any) — default is DARK when meta.theme is unset
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

### 3d — Suggest (recommended mid-build checkpoint)

After writing the first draft, call `pulse_suggest(content)` before running the hard validator. It catches obvious omissions collaboratively — a second opinion, not a gate. Then call `pulse_review(file, { quick: true })` for a lightweight structural pass (main landmark, data-event on inputs, missing onError, hex in view). Neither is a substitute for the full review, but catching issues here is faster than discovering them at Lighthouse.

If the user is iterating on the design (multiple rounds of changes before giving a final go-ahead), use `/verify --quick` between rounds — it validates, screenshots, checks console, and runs a quick code review without the 90-second Lighthouse cost. Save the full `/verify` for after the user explicitly approves the design.

**Rule: never output `✓` before the tool call that confirms the result.**

---

## Phase 4 — Validate (pass gate)

Run `pulse_validate` on the spec file.

- **If it passes:** output `✓ Validation clean — checking browser...` and continue.
- **If it fails:** fix every error and every warning, then re-run. Repeat until clean.

---

## Phase 5 — Browser check

**After every file edit, restart the server and reload the browser before checking anything.** The dev server auto-restarts on file changes but the browser tab stays stale. Always:
1. Call `pulse_restart_server` — waits for the server to be ready
2. Call `navigate_page` with the page URL — reloads the browser tab

Do this before every screenshot, console check, or visual inspection. Never debug a problem that might just be a stale tab.

---

### Phase 5a — Design approval *(new builds from `pulse_intake` only)*

**This phase applies when `pulse_intake` ran** — i.e. you are building a new page or site from scratch, not editing an existing one. For edits, bug fixes, or "add X to existing Y", skip to Phase 5b immediately.

1. Take a screenshot of the built page
2. Describe what you see in 2–3 plain sentences — layout structure, visual tone, key sections. Do NOT list features or code details.
3. **Ask the user directly:** *"Happy with the layout and direction, or any changes before I run tests and Lighthouse?"*
4. **Wait for their response before doing anything else.** Do not run design_review, layout_review, or Lighthouse until you have a clear go-ahead.

**How to wait without tripping the Stop hooks.** The project's Stop hooks (missing tests, coverage, verify stamp) block any turn that ends with unverified spec edits — they cannot tell "abandoning the work" from "pausing for the user's answer". So:

- **Always call `pulse_await_approval` immediately before asking** — regardless of whether you ask via a question tool or in plain prose. In some hosts (including Claude Code) even AskUserQuestion ends the turn and fires the Stop hooks. The marker is harmless if the turn doesn't end: it is simply consumed when the user replies.
- Then ask the question (question tool with choices where available, plain prose otherwise) and end your turn.
- **Never** respond to a `VERIFY REQUIRED` block by running `/verify` while your approval question is unanswered. The block does not override the approval gate — an unanswered question means the design is not approved, and Lighthouse on an unapproved design wastes ~90 seconds and pre-empts the user's changes.

**If the user requests changes:**
- Make the edits
- Take a new screenshot
- Describe what changed
- Ask again
- Repeat until approved — each iteration is design-only, no Lighthouse between rounds

**If the user approves (or says "looks good", "go ahead", "yes", etc.):**
- Continue to Phase 5b

> The point of this gate is to let the user redirect the design before expensive, slow checks run. A Lighthouse build takes ~90 seconds — do not start it until the user has seen and approved the visual result.

---

### Phase 5b — Full verification (pass gate)

**Run `/verify` now** (full mode — not `--quick`). Do not execute these steps manually.

`/verify` validates, screenshots, runs Lighthouse (desktop + mobile), runs the performance trace (LCP + CLS), checks console errors, runs `pulse_review`, and writes the `.pulse-verified` stamp. Running steps manually does not write the stamp.

> **Lighthouse pre-flight:** `/verify` calls `pulse_build` automatically before running Lighthouse, and audits against the production server on port 3001. If you ever call `lighthouse_audit` manually outside `/verify`, you must first run `pulse_build` and navigate to `http://localhost:3001/your-route`. Auditing the dev server (port 3000) will produce misleading results.

### ⛔ After design approval — mandatory steps before continuing

1. `pulse_design_review` (if `pulse_intake` ran) — work through all 7 signals, fix any Fail
2. `pulse_layout_review <url>` — 390/768/1280px overflow, broken images, collapsed sections
3. `/verify` — Lighthouse desktop + mobile (100/100/100) + CLS 0.00 + `pulse_review`

**Two different reviews — don't confuse them.** `pulse_design_review` is the *visual* review (7 signals) and runs **before** Lighthouse. `pulse_review` is the *code* review and runs **after** Lighthouse, always last. The canonical end-to-end order is:

```
pulse_validate → design approval → pulse_design_review → pulse_layout_review
  → pulse_build → Lighthouse desktop + mobile → performance trace
  → pulse_review → pulse_stamp
```

If a step's fixes touch the spec, re-run from `pulse_validate` — never re-run `pulse_review` on code that hasn't re-passed Lighthouse.

**Do not report the page as done until `/verify` writes the `.pulse-verified` stamp.** Skipping Lighthouse means broken contrast, missing landmarks, and Best Practices failures ship to the user.

Pass gates:
- Design approval: user has explicitly said they're happy with the layout
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

**Ordering:** `pulse_review` runs **after** Lighthouse, not before. Lighthouse catches contrast failures, missing landmarks, and Best Practices issues that `pulse_review` cannot detect statically. Fixing a Lighthouse failure may require spec edits — so the code review always comes last, against the final version of the code.

> Note: `/verify` includes the review step in the correct position — Lighthouse first (steps 6–7), then `pulse_review` (step 10). If you ran `/verify` and it passed, `pulse_review` has already run against the Lighthouse-passing version of the code.

---

## Phase 8 — Fix review issues (Tier 3)

Fix every issue raised. If fixes touch the spec or view, run `/verify` again.

Only declare the task done after all gates still pass.

---

## Summary

```
New project / new page:
  ASK first              → "Do you have any design inspiration — a site, screenshot, or
                            mood board? Drop into public/intake/ or paste a URL."
  pulse_extract_inspiration  → (if user supplies a URL or image, or images found in public/intake/)
  pulse_intake               → capture real content, palette, vibe, anti-style
  pulse_sketch               → choose 1 of 3 structural layout directions
  pulse_intent               → get scaffold + guide list

Targeted edit / bug fix:
  pulse_intent    → (or skip entirely for trivial changes)

Step 1   Understand        pulse_list_structure + relevant guides
Step 2   Plan             confirm with user if non-trivial

Tier 1  Simple     → phases 3 → 4 → 5a (design approval) → 5b (verify)
Tier 2  Standard   → phases 3 → 4 → 5a (design approval) → 5b (verify) → 6 → 7
Tier 3  Complex    → phases 3 → 4 → 5a (design approval) → 5b (verify) → 6 → 7 → 8

Phase 5a is skipped for edits, bug fixes, and "add X to existing Y".
```

