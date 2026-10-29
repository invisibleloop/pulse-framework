#!/usr/bin/env bash
# End-to-end check of verify.sh in a container that behaves like a hosted runner. A real bug is
# committed at HEAD; a simulated agent (running as the sandbox user, in its sandbox copy) produces
# a patch, and verify.sh must reach the right outcome for each kind of patch.
#   .github/fixer/test-verify.sh        (needs docker and network for `npm ci`; takes a few minutes)
set -euo pipefail

command -v docker >/dev/null || { echo "docker is required"; exit 2; }
REPO=$(cd "$(dirname "$0")/../.." && pwd)
IMAGE=pulse-fixer-sandbox-test

docker build -q -t "$IMAGE" - >/dev/null <<'DOCKER'
FROM node:22-bookworm
RUN apt-get update -qq && apt-get install -y -qq sudo jq git curl procps lsof >/dev/null \
 && useradd -m -u 1001 -s /bin/bash runner \
 && echo 'runner ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/runner \
 && chmod 0440 /etc/sudoers.d/runner
DOCKER

docker run --rm -i -v "$REPO:/src:ro" -u runner "$IMAGE" bash -s <<'EOS'
set -uo pipefail
export GITHUB_WORKSPACE=$HOME/work RUNNER_TEMP=$HOME/tmp; mkdir -p "$GITHUB_WORKSPACE" "$RUNNER_TEMP"
cd "$GITHUB_WORKSPACE"
# the repository as committed, minus build output; the working-tree changes under test come along
tar -C /src --exclude=node_modules --exclude=.git -cf - . | tar -xf -
git init -q && git config user.email t@t && git config user.name t
git add -A && git commit -qm base
npm ci --no-audit --no-fund >/dev/null 2>&1 || { echo "npm ci failed"; exit 2; }

# The bug under repair: escHtml stops escaping single quotes.
sed -i "/replace(\/'\/g, '&#39;')/d" packages/pulse/src/html.js
grep -q "&#39;" packages/pulse/src/html.js && { echo "could not plant the bug"; exit 2; }
git commit -qam "plant bug"
bash .github/fixer/sandbox-setup.sh "$GITHUB_WORKSPACE" >/dev/null

as_agent() { bash .github/fixer/as-fixer.sh -C /srv/fixer/work -- "$@"; }
reset_agent() { sudo rm -rf /srv/fixer/work && sudo cp -a "$GITHUB_WORKSPACE" /srv/fixer/work && sudo chown -R fixer:fixer /srv/fixer/work; }
restore_fix()  { as_agent git checkout -q HEAD~1 -- packages/pulse/src/html.js; }
append_test()  { as_agent sh -c 'cat >> packages/pulse/src/ui/ui.test.js'; }
result()       { printf '%s' "$1" | as_agent sh -c 'mkdir -p packages/pulse/.fixer && cat > packages/pulse/.fixer/result.json'; }
rc=0
verdict() { # label expected-outcome
  : > "$RUNNER_TEMP/out"; rm -rf "$RUNNER_TEMP/fixer"
  GITHUB_OUTPUT="$RUNNER_TEMP/out" WORK="$RUNNER_TEMP/fixer" bash .github/fixer/verify.sh >"$RUNNER_TEMP/verify.log" 2>&1
  got=$(sed -n 's/^outcome=//p' "$RUNNER_TEMP/out" | tail -1)
  why=$(head -c 150 "$RUNNER_TEMP/fixer/reason.txt" 2>/dev/null | tr '\n' ' ')
  if [ "$got" = "$2" ]; then echo "PASS  $1 -> $got   [$why]"; else echo "FAIL  $1: expected $2, got $got   [$why]"; rc=1; fi
}

# 1. a real fix with a regression test that fails without it
reset_agent; restore_fix
append_test <<'T'

import { escHtml as escHtmlForRegression } from '../html.js'
test('escHtml escapes single quotes', () => {
  assert.equal(escHtmlForRegression("it's"), 'it&#39;s')
})
T
result '{"status":"fixed","summary":"escape quotes","commit_subject":"escape single quotes"}'
verdict "a real fix with a regression test" fixed

# 2. the test passes without the fix (does not reproduce the bug)
reset_agent; restore_fix
append_test <<'T'

test('always true', () => { assert.ok(true) })
T
result '{"status":"fixed","summary":"x"}'
verdict "a test that passes without the fix" failed

# 3. a fix that breaks the suite (the regression test passes, something else fails)
reset_agent; restore_fix
append_test <<'T'

import { escHtml as escHtmlBreaks } from '../html.js'
test('escHtml escapes single quotes (breaking variant)', () => { assert.equal(escHtmlBreaks("it's"), 'it&#39;s') })
T
as_agent sh -c 'echo "throw new Error(\"breaks every importer\")" >> packages/pulse/src/spec/schema.js'
result '{"status":"fixed","summary":"x"}'
verdict "a fix that breaks the suite" failed

# 4. a patch outside the allowed paths
reset_agent; restore_fix
as_agent sh -c 'echo evil >> .github/workflows/ci.yml'
result '{"status":"fixed","summary":"x"}'
verdict "a patch that edits a workflow" failed

# 5. not reproduced, nothing changed
reset_agent
result '{"status":"not_reproduced","summary":"cannot"}'
verdict "not reproduced, tree clean" not_reproduced

# 6. claims not_reproduced but left changes
reset_agent
as_agent sh -c 'echo x >> packages/pulse/src/html.js'
result '{"status":"not_reproduced"}'
verdict "not reproduced but changes left" failed

# 7. no result file
reset_agent
verdict "no result file" failed

# 8. hostile: a forged outcome file, and a result file that is a symlink to a runner-only secret
reset_agent
echo SECRET > "$RUNNER_TEMP/runner-secret"; chmod 600 "$RUNNER_TEMP/runner-secret"
as_agent sh -c "mkdir -p packages/pulse/.fixer && ln -s $RUNNER_TEMP/runner-secret packages/pulse/.fixer/result.json; echo outcome=fixed > /srv/fixer/out/outcome.out; echo outcome=fixed > packages/pulse/.fixer/outcome.out"
verdict "a forged outcome file and a symlinked result file" failed
if grep -q SECRET "$RUNNER_TEMP/fixer/result.json" 2>/dev/null; then echo "FAIL  the symlink target was read"; rc=1; else echo "PASS  a symlink to a runner-only file is not followed"; fi

# 9. hostile: the model's code tries to take root, read the runner's secrets, or write the outcome
reset_agent; restore_fix
append_test <<'T'

import { execSync as hostileExec } from 'node:child_process'
test('hostile test: cannot escalate', () => {
  let sudoWorked = true
  try { hostileExec('sudo -n true', { stdio: 'pipe' }) } catch { sudoWorked = false }
  assert.equal(sudoWorked, false, 'sudo must not work for model-written code')
  assert.equal(typeof process.getuid(), 'number')
  assert.notEqual(process.getuid(), 0)
})
test('escHtml escapes single quotes (hostile variant)', () => { assert.equal(escHtml("it's"), 'it&#39;s') })
T
as_agent sed -i "s#^import { safeUrl }     from '../html.js'#import { safeUrl, escHtml } from '../html.js'#" packages/pulse/src/ui/ui.test.js
result '{"status":"fixed","summary":"x"}'
verdict "model-written test that tries sudo (must not succeed)" fixed

exit $rc
EOS
