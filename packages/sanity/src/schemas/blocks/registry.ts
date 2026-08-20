import type { Brand } from '../../brand'

/**
 * The schema-free block registry: single source of block membership. A block
 * that isn't listed here cannot be defined (the factories throw), and each
 * app's BLOCK_REGISTRY is compile-checked against the generated types derived
 * from these schemas — so schema and renderers cannot drift apart.
 *
 * The section tier is **a core list plus per-brand extensions** (ADR 0028).
 * Both brands render the core; a brand's own list is what its design asks for
 * and the other brand's app has no renderer for.
 */
export const CORE_SECTION_BLOCKS = [
  'heroSection',
  'logoWallSection',
  'caseShowcaseSection',
  'railPanelsSection',
  'quoteSection',
  'insightsCarouselSection',
  'ctaSection',
  'featureGridSection',
  'personGridSection',
  'roleListSection',
  'inFlightSection',
  'formSection',
  'layoutSection',
  'mediaSection',
  'screenGridSection',
  'listingSection',
] as const

/**
 * What each brand adds to the core roster.
 *
 * An entry here is a claim about **one brand's design**, not a staging area: a
 * block belongs in the core list the moment both brands draw it, and moving it
 * there is the promotion ADR 0028 already describes for components. Keep the
 * lists short: a roster of well-known blocks beats two brands' worth of
 * half-known ones.
 */
export const BRAND_SECTION_BLOCKS = {
  o3: [],
  /** `faqSection` — the kit's FAQ Accordion (`4406:7288`), which O3 draws nowhere (#248). */
  o3xo: ['faqSection'],
} as const satisfies Readonly<Record<Brand, readonly string[]>>

/**
 * Every section block in the content model, core and brand alike.
 *
 * This is the list the factories check, the schema registers and typegen
 * extracts — one model with one typegen, which ADR 0028 keeps as the thing the
 * brands may not fork. Which of them a given brand *renders* is
 * `sectionBlocksFor` below.
 */
export const SECTION_BLOCKS = [
  ...CORE_SECTION_BLOCKS,
  ...BRAND_SECTION_BLOCKS.o3,
  ...BRAND_SECTION_BLOCKS.o3xo,
] as const

export const BASE_BLOCKS = [
  'richText',
  'figure',
  'embed',
  'button',
  'buttonGroup',
  'statGroup',
  'mark',
] as const

export type SectionBlockName = (typeof SECTION_BLOCKS)[number]
export type BaseBlockName = (typeof BASE_BLOCKS)[number]

/**
 * One brand's section roster as a type — core plus that brand's own.
 *
 * This is what an app's block bindings are checked against, and it is the whole
 * enforcement of "an O3XO-only block never forces a renderer into the O3 app":
 * binding `faqSection` in `apps/web` is a type error at the array's `satisfies`
 * clause, and omitting it in `apps/o3xo` is one at the record's.
 */
export type BrandSectionBlockName<B extends Brand> =
  (typeof CORE_SECTION_BLOCKS)[number] | (typeof BRAND_SECTION_BLOCKS)[B][number]

/** One brand's section roster as a list — core plus that brand's own. */
export function sectionBlocksFor(brand: Brand): readonly SectionBlockName[] {
  return [...CORE_SECTION_BLOCKS, ...BRAND_SECTION_BLOCKS[brand]]
}

