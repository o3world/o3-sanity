#!/usr/bin/env bash
#
# Per-ticket git worktrees, so several agent sessions can work the frontier at
# once without co-editing one checkout.
#
#   pnpm wt new 26        create ../o3-sanity-worktrees/26-<slug>, install, claim #26
#   pnpm wt ls            every worktree, its ports, and which servers are up
#   pnpm wt rm 26         remove the worktree (and its branch, if merged)
#
# Orca does the same job from the app side (its worktrees land under
# ~/orca/workspaces/o3-sanity/) and runs the same provisioning through
# orca.yaml. Both paths call scripts/worktree-provision.sh, so a checkout is
# set up identically whichever made it. What this script adds on top is the
# frontier discipline: it refuses a blocked or already-claimed ticket, and
# claims the one you asked for.
#
# Worktrees live in a SIBLING directory, not inside the repo: each one carries
# its own ~1.1 GB node_modules, and nesting that under the checkout puts it in
# front of every editor indexer and file-glob in the toolchain.

set -euo pipefail

MAIN_ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
WT_HOME="$(dirname "$MAIN_ROOT")/o3-sanity-worktrees"

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

  bash "$MAIN_ROOT/scripts/worktree-provision.sh" "$path"

  gh issue edit "$issue" --add-assignee @me >/dev/null && echo "claimed #$issue"

  local web_port
  web_port="$(sed -nE 's/^WEB_PORT=([0-9]+).*/\1/p' "$path/.env" 2>/dev/null | head -1)"

  cat <<EOF

  #$issue  $title
  branch  $branch
  path    $path
  web     http://localhost:${web_port:-?}

  cd $path && claude
EOF
}

# The port a checkout serves on is written into its own .env by
# worktree-provision.sh; a worktree that never went through provisioning has no
# .env and silently falls back to the dev.sh defaults, which is how two of them
# end up fighting over 3000. Marked `?` below so it reads as a missing claim
# rather than a real one.
port_of() { # <worktree> <var> <default>
  local value
  value="$(sed -nE "s/^[[:space:]]*$2=([0-9]+).*/\1/p" "$1/.env" 2>/dev/null | head -1)"
  echo "${value:-$3}"
}

# Which of those ports are actually serving, and from where. One lsof pass over
# every port in play, then a cwd lookup per listener: `next dev` and `storybook
# dev` inherit the app dir, so the owning checkout is a prefix of that cwd. A
# port held from outside the repo therefore shows as nobody's, which is right —
# it is claimed but not by us.
listeners() { # <comma-separated ports> -> "<port> <cwd>" lines
  local pid port cwd
  [[ -n $1 ]] || return 0
  # Nothing listening is the ordinary case, and `lsof` says so by exiting 1 —
  # which `pipefail` would otherwise turn into an errexit that kills `wt ls`
  # before it prints a row.
  lsof -nP -sTCP:LISTEN -iTCP:"$1" 2>/dev/null |
    sed -nE 's/^[^ ]+ +([0-9]+) .*:([0-9]+) \(LISTEN\)$/\1 \2/p' | sort -u |
    while read -r pid port; do
      cwd="$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
      [[ -n $cwd ]] && echo "$port $cwd"
    done || true
}

cmd_ls() {
  local paths ports claimed live path branch state web sb dupes tilde='~'

  # `pnpm vr` keeps a detached checkout of the baseline commit at
  # `<worktree>/.vr/base` so it can render the "before" side of a visual
  # comparison. It is a machine artifact with no ports and nobody working in
  # it — listing it would put a permanently-`clean`, permanently-`HEAD` row in
  # front of every real worktree.
  paths="$(git worktree list --porcelain | awk '/^worktree /{print $2}' | grep -v '/\.vr/base$')"

  # `ports` is everything to probe; `claimed` is only what a .env actually
  # reserves. Two unprovisioned worktrees both defaulting to 3000 is already
  # said by the `?` marker, so keeping them out of `claimed` leaves the
  # collision line for the case worth acting on: two real reservations.
  ports=""
  claimed=""
  while read -r path; do
    [[ -n $path ]] || continue
    ports+="$(port_of "$path" WEB_PORT 3000),$(port_of "$path" STORYBOOK_PORT 6006),"
    [[ -f "$path/.env" ]] &&
      claimed+="$(port_of "$path" WEB_PORT 3000),$(port_of "$path" STORYBOOK_PORT 6006),"
  done <<<"$paths"
  live="$(listeners "${ports%,}")"

  # A port counts as up for this worktree only when the listener's cwd is inside
  # it — the same port number appearing twice means two checkouts claim it, and
  # only one of them can be the one you have open.
  url_for() { # <worktree> <port>
    local marker=" "
    grep -q "^$2 $1\(/\|$\)" <<<"$live" && marker="●"
    [[ -f "$1/.env" ]] || set -- "$1" "$2?"
    printf '%s %-6s' "$marker" ":$2"
  }

  printf '%-8s %-8s %-6s %-36s %s\n' '  WEB' '  STORYBK' 'STATE' 'BRANCH' 'PATH'
  while read -r path; do
    [[ -n $path ]] || continue
    branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
    if [[ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ]]; then
      state="dirty"
    else
      state="clean"
    fi
    # Ticket branches run long; truncating keeps PATH in a readable column.
    [[ ${#branch} -gt 36 ]] && branch="${branch:0:35}…"
    web="$(url_for "$path" "$(port_of "$path" WEB_PORT 3000)")"
    sb="$(url_for "$path" "$(port_of "$path" STORYBOOK_PORT 6006)")"
    printf '%s %s %-6s %-36s %s\n' "$web" "$sb" "$state" "$branch" "${path/#$HOME/$tilde}"
  done <<<"$paths"

  echo
  echo "● listening — open http://localhost:<port>    ? no .env, so it would boot on the dev.sh default"

  # Two checkouts pointing at one port is only visible across the whole list.
  # No claimed ports at all leaves `grep` matching nothing and exiting 1, which
  # under `pipefail` would abort the run right after the legend.
  dupes="$(tr ',' '\n' <<<"$claimed" | grep -v '^$' | sort | uniq -d | tr '\n' ' ')" || true
  [[ -n $dupes ]] && echo "collision: ${dupes% } claimed by more than one worktree — re-provision one of them:"
  [[ -n $dupes ]] && echo "           rm <worktree>/.env && bash scripts/worktree-provision.sh <worktree>"
  return 0
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
