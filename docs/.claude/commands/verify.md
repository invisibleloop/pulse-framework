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

**Pass bar: Accessibility, Best Practices, and SEO must all be 100.** Performance is measured and reported but is not a hard requirement (it varies with machine load). Report the actual scores. If Accessibility, Best Practices, or SEO is below 100, identify the failing audit(s), fix the issue, and restart from step 2.

### 6. Lighthouse — mobile

Run `mcp__chrome-devtools__lighthouse_audit` on the same route with `{ "strategy": "mobile" }`.

**Same pass bar: Accessibility, Best Practices, and SEO must all be 100.** Fix any failures and restart from step 2.

### 7. Performance

Navigate to the page route, then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS. Flag any LCP insight that suggests a fixable problem (render-blocking resources, large image load delay, etc.).

### 8. Console errors

Use `mcp__chrome-devtools__list_console_messages` — report any errors or unexpected warnings.

### 9. Code review

Call `pulse_review` with the absolute path to the spec file. Read the source, rendered HTML, validator output, and checklist it returns. Fix every issue before proceeding. This is the structured review — do not skip it or replace it with a manual checklist read.

### 10. Close the browser

Use `mcp__chrome-devtools__list_pages` to get all open pages, then call `mcp__chrome-devtools__close_page` for every page ID returned. This closes the entire browser, not just the tab. `pageId` must be a number, not a string.

### 11. Write verification stamp

Run:

```bash
date +%s > .pulse-verified
```

**This must be the last write operation before stopping.** The stop hook compares each edited spec's modification time against this stamp — if any spec is newer than the stamp, the hook blocks. Do not edit any spec file after writing the stamp.

### 12. Report

Summarise:
- Validation: pass or fail (with errors if any)
- Visual: what was visible in the screenshot
- Lighthouse desktop: scores for all four categories
- Lighthouse mobile: scores for all four categories
- Performance: LCP and CLS values, any flagged insights
- Console: any errors
- Review: pass or issues found and fixed

**Pass bar — all of these must be met before the page is confirmed good:**
- Validation: clean (no errors, no warnings)
- Lighthouse desktop: Accessibility, Best Practices, SEO all 100
- Lighthouse mobile: same
- CLS: 0.00 — any layout shift is a blocker
- LCP: report the value; flag and fix any insight that identifies a fixable cause
- Console: no errors

If any gate fails, fix the issue and run `/verify` again.
