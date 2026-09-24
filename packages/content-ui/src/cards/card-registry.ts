import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { CASE_STUDY_CARD, INSIGHT_CARD } from '@o3/sanity/queries'

import { CaseStudyCard } from './CaseStudyCard'

/**
 * The card types the registry knows — the document types that have a card
 * form. A list and not a bare union: the renderer seam test walks it to check
 * that every type still has its card in this package.
 */
export const CARD_TYPES = ['insight', 'caseStudy', 'page'] as const

export type CardTypeName = (typeof CARD_TYPES)[number]

/**
 * The cards. Insight and page cards are lazily imported so a section block
 * pulls in only the card it draws; the case-study card is bound directly
 * because the homepage showcase stacks it on first paint, and a lazy card
 * suspends there. View and Card are the only view modes o3 carries.
 */
const CARDS = {
  insight: dynamic(() => import('./InsightCard').then((m) => m.InsightCard)),
  caseStudy: CaseStudyCard,
  page: dynamic(() => import('./PageCard').then((m) => m.PageCard)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<CardTypeName, ComponentType<any>>

/** The card a section draws for one document type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCard(type: CardTypeName): ComponentType<any> {
  return CARDS[type]
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
