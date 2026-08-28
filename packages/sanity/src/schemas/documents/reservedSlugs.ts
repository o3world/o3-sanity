/**
 * Slugs a collection document may not take, because the collection index owns
 * them as route segments (#370).
 *
 * `/insights/page/2` and `/insights/category/design` sit beside
 * `/insights/[slug]`, and Next matches a static segment before a dynamic one —
 * so an article slugged `page` would be unreachable, and `/insights/page`
 * would 404 rather than fall through to it. The URL space is the route's, and
 * this is where a document is told so.
 *
 * Studio validation stops a new one. It cannot stop a migration or an API
 * write, which is why `insightSlugs.test.ts` asserts the same thing over the
 * corpus that is already loaded.
 */
export const RESERVED_COLLECTION_SLUGS = ['page', 'category'] as const

export function isReservedCollectionSlug(slug: string | undefined): boolean {
  return RESERVED_COLLECTION_SLUGS.includes(slug as (typeof RESERVED_COLLECTION_SLUGS)[number])
}

/** The message an editor sees, naming every segment rather than the one they hit. */
export const RESERVED_SLUG_MESSAGE = `The collection index owns ${RESERVED_COLLECTION_SLUGS.map(
  (segment) => `"${segment}"`,
).join(' and ')} as URL segments — pick another slug.`
