# @o3/figma-sync

Change detection against the design source of record (#78, #79). One command:

```sh
pnpm figma:sync
```

It answers three questions — **which canonical page frames changed since the last sync, which
component sets changed, and is there design work in the file nobody is watching?** — and it answers
the first two cheaply when the answer is "none".

```
1. GET /v1/files/RvraLJaZ0zWm8UaD5AJf43?depth=1     ← one call, file metadata only
2. version + lastModified match the baseline, and the baseline covers every
   tracked node?   →  "no changes since <syncedAt>", exit 0. One API call total.
3. otherwise       →  GET /v1/files/:key/nodes?ids=… in small batches,
                      normalize each subtree, sha256 it, diff against the baseline
4. …and one GET /v1/files/:key/nodes?ids=<section>&depth=1 — the new-frame probe
5. write data/baseline.json + data/report.{json,md}, print the summary
```

Authentication is the standard `FIGMA_API_KEY` from the dev environment — the same sourcing as
`scripts/figma-mcp.sh` (`process.env`, else `apps/web/.env.local`). If it is missing, run
`pnpm env:pull`. This calls the REST API directly rather than going through MCP: it has to be
deterministic and runnable unattended, and the official MCP server is rate-limited to uselessness on
this account (`docs/agents/figma.md`).

**A sync is a commit.** `data/baseline.json` is what makes the next run's short-circuit possible, so
commit it along with the report; git carries the history, the files only ever describe the last run.

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
  different frames are called "Insights" in that file and neither is the Perspectives index.
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
| 3 `perspective-weekend-*` PNGs            | design-sourced for the post; no matching fill, no node with its ratio |
| 7 `eng-*` / `perspective-process-*` SVGs  | hand-authored animated SVG — see below                                |

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

**The manifest records provenance; it does not act on it.** Re-export and overwrite are #81, and
until then the report's `assets` section stays the empty stub #78 fixed.

## Report schema — version 1, fixed

`data/report.json`, overwritten every run. **Later tickets fill sections; they do not reshape them.**
Every section is present as an empty array from the first run, so a consumer can read
`report.assets.failures` today and get `[]` rather than `undefined`. A change to what any key means
bumps `schemaVersion`.

```jsonc
{
  "schemaVersion": 1,
  "ranAt": "2026-08-03T20:14:07.921Z", // ISO timestamp of the run
  "fileVersion": "2467893184", // Figma's file version at the time
  "shortCircuited": true, // true = stopped after the version check
  "changedFrames": [], // tracked pageFrames whose hash moved
  "changedComponentSets": [], // same, for kind: "componentSet"
  "untrackedFrames": [], // frames in the section but not the manifest — triage them
  "assets": {
    "regenerated": [], // exported assets rewritten this run (later ticket)
    "lockedConflicts": [], // …that a human has locked (later ticket)
    "failures": [], // …that failed to export (later ticket)
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

`normalize.test.ts` carries the two fixture pairs that matter: the same frame seen from a different
place on the canvas (must hash **equal**) and the same frame with one word rewritten (must hash
**differently**). `component-sets.test.ts` carries the third: a label rewritten in a set _and_ in
the frame that instances it, which must report as **both**. `probe.test.ts` runs the section
classification against fixture listings — never the live section, whose contents change with every
design session.
