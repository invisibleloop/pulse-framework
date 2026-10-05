---
name: build-page
description: "Scaffold a new Pulse page spec, validate it, and visually confirm it renders correctly. $ARGUMENTS Read `src/ui/index.js` to see what UI components are available before writing any HTML. Note which components apply to this page."
---

# Build Page

Scaffold a new Pulse page spec, validate it, and visually confirm it renders correctly.

## What to build

$ARGUMENTS

## Steps — follow in order

### 1. Check existing components

Read `src/ui/index.js` to see what UI components are available before writing any HTML. Note which components apply to this page.

### 2. Plan

State before writing any files:
- The route (e.g. `/dashboard`)
- The file path (e.g. `src/pages/dashboard.js`)
- State shape
- Mutations and/or actions needed
- Which UI components will be used
- Whether `server` data fetchers are needed

### 3. Build the spec

Write the spec file. Follow these rules:
- Use `class` not `className`, template literals not JSX
- No React imports, hooks, or patterns
- Use components from `src/ui/` — do not hand-write HTML that a component already covers
- Use optional chaining (`?.`) on any server data that could be null
- Escape any user-supplied values interpolated into HTML

### 4. Validate

Use `pulse_validate` on the spec. Fix any errors before continuing.

### 5. Restart and reload

Pages under `src/pages/` are auto-discovered — no server entry file to edit. Call `pulse_restart_server`, then `navigate_page` so the browser is not on a stale tab.

### 6. Screenshot + design approval

Use the chrome-devtools navigate_page tool to load the page, then take_screenshot.

Check for:
- Page renders without a blank screen or error
- Layout looks correct
- No console errors via list_console_messages

Then **call `pulse_await_approval`** and ask the user: *"Happy with the design and layout, or would you like any changes before I run tests and Lighthouse?"* Always call the tool before asking, even when using a question tool like AskUserQuestion — in some hosts (including Claude Code) the question still ends the turn and fires the Stop hooks; the marker is harmless if the turn doesn't end. **Do not proceed until the user explicitly approves.** If a `VERIFY REQUIRED` stop-hook block fires while your question is unanswered, that is not permission to continue — call `pulse_await_approval`, re-ask, and end your turn.

### 7. Lighthouse

Run lighthouse_audit (desktop, then mobile) against the production server — call `pulse_build` first and navigate to the production URL. **Pass bar: Accessibility, Best Practices, and SEO must all be 100.** Performance is reported but not gated (it varies with machine load).

### 8. Run the checklist

Go through `.claude/pulse-checklist.md` and confirm every applicable point passes. Fix anything that fails.

### 9. Write tests

Write a `src/pages/<name>.test.js` covering:
- View renders expected HTML landmarks
- Each mutation as a pure function
- Any utility functions the page defines

Run them with `node src/pages/<name>.test.js` and fix every failure.

### 10. Report

Summarise what was built, what components were used, and confirm validation + visual check passed.
