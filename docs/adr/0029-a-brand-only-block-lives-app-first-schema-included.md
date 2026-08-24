# 0029. A brand-only block lives app-first, schema included

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** NickO3 + Claude
- **Supersedes:** the one-model-one-home clause of
  [ADR 0028](/adr/0028-o3xo-is-a-second-app-in-the-monorepo) — the rest of that
  decision stands
- **Related:** `packages/sanity/src/schemas/blocks/registry.ts`, #248 (the first
  brand-only block), map #208

## Context

ADR 0028 split the section roster into a core list plus per-brand extensions
and put every schema — core and brand alike — in `packages/sanity`. The first
brand-only block paid the cost of that layout. `faqSection` (#248) renders only
on o3xo, yet its schema sits between core blocks in an 860-line shared
`section.ts`, its knobs in the shared flat `knobs/` directory, and the one
statement that it belongs to o3xo is an entry in `BRAND_SECTION_BLOCKS`. A
developer working in either app cannot read shared-versus-brand from where
anything lives; they open the registry to find out, and they cross the repo to
edit a block whose renderer, story, and tests are already app-local under
ADR 0028's second addendum. Components got the app-first rule; schema was the
exception, and the exception is the part you have to be told about.

## Decision

**We extend the app-first rule to schema. A brand-only block lives whole in its
app — schema, knobs, renderer, story, one directory — and `packages/sanity`
holds only what both brands share.**

- **Location is the signal.** `apps/o3xo/src/content/blocks/faqSection/` holds
  `schema.ts`, `knobs.ts`, `FaqSection.tsx`, and the story. Anything under
  `packages/` is both brands'; anything under an app is that brand's alone. No
  registry lookup, no JSDoc caveat.
- **The core model stays shared and stays put.** Documents, shared objects, base
  blocks, core sections, the knob system, and the define factories remain in
  `packages/sanity`. This is still ADR 0028's required sharing — a brand may
  extend the model, never fork it.
- **The roster stays central; the definitions move.** `BRAND_SECTION_BLOCKS`
  keeps declaring membership by name in `packages/sanity`, so the union of
  blocks, `BLOCK_ARRAYS`, and the per-brand `satisfies` checks are unchanged.
  `schemaTypesFor(brand)` takes the brand's block schemas as an argument —
  passed by the app that owns them — because `packages/sanity` must not import
  from an app.
- **Typegen goes per-brand**: core plus that brand's blocks, run where the
  brand's schemas are visible. Migration and the invariants over committed JSON
  already read per-brand (`data/`, `data-o3xo/`), so each consumes its brand's
  model; no whole-model consumer remains once the single `generated.ts` splits.
- **Promotion is a move.** The moment the second brand draws a block, its
  schema moves into `packages/sanity` and its name moves to
  `CORE_SECTION_BLOCKS` — the same motion component promotion into
  `packages/{ui,content-ui}` already makes, and the roster test fails if you
  make only half of it.

## Alternatives considered

### Mirror the tiers as directories inside `packages/sanity`

`schemas/blocks/sections/{core,o3,o3xo}/`, one file per block, a parity test
binding path to roster.

- **Pros:** no dependency rewiring; the single typegen survives untouched.
- **Cons:** membership is now stated twice (path and roster) and the schema
  still lives a repo away from its renderer.
- **Why not:** it decorates the constraint instead of removing it. The
  developer in `apps/o3xo` still leaves the app to touch their own block, and
  "where does the schema live" still has a two-part answer.

### Per-brand schema packages

`packages/sanity` as core, `packages/sanity-o3xo` and `packages/sanity-o3` as
extensions.

- **Pros:** dependency direction stays package-to-package; a whole-model
  typegen can compose all three.
- **Cons:** a brand block now has a third home — schema in one package,
  renderer in the app, shared machinery in another package.
- **Why not:** the package name says the brand, but you learn it by leaving the
  app. It half-answers the question the app-first layout answers whole.

## Consequences

- **Positive:** the filesystem answers shared-versus-brand without a lookup.
  One directory is the whole block, which is what a session building an o3xo
  band actually touches. Promotion is a `git mv` along a path components
  already travel.
- **Negative:** the single `generated.ts` becomes per-brand outputs, and every
  consumer declares which brand's model it reads. The closed
  `Record<SectionBlockName, …>` over section schemas leaves `packages/sanity`;
  each app satisfies its own roster instead. A change to a brand block no
  longer fails the other app's build — for brand blocks that cross-brand break
  was never the seam working, but the loss is real for a block on its way to
  promotion.
- **Risks / open questions:** the composition point (each app's
  `sanity.config.ts` and typegen run) must stay thin, or the apps start growing
  model machinery the packages should own. Watch the first promotion — if
  moving a schema out of an app proves expensive, the "promotion is cheap"
  claim here was wrong and the mirror-directories alternative gets another
  look.
