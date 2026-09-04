export const ROUTES = ['/', '/insights', '/work', '/work/best-egg'] as const

export const THROTTLE = {
  cpuRate: 4,
  latencyMs: 150,
  downloadBitsPerSecond: 1_600_000,
  uploadBitsPerSecond: 750_000,
  viewport: { width: 390, height: 844 },
} as const

/** The main-thread/network quiet window used by the TTI boundary. */
export const TTI_QUIET_WINDOW_MS = 5_000

export interface Metrics {
  lcp: number
  cls: number
  inp: number
  tbt: number
}

export interface RouteSamples {
  route: (typeof ROUTES)[number]
  samples: readonly [Metrics, Metrics]
}
