# Verify

Run the full verification loop on the current page or the page specified in $ARGUMENTS.

## Steps

### 1. Identify the target

If $ARGUMENTS is provided, use it as the file path or route. Otherwise, identify the most recently edited spec file from context.

### 2. Validate the spec

Use `pulse_validate` with the spec file content. If validation fails, report every error clearly and stop — do not proceed to screenshot until the spec is valid.

### 3. Check the dev server

Use `pulse_fetch_page` to confirm the server is responding for the route. If it errors, use `pulse_restart_server` and retry once.

### 4. Screenshot

Use `mcp__chrome-devtools__navigate_page` to load the page route, then `mcp__chrome-devtools__take_screenshot` to capture the result. Describe what you see — layout, content, any obvious rendering issues.

### 5. Lighthouse — desktop

Run `mcp__chrome-devtools__lighthouse_audit` on the route with `{ "strategy": "desktop" }`.

**Pass bar: Performance, Accessibility, Best Practices, and SEO must all be 100.** Report the actual scores. If any score is below 100, identify the failing audit(s), fix the issue, and restart from step 2.

### 6. Lighthouse — mobile

Run `mcp__chrome-devtools__lighthouse_audit` on the same route with `{ "strategy": "mobile" }`.

**Same pass bar: all four categories must be 100.** Report the actual scores. If any score is below 100, fix and restart from step 2.

### 7. Performance

Navigate to the page route, then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS. Flag any LCP insight that suggests a fixable problem (render-blocking resources, large image load delay, etc.).

### 8. Console errors

Use `mcp__chrome-devtools__list_console_messages` — report any errors or unexpected warnings.

### 9. Code review

Check the spec against the checklist in `.claude/pulse-checklist.md`. Work through every item. Fix anything that fails before proceeding to the next step.

### 10. Close the browser

Use `mcp__chrome-devtools__list_pages` to get all open pages, then call `mcp__chrome-devtools__close_page` for every page ID returned. This closes the entire browser, not just the tab. `pageId` must be a number, not a string.

### 11. Write verification stamp

Run:

```bash
date +%s > .pulse-verified
```

This records that verify completed successfully. The stop hook checks this stamp — do not skip this step.

### 12. Report

Summarise:
- Validation: pass or fail (with errors if any)
- Visual: what was visible in the screenshot
- Lighthouse desktop: scores for all four categories
- Lighthouse mobile: scores for all four categories
- Performance: LCP and CLS values, any flagged insights
- Console: any errors
- Review: pass or issues found and fixed

Only confirm the page is good when validation passes, both Lighthouse runs are 100/100/100/100, CLS is 0.00, and there are no console errors. Otherwise, fix and run `/verify` again.
