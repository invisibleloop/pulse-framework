#!/usr/bin/env bash
# Independently verify what the fixer agent produced. Run from the repo root of the CI user's
# own checkout (never the sandbox copy), after the agent step. Never trusts the agent's claims:
#   1. the patch must pass the validator (paths, size, test + source),
#   2. the regression test(s) alone must FAIL on a clean checkout,
#   3. the full patch must apply cleanly and the whole suite must PASS.
#
# Writes outcome=<fixed|not_reproduced|not_a_framework_bug|blocked|failed> to
# $GITHUB_OUTPUT, and result.json / reason.txt / full.patch to $WORK for the
# later jobs. Always exits 0 — the outcome is data, not a job failure.
#
# Who runs what. This script, the validator and every decision (the outcome word, $GITHUB_OUTPUT)
# stay with the CI user, on its own pristine checkout. The model worked in a sandbox copy
# (/srv/fixer/work, see sandbox-setup.sh) as a user with no sudo; from it we take data only: the
# result file and the patch. Code the model wrote (its tests, and anything the suite imports) runs
# only in a fresh sandbox copy, as the sandbox user, and all we take from that is the exit status.
# So a hostile patch can fail the checks or pass its own test, but it cannot write the outcome,
# edit the checker, or reach the key.
set -uo pipefail

SANDBOX=/srv/fixer
RESULT_REL=packages/pulse/.fixer/result.json
OUT=${GITHUB_OUTPUT:-/dev/null}
WORK=${WORK:-${RUNNER_TEMP:-/tmp}/fixer}
mkdir -p "$WORK"
HERE=$(cd "$(dirname "$0")" && pwd)
AS_FIXER="$HERE/as-fixer.sh"

emit() { # outcome, reason
  echo "outcome=$1" >> "$OUT"
  printf '%s\n' "$2" > "$WORK/reason.txt"
  echo "[$1] $2"
  exit 0
}

# Read a file from the sandbox as the sandbox user (so a symlink there can only expose what that
# user could read anyway), capped in size.
from_sandbox() { sudo -n -u fixer sh -c 'test -f "$1" && ! test -L "$1" && head -c 2000000 "$1"' _ "$1"; }

# A fresh sandbox copy of this pristine checkout, for running code the model wrote.
fresh_copy() {
  sudo -n rm -rf "$SANDBOX/verify"
  sudo -n install -d -m 0755 -o fixer -g fixer "$SANDBOX/verify"
  sudo -n cp -a "$PWD/." "$SANDBOX/verify/"
  sudo -n chown -R fixer:fixer "$SANDBOX/verify"
  # The copied index remembers the old owner and ctimes; without this `git apply --index` says
  # every file "does not match index".
  in_sandbox git update-index -q --refresh
}
# (The patch goes in on stdin: the sandbox user cannot read the CI user's private temp directory.)
in_sandbox() { "$AS_FIXER" -C "$SANDBOX/verify" -- "$@"; }

from_sandbox "$SANDBOX/work/$RESULT_REL" > "$WORK/result.json" 2>/dev/null
[ -s "$WORK/result.json" ] || emit failed "The agent did not write a result file (it may have run out of turns)."
status=$(jq -r '.status // empty' "$WORK/result.json" 2>/dev/null)
case "$status" in
  fixed|not_reproduced|not_a_framework_bug|blocked) ;;
  *) emit failed "The agent's result file had an invalid status." ;;
esac

# What the agent changed, as the sandbox user sees it: stage everything but its own scratch dir.
"$AS_FIXER" -C "$SANDBOX/work" -- git add -A -- . ':(exclude)packages/pulse/.fixer' >/dev/null 2>&1
"$AS_FIXER" -C "$SANDBOX/work" -- git diff --cached > "$WORK/agent.patch.tmp" 2>/dev/null || true
if [ "$status" != fixed ]; then
  [ ! -s "$WORK/agent.patch.tmp" ] || emit failed "The agent reported '$status' but left changes behind."
  emit "$status" "The agent reported: $status."
fi
head -c 2000000 "$WORK/agent.patch.tmp" > "$WORK/agent.patch"; rm -f "$WORK/agent.patch.tmp"
[ -s "$WORK/agent.patch" ] || emit failed "The agent reported a fix but changed nothing."

# 1. Apply it to our own pristine tree (git apply refuses paths outside the repo, under .git,
#    and writes through symlinks), then validate. Nothing here executes the patch.
git reset -q --hard HEAD && git clean -fdq
git apply --index "$WORK/agent.patch" 2>"$WORK/apply.err" || emit failed "The patch does not apply cleanly: $(head -c 300 "$WORK/apply.err" | tr '\n' ' ')"
node .github/fixer/validate-patch.js > "$WORK/validate.txt" 2>&1 \
  || { git reset -q --hard HEAD && git clean -fdq; emit failed "The patch was rejected by the validator: $(tr '\n' ' ' < "$WORK/validate.txt")"; }

git diff --cached > "$WORK/full.patch"
git diff --cached -- '*.test.js' > "$WORK/tests.patch"
changed=$(git diff --cached --name-only -- '*.test.js' | sed 's#^packages/pulse/##')
git reset -q --hard HEAD && git clean -fdq

# 2. The test must reproduce the bug: it fails with ONLY the test change applied.
fresh_copy
in_sandbox git apply --index - < "$WORK/tests.patch" 2>/dev/null || emit failed "The test-only patch does not apply."
reproduced=0
for f in $changed; do
  in_sandbox sh -c 'cd packages/pulse && timeout 600 node "$1" >/dev/null 2>&1' _ "$f" || { reproduced=1; break; }
done
[ "$reproduced" = 1 ] || emit failed "The new test passes without the fix, so it does not reproduce the reported bug."

# 3. With the full patch the whole suite must pass.
fresh_copy
in_sandbox git apply --index - < "$WORK/full.patch" 2>/dev/null || emit failed "The patch does not apply cleanly."
in_sandbox sh -c 'cd packages/pulse && timeout 1500 npm test > /srv/fixer/out/npm-test.log 2>&1'
if [ $? -ne 0 ]; then
  from_sandbox "$SANDBOX/out/npm-test.log" > "$WORK/npm-test.log" 2>/dev/null
  emit failed "The full test suite fails with the fix applied: $(tail -n 5 "$WORK/npm-test.log" | tr '\n' ' ')"
fi

emit fixed "Reproduced by a failing test, fixed, and the full suite passes."
