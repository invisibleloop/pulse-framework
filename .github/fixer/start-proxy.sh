#!/usr/bin/env bash
# Start the key proxy as `nobody`. The key arrives in $ANTHROPIC_API_KEY (this script's
# environment only) and goes to the proxy on stdin.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?}"
PROXY_PORT=${PROXY_PORT:-8787}
export PROXY_PORT
HERE=$(cd "$(dirname "$0")" && pwd)
LOG=${RUNNER_TEMP:-/tmp}/key-proxy.log

sudo -n install -m 0755 "$HERE/key-proxy.js" /usr/local/lib/key-proxy.mjs
# A here-string, not `printf | sudo`: the shell forks straight into sudo, so no lingering process
# of this user keeps the key in its environment.
sudo -n --preserve-env=PROXY_PORT -u nobody -H \
  setsid "$(command -v node)" /usr/local/lib/key-proxy.mjs \
  <<< "$ANTHROPIC_API_KEY" > "$LOG" 2>&1 &
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PROXY_PORT/" || true)
  [ "$code" = 404 ] && exit 0
  sleep 0.5
done
echo "::error::key proxy did not start"; cat "$LOG" || true; exit 1
