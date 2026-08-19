---
name: figma-sync
description: Run the Figma change-detection pipeline and turn its report into action — file tickets for real design changes, group them sanely, ask the user about untracked frames, reconcile locked assets, and commit the sync. Use when asked to "sync figma", "check figma updates", "run the figma pipeline", "did the design change", "figma changed", or before building a page layer that the design file may have moved under.
---

# Figma sync

The design file is the source of record (`docs/agents/figma.md`). This skill is how the
repo finds out it moved, and what the repo does about it.

**The split is the whole design.** `pnpm figma:sync` is deterministic and side-effect-free
beyond the repo: it hashes tracked subtrees, diffs them against the committed baseline,
re-exports the unlocked assets whose source node moved, and writes a structured report.
It decides nothing. Everything below — noise or real, one ticket or three, ticket or
question — is judgment, and it lives here.

Schema detail lives in **[`tools/figma-sync/README.md`](../../../tools/figma-sync/README.md)**
— report keys, manifest fields, the re-export decision matrix, what normalization strips.
Read it when a key surprises you; do not re-derive it here.

Facts you will need repeatedly:

|                        |                                                                                |
| ---------------------- | ------------------------------------------------------------------------------ |
| File key               | `RvraLJaZ0zWm8UaD5AJf43` — _O3DX: Visual exploration_                          |
| Design Concept section | `1632:1510` — the only canonical section                                       |
| Frame/set manifest     | `tools/figma-sync/data/tracked-nodes.json`                                     |
| Asset provenance       | `tools/figma-sync/data/asset-manifest.json`                                    |
| Report                 | `tools/figma-sync/data/report.json` (`report.md` is the same run for a human)  |
| ↳ what it describes    | the last run that **fetched** something — a short-circuited run writes nothing |

---

## 1. Run it, read the report

```sh
pnpm figma:sync
```

If it dies on a missing token, run `pnpm env:pull` — `tools/figma-sync/src/env.ts` reads
`FIGMA_API_KEY` from the environment first, then `apps/web/.env.local`.

Read `tools/figma-sync/data/report.json`. Read the two manifests alongside it: they are
what turn a node id into a route or a code path.

**Stop conditions — check these before anything else.**

- the command printed **"no changes since `<syncedAt>`"** → the file's version never moved.
  It short-circuited, and a short-circuited run **writes nothing**: the report files on disk
  still describe the last _real_ run, so do not read them as this run's findings.
- every section empty (`changedFrames`, `changedComponentSets`, `untrackedFrames`,
  all three `assets` arrays, `errors`) → the file moved somewhere the repo does not
  watch. Also nothing to do.

In either case: say **"nothing changed since `<syncedAt>`"**, file no tickets, and commit
nothing. There is nothing to clean up — `git status` in `tools/figma-sync/data/` is already
clean, and if it is not, the run was not a short-circuit. Then stop; do not continue to
step 2 looking for something to say.

A short-circuited run still prints any **unreconciled locked-asset conflicts** the baseline
is carrying (`N unreconciled locked-asset conflict…`). That is not "nothing changed" —
handle it per the `lockedConflicts` rule below before you stop.

**`errors` is not a design finding.** A non-empty `errors[]` means a tracked id the file
no longer has, or a manifest that describes another file — the machinery is wrong, not the
design. Surface it first, fix the manifest or ask, and do not file design tickets on top of
a broken run.

---

## 2. Look at what actually changed

The report tells you _that_ a hash moved and _where it routes_. It cannot tell you whether
that was a comma or a new section, and a ticket that says "the Home frame changed" is
worthless. Go look.

**Correlation is already done for you.** A `changedFrames` entry carries `route` and
`variant`; a `changedComponentSets` entry carries `codeComponent` (`path#Symbol`, or `null`
for a set that maps to nothing). `tracked-nodes.json` has the same fields plus any `note`.

**Fetch the changed subtree.** Prefer the REST-backed MCP server — the official
`mcp__figma__*` server is rate-limited to uselessness on this account and is for
screenshots only (`docs/agents/figma.md`):

