# Verify

Run the full verification loop on the current page or the page specified in $ARGUMENTS.

## Steps

### 1. Identify the target

If $ARGUMENTS is provided, use it as the file path or route. Otherwise, identify the most recently edited spec file from context.

### 2. Design approval (new builds only)

**Skip this step for edits, bug fixes, or "add X to existing Y" tasks.**

If this is a new page build (came through `pulse_intake` or `build-page`):

1. Take a screenshot and describe what you see to the user.
2. Ask the user: "Happy with the design and layout, or would you like any changes before I run Lighthouse?" — if your host provides a question tool (e.g. AskUserQuestion), offer the choices `["Yes, looks good — proceed", "I'd like some changes first"]`; it waits for the answer without ending the turn. If you must ask in plain prose and end your turn, call `pulse_await_approval` first so the Stop hooks let the turn end.
3. **Do not proceed to step 3 until the user explicitly confirms.** If they want changes, stop here, make the changes, then restart from step 2. Lighthouse takes ~90 seconds — do not waste it on a design the user hasn't approved. If a `VERIFY REQUIRED` stop-hook block fires while your question is unanswered, that is not permission to continue — call `pulse_await_approval`, re-ask, and end your turn.

### 3. Validate the spec

Use `pulse_validate` with the spec file content. If validation fails, report every error clearly and stop — do not proceed to screenshot until the spec is valid.

### 4. Check the dev server

Use `pulse_fetch_page` to confirm the server is responding for the route. If it errors, use `pulse_restart_server` and retry once.

### 5. Screenshot

Use `mcp__chrome-devtools__navigate_page` to load the page route, then `mcp__chrome-devtools__take_screenshot` to capture the result. Describe what you see — layout, content, any obvious rendering issues.

### 6. Lighthouse — desktop

**Pre-flight (required before every Lighthouse run):**
1. Call `pulse_build` to produce a production build and start the production server on port 3001.
2. Call `navigate_page` with `url: "http://localhost:3001/"` so the browser is on the production server.

Then run `mcp__chrome-devtools__lighthouse_audit` with `{ "device": "desktop" }`.

**Pass bar: Accessibility, Best Practices, and SEO must all be 100.** Performance is measured and reported but is not a hard requirement (it varies with machine load). Report the actual scores. If Accessibility, Best Practices, or SEO is below 100, identify the failing audit(s), fix the issue, and restart from step 3.

### 7. Lighthouse — mobile

The browser should still be on `http://localhost:3001/` from step 6. Run `mcp__chrome-devtools__lighthouse_audit` with `{ "device": "mobile" }`.

**Same pass bar: Accessibility, Best Practices, and SEO must all be 100.** Fix any failures and restart from step 3.

After both Lighthouse runs pass, call `pulse_restart_server` to return to the dev server.

### 8. Mobile layout check

Emulate a mobile viewport and take a screenshot to catch wrapping, overflow, and layout issues before they become Lighthouse failures.

```
mcp__chrome-devtools__emulate  viewport: "390x844x2,mobile,touch"
mcp__chrome-devtools__navigate_page  url: "http://localhost:3000/"
mcp__chrome-devtools__take_screenshot
```

Describe what you see. Look specifically for:
- Text or buttons overflowing the viewport
- Content too small to read or tap
- Navigation that overlaps content
- Images that break the layout

Fix any issues, then reset to desktop before continuing:

```
mcp__chrome-devtools__emulate  viewport: "1440x900x1"
```

### 9. Performance

Navigate to the page route, then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS. Flag any LCP insight that suggests a fixable problem (render-blocking resources, large image load delay, etc.).

### 10. Console errors

Use `mcp__chrome-devtools__list_console_messages` — report any errors or unexpected warnings.

### 11. Code review

Call `pulse_review` with the spec file path. This runs a full code review AND atomically writes the `.pulse-verified` stamp server-side, eliminating any race condition with the stop hook.

Work through every item the review returns. Fix anything that fails before proceeding.

### 12. Close extra browser tabs

Use `mcp__chrome-devtools__list_pages` to get all open pages. Close every page **except the last one** — `close_page` refuses to close the final tab. `pageId` must be a number, not a string.

If there is only one page open, skip this step — there is nothing to close.

### 13. Write verification stamp

Call `pulse_stamp`. This writes `.pulse-verified` via the MCP server, which is more reliable than the `date +%s` shell command — the MCP write always lands after all spec edits, avoiding the mtime race condition that can cause the stop hook to block immediately after verification.

**This must be the last operation before stopping.** The stop hook compares each edited spec's mtime against this stamp — if any spec is newer than the stamp, the hook blocks. Do not edit any spec file after calling `pulse_stamp`.

### 14. Report

Summarise:
- Validation: pass or fail (with errors if any)
- Visual: desktop screenshot and mobile layout check — any issues found and fixed
- Lighthouse desktop: scores for Accessibility, Best Practices, SEO
- Lighthouse mobile: scores for Accessibility, Best Practices, SEO
- Performance: LCP and CLS values, any flagged insights
- Console: any errors
- Review: pass or issues found and fixed

Only confirm the page is good when validation passes, both Lighthouse runs are 100/100/100, CLS is 0.00, and there are no console errors. Otherwise, fix and run `/verify` again.
