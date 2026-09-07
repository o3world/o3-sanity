'use client'

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, OrbitalMotionContext } from '@o3/ui'
import { createSpatialMotion, type SpatialMotion, type SpatialMotionRoot } from './spatial-motion'
import './motion-control.css'

type MotionContext = {
  motion: SpatialMotion
  blocked: boolean | null
}
const SpatialMotionContext = createContext<MotionContext | null>(null)
const unpaused = () => false
const noSubscription = () => () => {}

export function useSpatialMotion() {
  return useContext(SpatialMotionContext)?.motion
}

export function SpatialMotionControl() {
  const context = useContext(SpatialMotionContext)
  const paused = useSyncExternalStore(
    context?.motion.subscribe ?? noSubscription,
    context?.motion.getSnapshot ?? unpaused,
    unpaused,
  )
  if (!context) return null
  const reduced = paused || context.blocked === true
  return (
    <Button
      type="button"
      variant="ghost"
      className="spatial-motion-setting cursor-pointer"
      aria-pressed={reduced}
      disabled={context.blocked !== false}
      onClick={() => context.motion.setPaused(!context.motion.getSnapshot())}
    >
      Reduce motion
      <span aria-hidden="true">{reduced ? 'On' : 'Off'}</span>
    </Button>
  )
}

function MotionQuerySync({ refresh }: { refresh: () => void }) {
  const still = useSearchParams()?.has('spatial-still') ?? false
  useEffect(refresh, [still, refresh])
  return null
}

export function SpatialMotionProvider({ children }: { children: ReactNode }) {
  const [motion] = useState(createSpatialMotion)
  const [blocked, setBlocked] = useState<boolean | null>(null)
  const refreshPreferences = useRef<(() => void) | null>(null)
  const refresh = useCallback(() => refreshPreferences.current?.(), [])
  const context = useMemo(() => ({ motion, blocked }), [motion, blocked])
  const fallbackMotion = useMemo(
    () => ({
      ...motion,
      getSnapshot: () =>
        motion.getSnapshot() || new URLSearchParams(location.search).has('spatial-still'),
    }),
    [motion],
  )

  useLayoutEffect(() => {
    // Publish only after hydration; the server-owned attributes stay untouched before it.
    const root = document.documentElement as SpatialMotionRoot
    root.__o3SpatialMotion = motion
    const publish = () => {
      if (motion.getSnapshot()) root.dataset.spatialPaused = 'true'
      else delete root.dataset.spatialPaused
    }
    publish()
    const unsubscribe = motion.subscribe(publish)
    return () => {
      unsubscribe()
      if (root.__o3SpatialMotion !== motion) return
      delete root.__o3SpatialMotion
      delete root.dataset.spatialPaused
    }
  }, [motion])

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let previousBlocked: boolean | undefined
    const update = () => {
      const still = new URLSearchParams(location.search).has('spatial-still')
      const root = document.documentElement
      if (root.hasAttribute('data-spatial-still') !== still)
        root.toggleAttribute('data-spatial-still', still)
      const nextBlocked = reduced.matches || still
      if (nextBlocked !== previousBlocked) {
        previousBlocked = nextBlocked
        setBlocked(nextBlocked)
      }
    }
    refreshPreferences.current = update
    update()
    reduced.addEventListener('change', update)
    window.addEventListener('popstate', update)
    return () => {
      refreshPreferences.current = null
      reduced.removeEventListener('change', update)
      window.removeEventListener('popstate', update)
      document.documentElement.removeAttribute('data-spatial-still')
    }
  }, [])

  return (
    <SpatialMotionContext.Provider value={context}>
      <OrbitalMotionContext.Provider value={fallbackMotion}>
        {children}
      </OrbitalMotionContext.Provider>
      <Suspense fallback={null}>
        <MotionQuerySync refresh={refresh} />
      </Suspense>
    </SpatialMotionContext.Provider>
  )
}
