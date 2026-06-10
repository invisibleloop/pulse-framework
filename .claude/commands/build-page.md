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
- Whether `hydrate` is required (yes, if any mutations/actions)

### 3. Build the spec

Write the spec file. Follow these rules:
- Use `class` not `className`, template literals not JSX
- No React imports, hooks, or patterns — see CLAUDE.md "Pulse vs React" table
- Use components from `src/ui/` — do not hand-write HTML that a component already covers
- Include `hydrate` if the spec has mutations or actions
- Use optional chaining (`?.`) on any server data that could be null
- Escape any user-supplied values interpolated into HTML

### 4. Validate

Use `pulse_validate` on the spec. Fix any errors before continuing.

### 5. Register with the server

Check the project's server entry file (e.g. `src/server.js` or `pulse.config.js`) and add the new spec if needed.

### 6. Screenshot and design approval

Use `mcp__chrome-devtools__navigate_page` to load the page, then `mcp__chrome-devtools__take_screenshot`.

Check for:
- Page renders without a blank screen or error
- Layout looks correct
- No console errors via `mcp__chrome-devtools__list_console_messages`

Then ask the user: "Happy with the design and layout, or would you like any changes before I run tests and Lighthouse?" — if your host provides a question tool (e.g. AskUserQuestion), offer the choices `["Yes, looks good — run tests and Lighthouse", "I'd like some changes first"]`; it waits for the answer without ending the turn. If you must ask in plain prose and end your turn, call `pulse_await_approval` first so the Stop hooks let the turn end. If a `VERIFY REQUIRED` stop-hook block fires while your question is unanswered, that is not permission to continue — call `pulse_await_approval`, re-ask, and end your turn.

**Do not proceed to step 7 until the user explicitly confirms.** If they want changes, make them and return to step 6.

### 7. Run the checklist

Go through `src/agent/checklist.md` and confirm every applicable point passes. Fix anything that fails.

### 8. Report

Summarise what was built, what components were used, and confirm validation + visual check passed.