```
ToolSearch: select:mcp__figma_rest__get_figma_data,mcp__figma_rest__download_figma_images
```

`get_figma_data({ fileKey: "RvraLJaZ0zWm8UaD5AJf43", nodeId: "1680:2134", depth: 3 })` —
`depth` 2–3 to find the region that moved, 4–5 for text content, fills and layout. Node ids
use `:`, never `-`.

Or straight to the API, the same call the script makes:

```sh
curl -s -H "X-Figma-Token: $FIGMA_API_KEY" \
  "https://api.figma.com/v1/files/RvraLJaZ0zWm8UaD5AJf43/nodes?ids=1680:2134&depth=4"
```

**Compare against what the code renders today.** Page content is Sanity data, not JSX:
seed documents in `tools/migration/data/seed/`, block renderers in
`packages/content-ui/src/blocks/`, routes under `apps/web/src/app/(site)/`. A component set
names its target outright (`packages/ui/src/components/ui/button.tsx#Button`). The previous
run's report is in git (`git log -p -- tools/figma-sync/data/report.json`) when you need to
know whether this frame has been churning.

Come out of this step with **one sentence per changed entry**: copy tweak, restyle, layout
change, new section, component swap — or _"changed, could not attribute"_. That sentence is
the ticket's title and the reason it is worth someone's afternoon. "Could not attribute" is
a legitimate answer; write it in the ticket rather than inventing a story.

---

## 3. Judgment rules

### Noise versus real

Canvas repositions are already gone — `normalize.ts` strips absolute x/y, prototype wiring
and friends before hashing, so a moved hash means something inside the subtree really
changed. It does not mean somebody should build something. These are noise:

- **Non-canonical or scratch content.** The file holds two generations of the same site
  (`docs/agents/figma.md`); a change you can only reach through generation-1 content, a
  hidden layer, or a scratch copy parked inside a tracked frame is not work.
- **A component set whose `codeComponent` is `null`.** The set maps to nothing on purpose
  and the manifest note says why. Note it and move on — **unless** a canonical frame now
  instances it, in which case the finding is "this set just became canonical", which _is_ a
  ticket, and a good one.
- **A change you looked at and could not tie to any visible design consequence.** Say so
  plainly.

Noise is **never silent**. Every entry in `changedFrames` and `changedComponentSets` ends
up either in a ticket or in a named line of the sync commit message with its reason. If you
cannot account for one, it is not noise — it is unfinished triage.

### Grouping — fewer, larger tickets win

- **One component-set rework = one ticket**, routed at its `codeComponent`. Page frames
  that changed _only because they instance that set_ fold into that ticket: list them under
  "shows on" with their routes and node ids. Do not file them separately. The pipeline
  reports the set alongside the frames precisely so you can collapse them.
- **Independent page-layer changes = one ticket per page layer.** Desktop and mobile of the
  same `route` are the **same ticket** — two frames, one change, one piece of work.
