---
name: content-naming
description: Naming and wiring rules for Sanity content in this repo. Use when adding, renaming, or removing a section block, base block, shared object, document type, schema field, or block renderer — anything under packages/sanity/src/schemas/, packages/content-ui/src/ or apps/web/src/content/. Also use when reviewing a diff that touches those paths.
---

# Content naming

The rules live in `CONTEXT.md` → **Naming**. Read that section first — this skill is the procedure, that is the vocabulary.

Most of what follows is already enforced by the factories, the `satisfies` clauses, and `tools/check-schema-symmetry`. Trust the errors: if you get one, it is telling you a real rule, not a lint nit. The steps below exist so you hit zero of them.

## Before you add anything

Ask in this order — each "yes" stops you from adding a type that shouldn't exist:

1. **Can an existing block do this with a new field?** Prefer a field. Ten well-known blocks beat twenty half-known ones; editors pick from a flat list.
2. **Can it be a base block inside `layoutSection`?** Base blocks compose. Reach for a section block only when the thing owns full-width layout or bespoke motion from `prototype/`.
3. **Is the design real?** `docs/specs/schema.md` says no FAQ/accordion/tabs until a designed page needs them. That holds. Don't pre-build.

## Adding a field

1. Check the **field lexicon** in `CONTEXT.md`. If your concept is in the table, use that exact name. If it isn't, check that you aren't reaching for a synonym of one that is (`content`/`copy` → `body`, `summary`/`intro` → `excerpt`, `image` on a block → `media`).
2. Genuinely new domain concept? Use it, and add a row to the lexicon in the same commit. A field name that isn't in the table and isn't obviously domain-specific is the thing that starts drift.
3. If you're about to copy a field definition from another block, that's the signal to add a factory instead — `packages/sanity/src/schemas/blocks/fields.ts` for an editorial field (the module is empty right now; re-create it), `packages/sanity/src/knobs/` for a design option, beside `surfaceKnob()` and `decorationKnob()`.
4. **Is it a design option or a content field?** A closed set an editor picks a _look_ from is a knob, declared in `packages/sanity/src/knobs/<block>.ts` — never a hand-written `defineField` with an `options.list`, which is invisible to everything but the Studio form (CONTEXT.md → Knobs). A closed set naming a content category is not (`listingSection.pageType`, `formSection.reasons`); write down why, because `knobGuard.test.ts` asks.
5. Enums that are not knobs: bare noun, `options.list` from a `constants.ts` const array where the values are shared, always an `initialValue`.
6. Required fields get `validation: (rule) => rule.required()`. Anything an editor could plausibly leave blank should stay optional — the renderer handles absence.

## Adding a section block

Name it `<thing>Section`. Never `<thing>Block`.

1. `packages/sanity/src/schemas/blocks/registry.ts` — add to `SECTION_BLOCKS`. The factory throws until you do.
2. `packages/sanity/src/knobs/<name>Section.ts` — the block's design options, at minimum `surfaceKnob({ initialValue: … })`; export it from `knobs/index.ts` and add it to `BLOCK_KNOBS`. Required, not optional (ADR 0020). Add a `placeholder` in the same file, typed `satisfies <Name>Section` — it is what the canvas insert menu writes, and `knobs/placeholder.test.ts` fails without one. It must be **commit-safe**: fill every required field, never reference a document, and leave design options to the knobs (CONTEXT.md → Placeholder).
3. `packages/sanity/src/schemas/blocks/section.ts` — `defineSectionBlock({ name, title, description, knobs, fields, preview })`. Don't add a `surface` field; the factory generates it from the knob. `description` is required and has a standard (below).
4. `packages/sanity/src/schemas/index.ts` — import and add to `schemaTypes`, in the section-blocks group.
5. `packages/sanity/src/queries.ts` — add a `_type == "<name>Section" => { … }` arm to `SECTION_FIELDS` **only if** the block needs query-time expansion (dereferenced `button` targets, reference→card projections, a subquery). Renderers must stay pure components: resolve data here, not in the component.
6. `packages/content-ui/src/blocks/section/<name>Section/<Name>Section.tsx` — folder name === schema name exactly. Type props with `SectionProps<'<name>Section'>` from `@o3/content-runtime/blocks`; never hand-write the prop shape.
7. Export it from `packages/content-ui/src/index.ts`, then add a `defineBlockRender('<name>Section', { component: … })` entry to `CLIENT_SECTION_BINDINGS` in **each app's** `src/content/blocks/clientComponents.ts` — the binding is per-app (ADR 0028).
8. `pnpm typegen`, then `pnpm typecheck`. The `satisfies` clause in each app's `src/content/blocks/registry.ts` is what catches a renderer whose props drifted from the generated shape.

