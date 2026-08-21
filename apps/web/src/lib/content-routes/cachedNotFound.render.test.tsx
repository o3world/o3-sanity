import { describe, expect, it } from 'vitest'

import { INSIGHT_QUERY, PAGE_QUERY } from '@o3/sanity/queries'

import { CATCH_ALL_TYPES, insight } from '@/content/documents'
import { buildCatchAllRoute, buildDetailRoute } from '@/lib/content-routes/build'
import { expectNotFound } from '@/test'
import type { FetchCall } from '@/test/stubs/sanity-live'

/**
 * A 404 is a cached page, so its read has to stay tagged (#267).
 *
 * An unknown slug renders once and is answered from the CDN after that. What
 * keeps that from stranding content is the tags: the read that came back
 * empty declares the same doc and type tags a successful read would, so a
 * publish flushes the cached 404 and the next request renders the new
 * document.
 *
 * Nothing else pins it. `insight.render.test.tsx` asserts the tags on a
 * document that exists, and tags are computed from the slug and handed to
 * `readContent` before the result is known — so a builder that moved tagging
 * after the fetch would keep every hit tagged, lose every miss, and pass the
 * rest of the suite.
 */

const NOT_FOUND_SLUG = 'no-such-slug'

/** The reads for one query, the same way `readMode.render.test.tsx` picks them. */
function reads(calls: readonly FetchCall[], query: string): readonly FetchCall[] {
  return calls.filter((call) => call.query === query)
}

describe('the read behind a 404', () => {
  it('tags a missing insight so publishing that slug flushes the cached 404', async () => {
    const calls = await expectNotFound(buildDetailRoute(insight), {
      data: null,
      params: { slug: NOT_FOUND_SLUG },
    })

    const misses = reads(calls, INSIGHT_QUERY)
    expect(misses.length).toBeGreaterThan(0)
    for (const call of misses) {
      expect(call.tags).toContain(`sanity:insight:${NOT_FOUND_SLUG}`)
      expect(call.tags).toContain('sanity:insight')
    }
  })

  it('tags a missing catch-all page the same way', async () => {
    const calls = await expectNotFound(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: null,
      params: { segments: [NOT_FOUND_SLUG] },
    })

    const misses = reads(calls, PAGE_QUERY)
    expect(misses.length).toBeGreaterThan(0)
    for (const call of misses) {
      expect(call.tags).toContain(`sanity:page:${NOT_FOUND_SLUG}`)
      expect(call.tags).toContain('sanity:page')
    }
  })

  it('joins a nested slug the same way the writer does', async () => {
    // `/api/revalidate` builds the doc tag from `slug.current`, which stores a
    // multi-segment page as `services/ux-audit`. The reader has to arrive at
    // the same string from the segment array or the two never meet.
    const calls = await expectNotFound(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: null,
      params: { segments: ['services', NOT_FOUND_SLUG] },
    })

    const misses = reads(calls, PAGE_QUERY)
    expect(misses.length).toBeGreaterThan(0)
    for (const call of misses) {
      expect(call.tags).toContain(`sanity:page:services/${NOT_FOUND_SLUG}`)
      expect(call.tags).toContain('sanity:page')
    }
  })
})
