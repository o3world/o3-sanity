export function createSpatialMotion() {
  let paused = false
  let pausedAt = 0
  let pausedDuration = 0
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => paused,

    setPaused(nextPaused: boolean, now: number = performance.now()): void {
      if (nextPaused === paused) return

      if (nextPaused) pausedAt = now
      else pausedDuration += now - pausedAt

      paused = nextPaused
      for (const listener of listeners) listener()
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    now(timestamp: number): number {
      return (paused ? pausedAt : timestamp) - pausedDuration
    },
  }
}

export type SpatialMotion = ReturnType<typeof createSpatialMotion>
export type SpatialMotionRoot = HTMLElement & { __o3SpatialMotion?: SpatialMotion }