## Writing a block description

Every block defined through a factory carries a required `description` (ADR 0025). It is read
by two audiences at once — a human editor under the block in Studio, and any agent fetching
`get_schema` — so write it for **an author who cannot see the rendered site**, in three parts:

1. **The message it carries.** What the block says on a page, not what fields it has.
   "Proof by association — a heading and standfirst over one centred row of client marks."
2. **Reach for it when…** The situation that calls for it, if the message alone doesn't say.
3. **The one constraint the fields don't show.** "One per page, at the top." "The orbital
   layout places exactly four." Skip it if there isn't one — don't invent a constraint.

Two or three sentences. **Never name another block** — a comparison ("use X instead when…")
is composition knowledge and belongs in the composition catalog
(`tools/authoring-skill/references/composition.md`), not in a description. That's the locality rule: one block → description; two or more blocks → catalog.

## Adding a base block

Name it with **no** suffix (`richText`, `statGroup`).

Same shape, three differences: add to `BASE_BLOCKS`; define with `defineBaseBlock` in `blocks/base.ts`; register the renderer in `base/baseComponents.tsx`. `layoutSection.items` needs no edit — its `of:` is derived from `BLOCK_ARRAYS['layoutSection.items']`, which is `BASE_BLOCKS`, so registering the block is what makes it authorable and insertable at once.

## Adding a document type

1. `CONTEXT.md` first — a new document type is new ubiquitous language. If you can't write its one-line definition, you don't have the type yet.
2. Schema in `packages/sanity/src/schemas/documents/`. Every document ends with `seo` then `migration`. Routable types carry a required `slug` (ADR 0001).
3. Routable? Add to `ROUTABLE_TYPES` in `constants.ts`; a collection also needs its prefix and title in every brand's `collections` in `brand.ts`. Then one folder under `apps/web/src/content/documents/<type>/` with `entry.tsx` + registry line.
4. Card projection goes in `queries.ts` next to `INSIGHT_CARD` / `CASE_STUDY_CARD`, shared by every consumer — never duplicated inline.

## Renaming

Renames are cheap now and expensive later — the dataset is disposable during build-out (`CONTEXT.md` → Rebuild), so the cost is code plus any committed JSON under `tools/migration/data/`. Once real content exists it's a content migration.

Rename in one commit, all of it: registry → schema → `index.ts` → `queries.ts` arms → renderer folder **and** file **and** component name → `clientComponents.ts` binding → any `Extract<…, { _type: '…' }>` references → committed JSON under `tools/migration/data/` → `docs/specs/schema.md` → the CONTEXT.md lexicon or known-drift list. Then `pnpm typegen && pnpm check`.

## What not to do

- Don't add a `surface` field by hand, or a per-page surface — surface is a section-block field (`docs/specs/schema.md`).
- Don't fetch inside a block renderer. Expand in `SECTION_FIELDS`.
- Don't write a schema-parity test. ADR 0001 chose the `satisfies` guardrail instead of test suites, deliberately.
- Don't widen a `satisfies` clause to make an error go away — it is load-bearing. Fix the binding.
- Don't imitate the **Known drift** entries in `CONTEXT.md`. Fix them when you're already in the file.
