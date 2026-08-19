import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { CASE_STUDY_CARD, INSIGHT_CARD } from '@o3/sanity/queries'

import { DefaultCard } from './DefaultCard'

/**
 * Client-safe card override registry. Separate from the full `registry.ts`
 * (whose view graph is server-oriented) so section blocks stay within the
 * client component boundary. View + Card are the only view modes o3 carries
 * (the vtx Teaser mode was not ported).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CARD_OVERRIDES: Record<string, ComponentType<any>> = {
  insight: dynamic(() => import('./InsightCard').then((m) => m.InsightCard)),
  caseStudy: dynamic(() => import('./CaseStudyCard').then((m) => m.CaseStudyCard)),
  page: dynamic(() => import('./PageCard').then((m) => m.PageCard)),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCard(type: string): ComponentType<any> {
  return CARD_OVERRIDES[type] ?? DefaultCard
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
