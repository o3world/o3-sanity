import { describe, expect, it } from 'vitest'

import { PAGE_QUERY, SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import {
  buildCatchAllRoute,
  buildDetailRoute,
  buildIndexRoute,
  buildSingletonRoute,
} from '@o3/content-runtime/routes'

import { CATCH_ALL_TYPES, home, insight, insightIndex } from '@/content/documents'
import { expectNotFound, renderRoute, siteSettings } from '@/test'

/**
 * A route builder must keep "this document does not exist" and "the read
 * failed" apart (#100).
 *
 * They arrived at the same place once: a checkout with no
 * `SANITY_API_READ_TOKEN` pointed at the private `development` dataset, which
 * Content Lake answers with `200 {"result": null}` instead of a 401. `/` and
 * `/about` called `notFound()` on it and `/insights` rendered an empty
 * listing, so the only symptom of an unreadable dataset was a site that looked
 * like it had no content — which is why the report started at this file rather
 * than at the token. The token check now lives at the fetch
 * (`@o3/content-runtime/live`), and what these pin is the other half: a builder must
 * never dress a thrown fetch up as a 404, or the next such failure hides in
 * exactly the same place.
 */
const boom = new Error('the dataset said no')

/**
 * Fails the render fetch and only the render fetch.
 *
 * `renderRoute` runs `generateMetadata` first, and a resolver that throws at
 * every call never reaches `Page` — which is where `notFound()` actually
 * lives. So the reads `generateMetadata` makes are answered with a miss, which
 * it gives up on quietly, and everything after them throws.
 *
 * The count is a parameter because it is a property of the route under test:
 * three of the four builders read the document again for its metadata, and a
 * collection index reads nothing because its SEO is static on the entry.
 * Counting rather than reading the stega flag, because on a published request
 * every read is stega-free and the two are indistinguishable.
 */
function throwsAfterMetadata(metadataReads: number): (call: { query: string }) => unknown {
  let seen = 0
  return (call) => {
    if (call.query === SITE_SETTINGS_QUERY) return siteSettings()
    seen += 1
    if (seen <= metadataReads) return null
    throw boom
  }
}

describe('a fetch that throws', () => {
  it('surfaces from the singleton route as the error it is', async () => {
    await expect(
      renderRoute(buildSingletonRoute(home), { data: throwsAfterMetadata(1) }),
    ).rejects.toThrow(boom)
  })

  it('surfaces from the catch-all route as the error it is', async () => {
    await expect(
      renderRoute(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
        data: throwsAfterMetadata(1),
        params: { segments: ['about'] },
      }),
    ).rejects.toThrow(boom)
  })

  it('surfaces from the detail route as the error it is', async () => {
    await expect(
      renderRoute(buildDetailRoute(insight), {
        data: throwsAfterMetadata(1),
        params: { slug: 'anything' },
      }),
    ).rejects.toThrow(boom)
  })

  it('surfaces from a collection index rather than rendering an empty one', async () => {
    await expect(
      renderRoute(buildIndexRoute(insightIndex), { data: throwsAfterMetadata(0) }),
    ).rejects.toThrow(boom)
  })
})

describe('a document that genuinely is not there', () => {
  it('still 404s on the singleton route', async () => {
    await expectNotFound(buildSingletonRoute(home), { data: null })
  })

  it('still 404s on the catch-all route', async () => {
    await expectNotFound(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: null,
      params: { segments: ['no-such-page'] },
    })
  })

  it('still 404s on the detail route', async () => {
    await expectNotFound(buildDetailRoute(insight), { data: null, params: { slug: 'no-such-doc' } })
  })
})
