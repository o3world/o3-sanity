/**
 * The schema-free block registry: single source of block membership. A block
 * that isn't listed here cannot be defined (the factories throw), and the web
 * app's BLOCK_REGISTRY is compile-checked against the generated types derived
 * from these schemas — so schema and renderers cannot drift apart.
 */
export const SECTION_BLOCKS = [
  'heroSection',
  'logoWallSection',
  'caseShowcaseSection',
  'railPanelsSection',
  'quoteSection',
  'insightsCarouselSection',
  'ctaSection',
  'disciplineGridSection',
  'personGridSection',
  'roleListSection',
  'inFlightSection',
  'formSection',
  'layoutSection',
  'mediaSection',
  'screenGridSection',
  'listingSection',
] as const

export const BASE_BLOCKS = ['richText', 'figure', 'embed', 'cta', 'statGroup'] as const

export type SectionBlockName = (typeof SECTION_BLOCKS)[number]
export type BaseBlockName = (typeof BASE_BLOCKS)[number]

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
 * one field and there is nothing to derive it from — but the direction is the
 * one ADR 0020 argues for: `page.sections`, `caseStudy.story` and
 * `layoutSection.items` all build their `of:` from HERE, so the schema is the
 * mirror rather than the source, and `blockArrays.test.ts` catches a
 * block-bearing array that forgot to say so.
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
export const BLOCK_ARRAYS = {
  'page.sections': SECTION_BLOCKS,
  /**
   * `story` also takes `chapter` (ADR 0018), which is a shared object rather
   * than a block. It is added beside these members in `caseStudy.ts` and is
   * deliberately not here: this map answers what the insert menu can BUILD, and
   * a `chapter` declares no knobs and therefore no placeholder. That exclusion
   * is a registry fact — `chapter` is in neither block list — and not a
   * denylist someone has to keep in step.
   */
  'caseStudy.story': SECTION_BLOCKS,
  /**
   * Unreachable from the canvas today: the overlay is never asked to resolve a
   * path inside `layoutSection.items`, a polymorphic array at depth ≥ 2 (#104,
   * deferred to #115). Declared anyway, because the schema below derives its
   * members from this entry and the day #115 lands the menu already knows.
   */
  'layoutSection.items': BASE_BLOCKS,
} as const satisfies Readonly<Record<string, readonly string[]>>

/** The address of one block-bearing array — `page.sections`. */
export type BlockArrayKey = keyof typeof BLOCK_ARRAYS

/**
 * One array's members, in the shape `defineArrayMember` takes. The schema calls
 * this; nothing else needs it, because every other reader wants the type names.
 */
export function blockArrayMembers(key: BlockArrayKey): { type: string }[] {
  return BLOCK_ARRAYS[key].map((type) => ({ type }))
}
