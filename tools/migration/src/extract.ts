/**
 * Extract → the run's brand's extract tree, one file per document.
 *
 * One command, one extract source per brand. o3's source is WordPress, read
 * through ACF's own `get_fields()` over `terminus wp eval` (ADR 0002); O3XO's is
 * o3xo.ai, the Framer site, read as served HTML. They share the corpus contract
 * — deterministic ids, a committed snapshot with no per-run facts in it, one
 * `_manifest.json` per tree — and nothing else, because the two sources have
 * nothing else in common.
 *
 *   pnpm --filter @o3/migration extract -- --posts all
 *   pnpm --filter @o3/migration extract -- --brand o3xo --slugs ai-of-things-on-device-intelligence
 *
 * Dispatched by dynamic import rather than a branch: each source module does its
 * work at import time, so a static import of both would run the other one too.
 */
import { brandArg } from './lib/brandArg'

const SOURCE_OF_BRAND = {
  o3: () => import('./extract-wordpress'),
  o3xo: () => import('./extract-framer'),
} as const

await SOURCE_OF_BRAND[brandArg()]()
