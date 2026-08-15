'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Surface } from './section-shell'

/**
 * WHICH SURFACE A SUBTREE IS STANDING ON, so a component inside it can answer
 * a question about its own background without being told (#147, ADR 0024).
 *
 * `undefined` — nothing declared one — is a real answer and the default. It is
 * what an element outside the band system reaches when its chrome has not said
 * what it paints, and `resolveContrast` turns it into the fill that cannot
 * disappear.
 */
const SurfaceContext = createContext<Surface | undefined>(undefined)

/**
 * Declare the surface a subtree is painted on.
 *
 * `SectionShell` does this for the nine bands that use it, so a band gets it
 * for free. The seven that build their own `<section>` — anything bleeding past
 * the gutter or painting a gradient — reach for this the same way they reach
 * for `SURFACE_CLASS`, and so does chrome: the nav pill, the utility strip and
 * the footer sit outside the band system entirely and would otherwise be the
 * one place a surface-resolved value has nothing to read.
 *
 * **The rule is: whatever paints a background declares it.** A component that
 * only lays out its children does not, so the nearest declaration a button
 * finds is the nearest thing actually behind it.
 *
 * A client component, and the only reason `ButtonLink` is one. React context
 * does not exist in a server component, and the alternative — threading a
 * `surface` prop through every renderer — cannot reach a `button` base block
 * dropped into a layout column, which receives its own fields and nothing
 * about where it landed.
 */
export function SurfaceProvider({ surface, children }: { surface: Surface; children: ReactNode }) {
  return <SurfaceContext.Provider value={surface}>{children}</SurfaceContext.Provider>
}

/** The nearest declared surface, or `undefined` outside any. */
export function useSurface(): Surface | undefined {
  return useContext(SurfaceContext)
}
