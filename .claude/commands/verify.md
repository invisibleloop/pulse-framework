# Verify

Run the full verification loop on the current page or the page specified in $ARGUMENTS.

## Steps

### 1. Identify the target

If $ARGUMENTS is provided, use it as the file path or route. Otherwise, identify the most recently edited spec file from context.

### 2. Design approval (new builds only)

**Skip this step for edits, bug fixes, or "add X to existing Y" tasks.**

If this is a new page build (came through `pulse_intake` or `build-page`):

1. Take a screenshot and describe what you see to the user.
2. Use `ask_user` to ask: "Happy with the design and layout, or would you like any changes before I run Lighthouse?" — provide choices: `["Yes, looks good — proceed", "I'd like some changes first"]`
3. **Do not proceed to step 3 until the user explicitly confirms.** If they want changes, stop here, make the changes, then restart from step 2. Lighthouse takes ~90 seconds — do not waste it on a design the user hasn't approved.

### 3. Validate the spec

Use `pulse_validate` with the spec file content. If validation fails, report every error clearly and stop — do not proceed to screenshot until the spec is valid.

### 4. Check the dev server

Use `pulse_fetch_page` to confirm the server is responding for the route. If it errors, use `pulse_restart_server` and retry once.

### 5. Screenshot

Use `mcp__chrome-devtools__navigate_page` to load the page route, then `mcp__chrome-devtools__take_screenshot` to capture the result. Describe what you see — layout, content, any obvious rendering issues.

### 6. Lighthouse — desktop

Run `mcp__chrome-devtools__lighthouse_audit` on the route with `{ "strategy": "desktop" }`.

**Pass bar: Performance, Accessibility, Best Practices, and SEO must all be 100.** Report the actual scores. If any score is below 100, identify the failing audit(s), fix the issue, and restart from step 3.

### 7. Lighthouse — mobile

Run `mcp__chrome-devtools__lighthouse_audit` on the same route with `{ "strategy": "mobile" }`.

**Same pass bar: all four categories must be 100.** Report the actual scores. If any score is below 100, fix and restart from step 3.

### 8. Performance

Navigate to the page route, then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS. Flag any LCP insight that suggests a fixable problem (render-blocking resources, large image load delay, etc.).

### 9. Console errors

Use `mcp__chrome-devtools__list_console_messages` — report any errors or unexpected warnings.

### 10. Code review

Call `pulse_review` with the spec file path. This runs a full code review AND atomically writes the `.pulse-verified` stamp server-side, eliminating any race condition with the stop hook.

Work through every item the review returns. Fix anything that fails before proceeding.

### 11. Close extra browser tabs

Use `mcp__chrome-devtools__list_pages` to get all open pages. Close every page **except the last one** — `close_page` refuses to close the final tab. `pageId` must be a number, not a string.

If there is only one page open, skip this step — there is nothing to close.

### 12. Write verification stamp

`pulse_review` writes the stamp automatically. As a belt-and-suspenders backup, also run:

```bash
date +%s > .pulse-verified
```

This ensures the stamp is present even if `pulse_review` was not called with a file path.

### 13. Report

Summarise:
- Validation: pass or fail (with errors if any)
- Visual: what was visible in the screenshot
- Lighthouse desktop: scores for all four categories
- Lighthouse mobile: scores for all four categories
- Performance: LCP and CLS values, any flagged insights
- Console: any errors
- Review: pass or issues found and fixed

Only confirm the page is good when validation passes, both Lighthouse runs are 100/100/100/100, CLS is 0.00, and there are no console errors. Otherwise, fix and run `/verify` again.
