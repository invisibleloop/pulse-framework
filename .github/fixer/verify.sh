#!/usr/bin/env bash
# Independently verify what the fixer agent produced. Run from the repo root
# after the agent step. Never trusts the agent's own claims:
#   1. the staged patch must pass the validator (paths, size, test + source),
#   2. the regression test(s) alone must FAIL on a clean checkout,
#   3. the full patch must apply cleanly and the whole suite must PASS.
#
# Writes outcome=<fixed|not_reproduced|not_a_framework_bug|blocked|failed> to
# $GITHUB_OUTPUT, and result.json / reason.txt / full.patch to $WORK for the
# later jobs. Always exits 0 — the outcome is data, not a job failure.
set -uo pipefail

RESULT=packages/pulse/.fixer/result.json
OUT=${GITHUB_OUTPUT:-/dev/null}
WORK=${WORK:-${RUNNER_TEMP:-/tmp}/fixer}
mkdir -p "$WORK"

emit() { # outcome, reason
  echo "outcome=$1" >> "$OUT"
  printf '%s\n' "$2" > "$WORK/reason.txt"
  echo "[$1] $2"
  exit 0
}

[ -f "$RESULT" ] || emit failed "The agent did not write a result file (it may have run out of turns)."
status=$(jq -r '.status // empty' "$RESULT" 2>/dev/null)
case "$status" in
  fixed|not_reproduced|not_a_framework_bug|blocked) ;;
  *) emit failed "The agent's result file had an invalid status." ;;
esac
cp "$RESULT" "$WORK/result.json"

git add -A -- . ':(exclude)packages/pulse/.fixer'

if [ "$status" != fixed ]; then
  git diff --cached --quiet || emit failed "The agent reported '$status' but left changes behind."
  emit "$status" "The agent reported: $status."
fi

node .github/fixer/validate-patch.js > "$WORK/validate.txt" 2>&1 \
  || emit failed "The patch was rejected by the validator: $(tr '\n' ' ' < "$WORK/validate.txt")"

git diff --cached > "$WORK/full.patch"
git diff --cached -- '*.test.js' > "$WORK/tests.patch"

# 2. The test must reproduce the bug: fails with ONLY the test change applied.
git reset -q --hard HEAD && git clean -fdq
git apply --index "$WORK/tests.patch" || emit failed "The test-only patch does not apply."
changed=$(git diff --cached --name-only -- '*.test.js' | sed 's#^packages/pulse/##')
( cd packages/pulse && for f in $changed; do node "$f" > /dev/null 2>&1 || exit 7; done )
[ $? -eq 7 ] || emit failed "The new test passes without the fix, so it does not reproduce the reported bug."

# 3. With the full patch the whole suite must pass.
git reset -q --hard HEAD && git clean -fdq
git apply --index "$WORK/full.patch" || emit failed "The patch does not apply cleanly."
( cd packages/pulse && npm test > "$WORK/npm-test.log" 2>&1 ) \
  || emit failed "The full test suite fails with the fix applied: $(tail -n 5 "$WORK/npm-test.log" | tr '\n' ' ')"

emit fixed "Reproduced by a failing test, fixed, and the full suite passes."