/**
 * WHICH ARRAYS HOLD BLOCKS, AND WHICH BLOCKS EACH HOLDS — the one declaration
 * behind both the schema's `of:` and the canvas insert menu (#112).
 *
 * Keyed `<host type>.<field>`, which is the address the overlay already has:
 * the host is the document for a root array and the enclosing block for a
 * nested one, and both answer `_type` in the draft snapshot. A bare field name
 * would not do — `items` is a plausible name in more than one place, and a
 * collision would offer an editor the wrong roster on the right-looking band.
 *
 * WHAT IS DERIVED AND WHAT IS AUTHORED. The **members** are derived: each entry
 * points at the registry above, so registering a block makes it insertable
 * everywhere its tier belongs and no second list has to hear about it. The
 * **arrays** are authored, because "this array holds blocks" is a fact about
 * one field and there is nothing to derive it from. The direction is still the
 * one ADR 0020 argues for: `page.sections`, `caseStudy.story` and
 * `layoutSection.items` all build their `of:` from HERE, so the schema is the
 * mirror rather than the source, and `blockArrays.test.ts` catches a
 * block-bearing array that forgot to say so.
 *
 * The two section arrays take **whichever roster the caller builds with**
 * (ADR 0028): one brand's, for the Studio that brand's editors work in, or the
 * whole model's, for typegen. The roster is a parameter and never an ambient
 * read, so the same process can build both — which is what a test walking two
 * brands' schemas needs.
 *
 * This is what replaced `sectionBlockMembers`, whose comment recorded why the
 * derivation matters: #58 registered, defined, rendered and bound
 * `formSection`, and it still could not appear in a page, because the member
 * list had not heard of it. The failure surfaced as a typecheck error in the
 * *renderer*, three files away from the omission.
 *
 * The prior art is what the shape is arguing against. It kept
 * `NON_REPEATABLE_TYPES`, `NOT_INSERTABLE_TYPES` and a constant per array name,
 * each a hand-kept mirror of a schema fact and each free to drift; here there
 * is no list of what may not be inserted, because everything in an array's
 * declared members may be.
 */
function blockArrays(sections: readonly SectionBlockName[]) {
  return {
    'page.sections': sections,
    /**
     * `story` also takes `chapter` (ADR 0018), which is a shared object rather
     * than a block. It is added beside these members in `caseStudy.ts` and is
     * deliberately not here: this map answers what the insert menu can BUILD,
     * and a `chapter` declares no knobs and therefore no placeholder. That
     * exclusion is a registry fact — `chapter` is in neither block list — and
     * not a denylist someone has to keep in step.
     */
    'caseStudy.story': sections,
    /**
     * Unreachable from the canvas, and staying that way (ADR 0022). This is the
     * repo's only polymorphic array below a block root, which is the one shape
     * the Presentation overlay cannot resolve at `sanity@6.8.0` /
     * `@sanity/visual-editing@5.7.3` — silently, so nothing reports it (#104,
     * #115). We keep the array polymorphic rather than wrapping its members in
     * a discriminator, because that wrapper would outlive the bug it works
     * around and would cost the `satisfies` guardrail that checks the base
     * renderers. `nestedUnionArrays.test.ts` holds the line at this one entry.
     *
     * Declared here anyway: the schema derives its members from this entry, and
     * if the bugs in `docs/upstream/` are fixed the menu already knows.
     *
     * The base tier is one list for both brands, so this entry is the same in
     * every roster.
     */
    'layoutSection.items': BASE_BLOCKS,
  } as const satisfies Readonly<Record<string, readonly string[]>>
}

/**
 * Every block-bearing array over the **whole model** — core plus every brand's
 * own sections.
 *
 * This is what typegen extracts and what the migration tools compile against:
 * the generated types are one file both apps read, so schema extraction has to
 * see blocks neither Studio offers together. A Studio takes `blockArraysFor`
 * instead.
 */
export const BLOCK_ARRAYS = blockArrays(SECTION_BLOCKS)

/**
 * Which arrays hold blocks and which blocks each holds, for one roster.
 * Derived from the builder so a new block-bearing array is one edit there —
 * a hand-written mirror could drift and silently drop the new key from
 * `BlockArrayKey`.
 */
export type BlockArrays = ReturnType<typeof blockArrays>

/** The address of one block-bearing array — `page.sections`. */
export type BlockArrayKey = keyof BlockArrays

/**
 * One brand's block-bearing arrays — the core sections plus that brand's own.
 *
 * The insert menu and the Studio form read the same answer, because both are
 * built from this: an app hands it to `createCanvasComponents`, and
 * `schemaTypesFor` builds that brand's `of:` from it.
 */
export function blockArraysFor(brand: Brand): BlockArrays {
  return blockArrays(sectionBlocksFor(brand))
}

/**
 * One array's members, in the shape `defineArrayMember` takes. The schema calls
 * this; nothing else needs it, because every other reader wants the type names.
 */
export function blockArrayMembers(key: BlockArrayKey, arrays: BlockArrays): { type: string }[] {
  return arrays[key].map((type) => ({ type }))
}
