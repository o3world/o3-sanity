# @o3/figma-sync

Change detection against the design source of record (#78). One command:

```sh
pnpm figma:sync
```

It answers one question — **which canonical page frames changed in Figma since the last sync?** —
and it answers it cheaply when the answer is "none".

```
1. GET /v1/files/RvraLJaZ0zWm8UaD5AJf43?depth=1     ← one call, file metadata only
2. version + lastModified match the baseline, and the baseline covers every
   tracked node?   →  "no changes since <syncedAt>", exit 0. One API call total.
3. otherwise       →  GET /v1/files/:key/nodes?ids=… in small batches,
                      normalize each subtree, sha256 it, diff against the baseline
4. write data/baseline.json + data/report.{json,md}, print the summary
```

Authentication is the standard `FIGMA_API_KEY` from the dev environment — the same sourcing as
`scripts/figma-mcp.sh` (`process.env`, else `apps/web/.env.local`). If it is missing, run
`pnpm env:pull`. This calls the REST API directly rather than going through MCP: it has to be
deterministic and runnable unattended, and the official MCP server is rate-limited to uselessness on
this account (`docs/agents/figma.md`).

**A sync is a commit.** `data/baseline.json` is what makes the next run's short-circuit possible, so
commit it along with the report; git carries the history, the files only ever describe the last run.

## `data/tracked-nodes.json` — what we watch

Hand-maintained, promoted from the frame inventory on `research/figma-frame-inventory`.

| Field           | Meaning                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `fileKey`       | `RvraLJaZ0zWm8UaD5AJf43` — _O3DX: Visual exploration_                                           |
| `sectionNodeId` | `1632:1510`, the Design Concept section. Reserved for the untracked-frame probe (later ticket). |
| `entries[]`     | `{ nodeId, kind, name, figmaName?, route?, codeComponent?, variant }`                           |

- `nodeId` is a **verified frame** id in `1680:2134` form. A share URL's `node-id` is usually a
  child, not the frame, and it uses `-` — both mistakes are caught by `manifest.test.ts`.
- `name` is the page layer in this project's language (CONTEXT.md), not the Figma layer name: two
  different frames are called "Insights" in that file and neither is the Perspectives index.
  `figmaName` records what Figma calls it.
- `kind: "pageFrame"` carries a `route`; `kind: "componentSet"` will carry a `codeComponent`
  (nothing is tracked as a component set yet — that is a later ticket).
- `variant` is `desktop` (1440) or `mobile` (402). About and Solutions have no mobile frame; that is
  a real gap in the file, not a missing entry.

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
  "changedComponentSets": [], // same, for kind: "componentSet" (later ticket)
  "untrackedFrames": [], // frames in the section but not the manifest (later ticket)
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
  "name": "Home", // the page layer
  "route": "/", // null for component sets
  "variant": "desktop", // "desktop" | "mobile"
  "change": "modified", // "added" | "modified" | "removed"
}
```

`added` is a node the baseline has never hashed (a first run, or a manifest addition); `removed` is
one the baseline has and the manifest no longer tracks — reported even when nothing describes it any
more, in which case `name` falls back to the node id and `route`/`variant` are `null`.

`data/report.md` is the same run, rendered for a human.

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

`normalize.test.ts` carries the two fixture pairs that matter: the same frame seen from a different
place on the canvas (must hash **equal**) and the same frame with one word rewritten (must hash
**differently**).
