# Verify

Run the verification loop on the current page or the page specified in $ARGUMENTS.

**Modes:**
- `/verify` — full loop including Lighthouse (desktop + mobile), perf trace, and mobile layout check. Use when the user approves the design or signals they're ready to ship.
- `/verify --quick` — skips Lighthouse and perf trace; just validate → screenshot → console → review → stamp. Use during iterative building: design rounds, debugging visual issues, mid-build checkpoints. Fast enough to run between every change.

If `--quick` appears anywhere in $ARGUMENTS, run in quick mode (steps 6 to 9a are skipped). The route/file path is whatever remains in $ARGUMENTS after removing `--quick`.

## Steps

### 1. Identify the target

If $ARGUMENTS is provided, use it (minus `--quick` if present) as the file path or route. Otherwise, identify the most recently edited spec file from context.

### 2. Design approval (new builds only)

**Skip this step for edits, bug fixes, or "add X to existing Y" tasks.**

If this is a new page build (came through `pulse_intake` or `build-page`):

1. Take a screenshot and describe what you see to the user.
2. **Call `pulse_await_approval` first**, then ask the user: "Happy with the design and layout, or would you like any changes before I run Lighthouse?" — if your host provides a question tool (e.g. AskUserQuestion), offer the choices `["Yes, looks good — proceed", "I'd like some changes first"]`; otherwise ask in plain prose. Always call the tool before asking, whichever way you ask: in some hosts (including Claude Code) even a question tool ends the turn and fires the Stop hooks. The marker is harmless if the turn doesn't end — it is consumed when the user replies.
3. **Do not proceed to step 3 until the user explicitly confirms.** If they want changes, stop here, make the changes, then restart from step 2. Lighthouse takes ~90 seconds — do not waste it on a design the user hasn't approved. If a `VERIFY REQUIRED` stop-hook block fires while your question is unanswered, that is not permission to continue — call `pulse_await_approval`, re-ask, and end your turn.

### 3. Validate the spec

Use `pulse_validate` with the spec file content. If validation fails, report every error clearly and stop — do not proceed to screenshot until the spec is valid.

### 4. Check the dev server

Use `pulse_fetch_page` to confirm the server is responding for the route. If it errors, use `pulse_restart_server` and retry once.

### 5. Screenshot

Every `mcp__chrome-devtools__*` page call needs a numeric `pageId`. Call `mcp__chrome-devtools__list_pages` first and use the number it returns.

Use `mcp__chrome-devtools__navigate_page` to load the page route, then `mcp__chrome-devtools__take_screenshot` to capture the result. Describe what you see — layout, content, any obvious rendering issues.

### 6. Lighthouse — desktop *(skip in quick mode)*

**Pre-flight (required before every Lighthouse run):**
1. Call `pulse_build` to produce a production build and start the production server on port 3001.
2. Call `pulse_check_bundles` — reads the actual generated bundle files, not just their sizes. Lighthouse scores can pass on a bundle that shouldn't exist at all (a page with no mutations/actions/persist that got a boot file anyway) or one containing leaked server-only code — neither shows up as a score failure. If it flags anything, fix it and restart from step 3.
3. Call `navigate_page` with `url: "http://localhost:3001/"` so the browser is on the production server.

Then run `mcp__chrome-devtools__lighthouse_audit` with `{ "device": "desktop" }`.

**Pass bar: Accessibility, Best Practices, and SEO must all be 100.** Performance is measured and reported but is not a hard requirement (it varies with machine load). Report the actual scores. If Accessibility, Best Practices, or SEO is below 100, identify the failing audit(s), fix the issue, and restart from step 3.

Keep the score numbers from this run — step 9a saves the desktop and the mobile run as two reports.

### 7. Lighthouse — mobile *(skip in quick mode)*

The browser should still be on `http://localhost:3001/` from step 6. Run `mcp__chrome-devtools__lighthouse_audit` with `{ "device": "mobile" }`.

**Same pass bar: Accessibility, Best Practices, and SEO must all be 100.** Fix any failures and restart from step 3.

**Stay on the production server (port 3001)** — steps 8 and 9 use it too. Save the reports in step 9a, after step 9 has given you the LCP. Do not call `pulse_restart_server` yet.

### 8. Mobile layout check *(skip in quick mode)*

Emulate a mobile viewport and take a screenshot to catch wrapping, overflow, and layout issues before they become Lighthouse failures.

```
mcp__chrome-devtools__emulate  viewport: "390x844x2,mobile,touch"
mcp__chrome-devtools__navigate_page  url: "http://localhost:3001/"
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

### 9. Performance *(skip in quick mode)*

**Run the trace against the production server, not dev.** Navigate to `http://localhost:3001/<route>` first — if the production server is no longer running, run `pulse_build` again. Tracing the dev server (port 3000) reports misleading LCP/CLS. Then run `mcp__chrome-devtools__performance_start_trace` with `reload: true` and `autoStop: true`. Report LCP and CLS. Flag any LCP insight that suggests a fixable problem (render-blocking resources, large image load delay, etc.).

**If the trace shows no LCP** (a very small page can finish before the trace marks a navigation), read it from the page. Run `mcp__chrome-devtools__evaluate_script` on the production page with this function, and take the number as the LCP in milliseconds:

```js
() => new Promise(resolve => {
  new PerformanceObserver(list => resolve(list.getEntries().at(-1).startTime))
    .observe({ type: 'largest-contentful-paint', buffered: true })
  setTimeout(() => resolve(null), 3000)
})
```

