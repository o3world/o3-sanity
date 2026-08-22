/**
 * The design files this package watches, one per brand (#242).
 *
 * A brand is a set of committed files, not a code path: the manifest that says
 * what to watch, the baseline that makes the next run cheap, and the report
 * that describes the last run with something to say. Everything else — the
 * hashing, the diff, the probe, the short-circuit — is the same work over
 * whichever set the run was asked for.
 *
 * Only O3 has an asset manifest. `tools/migration/data/seed/assets/` is O3's
 * seed content (#80), so an O3XO run has no assets to re-export and the whole
 * asset stage is a no-op rather than a second manifest of nothing.
 */
export const BRANDS = ['o3', 'o3xo'] as const
export type Brand = (typeof BRANDS)[number]

export const DEFAULT_BRAND: Brand = 'o3'

export interface BrandFiles {
  /** Hand-maintained: what this brand watches. */
  readonly trackedNodes: string
  /** Hand-maintained: where every committed seed asset came from. O3 only. */
  readonly assetManifest: string | null
  /** Machine-written: last-seen file version + per-node hashes. */
  readonly baseline: string
  readonly reportJson: string
  readonly reportMd: string
}

/**
 * The default brand keeps the unsuffixed filenames it has always had, so an
 * `o3` run's diff is the same three paths it was before the second brand
 * existed.
 */
const FILES: Record<Brand, BrandFiles> = {
  o3: {
    trackedNodes: 'tracked-nodes.json',
    assetManifest: 'asset-manifest.json',
    baseline: 'baseline.json',
    reportJson: 'report.json',
    reportMd: 'report.md',
  },
  o3xo: {
    trackedNodes: 'tracked-nodes-o3xo.json',
    assetManifest: null,
    baseline: 'baseline-o3xo.json',
    reportJson: 'report-o3xo.json',
    reportMd: 'report-o3xo.md',
  },
}

export function brandFiles(brand: Brand): BrandFiles {
  return FILES[brand]
}

export function isBrand(value: string): value is Brand {
  return (BRANDS as readonly string[]).includes(value)
}
