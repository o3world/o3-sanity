# 0018. The case-study story is one interleaved array

- **Status:** Accepted
- **Date:** 2026-08-13
- **Deciders:** NickO3 + Claude
- **Related:** [ADR 0006](./0006-responsive-contract.md), [ADR 0007](./0007-content-sourcing-and-provenance.md), #44, #70

## Context

The canonical Case Study frame (`1710:2300`) alternates chapter → media band →
chapter → media band, and always has. #44 shipped the page with `chapters`
(text only) followed by `extraSections`, documented the alternation as
inexpressible, and raised `chapter.media` — an optional figure on the chapter —
as the schema conversation to have.

The frame has since answered a different question than the one #44 asked. The
interleaved bands are no longer figures: the 2230-era rework draws a
**screen-grid band** (`2230:3315`, `2230:7559` — tiled product screenshots on
gradient plates) and a **full-bleed page-capture band** (`1647:1720` — a tall
capture floating on a dark stage), with the gradient quote band (`2250:1525`)
woven in before the next-project band. A `figure` field cannot hold any of
them, and a second field per band type would turn `chapter` into a section
system wearing an object's name.

The site is also a Sanity showcase as much as a portfolio: the design elements
must land as blocks any content type can compose, not as case-study one-offs.

## Decision

**`caseStudy.chapters` and `caseStudy.extraSections` are replaced by one
`story` array** that accepts `chapter` objects and the section blocks —
the same members `page.sections` takes, derived from the registry, never
restated. The renderer numbers chapters by their order **among chapter
members**, so numbering still derives from order (CONTEXT.md) and a band
between chapters costs nothing. `story` enters the field lexicon as the
interleaved narrative of a structured document.

## Alternatives considered

### `chapter.media` — an optional figure on the chapter (#44's proposal)

- **Pros:** Smallest possible schema change; expresses the pairing where the
  band really is one image.
- **Cons:** The frame's bands are screen grids, page captures, and a quote —
  not figures. Would need to grow into a union of every band type, one nested
  field at a time.
- **Why not:** It models the 1647-era frame, and the frame moved. Building it
  now would be building against a superseded design.

### Keep `chapters` + appended `extraSections` (status quo)

- **Pros:** No migration; the documented model.
- **Cons:** Cannot express the alternation the frame draws. #44 already
  rejected positional weaving as a renderer hack that breaks the first time a
  case appends anything unpaired.
- **Why not:** The gap between frame and model is the very thing this decision
  exists to close.

### A nested `sections` array inside each chapter

- **Pros:** Keeps `story` out of the lexicon; pairing is explicit per chapter.
- **Cons:** A shared object owning full-width section blocks inverts the tier
  system — surface injection, `SectionShell`, and the registry all assume
  sections are top-level. Bands that belong between chapters (the quote) fit
  nowhere.
- **Why not:** It buys the same expressiveness at the cost of the block
  architecture's one load-bearing invariant.

## Consequences

- **Positive:** Any case study can weave any registered band between chapters,
  and every band added for the case study (screen grid, page capture) is
  automatically available to `page.sections` — the cross-content-type
  reusability the showcase mission requires. The document stays structured
  (hero, stats, deliverables remain fixed fields); only the narrative is
  compositional.
- **Negative:** A rename migration — queries, renderer, translated JSON under
  `tools/migration/data/`, tests — in one commit. Studio authoring leans
  harder on array previews to keep a long mixed array legible.
- **Risks / open questions:** The mobile frame (`1906:928`) predates the
  desktop rework and still draws the 1647-era bands — frames are endpoints
  (ADR 0006), so renderers decide, but a mobile ruling is worth commissioning.
  `stats` and `deliverables` still have no frame region; that #44 conversation
  stays open and this decision does not touch it.
