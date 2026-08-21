import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { CATCH_ALL_TYPES, insight } from '@/content/documents'
import { buildCatchAllRoute, buildDetailRoute } from '@/lib/content-routes/build'
import { expectNotFound } from '@/test'

/**
 * A 404 is a cached page, so it has to stay invalidatable (#267).
 *
 * An unknown-slug probe renders once and is answered from the CDN from then
 * on — measured on production: one `MISS` with `cacheReason: cold`, then
 * `HIT` for every repeat, on all three routes a bot can reach. What makes
 * that safe rather than a trap is the tags: the read that came back empty
 * declares the same doc and type tags a successful read would, so publishing
 * the slug flushes the cached 404 and the next request renders the new
 * document.
 *
 * Nothing else pins this. `insight.render.test.tsx` asserts the tags on a
 * document that exists, and a builder that tagged only its hits would pass
 * every test in the suite while quietly stranding every slug that 404'd
 * before it was published.
 */

const NOT_FOUND_SLUG = 'no-such-slug'

describe('the read behind a 404', () => {
  it('tags a missing insight so publishing that slug flushes the cached 404', async () => {
    const calls = await expectNotFound(buildDetailRoute(insight), {
      data: null,
      params: { slug: NOT_FOUND_SLUG },
    })

    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.tags).toContain(`sanity:insight:${NOT_FOUND_SLUG}`)
      expect(call.tags).toContain('sanity:insight')
    }
  })

  it('tags a missing catch-all page the same way', async () => {
    const calls = await expectNotFound(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: null,
      params: { segments: [NOT_FOUND_SLUG] },
    })

    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.tags).toContain(`sanity:page:${NOT_FOUND_SLUG}`)
      expect(call.tags).toContain('sanity:page')
    }
  })

  it('tags a missing nested catch-all page under its joined slug', async () => {
    const calls = await expectNotFound(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: null,
      params: { segments: ['services', NOT_FOUND_SLUG] },
    })

    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.tags).toContain(`sanity:page:services/${NOT_FOUND_SLUG}`)
    }
  })
})
