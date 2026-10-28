# Contributing to Pulse

Thanks for helping. Pulse is a small project with one maintainer, so a short, focused pull request is the easiest to review.

## Setup

```bash
git clone https://github.com/invisibleloop/pulse-framework
cd pulse-framework
npm ci
npm test            # the full suite (Node 22 or 24)
npm run typecheck   # the hand-written types
```

The framework is `packages/pulse`; the docs site is `docs/`. Each test file is a plain script, so you can run one directly, e.g. `node packages/pulse/src/server/server.test.js`.

## Before you open a pull request

- **Fix a bug test-first.** Add a regression test that fails on the old code and passes with your change. A change that "also fixes" something without a test will be asked for one.
- **Run `npm test` and `npm run typecheck`.** CI runs both on Node 22 and 24.
- **Keep CLAUDE.md and AGENTS.md identical.** `AGENTS.md` is a copy: edit `CLAUDE.md`, then `cp CLAUDE.md AGENTS.md` (CI checks it).
- **Update the docs and the types** when you change public behaviour. `docs/src/pages/stability.js` lists what counts as public API.
- **Do not add runtime dependencies** to the server, runtime or UI code.

## Commit and PR titles

Releases are cut from commit titles on `main` (conventional commits), so the title matters:

| Title | Release |
|---|---|
| `fix:`, `docs:`, `chore:`, `test:`, `perf:` | patch |
| `feat:` | minor |
| `type!:` or a `BREAKING CHANGE:` footer in the commit body | minor before 1.0 (1.0.0 is a deliberate step), major from 1.0 |

A change that is a bug fix but can break code that worked, such as making an input that used to be accepted throw, or changing what a function returns, is a breaking change: mark it with `!`. The stability page promises that patch releases are safe to take, and new projects take every patch.

A merge that touches nothing under `packages/pulse` (docs, CI, root files) publishes nothing.

Describe a breaking change in the PR body: the release notes are generated from PR titles.

## Review

`main` needs a pull request and a code-owner review. Merging publishes a release, so please do not merge your own PR before it has been reviewed.

## Reporting problems

- **Bugs:** open an issue with the Pulse version, what you expected, what happened and the smallest spec that reproduces it. AI agents using the framework can file these through the `pulse_report_issue` tool.
- **Security issues:** do not open a public issue. Use [private vulnerability reporting](https://github.com/invisibleloop/pulse-framework/security/advisories/new) (see SECURITY.md).

## Conduct

Be respectful and assume good faith. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
