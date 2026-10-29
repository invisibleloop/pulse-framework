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

## What protects the repo

The issue text is written by a stranger's AI agent, so it is treated as hostile at every step:

| Risk | Control |
|---|---|
| Someone triggers a run | Only a user with write access; the issue must carry `agent-report` **and be authored by the repo owner** (or `FIXER_ALLOWED_AUTHORS`) — an issue author can edit their text after a maintainer approves it, and the Worker files issues as the maintainer's own account |
| Model leaks the API key | The real key is held only by `key-proxy.js`, which runs as `nobody` and reads the key from stdin. The agent gets a placeholder key and `ANTHROPIC_BASE_URL` pointing at the proxy, which forwards only `/v1/messages` and stops after 400 requests. Runner users have passwordless `sudo`, and root can read every process's memory and environment (including the runner's, which holds the job's secrets), so **everything that runs model-written code runs as a separate user, `fixer`, with no sudo and no groups, in its own copy of the repo** (`sandbox-setup.sh`, `as-fixer.sh`). Before the model starts, `selftest.sh` checks on the live runner that `fixer` cannot use sudo, cannot read the environment or file descriptors of any other process, cannot write to the workspace or runner temp, and that the key is in no file or process attribute it can read; if any check fails the job stops. The key is still spendable through the proxy until the job ends, so **use a dedicated key with a spend limit**. |
| Model-written code decides its own verdict | `verify.sh` runs as the CI user on its own pristine checkout. From the sandbox it takes data only (the result file and the patch). The patch is applied to the pristine tree and validated there; the model's tests then run in a fresh sandbox copy, as `fixer`, and the only thing taken back is their exit status. So a hostile patch can fail the checks or pass its own test, but it cannot write the outcome, edit the checker, or reach the key |
| Model writes a hostile patch | `validate-patch.js` (run twice): an allow-list of runtime code (`src/runtime|server|spec|ui|md|store|testing`, `src/html.js`, `types/`, `public/pulse-ui.css`) with the deny-list kept on top (never `src/cli`, `src/mcp`, `src/agent`, `scripts/`, `public/pulse-ui.js`, dotfiles, `package.json`, workflows); ≤15 files / 500 lines; a source change **and** a regression test in an existing file; no symlinks, modes, renames, deletes |
| Reviewer misses something | The PR body lists which added lines touch process spawning, the network, `process.env`, filesystem writes, dynamic code or encoded blobs (categories and `file:line` only) |
| Model text becomes live markdown | Summaries and logs posted to the PR or issue go inside a code fence longer than any backtick run in them — no mentions, links or images |
| A malicious fix gets published | A human must approve the PR (code-owner rule); merging releases, so read the diff |

## Known limits

- PRs opened with `GITHUB_TOKEN` do not trigger `ci.yml`. The fix job has already run the
  full suite, and the release workflow runs it again on merge.
- Fixes are limited to `packages/pulse/`. A bug whose fix needs the synced copies in
  `docs/`, `examples/` or `.claude/` will end as `needs-human`.
- Code the model wrote can still send requests through the local proxy until the job ends (30 minutes at most, 400 requests), and the proxy does not restrict where the runner can connect, so it cannot stop other data leaving. There is no secret in the job other than the read-only `GITHUB_TOKEN`. If you want more: restrict runner egress, or use a self-hosted runner.
- The sandbox is an OS user, not a container or VM. A kernel exploit would defeat it; the GitHub-hosted runner VM is thrown away after the job.
- The pinned CLI (`CLAUDE_CODE_VERSION`) does not update itself; bump it deliberately.

## Fixing locally instead

`/fix-issue [number]` (`.claude/commands/fix-issue.md`) runs the same method in an interactive
Claude Code session — with the dev server, browser and Lighthouse available — and commits or
posts nothing until you say so. No label or API key needed.

It is for maintainers only: step 0 runs `.github/fixer/require-write-access.sh`, which requires
`origin` to be the canonical repo and the git identity to have push access (a dry-run push, so
nothing is changed), and stops otherwise. That guard governs the agent's workflow; the real
boundary is GitHub, where nobody without write access can push, label or close issues.

The two routes don't coordinate: if you fix an issue locally, don't also add `approved-to-fix`.

## Checking the sandbox

`.github/workflows/fixer-sandbox.yml` runs on every change to this directory and weekly (the runner image can change under us). It builds the sandbox on a hosted runner with a throwaway key, runs the real `selftest.sh`, then runs two container test scripts that you can also run locally with Docker:

- `test-sandbox.sh` breaks the setup seven ways (a sandbox user with sudo, in the sudo group, the key in a readable file, in a world-readable temp file, on a command line, in the sandbox user's environment) and requires the self-test to catch each. A self-test that cannot fail proves nothing.
- `test-verify.sh` drives `verify.sh` with simulated agents: a real fix, a test that does not reproduce the bug, a fix that breaks the suite, a patch outside the allowed paths, a forged outcome file, a symlinked result file, and a model-written test that tries `sudo`.

The scripts: `sandbox-setup.sh` (user + copy), `as-fixer.sh` (run a command as that user with a clean environment), `start-proxy.sh`, `selftest.sh`, `verify.sh`.
