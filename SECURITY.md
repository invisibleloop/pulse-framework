# Security policy

## Reporting a vulnerability

Please report security issues **privately** through GitHub:
**[Report a vulnerability](https://github.com/invisibleloop/pulse-framework/security/advisories/new)**
(Security tab → "Report a vulnerability"). Please do not open a public issue.

Include the Pulse version (`pulse --version`), what you found, and a minimal reproduction if you can.
You can expect an acknowledgement within a few days. Fixes ship as a patch release of
[`@invisibleloop/pulse`](https://www.npmjs.com/package/@invisibleloop/pulse).

## Supported versions

Pulse is in early access. Only the latest published version receives security fixes.

## Scope

In scope: the framework (`packages/pulse`) — the HTTP server, SSR, client runtime, CLI and MCP tools —
and the feedback service at `feedback.pulseframework.dev`.

Not a vulnerability: bugs in an application built with Pulse (report those to that app's owner),
or findings that require an attacker who can already edit your spec files or run code on your machine.

## Bug reports from agents

Pulse can file framework bug reports on a user's behalf through `pulse_report_issue`. Reports are
redacted and previewed before they are sent, are never sent without confirmation, and can be disabled
with `reportFeedback: false` in `pulse.config.js`. Do not put vulnerability details in these public
reports — use the private channel above.
