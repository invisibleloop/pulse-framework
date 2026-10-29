#!/usr/bin/env bash
# Build the sandbox the fixer agent runs in.
#
# Hosted runners give the job user passwordless sudo, and root can read the memory and environment
# of every process on the machine, including the runner's own, which holds the job's secrets. So
# anything that runs model-written code (the agent, and the tests of the code it wrote) runs as a
# separate user with no sudo, no groups, and its own copy of the repository.
#
#   sandbox-setup.sh <workspace>      run as the CI user, which needs sudo for this one step only
#
# Layout (fixed paths; the other scripts rely on them):
#   /srv/fixer/work   a copy of <workspace> the agent works in, owned by the sandbox user
#   /srv/fixer/verify fresh copies made by verify.sh to run the model's tests in
#   /srv/fixer/home   its $HOME (npm cache, claude config)
#   /srv/fixer/tmp    its $TMPDIR
#   /srv/fixer/out    scratch output (test logs)
# /srv/fixer itself is root-owned: the sandbox user cannot replace those directories.
set -euo pipefail

SRC=${1:?usage: sandbox-setup.sh <workspace>}

if ! id fixer >/dev/null 2>&1; then
  # No password, no login shell, no supplementary groups (so not sudo, docker or adm).
  sudo -n useradd --system --user-group --no-create-home --home-dir /srv/fixer/home --shell /usr/sbin/nologin fixer
fi

sudo -n install -d -m 0755 -o root  -g root  /srv/fixer
sudo -n install -d -m 0755 -o fixer -g fixer /srv/fixer/work /srv/fixer/home /srv/fixer/tmp /srv/fixer/out

sudo -n cp -a "$SRC/." /srv/fixer/work/
sudo -n chown -R fixer:fixer /srv/fixer/work
echo "sandbox ready: user fixer, workspace /srv/fixer/work"
