# Parallel work: worktrees and the frontier

Several agent sessions work this repo at once. This is how they stay out of each
other's way.

The unit of parallelism is **one ticket, one worktree, one session**. Not one
session juggling three tickets, and not three sessions in one checkout.

## The loop

```bash
pnpm frontier        # what's ready?  (defaults to the #25 super story)
pnpm wt new 26       # claim #26, branch, install, carry env across
cd ../o3-sanity-worktrees/26-seo-extraction-discipline && claude
# …work the ticket…
pnpm wt rm 26        # after it's merged
```

`pnpm frontier` prints every open child of a parent issue as `READY`,
`BLOCKED(n)`, or `CLAIMED@who`, with an `unblocks:n` column. **Among READY
tickets, take the highest `unblocks` first** — that's the one the most other work
is waiting on. Right now that ordering puts #26 ahead of #20 ahead of #19, which
is exactly the sequence #25 describes in prose.

`pnpm wt new <n>` refuses a ticket that has open blockers or an existing
assignee, so the frontier rules are enforced where work actually starts rather
than in a document nobody re-reads. `--force` overrides both.

## Why the script exists

`git worktree add` alone leaves you with a checkout that cannot build. Three
things have to happen after it:

1. **`pnpm install`.** node_modules is not shared between worktrees.
2. **Carry the gitignored env across** — `.env.local`, `apps/web/.env.local`,
   `.vercel/project.json`. Without these a worktree can't reach Sanity or
   Vercel, and the failure looks like a code bug rather than a missing file.
3. **Claim the issue** (`--add-assignee @me`), which is what stops two sessions
   picking up the same ticket.

Worktrees live in a **sibling** directory, `../o3-sanity-worktrees/<issue>-<slug>`,
not inside the repo. Each carries its own ~1.1 GB node_modules; nesting that
under the checkout puts it in front of every editor indexer and file glob in the
toolchain. Claude Code's own auto-worktrees still land in `.claude/worktrees/`
(gitignored) — `pnpm wt ls` lists both, and both should be removed when done.

## Turbo remote cache — do this once

Worktree #2 onward runs `lint`, `typecheck`, and `build` completely cold unless
the local machine is linked to the remote cache. CI already uses it
(`TURBO_TOKEN`/`TURBO_TEAM` in every workflow); local machines are not linked by
default. It is the single biggest cost in running several worktrees:

```bash
pnpm turbo login && pnpm turbo link
```

## Shared surfaces — the one real conflict risk

Tickets #17, #18, #21, and #22 all add mappers to the same `tools/migration`
converter, and any ticket adding a dependency touches `pnpm-lock.yaml`. These
are deliberately **not** modelled as blocking dependencies — that would
serialize work that is genuinely parallel, for a merge cost that is small when
handled and expensive only when ignored.

The discipline instead:

- **Append, don't restructure.** A ticket adds its mapper to the existing
  registry. Reshaping the converter's interface is a separate conversation
  (`/grilling` + an ADR), not something one content ticket does on the way past.
- **Rebase on `main` before you merge**, not after you've finished. A worktree
  that hasn't seen main in a day is the expensive case.
- **Lockfile conflicts resolve by regenerating**, never by hand-merging: take
  `main`'s `pnpm-lock.yaml`, re-run `pnpm install`, commit the result.

## Merging

While the repo is early: **branch locally, merge locally, push to `main`.** Run
`pnpm test` and `pnpm verify` in the worktree as the checkpoint — don't open a PR
and wait for CI to go green before merging. Reserve branch + PR + wait-for-checks
for changes that are genuinely risky or that another live session is editing.
