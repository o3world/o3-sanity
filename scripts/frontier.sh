#!/usr/bin/env bash
#
# What can be picked up right now?
#
#   pnpm frontier          every open wayfinder map
#   pnpm frontier 33       one parent issue, and everything under it
#
# Reads GitHub's native issue dependencies. A child is READY when it is open,
# has zero OPEN blockers, and nobody has claimed it. Claiming is `--add-assignee`,
# which `pnpm wt new` does for you — so two sessions never take the same ticket.
#
# The walk is recursive: a ticket that groups its own sub-issues (#83, the Figma
# sync epic) reports its children, not itself. Only leaves are pickable.
#
# No argument used to mean "#25", which closed on 2026-08-03 and left a bare
# `pnpm frontier` walking an all-closed list — a frontier tool that silently
# reports nothing is worse than no frontier tool. The default is now every open
# map, so a ticket is invisible here only if it hangs off no map at all. That is
# a real condition worth seeing, and it is what `orphans` reports.

set -euo pipefail

COVERED=$(mktemp)
trap 'rm -f "$COVERED"' EXIT

walk() { # $1 = parent issue number
  local kids
  kids=$(gh api "repos/{owner}/{repo}/issues/$1/sub_issues" --paginate \
    --jq '.[] | select(.state == "open") | .number' 2>/dev/null) || return 0
  [[ -n $kids ]] || return 0

  local n
  for n in $kids; do
    echo "$n" >>"$COVERED"

    # A parent of open sub-issues is a grouping, not a task. Recurse past it.
    if [[ -n $(gh api "repos/{owner}/{repo}/issues/$n/sub_issues" --paginate \
      --jq '.[] | select(.state == "open") | .number' 2>/dev/null) ]]; then
      walk "$n"
      continue
    fi

    local title blocked blocking assignee status
    IFS=$'\t' read -r title blocked blocking assignee < <(
      gh api "repos/{owner}/{repo}/issues/$n" \
        --jq '[.title,
               (.issue_dependencies_summary.blocked_by // 0),
               (.issue_dependencies_summary.blocking // 0),
               ((.assignees // []) | map(.login) | join(","))] | @tsv'
    )

    if [[ -n $assignee ]]; then
      status="CLAIMED@$assignee"
    elif [[ $blocked -gt 0 ]]; then
      status="BLOCKED($blocked)"
    else
      status="READY"
    fi

    # Unblocks-N is the tiebreaker: among READY tickets, take the one the most
    # other work is waiting on.
    printf '%-18s #%-3s unblocks:%-2s %s\n' "$status" "$n" "$blocking" "$title"
  done
}

roots() {
  if [[ $# -gt 0 ]]; then
    printf '%s\n' "$1"
  else
    gh issue list --state open --label 'wayfinder:map' --limit 50 \
      --json number --jq '.[].number'
  fi
}

for root in $(roots "$@"); do
  walk "$root"
done | sort

# Only meaningful for the full walk. Scoped to one parent, "not under this
# parent" is the normal case, not a finding.
[[ $# -eq 0 ]] || exit 0

# Anything hanging off no open map is invisible to the walk above — the failure
# mode that hid #60 for two days. Name it rather than let it stay silent.
# `comm` compares as strings, so both sides sort lexicographically, not -n.
orphans=$(
  comm -23 \
    <(gh issue list --state open --label 'wayfinder:task' --limit 200 \
      --json number --jq '.[].number' | sort -u) \
    <(sort -u "$COVERED")
)

if [[ -n $orphans ]]; then
  echo
  echo "ORPHANED — open tasks under no map. Attach them or close them:"
  for n in $orphans; do
    printf '  #%-3s %s\n' "$n" \
      "$(gh issue view "$n" --json title --jq .title)"
  done
fi
