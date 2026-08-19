/**
 * Convert → the run's brand's converted tree, one file per document.
 *
 * Deterministic transform from the brand's extract tree to loadable Sanity
 * documents, fail-loud on anything it cannot map (ADR 0002). One driver per
 * extract source; the mapping rules live in `src/map/`, where they are
 * unit-tested without touching the filesystem.
 *
 *   pnpm --filter @o3/migration convert
 *   pnpm --filter @o3/migration convert -- --brand o3xo
 *
 * Dispatched by dynamic import for the same reason `extract.ts` is: each driver
 * runs at import time.
 */
import { brandArg } from './lib/brandArg'

const DRIVER_OF_BRAND = {
  o3: () => import('./convert-wordpress'),
  o3xo: () => import('./convert-framer'),
} as const

await DRIVER_OF_BRAND[brandArg()]()
