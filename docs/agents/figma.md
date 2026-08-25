# Figma: the design source of record

Figma is the source of record for this site (map #33) — it outranks `prototype/`, which is retired.
Everything visible in a **canonical** frame is pre-approved to build (#25 working agreement 3, as
amended by #33). This page is how you read the file without wasting a session on its traps.

- **File**: `RvraLJaZ0zWm8UaD5AJf43` — "O3DX: Visual exploration"
- **Frame → route map**: [`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md) — on branch `research/figma-frame-inventory`, per the repo's research convention. Read it before touching a page layer.
- **Component → code map**: [`docs/figma-components.md`](../figma-components.md) — every component set, its variant axes, and what it maps to (or deliberately doesn't)
- **Tracked-frame manifest**: [`tools/figma-sync/data/tracked-nodes.json`](../../tools/figma-sync/data/tracked-nodes.json) — the canonical page frames as machine-readable data, node ids verified against the file
- **Asset provenance**: [`tools/figma-sync/data/asset-manifest.json`](../../tools/figma-sync/data/asset-manifest.json) — every committed seed asset and the node it was exported from, or an explicit "no source found" (#80). Read it before re-exporting anything: ten of the thirty are `locked`, including all seven hand-authored animated SVGs, and the format is documented in [`tools/figma-sync/README.md`](../../tools/figma-sync/README.md)

## Has the design changed?

```bash
pnpm figma:sync    # one API call when nothing moved; otherwise names what did
```

Or invoke **`/figma-sync`** ([`.claude/skills/figma-sync`](../../.claude/skills/figma-sync/SKILL.md))
— the same command plus the judgment on top of it: reading the report, deciding noise from real work,
grouping the changes, filing tickets on the board, and asking you about frames nobody has ruled on.
The script is deterministic and decides nothing; the skill decides everything.

`@o3/figma-sync` hashes a normalized subtree per tracked node and diffs it against the committed
baseline, reporting changes by frame name **and route**
([`tools/figma-sync/README.md`](../../tools/figma-sync/README.md)). It talks to the REST API
directly — no MCP, no rate limit. **A sync is a commit**: `data/baseline.json` and
`data/report.{json,md}` describe the run that produced them.

It watches two things and asks about a third (#79):

- **Canonical page frames** — the manifest's `pageFrame` entries.
- **Component sets** — all 24 nodes of the component→code map below, so a rework of `Button /
Solid` reads as "that set changed → `button.tsx#Button`" instead of as unexplained diffs on
  every frame that instances it. It reports the set **alongside** those frames, not instead.
- **New work** — each real run lists the Design Concept section's direct children and names any
  frame the manifest has never heard of. That is a question, not a finding: decide it is canonical
  and add it to `tracked-nodes.json`, or decide it is noise and add it to `ignoredNodeIds` with a
  reason. The probe never promotes anything itself — the two-generations rule below is exactly why.

## Which MCP server to use

Two Figma servers are registered in `.mcp.json`. They are not interchangeable.

| Server             | Tools                | Use it for                                          |
| ------------------ | -------------------- | --------------------------------------------------- |
| `figma_rest`       | `mcp__figma_rest__*` | **Everything structural.** This is the default.     |
| `figma` (official) | `mcp__figma__*`      | Screenshots only, sparingly — see the warning below |

### ⚠️ The official server is rate-limited on a View seat

`https://mcp.figma.com/mcp` returns a hard failure after a handful of calls on this account:

```
You've reached the Figma MCP tool call limit for your View seat on the Organization plan.
```

The quota is per-seat and covers **every** `mcp__figma__*` tool, including `get_metadata` and
`get_screenshot`. Its own tool descriptions tell you to prefer `get_design_context` — **ignore that
here**; following it burns the quota immediately and returns nothing. Reach for `figma_rest` first,
every time. Only try the official server when you specifically need a rendered screenshot and can
afford it to fail.

Lifting this needs a paid seat. Code Connect publishing (#38) is blocked on the same thing.

### Setup

`scripts/figma-mcp.sh` launches `figma-developer-mcp` over the REST API. It reads `FIGMA_API_KEY`
from `apps/web/.env.local`, which `pnpm env:pull` populates from the Vercel development environment.
The file outranks an exported `FIGMA_API_KEY`, and the script prints which source it used: a key
exported by some other project is not this repo's, and a stale one used to shadow the good key
silently (#334).

```bash
pnpm env:pull   # if the server fails with "FIGMA_API_KEY not found"
```

Downloaded images land in `.figma/` (gitignored).

## Reading the file

Load the tools first — they are deferred:

```
ToolSearch: select:mcp__figma_rest__get_figma_data,mcp__figma_rest__download_figma_images
```

### ⚠️ A share-URL's `node-id` is often _not_ the frame

This is the single most expensive mistake in this file. Figma deep-links to whatever was selected,
which is frequently a child. The Work page URL carries `node-id=1634-1168` — that is the **hero**;
the frame is **`1634:1167`**. Reading the child and concluding "the design stops after the hero"
already produced one wrong ticket (#43).

**Always confirm you are on the frame**: read the parent section at `depth: 1` and match the frame
name, or check that the node's width is 1440 (desktop) / 402 (mobile).

### Node ID format

Share URLs use `-`; the tools take `:`.

| Context            | Form        |
| ------------------ | ----------- |
| URL (`?node-id=…`) | `1680-2134` |
| MCP tool argument  | `1680:2134` |

### Control the response size with `depth`

Responses are large — a full page frame can swamp a context window.

| `depth` | Returns                      | Use for                         |
| ------- | ---------------------------- | ------------------------------- |
| 1       | Direct children, names + IDs | Enumerating a canvas or section |
| 2–3     | Section structure            | Finding the region you need     |
| 4–5     | Text content, fills, layout  | Actually building a section     |

Omit `nodeId` entirely to list the file's canvases.

## The one fact that explains the file

**It holds two generations of the same site** (#34). Telling them apart resolves nearly every
ambiguity in it:

|             | Generation 1 — reference                                   | Generation 2 — **canonical**                    |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Origin      | `prototype/*.dc.html` → Netlify → html.to.design re-import | Drawn natively in Figma                         |
| Widths      | 1920 / 390 (capture viewports, _not_ breakpoints)          | **1440 / 402**                                  |
| Layer names | DOM-ish: `div.sc-host`, `nav`, `section`, `h1`             | Design-ish: `Hero`, `Case studies`, `NavBar`    |
| Built from  | Flat imported nodes                                        | Real components + the `Gradient/Red/1` variable |
| Tell        | Footer reads "© 2026 O3 Studio. All placeholder content."  | —                                               |

Canonical page layers live in the **Design Concept** section (`1632:1510`). The sections named
"Home alt", "What we're working on", "About Us" and **"Solutions" (`1924:4768`)** are generation-1
captures — do not build from them. The Solutions one is worth naming because #47's ticket cited it
as the 402 half of a breakpoint pair; it is a `SECTION` holding two frames called "1920w light" and
"390w light", with `div.sc-host` / `nav` layer names. Confirm the width before you read a node.

**Authoritative breakpoints are 1440 / 402.** There was never a competing 1920/390 set.

### Not every page layer has both

The manifest's mobile roster (`tracked-nodes.json`, `variant: mobile`) is the current list — Home,
Work, Case Study, Insight detail, Live, plus the 2026-08 pass's ruled-canonical companions:
Contact `2975:10037`, the /insights index `2975:8499`, /partners/sanity `2975:9343`, About
`2975:8865`. **Solutions (`1925:6138`) and Software Engineering (`2360:2879`) still have no 402
frame.** That is a coverage gap, not a missing read: ADR 0006 already makes responsive a renderer
concern, so the mobile composition on those pages is a code decision, and it should say so at the
call site.

### Two frames named "Insights"

Neither is the `/insights` index (whose canonical frames are `2336:4310` at 1440 and
`2975:8499` at 402, per the manifest):

- `1710:2823` → **Insight detail**, `/insights/{slug}` (#45)
- `1924:5344` → **About**, `/about` (#46)

## Vocabulary

Figma layer names do not always match this project's ubiquitous language. `CONTEXT.md` wins:
a Figma frame labelled "Insights" is a **Insight**; the "Work" collection holds **Case Studies**.
Nav _display_ labels are a separate thing again — they live in Site Settings, and the `NavBar`
component (`1710:2271`) is their source of record.
