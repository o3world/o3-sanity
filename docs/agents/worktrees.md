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

## Or from Orca

Orca creates worktrees from the app side, under
`~/orca/workspaces/o3-sanity/<name>`. It runs the same provisioning through
`orca.yaml`, so a checkout is set up identically whichever made it:

```bash
orca worktree create --repo path:$PWD --name <task> --agent claude --json
```

Orca does not know about the frontier, so it will not claim the ticket or
refuse a blocked one — do that yourself
(`gh issue edit <n> --add-assignee @me`) before starting work. That is the only
difference; `pnpm wt new` remains the shorter path when you are working from a
ticket number.

Orca reads `orca.yaml` only when the repo's command source is set to
**orca.yaml** (or _orca.yaml + local_) in its repo settings. A repo left on
_local only_ silently ignores the file and keeps running whatever command is
stored in the app — the failure mode is a worktree with node_modules and no
env.

## What provisioning does

`git worktree add` alone leaves you with a checkout that cannot build.
`scripts/worktree-provision.sh` is the shared body both paths call, and it
does four things:

1. **Carry the gitignored env across** — `.env.local`, `apps/web/.env.local`,
   `.vercel/project.json`. Without these a worktree can't reach Sanity or
   Vercel, and the failure looks like a code bug rather than a missing file.
2. **Symlink `prototype/`** — 22 MB of seed image assets, gitignored, that the
   migration seed test asserts against. Without it that suite fails in every
   worktree for reasons that have nothing to do with the ticket being worked.
3. **Allocate dev ports**, written to the worktree's own `.env`: web from
   3600-3609, storybook from 6660-6669, skipping anything a sibling worktree
   has already claimed or that is currently listening. Two checkouts both
   booting on 3600 is the first thing that breaks when a second session starts.
4. **`pnpm install`.** node_modules is not shared between worktrees.

It is safe to re-run and will not overwrite an env file, a symlink, or a `.env`
that is already there.

**The web port pool is bounded by Sanity CORS.** Every port a browser hits
needs a matching origin on the project or client logos and live content stop
rendering. 3600-3609 are registered; widening the pool means registering the
new ports first:

```bash
pnpm sanity cors add http://localhost:<port> --credentials
```

**The test suite pins its own port, so `WEB_PORT` cannot reach a canonical
URL.** `vitest.config.mts` sets `WEB_PORT=3000` on both the `unit` and `render`
projects (#116). Before that, Vitest loaded the worktree's `.env`, `getBaseUrl()`
read the allocated port, and seven SEO assertions failed in every worktree over
a port rather than over the ticket being worked. If you see a canonical-URL
failure mentioning `:36xx`, that pin has been removed or bypassed — restore it
rather than editing the expected URL, which lands a hardcoded port in a test and
breaks the next worktree differently.

Worktrees live **outside** the checkout — `../o3-sanity-worktrees/<issue>-<slug>`
for `pnpm wt`, `~/orca/workspaces/o3-sanity/<name>` for Orca. Each carries its
own ~1.1 GB node_modules; nesting that under the checkout puts it in front of
every editor indexer and file glob in the toolchain. Claude Code's own
auto-worktrees still land in `.claude/worktrees/` (gitignored) — `pnpm wt ls`
lists them all, and they should all be removed when done.

## Tearing one down

`pnpm wt rm <n>` removes the worktree and its branch if merged. Orca's archive
hook runs `scripts/down.sh` before removing a worktree, which stops only the
dev servers whose working directory is inside _that_ checkout — the other
sessions' servers are left alone. Removing a worktree by hand skips that; run
`pnpm down` in it first.

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