- **A set that shows everywhere** — `NavBar` `1710:2271` → `packages/content-ui/src/chrome/SiteNav.tsx#SiteNav`
  — is one ticket at the component. Never one per page. (`Footer` `1280:1885` is the
  counter-case: tracked, but `codeComponent: null` because `SiteFooter` was built from the
  frame's footer instead. Read the note before assuming a set routes anywhere.)
- **Different routes are different tickets**, even when the change rhymes: they land in
  different content and different documents.

When in doubt, file fewer. A ticket naming three frames is workable; three tickets each
holding a third of one change are not.

### `untrackedFrames` → questions for the user, never tickets

A frame in the Design Concept section that the manifest has never heard of is **not** a
finding. "It exists in the section" and "it is canonical" are different claims, and this
skill does not make the second one. Do not file a ticket. Do not edit `tracked-nodes.json`.

Take a quick look at each one (step 2's tooling, `depth: 1` is usually enough), then present
them and **wait**:

> New frame **Contact** (`2050:891`, 1440w) appeared in the Design Concept section. It looks
> like a full contact page with a form. Canonical — add it to `entries[]` with a route and
> variant? Or noise — add it to `ignoredNodeIds[]` with a reason?

Apply only what the user decides. Leaving one open is a legitimate answer: the report keeps
asking every run, which is the intended state for work in progress. If nobody is available
to answer, hand the list back as an open question and finish the rest of the run — do not
decide it yourself.

### `assets.lockedConflicts` → reconcile tickets

The design moved underneath a file somebody hand-edited; nothing was written. One ticket per
conflicted asset, **quoting the manifest's `note` verbatim** — that note is what to reconcile
against (a hand-crop, a higher-resolution original, a source that moved). Combine into one
ticket when several share a cause (the two hand-cropped `live-*.png` crops are one story).

**Check `state` first — it decides whether you file anything at all.** A conflict persists in
the baseline until it is reconciled, so it is re-reported by every run:

- `state: "firstSeen"` → new this run. Triage it, then file.
- `state: "stillOpen"` → it was reported before, on `firstSeenAt`, and **a ticket for it
  almost certainly already exists**. Look before filing a duplicate:

  ```sh
  gh issue list --state all --search "<asset filename> in:title,body" --limit 20
  ```

  Found one that is still open → say so ("`live-fintech.png` still unreconciled, #93 open
  since …") and file nothing. Found one that was **closed** without the conflict clearing →
  that is worth saying out loud: the fix did not close the conflict, which usually means the
  manifest entry was never updated. Found nothing → file it now and note that it has been
  open since `firstSeenAt`.

**Then check `reason`.** `node-changed` is a real conflict — the design moved. But
`new-to-baseline` means nothing had ever hashed that node: a first run, or a manifest
addition. That is the baseline being seeded, not a design change. Confirm against
`git show HEAD:tools/figma-sync/data/baseline.json` — if the previous baseline had no hash
for that node, note it in the commit message and file nothing.

**A conflict only closes when the manifest entry changes** — `nodeId` remapped, `locked`
lifted, the entry deleted, or the `note` rewritten to describe the reconciliation. Fixing the
asset file without touching `asset-manifest.json` leaves the conflict open for ever, so
whoever does the work has to land the manifest edit in the same commit. Say that in the
ticket. (Full mechanic: `tools/figma-sync/README.md`, "How a conflict closes".)

### `assets.failures` → investigate, then ticket if it persists

A failure writes nothing and records no baseline hash, so the next run retries by itself.
Re-run `pnpm figma:sync` once: a 429 or a dead download URL clears. A failure that survives
a re-run is usually a manifest entry pointing at the wrong layer (a `null` image URL, a lost
`imageRef`) — file one ticket naming the `path`, `nodeId` and the exact `error` string.

### `assets.regenerated` → no ticket

They were overwritten in place and they are in the git diff of the sync commit, which is the
review surface. Look at the diff. If a regenerated asset is visibly wrong — blanked, uncropped,
downscaled — _that_ is a ticket, and the fix is often a `locked` entry in
`asset-manifest.json` with a note saying why.

### Quick reference

| Report section           | Default                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `changedFrames`          | ticket per page layer (desktop + mobile together), unless it folds into a set's ticket |
| `changedComponentSets`   | one ticket at `codeComponent`; `null` target → note, no ticket                         |
| `untrackedFrames`        | question to the user; never a ticket, never a manifest edit                            |
| `assets.regenerated`     | no ticket — read the git diff                                                          |
| `assets.lockedConflicts` | `firstSeen` → reconcile ticket, quoting the note; `stillOpen` → find the existing one  |
| `assets.failures`        | re-run once; persistent → one ticket                                                   |
| `errors`                 | fix the machinery first, before any design triage                                      |

---

## 4. File the tickets

Conventions are in [`docs/agents/issue-tracker.md`](../../../docs/agents/issue-tracker.md);
this is that procedure with the Figma specifics filled in.

```sh
gh issue create --label wayfinder:task --title "..." --body "$(cat <<'EOF'
...
EOF
)"
```

Every body names the evidence, because the reader will not have this report:

- the **route(s)** and the frame names, with **node ids** and variants
- the `codeComponent` for a component-set change
- **what changed** — step 2's sentence, not "the hash moved"
- where it lands in code (block renderer, seed document, UI component)
- a provenance line: ``Found by `pnpm figma:sync` on <report.ranAt>, file version <report.fileVersion>.``

Link it to the map — filed design changes are children of **#33**, _Wayfinder map: Figma as
source of record → the built site_. The sub-issues API takes the child's **database id**,
not its number:

```sh
CHILD=$(gh api repos/o3world/o3-sanity/issues/<new-number> --jq .id)
gh api --method POST repos/o3world/o3-sanity/issues/33/sub_issues -F sub_issue_id=$CHILD
```

### The project board

Org **o3world**, project **5** (`PVT_kwDOAE6UPc4BfG9l`). Add the item, then set two fields:

```sh
ITEM=$(gh project item-add 5 --owner o3world --url <issue-url> --format json --jq .id)

# Track
gh project item-edit --id "$ITEM" --project-id PVT_kwDOAE6UPc4BfG9l \
  --field-id PVTSSF_lADOAE6UPc4BfG9lzhZcO3Q --single-select-option-id <track-option>

# Kind = task
gh project item-edit --id "$ITEM" --project-id PVT_kwDOAE6UPc4BfG9l \
  --field-id PVTSSF_lADOAE6UPc4BfG9lzhZcO3U --single-select-option-id c4e021dd
```

`item-add` on an issue already on the board returns the existing item, so it is safe to run
either way.

**Track** — pick by what the change touches, not by where it was spotted:

| Option        | Id         | For                                                                                   |
| ------------- | ---------- | ------------------------------------------------------------------------------------- |
| Page layer    | `debb6e8c` | a page frame changed: content, section layout, a route's composition                  |
| Design system | `efec90f4` | a component set or token changed: the shared UI, wherever it shows                    |
| Migration     | `ff81609b` | seed data or a seed asset needs regenerating/reconciling                              |
| Infra         | `a4b16e47` | the pipeline itself — a manifest pointing at a dead node, a persistent export failure |

**Kind** is always `task` (`c4e021dd`) for anything this skill files.

### ⚠️ Set values on items. Never touch the fields themselves.

`gh project item-edit --single-select-option-id` sets **one item's** value. That is the only
board write this skill makes.

**Never** edit a field's options — `gh project field-*`, or the `updateProjectV2Field`
GraphQL mutation. Saving a single-select field's options **wipes that field's value on every
item on the board**, silently, and there is no undo. If an option you want does not exist,
stop and ask the user; do not create it.

---

## 5. Commit, then report

A sync is a commit — `data/baseline.json` is what makes the next run's short-circuit
possible, and any asset the run rewrote belongs in the same diff. (A short-circuited run has
nothing to commit: it wrote nothing. Confirm with `git status tools/figma-sync/data`.)

```sh
git add tools/figma-sync/data tools/migration/data/seed/assets
git commit
```

Conventional commit, summarizing the run and naming what it produced:

```
chore(figma-sync): the button set was reworked, and two pages show it

Ran against file version 2383642339965845360.

- Button / Solid `136:754` → button.tsx#Button — filed #91 (Design system)
- Home `1680:2134` / `1814:1618` — instances of that set, folded into #91
- Live `1644:1889` — a new testimonial band, filed #92 (Page layer)
- Case Study detail `1710:2300` — noise: change confined to a hidden
  generation-1 capture inside the frame
- 5 assets re-exported; 3 locked conflicts were new-to-baseline seeding
- 6 untracked frames still open — asked, awaiting a decision
```

Then tell the user, in this order:

1. **Filed** — each ticket number, its title, its Track, and the one-sentence reason.
2. **Asked** — the untracked frames awaiting a canonical/noise call, and anything you could
   not attribute.
3. **Skipped** — every changed entry treated as noise, each with its reason.
4. **Assets** — regenerated (point at the diff), conflicted, failed.

Push per the repo's normal flow. Do not close anything: a filed ticket is the start of the
per-ticket agent flow, not the end of it.
