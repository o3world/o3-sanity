#!/usr/bin/env bash
#
# Per-ticket git worktrees, so several agent sessions can work the frontier at
# once without co-editing one checkout.
#
#   pnpm wt new 26        create ../o3-sanity-worktrees/26-<slug>, install, claim #26
#   pnpm wt ls            every worktree, its ticket, and whether it's dirty
#   pnpm wt rm 26         remove the worktree (and its branch, if merged)
#
# Worktrees live in a SIBLING directory, not inside the repo: each one carries
# its own ~1.1 GB node_modules, and nesting that under the checkout puts it in
# front of every editor indexer and file-glob in the toolchain.
#
# The env files and .vercel/ are gitignored, so a fresh worktree cannot reach
# Sanity or Vercel until they are copied across. `new` does that; it is the
# whole reason this script exists rather than a bare `git worktree add`.

set -euo pipefail

MAIN_ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
WT_HOME="$(dirname "$MAIN_ROOT")/o3-sanity-worktrees"

# Gitignored, so `git worktree add` cannot bring them along.
CARRY_FILES=(.env.local apps/web/.env.local .vercel/project.json)

die() {
  echo "error: $*" >&2
  exit 1
}

slugify() {
  echo "$1" |
    tr '[:upper:]' '[:lower:]' |
    sed -E -e 's/[^a-z0-9]+/-/g' -e 's/^-//' -e 's/-$//' |
    cut -c1-40 |
    sed -E -e 's/-$//'
}

cmd_new() {
  local issue="${1:-}" force="${2:-}"
  [[ -n $issue ]] || die "usage: pnpm wt new <issue-number> [--force]"

  local meta title blocked assignee
  meta="$(gh api "repos/{owner}/{repo}/issues/$issue" \
    --jq '[.title, (.issue_dependencies_summary.blocked_by // 0), ((.assignees // []) | map(.login) | join(","))] | @tsv')" ||
    die "cannot read issue #$issue"
  IFS=$'\t' read -r title blocked assignee <<<"$meta"

  # The frontier rules, enforced where the work actually starts. --force is for
  # the case where you know the blocker is irrelevant to your slice.
  if [[ $blocked -gt 0 && $force != "--force" ]]; then
    die "#$issue has $blocked open blocker(s). Run \`pnpm frontier\` to see what's ready, or pass --force."
  fi
  if [[ -n $assignee && $force != "--force" ]]; then
    die "#$issue is already claimed by $assignee — another session is on it. Pass --force to take it anyway."
  fi

  local slug branch path
  slug="$(slugify "$title")"
  branch="feat/$issue-$slug"
  path="$WT_HOME/$issue-$slug"

  [[ -e $path ]] && die "$path already exists"

  mkdir -p "$WT_HOME"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$path" "$branch"
  else
    git worktree add -b "$branch" "$path" main
  fi

  for f in "${CARRY_FILES[@]}"; do
    if [[ -f "$MAIN_ROOT/$f" ]]; then
      mkdir -p "$(dirname "$path/$f")"
      cp "$MAIN_ROOT/$f" "$path/$f"
    else
      echo "  note: $MAIN_ROOT/$f not found — run \`pnpm env:pull\` in the worktree" >&2
    fi
  done

  echo "installing dependencies…"
  (cd "$path" && pnpm install --reporter=silent)

  gh issue edit "$issue" --add-assignee @me >/dev/null && echo "claimed #$issue"

  cat <<EOF

  #$issue  $title
  branch  $branch
  path    $path

  cd $path && claude
EOF
}

cmd_ls() {
  git worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r path; do
    local_branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
    if [[ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ]]; then
      state="dirty"
    else
      state="clean"
    fi
    printf '%-8s %-34s %s\n' "$state" "$local_branch" "$path"
  done
}

cmd_rm() {
  local target="${1:-}"
  [[ -n $target ]] || die "usage: pnpm wt rm <issue-number|path>"

  local path
  if [[ -d $target ]]; then
    path="$target"
  else
    path="$(find "$WT_HOME" -maxdepth 1 -name "$target-*" -print -quit 2>/dev/null || true)"
    [[ -n $path ]] || die "no worktree for #$target under $WT_HOME"
  fi

  local branch
  branch="$(git -C "$path" rev-parse --abbrev-ref HEAD)"
  git worktree remove "$path" || die "worktree is dirty — commit, or re-run \`git worktree remove --force $path\`"

  # Only delete a branch whose commits are already on main; -d refuses otherwise.
  if git branch -d "$branch" 2>/dev/null; then
    echo "removed $path and merged branch $branch"
  else
    echo "removed $path — branch $branch kept (not merged into main)"
  fi
  git worktree prune
}

case "${1:-}" in
  new) shift && cmd_new "$@" ;;
  ls | list) cmd_ls ;;
  rm | remove) shift && cmd_rm "$@" ;;
  *)
    sed -n '3,9p' "$0" | sed 's/^# \?//'
    exit 1
    ;;
esac
