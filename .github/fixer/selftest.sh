#!/usr/bin/env bash
# Prove, on this machine and now, that the sandbox user cannot reach the API key. Run it after the
# key proxy is up and before the model runs; a failure stops the job before any model-written
# code executes.
#
#   SELFTEST_KEY=<the key> selftest.sh
#
# The key is given only to this script (the CI user already holds it). It is never passed to the
# sandbox user, and never put on a command line, where any user could read it from /proc.
set -uo pipefail

fail=0
bad() { echo "::error::sandbox: $*"; fail=1; }
ok()  { echo "  ok: $*"; }
as_fixer() { sudo -n -u fixer env -i PATH="$PATH" HOME=/srv/fixer/home "$@"; }

[ -n "${SELFTEST_KEY:-}" ] || { echo "::error::selftest needs SELFTEST_KEY"; exit 2; }
id fixer >/dev/null 2>&1 || { echo "::error::sandbox user does not exist (run sandbox-setup.sh)"; exit 2; }

# 1. No privilege escalation by sudo.
if as_fixer sudo -n true 2>/dev/null; then bad "the sandbox user can run sudo"; else ok "sudo is refused"; fi
if [ "$(as_fixer id -u)" = 0 ]; then bad "the sandbox user is root"; else ok "uid is not 0"; fi
groups=$(as_fixer id -Gn)
for g in root sudo admin docker adm wheel; do
  case " $groups " in *" $g "*) bad "the sandbox user is in group $g";; esac
done
[ "$fail" = 0 ] && ok "groups: $groups"

# 2. Other users' processes are closed to it: their environment and open files (the runner holds
#    the job's secrets; the proxy holds the key). Every process not owned by the sandbox user.
checked=0 leaked=0
for p in /proc/[0-9]*; do
  pid=${p#/proc/}
  owner=$(stat -c %U "$p" 2>/dev/null) || continue
  [ "$owner" = fixer ] && continue
  checked=$((checked + 1))
  if as_fixer sh -c 'cat "/proc/$1/environ" >/dev/null 2>&1 || ls "/proc/$1/fd" >/dev/null 2>&1' _ "$pid"; then
    leaked=$((leaked + 1)); bad "can read process $pid ($(tr '\0' ' ' < "$p/cmdline" 2>/dev/null | cut -c1-60)) owned by $owner"
  fi
done
[ "$leaked" = 0 ] && ok "no readable environment or fds in $checked other processes"

# 3. It cannot write where trusted code or results live.
for d in "${GITHUB_WORKSPACE:-/nonexistent}" "${RUNNER_TEMP:-/nonexistent}" /usr/local/lib "$HOME"; do
  [ -d "$d" ] || continue
  if as_fixer sh -c 'touch "$1/.fixer-write-test" 2>/dev/null' _ "$d"; then
    sudo -n rm -f "$d/.fixer-write-test"; bad "the sandbox user can write to $d"
  fi
done
[ "$fail" = 0 ] && ok "cannot write to the workspace, runner temp, home or /usr/local/lib"

# 4. The key itself: look for it in everything the sandbox user can read. The search for files runs
#    as the sandbox user, so it only lists what that user can open; the comparison runs here, against
#    a private (0600) copy of the key. Never a command-line argument: every user can read those in
#    /proc, which is exactly the leak being tested for.
keyfile=$(mktemp)
trap 'rm -f "$keyfile"' EXIT
printf %s "$SELFTEST_KEY" > "$keyfile"

scan_roots=(/tmp /var/tmp /srv /usr/local /home /etc "${RUNNER_TEMP:-}" "${GITHUB_WORKSPACE:-}")
found=$(as_fixer sh -c '
  for r in "$@"; do [ -d "$r" ] && find "$r" -xdev -type f -readable -size -4M -print0 2>/dev/null; done
' _ "${scan_roots[@]}" \
  | xargs -0 -r grep -lF -f "$keyfile" -- 2>/dev/null | grep -vxF "$keyfile" | head -5)
[ -z "$found" ] && ok "the key is not in any file the sandbox user can read" || bad "the key appears in: $found"

# ...and in every process attribute it can read: command lines and environments, its own and anyone's.
# (No `grep -q` here: it stops at the first match, the writer then dies of SIGPIPE, and under
# `pipefail` a real match would read as "not found".)
if as_fixer sh -c 'for p in /proc/[0-9]*; do cat "$p/cmdline" "$p/environ" 2>/dev/null; echo; done' \
     | grep -F -f "$keyfile" >/dev/null; then
  bad "the key appears in a process command line or environment the sandbox user can read"
else
  ok "the key is not in any process attribute it can read"
fi

# 5. It can do its job: run node and reach the proxy.
if as_fixer node -e 'process.exit(0)' 2>/dev/null; then ok "node runs"; else bad "node does not run as the sandbox user"; fi

if [ "$fail" != 0 ]; then echo "sandbox self-test FAILED"; exit 1; fi
echo "sandbox self-test passed"
