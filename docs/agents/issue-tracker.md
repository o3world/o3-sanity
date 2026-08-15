# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue, then **attach it to a map in the same breath** — see Parent issues below.
An unattached issue is invisible to `pnpm frontier` whatever else is true of it.

## When a skill says to apply `ready-for-agent`

That label does not exist here. `/setup-matt-pocock-skills` writes the five canonical triage labels
only when the `triage` skill is installed, and it is not; this repo uses `wayfinder:*` and the
frontier instead. Substitute **`wayfinder:task` plus attachment to a map**, which is what makes a
ticket agent-grabbable here. The same substitution covers `needs-triage` and `ready-for-human`:
the first is a ticket nobody has attached yet, the second is `awaiting:nick`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Parent issues, dependencies, and the frontier

This applies to **any** issue with children — the wayfinder map (#1), the migration super story (#25), or anything later. Wayfinder adds vocabulary on top of it; the mechanics below are general.

- **Children** are GitHub **sub-issues** of the parent (`gh api repos/<owner>/<repo>/issues/<parent>/sub_issues`).
- **Blocking** is GitHub's **native issue dependencies** — the canonical, UI-visible representation, not a line of prose in the body. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub then reports `issue_dependencies_summary.blocked_by` — open blockers only, which makes it a live gate.
- **Frontier query**: `pnpm frontier [parent]` (defaults to #25). A child is **READY** when it is open, has zero open blockers, and has no assignee. Among READY tickets, take the highest `unblocks:` count first.
- **Claim before you work**: `gh issue edit <n> --add-assignee @me` — the session's first write, and the only thing preventing two parallel sessions from taking the same ticket. `pnpm wt new <n>` does this for you and refuses a blocked or already-claimed ticket.
- **Resolve**: `gh issue comment <n> --body "<what changed, and any decision made>"`, then `gh issue close <n>`. If the parent carries a Decisions-so-far or checklist section, update it in the same pass.

Running several tickets at once — worktree setup, shared-file discipline, merge rules — is in [`worktrees.md`](./worktrees.md).

## Wayfinding operations

Used by `/wayfinder`, on top of the general mechanics above. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking, frontier, claim**: as above. Wayfinder adds one tiebreaker — where the general rule takes the highest `unblocks:` count, a map takes **first in map order**, because a map is a route and its order carries intent.
- **Resolve**: the general resolve step, plus append a context pointer (gist + link) to the map's Decisions-so-far.
