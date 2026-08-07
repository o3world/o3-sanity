#!/usr/bin/env bash
# Stop the local dev processes this checkout started: Next dev servers and Storybook.
# Only touches processes whose working directory is inside this repo, so a Next or
# Storybook server running from another project (or another worktree) is left alone.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || { cd "$(dirname "$0")/.." && pwd; })

# Port overrides live in the repo-root .env (loaded by scripts/dev.sh);
# keep the defaults in the list so stale servers from before an override die too.
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$ROOT/.env"
  set +a
fi

PORTS=(3000 3001 3002 3003 6006)
[ -n "${WEB_PORT:-}" ] && PORTS+=("$WEB_PORT")
[ -n "${STORYBOOK_PORT:-}" ] && PORTS+=("$STORYBOOK_PORT")
PATTERNS=('turbo run dev' 'turbo run storybook' 'next-server' 'next dev' 'storybook dev')

killed=0

# True when the process's cwd is $ROOT or below it.
in_repo() {
  local cwd
  cwd=$(lsof -a -d cwd -p "$1" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
  [ -n "$cwd" ] && { [ "$cwd" = "$ROOT" ] || [ "${cwd#"$ROOT"/}" != "$cwd" ]; }
}

kill_pid() {
  local pid=$1 label=$2
  in_repo "$pid" || return 0
  kill -TERM "$pid" 2>/dev/null || return 0
  echo "  stopped $label (pid $pid)"
  killed=$((killed + 1))
}

for port in "${PORTS[@]}"; do
  while read -r pid; do
    [ -n "$pid" ] && kill_pid "$pid" "port $port"
  done < <(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | sort -u)
done

for pattern in "${PATTERNS[@]}"; do
  while read -r pid; do
    [ -n "$pid" ] && [ "$pid" != "$$" ] && kill_pid "$pid" "$pattern"
  done < <(pgrep -f "$pattern" 2>/dev/null)
done

if [ "$killed" -eq 0 ]; then
  echo "Nothing running for $ROOT."
  exit 0
fi

# Give them a moment, then insist on anything of ours still holding a port.
sleep 2
for port in "${PORTS[@]}"; do
  while read -r pid; do
    [ -n "$pid" ] && in_repo "$pid" && kill -KILL "$pid" 2>/dev/null &&
      echo "  force-killed pid $pid (port $port)"
  done < <(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | sort -u)
done

echo "Down."
