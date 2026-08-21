import { sanityFetch } from '@/sanity/live'

/**
 * The published slugs a `generateStaticParams` prerenders from (#266).
 *
 * `'use cache'` because `sanityFetch` calls `cacheTag()` and will not run
 * outside a cached function, and `perspective: 'published'` because a build
 * has no request to read a preview cookie from.
 *
 * **No fallback for a failed read.** Cache Components rejects a
 * `generateStaticParams` that returns nothing, so the old
 * `catch { return [] }` would turn an unreadable dataset into a build error
 * one step removed from its cause. Letting the fetch throw puts the message
 * — which names the missing token — where the failure is.
 */
export async function publishedSlugs(query: string): Promise<string[]> {
  'use cache'
  const { data } = await sanityFetch({ query, perspective: 'published', stega: false })
  return ((data ?? []) as Array<string | null>).filter(
    (slug): slug is string => typeof slug === 'string' && slug !== '',
  )
}
