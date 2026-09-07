'use client'

import { createContext, useContext } from 'react'
import type { ComponentType, RefObject } from 'react'
import type { OrbitalArc, GlobePreset } from './orbital-sphere'

export interface OrbitalRendererProps {
  hostRef: RefObject<HTMLDivElement | null>
  arcs: OrbitalArc[]
  preset: GlobePreset
  motion: 'still' | 'orbit'
  opacity: number
  electronOpacity: number
  onReady: (ready: boolean | undefined) => void
}

export const OrbitalRendererContext = createContext<ComponentType<OrbitalRendererProps> | null>(
  null,
)
export const useOrbitalRenderer = () => useContext(OrbitalRendererContext)

/** Optional shared clock; without a provider, each sphere keeps its own motion. */
export interface OrbitalMotionClock {
  getSnapshot(): boolean
  now(timestamp: number): number
  subscribe(listener: () => void): () => void
}
export const OrbitalMotionContext = createContext<OrbitalMotionClock | null>(null)
export const useOrbitalMotion = () => useContext(OrbitalMotionContext)
