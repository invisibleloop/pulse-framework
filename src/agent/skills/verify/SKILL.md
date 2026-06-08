---
name: verify
description: "Run the full verification loop on the current page or the page specified in $ARGUMENTS. If $ARGUMENTS is provided, use it as the file path or route. Otherwise, identify the most recently edited spec file from context."
---

# Verify

Run the full verification loop on the current page or the page specified in $ARGUMENTS.

**Output style:** be terse throughout. One sentence per step. Do not quote raw tool output — summarise findings only. Reserve detail for failures that need explaining.

## Steps

### 1. Identify the target

If $ARGUMENTS is provided, use it as the file path or route. Otherwise, identify the most recently edited spec file from context.

### 2. Validate the spec

Run `pulse_validate` on the spec file. Report clean or list errors. Stop if there are errors — do not continue until the spec is valid.

### 3. Check the dev server

Run `pulse_fetch_page` to confirm the server is responding. If it errors, run `pulse_restart_server` and retry once. Report HTTP status only — do not quote the HTML body.

**If the response has no `X-Pulse` header**, the wrong server is running on that port — stop and tell the user before continuing.

### 4. Screenshot

Navigate to the page route with `mcp__chrome-devtools__navigate_page`, then take a screenshot with `mcp__chrome-devtools__take_screenshot`. Describe what you see in 2–3 plain sentences — layout structure, visual tone, key sections. Do not list features or code details.

### 4a. Design approval gate *(new builds only)*

**If `pulse_intake` ran earlier in this session** (i.e. this is a new page or site, not an edit or bug fix):

1. Show the screenshot to the user.
2. Ask: *"Happy with the layout and direction, or any changes before I run Lighthouse?"*
3. **Stop and wait for their response.** Do not proceed to step 4b or Lighthouse until the user explicitly approves.

If the user requests changes: make edits, restart the server, take a new screenshot, describe what changed, ask again. Repeat until approved. No Lighthouse between design rounds.

**For edits, bug fixes, or "add X to existing Y"** — skip this step and go straight to 4b.

### 4b. Design review *(if `pulse_intake` ran)*

Run `pulse_design_review`. Work through every signal it returns. Fix any Fail before continuing. Report pass/fail count only — do not quote the full output.

### 4c. Layout review

Run `pulse_layout_review` with the page URL. It checks 390/768/1280px viewports for overflow, broken images, and collapsed sections. Fix any failures before continuing. Report pass or list failures only.

### 5. Production build

Run `pulse_build` to start the production server on port 3001. Tell the user: "Building for production — ~30s…" before calling it.

### 6. Lighthouse — desktop

Navigate to `http://localhost:3001/<route>` with `mcp__chrome-devtools__navigate_page`, then run `mcp__chrome-devtools__lighthouse_audit` with `device: "desktop"`.

**Pass bar: Accessibility, Best Practices, and SEO must all be 100.** Report scores as a single line, e.g. `Accessibility 100 · Best Practices 100 · SEO 100`. If any score is below 100, identify the failing audit(s), fix, and restart from step 2.

### 7. Lighthouse — mobile

Run `mcp__chrome-devtools__lighthouse_audit` with `device: "mobile"` against the same production URL. Same pass bar. Report scores as a single line. Fix failures and restart from step 2 if needed.

**To inspect mobile layout** use `mcp__chrome-devtools__emulate` with `viewport: "390x844x2,mobile,touch"` — not `resize_page`. Reset with `"1440x900x1"` afterward.

### 8. Performance

Navigate to the page route, then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS as a single line, e.g. `LCP 73ms · CLS 0.00`. Flag any insight that identifies a fixable cause (render-blocking resources, large image delay). CLS must be 0.00.

### 9. Console errors

Run `mcp__chrome-devtools__list_console_messages` filtered to errors and warnings. Report count only if clean. List any errors found.

### 10. Code review

Run `pulse_review` with the absolute path to the spec file. Work through every item in the checklist it returns. Fix every issue before proceeding. Report pass or list what was fixed — do not quote the full review output.

### 11. Close the browser

Run `mcp__chrome-devtools__list_pages`, then `mcp__chrome-devtools__close_page` for every page ID returned. `pageId` must be a JSON number, not a string.

### 12. Write verification stamp

Call `pulse_stamp`. This writes `.pulse-verified` via the MCP server, which is more reliable than `date +%s > .pulse-verified` — the MCP write always lands after all spec edits, avoiding the mtime race that causes the stop hook to block immediately after verification.

**This must be the last operation before stopping.** Do not edit any spec file after calling `pulse_stamp`.

### 13. Report

One short paragraph covering: validation, Lighthouse desktop/mobile scores, LCP, CLS, console, review. Flag anything that needed fixing. No raw tool output.

**Pass bar — all must be met:**
- Validation: clean
- Lighthouse desktop: Accessibility, Best Practices, SEO all 100
- Lighthouse mobile: same
- CLS: 0.00
- Console: no errors

If any gate fails, fix and run `/verify` again.
