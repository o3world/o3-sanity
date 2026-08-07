# @o3/figma-sync

Change detection against the design source of record (#78, #79, #81). One command:

```sh
pnpm figma:sync
```

It answers three questions — **which canonical page frames changed since the last sync, which
component sets changed, and is there design work in the file nobody is watching?** — answers the
first two cheaply when the answer is "none", and then does the one mechanical thing those answers
imply: **re-exports the committed seed assets whose source node moved**.

```
1. GET /v1/files/RvraLJaZ0zWm8UaD5AJf43?depth=1     ← one call, file metadata only
2. version + lastModified match the baseline, and the baseline covers every
   tracked node *and* every asset source node?
                   →  "no changes since <syncedAt>", exit 0. One API call total,
                      and **nothing on disk is touched** — see below.
3. otherwise       →  GET /v1/files/:key/nodes?ids=… in small batches,
                      normalize each subtree, sha256 it, diff against the baseline
4. …and one GET /v1/files/:key/nodes?ids=<section>&depth=1 — the new-frame probe
5. …and, for the assets whose source node moved, GET /v1/images or
   GET /v1/files/:key/images, then overwrite the committed file in place
6. write data/baseline.json + data/report.{json,md}, print the summary
```

Authentication is the standard `FIGMA_API_KEY` from the dev environment — the same sourcing as
`scripts/figma-mcp.sh` (`process.env`, else `apps/web/.env.local`). If it is missing, run
`pnpm env:pull`. This calls the REST API directly rather than going through MCP: it has to be
deterministic and runnable unattended, and the official MCP server is rate-limited to uselessness on
this account (`docs/agents/figma.md`).

**A sync is a commit.** `data/baseline.json` is what makes the next run's short-circuit possible, so
commit it along with the report; git carries the history, the files only ever describe the last run.

**A short-circuited run writes nothing at all** — not the report, not the baseline, not a fresh
`ranAt`. There is nothing to commit because nothing was learned, and rewriting the report with a new
timestamp would clobber the last real run's findings and make every consecutive-run `git diff`
non-empty for no reason. So `data/report.{json,md}` always describes **the last run that had
something to say**, and running `pnpm figma:sync` twice in a row leaves `git status` clean.

The one thing that has to survive that silence is an unreconciled locked-asset conflict, and it does:
the baseline carries open conflicts (below), and a short-circuited run prints them:

```
no changes since 2026-08-04T03:36:18.480Z
1 unreconciled locked-asset conflict — nothing was written, and nothing has closed them:
  conflict tools/migration/data/seed/assets/live-fintech.png  ← 1751:2003 (open since …)
nothing written — tools/figma-sync/data/ still describes the last real run
```

**The judgment layer lives in [`.claude/skills/figma-sync`](../../.claude/skills/figma-sync/SKILL.md)**
(#82) — invoked as `/figma-sync`. This package decides nothing: it hashes, diffs, re-exports the
unlocked assets whose source moved, and writes the report. What counts as noise, which changes group
into one ticket, what goes to the user as a question instead of a ticket, and everything that touches
GitHub is written down in that skill. The report schema below is the seam between the two.

## `data/tracked-nodes.json` — what we watch

Hand-maintained: the page frames are promoted from the frame inventory on
`research/figma-frame-inventory`, the component sets from
[`docs/figma-components.md`](../../docs/figma-components.md) — this file is that document's
machine-readable half.

| Field              | Meaning                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `fileKey`          | `RvraLJaZ0zWm8UaD5AJf43` — _O3DX: Visual exploration_                         |
| `sectionNodeId`    | `1632:1510`, the Design Concept section — what the new-frame probe reads      |
| `entries[]`        | `{ nodeId, kind, name, figmaName?, route?, variant?, codeComponent?, note? }` |
| `ignoredNodeIds[]` | `{ nodeId, name?, note }` — section residents the probe must stay quiet about |

- `nodeId` is a **verified** node id in `1680:2134` form. A share URL's `node-id` is usually a
  child, not the frame, and it uses `-` — both mistakes are caught by `manifest.test.ts`.
- `name` is the page layer in this project's language (CONTEXT.md), not the Figma layer name: two
  different frames are called "Insights" in that file and neither is the Insights index.
  `figmaName` records what Figma calls it. For a component set the two are the same string — the
  Figma set name _is_ what this project calls it.
- `kind: "pageFrame"` carries a `route` and a `variant`; `kind: "componentSet"` carries neither
  (a set is not a breakpoint) and carries a `codeComponent` instead.
- `variant` is `desktop` (1440) or `mobile` (402). About and Solutions have no mobile frame; that is
  a real gap in the file, not a missing entry.

### Component sets (#79)

All 24 nodes in the component→code map, canonical and not — a rework of `Button / Solid` should
report as "that set changed", routed to its one cva component, rather than as unexplained diffs on
every page frame that instances it.

- `codeComponent` is `path#Symbol` relative to the repo root, and `manifest.test.ts` fails if the
  file it names does not exist.
- A set the document says maps to nothing spells **`"codeComponent": null` out loud** and carries a
  `note` in that document's words. Absent would be indistinguishable from unaudited; `null` plus a
  reason means somebody looked.
- The non-canonical sets are tracked too, `null` and all. They cost one hash each and they are the
  only way a set quietly becoming canonical — someone reworking `Button / Outline` before a frame
  uses it — shows up at all.
- Two entries are bare `COMPONENT`s, not sets (`NavBar` `1710:2271`, `Footer` `1280:1885`). They
  ride in the same lane: `kind: "componentSet"` means "a library node, not a page".

## `data/asset-manifest.json` — where every seed asset came from

Hand-maintained, same as `tracked-nodes.json`, and for the same reason: it is a set of judgements
about the file, not a query against it. One entry per file in
[`tools/migration/data/seed/assets/`](../migration/data/seed/assets), 30 of them, saying which node
the asset was exported from — or saying **out loud that nobody could find one**.

| Field        | Meaning                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| `path`       | Repo-relative, under `tools/migration/data/seed/assets/`. The join key.        |
| `nodeId`     | The source node, `1928:6505` form. Absent when `unresolved`.                   |
| `figmaName`  | What Figma calls that layer — usually `image 21` or `Case study cards`.        |
| `format`     | `svg` \| `png`, and it must match the file extension.                          |
| `scale`      | The `/v1/images` scale a `render` was taken at. Always `1` for an `imageFill`. |
| `export`     | `render` \| `imageFill` — **the two are different images**, see below.         |
| `locked`     | A re-export must never overwrite this file. Always with a `note` saying why.   |
| `unresolved` | `true` + a `note`. No source node was found and **none was guessed**.          |
| `note`       | The evidence, and how confident it is. Required when `locked` or `unresolved`. |

`asset-manifest.test.ts` enforces the invariants — every file has an entry and every entry has a
file, no path twice, a `:`-separated node id, a locked or unresolved entry that carries its reason,
and an entry that is neither fully resolved nor honestly unresolved is rejected rather than hedged.
`asset-manifest.ts` is the loader; it reports **every** problem it finds, because a hand-edited
manifest usually has more than one.

### `render` vs `imageFill`

The seed assets came out of Figma two different ways, and #81 cannot reproduce either one without
being told which.

- **`imageFill`** — the node's fill original, downloaded whole. Figma keys an image fill by the
  **SHA-1 of its bytes** (`imageRef`), so a committed file whose sha1 equals a node's `imageRef` is
  the same bytes, proved, not resembled. `scale` is meaningless here and is always `1`.
- **`render`** — `GET /v1/images/:key?ids=…&format=png&scale=…`, the node drawn. This is what a
  `note` means when it cites a mean absolute difference: the node re-rendered at the recorded scale
  and compared pixel-for-pixel against the committed file.

Both were verified for every resolved entry. Eight assets resolve; the other twenty-two do not, and
the manifest says why rather than picking a plausible node:

| Not from Figma                            | Why                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------- |
| 12 `partner-*` / `plat-*` / `work-*` PNGs | byte-identical to `prototype/assets/` — the retired prototype (#33)   |
| 3 `insight-weekend-*` PNGs                | design-sourced for the post; no matching fill, no node with its ratio |
| 7 `eng-*` / `insight-process-*` SVGs      | hand-authored animated SVG — see below                                |

### `locked` — three ways to earn it

`locked` means _a re-export would make this file worse_, and every locked entry states which case
it is.

- **Hand-authored, never exported.** The seven animated SVGs. Each carries CSS `@keyframes`, a
  `prefers-reduced-motion` freeze on its final frame, `#EB1000` inlined (an SVG in an `<img>` cannot
  see the page stylesheet), and paragraphs of comment explaining what it draws. Figma exports none
  of that. They are `locked` **and** `unresolved`: there is nothing to overwrite them _from_, and
  the lock is what says so even if somebody later finds a lookalike node.
- **Hand-edited after export.** `live-fintech.png` and `live-saas.png` are pixel-exact 527×544
  crops of their nodes' 791×544 fill originals. A re-export returns the full 791×544 and silently
  undoes the crop.
- **The source moved.** `about-portrait-gadsby.png` is byte-identical to an image still in the
  file's image library but referenced by no node any more; the team card that carried it now
  carries the same portrait at 790×796. Re-exporting would swap a 2500px original for a 790px one.

## Re-export — what a moved source node does to a committed asset (#81)

Every non-short-circuited run hashes the **asset source nodes** exactly the way it hashes a tracked
frame — same `normalize.ts`, same sha256, the same batched `/nodes` call — and keeps the result in
its own `assetHashes` map in the baseline. An asset is _changed_ when its node's hash moves. That is
the whole trigger, and it is deliberately **not** a byte comparison against a fresh export: Figma
renders PNGs non-deterministically, so byte-keying would churn every photographic asset on every run
and the git diff would stop meaning anything.

`assets.ts` splits the work in half — a pure decision, and an executor that is the only thing
allowed to call Figma or write a file:

| Entry              | Its source node's hash | The run…                                               |
| ------------------ | ---------------------- | ------------------------------------------------------ |
| `unresolved`       | —                      | **skips** it. No node to watch; it cannot participate. |
| resolved           | not in the file        | **fails** it — the manifest names a node that is gone. |
| resolved           | same as the baseline   | does **nothing**. No export call is made at all.       |
| resolved, locked   | changed, or new        | reports a **conflict**. The file is never touched.     |
| resolved, unlocked | changed, or new        | **re-exports** and overwrites in place.                |

- **`render`** → `GET /v1/images/:key?ids=…&format=…&scale=…` at the manifest's recorded format and
  scale, batched one call per distinct format+scale, then the returned URL is downloaded. Figma
  answers `null` for an id it will not export rather than failing the call — that `null` is a
  failure, not a skip.
- **`imageFill`** → `GET /v1/files/:key/images` once for the whole `imageRef` → URL library, and the
  entry's `imageRef` is read out of **the node document this run already fetched to hash it**: first
  image fill found, the node's own `fills` before its children's. No extra call, and no second
  source of truth about which node the asset came from. A couple of entries name the card frame
  rather than the rectangle inside it that carries the paint, which is what the descent is for; a
  node with two image fills would be an entry pointing at the wrong layer, and the failure it
  produces says so.
- **A failure never writes.** The download completes before the file is opened, so an API error, a
  dead node or a null URL leaves the committed asset exactly as it was — and **records no baseline
  hash**, so the next run tries again instead of calling it done.

### First run, and what "no churn" actually claims

The steady state is the acceptance criterion: an unchanged source node costs **zero** export calls
and writes nothing. A first baseline is different — every resolved asset is `new-to-baseline` — and
this package **exports on that first run rather than quietly recording hashes**. It is the only
thing that proves the export path reproduces what is committed, and #80's provenance claims are
exactly what it puts to the test. The live first run did that:

> five unlocked assets re-exported — two `render` (scale 3 and scale 1.5) and three `imageFill` —
> and all five came back **byte-identical** to the committed files. `git status` on
> `tools/migration/data/seed/assets/` was empty afterwards.

So the churn the ticket worried about did not happen, and the case for recording-without-exporting
never arose. If a future manifest addition ever _does_ regenerate with meaningless byte churn, the
answer is the same one this package gives everywhere else: the git diff is the review surface, and
whoever reads it decides.

### Locked conflicts — the hash moves on, the conflict does not

A locked conflict says _the design moved underneath a file somebody hand-edited_, and it carries the
manifest's own note so the reader knows what to reconcile against. The file is not touched and no
export call is made for it.

The baseline **does** record the new hash: the short-circuit needs the baseline to cover every asset
node, and holding the hash back would mean this package never took its cheap path again. But the
advancing hash must not be what closes the conflict — #81 asks for conflicts that are **visible, not
silent**, and a conflict reported once and then forgotten is exactly the silent kind. So the baseline
carries the conflict as well, in `openAssetConflicts`, and **every** later run re-reports it:

```jsonc
// baseline.openAssetConflicts — the durable half of a lockedConflicts entry
{
  "path": "tools/…/live-fintech.png",
  "nodeId": "1751:2003",
  "conflictHash": "…", // the source-node hash that opened it
  "entryFingerprint": "…", // sha256 of the entry's nodeId + locked + note
  "firstSeenAt": "2026-08-04T03:36:18.480Z",
  "reason": "node-changed",
  "note": "Exact and hand-cropped: …",
}
```

A report entry says which it is: `state: "firstSeen"` this run, or `"stillOpen"` since
`firstSeenAt`. A failure is the opposite of both: no hash, no record, retry next run.

#### How a conflict closes — one mechanic

**The manifest entry changes.** `entryFingerprint` is the sha256 of exactly the three fields a
reconciliation touches, and the conflict clears the moment any of them differs:

| Edit `asset-manifest.json` to…   | Means                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| point `nodeId` at another node   | the source moved and you have found where it went           |
| set `locked: false`              | a re-export is correct now — the next run does it           |
| rewrite the `note`               | **you reconciled it by hand**; the note says what it is now |
| delete the entry (and the asset) | there is nothing left to conflict                           |

The rewritten `note` is the door for the common case — the hand-crop redone against the new original
— and it costs nothing extra, because `asset-manifest.test.ts` already requires every locked entry to
carry a note. Nothing else clears a conflict: not a re-run, not a `figmaName` correction, and not
time. The one non-edit exit is the design moving **again**, which does not close the conflict so much
as replace it: the old record is dropped and a new one opens, dated to the run that saw the new move.

The first live run of #81 reported all three locked assets (`about-portrait-gadsby.png`,
`live-fintech.png`, `live-saas.png`) as `new-to-baseline` conflicts and wrote none of them —
**under the old semantics**, which settled them on the spot. Those three were consumed before this
mechanic existed and no record was fabricated for them retroactively; the baseline they left behind
carries their hashes and no open conflicts. If any of the three sources moves again it opens a
conflict that persists properly. Everything from here forward gets the durable treatment.

## Report schema — version 1, fixed

`data/report.json`, overwritten by every run **that fetched anything** — a short-circuited run writes
no report at all, so `ranAt` on disk is the last run that had something to say, not the last run.
**Later tickets fill sections; they do not reshape them.** Every section is present as an empty array
from the first run, so a consumer can read `report.assets.failures` today and get `[]` rather than
`undefined`. A change to what any key means bumps `schemaVersion`.

```jsonc
{
  "schemaVersion": 1,
  "ranAt": "2026-08-03T20:14:07.921Z", // ISO timestamp of the run
  "fileVersion": "2467893184", // Figma's file version at the time
  "shortCircuited": false, // always false on disk — see above
  "changedFrames": [], // tracked pageFrames whose hash moved
  "changedComponentSets": [], // same, for kind: "componentSet"
  "untrackedFrames": [], // frames in the section but not the manifest — triage them
  "assets": {
    "regenerated": [], // assets rewritten from Figma this run (#81)
    "lockedConflicts": [], // …whose source moved but which a human has locked
    "failures": [], // …that failed to export. Never a silent skip.
  },
  "errors": [], // human-readable strings; a tracked id the file no longer has
}
```

`changedFrames` and `changedComponentSets` entries:

```jsonc
{
  "nodeId": "1680:2134",
  "name": "Home", // the page layer, or the Figma set name
  "route": "/", // null for component sets
  "variant": "desktop", // "desktop" | "mobile"; null for component sets
  "change": "modified", // "added" | "modified" | "removed"
}
```

A `changedComponentSets` entry adds one key, `codeComponent` — the code the change routes to, or
`null` for a set that maps to nothing. It is the one key page frames never carry, so a consumer of
`changedFrames` sees exactly what #78 described.

**An edit inside a set reports as the set changing _alongside_ the page frames whose hash also
moved, never instead of them.** The two are hashed independently: the set says _what_ changed, the
frames say _where it shows_. `component-sets.test.ts` fixes that with overlapping fixtures.

`added` is a node the baseline has never hashed (a first run, or a manifest addition); `removed` is
one the baseline has and the manifest no longer tracks — reported even when nothing describes it any
more, in which case `name` falls back to the node id and `route`/`variant` are `null`.

**A removed node is still filed under the right heading.** Removal is the one case where the manifest
cannot answer "what was this?", so the baseline remembers: `baseline.kinds` is `nodeId` → `pageFrame`
| `componentSet`, written for every node a run hashes. A deleted component set lands in
`changedComponentSets` (with `codeComponent: null`, since nothing describes it any more) rather than
reading as a page that vanished. A removed node the manifest still describes takes its kind from the
manifest as usual.

The three `assets` arrays (#81 filled them; #78 fixed the keys). `reason` is `node-changed` or
`new-to-baseline` in both of the first two, and it is the difference between "the design moved" and
"nothing had ever hashed this node":

```jsonc
// assets.regenerated — the file on disk was overwritten
{ "path": "tools/…/live-healthcare.png", "nodeId": "1751:2010",
  "export": "imageFill", "reason": "node-changed" }

// assets.lockedConflicts — the file was NOT touched. `note` is the manifest's
// own words for why it is locked: what to reconcile the change against.
// `state` says whether this run found it or is asking again; a stillOpen
// conflict keeps the `firstSeenAt` of the run that opened it.
{ "path": "tools/…/live-fintech.png", "nodeId": "1751:2003",
  "reason": "node-changed", "note": "Exact and hand-cropped: …",
  "state": "stillOpen", "firstSeenAt": "2026-08-04T03:36:18.480Z" }

// assets.failures — nothing written, no baseline hash recorded, retried next run
{ "path": "tools/…/about-culture-team.png", "nodeId": "1927:6432",
  "error": "Figma returned no image URL for 1927:6432" }
```

`data/baseline.json` gained `assetHashes` — `nodeId` → sha256, the same digest as `hashes` but for
the nodes assets came from. It is a separate map because those nodes are not tracked nodes: they are
never diffed into `changedFrames`, and the short-circuit counts the two lists by different rules
(exact coverage for tracked ids, presence-only for asset ids — see `diff.ts`). It also carries
`kinds` (what each hashed node was, for removals) and `openAssetConflicts` (the conflicts nothing has
reconciled yet). Neither participates in the short-circuit check.

`untrackedFrames` entries:

```jsonc
{
  "nodeId": "2050:891",
  "name": "Contact", // the Figma layer name — nothing else knows it yet
  "width": 1440, // 1440/402 says "page frame"; anything else usually says "study"
}
```

`data/report.md` is the same run, rendered for a human.

## The new-frame probe — and how to triage what it finds

Hashing answers "did anything we watch change?". It cannot answer "is there design work we are not
watching at all?", and that gap is how a brand-new page frame sits in the file for a month with
nobody noticing. So every non-short-circuited run lists the **direct children** of the Design
Concept section (one `depth=1` call) and reports the `FRAME`s the manifest has never heard of.

**It surfaces; it never promotes.** The file holds two generations of the same site
(`docs/agents/figma.md`), so "a frame exists in the section" and "a frame is canonical" are
different claims — the second is a judgement, and nothing in this package makes it. `probe.ts`
writes nothing to `tracked-nodes.json`.

`untracked` means **decide**, and there are exactly two ways to close it:

| The frame is…                                         | Do this                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| **canonical** — a real 1440/402 page layer            | add an `entries[]` row with its route and variant; the next run baselines it     |
| **noise** — a section study, a cover, a stale capture | add an `ignoredNodeIds[]` row **with a `note` saying why**; the probe goes quiet |

Leaving it open is also a position — the report simply keeps asking. That is the intended state for
work in progress that nobody has ruled on yet.

Two rules keep the list honest: an ignored id may never also be a tracked id, and every ignored id
carries its reason (`manifest.test.ts` enforces both). Non-`FRAME` children are skipped by type —
the canonical `NavBar` component sits loose in that section — and so are nested frames: only direct
children are considered, or every hero in the file would read as new.

## Normalization — the correctness-critical seam

A hash that moves on its own makes every run a phantom diff and the report worthless. `normalize.ts`
strips everything the API reports that is not the design; the doc comment at the top of that file is
the authoritative table of **what is stripped and why**. In short:

- **stripped**: `absoluteBoundingBox`/`absoluteRenderBounds` `x`/`y` (canvas coordinates — dragging a
  frame shifts every descendant), `scrollBehavior`, `layoutVersion`, `devStatus`, prototype wiring
  (`interactions` and friends), and empty/`null` collections (the API is inconsistent about them)
- **rounded**: absolute box `width`/`height` to whole pixels, every other number to two decimals
- **kept**: `relativeTransform` (position within the parent is a real change), node ids, child order
- **sorted**: object keys, at every depth, before hashing

## Tests

Everything but the fetch lives behind a pure function, so the tests need no token and no network —
`figma-api.ts` is the only module that touches it.

```sh
pnpm vitest run tools/figma-sync/src
```

`asset-manifest.test.ts` is the one test that reads a real directory, and deliberately: its claim is
that the committed manifest describes the committed assets, which no fixture can stand in for. The
validator itself takes the listing as an argument, so every other case in that file is a literal.

`assets.test.ts` is the one that has to prove a _negative_ — that an unchanged asset costs no export
call — so its fetch is injected and recorded, and the assertions are on the call list as much as on
the result. The whole decision matrix above runs against literals; the executor runs the real
`figma-api.ts` client over that fake fetch, including the failure cases the live file will not
produce on demand (a 429, a dead download, a `null` image URL, an `imageRef` the library has lost).

`normalize.test.ts` carries the two fixture pairs that matter: the same frame seen from a different
place on the canvas (must hash **equal**) and the same frame with one word rewritten (must hash
**differently**). `component-sets.test.ts` carries the third: a label rewritten in a set _and_ in
the frame that instances it, which must report as **both**. `probe.test.ts` runs the section
classification against fixture listings — never the live section, whose contents change with every
design session.
