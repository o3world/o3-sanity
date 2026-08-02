#!/usr/bin/env bash
# Stop every local dev process this repo starts: Next dev servers and Storybook.
set -uo pipefail

PORTS=(3000 3001 3002 3003 6006)
PATTERNS=('turbo run dev' 'turbo run storybook' 'next-server' 'next dev' 'storybook dev')

killed=0

kill_pid() {
  local pid=$1 label=$2
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
  echo "Nothing running."
  exit 0
fi

# Give them a moment, then insist on anything still holding a port.
sleep 2
for port in "${PORTS[@]}"; do
  while read -r pid; do
    [ -n "$pid" ] && kill -KILL "$pid" 2>/dev/null && echo "  force-killed pid $pid (port $port)"
  done < <(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | sort -u)
done

echo "Down."
