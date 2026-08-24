import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { CASE_STUDY_CARD, INSIGHT_CARD } from '@o3/sanity/queries'
import type { AppFirstRendererName } from '@o3/sanity/schemas/registry'
import type { BlockRenderBinding } from '@o3/content-runtime/blocks'

/**
 * The card types the registry knows — the document types that have a card
 * form. Closed, so an app binding a type no card exists for is a compile
 * error rather than a binding nothing ever reads.
 *
 * A list and not a bare union: the app-first seam test walks it to check that
 * every type the record does NOT demote still has its shared card.
 */
export const CARD_TYPES = ['insight', 'caseStudy', 'page'] as const

export type CardTypeName = (typeof CARD_TYPES)[number]

/**
 * The card types each app draws for itself (`APP_FIRST_RENDERERS`). No shared
 * card exists for one, which is why the two tables below are cut around this
 * union rather than around a hand-kept list.
 */
export type AppFirstCardName = AppFirstRendererName<'card'>

/** The card types the shared library still draws — the roster minus the demoted. */
type SharedCardName = Exclude<CardTypeName, AppFirstCardName>

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
 * What every app's card table must hold: one component per app-first type.
 * Recording a demotion fails each app's `satisfies` clause here until that app
 * binds its own card, which is what makes the record bite before a test runs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppFirstCardComponents = Record<AppFirstCardName, ComponentType<any>>

/**
 * The cards a band drawing `K` is handed: the demoted types among `K` are
 * required, the rest are an optional re-point over the shared card.
 */
export type CardComponentsFor<K extends CardTypeName> = CardComponents &
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<Extract<K, AppFirstCardName>, ComponentType<any>>

/**
 * A band's card slot, required exactly when the type it draws is app-first —
 * there is no shared card behind it to fall back to. A band drawing a shared
 * type keeps the optional slot, so binding nothing stays the default.
 */
export type CardSlot<K extends CardTypeName> = [Extract<K, AppFirstCardName>] extends [never]
  ? { cardComponents?: CardComponents }
  : { cardComponents: CardComponentsFor<K> }

/**
 * The shared cards, lazily imported so a section block pulls in only the card
 * it draws. View + Card are the only view modes o3 carries (the vtx Teaser
 * mode was not ported).
 */
const SHARED_CARDS = {
  insight: dynamic(() => import('./InsightCard').then((m) => m.InsightCard)),
  page: dynamic(() => import('./PageCard').then((m) => m.PageCard)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<SharedCardName, ComponentType<any>>

/**
 * The card a section draws for one type: the app's binding when it has one,
 * the shared card otherwise — and for an app-first type the binding is the
 * only answer, which the argument list makes a compile error to omit.
 *
 * `cards` is how a per-app binding reaches a shared renderer — the same channel `LayoutSection`'s `baseComponents` opens for the
 * base tier, and for the same reason: the three card-drawing sections are
 * server components on the published path, so nothing may travel by context.
 */
export function getCard<K extends CardTypeName>(
  type: K,
  ...[cards]: [Extract<K, AppFirstCardName>] extends [never]
    ? [cards?: CardComponents]
    : [cards: CardComponentsFor<K>]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentType<any> {
  const bound = (cards as CardComponents | undefined)?.[type]
  // An app-first type never reaches the shared table: its slot is required and
  // typed to carry it, so this lookup is only ever asked for a shared card.
  return bound ?? SHARED_CARDS[type as SharedCardName]
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
