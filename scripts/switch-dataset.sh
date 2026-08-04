#!/usr/bin/env bash
# switch-dataset — point every Sanity entry point in this checkout at one dataset.
#
# Adapted from vtx-web's scripts/switch-dataset. Vercel is the source of truth
# for deployed env values; this rewrites just the dataset variable in each
# local .env file so flipping between `development` and `production` doesn't
# mean re-pulling from Vercel.
#
# Usage:
#   pnpm dataset                 Show the current dataset per entry point
#   pnpm dataset development     Switch everything to `development`
#   pnpm dataset production      Switch everything to `production`
#
# Why every file and not just apps/web: `pnpm --filter migration load` deletes
# and rewrites documents, and it resolves its dataset from tools/migration —
# not from apps/web/.env.local. Before this script those two could disagree
# silently, and did: `SANITY_DATASET` was read by the migration CLI config and
# set by nothing, so every load went to production. The code default is now
# `development` (DEFAULT_DATASET in @o3/sanity/constants), so a file this
# script has not written falls back to the scratch dataset rather than the
# live one.
#
# Env files are gitignored, so this only affects the local checkout.
# `pnpm env:pull` restores apps/web/.env.local from Vercel.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || { cd "$(dirname "$0")/.." && pwd; })

VAR=NEXT_PUBLIC_SANITY_DATASET

# Each entry: "env-file-path|what reads it". One variable name across all of
# them — the split between NEXT_PUBLIC_SANITY_DATASET and SANITY_DATASET is
# what allowed the web app and the migration loader to diverge.
TARGETS=(
  "apps/web/.env.local|web app + embedded Studio"
  "packages/sanity/.env.local|typegen, schema extract/deploy"
  "tools/migration/.env.local|migration load + verify"
  "tools/guidance/.env.local|guidance sync"
)

# The datasets DATASETS in @o3/sanity/constants declares. Kept in step by
# constants.test.ts rather than by memory.
KNOWN=(development production)

read_var() {
  local file="$1"
  [ -f "$file" ] || return 0
  sed -nE "s/^${VAR}=[\"']?([^\"'#]*)[\"']?[[:space:]]*$/\1/p" "$file" | tail -1
}

write_var() {
  # Replace in place, or append. Portable across BSD and GNU sed by always
  # passing a backup suffix and removing the file afterwards.
  local file="$1" value="$2"
  if [ ! -f "$file" ]; then
    mkdir -p "$(dirname "$file")"
    printf '# Written by `pnpm dataset`. Gitignored.\n' > "$file"
  fi
  if grep -qE "^${VAR}=" "$file"; then
    sed -i.bak -E "s|^${VAR}=.*|${VAR}=\"${value}\"|" "$file"
    rm -f "${file}.bak"
  else
    [ -s "$file" ] && [ "$(tail -c 1 "$file")" != $'\n' ] && printf '\n' >> "$file"
    printf '%s="%s"\n' "$VAR" "$value" >> "$file"
  fi
}

cmd_status() {
  local seen="" mismatch=0 unset_any=0
  printf "  %-34s %-32s %s\n" "FILE" "READS IT" "VALUE"
  for entry in "${TARGETS[@]}"; do
    IFS='|' read -r rel what <<<"$entry"
    local val
    val="$(read_var "$ROOT/$rel")"
    if [ -z "$val" ]; then
      printf "  %-34s %-32s %s\n" "$rel" "$what" "(not set — falls back to development)"
      unset_any=1
      continue
    fi
    printf "  %-34s %-32s %s\n" "$rel" "$what" "$val"
    if [ -z "$seen" ]; then seen="$val"
    elif [ "$val" != "$seen" ]; then mismatch=1
    fi
  done
  if [ "$mismatch" -eq 1 ]; then
    echo ""
    echo "WARNING: dataset values differ across entry points."
    echo "         A load and a page view would be talking to different datasets."
    echo "         Run: pnpm dataset <name>"
  elif [ "$unset_any" -eq 1 ] && [ -n "$seen" ] && [ "$seen" != development ]; then
    echo ""
    echo "WARNING: some entry points are set to '$seen' and others are unset,"
    echo "         which means they fall back to 'development'."
    echo "         Run: pnpm dataset $seen"
  fi
}

cmd_set() {
  local target="$1" known=0
  for k in "${KNOWN[@]}"; do [ "$k" = "$target" ] && known=1; done
  if [ "$known" -eq 0 ]; then
    echo "Unknown dataset: $target" >&2
    echo "Known datasets: ${KNOWN[*]}" >&2
    echo "(Add it to DATASETS in packages/sanity/src/constants.ts first.)" >&2
    exit 1
  fi

  if [ "$target" = production ]; then
    echo "Switching to PRODUCTION — the dataset the deployed site reads."
    echo "\`pnpm --filter migration load\` against this deletes and rewrites documents."
    echo ""
  fi

  echo "Switching all entry points to dataset: $target"
  for entry in "${TARGETS[@]}"; do
    IFS='|' read -r rel _what <<<"$entry"
    write_var "$ROOT/$rel" "$target"
    echo "  $rel  $VAR=$target"
  done
  echo ""
  echo "Done. Restart any running dev servers to pick up the change."
}

case "${1:-status}" in
  status | "") cmd_status ;;
  -h | --help | help)
    sed -n '2,23p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *) cmd_set "$1" ;;
esac
