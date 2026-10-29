#!/usr/bin/env bash
# Run a command as the sandbox user, in a clean environment.
#
#   as-fixer.sh [-C dir] [NAME=value ...] -- command [args...]
#
# The environment is rebuilt from nothing (`env -i`), so none of the CI user's variables reach the
# command; only HOME, TMPDIR, PATH and what is listed before `--`.
set -euo pipefail

dir=/srv/fixer/work
if [ "${1:-}" = "-C" ]; then dir=$2; shift 2; fi
extra=()
while [ $# -gt 0 ] && [ "$1" != "--" ]; do extra+=("$1"); shift; done
[ "${1:-}" = "--" ] || { echo "as-fixer.sh: missing --" >&2; exit 2; }
shift
[ $# -gt 0 ] || { echo "as-fixer.sh: no command" >&2; exit 2; }

exec sudo -n -u fixer env -i \
  HOME=/srv/fixer/home TMPDIR=/srv/fixer/tmp PATH="$PATH" LANG=C.UTF-8 TERM=dumb CI=true \
  npm_config_cache=/srv/fixer/home/.npm \
  "${extra[@]}" \
  bash -c 'cd "$1" && shift && exec "$@"' _ "$dir" "$@"
