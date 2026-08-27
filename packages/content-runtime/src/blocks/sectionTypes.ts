import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import type { SanityLoc } from '../dataAttribute'

/**
 * The canonical pin points for the two block-tier unions, sourced from the
 * generated result of PAGE_QUERY's section projection (so renderer prop
 * types include the query-time expansions: dereferenced button targets, card
 * projections, listing subqueries).
 *
 * `caseStudy.story` shares the same projection fragment
 * (SECTION_FIELDS in @o3/sanity/queries), so this union covers both hosts.
 */
export type PageSection = NonNullable<NonNullable<PAGE_QUERY_RESULT>['sections']>[number]

/** Base-tier blocks — the members of a layoutSection column's `items` array. */
export type LayoutItem = NonNullable<
  Extract<PageSection, { _type: 'layoutSection' }>['items']
>[number]

export type SectionBlockData<K extends PageSection['_type']> = Extract<PageSection, { _type: K }>
export type BaseBlockData<K extends LayoutItem['_type']> = Extract<LayoutItem, { _type: K }>

/**
 * The block's own location in the document, handed down by the dispatch seam
 * (#107). A block reads it to attribute the levels below the band — its
 * header, its keyed items — with `fieldAttr` / `itemAttr`.
 *
 * Optional because it is only ever present when a document is behind the
 * render: a Storybook story and a component render test have no document, and
 * the attribute is simply absent there.
 */
export interface BlockLocProps {
  loc?: SanityLoc
}

/**
 * The props a section block component receives (its data minus dispatch keys).
 *
 * `backgroundMedia` is re-optionalised. Every band carries the field and the
 * projection expands it for its LQIP, which is what makes typegen emit it as a
 * present-but-nullable key; the field itself is optional content and a caller
 * with no picture — a story, a render test — should not have to write `null`
 * sixteen times to say so.
 */
export type SectionProps<K extends PageSection['_type']> = Omit<
  SectionBlockData<K>,
  '_key' | '_type' | 'backgroundMedia'
> &
  Partial<Pick<SectionBlockData<K>, 'backgroundMedia'>> &
  BlockLocProps

/** The props a base block component receives. */
export type BaseProps<K extends LayoutItem['_type']> = Omit<BaseBlockData<K>, '_key' | '_type'>

/** The dereferenced button shape every block-level button field shares. */
export type ButtonData = NonNullable<SectionProps<'heroSection'>['button']>
