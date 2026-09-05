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
  onReady: (ready: boolean) => void
}

export const OrbitalRendererContext = createContext<ComponentType<OrbitalRendererProps> | null>(
  null,
)
export const useOrbitalRenderer = () => useContext(OrbitalRendererContext)
