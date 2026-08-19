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
 * data-o3xo/converted/` — pages extracted from o3xo.ai (#220). None of them
 * carries an asset marker today (the heroes migrate without photographs); the
 * day one does, this reader needs `resolveAssetMarkers` from
 * `@o3/content-ui/testing` first — see `apps/web/src/test/fixtures.ts` for
 * the shape.
 */
const PAGES_DIR = join(
  fileURLToPath(new URL('../../../../', import.meta.url)),
  'tools/migration/data-o3xo/converted/page',
)

/**
 * A committed corpus page, shaped into what `PAGE_QUERY` returns.
 *
 * The route builders receive documents GROQ has already flattened; the
 * committed JSON is the un-projected form, so the same projections have to be
 * applied here — which `projectSeedPage` does, once, for both apps.
 *
 * That makes this the durable proof that the migrated corpus renders. The
 * dataset is disposable (ADR 0003), so "it looked right in the browser once"
 * is not a check that survives a rebuild.
 */
export function aCorpusPage(slug = 'index'): Record<string, unknown> {
  const file = join(PAGES_DIR, `${slug.replaceAll('/', '-')}.json`)
  const page = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  // No `resolve`: the only references a migrated page carries are the ones the
  // projection strips, and a resolver that answered null for a real one would
  // hide the fact.
  return projectSeedPage({ page, resolve: () => null })
}
