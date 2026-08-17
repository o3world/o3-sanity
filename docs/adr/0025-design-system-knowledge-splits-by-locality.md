# 0025. Design-system knowledge splits by locality

- **Status:** Accepted; the split holds, and [#192](https://github.com/o3world/o3-sanity/issues/192) moved the catalog's home from a `guidance` document to `tools/authoring-skill/references/composition.md`
- **Date:** 2026-08-15
- **Deciders:** NickO3 + Claude
- **Related:** [issue #66](https://github.com/o3world/o3-sanity/issues/66), [issue #73](https://github.com/o3world/o3-sanity/issues/73), [ADR 0024](./0024-authoring-knowledge-has-one-source-and-one-fan-out.md), `packages/sanity/src/schemas/blocks/`

## Context

For a page composed from scratch, an agent needs more than the schema's field
shapes. It needs to know what each section block is _for_ ("proof by
association", "one borrowed voice"), and it needs composition — what orders and
pairings work, how surfaces alternate, where a quote or stat band earns its
place. Issue #66 asked where each kind lives: in schema `description` strings,
surfaced to any MCP consumer via `get_schema` and kept true next to the code,
or in a richer catalog document.

Three facts constrain the answer. `get_schema` surfaces description strings
per type, so whatever lives there reaches every MCP consumer — the Desktop
authoring skill today, any Studio-side AI later — for free. The Desktop ZIP
freezes whatever is packaged in it, so knowledge in the skill body is ruled
out already (ADR 0024). And a description string is also Studio UI: a human
editor reads the same sentence under the field.

Most of the per-block prose is already written — `docs/specs/schema.md`
explains, for instance, why `disciplineGridSection` is one block and not two —
but it is repo-only and reaches no Desktop session. Meanwhile the deployed
schema had already drifted from source when this was decided
(`railPanelsSection`'s panel `mark` field missing, a stale `media`
description), with nothing to catch it.

## Decision

**Split by locality.** Knowledge about _one block alone_ lives in that block's
schema `description`. Knowledge that _mentions two or more blocks_ — arcs,
pairings, surface rhythm, section-purpose-to-block bindings, anti-patterns —
lives in the composition catalog: an `o3-composition` guidance document, one
new row in `tools/guidance/src/sources.ts`, reaching Desktop through the same
MCP seam as the voice guide. The test is mechanical: if the sentence names
another block, it belongs in the catalog.

**The writing standard** for a block description: written for an author who
cannot see the rendered site, in three parts — the message the block carries,
reach for it when…, and the one constraint the fields don't show ("capped at
one per page", "orbital takes exactly four"). Two or three sentences, no
cross-block comparisons. The standard is recorded in the `content-naming`
skill, so a new block meets it at authoring time.

**The drift guard**, at two enforcement points:

- `defineSectionBlock` gains a **required** `description` argument. A new
  block without one fails at compile time.
- `pnpm schema:check`, sibling to `guidance:check`: extract the repo schema,
  diff against the deployed one, exit non-zero on drift. It would have caught
  the live drift named above.

## Alternatives considered

### Everything in the composition catalog

- **Pros:** one document, richer prose than a description string allows, no
  factory change needed.
- **Cons:** per-block knowledge leaves the code it describes. A schema edit
  and its description edit stop travelling in the same diff, and `get_schema`
  consumers that never fetch guidance — Studio-side AI, a future tool — see
  bare field shapes.
- **Why not:** the description slot is the one place the knowledge is adjacent
  to both the code and every MCP consumer at once. Giving that up buys
  nothing.

### Everything in schema descriptions

- **Pros:** one home, zero new documents, maximally adjacent to code.
- **Cons:** composition is cross-block by nature; a per-type string has
  nowhere to put "a stat band earns its place after the claim it proves". Long
  strings also drown the Studio form — the same text is editor-facing UI.
- **Why not:** the knowledge that doesn't fit would end up in the skill body,
  which the ZIP freezes — the exact failure ADR 0024 exists to prevent.

### In the skill body, where the author reads it

- **Why not:** ruled out before this decision — the Desktop ZIP is a manual
  per-user upload, so packaged knowledge drifts per person. ADR 0024 covers
  it; listed here only because it is where this content is most tempting to
  put.

## Consequences

- **Positive:** future blocks need no judgment call — the locality test
  decides, the factory enforces the description's existence, and
  `content-naming` carries the standard for what it says.
- **Positive:** every MCP consumer gets the per-block knowledge for free,
  including surfaces out of scope today (Studio-side AI would inherit it
  without any new work).
- **Negative:** one string serves two readers. A sentence written for an
  author who can't see the site is also what a human editor sees under the
  field in Studio; the standard was chosen to serve both, but the tension is
  real and shows up at review.
- **Negative:** #73 cannot land until the factory change does — per-block
  descriptions are not currently expressible through `defineSectionBlock`.
  Sequencing constraint, ticketed as a blocker.
- **Risk:** schema deploys become part of the knowledge contract. A deploy
  skipped after a description edit is exactly the drift `schema:check` exists
  to catch, so the check has to land close behind the first descriptions.
