import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { CASE_STUDY_CARD, INSIGHT_CARD } from '@o3/sanity/queries'
import type { BlockRenderBinding } from '@o3/content-runtime/blocks'

/**
 * The card types the registry knows — the document types that have a card
 * form. Closed, so an app binding a type no card exists for is a compile
 * error rather than a binding nothing ever reads.
 */
export type CardTypeName = 'insight' | 'caseStudy' | 'page'

/**
 * One card type's render binding, in the section tier's shape
 * (`defineBlockRender`). Cards are client-safe by construction — they render
 * inside `ClientBlockRenderer` — so there is no server-only arm here.
 */
export type CardRenderBinding<
  K extends CardTypeName = CardTypeName,
  // Default only — every real binding infers its own concrete C via
  // defineCardRender; this just widens an unparameterized reference.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C = ComponentType<any>,
> = BlockRenderBinding<K, C> & { serverOnly?: never }

/**
 * Binds one card type to the component that draws it. `K extends CardTypeName`
 * is where an unknown type fails, at the binding rather than at the record it
 * derives.
 *
 * Generic over the component too, so a binding keeps its own concrete props
 * instead of widening to `ComponentType<any>`.
 */
export function defineCardRender<K extends CardTypeName, C>(
  type: K,
  opts: { component: C },
): CardRenderBinding<K, C> {
  return { type, component: opts.component }
}

/**
 * An app's card table, derived from its bindings with `bindingsToRecord`.
 * Partial: an unbound type falls back to the shared card.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CardComponents = Partial<Record<CardTypeName, ComponentType<any>>>

/**
 * The shared cards, lazily imported so a section block pulls in only the card
 * it draws. View + Card are the only view modes o3 carries (the vtx Teaser
 * mode was not ported).
 */
const SHARED_CARDS = {
  insight: dynamic(() => import('./InsightCard').then((m) => m.InsightCard)),
  caseStudy: dynamic(() => import('./CaseStudyCard').then((m) => m.CaseStudyCard)),
  page: dynamic(() => import('./PageCard').then((m) => m.PageCard)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<CardTypeName, ComponentType<any>>

/**
 * The card a section draws for one type: the app's binding when it has one,
 * the shared card otherwise. `cards` is how a per-app binding reaches a shared
 * renderer — the same channel `LayoutSection`'s `baseComponents` opens for the
 * base tier, and for the same reason: the three card-drawing sections are
 * server components on the published path, so nothing may travel by context.
 */
export function getCard(
  type: CardTypeName,
  cards?: CardComponents,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentType<any> {
  return cards?.[type] ?? SHARED_CARDS[type]
}

/**
 * Per-type GROQ card projections, keyed by `_type`. o3's queries are static
 * (composed inside `@o3/sanity/queries`), so unlike vtx these are not
 * composed into queries at runtime — the map re-exports the package's
 * fragments as the single lookup point for any future runtime-composed
 * feed query.
 */
export const CARD_PROJECTIONS: Record<string, string> = {
  insight: INSIGHT_CARD,
  caseStudy: CASE_STUDY_CARD,
}
