#!/usr/bin/env bash
# Boot one dev server (web | o3xo | storybook) on its configured port.
# Ports come from the repo-root .env (WEB_PORT, XO_WEB_PORT, STORYBOOK_PORT);
# without it the defaults stay web 3000, o3xo 3700, storybook 6006. Ports must
# be real environment variables before boot — Next binds its port before it
# reads any .env file — which is why the package dev scripts run through here.
#
# Collision handling: a stale server this repo left behind is cleared before
# boot — anything of ours holding the target port, and for a Next app any
# `next dev` for the same app dir regardless of port (Next allows one dev server
# per app dir, and a stale one blocks boot from whatever port it drifted to). A
# process from outside this repo holding the port aborts the boot instead.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="${1:?usage: dev.sh web|o3xo|storybook}"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$ROOT/.env"
  set +a
fi

case "$app" in
  web)
    port="${WEB_PORT:-3000}"
    dir="$ROOT/apps/web"
    cmd=(next dev -p "$port")
    ;;
  o3xo)
    port="${XO_WEB_PORT:-3700}"
    dir="$ROOT/apps/o3xo"
    cmd=(next dev -p "$port")
    # `getBaseUrl()` reads WEB_PORT to build canonicals and OG URLs in dev, and
    # WEB_PORT is the o3 app's. Re-point it at this server's own port for this
    # process only, so the second app's canonicals name the second app.
    export WEB_PORT="$port"
    ;;
  storybook)
    port="${STORYBOOK_PORT:-6006}"
    dir="$ROOT/apps/storybook"
    cmd=(storybook dev -p "$port" --no-open)
    ;;
  *)
    echo "usage: dev.sh web|o3xo|storybook" >&2
    exit 64
    ;;
esac

proc_cwd() {
  lsof -a -d cwd -p "$1" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1
}

# True when the process's cwd is $ROOT or below it.
in_repo() {
  local cwd
  cwd=$(proc_cwd "$1")
  [ -n "$cwd" ] && { [ "$cwd" = "$ROOT" ] || [ "${cwd#"$ROOT"/}" != "$cwd" ]; }
}

for pid in $(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | sort -u); do
  if in_repo "$pid"; then
    kill -TERM "$pid" 2>/dev/null || true
    echo "cleared stale server on port $port (pid $pid)"
  else
    echo "port $port is held by '$(ps -o comm= -p "$pid" 2>/dev/null || echo "pid $pid")' from outside this repo; pick a different $app port in $ROOT/.env" >&2
    exit 1
  fi
done

if [ "$app" = web ] || [ "$app" = o3xo ]; then
  for pid in $(pgrep -f 'next dev|next-server' 2>/dev/null); do
    if [ "$(proc_cwd "$pid")" = "$dir" ]; then
      kill -TERM "$pid" 2>/dev/null || true
      echo "cleared stale next dev for apps/$app (pid $pid)"
    fi
  done
fi

# TERM is asynchronous; give the port a moment to actually free.
for _ in $(seq 1 25); do
  lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1 || break
  sleep 0.2
done

cd "$dir"
exec "${cmd[@]}"
