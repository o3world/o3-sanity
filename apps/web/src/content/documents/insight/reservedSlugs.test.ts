import { describe, expect, it } from 'vitest'

import { RESERVED_COLLECTION_SLUGS } from '@o3/sanity/schemas/reserved-slugs'

import { migratedInsightSlugs } from '../../../test/fixtures'

/**
 * The collection index owns `page` and `category` as URL segments (#370), and
 * Next matches a static segment before a dynamic one — so an article slugged
 * `page` would be unreachable at `/insights/page`.
 *
 * The schema's slug validation stops an editor typing one. It cannot stop a
 * migration load or an API write, and the corpus arrived by the first of those,
 * so the corpus is asserted here rather than trusted.
 */
describe('the migrated corpus stays out of the route’s own segments', () => {
  it('has no insight slugged after a segment the index owns', () => {
    const reserved = migratedInsightSlugs().filter((slug) =>
      (RESERVED_COLLECTION_SLUGS as readonly string[]).includes(slug),
    )
    expect(reserved, 'these articles are unreachable — the index owns the URL').toEqual([])
  })
})
