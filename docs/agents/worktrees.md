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
pnpm wt reap         # or sweep every checkout whose ticket is closed
pnpm wt issue <path> # which ticket does this checkout belong to?
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

Create it **from an issue** and `orca.yaml`'s `issueCommand` runs
`scripts/orca-hooks.sh issue`, which claims the ticket and renames the branch to
carry its number — `NickO3/wayfinder-map` becomes `NickO3/159-wayfinder-map`.
Orca names a checkout after the session's intent and cannot be told otherwise,
so the branch is the only half of the pair that can hold the ticket; putting it
there is what lets `wt issue`, and so `reap`, `ls` and `rm`, place the checkout
at all.

Created any other way, nothing claims the ticket and nothing binds the checkout
to it. Orca still will not refuse a blocked ticket the way `pnpm wt new` does —
check `pnpm frontier` first. `pnpm wt new` remains the shorter path when you are
working from a ticket number.

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
   `apps/o3xo/.env.local` comes too when the main checkout has one; it is
   optional, because that brand's dataset reads anonymously.
2. **Symlink `prototype/`** — 22 MB of seed image assets, gitignored, that the
   migration seed test asserts against. Without it that suite fails in every
   worktree for reasons that have nothing to do with the ticket being worked.
3. **Allocate dev ports**, written to the worktree's own `.env`: `WEB_PORT`
   from 3600-3609, `XO_WEB_PORT` from 3700-3709, `STORYBOOK_PORT` from
   6600-6609 and `XO_STORYBOOK_PORT` from 6700-6709, skipping anything a
   sibling worktree has already claimed or that
   is currently listening. Two checkouts both booting on 3600 is the first thing
   that breaks when a second session starts.
4. **`pnpm install`.** node_modules is not shared between worktrees.

It is safe to re-run and will not overwrite an env file, a symlink, or a `.env`
that is already there.

**The web port pools are bounded by Sanity CORS, one pool per brand.** Every
port a browser hits needs a matching origin, and an origin belongs to one Sanity
project — so 3600-3609 are registered on o3's and 3700-3709 on o3xo's (ADR 0028).
Boot an app on the other brand's port and the page loads while every read fails.
Widening a pool means registering the new ports first, on that brand's project:

```bash
pnpm sanity cors add http://localhost:<port> --credentials
```

**The test suite pins its own origin, so `WEB_PORT` cannot reach a canonical
URL.** Vitest loads the worktree's `.env`, and `getBaseUrl()` reads
`NEXT_PUBLIC_BASE_URL`, then the Vercel hosts, then `WEB_PORT` — so unpinned,
the canonical/OpenGraph assertions would compare against whichever port this
checkout owns, or a deployment host in CI. `vitest.config.mts` pins both
`WEB_PORT=3000` and `NEXT_PUBLIC_BASE_URL=http://localhost:3000` on the `unit`
and `render` projects (#116). If a canonical assertion fails on a `:36xx` port
or a vercel.app host, that pin has been removed or bypassed — restore it rather
than editing the expected URL, which lands a hardcoded port in a test and
breaks the next worktree differently.

Worktrees live **outside** the checkout — `../o3-sanity-worktrees/<issue>-<slug>`
for `pnpm wt`, `~/orca/workspaces/o3-sanity/<name>` for Orca. Each carries its
own ~1.1 GB node_modules; nesting that under the checkout puts it in front of
every editor indexer and file glob in the toolchain. Claude Code's own
auto-worktrees still land in `.claude/worktrees/` (gitignored) — `pnpm wt ls`
lists them all, and they should all be removed when done.

## Tearing one down

`pnpm wt rm <n>` removes the worktree and its branch if merged.

`pnpm wt reap` does the same for every checkout at once, asking `gh` whether
each one's ticket is closed. It reports and stops — pass `--yes` to apply. A
checkout is kept when its ticket is open, when the tree is dirty, or when
nothing in its name or branch says which ticket it belongs to.

`pnpm wt issue <path>` is that last question on its own — the ticket a checkout
belongs to, or exit 1. `reap` decides what to sweep by it and `rm <n>` finds a
checkout by it, so it is the one place to look when a worktree is being kept and
you cannot see why. A worktree Orca made before `issueCommand` existed is the
usual answer: nothing put the ticket in its branch, so rename it by hand
(`git branch -m <login>/<issue>-<name>`) if you want it swept.

Reaping is the step that was missing while `wt new` ran at every claim and
nothing ran at any close. By August 2026 twenty checkouts for long-closed
tickets held 26 GB. Branches are never the thing at risk: `git branch -d`
refuses one whose commits are not already on main, and fourteen of those
branches had never been pushed anywhere.

Orca's archive
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
