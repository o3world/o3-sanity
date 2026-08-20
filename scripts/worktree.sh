#!/usr/bin/env bash
#
# Per-ticket git worktrees, so several agent sessions can work the frontier at
# once without co-editing one checkout.
#
#   pnpm wt new 26        create ../o3-sanity-worktrees/26-<slug>, install, claim #26
#   pnpm wt ls            every worktree, its ports, and which servers are up
#   pnpm wt rm 26         remove the worktree (and its branch, if merged)
#   pnpm wt reap          remove every worktree whose ticket is closed (--yes to apply)
#   pnpm wt issue <path>  which ticket a checkout belongs to (exit 1 if none)
#
# Orca does the same job from the app side (its worktrees land under
# ~/orca/workspaces/o3-sanity/) and runs the same provisioning through
# orca.yaml. Both paths call scripts/worktree-provision.sh, so a checkout is
# set up identically whichever made it. What this script adds on top is the
# frontier discipline: it refuses a blocked or already-claimed ticket, and
# claims the one you asked for — which orca.yaml's `issueCommand` now does on
# the Orca side, along with putting the ticket into the branch name.
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
  local base_ref
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    # A resume: check the branch out exactly as it stands. Moving it onto
    # anything newer is the session's call, not this script's.
    base_ref="$branch"
    git worktree add "$path" "$branch"
  else
    # A fresh branch starts from the remote, never the local `main` ref. The
    # main checkout usually sits on a feature branch, so its `main` goes stale
    # the moment anything merges, and a worktree cut from it starts behind
    # without ever saying so.
    base_ref="origin/main"
    git fetch --quiet origin || die "cannot fetch origin — a new branch has to start from origin/main"
    # --no-track: a ticket branch is nobody's upstream, and tracking origin/main
    # would make a bare `git push` from the worktree aim at main.
    git worktree add --no-track -b "$branch" "$path" origin/main
  fi

  # What this checkout starts on, read from the new worktree rather than from
  # the ref, so a resume reports where its branch actually is.
  local base base_subject
  base="$(git -C "$path" log -1 --format='%h')"
  base_subject="$(git -C "$path" log -1 --format='%s')"
  if [[ ${#base_subject} -gt 52 ]]; then
    base_subject="${base_subject:0:51}…"
  fi

  bash "$MAIN_ROOT/scripts/worktree-provision.sh" "$path"

  gh issue edit "$issue" --add-assignee @me >/dev/null && echo "claimed #$issue"

  local web_port
  web_port="$(sed -nE 's/^WEB_PORT=([0-9]+).*/\1/p' "$path/.env" 2>/dev/null | head -1)"

  cat <<EOF

  #$issue  $title
  branch  $branch
  base    $base  $base_ref  $base_subject
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

# Drop one checkout, and its branch only when the branch is redundant.
#
# `git branch -d` is the whole safety argument for `reap`: it refuses a branch
# whose commits are not already on main, so removing a checkout can never
# strand work. Fourteen of the branches behind the August 2026 cleanup had
# never been pushed anywhere — the ref in the main checkout was the only copy.
remove_worktree() { # <path> -> 1 if the checkout is dirty
  local path="$1" branch
  branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  git worktree remove "$path" || return 1

  if git branch -d "$branch" 2>/dev/null; then
    echo "removed $path and merged branch $branch"
  else
    echo "removed $path — branch $branch kept (not merged into main)"
  fi
  git worktree prune
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

  remove_worktree "$path" ||
    die "worktree is dirty — commit, or re-run \`git worktree remove --force $path\`"
}

# Which ticket a checkout belongs to, from its own name or its branch's.
#
# `pnpm wt new` writes both as `<issue>-<slug>`, so either answers. Orca names
# its checkout after the session's intent and cannot be told otherwise, so the
# branch is the only half of the pair its worktrees can carry a ticket in —
# which is what `issueCommand` renames it for (scripts/orca-hooks.sh issue).
#
# Any prefix, because that branch is `<github-login>/…` and a login holds
# uppercase, digits and hyphens; `o3world/nick/159-x` nests one deeper again.
# The last segment is where the ticket has to be, so match to the final slash.
issue_of() { # <path> -> issue number, or empty
  local path="$1" branch number
  number="$(basename "$path" | sed -nE 's/^([0-9]+)-.*/\1/p')"
  [[ -n $number ]] && {
    echo "$number"
    return 0
  }
  branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  sed -nE 's#^.*/([0-9]+)-.*#\1#p' <<<"$branch"
}

# The resolver, as a subcommand — `reap` decides what to sweep by it and `rm`
# finds a checkout by it, so it is worth being able to ask directly which ticket
# a path belongs to. A path with no ticket exits 1: that is an answer, not a
# failure, and keeping it off stdout leaves the output parseable.
cmd_issue() {
  local path="${1:-}"
  [[ -n $path ]] || die "usage: pnpm wt issue <path>"

  local issue
  issue="$(issue_of "$path")"
  [[ -n $issue ]] || return 1
  echo "$issue"
}

# Reap → every checkout whose ticket is closed, gone.
#
# `wt new` runs when you claim a ticket; nothing ran when you closed one, so
# checkouts accumulated at ~1.1 GB each until twenty of them for long-closed
# tickets held 26 GB. This is the other half of that pair, and it reports
# before it deletes: a bare `reap` is a dry run.
cmd_reap() {
  local apply="${1:-}"
  local self paths path issue state reap=0 kept=0 tilde='~'

  # Never the checkout asking for the reap, and never the main one: both would
  # pull the directory out from under the shell running this.
  self="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  paths="$(git worktree list --porcelain | awk '/^worktree /{print $2}' | grep -v '/\.vr/base$')"

  printf '%-6s %-7s %-28s %s\n' 'ACTION' 'TICKET' 'WHY' 'PATH'
  while read -r path; do
    [[ -n $path ]] || continue
    [[ $path == "$MAIN_ROOT" || $path == "$self" ]] && continue

    issue="$(issue_of "$path")"
    if [[ -z $issue ]]; then
      printf '%-6s %-7s %-28s %s\n' 'keep' '?' 'no ticket in name or branch' "${path/#$HOME/$tilde}"
      kept=$((kept + 1))
      continue
    fi

    # An unreadable ticket is a reason to leave the checkout alone, not a
    # reason to stop: one deleted issue should not block the whole sweep.
    state="$(gh issue view "$issue" --json state --jq .state 2>/dev/null || true)"
    if [[ $state != "CLOSED" ]]; then
      printf '%-6s %-7s %-28s %s\n' 'keep' "#$issue" "${state:-unreadable}" "${path/#$HOME/$tilde}"
      kept=$((kept + 1))
      continue
    fi

    # Uncommitted work outranks a closed ticket — the ticket says the work
    # landed, the dirty tree says something here did not.
    if [[ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ]]; then
      printf '%-6s %-7s %-28s %s\n' 'keep' "#$issue" 'closed, but dirty' "${path/#$HOME/$tilde}"
      kept=$((kept + 1))
      continue
    fi

    reap=$((reap + 1))
    if [[ $apply == "--yes" ]]; then
      remove_worktree "$path" >/dev/null ||
        printf '%-6s %-7s %-28s %s\n' 'FAIL' "#$issue" 'remove refused' "${path/#$HOME/$tilde}"
      printf '%-6s %-7s %-28s %s\n' 'reaped' "#$issue" 'closed' "${path/#$HOME/$tilde}"
    else
      printf '%-6s %-7s %-28s %s\n' 'reap' "#$issue" 'closed' "${path/#$HOME/$tilde}"
    fi
  done <<<"$paths"

  echo
  if [[ $apply == "--yes" ]]; then
    echo "reaped $reap, kept $kept. Branches are kept unless already on main."
  elif [[ $reap -gt 0 ]]; then
    echo "$reap to reap, $kept kept. Nothing removed — run \`pnpm wt reap --yes\` to apply."
  else
    echo "nothing to reap ($kept kept)."
  fi
  return 0
}

case "${1:-}" in
  new) shift && cmd_new "$@" ;;
  ls | list) cmd_ls ;;
  rm | remove) shift && cmd_rm "$@" ;;
  reap) shift && cmd_reap "$@" ;;
  issue) shift && cmd_issue "$@" ;;
  *)
    # -E because BSD sed does not take `\?` in a basic regex, and leaves the
    # `#` on every usage line when it silently fails to match.
    sed -n '3,10p' "$0" | sed -E 's/^# ?//'
    exit 1
    ;;
esac
