# Agent fixer

Turns an `agent-report` issue (filed by `worker/feedback`) into a pull request.
Workflow: `.github/workflows/agent-fix.yml`.

```
agent hits a Pulse bug → pulse_report_issue (user approves) → Worker files issue
   → maintainer adds `approved-to-fix`
   → fix job   (read-only token): model writes a patch + regression test
                verify.sh: test fails without the fix, suite passes with it,
                validate-patch.js: only packages/pulse, small, test + source
   → pr job    (no model): re-validates, opens PR "Fixes #N"
   → human reviews; merging to main releases (publish.yml)
```

## One-time setup

1. **Secret `ANTHROPIC_API_KEY`** — use a dedicated key with a spend limit. It is only
   exposed to the single step that runs the model.
2. **Settings → Actions → General → Workflow permissions** — tick *Allow GitHub Actions
   to create and approve pull requests* (the PR job uses the default `GITHUB_TOKEN`).
3. **Label `approved-to-fix`** — create it once; only people with write access can
   trigger a run. The other labels (`agent-fix`, `cannot-reproduce`, `not-a-bug`,
   `needs-human`, `fix-failed`) are created on demand.
4. Optional: repository variable `FIXER_MODEL` (default `claude-sonnet-5-5`).

## Running it

Add `approved-to-fix` to the issue, or run the workflow manually with the issue number.
The issue gets a comment either way: a PR link, or why no fix was produced.

## Known limits

- PRs opened with `GITHUB_TOKEN` do not trigger `ci.yml`. The fix job has already run the
  full suite, and the release workflow runs it again on merge.
- Fixes are limited to `packages/pulse/`. A bug whose fix needs the synced copies in
  `docs/`, `examples/` or `.claude/` will end as `needs-human`.
- The model step runs repo code (`npm test`) with the API key in its environment and has
  network access, so treat the key as exposed to anything the agent can make run.
  Hence: dedicated key, spend limit.
