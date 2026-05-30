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

### 5. Register with the server

Check the project's server entry file (e.g. `src/server.js` or `pulse.config.js`) and add the new spec if needed.

### 6. Screenshot

Use the chrome-devtools navigate_page tool to load the page, then take_screenshot.

Check for:
- Page renders without a blank screen or error
- Layout looks correct
- No console errors via list_console_messages

### 7. Lighthouse

Run lighthouse_audit (desktop, then mobile). All four scores — Accessibility, Best Practices, SEO, Performance — must be 100 before continuing.

### 8. Run the checklist

Go through `.github/instructions/pulse-checklist.instructions.md` and confirm every applicable point passes. Fix anything that fails.

### 9. Write tests

Write a `src/pages/<name>.test.js` covering:
- View renders expected HTML landmarks
- Each mutation as a pure function
- Any utility functions the page defines

Run them with `node src/pages/<name>.test.js` and fix every failure.

### 10. Report

Summarise what was built, what components were used, and confirm validation + visual check passed.
