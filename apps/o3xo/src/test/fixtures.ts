import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { projectSeedPage } from '@o3/content-ui/testing'

/**
 * This app's half of the `render` layer's fixtures: the ones that read
 * documents off disk. The invented, brand-neutral builders are
 * `@o3/render-kit`'s.
 *
 * What is on disk is this brand's migration corpus, `tools/migration/
 * data-o3xo/seed/` — the pipeline owns O3XO's committed documents, including
 * the bootstrap seed. Migrated documents carry `_wpSrc`/`_localSrc` asset
 * markers this reader does not resolve; a fixture over one of those needs
 * `resolveAssetMarkers` first (see `apps/web/src/test/fixtures.ts` for the
 * shape).
 */
const SEED_DIR = join(
  fileURLToPath(new URL('../../../../', import.meta.url)),
  'tools/migration/data-o3xo/seed',
)

/**
 * A committed bootstrap page, shaped into what `PAGE_QUERY` returns.
 *
 * The route builders receive documents GROQ has already flattened; the
 * committed JSON is the un-projected form, so the same projections have to be
 * applied here — which `projectSeedPage` does, once, for both apps.
 *
 * That makes this the durable proof that the seed renders. The dataset is
 * disposable (ADR 0003), so "it looked right in the browser once" is not a
 * check that survives a rebuild.
 */
export function aSeededPage(slug = 'index'): Record<string, unknown> {
  const page = JSON.parse(readFileSync(join(SEED_DIR, `page/${slug}.json`), 'utf8')) as Record<
    string,
    unknown
  >
  // No `resolve`: nothing in this app's seeds is a reference yet, and a
  // resolver that answered null for one would hide the fact.
  return projectSeedPage({ page, resolve: () => null })
}
