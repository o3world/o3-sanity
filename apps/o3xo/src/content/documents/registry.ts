import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { DefaultView } from './_defaults/DefaultView'

/**
 * View-mode override registry. The card half of the pair is not here: cards
 * moved to `@o3/content-ui/cards` with the section blocks that render them
 * (#212), and this file's view graph is server-oriented, so a view reaches
 * that package directly rather than through a re-export.
 *
 * Maps `_type` to its custom View component when one is registered; otherwise
 * consumers fall back to `DefaultView`.
 *
 * Overrides use `next/dynamic` so they don't enter the bundle until a route
 * actually renders one; `DefaultView` is statically imported — a single
 * shared chunk serves all documents that don't override.
 *
 * Adding a content type stays a one-folder change (ADR 0001):
 * `documents/<type>/entry.tsx` + a line here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VIEW_OVERRIDES: Record<string, ComponentType<any>> = {
  insight: dynamic(() => import('./insight/InsightView').then((m) => m.InsightView)),
  caseStudy: dynamic(() => import('./caseStudy/CaseStudyView').then((m) => m.CaseStudyView)),
  page: dynamic(() => import('./page/PageView').then((m) => m.PageView)),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getView(type: string): ComponentType<any> {
  return VIEW_OVERRIDES[type] ?? DefaultView
}
