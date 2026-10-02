'use client'

import { createContext, useContext } from 'react'

/**
 * Optional shared clock the app supplies; without a provider, each animated
 * component keeps its own motion. `getSnapshot()` is the site's pause — the
 * footer's Reduce motion — and `now()` is the paused-aware time.
 */
export interface OrbitalMotionClock {
  getSnapshot(): boolean
  now(timestamp: number): number
  subscribe(listener: () => void): () => void
}
export const OrbitalMotionContext = createContext<OrbitalMotionClock | null>(null)
export const useOrbitalMotion = () => useContext(OrbitalMotionContext)
