import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { DefaultView } from './_defaults/DefaultView'

// Card getters live in a client-safe file so section blocks (which render
// inside ClientBlockRenderer, a 'use client' component) can import them
// without pulling the view graph into the browser bundle.
export { getCard, CARD_PROJECTIONS } from './card-registry'

/**
 * View-mode override registry. Maps `_type` to its custom View component
 * when one is registered; otherwise consumers fall back to `DefaultView`.
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
  perspective: dynamic(() =>
    import('./perspective/PerspectiveView').then((m) => m.PerspectiveView),
  ),
  caseStudy: dynamic(() => import('./caseStudy/CaseStudyView').then((m) => m.CaseStudyView)),
  page: dynamic(() => import('./page/PageView').then((m) => m.PageView)),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getView(type: string): ComponentType<any> {
  return VIEW_OVERRIDES[type] ?? DefaultView
}
