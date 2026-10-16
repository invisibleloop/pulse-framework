#!/usr/bin/env bash
# Exit 0 only if this checkout's `origin` is the canonical Pulse repo AND the
# git identity it pushes with has write access to it.
#
# Used as step 0 of the /fix-issue command so only maintainers can run it. This
# is a guard on the agent's workflow, not a security boundary — the boundary is
# GitHub: without write access nobody can push, label or close issues anyway.
#
# Why not `gh api ... .permissions.push`? `gh` may be logged in as a different
# account than the one git pushes with. Why check the URL? A contributor's
# `origin` is usually their own fork, where they DO have write access.
set -uo pipefail

REPO="invisibleloop/pulse-framework"

url=$(git remote get-url origin 2>/dev/null) || { echo "No 'origin' remote found."; exit 1; }
if ! printf '%s' "$url" | grep -Eq "[:/]${REPO}(\.git)?/?$"; then
  echo "origin is '$url', not ${REPO}. This command is for maintainers working in the main repo."
  exit 1
fi

# A dry-run push contacts GitHub's receive-pack service, which is refused for
# identities without write access. Nothing is pushed or created.
if ! git push --dry-run origin HEAD:refs/heads/__write-access-check >/dev/null 2>&1; then
  echo "Your git identity does not have write access to ${REPO}. This command is for maintainers."
  exit 1
fi

echo "Write access to ${REPO} confirmed."
