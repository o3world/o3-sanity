#!/usr/bin/env bash
#
# What can be picked up right now?
#
#   pnpm frontier          the migration super-story (#25)
#   pnpm frontier 1        any other parent issue
#
# Reads GitHub's native issue dependencies. A child is READY when it is open,
# has zero OPEN blockers, and nobody has claimed it. Claiming is `--add-assignee`,
# which `pnpm wt new` does for you — so two sessions never take the same ticket.

set -euo pipefail

PARENT="${1:-25}"

gh api "repos/{owner}/{repo}/issues/$PARENT/sub_issues" --paginate \
  --jq '.[] | [.number, .state] | @tsv' |
  while IFS=$'\t' read -r n state; do
    [[ $state == "open" ]] || continue

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
  done | sort