A `null` result means the page painted no largest element. Report that as unmeasured and do not invent a number. The same call with `type: 'layout-shift'` gives CLS: add up the `value` of every entry where `hadRecentInput` is false.

After the trace, call `pulse_restart_server` to return to the dev server.

### 9a. Save the Lighthouse reports *(skip in quick mode — do not skip this if you ran steps 6–7)*

**This is a required step, not optional narrative — a Lighthouse run that passes step 6/7 and skips this one leaves no record anywhere except this conversation.** `pulse report-server` and any dashboard watching `.pulse/reports/` (including a companion app) read only what actually got saved to disk; reporting scores in chat is not the same as saving them, no matter how many times `/verify` passes.

Run one `Bash` call per device — **not an MCP tool call**, and run from the project root (the directory containing `pulse.config.js`). `--device` is required: it keeps the two reports apart.

```
npx --no-install pulse save-report --url "http://localhost:3001/<route>" --device desktop --data '{"scores":{"performance":<N>,"accessibility":100,"bestPractices":100,"seo":100},"metrics":{"lcp":<N>,"cls":<N>,"fcp":<N>,"tbt":<N>}}'
npx --no-install pulse save-report --url "http://localhost:3001/<route>" --device mobile  --data '{...}'
```

Use `npx --no-install pulse`, not a bare `pulse`. A bare `pulse` can be an older global install that ignores `--device` and still prints a success line. The project's own copy knows the flag.

Use the scores from step 6's result for the desktop call and from step 7's result for the mobile call. Use the LCP and CLS from step 9 in both, since the trace is one run. `<route>` is the page's route (`/` for the homepage). Confirm each call printed `✓ <device> report saved for ... (slug: ...)` — if it errored, fix the command and retry before moving on; do not silently continue to step 8 with an unsaved report.

**What `pulse_stamp` needs in each report:** `accessibility`, `bestPractices` and `seo` at 100, a measured `lcp` (in milliseconds) and a `cls` of 0.00. Some Lighthouse tools return no Performance score and no LCP. Then leave `performance` out, and take `lcp` and `cls` from step 9. **Leave out any number you did not measure.** `pulse_stamp` refuses a report with a missing number, and it must not be filled with a guess.

### 10. Console errors

Use `mcp__chrome-devtools__list_console_messages` — report any errors or unexpected warnings.

### 11. Code review

Call `pulse_review` with the spec file path. Work through every item the review returns. Fix anything that fails before proceeding.

`pulse_review` checks only some items mechanically (the lines marked ✓, ⚠ or ✗ at the top). The checklist below them is for you to work through. Keep a list: for each checklist section, note what you fixed, or why an item does not apply. Step 15 asks for it.

### 12. Close extra browser tabs

Use `mcp__chrome-devtools__list_pages` to get all open pages. Close every page **except the last one** — `close_page` refuses to close the final tab. `pageId` must be a number, not a string.

If there is only one page open, skip this step — there is nothing to close.

### 13. Check for unresolved errors on this route

Call `pulse_diagnose` with `{ route: "<this page's route>" }`. If it returns any unresolved entries, **do not proceed to step 14** — something threw during this session that hasn't been addressed. Fix the underlying issue and restart from step 3.

If it returns none, continue — `pulse_stamp` in the next step auto-resolves any journal entries for this route, since a clean pass this far means whatever was flagged either wasn't real or has already been fixed by an earlier step in this loop.

### 14. Write verification stamp

Call `pulse_stamp` with `{ route: "<this page's route>", mode: "full" }` in full mode, or just `{ route: "<this page's route>" }` in quick mode (quick never runs Lighthouse, so there's nothing to check). This writes `.pulse-verified` via the MCP server, which is more reliable than the `date +%s` shell command — the MCP write always lands after all spec edits, avoiding the mtime race condition that can cause the stop hook to block immediately after verification. It also marks any error-journal entries for this route as resolved.

**In full mode, `pulse_stamp` refuses to write the stamp unless it finds, for this route and from the last 10 minutes, a saved desktop report and a saved mobile report that each meet the bar** (step 9a genuinely happened, and the numbers show 100/100/100, a measured LCP and a CLS of 0.00). The refusal lists what is missing or failing. Fix the page or measure the missing number, save the report again, and call `pulse_stamp` again — do not work around the refusal any other way.

**It also refuses when the page has a `<name>.acceptance.md` file and a criterion has no test that names it.** Write the missing test from the criterion. If the page does not do what the criterion says, fix the page, or ask the user whether the criterion is wrong.

**This must be the last operation before stopping.** The stop hook compares each edited spec's mtime against this stamp — if any spec is newer than the stamp, the hook blocks. Do not edit any spec file after calling `pulse_stamp`.

### 15. Report

Summarise:
- Validation: pass or fail (with errors if any)
- Visual: desktop screenshot — any issues found and fixed
- Console: any errors
- Review: the mechanical results, and for each checklist section what you fixed or why it does not apply
- Acceptance: each criterion and the test that proves it, or that the page has no criteria file
- Error journal: clean, or resolved N entries
- **Full mode only:** bundle content check (clean, or issues found and fixed), Lighthouse desktop/mobile scores, whether both were saved via `pulse save-report --device` (step 9a), mobile layout check, LCP and CLS values (say which were measured and how)

In quick mode, end with: "Quick check passed — run `/verify` when you're ready for the full Lighthouse audit."

In full mode, only confirm the page is good when validation passes, both Lighthouse runs are 100/100/100, CLS is 0.00, and there are no console errors. Otherwise, fix and run `/verify` again.
