---
key: figma-sync-pipeline
title: The Figma sync pipeline
---

Background for the insight "The design team moved the file. The repo filed the
tickets." Research material, not copy. Every number here held on 13 August 2026,
the day the piece went out. The live counts sit in the repo and move.

## What the pipeline is

`pnpm figma:sync` is change detection against the Figma file that this site
treats as its design source of record. One run answers three questions: which
canonical page frames changed since the last sync, which component sets changed,
and is there design work in the file nobody watches.

The cheap path is the common one. The script reads the file's version and
`lastModified` in a single `GET /v1/files/:key?depth=1`. If both match the
committed baseline and the baseline covers every tracked node, the run prints
"no changes since <syncedAt>", writes nothing to disk, and exits. A run that
finds movement fetches each tracked subtree, strips the fields Figma churns on
its own, hashes what remains with sha256, and diffs against the baseline.

The baseline and the report are committed. The history of what the design did,
and when, is the repo's history.

## What it watches

`tools/figma-sync/data/tracked-nodes.json` is hand-maintained and holds two
kinds of entry. A `pageFrame` carries a route and a `desktop` or `mobile`
variant. A `componentSet` carries the code component it maps to, as
`path#Symbol`. The manifest held 14 page frames and 25 component sets on
publication day and holds more now. `manifest.test.ts` verifies that every node
id names a frame in `1680:2134` form rather than a child picked out of a share
URL.

Component sets earn their entry. Without them, one reworked button reads as
unexplained diffs on every page that instances it. With them it reads as one
changed set routed to one file.

## The asset archaeology

The site ships 32 exported assets and none of them recorded where they came
from. Matching each committed file back to its Figma node meant re-exporting
candidates and comparing pixels.

The matching found three things a naive re-export would have destroyed. One
case-study image is a hand-made 527x544 crop cut from the middle of a 791-wide
original. A team portrait's source node now holds the same photo re-uploaded at
790px, against a committed original at 2500px. Seven diagrams are animated SVGs
written by hand, keyframes and reduced-motion fallbacks included, which Figma
cannot produce at all.

Fifteen of the 32 are locked as a result. The rest re-export mechanically when
their source node moves, overwriting the committed file so the git diff is the
review. A locked file is never overwritten. If its source moves, the run reports
a conflict and keeps reporting it until a person reconciles the two by hand.

Figma does not render the same PNG twice, so re-export keys off the node
changing rather than off byte comparison. Otherwise every photograph churns on
every run.

## Script and judgment are separate on purpose

The script hashes, diffs, re-exports and writes a report. It holds no opinion
about whether a change matters. The judgment lives in
`.claude/skills/figma-sync/SKILL.md`, which an agent follows after the script
finishes: what counts as noise, what groups into one ticket, what goes back to a
person as a question. When the pipeline says nothing changed, that answer came
from a hash comparison rather than from a model reading the file.

## The design pass of 12 August 2026

The design team rebuilt the navigation as a component, added a utility strip
above it for O3's other properties, promoted the footer to a shared component,
replaced the insight hero's flat ink field with photography, and swapped the
file's loose color styles for a variable collection. Three new page frames
appeared: an Insights index, a Sanity partnership page, and a Solutions
redesign.

Thursday's run named all of it, and the judgment layer sorted it. Four changes
became tickets. Five frames were ripple from the footer change and got no
ticket. Three engagement cards had collapsed into identical instances, which is
an override reset rather than intent. One changed frame was test debris titled
`ClaudeTest`. Nine frames the manifest had never seen went to a person as
questions, who ruled on each: the Insights index and the Sanity page are
canonical and now tracked, the Solutions redesign replaces the old frame, and
five blog-post hero studies were set aside with reasons recorded.

The palette followed the new variable collection. Ink warmed from `#0A0A0A` to
`#0A0A0B`, bone from `#F0F0F0` to `#F1F0EC`, about ninety variables in all, each
Figma id quoted in a comment beside the token it governs.

## Limits worth stating

Nothing fires on its own. The sync runs when someone runs it, which is why
Wednesday's edits waited until Thursday.

A hash says a frame changed and never what changed inside it, so a person or an
agent still opens the file before a ticket gets written. Noise is shaped like
signal: an override reset and a redesign move a hash the same distance.

Figma's pricing draws a line through the tool. On the current seat, variable
names are unreadable, because the API returns them only on an Enterprise scope.
The warm palette was read entirely from `boundVariables` payloads: ids and
resolved values, no names. Publishing Code Connect mappings is blocked behind
the same seat.

Two pages have no mobile frame in the design, and the sync cannot conjure a
frame nobody drew.

## Sources

- `tools/figma-sync/README.md` for the run sequence, the report schema and the
  manifest fields.
- `tools/figma-sync/data/tracked-nodes.json` for the live counts.
- `docs/agents/figma.md` for which MCP server to use and the two-generations
  distinction between canonical frames and imported captures.
- `docs/figma-components.md` for the component-to-code map.
- ADR 0009 (icons are inline SVG) and ADR 0010 (captured prototypes) for the two
  decisions the piece assumes without restating.
