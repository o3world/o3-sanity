import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

/**
 * The canonical pin points for the two block-tier unions, sourced from the
 * generated result of PAGE_QUERY's section projection (so renderer prop
 * types include the query-time expansions: dereferenced cta targets, card
 * projections, listing subqueries).
 *
 * `caseStudy.extraSections` shares the same projection fragment
 * (SECTION_FIELDS in @o3/sanity/queries), so this union covers both hosts.
 */
export type PageSection = NonNullable<NonNullable<PAGE_QUERY_RESULT>['sections']>[number]

/** Base-tier blocks — the members of a layoutSection column's `items` array. */
export type LayoutItem = NonNullable<
  Extract<PageSection, { _type: 'layoutSection' }>['items']
>[number]

export type SectionBlockData<K extends PageSection['_type']> = Extract<PageSection, { _type: K }>
export type BaseBlockData<K extends LayoutItem['_type']> = Extract<LayoutItem, { _type: K }>

/** The props a section block component receives (its data minus dispatch keys). */
export type SectionProps<K extends PageSection['_type']> = Omit<
  SectionBlockData<K>,
  '_key' | '_type'
>

/** The props a base block component receives. */
export type BaseProps<K extends LayoutItem['_type']> = Omit<BaseBlockData<K>, '_key' | '_type'>

/** The dereferenced cta shape every block-level CTA field shares. */
export type CtaData = NonNullable<SectionProps<'heroBlock'>['cta']>
