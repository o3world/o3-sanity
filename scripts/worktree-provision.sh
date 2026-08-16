#!/usr/bin/env bash
#
# Make a freshly-created worktree buildable. Everything `git worktree add` (or
# Orca's equivalent) leaves out:
#
#   1. the gitignored env files, copied from the main checkout — without them
#      the worktree cannot reach Sanity or Vercel, and the failure reads like a
#      code bug rather than a missing file
#   2. `prototype/`, symlinked — 22 MB of seed image assets the migration seed
#      test asserts against, gitignored and therefore not carried by git
#   3. its own dev-server ports, written to the worktree's `.env` — two
#      checkouts both booting on 3600 is the first thing that breaks when a
#      second session starts
#   4. `pnpm install` — node_modules is not shared between worktrees
#
# Callers: `pnpm wt new` (scripts/worktree.sh) and Orca's setup hook
# (scripts/orca-hooks.sh). Both paths land here so they cannot drift.
#
#   bash scripts/worktree-provision.sh [worktree-path]   # default: $PWD
#
# Safe to re-run: existing env files, symlinks, and `.env` are left alone.

set -uo pipefail

# Web ports are the constrained resource: each one needs a matching Sanity CORS
# origin (`pnpm sanity cors add http://localhost:<port> --credentials`) or the
# client logos and live content stop rendering. The pools below are registered
# with the project already — widening them means adding origins first.
WEB_POOL_START=3600
WEB_POOL_END=3609
# Storybook ports need no CORS origin, but they do have to be reachable from a
# browser: Chrome and Firefox refuse 6665-6669 outright (IRC) with ERR_UNSAFE_PORT.
STORYBOOK_POOL_START=6600
STORYBOOK_POOL_END=6609

CARRY_FILES=(.env.local apps/web/.env.local .vercel/project.json)
CARRY_DIRS=(prototype)

WT="$(cd "${1:-$PWD}" 2>/dev/null && pwd)" || {
  echo "provision: no such directory: ${1:-$PWD}" >&2
  exit 1
}

MAIN_ROOT="$(dirname "$(git -C "$WT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")" || {
  echo "provision: $WT is not a git checkout" >&2
  exit 1
}

# Every port already spoken for: what the sibling worktrees have written into
# their own .env, plus anything actually listening (a port held by a process
# from outside this repo is just as unusable).
claimed_ports() {
  local root
  git -C "$WT" worktree list --porcelain 2>/dev/null |
    awk '/^worktree /{print $2}' |
    while read -r root; do
      [[ $root == "$WT" ]] && continue
      [[ -f "$root/.env" ]] || continue
      sed -nE 's/^[[:space:]]*(WEB_PORT|STORYBOOK_PORT)=([0-9]+).*/\2/p' "$root/.env"
    done
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | sed -nE 's/.*:([0-9]+) \(LISTEN\)$/\1/p'
}

# Lowest free port in [start, end]; empty when the pool is exhausted.
first_free_port() {
  local start=$1 end=$2 taken=$3 port
  for ((port = start; port <= end; port++)); do
    grep -qx "$port" <<<"$taken" || {
      echo "$port"
      return 0
    }
  done
  return 1
}

echo "provision: $WT"
echo "  main checkout: $MAIN_ROOT"

if [[ $WT == "$MAIN_ROOT" ]]; then
  echo "  this IS the main checkout — nothing to carry across." >&2
  exit 0
fi

# --- 1. env files ----------------------------------------------------------

for f in "${CARRY_FILES[@]}"; do
  if [[ -f "$WT/$f" ]]; then
    echo "  keep    $f (already present)"
  elif [[ -f "$MAIN_ROOT/$f" ]]; then
    mkdir -p "$(dirname "$WT/$f")"
    cp "$MAIN_ROOT/$f" "$WT/$f"
    echo "  copied  $f"
  else
    echo "  MISSING $f — not in the main checkout either; run \`pnpm env:pull\` here" >&2
  fi
done

# --- 2. prototype symlink --------------------------------------------------

for d in "${CARRY_DIRS[@]}"; do
  if [[ -e "$WT/$d" ]]; then
    echo "  keep    $d/ (already present)"
  elif [[ -d "$MAIN_ROOT/$d" ]]; then
    ln -s "$MAIN_ROOT/$d" "$WT/$d"
    echo "  linked  $d/ -> $MAIN_ROOT/$d"
  fi
done

# --- 3. ports --------------------------------------------------------------

if [[ -f "$WT/.env" ]]; then
  echo "  keep    .env ($(sed -nE 's/^WEB_PORT=([0-9]+).*/web :\1/p' "$WT/.env" | head -1))"
else
  taken="$(claimed_ports | sort -un)"
  web_port="$(first_free_port "$WEB_POOL_START" "$WEB_POOL_END" "$taken")"
  sb_port="$(first_free_port "$STORYBOOK_POOL_START" "$STORYBOOK_POOL_END" "$taken")"

  if [[ -z $web_port || -z $sb_port ]]; then
    echo "  PORTS   pool exhausted ($WEB_POOL_START-$WEB_POOL_END) — remove a dead worktree, or widen the pool" >&2
    echo "          and register the new web ports: pnpm sanity cors add http://localhost:<port> --credentials" >&2
  else
    cat >"$WT/.env" <<EOF
# Dev-server ports for this worktree (git-ignored). Allocated by
# scripts/worktree-provision.sh from the pool that already has matching Sanity
# CORS origins; loaded by scripts/dev.sh before the servers boot.
WEB_PORT=$web_port
STORYBOOK_PORT=$sb_port
EOF
    echo "  wrote   .env (web :$web_port, storybook :$sb_port)"
  fi
fi

# --- 4. dependencies -------------------------------------------------------

echo "  pnpm install…"
if ! (cd "$WT" && pnpm install --reporter=silent); then
  echo "  INSTALL failed — run \`pnpm install\` in $WT" >&2
  exit 1
fi

echo "provision: done."
