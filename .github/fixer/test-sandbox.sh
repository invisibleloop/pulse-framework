#!/usr/bin/env bash
# Exercise the sandbox scripts in a container that behaves like a hosted runner: a CI user with
# passwordless sudo, Node, git and jq. Run from anywhere:   .github/fixer/test-sandbox.sh
#
# It checks that the self-test PASSES on a correct setup, and that it FAILS when the setup is
# wrong in each way it exists to catch (a sandbox user with sudo, in a privileged group, with the
# key in a readable file or on a command line).
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

run_case() { # name, expected exit (0 pass | 1 fail), extra shell run after setup, before selftest
  local name=$1 expect=$2 extra=${3:-:}
  local out status
  set +e
  out=$(docker run --rm -v "$REPO:/src:ro" -u runner "$IMAGE" bash -c '
    set -e
    mkdir -p ~/work && cp -a /src/. ~/work/ && cd ~/work
    export GITHUB_WORKSPACE=$PWD RUNNER_TEMP=$HOME/tmp; mkdir -p "$RUNNER_TEMP"
    export ANTHROPIC_API_KEY=sk-ant-test-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d " \n")
    bash .github/fixer/sandbox-setup.sh "$GITHUB_WORKSPACE" >/dev/null
    bash .github/fixer/start-proxy.sh
    '"$extra"'
    SELFTEST_KEY=$ANTHROPIC_API_KEY bash .github/fixer/selftest.sh
  ' 2>&1)
  status=$?
  set -e
  if [ "$status" -eq "$expect" ]; then
    echo "PASS  $name (exit $status)"
  else
    echo "FAIL  $name: expected exit $expect, got $status"; echo "$out" | tail -25; return 1
  fi
}

rc=0
run_case "correct setup passes"                                0 || rc=1
run_case "sandbox user with sudo is caught"                    1 "echo 'fixer ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/fixer >/dev/null" || rc=1
run_case "sandbox user in the sudo group is caught"            1 "sudo usermod -aG sudo fixer" || rc=1
run_case "key in a readable file is caught"                    1 'printf %s "$ANTHROPIC_API_KEY" | sudo tee /srv/fixer/tmp/leak.txt >/dev/null' || rc=1
run_case "key in a world-readable temp file is caught"         1 'printf %s "$ANTHROPIC_API_KEY" > "$RUNNER_TEMP/leak"; chmod 644 "$RUNNER_TEMP/leak"; chmod 755 "$HOME" "$RUNNER_TEMP"; sleep 0' || rc=1
run_case "key on a process command line is caught"             1 'setsid sh -c "sleep 300; true" "$ANTHROPIC_API_KEY" >/dev/null 2>&1 &' || rc=1
run_case "key in a sandbox-user process environment is caught" 1 'sudo -n -u fixer env SECRET="$ANTHROPIC_API_KEY" setsid sleep 300 >/dev/null 2>&1 &' || rc=1
exit $rc
