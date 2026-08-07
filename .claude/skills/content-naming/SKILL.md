---
name: content-naming
description: Naming and wiring rules for Sanity content in this repo. Use when adding, renaming, or removing a section block, base block, shared object, document type, schema field, or block renderer — anything under packages/sanity/src/schemas/ or apps/web/src/content/. Also use when reviewing a diff that touches those paths.
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
3. Use the shared field factories where one exists (`headingField()`, `eyebrowField()`, `ctaField()`, `mediaField()`, `decorationField()`) rather than retyping the `defineField` call. If you're about to copy a field definition from another block, that's the signal to add a factory instead.
4. Enums: bare noun, `options.list` from a `constants.ts` const array where the values are shared, always an `initialValue`.
5. Required fields get `validation: (rule) => rule.required()`. Anything an editor could plausibly leave blank should stay optional — the renderer handles absence.

## Adding a section block

Name it `<thing>Section`. Never `<thing>Block`.

1. `packages/sanity/src/schemas/blocks/registry.ts` — add to `SECTION_BLOCKS`. The factory throws until you do.
2. `packages/sanity/src/schemas/blocks/section.ts` — `defineSectionBlock({ name, title, defaultSurface, fields, preview })`. Don't add a `surface` field; the factory injects it.
3. `packages/sanity/src/schemas/index.ts` — import and add to `schemaTypes`, in the section-blocks group.
4. `packages/sanity/src/queries.ts` — add a `_type == "<name>Section" => { … }` arm to `SECTION_FIELDS` **only if** the block needs query-time expansion (dereferenced `cta` targets, reference→card projections, a subquery). Renderers must stay pure components: resolve data here, not in the component.
5. `apps/web/src/content/blocks/section/<name>Section/<Name>Section.tsx` — folder name === schema name exactly. Type props with `SectionProps<'<name>Section'>` from `sectionTypes.ts`; never hand-write the prop shape.
6. `apps/web/src/content/blocks/clientComponents.ts` — add a `defineBlockRender('<name>Section', { component: … })` entry to `CLIENT_SECTION_BINDINGS`.
7. `pnpm typegen`, then `pnpm typecheck`. The `satisfies` clause in `apps/web/src/content/blocks/registry.ts` is what catches a renderer whose props drifted from the generated shape.

## Adding a base block

Name it with **no** suffix (`richText`, `statGroup`).

Same shape, four differences: add to `BASE_BLOCKS`; define with `defineBaseBlock` in `blocks/base.ts`; register the renderer in `base/baseComponents.tsx`; and add it as a `defineArrayMember` to `layoutSection.items` in `section.ts` — a base block not listed there can never be authored.

## Adding a document type

1. `CONTEXT.md` first — a new document type is new ubiquitous language. If you can't write its one-line definition, you don't have the type yet.
2. Schema in `packages/sanity/src/schemas/documents/`. Every document ends with `seo` then `migration`. Routable types carry a required `slug` (ADR 0001).
3. Routable? Add to `ROUTABLE_TYPES` and `COLLECTION_PREFIXES` in `constants.ts`, then one folder under `apps/web/src/content/documents/<type>/` with `entry.tsx` + registry line.
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
